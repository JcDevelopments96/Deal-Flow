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
import { STATE_CODE_BY_FIPS } from "./_lib/stateFips.js";

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
  const url = `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query`
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

/* ── Router ────────────────────────────────────────────────────────── */
export default handler(async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  await requireUserId(req);

  const source = (req.query?.source || "").toString();
  const { stateFips, countyFips, lat, lng, address } = req.query || {};

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
    default:
      throw new ApiError(400, "unknown_source",
        "source must be one of: census, fmr, unemployment, mortgage, flood, walkscore");
  }

  return res.status(200).json(payload);
});
