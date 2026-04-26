/* ============================================================================
   COMP-USER — flip a single user to a paid plan without involving Stripe.
   Useful for comping friends, beta testers, yourself, or anyone you want
   to give free access to.

   USAGE:
     SUPABASE_URL=https://xxx.supabase.co \
     SUPABASE_SERVICE_ROLE_KEY=eyJ... \
       node scripts/comp-user.js someone@example.com pro

   ARGUMENTS:
     1. email   — the user's email address (must match what they signed up with)
     2. plan    — "free" | "starter" | "pro" | "scale"

   The Stripe webhook only touches users with a stripe_customer_id, so a
   comped user keeps their assigned plan forever — until either you re-run
   this script with a different value or they go through Stripe checkout
   themselves (which will then take precedence).
   ============================================================================ */

import { createClient } from "@supabase/supabase-js";

const VALID_PLANS = ["free", "starter", "pro", "scale"];

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("❌  Missing SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY env vars.");
  console.error("    Both are required. Find them in your Vercel env or Supabase dashboard.");
  process.exit(1);
}

const [, , emailArg, planArg] = process.argv;
if (!emailArg || !planArg) {
  console.error("❌  Usage: node scripts/comp-user.js <email> <plan>");
  console.error("    Plans: " + VALID_PLANS.join(" | "));
  process.exit(1);
}
const email = emailArg.toLowerCase().trim();
const plan  = planArg.toLowerCase().trim();
if (!VALID_PLANS.includes(plan)) {
  console.error(`❌  Invalid plan "${plan}". Must be one of: ${VALID_PLANS.join(", ")}`);
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const { data: user, error: findErr } = await db
  .from("users")
  .select("id, email, plan, stripe_customer_id, created_at")
  .ilike("email", email)
  .maybeSingle();

if (findErr) {
  console.error("❌  DB lookup failed:", findErr.message);
  process.exit(1);
}
if (!user) {
  console.error(`❌  No user found with email "${email}".`);
  console.error("    Have them sign up first at your production URL, then re-run this.");
  process.exit(1);
}

console.log(`▸  Found user ${user.id}`);
console.log(`   Email:   ${user.email}`);
console.log(`   Current: ${user.plan}`);
console.log(`   Stripe:  ${user.stripe_customer_id || "none (this is a free comp)"}`);
console.log(`   New:     ${plan}\n`);

if (user.stripe_customer_id) {
  console.warn("⚠️   Heads up: this user has an active Stripe customer record.");
  console.warn("    The next Stripe webhook (subscription.updated, invoice.paid, etc.)");
  console.warn("    will overwrite this comp with whatever Stripe says they're paying for.");
  console.warn("    For a permanent comp, cancel their Stripe subscription first.\n");
}

const { error: updateErr } = await db
  .from("users")
  .update({ plan, updated_at: new Date().toISOString() })
  .eq("id", user.id);

if (updateErr) {
  console.error("❌  Update failed:", updateErr.message);
  process.exit(1);
}

console.log(`✅  ${email} is now on the "${plan}" plan.`);
console.log(`    They'll see the change on next page load or by clicking refresh.`);
