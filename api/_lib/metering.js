/**
 * Server-side click gate. Every metered endpoint calls this BEFORE it
 * touches the upstream provider API.
 *
 * Flow:
 *   1. Load the user's current plan + subscription + period counter.
 *   2. Compare `currentClicks` against the plan's `includedClicks`.
 *   3. If within quota → record the click atomically via the Postgres
 *      function and return the updated counter.
 *   4. If over quota and the plan allows overage → record it with
 *      `cost_cents = overageCostCents` (Stripe metered billing picks
 *      this up via a separate report).
 *   5. If over quota and overage is not allowed (free plan) → 402
 *      Payment Required with the plan info so the UI can prompt upgrade.
 */
import { ApiError } from "./errors.js";
import { adminDb } from "./db.js";
import { planFor } from "./plans.js";
import { currentPeriod } from "./periods.js";

export async function recordMeteredClick({ user, provider, endpoint, metadata = {} }) {
  const db = adminDb();
  const plan = planFor(user.plan);

  // Load current subscription (if any) to get the billing period.
  const { data: sub } = await db
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const period = currentPeriod(sub);

  // Look at what's been recorded so far this period.
  const { data: summary } = await db
    .from("usage_summaries")
    .select("clicks, cost_cents")
    .eq("user_id", user.id)
    .eq("period_start", period.start.toISOString())
    .maybeSingle();
  const clicksSoFar = summary?.clicks || 0;

  const willOverflow = clicksSoFar >= plan.includedClicks;

  if (willOverflow && plan.overageCostCents == null) {
    throw new ApiError(402, "quota_exceeded", {
      plan: plan.key,
      includedClicks: plan.includedClicks,
      clicksSoFar,
      upgradeRequired: true
    });
  }

  const costCents = willOverflow ? plan.overageCostCents : 0;

  const { data: recorded, error } = await db.rpc("record_market_intel_click", {
    p_user_id: user.id,
    p_period_start: period.start.toISOString(),
    p_period_end: period.end.toISOString(),
    p_provider: provider,
    p_endpoint: endpoint,
    p_cost_cents: costCents,
    p_metadata: metadata
  });
  if (error) throw new ApiError(500, "usage_rpc_failed", error.message);

  // rpc returns a rowset with { clicks, cost_cents }
  const row = Array.isArray(recorded) ? recorded[0] : recorded;

  return {
    clicks: row.clicks,
    costCents: row.cost_cents,
    includedClicks: plan.includedClicks,
    remaining: Math.max(0, plan.includedClicks - row.clicks),
    overage: willOverflow,
    overageCostCents: plan.overageCostCents,
    plan: plan.key,
    period: {
      start: period.start.toISOString(),
      end: period.end.toISOString(),
      source: period.source
    }
  };
}

/**
 * Read-only snapshot of a user's usage — doesn't increment. Used by /api/me.
 */
export async function loadUsage(user) {
  const db = adminDb();
  const plan = planFor(user.plan);

  const { data: sub } = await db
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const period = currentPeriod(sub);

  const { data: summary } = await db
    .from("usage_summaries")
    .select("clicks, cost_cents")
    .eq("user_id", user.id)
    .eq("period_start", period.start.toISOString())
    .maybeSingle();

  const clicks = summary?.clicks || 0;
  return {
    plan: plan.key,
    planName: plan.name,
    includedClicks: plan.includedClicks,
    clicks,
    remaining: Math.max(0, plan.includedClicks - clicks),
    overage: clicks > plan.includedClicks,
    overageCostCents: plan.overageCostCents,
    period: {
      start: period.start.toISOString(),
      end: period.end.toISOString(),
      source: period.source
    },
    subscription: sub
      ? {
          status: sub.status,
          stripeSubscriptionId: sub.stripe_subscription_id,
          cancelAtPeriodEnd: sub.cancel_at_period_end
        }
      : null
  };
}
