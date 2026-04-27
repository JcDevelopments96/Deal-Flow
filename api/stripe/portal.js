/**
 * POST /api/stripe/portal
 *
 * Opens the Stripe Customer Portal so the user can manage their
 * payment method / cancel / switch plans. Returns { url } for the
 * frontend to redirect to.
 *
 * Robustness: if our stored stripe_customer_id no longer exists on
 * Stripe (common when migrating between accounts or test→live), we
 * heal by clearing the stale ID and returning a clear 409 so the
 * client can prompt the user to re-subscribe.
 */
import { handler, ApiError } from "../_lib/errors.js";
import { requireUserId } from "../_lib/auth.js";
import { ensureUser, adminDb } from "../_lib/db.js";
import { stripeClient, ensureStripeCustomer } from "../_lib/stripe.js";

export default handler(async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const { clerkUserId, email } = await requireUserId(req);
  const user = await ensureUser({ clerkUserId, email });

  if (!user.stripe_customer_id) {
    // User hasn't paid for anything yet — there's nothing to manage.
    throw new ApiError(404, "no_subscription",
      "You don't have an active subscription yet. Pick a plan first.");
  }

  const customerId = await ensureStripeCustomer(user);
  const stripe = stripeClient();
  const origin =
    req.headers.origin ||
    `https://${req.headers.host}`;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: origin
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    // "No such customer" means our stored id points at a customer that
    // doesn't exist on Stripe — common when migrating Stripe accounts
    // or moving between test/live. Heal by clearing the stale id so the
    // next checkout creates a fresh customer on the current account.
    if (err?.code === "resource_missing" && err?.param === "customer") {
      console.warn("[stripe:portal] healing stale customer id", customerId);
      await adminDb()
        .from("users")
        .update({ stripe_customer_id: null })
        .eq("id", user.id);
      throw new ApiError(409, "stale_customer",
        "Your account was migrated to a new billing system. Pick a plan to start a fresh subscription.");
    }
    throw err;
  }
});
