/**
 * GET /api/market/listings?city=X&state=Y[&bedrooms=N&bathrooms=N&limit=N]
 *
 * Metered proxy for sale listings. Uses Realtor.com (realty-in-us RapidAPI
 * wrapper) as the single source — rich photos, nationwide coverage, supports
 * both state-wide and city-specific queries.
 *
 * Response:
 *   { listings: [<normalized listing>, ...], usage, provider }
 *
 * Failure modes:
 *   401  not signed in / invalid token
 *   402  over quota — UI opens the UpgradeModal
 *   503  no provider configured
 *   502  upstream failed
 */
import { handler, ApiError } from "../_lib/errors.js";
import { requireUserId } from "../_lib/auth.js";
import { ensureUser } from "../_lib/db.js";
import { recordMeteredClick } from "../_lib/metering.js";
import { normalizeRealtor } from "./_normalize.js";
import { streetViewUrl, satelliteUrl } from "../_lib/googlePhotos.js";

// Map our coarse property-type keys onto Realtor's `type` enum array.
// "single_family" doesn't quite map 1:1 — Realtor uses "single_family"
// only for true detached SFRs, but multi-family duplexes and condos
// each have their own enums. Keep this list in sync with the chip set
// in AdvancedMarketIntel.jsx.
const PROPERTY_TYPE_MAP = {
  single_family: ["single_family"],
  multi_family:  ["multi_family", "duplex_triplex"],
  condos:        ["condos", "condo_townhome", "condo_townhome_rowhome_coop"],
  townhomes:     ["townhomes", "condo_townhome_rowhome_coop"],
  mobile:        ["mobile"],
  land:          ["land"]
};

async function fetchRealtorPage({ city, state, bedrooms, bathrooms, propertyType, offset, apiKey }) {
  const body = {
    limit: 200,
    offset,
    // City is optional — state-only query returns listings across the whole
    // state (tens of thousands for large states, hundreds/thousands for small
    // states). Drill in by clicking a county on the map.
    state_code: state,
    status: ["for_sale", "ready_to_build"],
    sort: { direction: "desc", field: "list_date" }
  };
  if (city) body.city = city;
  if (bedrooms) body.beds = { min: Number(bedrooms), max: Number(bedrooms) };
  if (bathrooms) body.baths = { min: Number(bathrooms), max: Number(bathrooms) };
  if (propertyType && PROPERTY_TYPE_MAP[propertyType]) {
    body.type = PROPERTY_TYPE_MAP[propertyType];
  }

  const res = await fetch(
    "https://realty-in-us.p.rapidapi.com/properties/v3/list",
    {
      method: "POST",
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "realty-in-us.p.rapidapi.com",
        "Content-Type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify(body)
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`realtor ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  return json?.data?.home_search?.results || [];
}

// State-wide queries fetch 3 parallel pages (600 listings) because Realtor's
// per-call cap of 200 + sort-by-newest clusters results in top metros — at
// 200 you see ~30 cities; at 600 you see ~200 cities. City-specific queries
// stay at 1 page since 200 is more than enough for a single city.
async function fetchFromRealtor({ city, state, bedrooms, bathrooms, propertyType, apiKey }) {
  const isStateWide = !city;
  const offsets = isStateWide ? [0, 200, 400] : [0];
  const pages = await Promise.all(offsets.map(offset =>
    fetchRealtorPage({ city, state, bedrooms, bathrooms, propertyType, offset, apiKey })
  ));
  // De-dupe by property_id — unlikely but cheap insurance for overlapping pages.
  const seen = new Set();
  const combined = [];
  for (const p of pages.flat()) {
    const id = p.property_id || p.listing_id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    combined.push(p);
  }
  return combined.map(normalizeRealtor).filter(Boolean);
}

export default handler(async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const { clerkUserId, email } = await requireUserId(req);
  const user = await ensureUser({ clerkUserId, email });

  const realtorKey = process.env.RAPIDAPI_REALTOR_KEY;
  if (!realtorKey) {
    throw new ApiError(503, "provider_not_configured",
      "Set RAPIDAPI_REALTOR_KEY in Vercel env.");
  }

  const { city, state, bedrooms, bathrooms, propertyType } = req.query || {};
  if (!state) {
    throw new ApiError(400, "missing_params",
      "state is required (city is optional — state-only query returns listings across the whole state)");
  }

  // Record the click BEFORE calling upstream. Still 1 click per user even
  // though state-wide queries internally fan out to 3 parallel Realtor pages.
  const usage = await recordMeteredClick({
    user,
    provider: "realtor",
    endpoint: "/v1/listings/sale",
    metadata: { city, state, bedrooms, bathrooms, propertyType }
  });

  let listings = [];
  try {
    listings = await fetchFromRealtor({ city, state, bedrooms, bathrooms, propertyType, apiKey: realtorKey });
  } catch (err) {
    console.warn("[market/listings] realtor fetch failed:", err.message);
    throw new ApiError(502, "upstream_error", err.message);
  }

  // Attach Google Maps Static URLs (street + aerial) to every listing so the
  // cards can offer a Photos / Street / Aerial toggle without each card
  // firing its own /api/lookup call.
  for (const l of listings) {
    l.streetview_url = streetViewUrl(l);
    l.satellite_url = satelliteUrl(l);
  }

  return res.status(200).json({ listings, usage, provider: "realtor" });
});
