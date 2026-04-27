/* ============================================================================
   PLANS VIEW — full-page pricing page. Reuses the same cadence toggle +
   price cards as the UpgradeModal but renders inline so users can find
   and compare plans any time, not just when they hit quota.
   ============================================================================ */
import React, { useState } from "react";
import { Check, CreditCard, Sparkles, AlertTriangle } from "lucide-react";
import { SignUpButton } from "@clerk/react";
import { THEME } from "../theme.js";
import { isMobile } from "../utils.js";
import { Panel } from "../primitives.jsx";
import { isSaasMode, useSaasUser, fetchMetered, ApiRequestError } from "../lib/saas.js";

/* Static plan list for the signed-out marketing render. Mirrors
 * api/_lib/plans.js — when the user is signed in, useSaasUser() loads
 * the live projection (with their actual Stripe price IDs) from /api/me
 * and overrides this. Without it, signed-out visitors hit /plans and
 * see a blank grid because the auth-gated /api/me call returns null. */
const STATIC_PLANS = [
  {
    key: "free", name: "Free",
    priceMonthly: 0, priceAnnual: 0,
    includedClicks: 5, aiMessages: 10,
    overageCostCents: null, mostPopular: false,
    stripePriceId: null, stripePriceIdAnnual: null
  },
  {
    key: "starter", name: "Starter",
    priceMonthly: 29, priceAnnual: 290,
    includedClicks: 100, aiMessages: 50,
    overageCostCents: 10, mostPopular: false,
    stripePriceId: null, stripePriceIdAnnual: null
  },
  {
    key: "pro", name: "Pro",
    priceMonthly: 79, priceAnnual: 790,
    includedClicks: 500, aiMessages: 200,
    overageCostCents: 10, mostPopular: true,
    stripePriceId: null, stripePriceIdAnnual: null
  },
  {
    key: "scale", name: "Scale",
    priceMonthly: 199, priceAnnual: 1990,
    includedClicks: 2500, aiMessages: -1,
    overageCostCents: 10, mostPopular: false,
    stripePriceId: null, stripePriceIdAnnual: null
  }
];

const FAQS = [
  {
    q: "What counts as a 'Market Intel click'?",
    a: "Each call to the state/city listings API is one click. Picking a state, clicking a county on the map, or running a search each use 1 click. Opening a specific listing's photo gallery, the watchlist, the team CRM, and the Ari AI chat don't cost clicks."
  },
  {
    q: "Can I switch plans or cancel anytime?",
    a: "Yes — manage your subscription via the Stripe customer portal. Downgrades and cancellations take effect at the end of the current billing period."
  },
  {
    q: "What happens if I go over my monthly click limit?",
    a: "Paid plans include a flat $0.10/click overage — no surprise throttling. Free plan stops at 5 and shows an upgrade prompt."
  },
  {
    q: "Do annual plans save me money?",
    a: "Yes — annual billing is ~17% off (2 months free). Pro goes from $79/mo to $66/mo equivalent, $790/yr."
  }
];

