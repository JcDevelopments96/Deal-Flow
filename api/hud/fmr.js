/**
 * GET /api/hud/fmr?stateFips=12&countyFips=086
 *
 * HUD Fair Market Rents — authoritative rental baseline per county, published
 * annually by HUD. Used as a free, government-backed cross-check against
 * RentCast/Realtor rental comps.
 *
 * HUD's API takes their own entity IDs, not raw FIPS, so we resolve
 * (stateCode, FIPS) -> HUD entity id via their listCounties endpoint, cached
 * per-state for the life of the serverless instance. FMR data itself changes
 * once a year, so cache is 30d.
 *
 * Response:
 *   {
 *     year: "2025",
 *     countyName: "Miami-Dade County",
 *     fmr: { studio: 1495, one: 1720, two: 2110, three: 2850, four: 3460 },
 *     smallAreaFmr: true|false,
 *     cached: true|false
 *   }
 *
 * Sign up: https://www.huduser.gov/hudapi/public/register (free)
 */
import { handler, ApiError } from "../_lib/errors.js";
import { requireUserId } from "../_lib/auth.js";
import { STATE_CODE_BY_FIPS } from "../_lib/stateFips.js";

const CACHE_MS = 30 * 24 * 60 * 60 * 1000; // 30d — FMRs update annually
const _fmrCache = new Map(); // "stateFips:countyFips" -> { at, payload }
const _countyListCache = new Map(); // stateCode -> { at, counties: [{fipsCode, countyName}] }
const COUNTY_LIST_CACHE_MS = 7 * 24 * 60 * 60 * 1000;

async function listStateCounties(stateCode, token) {
  const cached = _countyListCache.get(stateCode);
  if (cached && Date.now() - cached.at < COUNTY_LIST_CACHE_MS) return cached.counties;
  const res = await fetch(
    `https://www.huduser.gov/hudapi/public/fmr/listCounties/${stateCode}`,
    { headers: { Authorization: `Bearer ${token}`, accept: "application/json" } }
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new ApiError(502, "hud_county_list_failed",
      `HUD ${res.status}: ${t.slice(0, 200)}`);
  }
  const rows = await res.json();
  // Shape: [{ state_code, fips_code, county_name, town_name, category }, ...]
  const counties = (Array.isArray(rows) ? rows : [])
    .map(r => ({
      entityId: r.fips_code,           // HUD's 10+ char id; pass straight back to /fmr/data
      name: r.county_name || r.town_name,
      // Extract the 3-digit county FIPS from the entity id. HUD IDs look like
      // "FL1208699999" — state(2 letters) + stateFips(2) + countyFips(3) + areaSub(5).
      countyFips: typeof r.fips_code === "string" ? r.fips_code.slice(4, 7) : null
    }))
    .filter(c => c.entityId && c.countyFips);
  _countyListCache.set(stateCode, { at: Date.now(), counties });
  return counties;
}

export default handler(async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  await requireUserId(req);

  const { stateFips, countyFips } = req.query || {};
  if (!stateFips || !countyFips) {
    throw new ApiError(400, "missing_params", "stateFips + countyFips required");
  }
  const stateCode = STATE_CODE_BY_FIPS[String(stateFips)];
  if (!stateCode) {
    throw new ApiError(400, "bad_state_fips", `Unknown state FIPS ${stateFips}`);
  }

  const token = process.env.HUD_API_TOKEN;
  if (!token) {
    throw new ApiError(503, "hud_not_configured",
      "Set HUD_API_TOKEN in Vercel env (free at https://www.huduser.gov/hudapi/public/register)");
  }

  const cacheKey = `${stateFips}:${countyFips}`;
  const cached = _fmrCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return res.status(200).json({ ...cached.payload, cached: true });
  }

  // 1. Resolve (stateFips, countyFips) to HUD's entity id
  const counties = await listStateCounties(stateCode, token);
  const match = counties.find(c => c.countyFips === String(countyFips).padStart(3, "0"));
  if (!match) {
    throw new ApiError(404, "county_not_found",
      `No HUD entry for state=${stateCode} countyFips=${countyFips}`);
  }

  // 2. Fetch FMR data for that entity. Current year or most-recent published.
  const year = new Date().getFullYear();
  const url = `https://www.huduser.gov/hudapi/public/fmr/data/${match.entityId}?year=${year}`;
  const fmrRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, accept: "application/json" }
  });
  if (!fmrRes.ok) {
    const t = await fmrRes.text().catch(() => "");
    throw new ApiError(502, "hud_fmr_failed", `HUD ${fmrRes.status}: ${t.slice(0, 200)}`);
  }
  const data = await fmrRes.json();

  // HUD response shape varies slightly — data.data.basicdata or data.data.smallareafmrs
  const basic = data?.data?.basicdata;
  const sameYearOrFallback = Array.isArray(basic) ? basic[0] : basic;
  const row = sameYearOrFallback || {};

  const payload = {
    year: String(data?.data?.year || year),
    countyName: match.name,
    fmr: {
      studio: Number(row.Efficiency ?? row.efficiency ?? null) || null,
      one:    Number(row["One-Bedroom"] ?? row.one_bedroom ?? null) || null,
      two:    Number(row["Two-Bedroom"] ?? row.two_bedroom ?? null) || null,
      three:  Number(row["Three-Bedroom"] ?? row.three_bedroom ?? null) || null,
      four:   Number(row["Four-Bedroom"] ?? row.four_bedroom ?? null) || null
    },
    smallAreaFmr: !!data?.data?.smallareafmrs
  };
  _fmrCache.set(cacheKey, { at: Date.now(), payload });
  return res.status(200).json({ ...payload, cached: false });
});
