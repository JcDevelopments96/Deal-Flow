/**
 * GET /api/market/indexes?regionType=county&regionId=12086
 *
 * Returns the latest snapshot of public research data for a region:
 *   - Zillow ZHVI (Home Value Index)
 *   - Zillow ZORI (Observed Rent Index)
 *   - Redfin median sale price / days-on-market / inventory
 *
 * Zero per-call cost to the user — this reads from the `market_indexes`
 * Supabase snapshot that scripts/ingest-market-data.js populates monthly.
 *
 * Region keys:
 *   - regionType="county", regionId="{stateFips}{countyFips}" (5 chars, e.g. "12086")
 *   - regionType="zip",    regionId="{5-digit zip}"
 */
import { handler, ApiError } from "../_lib/errors.js";
import { requireUserId } from "../_lib/auth.js";
import { adminDb } from "../_lib/db.js";

export default handler(async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  await requireUserId(req);

  const { regionType, regionId } = req.query || {};
  if (!regionType || !regionId) {
    throw new ApiError(400, "missing_params", "regionType + regionId required");
  }
  if (regionType !== "county" && regionType !== "zip") {
    throw new ApiError(400, "bad_region_type", "regionType must be 'county' or 'zip'");
  }

  const db = adminDb();
  const { data, error } = await db
    .from("market_indexes")
    .select("*")
    .eq("region_type", regionType)
    .eq("region_id", String(regionId))
    .maybeSingle();

  if (error) throw new ApiError(500, "db_read_failed", error.message);
  if (!data) {
    // Not an error — just means we haven't ingested data for this region yet
    // (e.g. very small county). Return null-shaped response so client can
    // gracefully degrade.
    return res.status(200).json({
      regionType, regionId,
      zhvi_latest: null, zhvi_yoy_pct: null,
      zori_latest: null, zori_yoy_pct: null,
      redfin_median_price: null, redfin_median_dom: null, redfin_inventory: null,
      asOf: null
    });
  }

  return res.status(200).json({
    regionType: data.region_type,
    regionId: data.region_id,
    regionName: data.region_name,
    stateCode: data.state_code,
    zhvi_latest: data.zhvi_latest ? Number(data.zhvi_latest) : null,
    zhvi_yoy_pct: data.zhvi_yoy_pct ? Number(data.zhvi_yoy_pct) : null,
    zori_latest: data.zori_latest ? Number(data.zori_latest) : null,
    zori_yoy_pct: data.zori_yoy_pct ? Number(data.zori_yoy_pct) : null,
    redfin_median_price: data.redfin_median_price ? Number(data.redfin_median_price) : null,
    redfin_median_dom: data.redfin_median_dom,
    redfin_inventory: data.redfin_inventory,
    asOf: data.as_of
  });
});
