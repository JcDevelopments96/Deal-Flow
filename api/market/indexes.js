/**
 * GET /api/market/indexes?regionType=county&regionId=12086   → single
 * GET /api/market/indexes?state=FL                            → bulk per-state
 *
 * Returns the latest snapshot of public research data:
 *   - Zillow ZHVI (Home Value Index)
 *   - Zillow ZORI (Observed Rent Index)
 *   - Redfin median sale price / days-on-market / inventory
 *
 * Zero per-call cost — reads from the `market_indexes` Supabase snapshot
 * that scripts/ingest-market-data.js populates weekly.
 *
 * The bulk mode powers the Market Intel map so every county gets an initial
 * color (Zillow ZHVI → red/yellow/green), instead of the yellow-everywhere
 * "no data" look we had when coloring only came from the latest live fetch.
 */
import { handler, ApiError } from "../_lib/errors.js";
import { requireUserId } from "../_lib/auth.js";
import { adminDb } from "../_lib/db.js";
import { STATE_FIPS_BY_CODE } from "../_lib/stateFips.js";

function shapeRow(d) {
  return {
    regionType: d.region_type,
    regionId: d.region_id,
    regionName: d.region_name,
    stateCode: d.state_code,
    zhvi_latest: d.zhvi_latest ? Number(d.zhvi_latest) : null,
    zhvi_yoy_pct: d.zhvi_yoy_pct ? Number(d.zhvi_yoy_pct) : null,
    zori_latest: d.zori_latest ? Number(d.zori_latest) : null,
    zori_yoy_pct: d.zori_yoy_pct ? Number(d.zori_yoy_pct) : null,
    redfin_median_price: d.redfin_median_price ? Number(d.redfin_median_price) : null,
    redfin_median_dom: d.redfin_median_dom,
    redfin_inventory: d.redfin_inventory,
    asOf: d.as_of
  };
}

export default handler(async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  await requireUserId(req);

  const { regionType, regionId, state, all } = req.query || {};
  const db = adminDb();

  /* ── Nationwide fetch — every county ZHVI/ZORI/Redfin snapshot ────── */
  if (all) {
    const { data, error } = await db
      .from("market_indexes")
      .select("*")
      .eq("region_type", "county");
    if (error) throw new ApiError(500, "db_read_failed", error.message);
    const byFips = {};
    for (const row of data || []) byFips[row.region_id] = shapeRow(row);
    return res.status(200).json({
      national: true,
      count: Object.keys(byFips).length,
      byFips
    });
  }

  /* ── Bulk per-state fetch ─────────────────────────────────────────── */
  if (state) {
    const code = String(state).toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) {
      throw new ApiError(400, "bad_state", "state must be a 2-letter code (e.g. FL)");
    }
    const stateFips = STATE_FIPS_BY_CODE[code];
    // Two strategies — try state_code first (what ingest writes), fall back
    // to FIPS-prefix match on region_id. Either returns the same row shape.
    let { data, error } = await db
      .from("market_indexes")
      .select("*")
      .eq("region_type", "county")
      .eq("state_code", code);
    if ((!data || data.length === 0) && stateFips) {
      const fallback = await db
        .from("market_indexes")
        .select("*")
        .eq("region_type", "county")
        .like("region_id", `${stateFips}%`);
      data = fallback.data || [];
      error = fallback.error;
    }
    if (error) throw new ApiError(500, "db_read_failed", error.message);

    // Return a map keyed by FIPS for O(1) client lookup
    const byFips = {};
    for (const row of data || []) {
      byFips[row.region_id] = shapeRow(row);
    }
    return res.status(200).json({
      state: code,
      count: Object.keys(byFips).length,
      byFips
    });
  }

  /* ── Single-region fetch (existing behavior) ──────────────────────── */
  if (!regionType || !regionId) {
    throw new ApiError(400, "missing_params",
      "Pass either ?state=FL for a bulk fetch, or ?regionType=county&regionId=12086 for one county.");
  }
  if (regionType !== "county" && regionType !== "zip") {
    throw new ApiError(400, "bad_region_type", "regionType must be 'county' or 'zip'");
  }

  const { data, error } = await db
    .from("market_indexes")
    .select("*")
    .eq("region_type", regionType)
    .eq("region_id", String(regionId))
    .maybeSingle();

  if (error) throw new ApiError(500, "db_read_failed", error.message);
  if (!data) {
    return res.status(200).json({
      regionType, regionId,
      zhvi_latest: null, zhvi_yoy_pct: null,
      zori_latest: null, zori_yoy_pct: null,
      redfin_median_price: null, redfin_median_dom: null, redfin_inventory: null,
      asOf: null
    });
  }
  return res.status(200).json(shapeRow(data));
});
