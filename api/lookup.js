/**
 * GET /api/lookup?source={census|fmr|unemployment|mortgage}[&args…]
 *
 * Consolidated read-only lookup router. Combines six small free-data
 * endpoints into one serverless function so we stay under the Vercel
 * Hobby plan's 12-function limit. Each branch has its own in-memory cache
 * + external fetch; auth is required but none are metered.
 *
 *   ?source=census   &stateFips=12&countyFips=086   → Census ACS demographics
 *   ?source=fmr      &stateFips=12&countyFips=086   → HUD Fair Market Rents
 *   ?source=unemployment &stateFips=12&countyFips=086 → BLS unemployment rate
 *   ?source=mortgage                                 → FRED 30yr mortgage rate
 */
import { handler, ApiError } from "./_lib/errors.js";
import { requireUserId } from "./_lib/auth.js";
import { ensureUser, adminDb } from "./_lib/db.js";
import { currentPeriod } from "./_lib/periods.js";
import { STATE_CODE_BY_FIPS } from "./_lib/stateFips.js";

// Free-tier monthly cap for the Find Local Pros search. Paid plans
// (starter/pro/scale) are unlimited because each search is cheap (~$0.02)
// and gating heavy usage there would punish power users.
const FINDPROS_FREE_LIMIT = 5;

// Per-source caches. TTLs tuned per how often upstream data actually changes.
const _censusCache = new Map();     // 24h
const _fmrCache = new Map();        // 30d
const _fmrCountyListCache = new Map(); // 7d
const _unempCache = new Map();      // 12h
let   _mortgageCache = null;        // 12h

const CENSUS_TTL = 24 * 60 * 60 * 1000;
const FMR_TTL = 30 * 24 * 60 * 60 * 1000;
const FMR_COUNTY_LIST_TTL = 7 * 24 * 60 * 60 * 1000;
const UNEMP_TTL = 12 * 60 * 60 * 1000;
const MORTGAGE_TTL = 12 * 60 * 60 * 1000;

const ACS_YEAR = "2022";
const CENSUS_VARS = {
  population: "B01003_001E", medianIncome: "B19013_001E",
  medianHomeValue: "B25077_001E", medianGrossRent: "B25064_001E",
  ownerOccupied: "B25003_002E", renterOccupied: "B25003_003E"
};

/* ── CENSUS ────────────────────────────────────────────────────────── */
async function handleCensus(stateFips, countyFips) {
  if (!/^\d{2}$/.test(stateFips) || !/^\d{3}$/.test(countyFips)) {
    throw new ApiError(400, "bad_fips", "stateFips must be 2 digits and countyFips must be 3 digits.");
  }
  const cacheKey = `${stateFips}:${countyFips}`;
  const cached = _censusCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CENSUS_TTL) return { ...cached.payload, cached: true };

  const apiKey = process.env.CENSUS_API_KEY;
  if (!apiKey) throw new ApiError(503, "census_not_configured",
    "Set CENSUS_API_KEY (free at https://api.census.gov/data/key_signup.html)");

  const varList = Object.values(CENSUS_VARS).join(",");
  const url = `https://api.census.gov/data/${ACS_YEAR}/acs/acs5`
    + `?get=${varList}&for=county:${countyFips}&in=state:${stateFips}&key=${apiKey}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new ApiError(502, "upstream_error", `Census ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  if (!Array.isArray(data) || data.length < 2) throw new ApiError(502, "census_empty", "No data for that county");
  const [headers, values] = data;
  const row = Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  const toNum = (raw) => { const n = Number(raw); return Number.isFinite(n) && n >= 0 ? n : null; };
  const ownerOccupied = toNum(row[CENSUS_VARS.ownerOccupied]);
  const renterOccupied = toNum(row[CENSUS_VARS.renterOccupied]);
  const totalOccupied = (ownerOccupied || 0) + (renterOccupied || 0);
  const payload = {
    population: toNum(row[CENSUS_VARS.population]),
    medianIncome: toNum(row[CENSUS_VARS.medianIncome]),
    medianHomeValue: toNum(row[CENSUS_VARS.medianHomeValue]),
    medianGrossRent: toNum(row[CENSUS_VARS.medianGrossRent]),
    ownerOccupied, renterOccupied,
    renterSharePct: totalOccupied > 0 ? +((renterOccupied / totalOccupied) * 100).toFixed(1) : null,
    asOf: `acs5 ${ACS_YEAR}`
  };
  _censusCache.set(cacheKey, { at: Date.now(), payload });
  return { ...payload, cached: false };
}

