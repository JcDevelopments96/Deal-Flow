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

async function fetchFromRealtor({ city, state, bedrooms, bathrooms, limit, apiKey }) {
  const body = {
    limit: Math.max(1, Math.min(200, Number(limit) || 50)),
    offset: 0,
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
  const results = json?.data?.home_search?.results || [];
  return results.map(normalizeRealtor).filter(Boolean);
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

  const { city, state, bedrooms, bathrooms, limit = "50" } = req.query || {};
  if (!state) {
    throw new ApiError(400, "missing_params",
      "state is required (city is optional — state-only query returns listings across the whole state)");
  }

  // Record the click BEFORE calling upstream so over-quota users can't
  // abuse retries.
  const usage = await recordMeteredClick({
    user,
    provider: "realtor",
    endpoint: "/v1/listings/sale",
    metadata: { city, state, bedrooms, bathrooms }
  });

  let listings = [];
  try {
    listings = await fetchFromRealtor({ city, state, bedrooms, bathrooms, limit, apiKey: realtorKey });
  } catch (err) {
    console.warn("[market/listings] realtor fetch failed:", err.message);
    throw new ApiError(502, "upstream_error", err.message);
  }

  return res.status(200).json({ listings, usage, provider: "realtor" });
});
