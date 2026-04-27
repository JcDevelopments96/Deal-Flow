/* ============================================================================
   MarketIntelRibbon — persistent page-header ribbon that appears at the top
   of the Market Intel view when the signed-in user is on the free plan (or
   not signed in yet). Labels the whole page as a paid feature and auto-opens
   the plan picker once per browser session.
   ============================================================================ */
import React, { useEffect, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { THEME } from "../theme.js";
import { isSaasMode, useSaasUser } from "../lib/saas.js";
import { UpgradeModal } from "../modals/UpgradeModal.jsx";

// Session-scoped flag so we don't re-prompt every time the user comes back to
// Market Intel during the same tab. They see the modal on their first visit;
// after that it only opens via explicit button clicks.
const PROMPTED_KEY = "dealtrack.upgrade_prompted.v1";

export const MarketIntelRibbon = () => {
  const saasOn = isSaasMode();
  const saas = useSaasUser();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const isSignedOut = saasOn && !saas.user;
  const isFree = saasOn && !!saas.user && saas.usage?.plan === "free";
  const shouldShow = saasOn && (isSignedOut || isFree);

  // Auto-open the plan picker on first Market Intel visit per session for
  // signed-in free users only (signed-out users need to sign in first).
  useEffect(() => {
    if (!isFree) return;
    let prompted = false;
    try { prompted = !!sessionStorage.getItem(PROMPTED_KEY); } catch { /* ignore */ }
    if (!prompted) setShowUpgrade(true);
  }, [isFree]);

  const markPrompted = () => {
    try { sessionStorage.setItem(PROMPTED_KEY, "1"); } catch { /* ignore */ }
  };

  const handleClose = () => {
    setShowUpgrade(false);
    markPrompted();
  };

  if (!shouldShow) return null;

  const copy = isSignedOut
    ? {
        eyebrow: "Paid feature",
        title: "Market Intel is a Deal Docket subscription feature",
        body: "Sign in or create an account at the top of the page, then pick a plan to unlock live MLS listings, rental comps, and map drill-down.",
        cta: null
      }
    : {
        eyebrow: "Paid feature",
        title: "Unlock Market Intel",
        body: "Live listings, rental comparables, and map click-through are unlimited on Pro. Cancel anytime.",
        cta: { label: "Choose a plan", onClick: () => setShowUpgrade(true) }
      };

  return (
    <>
      <div
        role="region"
        aria-label="Market Intel paid feature notice"
        style={{
          display: "flex",
          gap: 14,
          alignItems: "center",
          padding: "14px 18px 14px 22px",
          margin: "0 0 24px 0",
          background: THEME.bgOrange,
          // Ribbon treatment: chunky left accent stripe instead of a gradient.
          borderLeft: `6px solid ${THEME.orange}`,
          borderTop: `1px solid ${THEME.orangeDim}20`,
          borderRight: `1px solid ${THEME.orangeDim}20`,
          borderBottom: `1px solid ${THEME.orangeDim}20`,
          borderRadius: "0 8px 8px 0",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)"
        }}
      >
        <div style={{
          flexShrink: 0,
          width: 40, height: 40, borderRadius: 8,
          background: THEME.orange, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Lock size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="label-xs-accent" style={{
            color: THEME.orange, fontWeight: 700, marginBottom: 2
          }}>
            <Sparkles size={10} style={{ marginRight: 4, verticalAlign: "-1px" }} />
            {copy.eyebrow}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: THEME.text, marginBottom: 2 }}>
            {copy.title}
          </div>
          <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.5 }}>
            {copy.body}
          </div>
        </div>
        {copy.cta && (
          <button
            onClick={copy.cta.onClick}
            className="btn-accent-orange"
            style={{ padding: "10px 16px", fontSize: 13, flexShrink: 0 }}
          >
            {copy.cta.label}
          </button>
        )}
      </div>

      {showUpgrade && saas.plans && (
        <UpgradeModal
          plans={saas.plans}
          currentPlan={saas.usage?.plan}
          getToken={saas.getToken}
          reason="Market Intel requires a paid plan. Pick one to load real listings — cancel anytime."
          onClose={handleClose}
        />
      )}
    </>
  );
};
