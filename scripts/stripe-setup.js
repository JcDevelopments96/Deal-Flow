/* ============================================================================
   ONE-SHOT STRIPE SETUP — creates Deal Docket's Pro product + prices and
   the webhook endpoint in either test or live Stripe mode, then prints
   the four env-var lines you need to paste into Vercel.

   USAGE (easiest — recommended):
     1. Create a file at the repo root called ".stripe-key" (no extension)
     2. Paste your full secret key (sk_test_... or sk_live_...) into it
        and save. Just the key on one line, nothing else.
     3. Run:  node scripts/stripe-setup.js
     The file is in .gitignore so the key never gets committed. Delete
     it after you're done.

   USAGE (alternative — env var):
     STRIPE_SECRET_KEY=sk_test_xxx node scripts/stripe-setup.js
     ($env:STRIPE_SECRET_KEY="sk_test_xxx"; node scripts/stripe-setup.js  in PowerShell)

   Idempotent — re-running won't create duplicates. Products are looked up
   by metadata.dealtrack_key, prices by amount + interval, the webhook by
   URL. The webhook signing secret is only revealed by Stripe at creation
   time; if a webhook already exists at our URL, the script reminds you
   that the saved secret in Vercel is still valid (no need to re-paste).
   ============================================================================ */

import Stripe from "stripe";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Read the key from .stripe-key file (preferred) OR env var (fallback).
const __dirname = dirname(fileURLToPath(import.meta.url));
const keyFilePath = resolve(__dirname, "..", ".stripe-key");

let KEY = process.env.STRIPE_SECRET_KEY || "";
if (!KEY && existsSync(keyFilePath)) {
  KEY = readFileSync(keyFilePath, "utf8").trim();
}

if (!KEY) {
  console.error("❌  No Stripe secret key found.");
  console.error("");
  console.error("    Easiest fix: create a file at the repo root called .stripe-key");
  console.error("    (no extension), paste your sk_test_... or sk_live_... into it,");
  console.error("    save, then re-run:  node scripts/stripe-setup.js");
  console.error("");
  console.error("    Get a key at https://dashboard.stripe.com/test/apikeys (test)");
  console.error("    or https://dashboard.stripe.com/apikeys (live).");
  process.exit(1);
}
if (!KEY.startsWith("sk_")) {
  console.error(`❌  That doesn't look like a Stripe secret key (must start with sk_test_ or sk_live_).`);
  console.error(`    Got: ${KEY.slice(0, 10)}...`);
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

// Single Pro plan — matches api/_lib/plans.js. Free is handled in-app
// (no Stripe product needed for $0). If you ever add a Team / Scale tier
// back, drop another entry into this array.
const PLANS = [
  {
    key: "pro",
    name: "Deal Docket Pro",
    description: "All-in-one toolkit for real estate investors — unlimited deals + inspections, off-market lead finder, BRRRR analyzer, AI inspection summaries. 7-day free trial.",
    monthly: 4900,     // $49.00
    annual:  49000     // $490.00 — 2 months free
  }
];

// Note: must use www. — the apex redirects to www and Stripe webhooks
// don't follow 3xx redirects (they treat the 308 as a delivery failure).
const WEBHOOK_URL = "https://www.dealdocket.ai/api/stripe/webhook";
const WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed"
];

async function findOrCreateProduct(plan) {
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
    lookup_key,
    metadata: { dealtrack_key: lookup_key }
  });
  console.log(`     ✓  Created price ${created.id} ($${unit_amount/100} / ${interval})`);
  return created;
}

async function findOrCreateWebhook() {
  // Look for an existing webhook pointing at our URL.
  const list = await stripe.webhookEndpoints.list({ limit: 100 });
  const existing = list.data.find(w => w.url === WEBHOOK_URL);
  if (existing) {
    console.log(`   ↺  Reusing existing webhook ${existing.id} (${WEBHOOK_URL})`);
    return { endpoint: existing, secretRevealed: false };
  }
  const created = await stripe.webhookEndpoints.create({
    url: WEBHOOK_URL,
    enabled_events: WEBHOOK_EVENTS,
    description: "Deal Docket — subscription + checkout events"
  });
  console.log(`   ✓  Created webhook ${created.id} (${WEBHOOK_URL})`);
  return { endpoint: created, secretRevealed: true };
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

console.log(`▸  Webhook endpoint`);
const { endpoint: webhook, secretRevealed } = await findOrCreateWebhook();
if (secretRevealed) {
  envLines["STRIPE_WEBHOOK_SECRET"] = webhook.secret;
}
console.log("");

console.log("=".repeat(72));
console.log(`✅  Done. Paste these into Vercel → Settings → Environment Variables`);
console.log(`    (Environment: ${isLive ? "PRODUCTION" : "PREVIEW + DEVELOPMENT"}).`);
console.log(`    Then redeploy.\n`);

console.log(`STRIPE_SECRET_KEY=${KEY.slice(0, 12)}…   (paste the FULL key from your dashboard)`);
for (const [k, v] of Object.entries(envLines)) {
  console.log(`${k}=${v}`);
}
if (!secretRevealed) {
  console.log(``);
  console.log(`ℹ️   STRIPE_WEBHOOK_SECRET wasn't reprinted because the webhook already`);
  console.log(`    existed (Stripe only reveals signing secrets at creation time).`);
  console.log(`    If you don't have it saved in Vercel from before, delete the`);
  console.log(`    endpoint at https://dashboard.stripe.com/${isLive ? "" : "test/"}webhooks`);
  console.log(`    and re-run this script — it'll create a fresh one and print`);
  console.log(`    the new secret.`);
}
console.log("");

if (isLive) {
  console.log("📌  Live-mode checklist:");
  console.log("    1. Verify the env var values above in Vercel (Production scope)");
  console.log("    2. Redeploy from the Vercel dashboard so changes take effect");
  console.log("    3. Stripe → Settings → Billing → Customer portal → Activate (live)");
  console.log("       Allow: cancel · update payment · update plan · view invoices");
  console.log("    4. Test the full flow end-to-end with a real card on a free account");
  console.log("");
}