/* ── HUD FAIR MARKET RENTS ────────────────────────────────────────── */
async function listStateCounties(stateCode, token) {
  const cached = _fmrCountyListCache.get(stateCode);
  if (cached && Date.now() - cached.at < FMR_COUNTY_LIST_TTL) return cached.counties;
  const res = await fetch(
    `https://www.huduser.gov/hudapi/public/fmr/listCounties/${stateCode}`,
    { headers: { Authorization: `Bearer ${token}`, accept: "application/json" } }
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new ApiError(502, "hud_county_list_failed", `HUD ${res.status}: ${t.slice(0, 200)}`);
  }
  const rows = await res.json();
  const counties = (Array.isArray(rows) ? rows : [])
    .map(r => ({
      entityId: r.fips_code,
      name: r.county_name || r.town_name,
      countyFips: typeof r.fips_code === "string" ? r.fips_code.slice(4, 7) : null
    }))
    .filter(c => c.entityId && c.countyFips);
  _fmrCountyListCache.set(stateCode, { at: Date.now(), counties });
  return counties;
}
async function handleFmr(stateFips, countyFips) {
  const stateCode = STATE_CODE_BY_FIPS[String(stateFips)];
  if (!stateCode) throw new ApiError(400, "bad_state_fips", `Unknown state FIPS ${stateFips}`);
  const token = process.env.HUD_API_TOKEN;
  if (!token) throw new ApiError(503, "hud_not_configured",
    "Set HUD_API_TOKEN (free at https://www.huduser.gov/hudapi/public/register)");

  const cacheKey = `${stateFips}:${countyFips}`;
  const cached = _fmrCache.get(cacheKey);
  if (cached && Date.now() - cached.at < FMR_TTL) return { ...cached.payload, cached: true };

  const counties = await listStateCounties(stateCode, token);
  const match = counties.find(c => c.countyFips === String(countyFips).padStart(3, "0"));
  if (!match) throw new ApiError(404, "county_not_found",
    `No HUD entry for state=${stateCode} countyFips=${countyFips}`);

  const year = new Date().getFullYear();
  const res = await fetch(
    `https://www.huduser.gov/hudapi/public/fmr/data/${match.entityId}?year=${year}`,
    { headers: { Authorization: `Bearer ${token}`, accept: "application/json" } }
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new ApiError(502, "hud_fmr_failed", `HUD ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const basic = data?.data?.basicdata;
  const row = (Array.isArray(basic) ? basic[0] : basic) || {};
  const payload = {
    year: String(data?.data?.year || year),
    countyName: match.name,
    fmr: {
      studio: Number(row.Efficiency ?? row.efficiency) || null,
      one:    Number(row["One-Bedroom"] ?? row.one_bedroom) || null,
      two:    Number(row["Two-Bedroom"] ?? row.two_bedroom) || null,
      three:  Number(row["Three-Bedroom"] ?? row.three_bedroom) || null,
      four:   Number(row["Four-Bedroom"] ?? row.four_bedroom) || null
    },
    smallAreaFmr: !!data?.data?.smallareafmrs
  };
  _fmrCache.set(cacheKey, { at: Date.now(), payload });
  return { ...payload, cached: false };
}

/* ── BLS UNEMPLOYMENT ──────────────────────────────────────────────── */
async function handleUnemployment(stateFips, countyFips) {
  const sf = String(stateFips).padStart(2, "0");
  const cf = String(countyFips).padStart(3, "0");
  const seriesId = `LAUCN${sf}${cf}0000000003`;
  const cached = _unempCache.get(seriesId);
  if (cached && Date.now() - cached.at < UNEMP_TTL) return { ...cached.payload, cached: true };

  const currentYear = new Date().getFullYear();
  const body = {
    seriesid: [seriesId],
    startyear: String(currentYear - 1),
    endyear: String(currentYear),
    ...(process.env.BLS_API_KEY ? { registrationkey: process.env.BLS_API_KEY } : {})
  };
  const res = await fetch("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new ApiError(502, "bls_error", `BLS ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  if (data.status !== "REQUEST_SUCCEEDED") {
    throw new ApiError(502, "bls_error", data.message?.join("; ") || "BLS request failed");
  }
  const observations = data.Results?.series?.[0]?.data || [];
  if (observations.length === 0) throw new ApiError(404, "no_data", `No BLS data for ${seriesId}`);
  const monthly = observations.filter(o => o.period !== "M13");
  const latest = monthly[0];
  const yearAgo = monthly.find(o => o.period === latest.period && Number(o.year) === Number(latest.year) - 1);
  const rate = Number(latest.value);
  const yearAgoRate = yearAgo ? Number(yearAgo.value) : null;
  const payload = {
    rate,
    yearAgoRate,
    deltaPct: yearAgoRate != null ? +(rate - yearAgoRate).toFixed(1) : null,
    periodLabel: `${latest.periodName} ${latest.year}`,
    seriesId
  };
  _unempCache.set(seriesId, { at: Date.now(), payload });
  return { ...payload, cached: false };
}

/* ── FRED MORTGAGE RATE ────────────────────────────────────────────── */
async function handleMortgage() {
  if (_mortgageCache && Date.now() - _mortgageCache.at < MORTGAGE_TTL) {
    return { ..._mortgageCache.payload, cached: true };
  }
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) throw new ApiError(503, "fred_not_configured",
    "Set FRED_API_KEY (free at https://fred.stlouisfed.org/docs/api/api_key.html)");

  const url = `https://api.stlouisfed.org/fred/series/observations`
    + `?series_id=MORTGAGE30US&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new ApiError(502, "upstream_error", `FRED ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const obs = data?.observations?.[0];
  if (!obs) throw new ApiError(502, "fred_empty", "No observations returned");
  const rate = Number(obs.value);
  if (!Number.isFinite(rate)) throw new ApiError(502, "fred_bad_value", obs.value);
  const payload = { rate, asOf: obs.date, series: "MORTGAGE30US" };
  _mortgageCache = { at: Date.now(), payload };
  return { ...payload, cached: false };
}

/* ── FEMA FLOOD ZONES (no API key required) ────────────────────────── */
const FLOOD_TTL = 24 * 60 * 60 * 1000;
const _floodCache = new Map();
const HIGH_RISK = new Set(["A", "AE", "AH", "AO", "AR", "A99", "V", "VE"]);
const MODERATE_RISK = new Set(["B"]);
const LOW_RISK = new Set(["C", "X"]);

function classifyFlood(zone) {
  if (!zone) return { riskLevel: "unknown", guidance: "Flood zone not mapped or outside NFHL coverage." };
  const base = zone.toUpperCase().split(" ")[0];
  if (HIGH_RISK.has(base)) return {
    riskLevel: "high",
    guidance: "Special Flood Hazard Area — mandatory flood insurance with a federally-backed mortgage. Budget $1,500–$5,000+/yr for NFIP policy depending on elevation."
  };
  if (MODERATE_RISK.has(base)) return { riskLevel: "moderate", guidance: "Moderate flood risk. Flood insurance optional but recommended; typically $500–$1,000/yr." };
  if (LOW_RISK.has(base))      return { riskLevel: "low", guidance: "Minimal flood risk. Preferred Risk Policy available (~$400/yr) if desired." };
  return { riskLevel: "unknown", guidance: `Zone ${zone} — check FEMA map for details.` };
}

async function handleFlood(lat, lng) {
  const key = `${lat.toFixed(4)}:${lng.toFixed(4)}`;
  const cached = _floodCache.get(key);
  if (cached && Date.now() - cached.at < FLOOD_TTL) return { ...cached.payload, cached: true };

  const geometry = encodeURIComponent(JSON.stringify({ x: lng, y: lat, spatialReference: { wkid: 4326 }}));
  // FEMA renamed the public NFHL endpoint path from /gis/nfhl/rest/services
  // to /arcgis/rest/services in 2026 — the old path now 404s silently.
  const url = `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query`
    + `?geometry=${geometry}&geometryType=esriGeometryPoint&inSR=4326`
    + `&spatialRel=esriSpatialRelIntersects&outFields=FLD_ZONE,ZONE_SUBTY,SFHA_TF`
    + `&returnGeometry=false&f=json`;
  const res = await fetch(url);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new ApiError(502, "fema_error", `FEMA ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const feature = Array.isArray(data?.features) ? data.features[0] : null;
  const attrs = feature?.attributes || {};
  const zone = attrs.FLD_ZONE || null;
  const sfha = attrs.SFHA_TF === "T";
  const { riskLevel, guidance } = classifyFlood(zone);
  const payload = { zone, sfha, zoneSubtype: attrs.ZONE_SUBTY || null, riskLevel, insuranceGuidance: guidance };
  _floodCache.set(key, { at: Date.now(), payload });
  return { ...payload, cached: false };
}

/* ── WALK SCORE ────────────────────────────────────────────────────── */
const WALK_TTL = 7 * 24 * 60 * 60 * 1000;
const _walkCache = new Map();

async function handleWalkscore(lat, lng, address) {
  const key = process.env.WALKSCORE_API_KEY;
  if (!key) throw new ApiError(503, "walkscore_not_configured",
    "Set WALKSCORE_API_KEY (free 5k/day at walkscore.com/professional/api-sign-up.php)");

  const cacheKey = `${lat.toFixed(4)}:${lng.toFixed(4)}`;
  const cached = _walkCache.get(cacheKey);
  if (cached && Date.now() - cached.at < WALK_TTL) return { ...cached.payload, cached: true };

  const qs = new URLSearchParams({
    format: "json", address: address || "",
    lat: String(lat), lon: String(lng),
    wsapikey: key, transit: "1", bike: "1"
  });
  const res = await fetch(`https://api.walkscore.com/score?${qs.toString()}`);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new ApiError(502, "walkscore_error", `Walk Score ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  if (data.status !== 1) throw new ApiError(502, "walkscore_error",
    `Walk Score status=${data.status}${data.updated ? ` (${data.updated})` : ""}`);
  const payload = {
    walkScore: data.walkscore != null ? Number(data.walkscore) : null,
    walkDescription: data.description || null,
    bikeScore: data.bike?.score != null ? Number(data.bike.score) : null,
    bikeDescription: data.bike?.description || null,
    transitScore: data.transit?.score != null ? Number(data.transit.score) : null,
    transitDescription: data.transit?.description || null,
    detailsUrl: data.ws_link || null,
    logoUrl: data.logo_url || null
  };
  _walkCache.set(cacheKey, { at: Date.now(), payload });
  return { ...payload, cached: false };
}

/* ── Google Maps static photo URLs for a given lat/lng ───────────────── */
function handlePhotos(lat, lng, address) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new ApiError(503, "google_maps_not_configured",
    "Set GOOGLE_MAPS_API_KEY in Vercel env.");
  const loc = `${lat},${lng}`;
  const streetQs = new URLSearchParams({
    size: "640x400", key, fov: "80", pitch: "0", location: loc
  });
  const satelliteQs = new URLSearchParams({
    size: "640x400", key, zoom: "19", maptype: "satellite",
    center: loc, markers: `color:red|${loc}`
  });
  return {
    streetview_url: `https://maps.googleapis.com/maps/api/streetview?${streetQs.toString()}`,
    satellite_url: `https://maps.googleapis.com/maps/api/staticmap?${satelliteQs.toString()}`,
    address: address || null,
    cached: false
  };
}

