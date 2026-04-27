/**
 * POST /api/stripe/checkout
 * Body: { planKey: "pro", cadence?: "monthly" | "annual" }
 *   Legacy keys "starter" / "scale" still resolve via planFor() so
 *   webhooks for grandfathered subscribers keep working — but new
 *   checkouts only target Pro.
 *
 * Returns { url } for a Stripe Checkout session. Frontend redirects the
 * user there. On success they come back to /?billing=success; on cancel
 * to /?billing=cancel.
 *
 * The subscription row is created on our side from the Stripe webhook
 * (subscription.created / subscription.updated) — not here.
 */
import { handler, ApiError } from "../_lib/errors.js";
import { requireUserId } from "../_lib/auth.js";
import { ensureUser } from "../_lib/db.js";
import { stripeClient, ensureStripeCustomer } from "../_lib/stripe.js";
import { resolveStripePriceId, planFor } from "../_lib/plans.js";

export default handler(async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const { clerkUserId, email } = await requireUserId(req);
  const user = await ensureUser({ clerkUserId, email });

  const planKey = (req.body && req.body.planKey) || "pro";
  const cadence = (req.body && req.body.cadence) === "annual" ? "annual" : "monthly";
  const plan = planFor(planKey);
  if (plan.key === "free") {
    throw new ApiError(400, "invalid_plan", "Free plan doesn't need checkout.");
  }
  const priceId = resolveStripePriceId(plan.key, cadence);
  if (!priceId) {
    const envKey = cadence === "annual" ? plan.priceIdEnvAnnual : plan.priceIdEnv;
    throw new ApiError(503, "plan_not_configured",
      `Set ${envKey} in Vercel env.`);
  }

  const customerId = await ensureStripeCustomer(user);
  const stripe = stripeClient();

  const origin =
    req.headers.origin ||
    `https://${req.headers.host}`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/?billing=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?billing=cancel`,
    // Include the usage-based price if it's a metered product — currently
    // the Price itself is metered so no extra line item needed.
    allow_promotion_codes: true,
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        clerk_user_id: user.clerk_user_id,
        plan_key: plan.key,
        cadence
      }
    }
  });

  return res.status(200).json({ url: session.url });
});
