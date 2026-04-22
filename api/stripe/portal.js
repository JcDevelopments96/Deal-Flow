/**
 * POST /api/stripe/portal
 *
 * Opens the Stripe Customer Portal so the user can manage their
 * payment method / cancel / switch plans. Returns { url } for the
 * frontend to redirect to.
 */
import { handler, ApiError } from "../_lib/errors.js";
import { requireUserId } from "../_lib/auth.js";
import { ensureUser } from "../_lib/db.js";
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
    throw new ApiError(404, "no_subscription");
  }

  const customerId = await ensureStripeCustomer(user);
  const stripe = stripeClient();
  const origin =
    req.headers.origin ||
    `https://${req.headers.host}`;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: origin
  });

  return res.status(200).json({ url: session.url });
});
