/**
 * GET /api/me
 *
 * Returns the current user, their plan, usage summary for this period,
 * and the public plan catalog. Creates the `users` row on first login.
 */
import { handler } from "./_lib/errors.js";
import { requireUserId } from "./_lib/auth.js";
import { ensureUser } from "./_lib/db.js";
import { loadUsage } from "./_lib/metering.js";
import { publicPlans } from "./_lib/plans.js";

export default handler(async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const { clerkUserId, email } = await requireUserId(req);
  const user = await ensureUser({ clerkUserId, email });
  const usage = await loadUsage(user);

  // Best-guess "home state" from Vercel's edge geolocation. Only meaningful
  // for US visitors; populated on production traffic, undefined locally.
  // Frontend uses this to default Market Intel to the user's likely market —
  // they can still override via the State filter or clicking the map.
  const country = req.headers?.["x-vercel-ip-country"];
  const region  = req.headers?.["x-vercel-ip-country-region"];
  const homeState = (country === "US" && typeof region === "string" && /^[A-Z]{2}$/.test(region))
    ? region
    : null;

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      plan: user.plan,
      createdAt: user.created_at,
      homeState
    },
    usage,
    plans: publicPlans()
  });
});
