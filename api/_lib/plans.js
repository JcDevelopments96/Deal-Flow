/**
 * Authoritative plan definitions. The frontend reads a public projection
 * via /api/me — never trust the client's claimed plan.
 *
 * Pricing model (April 2026 redesign):
 *   - Free includes 5 Market Intel clicks/mo so users get a taste before paywall
 *   - Flat $0.10 overage across all paid tiers (was tiered $0.05/$0.10/$0.15)
 *   - Annual cadence at ~17% discount (2 months free) sold via separate Stripe Price
 *
 * Both monthly and annual cadences point to the SAME plan key under the hood —
 * the only difference is which Stripe Price they're billed against.
 */

export const PLANS = {
  free: {
    key: "free",
    name: "Free",
    priceMonthly: 0,
    priceAnnual: 0,
    includedClicks: 5,           // tiny taste — was 0; lets users browse a few markets before paywall
    aiMessages: 10,              // soft cap on Ari conversations (not yet enforced server-side)
    overageCostCents: null,      // free plan blocks at quota → 402 → upgrade modal
    priceIdEnv: null,
    priceIdEnvAnnual: null
  },
  starter: {
    key: "starter",
    name: "Starter",
    priceMonthly: 29,
    priceAnnual: 290,            // = $24.17/mo
    includedClicks: 100,
    aiMessages: 50,
    overageCostCents: 10,        // flat $0.10/click overage on all paid tiers
    priceIdEnv: "VITE_PRICING_STARTER_PRICE_ID",
    priceIdEnvAnnual: "VITE_PRICING_STARTER_ANNUAL_PRICE_ID"
  },
  pro: {
    key: "pro",
    name: "Pro",
    priceMonthly: 79,
    priceAnnual: 790,            // = $65.83/mo
    includedClicks: 500,
    aiMessages: 200,
    overageCostCents: 10,
    priceIdEnv: "VITE_PRICING_PRO_PRICE_ID",
    priceIdEnvAnnual: "VITE_PRICING_PRO_ANNUAL_PRICE_ID",
    mostPopular: true            // anchor tier — highlighted in the upgrade modal
  },
  scale: {
    key: "scale",
    name: "Scale",
    priceMonthly: 199,
    priceAnnual: 1990,           // = $165.83/mo
    includedClicks: 2500,
    aiMessages: -1,              // -1 = unlimited (with rate-limit enforcement)
    overageCostCents: 10,
    priceIdEnv: "VITE_PRICING_SCALE_PRICE_ID",
    priceIdEnvAnnual: "VITE_PRICING_SCALE_ANNUAL_PRICE_ID"
  }
};

export const PLAN_ORDER = ["free", "starter", "pro", "scale"];

export function planFor(key) {
  return PLANS[key] || PLANS.free;
}

/**
 * Resolve a Stripe Price ID for a plan + cadence ("monthly" | "annual").
 * Returns null if the env var isn't set.
 */
export function resolveStripePriceId(key, cadence = "monthly") {
  const plan = planFor(key);
  const envKey = cadence === "annual" ? plan.priceIdEnvAnnual : plan.priceIdEnv;
  if (!envKey) return null;
  return process.env[envKey] || null;
}

/**
 * Given a Stripe Price id from a webhook, figure out which plan it maps to.
 * Searches across both monthly + annual cadence env vars.
 */
export function planForPriceId(priceId) {
  for (const plan of Object.values(PLANS)) {
    for (const envKey of [plan.priceIdEnv, plan.priceIdEnvAnnual]) {
      if (envKey && process.env[envKey] === priceId) return plan.key;
    }
  }
  return null;
}

/**
 * Client-facing projection. Strips secret env keys, includes resolved
 * monthly + annual Stripe price ids so the modal can offer a cadence toggle.
 */
export function publicPlans() {
  return PLAN_ORDER.map(key => {
    const plan = PLANS[key];
    return {
      key: plan.key,
      name: plan.name,
      priceMonthly: plan.priceMonthly,
      priceAnnual: plan.priceAnnual,
      includedClicks: plan.includedClicks,
      aiMessages: plan.aiMessages,
      overageCostCents: plan.overageCostCents,
      mostPopular: !!plan.mostPopular,
      stripePriceId: resolveStripePriceId(key, "monthly"),
      stripePriceIdAnnual: resolveStripePriceId(key, "annual")
    };
  });
}
