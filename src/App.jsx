/* ============================================================================
   APP SHELL — the outer BRRRRTracker component. Holds top-level state for
   deals, watchlist, recently-viewed, and nav; mounts the ToastHost +
   AppActionsContext provider; and routes to the view components.

   The bulk of the UI lives in sibling modules:
     - src/theme.js / utils.js / primitives.jsx / contexts.jsx / deals.jsx
     - src/analyzer/ / src/market/ / src/views/ / src/modals/
   ============================================================================ */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";

import { THEME, STYLE_TAG } from "./theme.js";
import { n, isMobile } from "./utils.js";
import { AppActionsContext, useToast, ToastHost } from "./contexts.jsx";
import {
  isSaasMode, useSaasUser,
  fetchWatchlist, saveWatchlistItem, removeWatchlistItem, bulkUploadWatchlist,
  fetchMortgageRate
} from "./lib/saas.js";
import {
  createBlankDeal,
  STORAGE_KEY, WATCHLIST_STORAGE_KEY, RECENT_STORAGE_KEY, RECENT_MAX
} from "./deals.jsx";
import { Header } from "./views/Header.jsx";
import { Dashboard } from "./views/Dashboard.jsx";
import { WatchlistView } from "./views/WatchlistView.jsx";
import { EducationCenter } from "./views/EducationCenter.jsx";
import { TeamView } from "./views/TeamView.jsx";
import { PlansView } from "./views/PlansView.jsx";
import { WholesaleView } from "./views/WholesaleView.jsx";
import { TermsView } from "./views/TermsView.jsx";
import { HomeView } from "./views/HomeView.jsx";
import { InspectionsView } from "./views/InspectionsView.jsx";
import { Analyzer } from "./analyzer/Analyzer.jsx";
import { AdvancedMarketIntel } from "./market/AdvancedMarketIntel.jsx";
import { ErrorBoundary } from "./ErrorBoundary.jsx";
import { AriChat } from "./AriChat.jsx";
import { MarketIntelRibbon } from "./market/MarketIntelRibbon.jsx";
import { TemplatePicker } from "./modals/TemplatePicker.jsx";
import { UnsavedChangesModal } from "./modals/UnsavedChangesModal.jsx";
import { MortgageCalculatorModal } from "./modals/MortgageCalculatorModal.jsx";

// Alias for semantic naming

/* ============================================================================
   MAIN APP — BRRRRTracker
   ============================================================================ */

