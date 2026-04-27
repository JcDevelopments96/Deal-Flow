/**
 * Authoritative plan definitions. The frontend reads a public projection
 * via /api/me — never trust the client's claimed plan.
 *
 * Pricing model (April 2026 redesign):
 *   - Free includes 10 Market Intel clicks/mo + access to the full toolkit,
 *     but caps at 1 saved deal + 1 inspection report — those caps are the
 *     primary upgrade trigger
 *   - One paid tier: Pro at $49/mo. Cleaner buyer decision, easier to message,
 *     and matches our actual user segment (individual investors). Team /
 *     Scale gets added back when there's real demand for multi-seat.
 *   - Legacy "starter" and "scale" plan keys are still honored — existing
 *     subscribers grandfather into Pro-equivalent access until they next
 *     manage billing. New checkouts only target Pro.
 *   - Annual cadence at ~17% discount (2 months free) sold via separate Stripe Price
 *
 * Both monthly and annual cadences point to the SAME plan key under the hood —
 * the only difference is which Stripe Price they're billed against.
 */

const PRO_PRICE_MONTHLY = 49;
const PRO_PRICE_ANNUAL  = 490;            // = $40.83/mo (2 months free)

// Pro features in one place so legacy plan aliases stay in sync.
const PRO_FEATURES = {
  includedClicks: 500,
  aiMessages: 200,
  dealCap: null,                          // unlimited
  inspectionCap: null,                    // unlimited
  overageCostCents: 10
};

export const PLANS = {
  free: {
    key: "free",
    name: "Free",
    priceMonthly: 0,
    priceAnnual: 0,
    includedClicks: 10,          // taste of every paid feature; deal cap is the upgrade gate
    aiMessages: 2,               // soft cap on Ari conversations (not yet enforced server-side)
    dealCap: 1,                  // saved-deal limit — second deal triggers the upgrade modal
    inspectionCap: 1,            // lifetime inspection limit — caps Anthropic spend per free user
    overageCostCents: null,      // free plan blocks at quota → 402 → upgrade modal
    priceIdEnv: null,
    priceIdEnvAnnual: null
  },
  pro: {
    key: "pro",
    name: "Pro",
    priceMonthly: PRO_PRICE_MONTHLY,
    priceAnnual: PRO_PRICE_ANNUAL,
    ...PRO_FEATURES,
    priceIdEnv: "VITE_PRICING_PRO_PRICE_ID",
    priceIdEnvAnnual: "VITE_PRICING_PRO_ANNUAL_PRICE_ID",
    mostPopular: true
  },
  /* ── Legacy plan aliases (hidden from PLAN_ORDER) ────────────────────
   * Existing Stripe subscriptions on the old Starter / Scale prices keep
   * working — planFor() returns Pro-equivalent features so users on those
   * plans don't lose access. We don't sell these anymore (PLAN_ORDER skips
   * them) and the Stripe portal only offers Pro for new subscriptions. */
  starter: {
    key: "starter", name: "Starter (legacy)",
    priceMonthly: 29, priceAnnual: 290,
    ...PRO_FEATURES,
    priceIdEnv: "VITE_PRICING_STARTER_PRICE_ID",
    priceIdEnvAnnual: "VITE_PRICING_STARTER_ANNUAL_PRICE_ID",
    hidden: true
  },
  scale: {
    key: "scale", name: "Scale (legacy)",
    priceMonthly: 199, priceAnnual: 1990,
    ...PRO_FEATURES,
    aiMessages: -1,              // grandfathered scale users keep their unlimited Ari
    priceIdEnv: "VITE_PRICING_SCALE_PRICE_ID",
    priceIdEnvAnnual: "VITE_PRICING_SCALE_ANNUAL_PRICE_ID",
    hidden: true
  }
};

// Public-facing tier order. Legacy plans are hidden from the picker but
// remain resolvable by planFor() so grandfathered users keep access.
export const PLAN_ORDER = ["free", "pro"];

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
 * Searches across both monthly + annual cadence env vars, including the
 * legacy starter/scale env vars so existing subscriber webhooks resolve.
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
 * Honors PLAN_ORDER so hidden legacy plans never reach the UI.
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
      dealCap: plan.dealCap ?? null,
      inspectionCap: plan.inspectionCap ?? null,
      overageCostCents: plan.overageCostCents,
      mostPopular: !!plan.mostPopular,
      stripePriceId: resolveStripePriceId(key, "monthly"),
      stripePriceIdAnnual: resolveStripePriceId(key, "annual")
    };
  });
}
