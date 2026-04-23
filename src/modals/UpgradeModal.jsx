/* ============================================================================
   UpgradeModal — plan picker shown when the user hits their quota or clicks
   the "Upgrade" CTA. Hits /api/stripe/checkout to create a Checkout session,
   then redirects to Stripe. If Stripe isn't wired up yet, the 503 gets
   translated into an inline "Billing coming soon" note so the modal is
   still useful as an info screen.
   ============================================================================ */
import React, { useEffect, useState } from "react";
import { X, Check, AlertTriangle, CreditCard } from "lucide-react";
import { THEME } from "../theme.js";
import { fetchMetered, ApiRequestError } from "../lib/saas.js";

export const UpgradeModal = ({ plans, currentPlan, getToken, onClose, reason }) => {
  const [working, setWorking] = useState(null); // planKey currently being checked out
  const [error, setError] = useState(null);

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
        body: JSON.stringify({ planKey })
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

        <div style={{
          padding: 24, display: "grid",
          gridTemplateColumns: paidPlans.length === 3 ? "repeat(3, 1fr)" : "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14
        }}>
          {paidPlans.map(plan => {
            const isCurrent = plan.key === currentPlan;
            const isWorking = working === plan.key;
            const overageLabel = plan.overageCostCents != null
              ? `then $${(plan.overageCostCents / 100).toFixed(2)} / click`
              : null;
            return (
              <div
                key={plan.key}
                style={{
                  padding: 18,
                  border: `1px solid ${isCurrent ? THEME.teal : THEME.border}`,
                  borderRadius: 10,
                  background: isCurrent ? THEME.bgTeal : THEME.bgPanel,
                  display: "flex", flexDirection: "column", gap: 10
                }}
              >
                <div style={{ fontSize: 11, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>
                  {plan.name}
                </div>
                <div className="serif">
                  <span style={{ fontSize: 32, fontWeight: 700 }}>${plan.priceMonthly}</span>
                  <span style={{ fontSize: 13, color: THEME.textMuted, marginLeft: 4 }}>/ mo</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  <li style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    <Check size={13} color={THEME.green} />
                    {plan.includedClicks.toLocaleString()} Market Intel clicks / month
                  </li>
                  {overageLabel && (
                    <li style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: THEME.textMuted }}>
                      <Check size={13} color={THEME.green} />
                      {overageLabel}
                    </li>
                  )}
                  <li style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: THEME.textMuted }}>
                    <Check size={13} color={THEME.green} />
                    Cancel anytime
                  </li>
                </ul>
                <button
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={isCurrent || isWorking || !plan.stripePriceId}
                  className={isCurrent ? "btn-secondary" : "btn-primary"}
                  style={{
                    padding: "10px 14px", fontSize: 13, marginTop: "auto",
                    justifyContent: "center",
                    opacity: (!plan.stripePriceId && !isCurrent) ? 0.5 : 1,
                    cursor: (isCurrent || !plan.stripePriceId) ? "not-allowed" : "pointer"
                  }}
                  title={!plan.stripePriceId ? "Stripe price id not set for this plan yet." : undefined}
                >
                  {isCurrent ? "Current plan" :
                   isWorking ? "Redirecting…" :
                   !plan.stripePriceId ? "Not yet configured" :
                   <><CreditCard size={13} /> Upgrade</>}
                </button>
              </div>
            );
          })}
        </div>

        <div style={{
          padding: "12px 24px 20px", borderTop: `1px solid ${THEME.border}`,
          fontSize: 11, color: THEME.textDim, lineHeight: 1.5
        }}>
          All plans run on DealTrack's own RentCast key — you don't need to bring
          your own. Usage is metered server-side; it resets at the start of each
          billing period.
        </div>
      </div>
    </div>
  );
};
