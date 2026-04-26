/**
 * GET /api/market/listing-detail?id=<property_id>
 *
 * Fetches the full detail (all photos, long description, open houses etc.)
 * for a single Realtor listing. Unmetered — the user already spent a click
 * for the state/city listings that returned this property_id; drilling into
 * one specific listing is enrichment, not a new search.
 *
 * Cached 24h per property_id in-memory. Re-opening the same listing is free.
 *
 * Response:
 *   {
 *     photos: [highResUrl, ...],   // up to ~40 photos for most listings
 *     photoCount: N,
 *     description: "Long narrative description from Realtor",
 *     virtualTour: "https://...",  // if present
 *     providerUrl: "https://www.realtor.com/..."
 *   }
 */
import { handler, ApiError } from "../_lib/errors.js";
import { requireUserId } from "../_lib/auth.js";

const CACHE_MS = 24 * 60 * 60 * 1000;
const _cache = new Map();

// Same rdcpix.com URL rewrite as the sale-listings normalizer, with a
// higher target resolution for the detail-modal hero (retina-ready).
// Bumped char class to alphanumeric so URLs ending in <digit><suffix>.jpg
// (about a third of Realtor's hash IDs) finally upgrade instead of
// silently rendering at thumbnail resolution.
function upgradeRealtorPhoto(url, { width = 1600, height = 1200, quality = 85 } = {}) {
  if (typeof url !== "string" || !url || !url.includes("rdcpix.com")) return url;
  const tag = `-w${width}_h${height}_q${quality}`;
  if (/-w\d+_h\d+/i.test(url)) {
    return url.replace(/-w\d+_h\d+(_q\d+)?(\.(?:jpe?g|png|webp))/i, `${tag}$2`);
  }
  return url.replace(
    /([a-zA-Z0-9])([smcto])(\.(?:jpe?g|png|webp))(\?|$)/i,
    `$1od${tag}$3$4`
  );
}

export default handler(async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  await requireUserId(req);

  const id = (req.query?.id || "").toString();
  if (!id) throw new ApiError(400, "missing_id", "id (Realtor property_id) is required");

  const cached = _cache.get(id);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return res.status(200).json({ ...cached.payload, cached: true });
  }

  const apiKey = process.env.RAPIDAPI_REALTOR_KEY;
  if (!apiKey) throw new ApiError(503, "provider_not_configured", "Set RAPIDAPI_REALTOR_KEY");

  // v3/detail is a GET endpoint that returns the full home record with
  // the complete photo array. (An earlier POST version of this call
  // silently 404'd, which is why the modal was stuck on the primary photo.)
  const upstream = await fetch(
    `https://realty-in-us.p.rapidapi.com/properties/v3/detail?property_id=${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "realty-in-us.p.rapidapi.com",
        accept: "application/json"
      }
    }
  );
  if (!upstream.ok) {
    const t = await upstream.text().catch(() => "");
    throw new ApiError(502, "upstream_error", `Realtor ${upstream.status}: ${t.slice(0, 200)}`);
  }
  const data = await upstream.json();
  const home = data?.data?.home || data?.home;
  if (!home) throw new ApiError(404, "not_found", `No Realtor detail for ${id}`);

  const photosRaw = Array.isArray(home.photos) ? home.photos : [];
  const photos = photosRaw
    .map(p => (typeof p === "string" ? p : (p?.href || p?.url)))
    .filter(u => typeof u === "string" && u)
    .map(u => upgradeRealtorPhoto(u, { width: 1600, height: 1200, quality: 85 }));

  // Fall back to primary_photo if the detail response didn't include photos[]
  if (photos.length === 0 && home.primary_photo?.href) {
    photos.push(upgradeRealtorPhoto(home.primary_photo.href, { width: 1600, height: 1200, quality: 85 }));
  }

  const virtualTour = Array.isArray(home.virtual_tours) && home.virtual_tours.length > 0
    ? home.virtual_tours[0]?.href
    : null;

  const payload = {
    photos,
    photoCount: typeof home.photo_count === "number" ? home.photo_count : photos.length,
    description: home.description?.text || home.description || null,
    virtualTour,
    providerUrl: home.href || null
  };
  _cache.set(id, { at: Date.now(), payload });
  return res.status(200).json({ ...payload, cached: false });
});