export const PlansView = () => {
  const saas = useSaasUser();
  const saasOn = isSaasMode();
  const [cadence, setCadence] = useState("annual");
  const [working, setWorking] = useState(null);
  const [error, setError] = useState(null);

  // Live plan list (with the user's resolved Stripe price IDs) takes
  // precedence; fall back to the marketing-only static list when
  // signed-out so visitors still see all four cards.
  const plans = (saas.plans && saas.plans.length > 0) ? saas.plans : STATIC_PLANS;
  const currentPlan = saas.usage?.plan;

  const handleChoose = async (planKey) => {
    if (!saasOn || !saas.user) {
      setError("Please sign in at the top of the page first.");
      return;
    }
    setWorking(planKey);
    setError(null);
    try {
      const body = await fetchMetered(saas.getToken, "/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ planKey, cadence })
      });
      if (body.url) window.location.href = body.url;
      else throw new Error("No checkout URL returned.");
    } catch (err) {
      let msg;
      if (err instanceof ApiRequestError && err.status === 503) {
        msg = "Billing isn't configured yet. " + (err.detail || "Check Stripe env vars.");
      } else {
        msg = err.message || "Checkout failed.";
      }
      setError(msg);
      setWorking(null);
    }
  };

  // Sends current subscriber to the Stripe Customer Portal to update card,
  // change plan, or cancel — closes the gap where users could subscribe but
  // had no in-app way to manage billing afterwards.
  const handleManageBilling = async () => {
    if (!saasOn || !saas.user) return;
    setWorking("portal");
    setError(null);
    try {
      const body = await fetchMetered(saas.getToken, "/api/stripe/portal", { method: "POST" });
      if (body.url) window.location.href = body.url;
      else throw new Error("No portal URL returned.");
    } catch (err) {
      const msg = err instanceof ApiRequestError && err.status === 404
        ? "You don't have an active subscription yet — pick a plan below."
        : err.message || "Couldn't open billing portal.";
      setError(msg);
      setWorking(null);
    }
  };
  const isPaidUser = currentPlan && currentPlan !== "free";

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile() ? 16 : "32px 28px" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 className="serif" style={{ fontSize: 36, fontWeight: 700, margin: "0 0 8px" }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: 15, color: THEME.textMuted, margin: 0 }}>
          Every plan includes the full Deal Analyzer, Watchlist, Team CRM, Ari AI assistant, and the free data stack (FRED + HUD + Census + BLS + FEMA + Zillow + Redfin).
        </p>
      </div>

      {/* Existing subscriber → drop into the Stripe Customer Portal to
          update card, switch plans, or cancel. Hidden for free users. */}
      {isPaidUser && (
        <div style={{
          maxWidth: 680, margin: "0 auto 20px", padding: "12px 16px",
          background: THEME.bgTeal, border: `1px solid ${THEME.teal}`,
          borderRadius: 8, fontSize: 13,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: THEME.teal }}>
            <CreditCard size={14} />
            <span>You're on the <strong style={{ textTransform: "capitalize" }}>{currentPlan}</strong> plan.</span>
          </div>
          <button
            onClick={handleManageBilling}
            disabled={working === "portal"}
            className="btn-secondary"
            style={{ padding: "7px 14px", fontSize: 12 }}>
            {working === "portal" ? "Opening…" : "Manage billing"}
          </button>
        </div>
      )}

      {/* Cadence toggle */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <div style={{
          display: "inline-flex", padding: 4,
          background: THEME.bgPanel, borderRadius: 999,
          border: `1px solid ${THEME.border}`
        }}>
          {[{ key: "monthly", label: "Monthly" }, { key: "annual", label: "Annual", badge: "Save 17%" }].map(opt => (
            <button
              key={opt.key}
              onClick={() => setCadence(opt.key)}
              style={{
                padding: "7px 18px", fontSize: 13, fontWeight: 700,
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
                  fontSize: 9, padding: "2px 7px", borderRadius: 4,
                  background: cadence === opt.key ? "rgba(255,255,255,0.2)" : THEME.greenDim,
                  color: cadence === opt.key ? "#FFFFFF" : THEME.green,
                  letterSpacing: "0.05em"
                }}>{opt.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          margin: "0 auto 20px", maxWidth: 680, padding: 12,
          background: THEME.bgOrange, color: THEME.orange,
          border: `1px solid ${THEME.orange}`, borderRadius: 6,
          fontSize: 12, lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 8
        }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Plan cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile() ? "1fr" : "repeat(4, 1fr)",
        gap: 16
      }}>
        {plans.map(plan => {
          const isCurrent = plan.key === currentPlan;
          const isWorking = working === plan.key;
          const isFree = plan.key === "free";
          const isAnnual = cadence === "annual";
          const monthlyEquiv = isAnnual && plan.priceAnnual > 0
            ? Math.round((plan.priceAnnual / 12) * 100) / 100
            : plan.priceMonthly;
          const stripePriceId = isAnnual ? plan.stripePriceIdAnnual : plan.stripePriceId;
          const popular = plan.mostPopular && !isCurrent;
          const disabled = isFree || isCurrent || !stripePriceId;

          return (
            <div key={plan.key} style={{
              position: "relative",
              padding: 20,
              border: `${popular ? 2 : 1}px solid ${
                isCurrent ? THEME.teal :
                popular ? THEME.accent : THEME.border
              }`,
              borderRadius: 12,
              background: isCurrent ? THEME.bgTeal : isFree ? THEME.bgPanel : THEME.bg,
              display: "flex", flexDirection: "column", gap: 12,
              transform: popular ? "translateY(-6px)" : "none",
              boxShadow: popular ? "0 8px 24px rgba(15,23,42,0.09)" : "none"
            }}>
              {popular && (
                <div style={{
                  position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
                  padding: "3px 12px", fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  background: THEME.accent, color: "#FFFFFF",
                  borderRadius: 999
                }}>Most Popular</div>
              )}
              {isCurrent && (
                <div style={{
                  position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
                  padding: "3px 12px", fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  background: THEME.teal, color: "#FFFFFF",
                  borderRadius: 999
                }}>Your Plan</div>
              )}

              <div style={{ fontSize: 11, color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 700 }}>
                {plan.name}
              </div>

              <div className="serif">
                <span style={{ fontSize: 36, fontWeight: 700 }}>
                  ${isAnnual && plan.priceAnnual > 0 ? monthlyEquiv.toFixed(0) : plan.priceMonthly}
                </span>
                <span style={{ fontSize: 13, color: THEME.textMuted, marginLeft: 4 }}>/ mo</span>
                {isAnnual && plan.priceAnnual > 0 && (
                  <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 4 }}>
                    <span style={{ textDecoration: "line-through", marginRight: 6 }}>${plan.priceMonthly * 12}/yr</span>
                    <span style={{ color: THEME.green, fontWeight: 700 }}>${plan.priceAnnual}/yr</span>
                  </div>
                )}
                {isFree && <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 4 }}>No credit card required</div>}
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <Check size={14} color={THEME.green} />
                  <span><strong>{plan.includedClicks.toLocaleString()}</strong>&nbsp;Market Intel clicks/mo</span>
                </li>
                {plan.aiMessages != null && (
                  <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <Sparkles size={14} color={THEME.accent} />
                    <span><strong>{plan.aiMessages === -1 ? "Unlimited" : plan.aiMessages}</strong>&nbsp;Ari AI msgs/mo</span>
                  </li>
                )}
                {plan.overageCostCents != null && (
                  <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: THEME.textMuted }}>
                    <Check size={14} color={THEME.green} />
                    <span>${(plan.overageCostCents / 100).toFixed(2)} / click above plan</span>
                  </li>
                )}
                <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: THEME.textMuted }}>
                  <Check size={14} color={THEME.green} />
                  <span>Off-Market leads + skip trace</span>
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: THEME.textMuted }}>
                  <Check size={14} color={THEME.green} />
                  <span>Ari inspection summaries (PDF/Excel/Word)</span>
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: THEME.textMuted }}>
                  <Check size={14} color={THEME.green} />
                  <span>Full Analyzer, Watchlist, Team, Ari AI</span>
                </li>
                {/* Saved-deal cap on free is THE upgrade trigger; paid
                    cards advertise unlimited as the headline benefit. */}
                {isFree ? (
                  <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: THEME.orange }}>
                    <Check size={14} color={THEME.orange} />
                    <span><strong>Caps at 1 saved deal</strong></span>
                  </li>
                ) : (
                  <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: THEME.textMuted }}>
                    <Check size={14} color={THEME.green} />
                    <span><strong>Unlimited saved deals</strong></span>
                  </li>
                )}
                {!isFree && (
                  <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: THEME.textMuted }}>
                    <Check size={14} color={THEME.green} />
                    <span>Cancel anytime</span>
                  </li>
                )}
              </ul>

              {!isFree && !saas.user && (
                /* Signed-out: drop them into Clerk's sign-up modal first.
                   After auth they land back on /plans and the live
                   useSaasUser-loaded plan list takes over with real
                   Stripe price IDs. */
                <SignUpButton mode="modal">
                  <button
                    className={popular ? "btn-primary" : "btn-secondary"}
                    style={{
                      padding: "11px 14px", fontSize: 13, marginTop: "auto",
                      justifyContent: "center", cursor: "pointer"
                    }}
                  >
                    <CreditCard size={13} /> Sign up &amp; choose {plan.name}
                  </button>
                </SignUpButton>
              )}
              {!isFree && saas.user && (
                <button
                  onClick={() => handleChoose(plan.key)}
                  disabled={disabled || isWorking}
                  className={isCurrent ? "btn-secondary" : popular ? "btn-primary" : "btn-secondary"}
                  style={{
                    padding: "11px 14px", fontSize: 13, marginTop: "auto",
                    justifyContent: "center",
                    opacity: disabled ? 0.5 : 1,
                    cursor: disabled ? "not-allowed" : "pointer"
                  }}
                >
                  {isCurrent ? "Current plan" :
                   isWorking ? "Redirecting…" :
                   !stripePriceId ? `${cadence === "annual" ? "Annual" : "Monthly"} not configured` :
                   <><CreditCard size={13} /> Choose {plan.name}</>}
                </button>
              )}
              {isFree && (
                <div style={{ marginTop: "auto", fontSize: 11, color: THEME.textMuted, textAlign: "center" }}>
                  {!saas.user ? "Sign up at the top of the page" : isCurrent ? "You're on Free — upgrade anytime" : "Available on any plan"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comparison / FAQ */}
      <div style={{ marginTop: 40 }}>
        <Panel title="Frequently Asked Questions" accent>
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "1fr 1fr", gap: 20 }}>
            {FAQS.map(f => (
              <div key={f.q}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{f.q}</div>
                <div style={{ fontSize: 13, color: THEME.textMuted, lineHeight: 1.6 }}>{f.a}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div style={{ marginTop: 20, fontSize: 11, color: THEME.textDim, textAlign: "center" }}>
        Billing powered by Stripe. All major cards accepted. Prices in USD.
      </div>
    </div>
  );
};
