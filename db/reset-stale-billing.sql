-- One-time reset for users whose stripe_customer_id was migrated/healed
-- but whose `plan` is still on a stale value (e.g., "pro" from the old
-- test-mode webhook). After this, hitting "Start free trial" on /plans
-- creates a fresh subscription on the live Stripe account and the
-- webhook flips them back to pro.
--
-- Run in Supabase SQL editor. Replace the email below with the affected
-- user's email — or, to reset ALL users with no stripe_customer_id but
-- a non-free plan (broader sweep), use the second variant.

-- Variant 1 — single user by email
update public.users
set plan = 'free', stripe_customer_id = null
where email = 'YOUR_EMAIL_HERE@example.com'
returning id, email, plan, stripe_customer_id;

-- Variant 2 — sweep any user with a non-free plan but no Stripe customer
-- (denormalized state can drift if you migrate accounts)
-- update public.users
-- set plan = 'free'
-- where plan <> 'free' and stripe_customer_id is null
-- returning id, email, plan;
