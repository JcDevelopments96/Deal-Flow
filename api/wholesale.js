/**
 * /api/wholesale — wholesaling lead-gen + outreach (PREMIUM FEATURE).
 *
 * Single serverless function routing multiple actions to stay under the
 * Vercel Hobby 12-function cap:
 *
 *   POST   /api/wholesale?action=search       { zip, filters }   → ATTOM search
 *   POST   /api/wholesale?action=skiptrace    { leadId }         → BatchSkipTracing
 *   GET    /api/wholesale?action=leads                           → list user's saved
 *   POST   /api/wholesale?action=save         { property }       → save as lead
 *   PATCH  /api/wholesale?action=update&id=   { updates }        → update status/notes
 *   DELETE /api/wholesale?action=delete&id=                      → delete
 *   POST   /api/wholesale?action=email        { leadId, subject, body } → Resend
 *
 * Paid tiers only (starter/pro/scale). Free users get 403 upgrade_required.
 *
 * Upstream providers:
 *   - ATTOM Data     — property + owner records. Pay-per-call (~$0.05)
 *   - BatchSkipTracing — phone/email skip trace. Pay-per-call (~$0.15)
 *   - Resend         — transactional email. Free tier 3k/mo
 */
import { handler, ApiError } from "./_lib/errors.js";
import { requireUserId } from "./_lib/auth.js";
import { adminDb, ensureUser } from "./_lib/db.js";
import { planFor } from "./_lib/plans.js";

const TABLE = "wholesale_leads";
const OUTREACH_TABLE = "wholesale_outreach";

const PAID_PLANS = new Set(["starter", "pro", "scale"]);

function parseBody(req) {
  return req.body && typeof req.body === "object"
    ? req.body
    : (typeof req.body === "string" ? JSON.parse(req.body || "{}") : {});
}

function requirePaidPlan(user) {
  const plan = planFor(user.plan);
  if (!PAID_PLANS.has(plan.key)) {
    throw new ApiError(403, "upgrade_required",
      "Wholesaling is a paid feature — available on Starter, Pro, and Scale.");
  }
}

/* ── Google Maps photo URLs (street view + satellite) ─────────────────── */
// The raw URLs with the API key are sent to the client. The key MUST be
// referrer-restricted in Google Cloud Console — otherwise it's scrape-able.

function resolveLocation({ address, city, state, zip, latitude, longitude }) {
  if (Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))) {
    return `${latitude},${longitude}`;
  }
  const loc = [address, city, state, zip].filter(Boolean).join(", ");
  return loc || null;
}

function streetViewUrl(lead) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const loc = resolveLocation(lead);
  if (!loc) return null;
  const qs = new URLSearchParams({ size: "400x260", key, fov: "80", pitch: "0", location: loc });
  return `https://maps.googleapis.com/maps/api/streetview?${qs.toString()}`;
}

function satelliteUrl(lead) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const loc = resolveLocation(lead);
  if (!loc) return null;
  // zoom=19 is tight enough to see roof + yard, wide enough to read the lot.
  // A red marker anchors the property inside the frame.
  const qs = new URLSearchParams({
    size: "400x260", key, zoom: "19", maptype: "satellite",
    center: loc, markers: `color:red|${loc}`
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${qs.toString()}`;
}

/* ── Heuristic lead scoring (0-100) ──────────────────────────────────── */
function computeLeadScore({ years_owned, is_absentee, is_tax_delinquent, assessed_value, market_value }) {
  let score = 0;
  if (is_tax_delinquent) score += 35;
  if (years_owned >= 20) score += 25;
  else if (years_owned >= 15) score += 15;
  else if (years_owned >= 10) score += 8;
  if (is_absentee) score += 20;
  // Equity proxy: assessed < market suggests under-appraisal / quick flip potential
  if (assessed_value && market_value && market_value > assessed_value * 1.3) score += 10;
  if (years_owned >= 30) score += 10; // extra nudge for estate-sale candidates
  return Math.min(100, score);
}

/* ── Google Geocoding (city+state → lat/lng) ─────────────────────────── */
// ATTOM's /property/snapshot does NOT accept city+state as query params —
// it wants either postalcode or latitude+longitude+radius. So when the
// user searches by city, we geocode first via Google, then hand ATTOM a
// 5-mile radius centered on the city.
async function geocodeCityState(city, state) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new ApiError(503, "geocoding_not_configured",
    "City-level search requires GOOGLE_MAPS_API_KEY — set it in Vercel env or search by ZIP.");
  const qs = new URLSearchParams({ address: `${city}, ${state}, USA`, key });
  const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${qs.toString()}`);
  if (!res.ok) throw new ApiError(502, "geocoding_failed", `Google ${res.status}`);
  const json = await res.json();
  if (json.status !== "OK" || !json.results?.[0]) {
    throw new ApiError(400, "city_not_found",
      `Couldn't find "${city}, ${state}". Double-check spelling or search by ZIP.`);
  }
  const loc = json.results[0].geometry?.location;
  if (!loc) throw new ApiError(502, "geocoding_failed", "no location in geocoder response");
  return { lat: loc.lat, lng: loc.lng };
}

