# `api/` — Vercel Serverless Functions

This folder is **not wired up yet**. It's a placeholder so the project
structure for Phase 2 of [SAAS_PLAN.md](../SAAS_PLAN.md) is visible.

Each `.js` file in this folder becomes a serverless HTTP endpoint on
Vercel. The path maps 1:1:

| File                                 | URL                                  |
|--------------------------------------|--------------------------------------|
| `api/me.js`                          | `/api/me`                            |
| `api/stripe/checkout.js`             | `/api/stripe/checkout`               |
| `api/stripe/portal.js`               | `/api/stripe/portal`                 |
| `api/stripe/webhook.js`              | `/api/stripe/webhook`                |
| `api/market/listings.js`             | `/api/market/listings`               |
| `api/market/rentals.js`              | `/api/market/rentals`                |

Files whose names start with `_` (like `api/_lib/auth.js`) are **not**
exposed as endpoints — Vercel ignores them. Use them for shared helpers.

## Planned Phase 2 layout

```
api/
├── README.md                    ← you are here
├── _lib/
│   ├── auth.js                  verify Clerk JWT, return { userId, user }
│   ├── db.js                    Supabase service-role client + helpers
│   ├── stripe.js                Stripe client (server)
│   └── metering.js              "can this user spend a click?" policy
├── me.js                        GET /api/me  - current user + usage
├── stripe/
│   ├── checkout.js              POST /api/stripe/checkout    { priceId } → Stripe session url
│   ├── portal.js                POST /api/stripe/portal      → Customer Portal url
│   └── webhook.js               POST /api/stripe/webhook     (Stripe → us)
└── market/
    ├── listings.js              POST /api/market/listings    (metered RentCast proxy)
    └── rentals.js               POST /api/market/rentals     (metered, long-term rentals)
```

## Local dev

Once Phase 2 is in place, run:

```bash
npm install -g vercel       # one-time
vercel link                 # one-time, connect to the Vercel project
vercel dev                  # runs Vite AND serverless functions on :3000
```

`vercel dev` mirrors production routing, so `/api/*` hits the functions
and everything else falls through to the Vite dev server.

## Auth contract

Every function except `stripe/webhook` expects an `Authorization: Bearer <clerk-jwt>` header. The shared helper in `_lib/auth.js` verifies
the token and returns the corresponding row from `public.users`
(creating one on first login).

`stripe/webhook` is authenticated by Stripe's signature instead.
