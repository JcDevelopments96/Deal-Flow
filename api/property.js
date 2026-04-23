/**
 * GET /api/property?kind={flood|walkscore}&lat=..&lng=..[&address=..]
 *
 * Per-property lookups (flood zone, walk score) consolidated into a single
 * serverless function to stay under the Vercel Hobby 12-function limit.
 */
import { handler, ApiError } from "./_lib/errors.js";
import { requireUserId } from "./_lib/auth.js";

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

  const geometry = encodeURIComponent(JSON.stringify({
    x: lng, y: lat, spatialReference: { wkid: 4326 }
  }));
  const url = `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query`
    + `?geometry=${geometry}&geometryType=esriGeometryPoint&inSR=4326`
    + `&spatialRel=esriSpatialRelIntersects`
    + `&outFields=FLD_ZONE,ZONE_SUBTY,SFHA_TF`
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
    format: "json",
    address: address || "",
    lat: String(lat),
    lon: String(lng),
    wsapikey: key,
    transit: "1",
    bike: "1"
  });
  const res = await fetch(`https://api.walkscore.com/score?${qs.toString()}`);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new ApiError(502, "walkscore_error", `Walk Score ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  if (data.status !== 1) {
    throw new ApiError(502, "walkscore_error",
      `Walk Score status=${data.status}${data.updated ? ` (${data.updated})` : ""}`);
  }
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

  const kind = (req.query?.kind || "").toString();
  const lat = Number(req.query?.lat);
  const lng = Number(req.query?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new ApiError(400, "missing_params", "lat + lng required (numeric)");
  }

  let payload;
  switch (kind) {
    case "flood":
      payload = await handleFlood(lat, lng);
      break;
    case "walkscore":
      payload = await handleWalkscore(lat, lng, req.query?.address);
      break;
    default:
      throw new ApiError(400, "unknown_kind", "kind must be one of: flood, walkscore");
  }

  return res.status(200).json(payload);
});
