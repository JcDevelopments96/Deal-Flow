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
 * 7-day free trial is granted on every checkout — unconditionally for
 * simplicity. Stripe handles the no-charge-during-trial flow; the
 * subscription auto-converts to paid on day 8 unless the user cancels.
 * Cards are required upfront so conversion is automatic.
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

  let customerId = await ensureStripeCustomer(user);
  const stripe = stripeClient();

  // If the stored customer id was created on a different Stripe account
  // (e.g., a test→live migration), Stripe will reject it as
  // resource_missing. Detect + heal so the next attempt creates a fresh
  // customer on the current account.
  try {
    await stripe.customers.retrieve(customerId);
  } catch (err) {
    if (err?.code === "resource_missing") {
      console.warn("[stripe:checkout] healing stale customer id", customerId);
      const { adminDb } = await import("../_lib/db.js");
      await adminDb()
        .from("users")
        .update({ stripe_customer_id: null })
        .eq("id", user.id);
      // Re-create from scratch — the user object in memory still has the
      // old id, but ensureStripeCustomer reads it from the row we just
      // cleared.
      const refreshed = { ...user, stripe_customer_id: null };
      customerId = await ensureStripeCustomer(refreshed);
    } else {
      throw err;
    }
  }

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
      trial_period_days: 7,                    // 7-day free trial on Pro
      trial_settings: {
        // If they don't have a card on file when the trial ends, just
        // pause the subscription — never auto-charge a card we don't
        // have, and never silently lock them out either.
        end_behavior: { missing_payment_method: "pause" }
      },
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
