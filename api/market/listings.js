/**
 * GET /api/market/listings?city=X&state=Y[&bedrooms=N&bathrooms=N&limit=N]
 *
 * Metered proxy for RentCast for-sale listings. Every successful call counts
 * as one Market Intel click on the authenticated user's plan.
 *
 * Failure modes:
 *   401 — not signed in / invalid token
 *   402 — user out of included clicks, plan disallows overage (free tier)
 *   503 — upstream env not configured yet
 *   502 — RentCast returned an error
 */
import { handler, ApiError } from "../_lib/errors.js";
import { requireUserId } from "../_lib/auth.js";
import { ensureUser } from "../_lib/db.js";
import { recordMeteredClick } from "../_lib/metering.js";

export default handler(async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const { clerkUserId, email } = await requireUserId(req);
  const user = await ensureUser({ clerkUserId, email });

  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    throw new ApiError(503, "provider_not_configured",
      "Set RENTCAST_API_KEY in the Vercel project env.");
  }

  const { city, state, bedrooms, bathrooms, limit = "20" } = req.query || {};
  if (!city || !state) {
    throw new ApiError(400, "missing_params", "city and state are required");
  }

  // Meter FIRST. If this throws 402, we never hit RentCast, so the user is
  // only charged for a click when they actually get data back. (On 5xx from
  // RentCast below we've already spent the click — we deliberately accept
  // that since the cost-of-goods is already spent upstream.)
  const usage = await recordMeteredClick({
    user,
    provider: "rentcast",
    endpoint: "/v1/listings/sale",
    metadata: { city, state, bedrooms, bathrooms }
  });

  const qs = new URLSearchParams({ city, state, limit });
  if (bedrooms) qs.set("bedrooms", bedrooms);
  if (bathrooms) qs.set("bathrooms", bathrooms);

  const upstream = await fetch(`https://api.rentcast.io/v1/listings/sale?${qs}`, {
    headers: {
      "X-Api-Key": apiKey,
      accept: "application/json"
    }
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    throw new ApiError(502, "upstream_error", {
      status: upstream.status,
      body: text.slice(0, 500)
    });
  }

  const data = await upstream.json();
  const listings = Array.isArray(data) ? data : data.listings || [];

  return res.status(200).json({ listings, usage });
});
