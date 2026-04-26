/* ============================================================================
   LIVE LISTINGS & COMPARABLES PANEL — drives the RentCast / Zillow fetches,
   bed/bath filtering, and listing cards + detail modal.

   Two operating modes:
   - SaaS mode    : Clerk configured → fetch through /api/market/* so the
                    user's RentCast key lives server-side + usage is metered
   - Standalone   : no Clerk → user brings their own provider key (legacy)
   ============================================================================ */
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Home, Building2, Filter, Settings, Key, RefreshCw, AlertTriangle
} from "lucide-react";
import { THEME } from "../theme.js";
import { fmtUSD, isMobile } from "../utils.js";
import { Panel } from "../primitives.jsx";
import {
  PROVIDERS,
  buildDemoListings,
  formatZillowListing,
  loadProviderPrefs, parseFilterRange, matchesRange
} from "./providers.js";
import { ListingCard } from "./ListingCard.jsx";
import { ListingDetailModal } from "./ListingDetailModal.jsx";
import { UsageMeter } from "./UsageMeter.jsx";
import { UpgradeModal } from "../modals/UpgradeModal.jsx";
import {
  isSaasMode,
  useSaasUser,
  fetchSaleListings,
  QuotaExceededError
} from "../lib/saas.js";

// Median of an array of numbers, skipping non-numeric entries.
const medianOf = (arr) => {
  const nums = arr.filter(n => typeof n === "number" && Number.isFinite(n) && n > 0).sort((a, b) => a - b);
  if (nums.length === 0) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : Math.round((nums[mid - 1] + nums[mid]) / 2);
};

// Build per-city + per-county live stats from the Realtor sale listings so
// the map can color counties by live median price. Keyed by city name /
// county name lower-cased; plus a "__state__" rollup. Rent/yield comes from
// HUD FMR + Zillow ZORI at the county level (see AdvancedMarketIntel's
// countyFmr / countyIndexes) — we no longer bucket per-city rent data.
const computeLiveStats = (sales) => {
  const cityBuckets = new Map();
  const countyBuckets = new Map();
  const state = { prices: [], ppsqft: [] };
  const bump = (map, key, field, value) => {
    if (!map.has(key)) map.set(key, { prices: [], ppsqft: [], cities: new Set() });
    map.get(key)[field].push(value);
  };
  for (const s of sales || []) {
    if (!s.price) continue;
    const cityKey = (s.city || "").toLowerCase();
    const countyKey = (typeof s.county === "string" ? s.county : "").toLowerCase().replace(/\s+county$/i, "");
    if (cityKey) {
      bump(cityBuckets, cityKey, "prices", s.price);
      if (s.pricePerSqft) bump(cityBuckets, cityKey, "ppsqft", s.pricePerSqft);
    }
    if (countyKey) {
      bump(countyBuckets, countyKey, "prices", s.price);
      if (s.pricePerSqft) bump(countyBuckets, countyKey, "ppsqft", s.pricePerSqft);
      if (s.city) countyBuckets.get(countyKey).cities.add(s.city);
    }
    state.prices.push(s.price);
    if (s.pricePerSqft) state.ppsqft.push(s.pricePerSqft);
  }
  const finish = (bucket) => ({
    medianPrice: medianOf(bucket.prices),
    medianPpsqft: medianOf(bucket.ppsqft),
    listingCount: bucket.prices.length,
    isLive: true
  });
  const out = { byCounty: {} };
  for (const [key, bucket] of cityBuckets) out[key] = finish(bucket);
  for (const [key, bucket] of countyBuckets) out.byCounty[key] = finish(bucket);
  out.__state__ = {
    medianPrice: medianOf(state.prices),
    medianPpsqft: medianOf(state.ppsqft),
    listingCount: state.prices.length,
    isLive: true
  };
  return out;
};

