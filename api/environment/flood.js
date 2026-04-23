/**
 * GET /api/environment/flood?lat=25.7617&lng=-80.1918
 *
 * FEMA National Flood Hazard Layer lookup. Free, no API key. Returns the
 * flood zone code for a given coordinate — critical because flood insurance
 * can easily exceed $3k/yr in Special Flood Hazard Areas (SFHAs).
 *
 * Response:
 *   {
 *     zone: "AE" | "X" | null,
 *     sfha: true | false,             // inside a Special Flood Hazard Area
 *     zoneSubtype: "1% Annual Chance..." | null,
 *     riskLevel: "high" | "moderate" | "low" | "unknown",
 *     insuranceGuidance: "..."
 *   }
 *
 * Cached in-module for 24h per (lat,lng) rounded to 4 decimals (~11m) — flood
 * zones don't change and the rounded key prevents the cache from exploding.
 */
import { handler, ApiError } from "../_lib/errors.js";
import { requireUserId } from "../_lib/auth.js";

const CACHE_MS = 24 * 60 * 60 * 1000;
const _cache = new Map();

// SFHA zones = mandatory flood insurance with a federally-backed mortgage.
const HIGH_RISK = new Set(["A", "AE", "AH", "AO", "AR", "A99", "V", "VE"]);
const MODERATE_RISK = new Set(["B"]);
const LOW_RISK = new Set(["C", "X"]);

function classify(zone) {
  if (!zone) return { riskLevel: "unknown", guidance: "Flood zone not mapped or outside NFHL coverage." };
  const base = zone.toUpperCase().split(" ")[0];
  if (HIGH_RISK.has(base)) {
    return {
      riskLevel: "high",
      guidance: "Special Flood Hazard Area — mandatory flood insurance with a federally-backed mortgage. Budget $1,500–$5,000+/yr for NFIP policy depending on elevation."
    };
  }
  if (MODERATE_RISK.has(base)) {
    return { riskLevel: "moderate", guidance: "Moderate flood risk. Flood insurance optional but recommended; typically $500–$1,000/yr." };
  }
  if (LOW_RISK.has(base)) {
    return { riskLevel: "low", guidance: "Minimal flood risk. Preferred Risk Policy available (~$400/yr) if desired." };
  }
  return { riskLevel: "unknown", guidance: `Zone ${zone} — check FEMA map for details.` };
}

export default handler(async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  await requireUserId(req);

  const lat = Number(req.query?.lat);
  const lng = Number(req.query?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new ApiError(400, "missing_params", "lat + lng required (numeric)");
  }

  const key = `${lat.toFixed(4)}:${lng.toFixed(4)}`;
  const cached = _cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return res.status(200).json({ ...cached.payload, cached: true });
  }

  // FEMA NFHL — layer 28 is "Flood Hazard Zones"
  const geometry = encodeURIComponent(JSON.stringify({
    x: lng, y: lat, spatialReference: { wkid: 4326 }
  }));
  const url = `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query`
    + `?geometry=${geometry}&geometryType=esriGeometryPoint&inSR=4326`
    + `&spatialRel=esriSpatialRelIntersects`
    + `&outFields=FLD_ZONE,ZONE_SUBTY,SFHA_TF`
    + `&returnGeometry=false&f=json`;

  const upstream = await fetch(url);
  if (!upstream.ok) {
    const t = await upstream.text().catch(() => "");
    throw new ApiError(502, "fema_error", `FEMA ${upstream.status}: ${t.slice(0, 200)}`);
  }
  const data = await upstream.json();
  const feature = Array.isArray(data?.features) ? data.features[0] : null;
  const attrs = feature?.attributes || {};
  const zone = attrs.FLD_ZONE || null;
  const sfha = attrs.SFHA_TF === "T";
  const { riskLevel, guidance } = classify(zone);

  const payload = {
    zone,
    sfha,
    zoneSubtype: attrs.ZONE_SUBTY || null,
    riskLevel,
    insuranceGuidance: guidance
  };
  _cache.set(key, { at: Date.now(), payload });
  return res.status(200).json({ ...payload, cached: false });
});
