-- ============================================================================
-- DealTrack SaaS — Supabase (Postgres) schema
--
-- Paste this into Supabase SQL Editor and run. Re-running is idempotent.
--
-- Model:
--   users              - one row per Clerk user, holds Stripe customer id + plan
--   subscriptions      - current subscription state per user
--   usage_events       - append-only log of metered actions (Market Intel clicks)
--   usage_summaries    - per-user per-billing-period counter, atomically updated
--
-- Row-Level Security is enabled on every table. All queries are scoped to
-- the authenticated Clerk user id. Admin writes happen via the service_role
-- key in our API functions only.
-- ============================================================================

begin;

-- ────────────────────────────────────────────────────────────────────────
-- users
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id                    uuid primary key default gen_random_uuid(),
  clerk_user_id         text unique not null,
  email                 text,
  stripe_customer_id    text unique,
  plan                  text not null default 'free'
                        check (plan in ('free', 'starter', 'pro', 'scale')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists users_clerk_user_id_idx on public.users(clerk_user_id);

alter table public.users enable row level security;

-- Users can read their own row. Writes happen only via service role.
drop policy if exists users_self_read on public.users;
create policy users_self_read on public.users
  for select
  using (clerk_user_id = auth.jwt() ->> 'sub');


-- ────────────────────────────────────────────────────────────────────────
-- subscriptions
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.users(id) on delete cascade,
  stripe_subscription_id  text unique,
  stripe_price_id         text,
  status                  text not null
                          check (status in ('active', 'trialing', 'past_due',
                                           'canceled', 'incomplete', 'unpaid', 'paused')),
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_self_read on public.subscriptions;
create policy subscriptions_self_read on public.subscriptions
  for select
  using (
    user_id in (
      select id from public.users where clerk_user_id = auth.jwt() ->> 'sub'
    )
  );


-- ────────────────────────────────────────────────────────────────────────
-- usage_events (append-only log)
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.usage_events (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  kind              text not null,                  -- 'market_intel_click'
  provider          text,                           -- 'rentcast' | 'zillow'
  endpoint          text,                           -- '/v1/listings/sale'
  cost_cents        integer not null default 0,     -- 0 for included-quota, N for overage
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists usage_events_user_created_idx
  on public.usage_events(user_id, created_at desc);

alter table public.usage_events enable row level security;

drop policy if exists usage_events_self_read on public.usage_events;
create policy usage_events_self_read on public.usage_events
  for select
  using (
    user_id in (
      select id from public.users where clerk_user_id = auth.jwt() ->> 'sub'
    )
  );


-- ────────────────────────────────────────────────────────────────────────
-- usage_summaries (atomic per-period counter)
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.usage_summaries (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.users(id) on delete cascade,
  period_start            timestamptz not null,
  period_end              timestamptz not null,
  clicks                  integer not null default 0,
  cost_cents              integer not null default 0,
  last_event_at           timestamptz,
  updated_at              timestamptz not null default now(),
  unique (user_id, period_start)
);

create index if not exists usage_summaries_user_period_idx
  on public.usage_summaries(user_id, period_start desc);

alter table public.usage_summaries enable row level security;

drop policy if exists usage_summaries_self_read on public.usage_summaries;
create policy usage_summaries_self_read on public.usage_summaries
  for select
  using (
    user_id in (
      select id from public.users where clerk_user_id = auth.jwt() ->> 'sub'
    )
  );


-- ────────────────────────────────────────────────────────────────────────
-- watchlist_items (saved listings per user — survives device / sign-out)
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.watchlist_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  listing_id    text not null,       -- stable id from the provider (realtor property_id etc)
  listing_data  jsonb not null,      -- full listing snapshot at save time
  created_at    timestamptz not null default now(),
  unique (user_id, listing_id)
);

create index if not exists watchlist_items_user_created_idx
  on public.watchlist_items(user_id, created_at desc);

alter table public.watchlist_items enable row level security;

drop policy if exists watchlist_items_self_read on public.watchlist_items;
create policy watchlist_items_self_read on public.watchlist_items
  for select
  using (
    user_id in (
      select id from public.users where clerk_user_id = auth.jwt() ->> 'sub'
    )
  );


-- ────────────────────────────────────────────────────────────────────────
-- team_contacts (real-estate team per user — agents, lenders, PMs, etc.)
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.team_contacts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  role        text not null check (role in (
                'agent','lender','property_manager','contractor',
                'inspector','title','insurance','attorney','cpa',
                'wholesaler','other')),
  name        text not null,
  company     text,
  phone       text,
  email       text,
  website     text,
  city        text,
  state       text,
  notes       text,
  rating      integer check (rating is null or (rating >= 1 and rating <= 5)),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists team_contacts_user_idx
  on public.team_contacts(user_id, role);

alter table public.team_contacts enable row level security;

drop policy if exists team_contacts_self_read on public.team_contacts;
create policy team_contacts_self_read on public.team_contacts
  for select
  using (
    user_id in (select id from public.users where clerk_user_id = auth.jwt() ->> 'sub')
  );


-- ────────────────────────────────────────────────────────────────────────
-- market_indexes (snapshot of public research data — Zillow + Redfin)
--
-- Populated by scripts/ingest-market-data.js (monthly cron / manual run).
-- Queried by /api/market/indexes so the county panel can show ZHVI + ZORI
-- + Redfin numbers alongside the metered Realtor data — at zero per-call cost.
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.market_indexes (
  region_type          text not null check (region_type in ('zip', 'county')),
  region_id            text not null,    -- ZIP code or 5-char state+county FIPS
  region_name          text,
  state_code           text,
  zhvi_latest          numeric,
  zhvi_yoy_pct         numeric,
  zori_latest          numeric,
  zori_yoy_pct         numeric,
  redfin_median_price  numeric,
  redfin_median_dom    integer,
  redfin_inventory     integer,
  as_of                date,
  updated_at           timestamptz not null default now(),
  primary key (region_type, region_id)
);

create index if not exists market_indexes_state_idx on public.market_indexes(state_code);

alter table public.market_indexes enable row level security;

-- Readable by anyone authenticated — this is purely aggregated public data
drop policy if exists market_indexes_read on public.market_indexes;
create policy market_indexes_read on public.market_indexes
  for select using (auth.role() = 'authenticated');


-- ────────────────────────────────────────────────────────────────────────
-- helper function: atomic click-increment.
-- Called from the metering middleware. Returns the new running total
-- so the API can also return remaining-quota to the client.
-- ────────────────────────────────────────────────────────────────────────
create or replace function public.record_market_intel_click(
  p_user_id uuid,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_provider text,
  p_endpoint text,
  p_cost_cents integer,
  p_metadata jsonb
)
returns table (clicks integer, cost_cents integer)
language plpgsql
security definer
as $$
declare
  v_clicks integer;
  v_cost   integer;
begin
  insert into public.usage_events (user_id, kind, provider, endpoint, cost_cents, metadata)
  values (p_user_id, 'market_intel_click', p_provider, p_endpoint, p_cost_cents, p_metadata);

  insert into public.usage_summaries (user_id, period_start, period_end, clicks, cost_cents, last_event_at)
  values (p_user_id, p_period_start, p_period_end, 1, p_cost_cents, now())
  on conflict (user_id, period_start)
  do update set
    clicks        = public.usage_summaries.clicks + 1,
    cost_cents    = public.usage_summaries.cost_cents + excluded.cost_cents,
    last_event_at = now(),
    updated_at    = now()
  returning public.usage_summaries.clicks, public.usage_summaries.cost_cents
    into v_clicks, v_cost;

  return query select v_clicks, v_cost;
end;
$$;

commit;

-- ============================================================================
-- Notes:
--
-- 1. `auth.jwt() ->> 'sub'` relies on the Supabase + Clerk integration that
--    injects the Clerk user id into the JWT `sub` claim. Turn on the Clerk
--    integration in Supabase Auth → Providers, or use a JWT template that
--    maps Clerk's user id to the `sub` field.
--
-- 2. `security definer` on the RPC means the function runs with the
--    privileges of the owner (typically postgres) so it can write regardless
--    of RLS. The API layer must verify the caller matches `p_user_id`
--    BEFORE calling this function.
--
-- 3. If you want to reset usage for a test user:
--      update public.users set plan = 'free' where email = 'test@example.com';
--      delete from public.usage_summaries where user_id = (...);
-- ============================================================================