export const LiveListingsPanel = ({ selectedState, selectedCity, stateName, stateMarkets, bedsFilter = "any", bathsFilter = "any", propertyTypeFilter = "any", onStatsComputed, onListingsLoaded, countyFmr, mortgageRate, countyStats, pinnedListingId = null, onClearPin }) => {
  const saasOn = isSaasMode();

  // SaaS hooks (safe to call even when saasOn=false — useSaasUser
  // short-circuits when Clerk isn't loaded / user isn't signed in).
  const saas = useSaasUser();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState(null);

  const initial = useMemo(loadProviderPrefs, []);
  const [provider, setProvider] = useState(initial.provider);
  const [keys, setKeys] = useState(initial.keys);
  const [detail, setDetail] = useState(null); // { listing, type } — opens the listing detail modal
  const openDetail = useCallback((listing, type) => setDetail({ listing, type }), []);
  const closeDetail = useCallback(() => setDetail(null), []);
  const [keyDrafts, setKeyDrafts] = useState({ zillow: "" });
  const [showKeyInput, setShowKeyInput] = useState(!saasOn && !initial.keys[initial.provider]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [liveMode, setLiveMode] = useState(false);

  const activeProvider = PROVIDERS[provider] || PROVIDERS.zillow;
  const apiKey = keys[provider] || "";

  // Plan-change watchdog: when the user's plan flips from free → paid
  // (mid-session checkout completes, webhook fires, /api/me refreshes),
  // wipe the quota-suppression flag so paid users never get silently
  // routed to demo data because they once dismissed an upgrade prompt.
  useEffect(() => {
    const plan = saas.usage?.plan;
    if (plan && plan !== "free") {
      try { sessionStorage.removeItem("dt_market_quota_prompted"); } catch {}
    }
  }, [saas.usage?.plan]);

  // Primary reference market for demo defaults
  const referenceMarket = useMemo(() => {
    if (!selectedState) return null;
    if (selectedCity) {
      const match = (stateMarkets || []).find(m => m.city.toLowerCase() === selectedCity.toLowerCase());
      if (match) return match;
    }
    return (stateMarkets && stateMarkets[0]) || null;
  }, [selectedState, selectedCity, stateMarkets]);

  // `queryCity` is what we send upstream — null means state-wide query (Realtor supports it).
  // `targetCity` is what we show in the UI + feed to demo builders (falls back so demo still works).
  const queryCity = selectedCity || null;
  const targetCity = selectedCity || (referenceMarket && referenceMarket.city) || null;

  const bedsRange = useMemo(() => parseFilterRange(bedsFilter), [bedsFilter]);
  const bathsRange = useMemo(() => parseFilterRange(bathsFilter), [bathsFilter]);
  const [sortBy, setSortBy] = useState("newest"); // newest | priceAsc | priceDesc | ppsqft | dom

  const fetchZillow = async () => {
    const location = `${targetCity}, ${selectedState}`;
    const buildUrl = (status) => {
      const qs = new URLSearchParams({
        location,
        home_type: "Houses",
        status_type: status
      });
      if (bedsRange.min !== null) qs.set("bedsMin", String(bedsRange.min));
      if (bedsRange.max !== null) qs.set("bedsMax", String(bedsRange.max));
      if (bathsRange.min !== null) qs.set("bathsMin", String(bathsRange.min));
      if (bathsRange.max !== null) qs.set("bathsMax", String(bathsRange.max));
      return `https://zillow-com1.p.rapidapi.com/propertyExtendedSearch?${qs.toString()}`;
    };
    const headers = {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "zillow-com1.p.rapidapi.com",
      "accept": "application/json"
    };
    const saleRes = await fetch(buildUrl("ForSale"), { headers });
    if (!saleRes.ok) throw new Error(`Zillow request failed (${saleRes.status}). Check your RapidAPI key and subscription.`);
    const saleJson = await saleRes.json();
    const saleList = Array.isArray(saleJson.props) ? saleJson.props : [];
    return {
      listings: saleList.map(formatZillowListing)
    };
  };

  // SaaS path — sale listings come through /api/market/listings (Realtor.com).
  // Rental data is no longer fetched per-listing; HUD FMR + Zillow ZORI +
  // Census median rent cover that at the county level (rendered in the
  // Free Data Sources panel above this one).
  const fetchViaSaas = async () => {
    const qsBase = { state: selectedState, limit: 200 };
    if (queryCity) qsBase.city = queryCity;
    if (bedsRange.min !== null && bedsRange.min === bedsRange.max) {
      qsBase.bedrooms = bedsRange.min;
    }
    if (bathsRange.min !== null && bathsRange.min === bathsRange.max) {
      qsBase.bathrooms = bathsRange.min;
    }
    if (propertyTypeFilter && propertyTypeFilter !== "any") {
      qsBase.propertyType = propertyTypeFilter;
    }
    const saleRes = await fetchSaleListings(saas.getToken, qsBase);
    if (saleRes.usage) saas.setUsageLocally(saleRes.usage);
    return { listings: saleRes.listings || [] };
  };

  const loadData = useCallback(async () => {
    if (!selectedState) return;
    // Legacy BYOK (Zillow) requires a city; the SaaS path supports state-only.
    if (!saasOn && !targetCity) return;

    const fallbackToDemo = (msg) => {
      setListings(buildDemoListings(selectedState, targetCity, referenceMarket));
      setLiveMode(false);
      setError(msg);
      if (onStatsComputed) onStatsComputed(null);
      if (onListingsLoaded) onListingsLoaded([]);
    };

    // SaaS mode, signed in → metered Realtor.com proxy
    if (saasOn && saas.user) {
      setLoading(true);
      setError("");
      try {
        const result = await fetchViaSaas();
        if (!result.listings || result.listings.length === 0) {
          // Tell the user *why* — the most common cause is "no Realtor
          // listings match the state-only query for that area," not a
          // billing problem. This message is visible in the panel so
          // they can act on it (try a more populous state, broaden filters).
          fallbackToDemo(`No live listings returned for ${selectedCity || selectedState}. Showing demo data.`);
        } else {
          setListings(result.listings);
          setLiveMode(true);
          if (onStatsComputed) onStatsComputed(computeLiveStats(result.listings));
          if (onListingsLoaded) onListingsLoaded(result.listings);
        }
      } catch (err) {
        if (err instanceof QuotaExceededError) {
          // First quota hit → show the upgrade modal once. After the user
          // dismisses it, every subsequent click silently falls back to
          // demo data so we don't trap them in a "click → modal → close →
          // click → modal" loop. The flag lives in sessionStorage so it
          // resets when they close the tab (lets them see the prompt
          // fresh next visit) but persists across navigation in-session.
          const onFree = saas.usage?.plan === "free";
          let alreadyPrompted = false;
          try { alreadyPrompted = sessionStorage.getItem("dt_market_quota_prompted") === "1"; }
          catch {}

          if (alreadyPrompted) {
            // Quiet fallback — user has already seen the pitch.
            fallbackToDemo(onFree
              ? "Showing demo data. Upgrade for live listings."
              : "Out of Market Intel clicks this period. Showing demo data."
            );
          } else {
            try { sessionStorage.setItem("dt_market_quota_prompted", "1"); } catch {}
            setListings([]);
            setLiveMode(false);
            setError(onFree
              ? "Market Intel is a paid feature — subscribe to load live listings."
              : "You've used all your Market Intel clicks for this period.");
            setUpgradeReason(onFree
              ? "Pick a plan to unlock Market Intel. Cancel anytime."
              : "You've hit your monthly click limit. Upgrade for more.");
            setShowUpgrade(true);
          }
          saas.refetch();
        } else {
          console.warn("SaaS market fetch failed:", err);
          fallbackToDemo(err.message || "Live data unavailable — showing demo data.");
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // SaaS mode but user not signed in → demo
    if (saasOn && !saas.user) {
      fallbackToDemo("");
      return;
    }

    // Standalone (non-SaaS) — legacy Zillow BYOK flow
    if (!apiKey) {
      fallbackToDemo("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await fetchZillow();
      if (!result.listings || result.listings.length === 0) {
        fallbackToDemo("No live results for this area — showing demo data.");
      } else {
        setListings(result.listings);
        setLiveMode(true);
      }
    } catch (err) {
      console.warn(`${activeProvider.name} fetch failed:`, err);
      fallbackToDemo(err.message || "Live data unavailable — showing demo data.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    saasOn, saas.user, saas.getToken,
    apiKey, provider, selectedState, targetCity, referenceMarket,
    activeProvider.name, bedsFilter, bathsFilter, propertyTypeFilter
  ]);

  useEffect(() => { loadData(); }, [loadData]);

  // Client-side filter + sort. Rental "bedrooms" are not always accurate, so
  // we soft-filter there.
  const filteredListings = useMemo(() => {
    // A clicked map pin trumps every other filter — show only that listing.
    if (pinnedListingId) {
      const hit = listings.find(l => l.id === pinnedListingId);
      return hit ? [hit] : [];
    }
    const out = listings.filter(l => matchesRange(l.bedrooms, bedsRange) && matchesRange(l.bathrooms, bathsRange));
    const cmp = {
      newest:    (a, b) => (new Date(b.listedDate || 0).getTime()) - (new Date(a.listedDate || 0).getTime()),
      priceAsc:  (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
      priceDesc: (a, b) => (b.price ?? 0) - (a.price ?? 0),
      ppsqft:    (a, b) => (a.pricePerSqft ?? Infinity) - (b.pricePerSqft ?? Infinity),
      dom:       (a, b) => (a.daysOnMarket ?? Infinity) - (b.daysOnMarket ?? Infinity)
    };
    return out.sort(cmp[sortBy] || cmp.newest);
  }, [listings, bedsRange, bathsRange, sortBy, pinnedListingId]);

  const saveKey = (providerId, val) => {
    const trimmed = (val || "").trim();
    setKeys(prev => ({ ...prev, [providerId]: trimmed }));
    try {
      const p = PROVIDERS[providerId];
      if (!p) return;
      if (trimmed) window.localStorage.setItem(p.storageKey, trimmed);
      else window.localStorage.removeItem(p.storageKey);
    } catch {}
    setKeyDrafts(prev => ({ ...prev, [providerId]: "" }));
    if (trimmed && providerId === provider) setShowKeyInput(false);
  };

  const switchProvider = (providerId) => {
    setProvider(providerId);
    try { window.localStorage.setItem(PROVIDER_STORAGE_KEY, providerId); } catch {}
    setError("");
    if (!keys[providerId]) setShowKeyInput(true);
  };

  // Pre-state empty state — used to be `return null`, but the parent
  // now keeps the side-by-side map+listings layout permanent. Render
  // a clear "pick a state" placeholder so the listings column never
  // collapses to nothing on first load.
  if (!selectedState) {
    return (
      <Panel
        title="Live Listings"
        icon={<Home size={16} />}
        accent
        style={{ marginBottom: 24 }}
      >
        <div style={{
          padding: "40px 20px", textAlign: "center",
          background: THEME.bgPanel, borderRadius: 8,
          border: `1px dashed ${THEME.border}`
        }}>
          <Home size={28} color={THEME.textDim} style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
            Pick a state to load listings
          </div>
          <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.5, maxWidth: 340, margin: "0 auto" }}>
            Use the State filter above, or click any state on the map to drill in.
            Up to 600 active listings load per query.
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      title="Live Listings & Comparables"
      icon={<Home size={16} />}
      accent
      style={{ marginBottom: 24 }}
      action={
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {saasOn && saas.usage && (
            <UsageMeter
              usage={saas.usage}
              onUpgradeClick={() => {
                setUpgradeReason(null);
                setShowUpgrade(true);
              }}
            />
          )}
          <span style={{
            padding: "3px 9px",
            fontSize: 10, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
            borderRadius: 4,
            background: liveMode ? THEME.greenDim : THEME.bgOrange,
            color: liveMode ? THEME.green : THEME.orange
          }}>
            {liveMode ? `Live · ${saasOn ? "DealTrack" : activeProvider.name}` : "Demo"}
          </span>
          {!saasOn && (
            <button
              onClick={() => setShowKeyInput(s => !s)}
              className="btn-ghost"
              style={{ padding: "4px 10px", fontSize: 11 }}
            >
              <Settings size={12} /> {apiKey ? "Keys" : "Connect"}
            </button>
          )}
          <button
            onClick={loadData}
            className="btn-ghost"
            style={{ padding: "4px 10px", fontSize: 11 }}
            disabled={loading}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      }
    >
      <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
        {queryCity
          ? <>Properties currently for sale and rental comparables in <strong>{queryCity}, {selectedState}</strong>{stateName && ` (${stateName})`}. Click any county on the map above to drill in further.</>
          : <>Showing properties for sale across <strong>{stateName || selectedState}</strong>. Click a county on the map to drill in and see rental comparables.</>}
      </div>

      {/* NOTE: the "paid feature" messaging for signed-out and
          signed-in-free users now lives in the MarketIntelRibbon above this
          panel. This panel just shows demo data + renders the UpgradeModal
          on 402 errors from actual click attempts. */}

      {/* BYOK prompt — standalone mode only (hidden when SaaS is active). */}
      {!saasOn && !apiKey && !showKeyInput && (
        <div style={{
          padding: 14, marginBottom: 16,
          background: THEME.bgTeal,
          border: `1px solid ${THEME.accent}`,
          borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12
        }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: THEME.accent, marginBottom: 4 }}>
              Connect a Data Provider for Live Listings
            </div>
            <div style={{ fontSize: 11, color: THEME.textMuted, lineHeight: 1.5 }}>
              Showing demo data. Add a RentCast or Zillow API key to pull live MLS-grade listings and rental comps.
            </div>
          </div>
          <button onClick={() => setShowKeyInput(true)} className="btn-primary" style={{ padding: "8px 14px", fontSize: 12 }}>
            <Key size={13} /> Connect API
          </button>
        </div>
      )}

      {!saasOn && showKeyInput && (
        <div style={{
          padding: 16, marginBottom: 16,
          background: THEME.bg, borderRadius: 8, border: `1px solid ${THEME.accent}`
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: THEME.accent, display: "flex", alignItems: "center", gap: 8 }}>
            <Key size={14} /> Connect a Data Provider
          </div>

          {/* Provider selector */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {Object.values(PROVIDERS).map(p => {
              const hasKey = !!keys[p.id];
              const isActive = provider === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => switchProvider(p.id)}
                  style={{
                    padding: 12, textAlign: "left",
                    border: `2px solid ${isActive ? THEME.accent : THEME.border}`,
                    borderRadius: 6,
                    background: isActive ? THEME.bgRaised : THEME.bg,
                    cursor: "pointer",
                    position: "relative"
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? THEME.accent : THEME.text, marginBottom: 4 }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 6 }}>{p.subtitle}</div>
                  <div style={{ fontSize: 10, color: THEME.textDim }}>{p.freeTier}</div>
                  {hasKey && (
                    <div style={{
                      position: "absolute", top: 10, right: 10,
                      padding: "2px 7px", fontSize: 9, fontWeight: 700,
                      background: THEME.greenDim, color: THEME.green,
                      borderRadius: 4, letterSpacing: "0.06em", textTransform: "uppercase"
                    }}>
                      Saved
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 8, lineHeight: 1.5 }}>
            Paste your {activeProvider.name} API key below. Keys are stored only in this browser (localStorage).{" "}
            <a href={activeProvider.signupUrl} target="_blank" rel="noopener noreferrer" style={{ color: THEME.accent, fontWeight: 600 }}>
              Get a key →
            </a>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="password"
              value={keyDrafts[provider] || ""}
              onChange={(e) => setKeyDrafts(prev => ({ ...prev, [provider]: e.target.value }))}
              placeholder={apiKey ? "••••••••••••••  (saved)" : `Paste ${activeProvider.name} API key`}
              style={{ flex: 1, padding: "8px 10px", fontSize: 12 }}
            />
            <button onClick={() => saveKey(provider, keyDrafts[provider])} className="btn-primary" style={{ padding: "6px 12px", fontSize: 12 }}>
              Save
            </button>
            {apiKey && (
              <button onClick={() => saveKey(provider, "")} className="btn-danger" style={{ padding: "6px 12px", fontSize: 12 }}>
                Clear
              </button>
            )}
          </div>

          {provider === "zillow" && (
            <div style={{ marginTop: 10, fontSize: 10, color: THEME.textDim, lineHeight: 1.5 }}>
              Note: Zillow retired their official public API in 2014. This integration uses the <strong>zillow-com1</strong>
              {" "}community wrapper on RapidAPI (widely used, free tier available). Subscribe on RapidAPI first, then paste your X-RapidAPI-Key here.
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{
          padding: "8px 12px", marginBottom: 14, fontSize: 12,
          background: THEME.bgOrange, color: THEME.orange,
          borderRadius: 6, border: `1px solid ${THEME.orange}`
        }}>
          <AlertTriangle size={12} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: 30, color: THEME.textMuted, fontSize: 13 }}>
          <RefreshCw size={16} className="mono" style={{ animation: "spin 1s linear infinite" }} /> Loading…
        </div>
      )}

      {!loading && (
        <>
          {(bedsFilter !== "any" || bathsFilter !== "any") && (
            <div style={{
              fontSize: 11, marginBottom: 12, color: THEME.textMuted,
              padding: "6px 10px", background: THEME.bgRaised, borderRadius: 4,
              display: "inline-flex", alignItems: "center", gap: 8
            }}>
              <Filter size={11} />
              Filters:
              {bedsFilter !== "any" && <span><strong>{bedsFilter} bed{bedsFilter === "1" ? "" : "s"}</strong></span>}
              {bathsFilter !== "any" && <span><strong>{bathsFilter} bath{bathsFilter === "1" ? "" : "s"}</strong></span>}
              <span style={{ color: THEME.textDim }}>
                ({filteredListings.length} for sale)
              </span>
            </div>
          )}

          <div style={{
            marginBottom: 10,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 8, flexWrap: "wrap"
          }}>
            <div style={{
              fontSize: 12, fontWeight: 700, color: THEME.accent,
              textTransform: "uppercase", letterSpacing: "0.1em",
              display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap"
            }}>
              <Building2 size={13} />
              Properties For Sale ({filteredListings.length})
              {pinnedListingId && (
                <button
                  onClick={() => onClearPin && onClearPin()}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "3px 9px", fontSize: 10, fontWeight: 700,
                    background: THEME.bgOrange, color: THEME.orange,
                    border: `1px solid ${THEME.orange}`, borderRadius: 999,
                    cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em"
                  }}
                  title="Clear map-pin filter"
                >
                  Pinned · clear ×
                </button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort listings"
              style={{
                padding: "4px 8px", fontSize: 11,
                borderRadius: 4, border: `1px solid ${THEME.border}`,
                background: THEME.bg, color: THEME.text
              }}
            >
              <option value="newest">Newest first</option>
              <option value="priceAsc">Price: low → high</option>
              <option value="priceDesc">Price: high → low</option>
              <option value="ppsqft">$/sqft: low → high</option>
              <option value="dom">Days on market</option>
            </select>
          </div>
          {filteredListings.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: THEME.textMuted, fontSize: 12 }}>
              {listings.length > 0
                ? "No listings match the current bed/bath filters — try widening them."
                : "No active listings found for this area."}
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile() ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 10, marginBottom: 24
            }}>
              {filteredListings.map(l => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  type="sale"
                  onOpen={openDetail}
                  countyFmr={countyFmr}
                  mortgageRate={mortgageRate}
                />
              ))}
            </div>
          )}

        </>
      )}

      {detail && (
        <ListingDetailModal
          listing={detail.listing}
          type={detail.type}
          onClose={closeDetail}
          countyFmr={countyFmr}
          mortgageRate={mortgageRate}
          countyStats={countyStats}
        />
      )}

      {showUpgrade && saasOn && (
        <UpgradeModal
          plans={saas.plans}
          currentPlan={saas.usage?.plan}
          getToken={saas.getToken}
          reason={upgradeReason}
          onClose={() => { setShowUpgrade(false); setUpgradeReason(null); }}
        />
      )}
    </Panel>
  );
};
