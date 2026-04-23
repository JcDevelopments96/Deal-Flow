/**
 * GET /api/amenities/walkscore?lat=25.76&lng=-80.19&address=123+Main+St
 *
 * Walk Score API proxy. Returns walk / bike / transit scores 0–100 per
 * address. Free tier: 5,000 calls/day. Requires WALKSCORE_API_KEY.
 *
 * Sign up: https://www.walkscore.com/professional/api-sign-up.php
 *
 * Response:
 *   {
 *     walkScore: 87,
 *     walkDescription: "Very Walkable",
 *     bikeScore: 72,
 *     transitScore: 65,
 *     detailsUrl: "https://www.walkscore.com/score/..."
 *   }
 *
 * Cached 7d per (lat,lng) rounded to 4 decimals.
 */
import { handler, ApiError } from "../_lib/errors.js";
import { requireUserId } from "../_lib/auth.js";

const CACHE_MS = 7 * 24 * 60 * 60 * 1000;
const _cache = new Map();

export default handler(async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  await requireUserId(req);

  const key = process.env.WALKSCORE_API_KEY;
  if (!key) {
    throw new ApiError(503, "walkscore_not_configured",
      "Set WALKSCORE_API_KEY in Vercel env (free 5k/day at walkscore.com/professional/api-sign-up.php)");
  }

  const lat = Number(req.query?.lat);
  const lng = Number(req.query?.lng);
  const address = req.query?.address || "";
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new ApiError(400, "missing_params", "lat + lng required (numeric)");
  }

  const cacheKey = `${lat.toFixed(4)}:${lng.toFixed(4)}`;
  const cached = _cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return res.status(200).json({ ...cached.payload, cached: true });
  }

  const qs = new URLSearchParams({
    format: "json",
    address,
    lat: String(lat),
    lon: String(lng),
    wsapikey: key,
    transit: "1",
    bike: "1"
  });
  const url = `https://api.walkscore.com/score?${qs.toString()}`;
  const upstream = await fetch(url);
  if (!upstream.ok) {
    const t = await upstream.text().catch(() => "");
    throw new ApiError(502, "walkscore_error", `Walk Score ${upstream.status}: ${t.slice(0, 200)}`);
  }
  const data = await upstream.json();
  // Walk Score returns `status: 1` on success
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
  _cache.set(cacheKey, { at: Date.now(), payload });
  return res.status(200).json({ ...payload, cached: false });
});
