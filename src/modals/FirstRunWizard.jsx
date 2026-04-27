/* ============================================================================
   FIRST-RUN WIZARD — fires once on first sign-in, routes the user into
   the part of the app most relevant to them. We persist a "completed"
   flag in localStorage so subsequent sessions skip it. The flag is keyed
   on the user id when available so the wizard re-fires for fresh
   accounts on the same browser.

   Three steps:
     1. Welcome / value prop
     2. Pick a starting action (Find Properties / Off-Market / Analyzer)
     3. Wizard closes; App routes to that view
   Each step has a Skip option that just closes the modal.
   ============================================================================ */
import React, { useState } from "react";
import { Search, Crown, Calculator, X, ArrowRight, Sparkles } from "lucide-react";
import { THEME } from "../theme.js";
import { isMobile } from "../utils.js";

export const FIRST_RUN_KEY = (userId) => `dealdocket-first-run:${userId || "anon"}`;

/** Marks the wizard as done so it doesn't re-fire. */
export function markFirstRunComplete(userId) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(FIRST_RUN_KEY(userId), "1");
    }
  } catch {}
}

/** Has the wizard already completed for this user? */
export function isFirstRunComplete(userId) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return true;
    return window.localStorage.getItem(FIRST_RUN_KEY(userId)) === "1";
  } catch { return true; }
}

const PATHS = [
  {
    key: "market",
    icon: <Search size={20} />,
    color: THEME.accent,
    title: "Find a property to analyze",
    desc: "Browse live MLS listings on the county map. Pick a state, click a pin, jump into the analyzer with all the numbers pre-loaded."
  },
  {
    key: "wholesale",
    icon: <Crown size={20} />,
    color: "#9333EA",
    title: "Hunt off-market leads",
    desc: "Search by city or ZIP for absentee owners and pre-foreclosures. Save the ones worth pursuing, skip-trace, and email."
  },
  {
    key: "__newDeal",
    icon: <Calculator size={20} />,
    color: THEME.teal,
    title: "I already have a property",
    desc: "Skip sourcing — go straight to the analyzer. Plug in price, rehab, ARV, rents, and get a strategy recommendation."
  }
];

export const FirstRunWizard = ({ userName, onPick, onSkip }) => {
  const [step, setStep] = useState(0);

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Welcome to Deal Docket"
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(15, 23, 42, 0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: isMobile() ? 16 : 24,
        animation: "fadeIn 0.2s ease-out"
      }}
    >
      <div style={{
        width: "min(620px, 100%)",
        maxHeight: "90vh", overflowY: "auto",
        background: THEME.bg, color: THEME.text,
        borderRadius: 14,
        boxShadow: "0 20px 50px rgba(15,23,42,0.35)",
        position: "relative",
        animation: "scaleIn 0.2s ease-out"
      }}>
        {/* Close (skip) */}
        <button
          onClick={onSkip}
          aria-label="Skip walkthrough"
          style={{
            position: "absolute", top: 14, right: 14,
            background: "transparent", border: "none",
            color: THEME.textMuted, cursor: "pointer", padding: 4,
            zIndex: 1
          }}
        >
          <X size={20} />
        </button>

        {step === 0 && (
          <div style={{ padding: isMobile() ? 28 : 36, textAlign: "center" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 12px", marginBottom: 16,
              background: THEME.bgRaised, color: THEME.accent,
              borderRadius: 999, fontSize: 11, fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase"
            }}>
              <Sparkles size={12} /> Welcome
            </div>
            <h2 className="serif" style={{
              fontSize: isMobile() ? 24 : 30, fontWeight: 700, margin: "0 0 10px",
              lineHeight: 1.2
            }}>
              {userName ? `Welcome to Deal Docket, ${userName}.` : "Welcome to Deal Docket."}
            </h2>
            <p style={{
              fontSize: 14, color: THEME.textMuted, lineHeight: 1.55,
              maxWidth: 460, margin: "0 auto 24px"
            }}>
              You've got the full toolkit — live listings, off-market lead finder, deal analyzer, AI inspection summaries, and Ari AI. Let's get you to the right place in 30 seconds.
            </p>
            <button
              onClick={() => setStep(1)}
              className="btn-primary"
              style={{ padding: "12px 22px", fontSize: 14 }}
            >
              Pick where to start <ArrowRight size={14} />
            </button>
            <div style={{ marginTop: 14 }}>
              <button
                onClick={onSkip}
                style={{
                  padding: "8px 14px", fontSize: 12, fontWeight: 600,
                  background: "transparent", border: "none",
                  color: THEME.textMuted, cursor: "pointer"
                }}
              >
                Skip — I'll explore on my own
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ padding: isMobile() ? 28 : 36 }}>
            <h2 className="serif" style={{
              fontSize: isMobile() ? 22 : 26, fontWeight: 700, margin: "0 0 6px",
              lineHeight: 1.2, textAlign: "center"
            }}>
              How do you want to start?
            </h2>
            <p style={{
              fontSize: 13, color: THEME.textMuted, lineHeight: 1.55,
              textAlign: "center", margin: "0 0 22px"
            }}>
              Pick the path that fits where you are right now. You can always switch later.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {PATHS.map(p => (
                <button
                  key={p.key}
                  onClick={() => onPick(p.key)}
                  style={{
                    textAlign: "left", padding: 16,
                    background: THEME.bgPanel,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 10, cursor: "pointer",
                    display: "flex", alignItems: "flex-start", gap: 14,
                    transition: "border-color 0.15s, transform 0.15s, box-shadow 0.15s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = p.color;
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(15,23,42,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = THEME.border;
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: p.color, color: "#FFFFFF",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {p.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                      {p.title}
                    </div>
                    <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.5 }}>
                      {p.desc}
                    </div>
                  </div>
                  <ArrowRight size={16} color={p.color} style={{ flexShrink: 0, marginTop: 12 }} />
                </button>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 18 }}>
              <button
                onClick={() => setStep(0)}
                style={{
                  padding: "8px 14px", fontSize: 12, fontWeight: 600,
                  background: "transparent", border: "none",
                  color: THEME.textMuted, cursor: "pointer"
                }}
              >
                ← Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