/* ── Google Places Nearby (schools + amenities) ──────────────────────── */
const NEARBY_TTL = 7 * 24 * 60 * 60 * 1000;
const _nearbyCache = new Map();

async function placesNearby(lat, lng, type, key, radius = 1609) {
  const qs = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: String(radius),
    type,
    key
  });
  const res = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${qs.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") return [];
  return Array.isArray(data.results) ? data.results : [];
}

async function handleNearby(lat, lng) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new ApiError(503, "google_maps_not_configured",
    "Set GOOGLE_MAPS_API_KEY in Vercel env.");

  const cacheKey = `${lat.toFixed(4)}:${lng.toFixed(4)}`;
  const cached = _nearbyCache.get(cacheKey);
  if (cached && Date.now() - cached.at < NEARBY_TTL) {
    return { ...cached.payload, cached: true };
  }

  // Fire 4 parallel Places Nearby calls — one per category we care about.
  // Schools get their own call so we can surface a top-3 list with ratings;
  // amenities only need counts for the neighborhood-score proxy.
  const [schools, groceries, parks, restaurants] = await Promise.all([
    placesNearby(lat, lng, "school", key),
    placesNearby(lat, lng, "grocery_or_supermarket", key),
    placesNearby(lat, lng, "park", key),
    placesNearby(lat, lng, "restaurant", key)
  ]);

  // Top 3 schools by rating (when rated), else by proximity (Google's default order)
  const schoolsTop = [...schools]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3)
    .map(s => ({
      name: s.name,
      rating: typeof s.rating === "number" ? +s.rating.toFixed(1) : null,
      ratingCount: s.user_ratings_total || 0,
      vicinity: s.vicinity || null
    }));

  const payload = {
    schools: schoolsTop,
    amenityCounts: {
      schools: schools.length,
      groceries: groceries.length,
      parks: parks.length,
      restaurants: restaurants.length
    },
    radiusMiles: 1.0
  };
  _nearbyCache.set(cacheKey, { at: Date.now(), payload });
  return { ...payload, cached: false };
}

