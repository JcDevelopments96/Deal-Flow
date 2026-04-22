/**
 * POST /api/stripe/webhook
 *
 * Stripe-to-us webhook. Must be reachable at a public URL and
 * registered in the Stripe dashboard with the matching signing secret.
 *
 * Events handled:
 *   customer.subscription.created   - mirror to our `subscriptions` table
 *   customer.subscription.updated   - status / period / price changes
 *   customer.subscription.deleted   - mark canceled
 *   invoice.payment_succeeded       - mostly informational (could credit metered usage)
 *
 * Vercel note: we disable bodyParser so we can do Stripe's signature check
 * against the exact raw bytes. If bodyParser were on, JSON re-serialization
 * could mutate whitespace and break the HMAC.
 */
import Stripe from "stripe";
import { adminDb } from "../_lib/db.js";
import { stripeClient } from "../_lib/stripe.js";
import { planForPriceId } from "../_lib/plans.js";

export const config = {
  api: { bodyParser: false }
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return res.status(503).json({
      error: "webhook_not_configured",
      detail: "Set STRIPE_WEBHOOK_SECRET in Vercel env."
    });
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) return res.status(400).json({ error: "missing_signature" });

  let event;
  try {
    const raw = await readRawBody(req);
    // Must use a lightweight Stripe instance here — no HTTP calls are made.
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "_unused_", {
      apiVersion: "2024-11-20.acacia"
    });
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("[stripe:webhook] signature verify failed", err.message);
    return res.status(400).json({ error: "invalid_signature" });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await upsertSubscription(event.data.object);
        break;

      case "invoice.payment_succeeded":
        // Could record invoice for accounting — no-op for now.
        break;

      default:
        // Stripe sends many event types; ignoring the rest is fine.
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    // Return 500 so Stripe retries — we don't want to lose subscription updates.
    console.error("[stripe:webhook] handler failed", err);
    return res.status(500).json({ error: "handler_failed" });
  }
}

async function upsertSubscription(subObj) {
  const db = adminDb();

  // Find our user by Stripe customer id.
  const { data: user } = await db
    .from("users")
    .select("id, plan")
    .eq("stripe_customer_id", subObj.customer)
    .maybeSingle();
  if (!user) {
    console.warn("[stripe:webhook] no local user for customer", subObj.customer);
    return;
  }

  const priceId = subObj.items?.data?.[0]?.price?.id || null;
  const newPlan = planForPriceId(priceId) || "free";

  const subRow = {
    user_id: user.id,
    stripe_subscription_id: subObj.id,
    stripe_price_id: priceId,
    status: subObj.status,
    current_period_start: subObj.current_period_start
      ? new Date(subObj.current_period_start * 1000).toISOString()
      : null,
    current_period_end: subObj.current_period_end
      ? new Date(subObj.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: !!subObj.cancel_at_period_end,
    updated_at: new Date().toISOString()
  };

  // Upsert by stripe_subscription_id (UNIQUE).
  const { error: upsertErr } = await db
    .from("subscriptions")
    .upsert(subRow, { onConflict: "stripe_subscription_id" });
  if (upsertErr) throw upsertErr;

  // Keep the denormalized `users.plan` in sync so reads are cheap.
  const effectivePlan =
    subObj.status === "active" || subObj.status === "trialing" ? newPlan : "free";

  if (effectivePlan !== user.plan) {
    await db.from("users").update({ plan: effectivePlan }).eq("id", user.id);
  }
}
