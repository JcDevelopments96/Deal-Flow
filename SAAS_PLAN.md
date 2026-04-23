# DealTrack SaaS — Plan

Metered subscription. Users pay DealTrack; DealTrack pays the upstream
data providers (RentCast / Zillow).

---

## Pricing (starting point — tune after data comes in)

| Plan | Price | Market Intel clicks/mo | Overage | Notes |
|---|---|---|---|---|
| **Free** | $0 | 0 (paid feature) | blocked | signup only — no Market Intel access |
| **Starter** | $19 / mo | 250 | $0.15 / click | small-scale investors |
| **Pro** | $49 / mo | 1,000 | $0.10 / click | typical BRRRR operator |
| **Scale** | $149 / mo | 5,000 | $0.05 / click | wholesalers, teams |

Market Intel is gated behind a paid plan. Free accounts can still use the
rest of the app (Dashboard, Analyzer, Calculator, Watchlist, Education);
Market Intel surfaces a paywall banner instead of live listings.

"Click" = one request that actually hits RentCast/Zillow's paid API.
Pan/zoom, state filters, and cached results do **not** consume credit.

RentCast free tier is 50 requests/month — every click beyond that is a real
unit cost to DealTrack. The pricing above assumes mostly RentCast Growth
plan ($129/mo for 2,500 requests = $0.052 per request cost), with a small
margin at Starter and healthy margin at Pro/Scale.

---

## Stack

Picked to move fast without locking into anything weird:

| Concern | Choice | Why |
|---|---|---|
| Auth | **Clerk** | Drop-in React components, handles signup/login/password-reset/email-verify out of the box. Free up to 10k MAUs. |
| DB | **Supabase** (Postgres) | One service for Postgres + row-level security. Free tier easily covers early usage. Can swap for raw Postgres later if needed. |
| Billing | **Stripe Billing** | Industry standard. Subscription + metered usage is a first-class Stripe pattern. |
| Backend | **Vercel Functions** | Already deploying to Vercel. Zero new infra. Good cold-start story. |
| API proxy | **DealTrack edge functions** | We hold the RentCast/Zillow keys; users never see them. Metering happens server-side in the same function. |

---

## How a Market Intel click flows end-to-end

```
Browser                        Vercel function                Supabase          Stripe
───────                        ───────────────                ────────          ──────
1.  User clicks a county
2.  Clerk JWT → POST /api/market/listings
                              → verify JWT
                              → load user's subscription + usage
                                                                 ← row
3.                            → if over quota: 402 Payment Required
4.                            → RentCast fetch (our key)
                              ← listings
                              → write usage_event row
                                                                 ← ok
                              → (if metered plan) report usage to Stripe
                                                                              ← ok
5.                            ← 200 with listings + remaining quota
6.  UI re-renders with listings + updated counter
```

Key property: **the click counter lives server-side**. Nothing in the
browser can spend or dodge a click.

---

## Database schema (Supabase Postgres)

See [`db/schema.sql`](db/schema.sql). Summary:

- `users` — one row per user. `clerk_user_id` UNIQUE. Holds `stripe_customer_id`, `plan`, billing period start.
- `subscriptions` — current plan + Stripe subscription id + status per user.
- `usage_events` — append-only log of clicks. `user_id`, `kind`, `cost_cents`, `created_at`, `metadata jsonb` (what market, provider, etc).
- `usage_summaries` — materialized counter per (user, billing_period). Updated atomically on each click. This is what the UI reads for "X clicks left".

Row-level security is on: every query is automatically scoped to the
current `auth.uid()` (a Clerk user id). No cross-tenant leaks possible
even if we mess up a query.

---

## Environment variables needed

See [`.env.example`](.env.example). At a minimum:

**Client (prefixed `VITE_`)** — safe to ship to the browser:
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk's public key
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase public endpoint + anon key (protected by RLS)
- `VITE_STRIPE_PUBLISHABLE_KEY` — Stripe's public key
- `VITE_PRICING_STARTER_PRICE_ID`, `VITE_PRICING_PRO_PRICE_ID`, `VITE_PRICING_SCALE_PRICE_ID` — for checkout

**Server (no prefix)** — must stay in Vercel env, never in browser:
- `CLERK_SECRET_KEY` — verifies JWTs on the API side
- `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS for admin ops (user creation, usage writes)
- `STRIPE_SECRET_KEY` — Stripe server-side API
- `STRIPE_WEBHOOK_SECRET` — verifies webhook payloads
- `RENTCAST_API_KEY` — the **DealTrack master key**; users never see it
- `RAPIDAPI_ZILLOW_KEY` — same for Zillow

---

## Setup checklist (user steps)

These cannot be automated — they require your credentials.

### 1. Clerk (5 min)
1. Sign up at https://clerk.com
2. Create an application, pick "Development" environment
3. Copy **Publishable Key** → `VITE_CLERK_PUBLISHABLE_KEY`
4. Copy **Secret Key** → `CLERK_SECRET_KEY`

### 2. Supabase (10 min)
1. Sign up at https://supabase.com
2. Create a project (pick a close region)
3. Settings → API: copy **Project URL** → `VITE_SUPABASE_URL`
4. Copy **anon / public key** → `VITE_SUPABASE_ANON_KEY`
5. Copy **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
6. SQL editor → paste contents of `db/schema.sql` → run
7. (Optional) Enable the Supabase Clerk integration for JWT auth

### 3. Stripe (15 min)
1. Sign up at https://stripe.com (start in **test mode**)
2. Create three Products: Starter, Pro, Scale
3. For each product, create a recurring Price ($19, $49, $149) with **usage-based metering** turned on (meter name: `market_intel_click`, aggregation `sum`)
4. Copy each price's `price_...` id → `VITE_PRICING_{TIER}_PRICE_ID`
5. Developers → API keys: copy **Secret key** → `STRIPE_SECRET_KEY`
6. Copy **Publishable key** → `VITE_STRIPE_PUBLISHABLE_KEY`
7. Developers → Webhooks: add endpoint `https://yourdomain/api/stripe/webhook`, subscribe to `customer.subscription.*` and `invoice.payment_succeeded` events, copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### 4. RentCast (if not already done)
1. Sign up, subscribe to a paid plan matching your expected monthly click volume
2. Copy API key → `RENTCAST_API_KEY`