/* ── FIND LOCAL PROS (Google Places Text Search) ────────────────────── */
// One Text Search call per (category, ZIP) — returns the top ~10 businesses
// matching the natural-language query "<category> near <zip>". Cached 12h
// because contractor lists don't churn quickly. Powers the Team tab's
// "Find Local Pros" panel — single shared GOOGLE_MAPS_API_KEY, no extra
// vendor required.
const _findprosCache = new Map();
const FINDPROS_TTL = 12 * 60 * 60 * 1000;

// Each category maps to (a) a Google Places query string, (b) a Yelp
// `categories` filter (Yelp's category aliases), (c) the team_contacts.role
// enum value the user can save the result under.
const PRO_CATEGORIES = {
  lender:      { query: "hard money lender",            yelp: "mortgagebrokers,financialservices", role: "lender" },
  contractor:  { query: "general contractor",           yelp: "contractors",                       role: "contractor" },
  plumber:     { query: "plumber",                       yelp: "plumbing",                          role: "contractor" },
  electrician: { query: "electrician",                   yelp: "electricians",                      role: "contractor" },
  roofer:      { query: "roofing contractor",            yelp: "roofing",                           role: "contractor" },
  hvac:        { query: "HVAC contractor",               yelp: "hvac",                              role: "contractor" },
  cleaner:     { query: "house cleaning",                yelp: "homecleaning",                      role: "other" },
  pm:          { query: "property management company",   yelp: "propertymgmt",                      role: "property_manager" },
  title:       { query: "title insurance company",       yelp: "real_estate_services",              role: "title" },
  agent:       { query: "real estate agent",             yelp: "realestateagents",                  role: "agent" },
  inspector:   { query: "home inspector",                yelp: "homeinspectors",                    role: "inspector" },
  insurance:   { query: "homeowners insurance agent",    yelp: "insurance",                         role: "insurance" },
  attorney:    { query: "real estate attorney",          yelp: "lawyers",                           role: "attorney" }
};

