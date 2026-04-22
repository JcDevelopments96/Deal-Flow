/**
 * Resolve the current billing period for a user.
 *
 * - Paid users on an active subscription: use Stripe's period so invoicing
 *   and metering line up exactly.
 * - Free / inactive users: fall back to a calendar month (UTC). Avoids
 *   edge cases around signup timing.
 */

export function currentPeriod(subscription) {
  if (
    subscription &&
    ["active", "trialing"].includes(subscription.status) &&
    subscription.current_period_start &&
    subscription.current_period_end
  ) {
    return {
      start: new Date(subscription.current_period_start),
      end: new Date(subscription.current_period_end),
      source: "stripe"
    };
  }

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end, source: "calendar" };
}
