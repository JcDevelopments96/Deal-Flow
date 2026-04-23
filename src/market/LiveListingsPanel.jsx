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
  Home, Building2, Filter, Settings, Key, RefreshCw, AlertTriangle, LogIn
} from "lucide-react";
import { THEME } from "../theme.js";
import { fmtUSD, isMobile } from "../utils.js";
import { Panel } from "../primitives.jsx";
import {
  PROVIDERS,
  buildDemoListings, buildDemoComps,
  formatRentCastListing, formatZillowListing,
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
  fetchRentalListings,
  QuotaExceededError
} from "../lib/saas.js";

export const LiveListingsPanel = ({ selectedState, selectedCity, stateName, stateMarkets, bedsFilter = "any", bathsFilter = "any" }) => {
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
  const [keyDrafts, setKeyDrafts] = useState({ rentcast: "", zillow: "" });
  const [showKeyInput, setShowKeyInput] = useState(!saasOn && !initial.keys[initial.provider]);
  const [listings, setListings] = useState([]);
  const [rentComps, setRentComps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [liveMode, setLiveMode] = useState(false);

  const activeProvider = PROVIDERS[provider] || PROVIDERS.rentcast;
  const apiKey = keys[provider] || "";

  // Primary reference market for demo defaults
  const referenceMarket = useMemo(() => {
    if (!selectedState) return null;
    if (selectedCity) {
      const match = (stateMarkets || []).find(m => m.city.toLowerCase() === selectedCity.toLowerCase());
      if (match) return match;
    }
    return (stateMarkets && stateMarkets[0]) || null;
  }, [selectedState, selectedCity, stateMarkets]);

  const targetCity = selectedCity || (referenceMarket && referenceMarket.city);

  const bedsRange = useMemo(() => parseFilterRange(bedsFilter), [bedsFilter]);
  const bathsRange = useMemo(() => parseFilterRange(bathsFilter), [bathsFilter]);

  const fetchRentCast = async () => {
    const params = new URLSearchParams({
      city: targetCity,
      state: selectedState,
      limit: "20"
    });
    // RentCast supports `bedrooms` / `bathrooms` for exact match — only set when user picked a specific count.
    if (bedsRange.min !== null && bedsRange.min === bedsRange.max) {
      params.set("bedrooms", String(bedsRange.min));
    }
    if (bathsRange.min !== null && bathsRange.min === bathsRange.max) {
      params.set("bathrooms", String(bathsRange.min));
    }
    const [saleRes, rentRes] = await Promise.all([
      fetch(`https://api.rentcast.io/v1/listings/sale?${params.toString()}`, {
        headers: { "X-Api-Key": apiKey, "accept": "application/json" }
      }),
      fetch(`https://api.rentcast.io/v1/listings/rental/long-term?${params.toString()}`, {
        headers: { "X-Api-Key": apiKey, "accept": "application/json" }
      })
    ]);
    if (!saleRes.ok) throw new Error(`RentCast request failed (${saleRes.status}). Check your API key.`);
    const saleJson = await saleRes.json();
    const rentJson = rentRes.ok ? await rentRes.json() : [];
    const saleList = Array.isArray(saleJson) ? saleJson : (saleJson.listings || []);
    const rentList = Array.isArray(rentJson) ? rentJson : (rentJson.listings || []);
    return {
      listings: saleList.map(formatRentCastListing),
      rentals: rentList.map(formatRentCastListing)
    };
  };

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
    const [saleRes, rentRes] = await Promise.all([
      fetch(buildUrl("ForSale"), { headers }),
      fetch(buildUrl("ForRent"), { headers })
    ]);
    if (!saleRes.ok) throw new Error(`Zillow request failed (${saleRes.status}). Check your RapidAPI key and subscription.`);
    const saleJson = await saleRes.json();
    const rentJson = rentRes.ok ? await rentRes.json() : { props: [] };
    const saleList = Array.isArray(saleJson.props) ? saleJson.props : [];
    const rentList = Array.isArray(rentJson.props) ? rentJson.props : [];
    return {
      listings: saleList.map(formatZillowListing),
      rentals: rentList.map(formatZillowListing)
    };
  };

  // SaaS path — both sale + rental come through /api/market/* so the RentCast
  // key stays on the server and each call increments the user's usage counter.
  const fetchViaSaas = async () => {
    const qsBase = { city: targetCity, state: selectedState, limit: 20 };
    // Only pass exact bedroom/bathroom when the filter is a specific number;
    // RentCast's API doesn't support ranges there.
    if (bedsRange.min !== null && bedsRange.min === bedsRange.max) {
      qsBase.bedrooms = bedsRange.min;
    }
    if (bathsRange.min !== null && bathsRange.min === bathsRange.max) {
      qsBase.bathrooms = bathsRange.min;
    }

    const [saleRes, rentRes] = await Promise.all([
      fetchSaleListings(saas.getToken, qsBase).catch(e => { throw e; }),
      // rentals are secondary — if they 402 separately, don't wipe out sale results
      fetchRentalListings(saas.getToken, qsBase).catch(() => ({ rentals: [], usage: null }))
    ]);

    // Keep the meter fresh using the usage snapshot the proxy returned.
    const usage = saleRes.usage || rentRes.usage;
    if (usage) saas.setUsageLocally(usage);

    return {
      listings: (saleRes.listings || []).map(formatRentCastListing),
      rentals: (rentRes.rentals || []).map(formatRentCastListing)
    };
  };

  const loadData = useCallback(async () => {
    if (!selectedState || !targetCity) return;

    // SaaS mode, signed in → go through the metered proxy
    if (saasOn && saas.user) {
      setLoading(true);
      setError("");
      try {
        const result = await fetchViaSaas();
        if (result.listings.length === 0 && result.rentals.length === 0) {
          setListings(buildDemoListings(selectedState, targetCity, referenceMarket));
          setRentComps(buildDemoComps(selectedState, targetCity, referenceMarket));
          setLiveMode(false);
          setError("No live results for this area — showing demo data.");
        } else {
          setListings(result.listings);
          setRentComps(result.rentals);
          setLiveMode(true);
        }
      } catch (err) {
        if (err instanceof QuotaExceededError) {
          setListings([]);
          setRentComps([]);
          setLiveMode(false);
          setError("You've used all your Market Intel clicks for this period.");
          setUpgradeReason("You've hit the free-tier limit. Pick a plan to keep searching.");
          setShowUpgrade(true);
          // Refresh the meter so it reflects reality.
          saas.refetch();
        } else {
          console.warn("SaaS market fetch failed:", err);
          setListings(buildDemoListings(selectedState, targetCity, referenceMarket));
          setRentComps(buildDemoComps(selectedState, targetCity, referenceMarket));
          setLiveMode(false);
          setError(err.message || "Live data unavailable — showing demo data.");
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // SaaS mode but user not signed in → show sign-in prompt + demo data
    if (saasOn && !saas.user) {
      setListings(buildDemoListings(selectedState, targetCity, referenceMarket));
      setRentComps(buildDemoComps(selectedState, targetCity, referenceMarket));
      setLiveMode(false);
      setError("");
      return;
    }

    // Standalone (non-SaaS) path — the legacy BYOK flow.
    if (!apiKey) {
      setListings(buildDemoListings(selectedState, targetCity, referenceMarket));
      setRentComps(buildDemoComps(selectedState, targetCity, referenceMarket));
      setLiveMode(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = provider === "zillow" ? await fetchZillow() : await fetchRentCast();

      if (result.listings.length === 0 && result.rentals.length === 0) {
        setListings(buildDemoListings(selectedState, targetCity, referenceMarket));
        setRentComps(buildDemoComps(selectedState, targetCity, referenceMarket));
        setLiveMode(false);
        setError("No live results for this area — showing demo data.");
      } else {
        setListings(result.listings);
        setRentComps(result.rentals);
        setLiveMode(true);
      }
    } catch (err) {
      console.warn(`${activeProvider.name} fetch failed:`, err);
      setListings(buildDemoListings(selectedState, targetCity, referenceMarket));
      setRentComps(buildDemoComps(selectedState, targetCity, referenceMarket));
      setLiveMode(false);
      setError(err.message || "Live data unavailable — showing demo data.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    saasOn, saas.user, saas.getToken,
    apiKey, provider, selectedState, targetCity, referenceMarket,
    activeProvider.name, bedsFilter, bathsFilter
  ]);

  useEffect(() => { loadData(); }, [loadData]);

  // Client-side filter pass — catches demo results and any upstream results that don't
  // honor the query params. Rental "bedrooms" are not always accurate, so we soft-filter there.
  const filteredListings = useMemo(
    () => listings.filter(l => matchesRange(l.bedrooms, bedsRange) && matchesRange(l.bathrooms, bathsRange)),
    [listings, bedsRange, bathsRange]
  );
  const filteredComps = useMemo(
    () => rentComps.filter(l => matchesRange(l.bedrooms, bedsRange) && matchesRange(l.bathrooms, bathsRange)),
    [rentComps, bedsRange, bathsRange]
  );

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

  if (!selectedState) return null;

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
        Properties currently for sale and rental comparables in <strong>{targetCity}, {selectedState}</strong>
        {stateName && ` (${stateName})`}. Click any county on the map above to pull listings for that area.
      </div>

      {/* SaaS mode + signed out → prompt sign-in (click the header auth slot). */}
      {saasOn && !saas.user && (
        <div style={{
          padding: 14, marginBottom: 16,
          background: THEME.bgTeal,
          border: `1px solid ${THEME.teal}`,
          borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12
        }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: THEME.teal, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <LogIn size={14} /> Sign in to load live listings
            </div>
            <div style={{ fontSize: 11, color: THEME.textMuted, lineHeight: 1.5 }}>
              Free plan includes 10 Market Intel clicks per month. Use the
              Sign in / Sign up buttons at the top of the page.
            </div>
          </div>
        </div>
      )}

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
          <RefreshCw size={16} className="mono" style={{ animation: "spin 1s linear infinite" }} /> Loading live data from {activeProvider.name}…
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
                ({filteredListings.length} for sale · {filteredComps.length} rentals)
              </span>
            </div>
          )}

          <div style={{
            fontSize: 12, fontWeight: 700, color: THEME.accent,
            textTransform: "uppercase", letterSpacing: "0.1em",
            marginBottom: 10, display: "flex", alignItems: "center", gap: 8
          }}>
            <Building2 size={13} />
            Properties For Sale ({filteredListings.length})
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
              {filteredListings.map(l => <ListingCard key={l.id} listing={l} type="sale" onOpen={openDetail} />)}
            </div>
          )}

          <div style={{
            fontSize: 12, fontWeight: 700, color: THEME.teal,
            textTransform: "uppercase", letterSpacing: "0.1em",
            marginBottom: 10, display: "flex", alignItems: "center", gap: 8
          }}>
            <Home size={13} />
            Rental Comparables ({filteredComps.length})
          </div>
          {filteredComps.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: THEME.textMuted, fontSize: 12 }}>
              {rentComps.length > 0
                ? "No rental comps match the current bed/bath filters — try widening them."
                : "No rental comparables found for this area."}
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile() ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 10
            }}>
              {filteredComps.map(l => <ListingCard key={l.id} listing={l} type="rental" onOpen={openDetail} />)}
            </div>
          )}
        </>
      )}

      {detail && (
        <ListingDetailModal
          listing={detail.listing}
          type={detail.type}
          onClose={closeDetail}
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