// ZIP-centroid cache so the Yelp call has a (lat,lng) — Yelp's location
// param accepts ZIPs natively, but keeping the centroid helps us measure
// "near" later if needed.
async function fetchYelpForCategory(yelpCat, zip) {
  const key = process.env.YELP_API_KEY;
  if (!key) return [];
  const qs = new URLSearchParams({
    location: zip,
    categories: yelpCat,
    radius: "16093",   // 10mi in meters (Yelp max is 40k)
    sort_by: "rating",
    limit: "10"
  });
  try {
    const res = await fetch(`https://api.yelp.com/v3/businesses/search?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${key}`, accept: "application/json" }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.businesses) ? data.businesses : [];
  } catch { return []; }
}

// Loose name dedupe — strip punctuation + trailing LLC/Inc/Corp/etc and lowercase.
function nameKey(name) {
  return String(name || "").toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\b(llc|inc|incorporated|corp|company|co|ltd|llp|pllc)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function handleFindPros(category, zip, user) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new ApiError(503, "google_maps_not_configured",
    "Set GOOGLE_MAPS_API_KEY in Vercel env.");
  const cat = PRO_CATEGORIES[category];
  if (!cat) throw new ApiError(400, "bad_category",
    `category must be one of: ${Object.keys(PRO_CATEGORIES).join(", ")}`);
  if (!/^\d{5}$/.test(String(zip))) throw new ApiError(400, "bad_zip", "5-digit zip required");

  // ── Free-tier quota: 5 Find Local Pros searches per period ──────────
  // Paid plans bypass entirely. Period boundaries match the rest of the
  // metering stack (Stripe billing period if subscribed, else calendar
  // month). Counts only NEW searches — cache hits below this point don't
  // burn quota, since they don't hit Google/Yelp.
  const isFree = !user.plan || user.plan === "free";
  let usage = { used: 0, limit: null }; // null = unlimited (paid plans)
  if (isFree) {
    const db = adminDb();
    const { data: sub } = await db.from("subscriptions")
      .select("status, current_period_start, current_period_end")
      .eq("user_id", user.id).maybeSingle();
    const period = currentPeriod(sub);
    const { count } = await db.from("usage_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("kind", "findpros_search")
      .gte("created_at", period.start.toISOString());
    const used = count || 0;
    if (used >= FINDPROS_FREE_LIMIT) {
      throw new ApiError(402, "quota_exceeded", {
        feature: "findpros",
        plan: "free",
        used,
        limit: FINDPROS_FREE_LIMIT,
        upgradeRequired: true,
        message: `You've used all ${FINDPROS_FREE_LIMIT} free Find Local Pros searches this period. Upgrade to Starter or higher for unlimited.`
      });
    }
    usage = { used, limit: FINDPROS_FREE_LIMIT };
  }

  const cacheKey = `${category}:${zip}`;
  const cached = _findprosCache.get(cacheKey);
  if (cached && Date.now() - cached.at < FINDPROS_TTL) {
    return { ...cached.payload, cached: true, usage };
  }

  // Fan out Google Places + Yelp Fusion in parallel. Yelp may return
  // empty (no key configured, or the category alias didn't match) — that's
  // fine, we still always get Google results.
  const googleQs = new URLSearchParams({
    query: `${cat.query} near ${zip}`,
    key,
    fields: "name,place_id,formatted_address,formatted_phone_number,rating,user_ratings_total,website"
  });
  const [googleRes, yelpBusinesses] = await Promise.all([
    fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${googleQs.toString()}`),
    fetchYelpForCategory(cat.yelp, zip)
  ]);

  if (!googleRes.ok) throw new ApiError(502, "places_error", `Google ${googleRes.status}`);
  const googleJson = await googleRes.json();
  if (googleJson.status !== "OK" && googleJson.status !== "ZERO_RESULTS") {
    throw new ApiError(502, "places_error", googleJson.error_message || googleJson.status);
  }

  // Normalize Google results
  const googleResults = (Array.isArray(googleJson.results) ? googleJson.results : [])
    .slice(0, 10)
    .map(r => ({
      placeId: r.place_id,
      name: r.name,
      address: r.formatted_address || r.vicinity || null,
      phone: r.formatted_phone_number || null,
      rating: typeof r.rating === "number" ? +r.rating.toFixed(1) : null,
      ratingCount: r.user_ratings_total || 0,
      website: r.website || null,
      mapsUrl: `https://www.google.com/maps/place/?q=place_id:${r.place_id}`,
      role: cat.role,
      sources: ["google"]
    }));

  // Index Google results by name-key for dedupe with Yelp
  const byKey = new Map();
  for (const r of googleResults) byKey.set(nameKey(r.name), r);

  // Merge in Yelp — when names match, layer Yelp's review count + url onto
  // the Google entry; mark sources=["google","yelp"]. Otherwise add the
  // Yelp result as a new entry with sources=["yelp"].
  for (const y of yelpBusinesses) {
    const k = nameKey(y.name);
    if (!k) continue;
    const existing = byKey.get(k);
    if (existing) {
      // Prefer the higher review count source for the rating
      const yelpReviews = y.review_count || 0;
      if (yelpReviews > (existing.ratingCount || 0)) {
        existing.rating = typeof y.rating === "number" ? +y.rating.toFixed(1) : existing.rating;
        existing.ratingCount = yelpReviews;
      }
      if (!existing.phone && y.phone) existing.phone = y.display_phone || y.phone;
      if (!existing.website && y.url) existing.website = y.url;
      existing.yelpUrl = y.url || null;
      existing.yelpId = y.id;        // tracked separately so the reviews modal can fetch from both sources
      existing.sources = Array.from(new Set([...(existing.sources || []), "yelp"]));
    } else {
      byKey.set(k, {
        placeId: `yelp:${y.id}`,
        yelpId: y.id,
        name: y.name,
        address: y.location?.display_address?.join(", ") || null,
        phone: y.display_phone || y.phone || null,
        rating: typeof y.rating === "number" ? +y.rating.toFixed(1) : null,
        ratingCount: y.review_count || 0,
        website: y.url || null,
        yelpUrl: y.url || null,
        mapsUrl: y.location?.address1
          ? `https://www.google.com/maps/search/${encodeURIComponent(y.name + " " + y.location.address1)}`
          : null,
        role: cat.role,
        sources: ["yelp"]
      });
    }
  }

  // Lender results get an NMLS verify link — points at a site-search of
  // nmlsconsumeraccess.org so the user can confirm the license in 1 click.
  const merged = Array.from(byKey.values()).map(r => {
    if (cat.role === "lender") {
      r.nmlsVerifyUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:nmlsconsumeraccess.org "${r.name}"`)}`;
    }
    return r;
  });

  // Sort by review count (signal of activity), then by rating
  merged.sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0) || (b.rating || 0) - (a.rating || 0));
  const results = merged.slice(0, 12);

  const payload = {
    category, zip: String(zip), results,
    yelpAvailable: !!process.env.YELP_API_KEY
  };
  _findprosCache.set(cacheKey, { at: Date.now(), payload });

  // Log the search so the next invocation's quota check sees it. Fire-
  // and-forget — a logging blip shouldn't fail an otherwise-good request.
  adminDb().from("usage_events").insert({
    user_id: user.id,
    kind: "findpros_search",
    provider: "google_places",
    endpoint: "/v1/findpros",
    cost_cents: 0,
    metadata: { category, zip: String(zip) }
  }).then(() => {}).catch(() => {});

  return {
    ...payload,
    cached: false,
    usage: isFree ? { used: usage.used + 1, limit: FINDPROS_FREE_LIMIT } : { used: 0, limit: null }
  };
}

