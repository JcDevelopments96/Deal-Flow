/* ============================================================================
   MarketIntelRibbon — contextual usage banner at the top of the Market
   Intel view. Shows different states depending on where the user is:

   - Signed-out  : friendly intro + Sign up CTA
   - Free + 0%   : hidden (no need to nag — 10 clicks is plenty for browsing)
   - Free + 70-99%: amber nudge ("X of 10 used") with Upgrade CTA
   - Free + 100% : red gate ("You're at the cap") + Upgrade CTA
   - Paid        : hidden (clicks aren't a friction point)
   ============================================================================ */
import React, { useState } from "react";
import { TrendingUp, AlertTriangle, Sparkles } from "lucide-react";
import { Show, SignUpButton } from "@clerk/react";
import { THEME } from "../theme.js";
import { isSaasMode, useSaasUser } from "../lib/saas.js";
import { UpgradeModal } from "../modals/UpgradeModal.jsx";

// 70% is the "soft warning" threshold — same convention as fuel gauges.
// Past it, we start nudging; before it, the user has plenty of headroom.
const NUDGE_THRESHOLD = 0.7;

export const MarketIntelRibbon = () => {
  const saasOn = isSaasMode();
  const saas = useSaasUser();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (!saasOn) return null;

  const isSignedOut = !saas.user;
  const plan = saas.usage?.plan;
  const isFree = !!saas.user && plan === "free";
  const remaining = saas.usage?.remaining ?? null;
  const limit = saas.usage?.limit ?? null;
  const used = (remaining != null && limit != null) ? (limit - remaining) : 0;
  const ratio = (limit && limit > 0) ? used / limit : 0;
  const isAtCap = isFree && remaining === 0;
  const isNearCap = isFree && ratio >= NUDGE_THRESHOLD && !isAtCap;

  // Render decision tree
  let copy = null;
  let tone = "info";   // "info" | "warn" | "danger"

  if (isSignedOut) {
    copy = {
      title: "Sign up to use Market Intel",
      body: "Free plan includes 10 county-level clicks/mo. No credit card required."
    };
    tone = "info";
  } else if (isAtCap) {
    copy = {
      title: "You've used all 10 free clicks this month",
      body: "Pro gets you 500/mo at $49 — start a 7-day free trial to keep researching."
    };
    tone = "danger";
  } else if (isNearCap) {
    copy = {
      title: `${used} of ${limit} clicks used this month`,
      body: `You've got ${remaining} left. Pro bumps that to 500/mo for $49 — 7-day free trial.`
    };
    tone = "warn";
  } else {
    return null;          // paid users + free users with plenty left → no banner
  }

  const palette = tone === "danger"
    ? { bg: THEME.redDim, border: THEME.red, accent: THEME.red, icon: <AlertTriangle size={18} /> }
    : tone === "warn"
      ? { bg: THEME.bgOrange, border: THEME.orange, accent: THEME.orange, icon: <TrendingUp size={18} /> }
      : { bg: THEME.bgRaised, border: THEME.accent, accent: THEME.accent, icon: <Sparkles size={18} /> };

  return (
    <>
      <div
        role="region"
        aria-label="Market Intel usage notice"
        style={{
          display: "flex",
          gap: 14,
          alignItems: "center",
          padding: "12px 18px",
          margin: "0 0 22px 0",
          background: palette.bg,
          borderLeft: `5px solid ${palette.border}`,
          borderRadius: "0 8px 8px 0",
          flexWrap: "wrap"
        }}
      >
        <div style={{
          flexShrink: 0,
          width: 36, height: 36, borderRadius: 8,
          background: palette.accent, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          {palette.icon}
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: THEME.text, marginBottom: 2 }}>
            {copy.title}
          </div>
          <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.5 }}>
            {copy.body}
          </div>
        </div>

        {/* Action button — varies by state */}
        {isSignedOut ? (
          <Show when="signed-out">
            <SignUpButton mode="modal">
              <button
                className="btn-primary"
                style={{ padding: "9px 16px", fontSize: 13, flexShrink: 0 }}
              >
                Sign up free
              </button>
            </SignUpButton>
          </Show>
        ) : (
          <button
            onClick={() => setShowUpgrade(true)}
            className={tone === "danger" ? "btn-primary" : "btn-accent-orange"}
            style={{ padding: "9px 16px", fontSize: 13, flexShrink: 0 }}
          >
            Start free trial
          </button>
        )}
      </div>

      {showUpgrade && saas.plans && (
        <UpgradeModal
          plans={saas.plans}
          currentPlan={saas.usage?.plan}
          getToken={saas.getToken}
          reason={isAtCap
            ? "You've hit the 10-click free cap. Pro gives you 500 Market Intel clicks/mo plus unlimited deals and inspections — 7 days free, cancel anytime."
            : "You're approaching your monthly click cap. Pro gives you 500 clicks/mo plus unlimited deals and inspections — 7 days free, cancel anytime."}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </>
  );
};
