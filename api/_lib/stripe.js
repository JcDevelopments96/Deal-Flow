/**
 * Stripe server client. Also provides ensureStripeCustomer — idempotent
 * "find or create" on the Stripe side keyed off the Supabase user id.
 */
import Stripe from "stripe";
import { ApiError } from "./errors.js";
import { adminDb } from "./db.js";

let _stripe;

export function stripeClient() {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new ApiError(503, "billing_not_configured",
      "Set STRIPE_SECRET_KEY in the Vercel project env.");
  }
  _stripe = new Stripe(key, {
    // Pin the API version so Stripe doesn't silently change our request
    // shapes. Bump intentionally when we read a changelog.
    apiVersion: "2024-11-20.acacia"
  });
  return _stripe;
}

/**
 * Make sure the given user has a Stripe customer and return its id.
 * Caches the id on the `users` row.
 */
export async function ensureStripeCustomer(user) {
  if (user.stripe_customer_id) return user.stripe_customer_id;

  const stripe = stripeClient();
  const customer = await stripe.customers.create({
    email: user.email || undefined,
    metadata: {
      supabase_user_id: user.id,
      clerk_user_id: user.clerk_user_id
    }
  });

  const { error } = await adminDb()
    .from("users")
    .update({ stripe_customer_id: customer.id })
    .eq("id", user.id);
  if (error) throw new ApiError(500, "db_update_failed", error.message);

  return customer.id;
}