/* ── PRO REVIEWS (Google Place Details + Yelp Reviews) ───────────────── */
// Fetches actual review text for a single business — fans out to whichever
// sources are available (Google Place Details, Yelp v3/businesses/{id}/reviews)
// and merges into one chronological list. Cached 24h since reviews change
// slowly. Powers the "View reviews" modal in the Find Local Pros panel.
const _proReviewsCache = new Map();
const PRO_REVIEWS_TTL = 24 * 60 * 60 * 1000;

async function fetchGoogleReviews(placeId, key) {
  if (!placeId || placeId.startsWith("yelp:") || !key) return [];
  const qs = new URLSearchParams({
    place_id: placeId,
    fields: "reviews,rating,user_ratings_total",
    key
  });
  try {
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${qs.toString()}`);
    if (!res.ok) return [];
    const json = await res.json();
    const reviews = json?.result?.reviews || [];
    return reviews.map(r => ({
      source: "google",
      author: r.author_name || "Anonymous",
      authorPhoto: r.profile_photo_url || null,
      rating: typeof r.rating === "number" ? r.rating : null,
      relativeTime: r.relative_time_description || null,
      time: r.time ? r.time * 1000 : null, // Google returns unix seconds
      text: r.text || ""
    }));
  } catch { return []; }
}

async function fetchYelpReviews(yelpId, key) {
  if (!yelpId || !key) return [];
  try {
    const res = await fetch(`https://api.yelp.com/v3/businesses/${encodeURIComponent(yelpId)}/reviews`, {
      headers: { Authorization: `Bearer ${key}`, accept: "application/json" }
    });
    if (!res.ok) return [];
    const json = await res.json();
    const reviews = json?.reviews || [];
    return reviews.map(r => ({
      source: "yelp",
      author: r.user?.name || "Anonymous",
      authorPhoto: r.user?.image_url || null,
      rating: typeof r.rating === "number" ? r.rating : null,
      relativeTime: null,
      time: r.time_created ? new Date(r.time_created).getTime() : null,
      text: r.text || "",
      url: r.url || null
    }));
  } catch { return []; }
}

