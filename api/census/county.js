/**
 * GET /api/census/county?stateFips=12&countyFips=086
 *
 * Demographics for a US county from the Census Bureau's ACS 5-year survey.
 * Free, unlimited — just needs CENSUS_API_KEY in env.
 *
 * Response:
 *   {
 *     population: 2710516,
 *     medianIncome: 65849,
 *     medianHomeValue: 395300,
 *     medianGrossRent: 1654,
 *     ownerOccupied: 410228,
 *     renterOccupied: 466541,
 *     renterSharePct: 53.2,
 *     asOf: "acs5 2022",
 *     cached: true|false
 *   }
 *
 * Cached in-module for 24h — county demographics only change when the Census
 * publishes a new ACS release (once a year).
 *
 * FIPS codes come from the map click (STATE_FIPS_BY_CODE + geo.id in
 * USCountyMap.jsx) — `geo.id` is a 5-char string like "12086" where the first
 * 2 chars are the state FIPS and the last 3 are the county FIPS.
 */
import { handler, ApiError } from "../_lib/errors.js";
import { requireUserId } from "../_lib/auth.js";

const CACHE_MS = 24 * 60 * 60 * 1000; // 24h
const _cache = new Map(); // key: "stateFips:countyFips" -> { at, payload }

// ACS 5-year variables we care about. The "E" suffix = estimate.
const VARIABLES = {
  population:       "B01003_001E",
  medianIncome:     "B19013_001E",
  medianHomeValue:  "B25077_001E",
  medianGrossRent:  "B25064_001E",
  ownerOccupied:    "B25003_002E",
  renterOccupied:   "B25003_003E"
};

// ACS release year. Update this once a year when new data drops (December).
const ACS_YEAR = "2022";

export default handler(async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  await requireUserId(req);

  const { stateFips, countyFips } = req.query || {};
  if (!stateFips || !countyFips) {
    throw new ApiError(400, "missing_params",
      "Both stateFips (2-digit) and countyFips (3-digit) are required.");
  }
  if (!/^\d{2}$/.test(stateFips) || !/^\d{3}$/.test(countyFips)) {
    throw new ApiError(400, "bad_fips",
      "stateFips must be 2 digits and countyFips must be 3 digits.");
  }

  const cacheKey = `${stateFips}:${countyFips}`;
  const cached = _cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return res.status(200).json({ ...cached.payload, cached: true });
  }

  const apiKey = process.env.CENSUS_API_KEY;
  if (!apiKey) {
    throw new ApiError(503, "census_not_configured",
      "Set CENSUS_API_KEY in Vercel env (free at https://api.census.gov/data/key_signup.html)");
  }

  const varList = Object.values(VARIABLES).join(",");
  const url = `https://api.census.gov/data/${ACS_YEAR}/acs/acs5`
    + `?get=${varList}`
    + `&for=county:${countyFips}`
    + `&in=state:${stateFips}`
    + `&key=${apiKey}`;

  const upstream = await fetch(url, { headers: { accept: "application/json" } });
  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    throw new ApiError(502, "upstream_error",
      `Census ${upstream.status}: ${text.slice(0, 200)}`);
  }
  const data = await upstream.json();
  // Census returns [[header_row], [values_row]]. Header order matches `get=` param.
  if (!Array.isArray(data) || data.length < 2) {
    throw new ApiError(502, "census_empty", "No data returned for that county");
  }
  const [headers, values] = data;
  const rowByHeader = Object.fromEntries(headers.map((h, i) => [h, values[i]]));

  const toNum = (raw) => {
    const n = Number(raw);
    // Census uses negative values as "no data" sentinels (e.g., -666666666).
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  const population = toNum(rowByHeader[VARIABLES.population]);
  const medianIncome = toNum(rowByHeader[VARIABLES.medianIncome]);
  const medianHomeValue = toNum(rowByHeader[VARIABLES.medianHomeValue]);
  const medianGrossRent = toNum(rowByHeader[VARIABLES.medianGrossRent]);
  const ownerOccupied = toNum(rowByHeader[VARIABLES.ownerOccupied]);
  const renterOccupied = toNum(rowByHeader[VARIABLES.renterOccupied]);
  const totalOccupied = (ownerOccupied || 0) + (renterOccupied || 0);
  const renterSharePct = totalOccupied > 0
    ? +((renterOccupied / totalOccupied) * 100).toFixed(1)
    : null;

  const payload = {
    population, medianIncome, medianHomeValue, medianGrossRent,
    ownerOccupied, renterOccupied, renterSharePct,
    asOf: `acs5 ${ACS_YEAR}`
  };
  _cache.set(cacheKey, { at: Date.now(), payload });

  return res.status(200).json({ ...payload, cached: false });
});