function BRRRRTrackerInner() {
  const toast = useToast();
  const [deals, setDeals] = useState([]);
  const [view, setView] = useState("home");
  const [activeDealId, setActiveDealId] = useState(null);
  const [draftDeal, setDraftDeal] = useState(null);
  const [isDraftDirty, setIsDraftDirty] = useState(false);
  const [pendingNav, setPendingNav] = useState(null); // { type: "view"|"back", payload }
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const [recentIds, setRecentIds] = useState([]); // most-recently-opened deal IDs (max 5)

  // Load deals from localStorage on mount
  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" && window.localStorage
        ? window.localStorage.getItem(STORAGE_KEY)
        : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setDeals(parsed);
      }
    } catch (err) {
      console.warn("Could not load saved deals:", err);
    }
    setLoaded(true);
  }, []);

  // Persist deals to localStorage
  useEffect(() => {
    if (!loaded) return;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
      }
    } catch (err) {
      console.warn("Could not save deals:", err);
    }
  }, [deals, loaded]);

  // Watchlist lives in two places:
  //   - localStorage: always, so standalone/signed-out mode works
  //   - /api/watchlist (Supabase): only when SaaS + signed in, so the list
  //     follows the user across devices / reinstalls / sign-outs.
  //
  // The useSaasUser hook short-circuits (returns user=null) when Clerk isn't
  // configured, so this is safe in standalone mode too.
  const saas = useSaasUser();
  const saasOn = isSaasMode();
  const saasUserId = saas.user?.id || null;

  // Load watchlist from localStorage once on mount (standalone/initial render).
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" && window.localStorage
        ? window.localStorage.getItem(WATCHLIST_STORAGE_KEY)
        : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setWatchlist(parsed);
      }
    } catch (err) {
      console.warn("Could not load watchlist:", err);
    }
  }, []);

  // Persist watchlist to localStorage — always keep a local cache so the list
  // renders instantly on page load, even before the server round-trip.
  useEffect(() => {
    if (!loaded) return;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
      }
    } catch (err) {
      console.warn("Could not save watchlist:", err);
    }
  }, [watchlist, loaded]);

  // When a SaaS user signs in, sync: upload any local-only items, then
  // replace with the authoritative server list. Runs once per sign-in.
  useEffect(() => {
    if (!saasOn || !saasUserId || !loaded) return;
    let cancelled = false;
    (async () => {
      try {
        // 1. Fetch what the server has (authoritative).
        const serverItems = await fetchWatchlist(saas.getToken);
        const serverIds = new Set(serverItems.map(i => String(i.id)));
        // 2. Any purely-local items? Upload them so the user doesn't lose
        //    saves made while signed out. Server-side upsert dedupes.
        const localOnly = watchlist.filter(w => !serverIds.has(String(w.id)));
        if (localOnly.length > 0) {
          await bulkUploadWatchlist(saas.getToken, localOnly);
        }
        if (cancelled) return;
        // 3. Merge (server items + any local-only we just uploaded) so the
        //    UI shows everything — localOnly items aren't in serverItems yet.
        const byId = new Map();
        [...serverItems, ...localOnly].forEach(i => byId.set(String(i.id), i));
        setWatchlist([...byId.values()]);
      } catch (err) {
        console.warn("Watchlist sync failed:", err);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saasOn, saasUserId, loaded]);

  // Live 30-year mortgage rate (from FRED). Fetched once per sign-in and
  // used as the default `interestRate` on newly-created deals so the
  // Analyzer starts from a real-world rate instead of the hardcoded 7.5.
  const [liveMortgageRate, setLiveMortgageRate] = useState(null);
  useEffect(() => {
    if (!saasOn || !saasUserId) return;
    let cancelled = false;
    (async () => {
      try {
        const body = await fetchMortgageRate(saas.getToken);
        if (!cancelled && typeof body.rate === "number") {
          setLiveMortgageRate({ rate: body.rate, asOf: body.asOf });
        }
      } catch (err) {
        // Non-fatal: analyzer falls back to the hardcoded default.
        console.warn("Mortgage rate fetch failed:", err);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saasOn, saasUserId]);

  // Load recently-viewed deal IDs
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" && window.localStorage
        ? window.localStorage.getItem(RECENT_STORAGE_KEY)
        : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRecentIds(parsed);
      }
    } catch (err) {
      console.warn("Could not load recent deals:", err);
    }
  }, []);

  // Persist recently-viewed deal IDs
  useEffect(() => {
    if (!loaded) return;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recentIds));
      }
    } catch (err) {
      console.warn("Could not save recent deals:", err);
    }
  }, [recentIds, loaded]);

  // Drop ids of deals that no longer exist (e.g. after delete) from the recents list
  useEffect(() => {
    if (!loaded || recentIds.length === 0) return;
    const existingIds = new Set(deals.map(d => d.id));
    const pruned = recentIds.filter(id => existingIds.has(id));
    if (pruned.length !== recentIds.length) setRecentIds(pruned);
  }, [deals, loaded, recentIds]);

  const pushRecent = useCallback((dealId) => {
    setRecentIds(prev => {
      const filtered = prev.filter(id => id !== dealId);
      return [dealId, ...filtered].slice(0, RECENT_MAX);
    });
  }, []);

  const activeDeal = useMemo(() => {
    if (draftDeal) return draftDeal;
    return deals.find(d => d.id === activeDealId) || null;
  }, [deals, activeDealId, draftDeal]);

  const handleNewDeal = useCallback(() => {
    setShowTemplatePicker(true);
  }, []);

  const handleTemplateSelect = useCallback((templateKey) => {
    const fresh = createBlankDeal(templateKey);
    // Override the hardcoded 7.5% default with the live FRED rate when we have it.
    if (liveMortgageRate?.rate) fresh.interestRate = liveMortgageRate.rate;
    setDraftDeal(fresh);
    setActiveDealId(null);
    setIsDraftDirty(false);
    setShowTemplatePicker(false);
    setView("analyzer");
  }, [liveMortgageRate]);

  const handleOpenDeal = useCallback((dealId) => {
    setActiveDealId(dealId);
    setDraftDeal(null);
    setIsDraftDirty(false);
    setView("analyzer");
    pushRecent(dealId);
  }, [pushRecent]);

  const handleUpdateDraft = useCallback((updates) => {
    if (draftDeal) {
      setDraftDeal({ ...draftDeal, ...updates, updatedAt: new Date().toISOString() });
      setIsDraftDirty(true);
    } else if (activeDealId) {
      setDeals(prev => prev.map(d =>
        d.id === activeDealId
          ? { ...d, ...updates, updatedAt: new Date().toISOString() }
          : d
      ));
    }
  }, [draftDeal, activeDealId]);

  const handleSaveDeal = useCallback(() => {
    if (draftDeal) {
      setDeals(prev => [draftDeal, ...prev]);
      setActiveDealId(draftDeal.id);
      setDraftDeal(null);
    }
    setIsDraftDirty(false);
    toast.push("Deal saved", "success");
  }, [draftDeal, toast]);

  const handleDeleteDeal = useCallback((dealId) => {
    setDeals(prev => prev.filter(d => d.id !== dealId));
    if (activeDealId === dealId) {
      setActiveDealId(null);
      setDraftDeal(null);
      setIsDraftDirty(false);
      setView("dashboard");
    }
    toast.push("Deal deleted", "info");
  }, [activeDealId, toast]);

  // Core nav helpers — forced = bypass the dirty guard (used after save/discard resolves)
  const performChangeView = useCallback((next) => {
    setView(next);
    if (next !== "analyzer") {
      setDraftDeal(null);
      setActiveDealId(null);
      setIsDraftDirty(false);
    }
  }, []);

  const performBack = useCallback(() => {
    setDraftDeal(null);
    setActiveDealId(null);
    setIsDraftDirty(false);
    setView("dashboard");
  }, []);

  // Gated versions: if there's an unsaved draft, stash the intent and ask the user
  const handleChangeView = useCallback((next) => {
    if (view === "analyzer" && draftDeal && isDraftDirty && next !== "analyzer") {
      setPendingNav({ type: "view", payload: next });
      return;
    }
    performChangeView(next);
  }, [view, draftDeal, isDraftDirty, performChangeView]);

  const handleBack = useCallback(() => {
    if (draftDeal && isDraftDirty) {
      setPendingNav({ type: "back" });
      return;
    }
    performBack();
  }, [draftDeal, isDraftDirty, performBack]);

  // Resolve the pending nav action (called by the Unsaved modal)
  const resolvePendingNav = useCallback((decision) => {
    if (!pendingNav) return;
    const pn = pendingNav;
    if (decision === "cancel") {
      setPendingNav(null);
      return;
    }
    if (decision === "save") {
      handleSaveDeal();
    }
    // Clear draft dirtiness and execute the stashed intent
    setIsDraftDirty(false);
    setPendingNav(null);
    if (pn.type === "view") performChangeView(pn.payload);
    else if (pn.type === "back") performBack();
  }, [pendingNav, handleSaveDeal, performChangeView, performBack]);

  /* ── Watchlist + cross-cutting app actions ─────────────────────────── */
  const isWatched = useCallback(
    (id) => watchlist.some(w => w.id === id),
    [watchlist]
  );

  const toggleWatch = useCallback((listing) => {
    if (!listing || !listing.id) return;
    // Optimistic update — show the toggle instantly; server sync happens
    // in the background. If the server call fails the local change stays
    // (the user can re-toggle); the next sign-in will reconcile.
    let willAdd = true;
    setWatchlist(prev => {
      const already = prev.some(w => w.id === listing.id);
      willAdd = !already;
      if (already) return prev.filter(w => w.id !== listing.id);
      return [...prev, { ...listing, addedAt: new Date().toISOString() }];
    });
    toast.push(willAdd ? "Saved to Watchlist" : "Removed from Watchlist", willAdd ? "success" : "info");

    if (saasOn && saasUserId) {
      (willAdd
        ? saveWatchlistItem(saas.getToken, { ...listing, addedAt: new Date().toISOString() })
        : removeWatchlistItem(saas.getToken, listing.id)
      ).catch(err => console.warn("Watchlist sync failed:", err));
    }
  }, [toast, saasOn, saasUserId, saas.getToken]);

  const removeWatch = useCallback((id) => {
    setWatchlist(prev => prev.filter(w => w.id !== id));
    toast.push("Removed from Watchlist", "info");
    if (saasOn && saasUserId) {
      removeWatchlistItem(saas.getToken, id)
        .catch(err => console.warn("Watchlist remove failed:", err));
    }
  }, [toast, saasOn, saasUserId, saas.getToken]);

  const useListingAsDeal = useCallback((listing) => {
    const parseAddress = (formatted) => {
      const parts = (formatted || "").split(",").map(s => s.trim());
      return {
        address: parts[0] || "",
        city: parts[1] || "",
        state: (parts[2] || "").split(" ")[0] || ""
      };
    };
    const parsed = parseAddress(listing.formattedAddress);
    const price = n(listing.price);
    const fresh = {
      ...createBlankDeal(),
      ...(liveMortgageRate?.rate ? { interestRate: liveMortgageRate.rate } : {}),
      address: listing.addressLine1 || parsed.address || listing.formattedAddress || "",
      city: listing.city || parsed.city || "",
      state: listing.state || parsed.state || "",
      propertyType: listing.propertyType || "Single Family",
      bedrooms: listing.bedrooms || 3,
      bathrooms: listing.bathrooms || 2,
      sqft: listing.squareFootage || 1500,
      purchasePrice: price,
      offerPrice: price,
      listPrice: price,
      // Conservative defaults so the first screen is populated:
      arv: Math.round(price * 1.12),
      closingCosts: Math.round(price * 0.02),
      rentEstimate: Math.round(price * 0.008), // 0.8%-rule placeholder
      status: "analyzing",
      sourceListingId: listing.id || null,
      sourceListingUrl: listing.externalUrl || null
    };
    setDraftDeal(fresh);
    setActiveDealId(null);
    setIsDraftDirty(true);
    setView("analyzer");
    toast.push(`Loaded ${parsed.address || "listing"} into Deal Analyzer`, "success");
  }, [toast, liveMortgageRate]);

  const appActions = useMemo(() => ({
    isWatched, toggleWatch, removeWatch, useListingAsDeal, watchlist
  }), [isWatched, toggleWatch, removeWatch, useListingAsDeal, watchlist]);

  return (
    <AppActionsContext.Provider value={appActions}>
    <div className="brrrr-root">
      <style>{STYLE_TAG}</style>

      <Header
        view={view}
        onChangeView={handleChangeView}
        onNewDeal={handleNewDeal}
        onOpenCalculator={() => setShowCalculator(true)}
        watchlistCount={watchlist.length}
      />

      {view === "dashboard" && (
        <Dashboard
          deals={deals}
          recentIds={recentIds}
          onOpenDeal={handleOpenDeal}
          onNewDeal={handleNewDeal}
          onDeleteDeal={handleDeleteDeal}
          onChangeView={setView}
        />
      )}

      {view === "analyzer" && activeDeal && (
        <Analyzer
          deal={activeDeal}
          onUpdate={handleUpdateDraft}
          onSave={handleSaveDeal}
          onBack={handleBack}
          isDirty={isDraftDirty}
          onPdfError={(msg) => toast.push(msg, "error")}
          onPdfSuccess={(msg) => toast.push(msg, "success")}
          onDelete={activeDealId ? () => {
            if (confirm("Delete this deal permanently?")) handleDeleteDeal(activeDealId);
          } : null}
        />
      )}

      {view === "analyzer" && !activeDeal && (
        <div style={{ maxWidth: 600, margin: "60px auto", padding: 28, textAlign: "center" }}>
          <p style={{ color: THEME.textMuted, marginBottom: 20 }}>
            No deal selected. Start a new analysis or pick one from the dashboard.
          </p>
          <button className="btn-primary" onClick={handleNewDeal}>
            <Plus size={14} />
            New Deal
          </button>
        </div>
      )}

      {view === "market" && <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile() ? "16px" : "24px 28px" }}>
        <MarketIntelRibbon />
        <div style={{ marginBottom: 24 }}>
          <h1 className="serif" style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
            Market Intelligence
          </h1>
          <div style={{ fontSize: 13, color: THEME.textMuted, marginTop: 4 }}>
            Research investment markets across the US
          </div>
        </div>
        <ErrorBoundary><AdvancedMarketIntel /></ErrorBoundary>
      </div>}

      {view === "watchlist" && <WatchlistView />}

      {view === "team" && <TeamView />}

      {view === "plans" && <PlansView />}

      {view === "wholesale" && <WholesaleView />}

      {view === "education" && <EducationCenter />}

      {view === "terms" && <TermsView />}

      {view === "home" && (
        <HomeView
          onChangeView={handleChangeView}
          onNewDeal={handleNewDeal}
          onOpenCalculator={() => setShowCalculator(true)}
        />
      )}

      {view === "inspections" && (
        <InspectionsView onChangeView={handleChangeView} />
      )}

      {showTemplatePicker && (
        <TemplatePicker
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}

      {pendingNav && (
        <UnsavedChangesModal
          onSave={() => resolvePendingNav("save")}
          onDiscard={() => resolvePendingNav("discard")}
          onCancel={() => resolvePendingNav("cancel")}
        />
      )}

      {showCalculator && (
        <MortgageCalculatorModal onClose={() => setShowCalculator(false)} />
      )}

      <div style={{
        maxWidth: 1400, margin: "0 auto",
        padding: "24px 28px", borderTop: `1px solid ${THEME.border}`,
        marginTop: 60,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 11, color: THEME.textMuted, flexWrap: "wrap", gap: 8
      }}>
        <div>Deal Docket v3.0 Professional</div>
        <div>© 2026 Deal Docket</div>
      </div>

      {/* Ari — Claude-powered floating chat assistant. Always mounted; the
          widget itself decides whether to render the launcher or panel. */}
      <AriChat />
    </div>
    </AppActionsContext.Provider>
  );
}

export default function BRRRRTracker() {
  return (
    <ToastHost>
      <BRRRRTrackerInner />
    </ToastHost>
  );
}