async function handleProReviews(placeId, yelpId) {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  const yelpKey   = process.env.YELP_API_KEY;
  if (!placeId && !yelpId) {
    throw new ApiError(400, "missing_params", "placeId or yelpId required");
  }

  const cacheKey = `${placeId || "-"}|${yelpId || "-"}`;
  const cached = _proReviewsCache.get(cacheKey);
  if (cached && Date.now() - cached.at < PRO_REVIEWS_TTL) {
    return { ...cached.payload, cached: true };
  }

  const [googleReviews, yelpReviews] = await Promise.all([
    fetchGoogleReviews(placeId, googleKey),
    fetchYelpReviews(yelpId, yelpKey)
  ]);

  // Merge then sort newest-first so the freshest signal is on top
  const all = [...googleReviews, ...yelpReviews]
    .sort((a, b) => (b.time || 0) - (a.time || 0));

  const payload = {
    reviews: all,
    sources: {
      google: googleReviews.length,
      yelp: yelpReviews.length
    }
  };
  _proReviewsCache.set(cacheKey, { at: Date.now(), payload });
  return { ...payload, cached: false };
}

/* ── SHORT-TERM RENTAL POTENTIAL (Rabbu) ─────────────────────────────────
   Hits Rabbu's public estimate API to project Airbnb/VRBO performance for
   a given property. Returns annual revenue, average occupancy, average
   daily rate, and a per-month seasonal breakdown. Cached 7d server-side
   because STR estimates don't move daily.

   Note: Rabbu's API is publicly accessible but undocumented — they use it
   to power their own landing-page calculator. We assume a stable response
   shape and degrade gracefully (return null) if the upstream changes.
─────────────────────────────────────────────────────────────────────────*/
const _strCache = new Map();
const STR_TTL = 7 * 24 * 60 * 60 * 1000;

async function handleStr(address, lat, lng) {
  if (!address) throw new ApiError(400, "missing_params", "address required (lat/lng optional)");
  const cacheKey = `${address}|${lat || ""}|${lng || ""}`;
  const cached = _strCache.get(cacheKey);
  if (cached && Date.now() - cached.at < STR_TTL) {
    return { ...cached.payload, cached: true };
  }

  // Rabbu's API is undocumented — they use an internal endpoint to power
  // their landing-page calculator. The request shape isn't public so we
  // try the most plausible endpoint patterns in sequence, log what each
  // returns, and surface the first usable response. The console output
  // appears in Vercel function logs so we can tune the right endpoint
  // without redeploying blindly.
  const candidates = [
    {
      url: "https://api.rabbu.com/api/v1/property_searches",
      method: "POST",
      body: JSON.stringify({
        address,
        ...(Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
          ? { latitude: Number(lat), longitude: Number(lng) } : {})
      })
    },
    {
      url: "https://api.rabbu.com/v1/property_searches",
      method: "POST",
      body: JSON.stringify({ address })
    },
    {
      url: `https://api.rabbu.com/properties?address=${encodeURIComponent(address)}`,
      method: "GET",
      body: null
    }
  ];

  let body = null;
  let lastStatus = null;
  for (const c of candidates) {
    try {
      const res = await fetch(c.url, {
        method: c.method,
        headers: {
          "Content-Type": "application/json",
          "accept": "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; DealTrack)"
        },
        ...(c.body ? { body: c.body } : {})
      });
      lastStatus = res.status;
      console.log(`[str] ${c.method} ${c.url} → ${res.status}`);
      if (!res.ok) continue;
      const json = await res.json().catch(() => null);
      if (json) {
        console.log(`[str] response keys: ${Object.keys(json || {}).join(",")}`);
        body = json;
        break;
      }
    } catch (err) {
      console.log(`[str] ${c.method} ${c.url} failed: ${err.message}`);
    }
  }

  // Rabbu's public response has historically nested estimates under .data
  // .estimates with monthly_revenue / monthly_occupancy / adr / revenue
  // fields. Guard every access so a schema drift produces a clean
  // "estimate not available" instead of a 500.
  const est = body?.data?.estimates || body?.estimates || body?.estimate || null;
  if (!est) {
    const payload = { available: false };
    _strCache.set(cacheKey, { at: Date.now(), payload });
    return { ...payload, cached: false };
  }

  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  // Normalize monthly array — Rabbu uses different keys across docs/UI
  const rawMonthly = Array.isArray(est.monthly) ? est.monthly
    : Array.isArray(est.monthly_estimates) ? est.monthly_estimates
    : Array.isArray(est.months) ? est.months
    : [];

  const monthly = rawMonthly.map((m, i) => ({
    month: num(m.month) ?? (i + 1),
    revenue: num(m.revenue) ?? num(m.monthly_revenue),
    occupancy: num(m.occupancy) ?? num(m.occupancy_rate),
    adr: num(m.adr) ?? num(m.daily_rate) ?? num(m.average_daily_rate)
  })).filter(m => m.month >= 1 && m.month <= 12);

  // ADR range across months (low season → high season)
  const adrs = monthly.map(m => m.adr).filter(v => typeof v === "number" && v > 0);
  const adrLow  = adrs.length ? Math.min(...adrs) : num(est.adr) ?? num(est.daily_rate);
  const adrHigh = adrs.length ? Math.max(...adrs) : num(est.adr) ?? num(est.daily_rate);

  const payload = {
    available: true,
    revenue:   num(est.revenue) ?? num(est.annual_revenue),
    occupancy: num(est.occupancy) ?? num(est.occupancy_rate),
    adr:       num(est.adr) ?? num(est.daily_rate) ?? num(est.average_daily_rate),
    adrLow,
    adrHigh,
    monthly,
    source: "rabbu"
  };
  _strCache.set(cacheKey, { at: Date.now(), payload });
  return { ...payload, cached: false };
}