/* ── ATTOM Data property search ───────────────────────────────────────── */
async function handleSearch(body, user) {
  const apiKey = process.env.ATTOM_API_KEY;
  if (!apiKey) throw new ApiError(503, "attom_not_configured",
    "Set ATTOM_API_KEY in Vercel env (sign up at api.developer.attomdata.com).");

  const { zip, city, state, minYearsOwned, absenteeOnly, taxDelinquentOnly, limit = 25 } = body || {};

  const hasZip = zip && /^\d{5}$/.test(String(zip));
  const hasCityState = city && state && /^[A-Z]{2}$/.test(String(state).toUpperCase());
  if (!hasZip && !hasCityState) {
    throw new ApiError(400, "missing_location",
      "Provide either a 5-digit ZIP, or both a city and a 2-letter state code.");
  }

  const headers = { "apikey": apiKey, accept: "application/json" };
  const pagesize = Math.min(100, Number(limit) || 25);

  // Build the ATTOM location query string. ZIP is a direct pass-through;
  // city+state goes through a Google geocode → lat/lng + 5-mile radius.
  let locationQs;
  if (hasZip) {
    locationQs = `postalcode=${encodeURIComponent(zip)}`;
  } else {
    const { lat, lng } = await geocodeCityState(city, String(state).toUpperCase());
    locationQs = `latitude=${lat}&longitude=${lng}&radius=5`;
  }

  // Fan out three parallel calls:
  //   1. /property/snapshot     — base property + owner + sale + assessment
  //   2. /foreclosure/snapshot  — pre-foreclosure list (tax / mortgage default)
  //   3. /preforeclosure/snapshot — alternative NOD/NOS events (some regions)
  // Cross-reference by property_id so we can flag tax-delinquent properties.
  const [snapshotRes, foreclosureRes, preforeRes] = await Promise.all([
    fetch(`https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/snapshot?${locationQs}&pagesize=${pagesize}`, { headers }),
    fetch(`https://api.gateway.attomdata.com/propertyapi/v1.0.0/foreclosure/snapshot?${locationQs}&pagesize=${pagesize}`, { headers }).catch(() => null),
    fetch(`https://api.gateway.attomdata.com/propertyapi/v1.0.0/preforeclosure/snapshot?${locationQs}&pagesize=${pagesize}`, { headers }).catch(() => null)
  ]);

  if (!snapshotRes.ok) {
    const t = await snapshotRes.text().catch(() => "");
    throw new ApiError(502, "attom_error", `ATTOM ${snapshotRes.status}: ${t.slice(0, 300)}`);
  }
  const data = await snapshotRes.json();
  const properties = Array.isArray(data?.property) ? data.property : [];

  // Build a Set of ATTOM IDs that appear in either foreclosure feed. Many
  // accounts don't have access to these endpoints, which returns non-ok —
  // in that case we silently degrade (no tax-delinquent flag, rest works).
  const distressedIds = new Set();
  for (const r of [foreclosureRes, preforeRes]) {
    if (!r || !r.ok) continue;
    const j = await r.json().catch(() => null);
    for (const p of (j?.property || [])) {
      const id = p.identifier?.attomId?.toString() || p.identifier?.Id?.toString();
      if (id) distressedIds.add(id);
    }
  }

  const now = new Date();
  const leads = properties.map(p => {
    const addr = p.address || {};
    const sale = p.sale || {};
    const owner = p.owner || {};
    const assessment = p.assessment || {};
    const building = p.building || {};
    const loc = p.location || {};
    const summary = p.summary || {};
    const lead_attom_id = p.identifier?.attomId?.toString() || p.identifier?.Id?.toString() || null;

    // Derive years_owned from saletransdate
    const saleDate = sale.saleTransDate || sale.salesearchdate || sale.saleTranDate;
    const years_owned = saleDate
      ? Math.floor((now - new Date(saleDate)) / (365.25 * 86400000))
      : null;

    // Owner address differs from property address → absentee
    const ownerMail = owner.mailingAddress || owner.mailingaddress || {};
    const propAddr1 = (addr.line1 || addr.line || "").toLowerCase().trim();
    const ownerAddr1 = (ownerMail.line1 || ownerMail.line || "").toLowerCase().trim();
    const is_absentee = ownerAddr1 && propAddr1 && ownerAddr1 !== propAddr1;

    const assessed_value = Number(assessment.assessed?.assdttlvalue) || null;
    const market_value = Number(assessment.market?.mktttlvalue) || null;

    const is_long_time_owner = years_owned != null && years_owned >= (minYearsOwned || 20);

    const lead = {
      attom_id: lead_attom_id,
      address: addr.line1 || addr.line || "",
      city: addr.locality || null,
      state: addr.countrySubd || addr.state || null,
      zip: addr.postal1 || addr.postal || null,
      county: addr.country === "US" ? (p.area?.countrysecsubd || null) : null,
      latitude: Number(loc.latitude) || null,
      longitude: Number(loc.longitude) || null,
      property_type: summary.propclass || summary.proptype || null,
      bedrooms: Number(building.rooms?.beds) || null,
      bathrooms: Number(building.rooms?.bathstotal) || null,
      sqft: Number(building.size?.livingsize) || Number(building.size?.universalsize) || null,
      year_built: Number(summary.yearbuilt) || null,
      assessed_value,
      market_value,
      last_sale_date: saleDate ? String(saleDate).slice(0, 10) : null,
      last_sale_price: Number(sale.amount?.saleamt) || null,
      years_owned,
      owner_name: [owner.owner1?.lastname, owner.owner1?.firstname].filter(Boolean).join(", ") || null,
      owner_mailing_address: ownerMail.line1 || ownerMail.line || null,
      owner_mailing_city: ownerMail.locality || null,
      owner_mailing_state: ownerMail.countrySubd || null,
      owner_mailing_zip: ownerMail.postal1 || null,
      is_absentee: !!is_absentee,
      is_long_time_owner,
      is_tax_delinquent: lead_attom_id ? distressedIds.has(lead_attom_id) : false,
      lead_score: 0
    };
    lead.lead_score = computeLeadScore(lead);
    lead.streetview_url = streetViewUrl(lead);
    lead.satellite_url = satelliteUrl(lead);
    return lead;
  });

  // Server-side filters
  let filtered = leads;
  if (absenteeOnly) filtered = filtered.filter(l => l.is_absentee);
  if (taxDelinquentOnly) filtered = filtered.filter(l => l.is_tax_delinquent);
  if (minYearsOwned) filtered = filtered.filter(l => l.years_owned != null && l.years_owned >= minYearsOwned);

  // Sort by lead_score desc so the best hits surface first
  filtered.sort((a, b) => b.lead_score - a.lead_score);

  return { results: filtered, total: properties.length, filtered: filtered.length, user_id: user.id };
}

