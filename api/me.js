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

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      plan: user.plan,
      createdAt: user.created_at
    },
    usage,
    plans: publicPlans()
  });
});
