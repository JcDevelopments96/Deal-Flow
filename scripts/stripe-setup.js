/* ============================================================================
   ONE-SHOT STRIPE SETUP — creates DealTrack's products and prices in
   either test or live Stripe mode, then prints the env-var lines you need
   to paste into Vercel.

   USAGE (live):
     STRIPE_SECRET_KEY=sk_live_xxx node scripts/stripe-setup.js

   USAGE (test):
     STRIPE_SECRET_KEY=sk_test_xxx node scripts/stripe-setup.js

   The script is IDEMPOTENT — it keys products by metadata.dealtrack_key
   so re-running it won't create duplicates. Prices are immutable in
   Stripe, so if you change a price amount you'll get a NEW price ID and
   the old one stays inactive (Stripe doesn't let you delete prices).

   Make sure you're in the right Stripe mode before running:
     - sk_live_… touches real money. Triple-check before hitting enter.
     - sk_test_… is sandbox; safe to re-run.
   ============================================================================ */

import Stripe from "stripe";

const KEY = process.env.STRIPE_SECRET_KEY;
if (!KEY) {
  console.error("❌  Missing STRIPE_SECRET_KEY env var.");
  console.error("    Run with: STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-setup.js");
  process.exit(1);
}
const isLive = KEY.startsWith("sk_live_");
const mode = isLive ? "LIVE" : "TEST";

if (isLive) {
  console.log("⚠️   You're about to create products in LIVE mode (real money).");
  console.log("    Sleeping 5s — Ctrl-C to abort.\n");
  await new Promise(r => setTimeout(r, 5000));
}

const stripe = new Stripe(KEY, { apiVersion: "2024-06-20" });

// Plan catalog — keep in sync with api/_lib/plans.js
const PLANS = [
  {
    key: "starter",
    name: "DealTrack Starter",
    description: "100 Market Intel clicks/mo · Wholesale, Watchlist, Team CRM included",
    monthly: 2900,    // $29.00 in cents
    annual:  29000    // $290.00 in cents (~17% off — 2 months free)
  },
  {
    key: "pro",
    name: "DealTrack Pro",
    description: "500 Market Intel clicks/mo · Most popular for active investors",
    monthly: 7900,    // $79.00
    annual:  79000    // $790.00
  },
  {
    key: "scale",
    name: "DealTrack Scale",
    description: "2,500 Market Intel clicks/mo · Unlimited Ari assistant",
    monthly: 19900,   // $199.00
    annual:  199000   // $1,990.00
  }
];

async function findOrCreateProduct(plan) {
  // Look for existing product with our metadata key (idempotent re-runs).
  const search = await stripe.products.search({
    query: `active:'true' AND metadata['dealtrack_key']:'${plan.key}'`,
    limit: 5
  });
  if (search.data.length > 0) {
    console.log(`   ↺  Reusing existing product ${search.data[0].id} (${plan.name})`);
    return search.data[0];
  }
  const created = await stripe.products.create({
    name: plan.name,
    description: plan.description,
    metadata: { dealtrack_key: plan.key }
  });
  console.log(`   ✓  Created product ${created.id} (${plan.name})`);
  return created;
}

async function findOrCreatePrice(product, { unit_amount, interval, lookup_key }) {
  // Try to find a matching active price first
  const list = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 100
  });
  const match = list.data.find(p =>
    p.unit_amount === unit_amount &&
    p.recurring?.interval === interval &&
    p.currency === "usd"
  );
  if (match) {
    console.log(`     ↺  Reusing price ${match.id} ($${unit_amount/100} / ${interval})`);
    return match;
  }
  const created = await stripe.prices.create({
    product: product.id,
    unit_amount,
    currency: "usd",
    recurring: { interval },
    lookup_key, // human-friendly handle for finding later
    metadata: { dealtrack_key: lookup_key }
  });
  console.log(`     ✓  Created price ${created.id} ($${unit_amount/100} / ${interval})`);
  return created;
}

console.log(`\n🟪  STRIPE SETUP — ${mode} mode\n`);

const envLines = {};

for (const plan of PLANS) {
  console.log(`▸  ${plan.name}`);
  const product = await findOrCreateProduct(plan);

  const monthly = await findOrCreatePrice(product, {
    unit_amount: plan.monthly,
    interval: "month",
    lookup_key: `dealtrack_${plan.key}_monthly`
  });
  const annual = await findOrCreatePrice(product, {
    unit_amount: plan.annual,
    interval: "year",
    lookup_key: `dealtrack_${plan.key}_annual`
  });

  const upper = plan.key.toUpperCase();
  envLines[`VITE_PRICING_${upper}_PRICE_ID`]        = monthly.id;
  envLines[`VITE_PRICING_${upper}_ANNUAL_PRICE_ID`] = annual.id;

  console.log("");
}

console.log("=".repeat(72));
console.log(`✅  Done. Paste these into Vercel → Settings → Environment Variables`);
console.log(`    (Environment: PRODUCTION). Then Redeploy with cache disabled.\n`);
for (const [k, v] of Object.entries(envLines)) {
  console.log(`${k}=${v}`);
}
console.log("");

if (isLive) {
  console.log("📌  Don't forget the rest of the live-mode swap:");
  console.log("    1. Set STRIPE_SECRET_KEY in Vercel to your sk_live_… key");
  console.log("    2. In Stripe → Developers → Webhooks → Add endpoint:");
  console.log("       URL:    https://<your-prod-domain>/api/stripe/webhook");
  console.log("       Events: checkout.session.completed,");
  console.log("               customer.subscription.created,");
  console.log("               customer.subscription.updated,");
  console.log("               customer.subscription.deleted,");
  console.log("               invoice.payment_succeeded,");
  console.log("               invoice.payment_failed");
  console.log("       Then copy the whsec_… signing secret into Vercel as");
  console.log("       STRIPE_WEBHOOK_SECRET.");
  console.log("    3. Stripe → Settings → Billing → Customer portal → Activate (live)");
  console.log("       Allow: cancel · update payment · update plan · view invoices");
  console.log("");
}
