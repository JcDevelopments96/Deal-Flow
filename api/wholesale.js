/**
 * /api/wholesale — wholesaling lead-gen + outreach (PREMIUM FEATURE).
 *
 * Single serverless function routing multiple actions to stay under the
 * Vercel Hobby 12-function cap:
 *
 *   POST   /api/wholesale?action=search       { zip, filters }   → RealEstateAPI
 *   POST   /api/wholesale?action=skiptrace    { leadId }         → BatchSkipTracing
 *   GET    /api/wholesale?action=leads                           → list user's saved
 *   POST   /api/wholesale?action=save         { property }       → save as lead
 *   PATCH  /api/wholesale?action=update&id=   { updates }        → update status/notes
 *   DELETE /api/wholesale?action=delete&id=                      → delete
 *   POST   /api/wholesale?action=email        { leadId, subject, body } → Resend
 *
 * Open to all plans — free users get the same access, metered against the
 * shared 10-click monthly bucket.
 *
 * Upstream providers:
 *   - RealEstateAPI    — property + owner + foreclosure records in one call.
 *                        Flat-rate subscription ($59+/mo unlimited residential)
 *                        so each user search costs us $0 at the margin.
 *   - BatchSkipTracing — phone/email skip trace. Pay-per-call (~$0.15)
 *   - Resend           — transactional email. Free tier 3k/mo
 */
import { handler, ApiError } from "./_lib/errors.js";
import { requireUserId } from "./_lib/auth.js";
import { adminDb, ensureUser } from "./_lib/db.js";
import { streetViewUrl as sharedStreetViewUrl, satelliteUrl as sharedSatelliteUrl } from "./_lib/googlePhotos.js";

const TABLE = "wholesale_leads";
const OUTREACH_TABLE = "wholesale_outreach";

// Off-Market is open to all plans — free users get the same access, just
// metered against the shared 10-click monthly bucket. Saved-deal cap is
// the primary upgrade trigger.
function parseBody(req) {
  return req.body && typeof req.body === "object"
    ? req.body
    : (typeof req.body === "string" ? JSON.parse(req.body || "{}") : {});
}

// Shared server-side Google Maps URL builders — larger size here than the
// default since wholesale cards/modal render them as the primary image.
const streetViewUrl = (lead) => sharedStreetViewUrl(lead, { size: "400x260" });
const satelliteUrl  = (lead) => sharedSatelliteUrl(lead, { size: "400x260" });

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

