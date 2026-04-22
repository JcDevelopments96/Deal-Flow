/**
 * Authoritative plan definitions. The frontend will read a projection
 * of this via /api/me — never trust the client's claimed plan.
 *
 * Prices here are the MONTHLY subscription price; `overageCostCents` is
 * what DealTrack charges per click past the included allowance.
 */

export const PLANS = {
  free: {
    key: "free",
    name: "Free",
    priceMonthly: 0,
    includedClicks: 10,
    overageCostCents: null,   // overage not allowed on free — hard gate
    priceIdEnv: null
  },
  starter: {
    key: "starter",
    name: "Starter",
    priceMonthly: 19,
    includedClicks: 250,
    overageCostCents: 15,
    priceIdEnv: "VITE_PRICING_STARTER_PRICE_ID"
  },
  pro: {
    key: "pro",
    name: "Pro",
    priceMonthly: 49,
    includedClicks: 1000,
    overageCostCents: 10,
    priceIdEnv: "VITE_PRICING_PRO_PRICE_ID"
  },
  scale: {
    key: "scale",
    name: "Scale",
    priceMonthly: 149,
    includedClicks: 5000,
    overageCostCents: 5,
    priceIdEnv: "VITE_PRICING_SCALE_PRICE_ID"
  }
};

export const PLAN_ORDER = ["free", "starter", "pro", "scale"];

export function planFor(key) {
  return PLANS[key] || PLANS.free;
}

export function resolveStripePriceId(key) {
  const plan = planFor(key);
  if (!plan.priceIdEnv) return null;
  return process.env[plan.priceIdEnv] || null;
}

/**
 * Given a Stripe price id from a webhook, figure out which plan it corresponds
 * to. Returns `null` if we don't recognize it (e.g. a different product).
 */
export function planForPriceId(priceId) {
  for (const plan of Object.values(PLANS)) {
    if (!plan.priceIdEnv) continue;
    if (process.env[plan.priceIdEnv] === priceId) return plan.key;
  }
  return null;
}

/**
 * Client-facing projection. Strips `priceIdEnv` and includes the resolved
 * price id (fine for the client to see — it's used in Checkout).
 */
export function publicPlans() {
  return PLAN_ORDER.map(key => {
    const plan = PLANS[key];
    return {
      key: plan.key,
      name: plan.name,
      priceMonthly: plan.priceMonthly,
      includedClicks: plan.includedClicks,
      overageCostCents: plan.overageCostCents,
      stripePriceId: resolveStripePriceId(key)
    };
  });
}