/* ── BatchSkipTracing (user's OWN key — BYOK) ─────────────────────────── */
async function handleSkipTrace({ leadId }, user) {
  // User pays their own BatchData bill — we never store a master key.
  const apiKey = user.batchskip_api_key;
  if (!apiKey) throw new ApiError(400, "byok_required",
    "Add your BatchData API key in Wholesale → Integrations first (sign up at batchdata.com; typically ~$0.15/trace).");
  if (!leadId) throw new ApiError(400, "missing_lead_id");

  const db = adminDb();
  const { data: lead, error: lErr } = await db
    .from(TABLE).select("*").eq("id", leadId).eq("user_id", user.id).single();
  if (lErr) throw new ApiError(404, "lead_not_found", lErr.message);

  const body = {
    requests: [{
      name: { first: (lead.owner_name || "").split(",")[1]?.trim() || "",
              last:  (lead.owner_name || "").split(",")[0]?.trim() || "" },
      propertyAddress: {
        street: lead.address, city: lead.city, state: lead.state, zip: lead.zip
      },
      mailingAddress: lead.owner_mailing_address ? {
        street: lead.owner_mailing_address, city: lead.owner_mailing_city,
        state: lead.owner_mailing_state, zip: lead.owner_mailing_zip
      } : undefined
    }]
  };
  const res = await fetch("https://api.batchdata.com/api/v1/property/skip-trace", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new ApiError(502, "batchskip_error", `BatchSkipTracing ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  const match = data?.results?.persons?.[0] || data?.results?.matches?.[0] || data?.persons?.[0];

  const phone = match?.phoneNumbers?.[0]?.number || match?.phones?.[0]?.number || null;
  const email = match?.emails?.[0]?.email || match?.emails?.[0] || null;

  const { data: updated, error: uErr } = await db
    .from(TABLE)
    .update({ owner_phone: phone, owner_email: email, skip_traced_at: new Date().toISOString() })
    .eq("id", leadId).eq("user_id", user.id)
    .select().single();
  if (uErr) throw new ApiError(500, "db_update_failed", uErr.message);

  return { lead: { ...updated, streetview_url: streetViewUrl(updated), satellite_url: satelliteUrl(updated) }, phoneFound: !!phone, emailFound: !!email };
}

/* ── CRUD ─────────────────────────────────────────────────────────────── */
async function handleList(user) {
  const db = adminDb();
  const { data, error } = await db
    .from(TABLE)
    .select("*")
    .eq("user_id", user.id)
    .order("lead_score", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new ApiError(500, "db_read_failed", error.message);
  // Attach a fresh Street View URL per lead — stored nowhere since the
  // Google key shouldn't be persisted in user-readable columns.
  const leads = (data || []).map(l => ({ ...l, streetview_url: streetViewUrl(l), satellite_url: satelliteUrl(l) }));
  return { leads };
}

async function handleSave({ property }, user) {
  if (!property || !property.address) throw new ApiError(400, "missing_property");
  const db = adminDb();
  const row = { ...property, user_id: user.id, raw_data: property.raw_data || null };
  delete row.id; // let Postgres generate
  delete row.created_at;
  delete row.updated_at;
  const { data, error } = await db
    .from(TABLE)
    .upsert(row, { onConflict: "user_id,address,zip" })
    .select().single();
  if (error) throw new ApiError(500, "db_insert_failed", error.message);
  return { lead: { ...data, streetview_url: streetViewUrl(data), satellite_url: satelliteUrl(data) } };
}

async function handleUpdate(id, { updates }, user) {
  if (!id) throw new ApiError(400, "missing_id");
  const db = adminDb();
  const allowed = ["status", "notes", "owner_phone", "owner_email"];
  const sanitized = {};
  for (const k of allowed) if (updates[k] !== undefined) sanitized[k] = updates[k];
  sanitized.updated_at = new Date().toISOString();
  const { data, error } = await db
    .from(TABLE).update(sanitized)
    .eq("id", id).eq("user_id", user.id)
    .select().single();
  if (error) throw new ApiError(500, "db_update_failed", error.message);
  if (!data) throw new ApiError(404, "not_found");
  return { lead: { ...data, streetview_url: streetViewUrl(data), satellite_url: satelliteUrl(data) } };
}

async function handleDelete(id, user) {
  if (!id) throw new ApiError(400, "missing_id");
  const db = adminDb();
  const { error } = await db
    .from(TABLE).delete()
    .eq("id", id).eq("user_id", user.id);
  if (error) throw new ApiError(500, "db_delete_failed", error.message);
  return { removed: true };
}

/* ── Outreach email via Resend ────────────────────────────────────────── */
async function handleEmail({ leadId, subject, body }, user) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) throw new ApiError(503, "resend_not_configured",
    "Set RESEND_API_KEY + RESEND_FROM_EMAIL in Vercel env (free at resend.com).");
  if (!leadId || !subject || !body) throw new ApiError(400, "missing_fields");

  const db = adminDb();
  const { data: lead, error: lErr } = await db
    .from(TABLE).select("*").eq("id", leadId).eq("user_id", user.id).single();
  if (lErr) throw new ApiError(404, "lead_not_found");
  if (!lead.owner_email) throw new ApiError(400, "no_email",
    "This lead has no email yet — run a skip trace first.");

  // CAN-SPAM compliance: footer with physical address + unsubscribe hint
  const footerText = `\n\n---\nSent by ${user.email || "a DealTrack user"} via DealTrack. Reply STOP or do not respond to opt out.`;
  const textBody = body + footerText;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [lead.owner_email],
      reply_to: user.email || undefined,
      subject,
      text: textBody
    })
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new ApiError(502, "resend_error", `Resend ${resp.status}: ${t.slice(0, 300)}`);
  }
  const emailData = await resp.json();

  // Log the outreach + bump lead status
  await db.from(OUTREACH_TABLE).insert({
    user_id: user.id, lead_id: leadId,
    channel: "email", subject, body: textBody,
    status: "sent", external_id: emailData?.id || null
  });
  await db.from(TABLE).update({ status: "contacted", updated_at: new Date().toISOString() })
    .eq("id", leadId).eq("user_id", user.id);

  return { ok: true, resendId: emailData?.id || null };
}

/* ── Lob direct-mail postcards (BYOK — user pays Lob directly) ────────── */
async function handlePostcard({ leadId, message }, user) {
  const apiKey = user.lob_api_key;
  if (!apiKey) throw new ApiError(400, "byok_required",
    "Add your Lob API key in Wholesale → Integrations first (sign up at lob.com; postcards are ~$0.69 each).");
  if (!user.return_address?.street) throw new ApiError(400, "return_address_missing",
    "Set your return address in Wholesale → Integrations first.");
  if (!leadId || !message) throw new ApiError(400, "missing_fields", "leadId + message required");

  const db = adminDb();
  const { data: lead, error: lErr } = await db
    .from(TABLE).select("*").eq("id", leadId).eq("user_id", user.id).single();
  if (lErr) throw new ApiError(404, "lead_not_found");

  const toAddress = {
    name: lead.owner_name || "Resident",
    address_line1: lead.owner_mailing_address || lead.address,
    address_city:  lead.owner_mailing_city  || lead.city,
    address_state: lead.owner_mailing_state || lead.state,
    address_zip:   lead.owner_mailing_zip   || lead.zip
  };
  if (!toAddress.address_line1 || !toAddress.address_zip) {
    throw new ApiError(400, "bad_destination", "Lead is missing a usable mailing address.");
  }

  const from = user.return_address || {};

  // Lob uses HTTP Basic auth: username=API_KEY, password blank
  const auth = "Basic " + Buffer.from(apiKey + ":").toString("base64");

  const form = new URLSearchParams();
  form.set("description", `DealTrack wholesale outreach ${new Date().toISOString()}`);
  form.set("to[name]",          toAddress.name);
  form.set("to[address_line1]", toAddress.address_line1);
  form.set("to[address_city]",  toAddress.address_city || "");
  form.set("to[address_state]", toAddress.address_state || "");
  form.set("to[address_zip]",   toAddress.address_zip);
  form.set("to[address_country]", "US");
  form.set("from[name]",          from.name || "");
  form.set("from[address_line1]", from.street || "");
  form.set("from[address_city]",  from.city || "");
  form.set("from[address_state]", from.state || "");
  form.set("from[address_zip]",   from.zip || "");
  form.set("from[address_country]", "US");
  // 4x6 template: front & back as HTML strings Lob renders. Default branded-template.
  form.set("front", `<html><body style="margin:0;padding:0;font-family:Helvetica,Arial,sans-serif;width:6in;height:4in;background:#0F172A;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;"><h1 style="font-size:36pt;margin:0">Interested in your home?</h1><p style="font-size:14pt;margin-top:14pt;">I may have a cash offer for you.</p></body></html>`);
  form.set("back", `<html><body style="margin:0.25in;font-family:Helvetica,Arial,sans-serif;font-size:10pt;line-height:1.4;white-space:pre-wrap;">${message.replace(/</g, "&lt;")}</body></html>`);
  form.set("size", "4x6");

  const res = await fetch("https://api.lob.com/v1/postcards", {
    method: "POST",
    headers: {
      "Authorization": auth,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    body: form.toString()
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(502, "lob_error",
      body?.error?.message || `Lob ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  }

  await db.from(OUTREACH_TABLE).insert({
    user_id: user.id, lead_id: leadId, channel: "mail",
    subject: "DealTrack postcard", body: message,
    status: body.tracking_number ? "sent" : "created",
    external_id: body.id || null
  });
  await db.from(TABLE).update({ status: "contacted", updated_at: new Date().toISOString() })
    .eq("id", leadId).eq("user_id", user.id);

  return {
    ok: true, lobId: body.id,
    expectedDeliveryDate: body.expected_delivery_date || null,
    trackingUrl: body.url || null
  };
}

/* ── Save / update BYOK integration keys ──────────────────────────────── */
// Accepts any subset of { batchskip_api_key, lob_api_key, return_address }.
// Returns only a "connected" map so keys never leak back to the client.
async function handleSaveIntegration({ updates }, user) {
  if (!updates || typeof updates !== "object") throw new ApiError(400, "missing_updates");
  const allowed = {};
  if (updates.batchskip_api_key !== undefined) allowed.batchskip_api_key = updates.batchskip_api_key ? String(updates.batchskip_api_key).trim() : null;
  if (updates.lob_api_key !== undefined)       allowed.lob_api_key       = updates.lob_api_key ? String(updates.lob_api_key).trim() : null;
  if (updates.return_address !== undefined)    allowed.return_address    = updates.return_address || null;
  if (Object.keys(allowed).length === 0) throw new ApiError(400, "nothing_to_update");
  allowed.updated_at = new Date().toISOString();

  const db = adminDb();
  const { data, error } = await db
    .from("users").update(allowed)
    .eq("id", user.id)
    .select("batchskip_api_key, lob_api_key, return_address").single();
  if (error) throw new ApiError(500, "db_update_failed", error.message);
  return {
    connected: {
      batchskip: !!data.batchskip_api_key,
      lob: !!data.lob_api_key
    },
    return_address: data.return_address || null
  };
}

// GET-style version — what's connected (without leaking the keys)
async function handleIntegrationStatus(user) {
  return {
    connected: {
      batchskip: !!user.batchskip_api_key,
      lob: !!user.lob_api_key
    },
    return_address: user.return_address || null
  };
}

/* ── Router ───────────────────────────────────────────────────────────── */
export default handler(async (req, res) => {
  const { clerkUserId, email } = await requireUserId(req);
  const user = await ensureUser({ clerkUserId, email });
  requirePaidPlan(user);

  const action = (req.query?.action || "").toString();
  const id = req.query?.id ? String(req.query.id) : null;
  const body = parseBody(req);

  let payload;
  switch (action) {
    case "search":
      if (req.method !== "POST") throw new ApiError(405, "method_not_allowed");
      payload = await handleSearch(body, user);
      break;
    case "skiptrace":
      if (req.method !== "POST") throw new ApiError(405, "method_not_allowed");
      payload = await handleSkipTrace(body, user);
      break;
    case "leads":
      if (req.method !== "GET") throw new ApiError(405, "method_not_allowed");
      payload = await handleList(user);
      break;
    case "save":
      if (req.method !== "POST") throw new ApiError(405, "method_not_allowed");
      payload = await handleSave(body, user);
      break;
    case "update":
      if (req.method !== "PATCH") throw new ApiError(405, "method_not_allowed");
      payload = await handleUpdate(id, body, user);
      break;
    case "delete":
      if (req.method !== "DELETE") throw new ApiError(405, "method_not_allowed");
      payload = await handleDelete(id, user);
      break;
    case "email":
      if (req.method !== "POST") throw new ApiError(405, "method_not_allowed");
      payload = await handleEmail(body, user);
      break;
    case "postcard":
      if (req.method !== "POST") throw new ApiError(405, "method_not_allowed");
      payload = await handlePostcard(body, user);
      break;
    case "integrations":
      if (req.method === "GET") payload = await handleIntegrationStatus(user);
      else if (req.method === "POST") payload = await handleSaveIntegration(body, user);
      else throw new ApiError(405, "method_not_allowed");
      break;
    default:
      throw new ApiError(400, "unknown_action",
        "action must be one of: search, skiptrace, leads, save, update, delete, email, postcard, integrations");
  }

  return res.status(200).json(payload);
});
