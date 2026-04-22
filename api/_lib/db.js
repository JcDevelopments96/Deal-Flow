/**
 * Supabase client for API functions. We use the SERVICE ROLE key which
 * bypasses Row-Level Security — the API is the admin layer that writes
 * user + usage rows on behalf of authenticated Clerk users.
 *
 * Never import this from client-side code.
 */
import { createClient } from "@supabase/supabase-js";
import { ApiError } from "./errors.js";

let _client;

export function adminDb() {
  if (_client) return _client;

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new ApiError(503, "db_not_configured",
      "Set VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in Vercel env.");
  }

  _client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  return _client;
}

/**
 * Ensure there's a `users` row for this Clerk user. Idempotent; safe to
 * call on every authenticated request. Returns the row.
 */
export async function ensureUser({ clerkUserId, email }) {
  const db = adminDb();

  const { data: existing, error: readErr } = await db
    .from("users")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  if (readErr) throw new ApiError(500, "db_read_failed", readErr.message);

  if (existing) {
    // Backfill email if we didn't have it yet and now we do.
    if (!existing.email && email) {
      await db.from("users").update({ email }).eq("id", existing.id);
      existing.email = email;
    }
    return existing;
  }

  const { data: inserted, error: insertErr } = await db
    .from("users")
    .insert({ clerk_user_id: clerkUserId, email, plan: "free" })
    .select()
    .single();
  if (insertErr) throw new ApiError(500, "db_insert_failed", insertErr.message);

  return inserted;
}
