/* ============================================================================
   SaaS client helpers
   ---------------------------------------------------------------------------
   - `isSaasMode()` — Clerk is configured; the app should route Market Intel
     requests through our /api/market/* proxy instead of the direct BYOK flow.
   - `useSaasUser()` — React hook that loads /api/me once per sign-in and
     exposes the user + usage snapshot. Refetches on demand after a click.
   - `fetchMetered()` — low-level helper that attaches the Clerk JWT and
     maps 402 responses to a `QuotaExceededError` the UI can catch.
   ============================================================================ */
import { useEffect, useState, useCallback } from "react";
import { useAuth, useUser } from "@clerk/react";

// The only hard signal we use to decide whether the app should run in SaaS
// mode is "Clerk is configured". If the build didn't have the publishable
// key, auth itself is disabled and the app runs as a standalone tool.
export const isSaasMode = () => Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

export class QuotaExceededError extends Error {
  constructor(detail) {
    super("quota_exceeded");
    this.detail = detail || {};
  }
}

export class ApiRequestError extends Error {
  constructor(status, code, detail) {
    super(code || "request_failed");
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

/**
 * Authenticated fetch. Throws QuotaExceededError on 402, ApiRequestError on
 * other non-2xx. Returns parsed JSON body on success.
 */
export async function fetchMetered(getToken, path, opts = {}) {
  const token = await getToken();
  if (!token) throw new ApiRequestError(401, "not_signed_in");

  const res = await fetch(path, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": opts.body ? "application/json" : undefined
    }
  });

  if (res.status === 402) {
    const body = await res.json().catch(() => ({}));
    throw new QuotaExceededError(body.detail);
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiRequestError(res.status, body.error, body.detail);
  }
  return body;
}

/**
 * Load + cache /api/me. Exposes a `refetch()` so callers can refresh after a
 * click (so the UsageMeter updates) and a `setUsageLocally()` for when a
 * metered endpoint returned its own up-to-date usage snapshot (saves a round
 * trip).
 */
export function useSaasUser() {
  const { isLoaded: authLoaded, isSignedIn, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const [data, setData] = useState(null);      // { user, usage, plans }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!authLoaded || !isSignedIn) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = await fetchMetered(getToken, "/api/me");
      setData(body);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [authLoaded, isSignedIn, getToken]);

  useEffect(() => { load(); }, [load]);

  const setUsageLocally = useCallback((usage) => {
    setData(prev => (prev ? { ...prev, usage: { ...prev.usage, ...usage } } : prev));
  }, []);

  return {
    loading,
    error,
    user: data?.user || null,
    usage: data?.usage || null,
    plans: data?.plans || null,
    clerkUser,
    refetch: load,
    setUsageLocally,
    getToken
  };
}

/**
 * Typed wrappers around the two metered endpoints. Both return
 * `{ listings | rentals, usage }`. Callers can pass the `usage` straight
 * into `useSaasUser().setUsageLocally(usage)` to keep the meter in sync.
 */
export async function fetchSaleListings(getToken, { city, state, bedrooms, bathrooms, limit }) {
  const qs = new URLSearchParams({ city, state });
  if (bedrooms) qs.set("bedrooms", bedrooms);
  if (bathrooms) qs.set("bathrooms", bathrooms);
  if (limit) qs.set("limit", String(limit));
  return fetchMetered(getToken, `/api/market/listings?${qs.toString()}`);
}

export async function fetchRentalListings(getToken, { city, state, bedrooms, bathrooms, limit }) {
  const qs = new URLSearchParams({ city, state });
  if (bedrooms) qs.set("bedrooms", bedrooms);
  if (bathrooms) qs.set("bathrooms", bathrooms);
  if (limit) qs.set("limit", String(limit));
  return fetchMetered(getToken, `/api/market/rentals?${qs.toString()}`);
}