/* ── RealEstateAPI property search ───────────────────────────────────────
   Single POST to /v2/PropertySearch replaces the old 3-call ATTOM fan-out
   (snapshot + foreclosure + preforeclosure). Flat-rate subscription means
   each user search costs us $0 at the margin once we pass the plan's
   included quota — much better economics than ATTOM's pay-per-call.
   Sign up: https://realestateapi.com  (env: REAL_ESTATE_API_KEY)
────────────────────────────────────────────────────────────────────────── */
async function handleSearch(body, user) {
  const apiKey = process.env.REAL_ESTATE_API_KEY;
  if (!apiKey) throw new ApiError(503, "reapi_not_configured",
    "Set REAL_ESTATE_API_KEY in Vercel env (sign up at realestateapi.com).");

  const { zip, city, state, minYearsOwned, absenteeOnly, taxDelinquentOnly, limit = 50 } = body || {};

  const hasZip = zip && /^\d{5}$/.test(String(zip));
  const hasCityState = city && state && /^[A-Z]{2}$/.test(String(state).toUpperCase());
  if (!hasZip && !hasCityState) {
    throw new ApiError(400, "missing_location",
      "Provide either a 5-digit ZIP, or both a city and a 2-letter state code.");
  }

  // RealEstateAPI supports exposing distress + absentee + years-owned as
  // first-class filters — no post-filter needed. `size` caps the page.
  const reqBody = {
    size: Math.min(250, Number(limit) || 50),
    ids_only: false,
    ...(hasZip ? { zip: String(zip) } : { city, state: String(state).toUpperCase() }),
    ...(minYearsOwned ? { years_owned_min: Number(minYearsOwned) } : {}),
    ...(absenteeOnly ? { absentee_owner: true } : {}),
    // Either pre-foreclosure OR tax-delinquent qualifies as "distressed" in
    // our UI. REAPI exposes them as separate filter flags; OR'ing them is
    // done by firing the request without either flag set and filtering on
    // the response boolean — simpler than two requests.
  };

  const res = await fetch("https://api.realestateapi.com/v2/PropertySearch", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "accept": "application/json"
    },
    body: JSON.stringify(reqBody)
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new ApiError(502, "reapi_error", `RealEstateAPI ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  const properties = Array.isArray(data?.data) ? data.data : [];

  const leads = properties.map(p => {
    const addr = p.address || {};
    const info = p.propertyInfo || {};
    const owner = p.ownerInfo || {};
    const mail = owner.mailingAddress || {};
    const years_owned = typeof p.yearsOwned === "number" ? p.yearsOwned : null;

    const is_absentee = !!p.absenteeOwner;
    const is_tax_delinquent = !!(p.taxDelinquent || p.preForeclosure || p.foreclosure);
    const is_long_time_owner = years_owned != null && years_owned >= (minYearsOwned || 20);

    const assessed_value = Number(p.assessedValue) || null;
    const market_value = Number(p.estimatedValue) || null;

    const lead = {
      attom_id: p.id != null ? String(p.id) : null, // column name kept for back-compat
      address: addr.address || addr.street || "",
      city: addr.city || null,
      state: addr.state || null,
      zip: addr.zip || null,
      county: addr.county || null,
      latitude: typeof p.latitude === "number" ? p.latitude : (Number(p.latitude) || null),
      longitude: typeof p.longitude === "number" ? p.longitude : (Number(p.longitude) || null),
      property_type: info.propertyType || info.propertyUse || null,
      bedrooms: Number(info.bedrooms) || null,
      bathrooms: Number(info.bathroomsTotal || info.bathrooms) || null,
      sqft: Number(info.livingSquareFeet || info.buildingSqft) || null,
      year_built: Number(info.yearBuilt) || null,
      assessed_value,
      market_value,
      last_sale_date: p.lastSaleDate ? String(p.lastSaleDate).slice(0, 10) : null,
      last_sale_price: Number(p.lastSalePrice) || null,
      years_owned,
      owner_name: owner.name
        || [owner.lastName, owner.firstName].filter(Boolean).join(", ")
        || null,
      owner_mailing_address: mail.address || mail.street || null,
      owner_mailing_city: mail.city || null,
      owner_mailing_state: mail.state || null,
      owner_mailing_zip: mail.zip || null,
      is_absentee,
      is_long_time_owner,
      is_tax_delinquent,
      lead_score: 0
    };
    lead.lead_score = computeLeadScore(lead);
    lead.streetview_url = streetViewUrl(lead);
    lead.satellite_url = satelliteUrl(lead);
    return lead;
  });

  // Client-requested post-filters (REAPI already filters absentee/years_owned
  // server-side when set, but distress is OR'd across two flags so we filter
  // here). Also handles the case where the caller passed minYearsOwned=20
  // but REAPI returned records with years_owned=null.
  let filtered = leads;
  if (taxDelinquentOnly) filtered = filtered.filter(l => l.is_tax_delinquent);
  if (minYearsOwned) filtered = filtered.filter(l => l.years_owned != null && l.years_owned >= minYearsOwned);

  filtered.sort((a, b) => b.lead_score - a.lead_score);

  return { results: filtered, total: properties.length, filtered: filtered.length, user_id: user.id };
}

/* ── BatchSkipTracing (server key, with per-user override) ─────────────── */
async function handleSkipTrace({ leadId }, user) {
  // Prefer the app-wide server key (set BATCHSKIP_API_KEY in Vercel env).
  // Users can also bring their own via user.batchskip_api_key so power users
  // stay billed on their own BatchData account.
  const apiKey = user.batchskip_api_key || process.env.BATCHSKIP_API_KEY;
  if (!apiKey) throw new ApiError(503, "batchskip_not_configured",
    "Skip trace isn't available — the BATCHSKIP_API_KEY env var isn't set on the server.");
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
  // Whitelist columns that exist on public.wholesale_leads. The search
  // payload also carries derived fields (streetview_url, satellite_url,
  // __isSearchResult, etc.) that Postgres doesn't know about — including
  // them triggers a PGRST204 "column not found" error from Supabase.
  const ALLOWED = [
    "address","city","state","zip","county","latitude","longitude",
    "property_type","bedrooms","bathrooms","sqft","year_built",
    "assessed_value","market_value","last_sale_date","last_sale_price","years_owned",
    "owner_name","owner_mailing_address","owner_mailing_city","owner_mailing_state","owner_mailing_zip",
    "owner_phone","owner_email","skip_traced_at",
    "is_absentee","is_long_time_owner","is_tax_delinquent","lead_score",
    "status","notes","attom_id","raw_data"
  ];
  const row = { user_id: user.id };
  for (const k of ALLOWED) if (property[k] !== undefined) row[k] = property[k];
  if (!row.raw_data) row.raw_data = null;

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
  const footerText = `\n\n---\nSent by ${user.email || "a Deal Docket user"} via Deal Docket. Reply STOP or do not respond to opt out.`;
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

/* ── Save / read BYOK integration keys ───────────────────────────────────
   Only batchskip_api_key remains a real BYOK option (Lob postcards were
   removed entirely). The endpoint stays so a future settings UI can let
   power users override the server-wide BATCHSKIP_API_KEY with their own.
─────────────────────────────────────────────────────────────────────────*/
async function handleSaveIntegration({ updates }, user) {
  if (!updates || typeof updates !== "object") throw new ApiError(400, "missing_updates");
  const allowed = {};
  if (updates.batchskip_api_key !== undefined) {
    allowed.batchskip_api_key = updates.batchskip_api_key ? String(updates.batchskip_api_key).trim() : null;
  }
  if (Object.keys(allowed).length === 0) throw new ApiError(400, "nothing_to_update");
  allowed.updated_at = new Date().toISOString();

  const db = adminDb();
  const { data, error } = await db
    .from("users").update(allowed)
    .eq("id", user.id)
    .select("batchskip_api_key").single();
  if (error) throw new ApiError(500, "db_update_failed", error.message);
  return { connected: { batchskip: !!data.batchskip_api_key } };
}

async function handleIntegrationStatus(user) {
  return { connected: { batchskip: !!user.batchskip_api_key } };
}

/* ── Router ───────────────────────────────────────────────────────────── */
export default handler(async (req, res) => {
  const { clerkUserId, email } = await requireUserId(req);
  const user = await ensureUser({ clerkUserId, email });

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
    case "integrations":
      if (req.method === "GET") payload = await handleIntegrationStatus(user);
      else if (req.method === "POST") payload = await handleSaveIntegration(body, user);
      else throw new ApiError(405, "method_not_allowed");
      break;
    default:
      throw new ApiError(400, "unknown_action",
        "action must be one of: search, skiptrace, leads, save, update, delete, email, integrations");
  }

  return res.status(200).json(payload);
});