### 5. Vercel env
Add every variable listed above to Vercel's project → Settings → Environment
Variables. Redeploy.

---

## Implementation phases

### Phase 1 — Foundation (this commit)

✅ `SAAS_PLAN.md` (this file)
✅ `.env.example` — documented env vars
✅ `db/schema.sql` — Supabase schema
✅ `api/` folder structure with README

**No runtime changes. No new dependencies.** The deal tracker works
exactly as it does today.

### Phase 2 — Backend runtime (separate commit, after user signs up)

New dependencies needed (approve before install):
- `@clerk/react` — frontend auth components (already installed)
- `@clerk/backend` — verify JWTs in serverless functions
- `stripe` — server SDK (webhook signature verification)
- `@supabase/supabase-js` — DB client

New files:
- `api/_lib/auth.js` — verify Clerk JWT, return user
- `api/_lib/db.js` — Supabase client helpers
- `api/_lib/stripe.js` — Stripe client helper
- `api/_lib/metering.js` — the "can this user spend a click?" logic
- `api/me.js` — current user's subscription + usage
- `api/stripe/checkout.js` — create Checkout session for upgrade
- `api/stripe/portal.js` — create Customer Portal session
- `api/stripe/webhook.js` — handle subscription lifecycle
- `api/market/listings.js` — metered RentCast proxy (replaces direct fetch)
- `api/market/rentals.js` — same for rentals

### Phase 3 — Frontend integration

- Wrap `<App>` in `<ClerkProvider>`
- Add `<SignedIn>/<SignedOut>` gates around Market Intel
- `LiveListingsPanel` calls our proxy endpoints instead of fetching RentCast directly
- Remove the "bring your own API key" UI — users never see keys now
- `<UsageMeter>` in the Market Intel header: "34 / 250 clicks this period"
- `<UpgradeModal>` shown when a free user hits the limit, with Stripe Checkout buttons
- `<BillingPage>` (new Settings view) with current plan + Customer Portal link

### Phase 4 — Polish

- Analytics (Posthog or similar) for conversion funnel
- Email notifications via Clerk / Postmark for over-limit, payment failed
- Admin dashboard (own Clerk role) to view all users + manual plan overrides
- Annual pricing discount
- Referral credit

---

## Threat model — what could go wrong

| Attack | Mitigation |
|---|---|
| User edits JS to skip the metering endpoint | The map's click handler calls `/api/market/*`; there's no client-side RentCast call to re-enable. Client-side code can't get real listings without hitting the meter. |
| User finds RentCast key in bundle | Key lives only in Vercel env, never in `VITE_*`-prefixed vars. Never shipped to the client. |
| User refunds chargebacks the subscription | Stripe webhook flips `status` on our `subscriptions` row → metering function starts returning 402. |
| Click-counter race condition (user fires 100 clicks in parallel) | Usage upsert uses a transactional `INSERT ... ON CONFLICT DO UPDATE` against `usage_summaries`; Postgres serializes it. |
| Free user creates many accounts to re-use the free tier | Clerk allows anonymous-looking signups but requires email verification. Rate limit by IP + email domain. Acceptable for MVP. |
| Someone scrapes the app with a headless browser | Rate-limit metering endpoint per user (Cloudflare / Vercel middleware). Still costs them money per click; if they're willing to pay, we're happy to sell. |

---

## What this does NOT include (deliberate)

- **Annual billing / discount** — add in Phase 4
- **Team accounts / multi-seat** — add once someone asks
- **Role-based access within a team** — later
- **In-app admin console** — later, use Supabase studio for now
- **On-prem / self-hosted** — no
- **Data retention / GDPR export** — required for EU users eventually, not blocking MVP

---

## How I'd ship it

1. **This commit** — foundation only (docs, schema, env template). Merge or not; no behavior change.
2. **Phase 2 commit** — wire up backend with the 4 new dependencies. Feature-flag the SaaS mode so if env vars are missing, the app still works as a standalone single-user tool.
3. **Phase 3 commit** — gate Market Intel behind auth + usage. This is the commit where the current free-for-all experience changes.
4. **Manual step** — flip the feature flag on in prod, announce to users.