/* ── Router ────────────────────────────────────────────────────────── */
export default handler(async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const { clerkUserId, email } = await requireUserId(req);

  const source = (req.query?.source || "").toString();
  const { stateFips, countyFips, lat, lng, address, category, zip, placeId, yelpId } = req.query || {};

  // Only findpros needs the full user record (plan + id for quota gating).
  // Skip the DB roundtrip on every other source.
  const needsUser = source === "findpros";
  const user = needsUser ? await ensureUser({ clerkUserId, email }) : null;

  let payload;
  switch (source) {
    case "census":
      if (!stateFips || !countyFips) throw new ApiError(400, "missing_params", "stateFips + countyFips required");
      payload = await handleCensus(String(stateFips), String(countyFips));
      break;
    case "fmr":
      if (!stateFips || !countyFips) throw new ApiError(400, "missing_params", "stateFips + countyFips required");
      payload = await handleFmr(String(stateFips), String(countyFips));
      break;
    case "unemployment":
      if (!stateFips || !countyFips) throw new ApiError(400, "missing_params", "stateFips + countyFips required");
      payload = await handleUnemployment(String(stateFips), String(countyFips));
      break;
    case "mortgage":
      payload = await handleMortgage();
      break;
    case "flood": {
      const latN = Number(lat), lngN = Number(lng);
      if (!Number.isFinite(latN) || !Number.isFinite(lngN)) throw new ApiError(400, "missing_params", "lat + lng required");
      payload = await handleFlood(latN, lngN);
      break;
    }
    case "walkscore": {
      const latN = Number(lat), lngN = Number(lng);
      if (!Number.isFinite(latN) || !Number.isFinite(lngN)) throw new ApiError(400, "missing_params", "lat + lng required");
      payload = await handleWalkscore(latN, lngN, address);
      break;
    }
    case "photos": {
      const latN = Number(lat), lngN = Number(lng);
      if (!Number.isFinite(latN) || !Number.isFinite(lngN)) throw new ApiError(400, "missing_params", "lat + lng required");
      payload = handlePhotos(latN, lngN, address);
      break;
    }
    case "nearby": {
      const latN = Number(lat), lngN = Number(lng);
      if (!Number.isFinite(latN) || !Number.isFinite(lngN)) throw new ApiError(400, "missing_params", "lat + lng required");
      payload = await handleNearby(latN, lngN);
      break;
    }
    case "findpros": {
      if (!category || !zip) throw new ApiError(400, "missing_params", "category + zip required");
      payload = await handleFindPros(String(category), String(zip), user);
      break;
    }
    case "proreviews": {
      payload = await handleProReviews(
        placeId ? String(placeId) : null,
        yelpId  ? String(yelpId)  : null
      );
      break;
    }
    case "str": {
      if (!address) throw new ApiError(400, "missing_params", "address required");
      payload = await handleStr(String(address), lat, lng);
      break;
    }
    default:
      throw new ApiError(400, "unknown_source",
        "source must be one of: census, fmr, unemployment, mortgage, flood, walkscore, photos, nearby, findpros, proreviews, str");
  }

  return res.status(200).json(payload);
});
