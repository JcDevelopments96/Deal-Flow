/* ============================================================================
   UpgradeModal — plan picker shown when the user hits their quota or clicks
   the "Upgrade" CTA. Hits /api/stripe/checkout to create a Checkout session,
   then redirects to Stripe. If Stripe isn't wired up yet, the 503 gets
   translated into an inline "Billing coming soon" note so the modal is
   still useful as an info screen.
   ============================================================================ */
import React, { useEffect, useState } from "react";
import { X, Check, AlertTriangle, CreditCard, Sparkles } from "lucide-react";
import { THEME } from "../theme.js";
import { fetchMetered, ApiRequestError } from "../lib/saas.js";

export const UpgradeModal = ({ plans, currentPlan, getToken, onClose, reason }) => {
  const [working, setWorking] = useState(null);
  const [error, setError] = useState(null);
  // Annual is the default — bigger ARR + better unit economics for us, and the
  // visible savings nudge users toward it. Monthly toggle stays one click away.
  const [cadence, setCadence] = useState("annual");

  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const paidPlans = (plans || []).filter(p => p.key !== "free");

  const handleUpgrade = async (planKey) => {
    setWorking(planKey);
    setError(null);
    try {
      const body = await fetchMetered(getToken, "/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ planKey, cadence })
      });
      if (body.url) {
        window.location.href = body.url;
      } else {
        throw new Error("No checkout URL returned.");
      }
    } catch (err) {
      let msg;
      if (err instanceof ApiRequestError && err.status === 503) {
        msg = "Billing isn't configured yet on this deployment. " +
              (err.detail || "Add your Stripe keys in Vercel env vars and redeploy.");
      } else {
        msg = err.message || "Checkout failed.";
      }
      setError(msg);
      setWorking(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 200, padding: 16, overflowY: "auto"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: THEME.bg, borderRadius: 12,
          maxWidth: 820, width: "100%",
          marginTop: 40, marginBottom: 40,
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.22)",
          animation: "modalFadeIn 0.2s ease-out",
          overflow: "hidden"
        }}
      >
        <div style={{
          padding: "16px 24px",
          borderBottom: `1px solid ${THEME.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10
        }}>
          <div>
            <h2 className="serif" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
              Choose a plan
            </h2>
            <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 2 }}>
              {reason || "Upgrade to get more Market Intel clicks each month."}
              {" "}Cancel anytime from the Stripe customer portal.
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "transparent", border: `1px solid ${THEME.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: THEME.textMuted, cursor: "pointer"
            }}
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div style={{
            margin: 16, padding: 12,
            background: THEME.bgOrange, color: THEME.orange,
            border: `1px solid ${THEME.orange}`, borderRadius: 6,
            fontSize: 12, lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 8
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Cadence toggle — annual is default + saves 2 months */}
        <div style={{ display: "flex", justifyContent: "center", padding: "16px 24px 0" }}>
          <div style={{
            display: "inline-flex", padding: 4,
            background: THEME.bgPanel, borderRadius: 999,
            border: `1px solid ${THEME.border}`
          }}>
            {[
              { key: "monthly", label: "Monthly" },
              { key: "annual",  label: "Annual", badge: "2 months free" }
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setCadence(opt.key)}
                style={{
                  padding: "6px 16px", fontSize: 12, fontWeight: 700,
                  borderRadius: 999, border: "none",
                  background: cadence === opt.key ? THEME.accent : "transparent",
                  color: cadence === opt.key ? "#FFFFFF" : THEME.textMuted,
                  cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 6
                }}
              >
                {opt.label}
                {opt.badge && (
                  <span style={{
                    fontSize: 9, padding: "2px 6px", borderRadius: 4,
                    background: cadence === opt.key ? "rgba(255,255,255,0.2)" : THEME.greenDim,
                    color: cadence === opt.key ? "#FFFFFF" : THEME.green,
                    letterSpacing: "0.05em"
                  }}>
                    {opt.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          padding: 24, display: "grid",
          gridTemplateColumns: paidPlans.length === 3 ? "repeat(3, 1fr)" : "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14
        }}>
          {paidPlans.map(plan => {
            const isCurrent = plan.key === currentPlan;
            const isWorking = working === plan.key;
            const isAnnual = cadence === "annual";
            const priceForCadence = isAnnual ? plan.priceAnnual : plan.priceMonthly;
            const monthlyEquiv = isAnnual ? Math.round((plan.priceAnnual / 12) * 100) / 100 : plan.priceMonthly;
            const stripePriceId = isAnnual ? plan.stripePriceIdAnnual : plan.stripePriceId;
            const overageLabel = plan.overageCostCents != null
              ? `then $${(plan.overageCostCents / 100).toFixed(2)} / click after that`
              : null;
            const popular = plan.mostPopular && !isCurrent;
            return (
              <div
                key={plan.key}
                style={{
                  position: "relative",
                  padding: 18,
                  border: `${popular ? 2 : 1}px solid ${
                    isCurrent ? THEME.teal :
                    popular ? THEME.accent : THEME.border
                  }`,
                  borderRadius: 10,
                  background: isCurrent ? THEME.bgTeal : THEME.bgPanel,
                  display: "flex", flexDirection: "column", gap: 10,
                  transform: popular ? "translateY(-4px)" : "none",
                  boxShadow: popular ? "0 6px 20px rgba(15,23,42,0.08)" : "none"
                }}
              >
                {popular && (
                  <div style={{
                    position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                    padding: "3px 10px", fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    background: THEME.accent, color: "#FFFFFF",
                    borderRadius: 999
                  }}>
                    Most Popular
                  </div>
                )}
                <div style={{ fontSize: 11, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>
                  {plan.name}
                </div>
                <div className="serif">
                  <span style={{ fontSize: 32, fontWeight: 700 }}>
                    ${isAnnual ? monthlyEquiv.toFixed(0) : priceForCadence}
                  </span>
                  <span style={{ fontSize: 13, color: THEME.textMuted, marginLeft: 4 }}>/ mo</span>
                  {isAnnual && plan.priceAnnual > 0 && (
                    <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 2 }}>
                      <span style={{ textDecoration: "line-through", marginRight: 6 }}>${plan.priceMonthly * 12}/yr</span>
                      <span style={{ color: THEME.green, fontWeight: 700 }}>${plan.priceAnnual}/yr</span>
                    </div>
                  )}
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  <li style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    <Check size={13} color={THEME.green} />
                    <strong>{plan.includedClicks.toLocaleString()}</strong>&nbsp;Market Intel clicks/mo
                  </li>
                  {plan.aiMessages != null && (
                    <li style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <Sparkles size={13} color={THEME.accent} />
                      <strong>{plan.aiMessages === -1 ? "Unlimited" : plan.aiMessages}</strong>&nbsp;Ari AI messages/mo
                    </li>
                  )}
                  {overageLabel && (
                    <li style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: THEME.textMuted }}>
                      <Check size={13} color={THEME.green} />
                      {overageLabel}
                    </li>
                  )}
                  <li style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: THEME.textMuted }}>
                    <Check size={13} color={THEME.green} />
                    Cancel anytime
                  </li>
                </ul>
                <button
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={isCurrent || isWorking || !stripePriceId}
                  className={isCurrent ? "btn-secondary" : "btn-primary"}
                  style={{
                    padding: "10px 14px", fontSize: 13, marginTop: "auto",
                    justifyContent: "center",
                    opacity: (!stripePriceId && !isCurrent) ? 0.5 : 1,
                    cursor: (isCurrent || !stripePriceId) ? "not-allowed" : "pointer"
                  }}
                  title={!stripePriceId ? `Stripe ${cadence} price id not set for this plan yet.` : undefined}
                >
                  {isCurrent ? "Current plan" :
                   isWorking ? "Redirecting…" :
                   !stripePriceId ? `${cadence === "annual" ? "Annual" : "Monthly"} not configured` :
                   <><CreditCard size={13} /> Choose {plan.name}</>}
                </button>
              </div>
            );
          })}
        </div>

        <div style={{
          padding: "12px 24px 20px", borderTop: `1px solid ${THEME.border}`,
          fontSize: 11, color: THEME.textDim, lineHeight: 1.5
        }}>
          All plans include the full Deal Analyzer, Watchlist, Team CRM, and live data
          from FRED, HUD, Census, BLS, FEMA, Zillow, and Redfin. Usage resets at
          the start of each billing period. Manage or cancel anytime via the
          Stripe customer portal.
        </div>
      </div>
    </div>
  );
};
