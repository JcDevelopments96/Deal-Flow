/**
 * GET /api/market/listings?city=X&state=Y[&bedrooms=N&bathrooms=N&limit=N]
 *
 * Metered proxy for sale listings. Prefers Realtor.com (realty-in-us
 * RapidAPI wrapper) when RAPIDAPI_REALTOR_KEY is set — richer photos. Falls
 * back to RentCast (RENTCAST_API_KEY) if Realtor fails or returns nothing.
 * User only sees one metered click either way.
 *
 * Response shape is identical regardless of which provider served it:
 *   { listings: [<normalized listing>, ...], usage, provider }
 *
 * Failure modes:
 *   401  not signed in / invalid token
 *   402  over quota — UI opens the UpgradeModal
 *   503  no provider configured
 *   502  both providers failed / not configured
 */
import { handler, ApiError } from "../_lib/errors.js";
import { requireUserId } from "../_lib/auth.js";
import { ensureUser } from "../_lib/db.js";
import { recordMeteredClick } from "../_lib/metering.js";
import { normalizeRealtor, normalizeRentCast } from "./_normalize.js";

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

async function fetchFromRentCast({ city, state, bedrooms, bathrooms, limit, apiKey }) {
  // RentCast requires city+state together. If only state is supplied (for
  // state-wide Realtor queries) we'd skip RentCast entirely — the caller
  // handles that above.
  const qs = new URLSearchParams({ state, limit: String(limit || 50) });
  if (city) qs.set("city", city);
  if (bedrooms) qs.set("bedrooms", bedrooms);
  if (bathrooms) qs.set("bathrooms", bathrooms);
  const res = await fetch(`https://api.rentcast.io/v1/listings/sale?${qs}`, {
    headers: { "X-Api-Key": apiKey, accept: "application/json" }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`rentcast ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  const arr = Array.isArray(data) ? data : data.listings || [];
  return arr.map(normalizeRentCast).filter(Boolean);
}

export default handler(async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const { clerkUserId, email } = await requireUserId(req);
  const user = await ensureUser({ clerkUserId, email });

  const realtorKey = process.env.RAPIDAPI_REALTOR_KEY;
  const rentcastKey = process.env.RENTCAST_API_KEY;
  if (!realtorKey && !rentcastKey) {
    throw new ApiError(503, "provider_not_configured",
      "Set RAPIDAPI_REALTOR_KEY or RENTCAST_API_KEY in Vercel env.");
  }

  const { city, state, bedrooms, bathrooms, limit = "50" } = req.query || {};
  if (!state) {
    throw new ApiError(400, "missing_params", "state is required (city is optional — state-only query returns listings across the whole state)");
  }

  // Record the click BEFORE calling upstream. One click regardless of which
  // provider we end up hitting.
  const usage = await recordMeteredClick({
    user,
    provider: realtorKey ? "realtor" : "rentcast",
    endpoint: "/v1/listings/sale",
    metadata: { city, state, bedrooms, bathrooms }
  });

  let listings = [];
  let provider = null;
  const errors = [];

  // 1. Try Realtor.com if configured
  if (realtorKey) {
    try {
      listings = await fetchFromRealtor({ city, state, bedrooms, bathrooms, limit, apiKey: realtorKey });
      if (listings.length > 0) provider = "realtor";
    } catch (err) {
      errors.push(err.message);
      console.warn("[market/listings] realtor fetch failed:", err.message);
    }
  }

  // 2. Fall back to RentCast if Realtor returned empty or failed.
  //    RentCast needs a specific city — skip fallback on state-only queries.
  if (listings.length === 0 && rentcastKey && city) {
    try {
      listings = await fetchFromRentCast({ city, state, bedrooms, bathrooms, limit, apiKey: rentcastKey });
      if (listings.length > 0) provider = "rentcast";
    } catch (err) {
      errors.push(err.message);
      console.warn("[market/listings] rentcast fetch failed:", err.message);
    }
  }

  if (listings.length === 0 && errors.length > 0) {
    throw new ApiError(502, "upstream_error", errors.join(" | "));
  }

  return res.status(200).json({ listings, usage, provider: provider || "none" });
});
