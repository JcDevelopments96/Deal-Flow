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
  const qs = new URLSearchParams({ state });
  if (city) qs.set("city", city); // omit entirely for state-wide query — server supports it
  if (bedrooms) qs.set("bedrooms", bedrooms);
  if (bathrooms) qs.set("bathrooms", bathrooms);
  if (limit) qs.set("limit", String(limit));
  return fetchMetered(getToken, `/api/market/listings?${qs.toString()}`);
}


/* ── Watchlist (per-user, survives sign-out) ─────────────────────────── */

export async function fetchWatchlist(getToken) {
  const body = await fetchMetered(getToken, "/api/watchlist");
  return body.items || [];
}

export async function saveWatchlistItem(getToken, listing) {
  return fetchMetered(getToken, "/api/watchlist", {
    method: "POST",
    body: JSON.stringify({ listing })
  });
}

export async function removeWatchlistItem(getToken, listingId) {
  const qs = new URLSearchParams({ listingId: String(listingId) });
  return fetchMetered(getToken, `/api/watchlist?${qs.toString()}`, { method: "DELETE" });
}

/* ── Wholesaling (ATTOM + BatchSkipTracing + Resend) ─────────────────── */

export async function searchWholesaleLeads(getToken, { zip, minYearsOwned, absenteeOnly, limit }) {
  return fetchMetered(getToken, "/api/wholesale?action=search", {
    method: "POST",
    body: JSON.stringify({ zip, minYearsOwned, absenteeOnly, limit })
  });
}

export async function listWholesaleLeads(getToken) {
  const body = await fetchMetered(getToken, "/api/wholesale?action=leads");
  return body.leads || [];
}

export async function saveWholesaleLead(getToken, property) {
  return fetchMetered(getToken, "/api/wholesale?action=save", {
    method: "POST",
    body: JSON.stringify({ property })
  });
}

export async function skipTraceLead(getToken, leadId) {
  return fetchMetered(getToken, "/api/wholesale?action=skiptrace", {
    method: "POST",
    body: JSON.stringify({ leadId })
  });
}

export async function updateWholesaleLead(getToken, id, updates) {
  return fetchMetered(getToken, `/api/wholesale?action=update&id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ updates })
  });
}

export async function deleteWholesaleLead(getToken, id) {
  return fetchMetered(getToken, `/api/wholesale?action=delete&id=${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

export async function emailWholesaleLead(getToken, { leadId, subject, body }) {
  return fetchMetered(getToken, "/api/wholesale?action=email", {
    method: "POST",
    body: JSON.stringify({ leadId, subject, body })
  });
}

export async function sendPostcard(getToken, { leadId, message }) {
  return fetchMetered(getToken, "/api/wholesale?action=postcard", {
    method: "POST",
    body: JSON.stringify({ leadId, message })
  });
}

// Integrations (BYOK) — save / read wholesale-feature keys + return address.
// Server never sends the keys back, only a "connected" map.
export async function getWholesaleIntegrations(getToken) {
  return fetchMetered(getToken, "/api/wholesale?action=integrations");
}
export async function saveWholesaleIntegrations(getToken, updates) {
  return fetchMetered(getToken, "/api/wholesale?action=integrations", {
    method: "POST",
    body: JSON.stringify({ updates })
  });
}

/* ── Ari chat proxy ───────────────────────────────────────────────────── */

export async function chatWithAri(getToken, messages) {
  return fetchMetered(getToken, "/api/chat", {
    method: "POST",
    body: JSON.stringify({ messages })
  });
}

/* ── Team / local pros CRUD (per-user contacts for each market) ──────── */

export async function fetchTeam(getToken) {
  const body = await fetchMetered(getToken, "/api/team");
  return body.contacts || [];
}

export async function saveTeamContact(getToken, contact) {
  return fetchMetered(getToken, "/api/team", {
    method: "POST",
    body: JSON.stringify({ contact })
  });
}

export async function updateTeamContact(getToken, id, updates) {
  const qs = new URLSearchParams({ id: String(id) });
  return fetchMetered(getToken, `/api/team?${qs.toString()}`, {
    method: "PATCH",
    body: JSON.stringify({ updates })
  });
}

export async function removeTeamContact(getToken, id) {
  const qs = new URLSearchParams({ id: String(id) });
  return fetchMetered(getToken, `/api/team?${qs.toString()}`, { method: "DELETE" });
}

// Used once per sign-in to migrate local-only items into the server.
export async function bulkUploadWatchlist(getToken, listings) {
  if (!listings || listings.length === 0) return { count: 0 };
  return fetchMetered(getToken, "/api/watchlist?bulk=1", {
    method: "POST",
    body: JSON.stringify({ listings })
  });
}

/* ── Live free-data lookups (consolidated behind /api/lookup) ────────── */

// All county-level free-data lookups (Census, HUD, BLS, FRED mortgage rate)
// now route through /api/lookup?source=... — consolidated into one serverless
// function so we stay under the Vercel Hobby 12-function limit.
export async function fetchCountyCensus(getToken, { stateFips, countyFips }) {
  const qs = new URLSearchParams({ source: "census", stateFips, countyFips });
  return fetchMetered(getToken, `/api/lookup?${qs.toString()}`);
}
export async function fetchCountyFMR(getToken, { stateFips, countyFips }) {
  const qs = new URLSearchParams({ source: "fmr", stateFips, countyFips });
  return fetchMetered(getToken, `/api/lookup?${qs.toString()}`);
}
export async function fetchCountyUnemployment(getToken, { stateFips, countyFips }) {
  const qs = new URLSearchParams({ source: "unemployment", stateFips, countyFips });
  return fetchMetered(getToken, `/api/lookup?${qs.toString()}`);
}
export async function fetchMortgageRate(getToken) {
  return fetchMetered(getToken, "/api/lookup?source=mortgage");
}

// Monthly market indexes — cached Supabase snapshot populated by the
// GitHub Actions cron. Stays on its own endpoint because it's DB-backed.
export async function fetchMarketIndexes(getToken, { regionType, regionId }) {
  const qs = new URLSearchParams({ regionType, regionId });
  return fetchMetered(getToken, `/api/market/indexes?${qs.toString()}`);
}

// Full-gallery + long-description lookup for a single Realtor listing.
// Unmetered, cached 24h server-side — fired on-demand when the user opens
// the detail modal.
export async function fetchListingDetail(getToken, { id }) {
  const qs = new URLSearchParams({ id: String(id) });
  return fetchMetered(getToken, `/api/market/listing-detail?${qs.toString()}`);
}

// Per-property (lat/lng) lookups — flood zone + walk score — consolidated
// into /api/lookup with the rest of the free-data multiplexer.
export async function fetchFloodZone(getToken, { lat, lng }) {
  const qs = new URLSearchParams({ source: "flood", lat: String(lat), lng: String(lng) });
  return fetchMetered(getToken, `/api/lookup?${qs.toString()}`);
}
export async function fetchWalkScore(getToken, { lat, lng, address }) {
  const qs = new URLSearchParams({ source: "walkscore", lat: String(lat), lng: String(lng) });
  if (address) qs.set("address", address);
  return fetchMetered(getToken, `/api/lookup?${qs.toString()}`);
}
