/**
 * GET /api/market/rentals?city=X&state=Y[&bedrooms=N&bathrooms=N&limit=N]
 *
 * Metered proxy for RentCast long-term rental listings. Same gating /
 * click-counter flow as /api/market/listings — just a different upstream
 * endpoint.
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
    throw new ApiError(503, "provider_not_configured");
  }

  const { city, state, bedrooms, bathrooms, limit = "20" } = req.query || {};
  if (!city || !state) {
    throw new ApiError(400, "missing_params", "city and state are required");
  }

  const usage = await recordMeteredClick({
    user,
    provider: "rentcast",
    endpoint: "/v1/listings/rental/long-term",
    metadata: { city, state, bedrooms, bathrooms }
  });

  const qs = new URLSearchParams({ city, state, limit });
  if (bedrooms) qs.set("bedrooms", bedrooms);
  if (bathrooms) qs.set("bathrooms", bathrooms);

  const upstream = await fetch(
    `https://api.rentcast.io/v1/listings/rental/long-term?${qs}`,
    { headers: { "X-Api-Key": apiKey, accept: "application/json" } }
  );

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    throw new ApiError(502, "upstream_error", {
      status: upstream.status,
      body: text.slice(0, 500)
    });
  }

  const data = await upstream.json();
  const rentals = Array.isArray(data) ? data : data.listings || [];

  return res.status(200).json({ rentals, usage });
});
