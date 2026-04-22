/* ============================================================================
   MORTGAGE + AFFORDABILITY CALCULATOR — standalone tool reachable from the
   header Calculator button; works from any view.
   ============================================================================ */
import React, { useState, useMemo, useEffect } from "react";
import { X, DollarSign, Gauge, Info } from "lucide-react";
import { THEME } from "../theme.js";
import { n, fmtUSD, isMobile } from "../utils.js";
import { NumberField, StatRow } from "../primitives.jsx";

export const calcMonthlyPI = (loan, rate, years) => {
  if (!loan || !rate || !years) return 0;
  const r = rate / 100 / 12;
  const n = years * 12;
  return loan * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
};

export const MortgageCalculatorModal = ({ onClose }) => {
  const [mode, setMode] = useState("payment"); // "payment" | "affordability"

  // Payment mode
  const [price, setPrice] = useState(350000);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(7.25);
  const [term, setTerm] = useState(30);
  const [propTax, setPropTax] = useState(3500); // annual
  const [insurance, setInsurance] = useState(1800); // annual
  const [hoa, setHoa] = useState(0); // monthly

  // Affordability mode
  const [income, setIncome] = useState(120000);
  const [debts, setDebts] = useState(500); // existing monthly debt
  const [dti, setDti] = useState(36); // back-end DTI target %
  const [downCash, setDownCash] = useState(40000); // cash on hand

  const payment = useMemo(() => {
    const p = n(price), dp = n(downPct), r = n(rate), t = n(term);
    const loan = p - (p * dp / 100);
    const pi = calcMonthlyPI(loan, r, t);
    const taxIns = (n(propTax) + n(insurance)) / 12;
    const total = pi + taxIns + n(hoa);
    return { loan, pi, taxIns, hoa: n(hoa), total };
  }, [price, downPct, rate, term, propTax, insurance, hoa]);

  const afford = useMemo(() => {
    const grossMonthly = n(income) / 12;
    const targetPayment = Math.max(0, grossMonthly * (n(dti) / 100) - n(debts));
    // Back-solve for loan amount that produces `targetPayment` of P&I only (conservative).
    const r = n(rate) / 100 / 12;
    const nn = n(term) * 12;
    if (!r || !nn || targetPayment <= 0) return { maxPrice: 0, maxLoan: 0, targetPayment };
    const maxLoan = targetPayment * (Math.pow(1 + r, nn) - 1) / (r * Math.pow(1 + r, nn));
    // Max price factoring down cash available: down must cover (price - loan).
    // If downPct is locked, compute directly; otherwise use downCash as the cap.
    // For simplicity: price = loan + downCash (assumes user will bring all downCash).
    const maxPrice = maxLoan + n(downCash);
    return { maxPrice, maxLoan, targetPayment };
  }, [income, debts, dti, rate, term, downCash]);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mortgage-title"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 150, padding: 16, overflowY: "auto"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: THEME.bg, borderRadius: 12,
          maxWidth: 720, width: "100%",
          marginTop: 40, marginBottom: 40,
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.22)",
          animation: "modalFadeIn 0.2s ease-out",
          overflow: "hidden"
        }}
      >
        <div style={{
          padding: "16px 24px", borderBottom: `1px solid ${THEME.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <h2 id="mortgage-title" className="serif" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              Mortgage & Affordability
            </h2>
            <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 2 }}>
              Quick what-ifs without leaving the page.
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close calculator"
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

        <div style={{ padding: 24 }}>
          {/* Mode toggle */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
            marginBottom: 20, padding: 4,
            background: THEME.bgPanel, borderRadius: 8
          }}>
            {[
              { key: "payment", label: "Monthly Payment", icon: <DollarSign size={13} /> },
              { key: "affordability", label: "Affordability", icon: <Gauge size={13} /> }
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setMode(t.key)}
                style={{
                  padding: "8px 14px", fontSize: 13, fontWeight: 600,
                  background: mode === t.key ? THEME.bg : "transparent",
                  color: mode === t.key ? THEME.accent : THEME.textMuted,
                  border: `1px solid ${mode === t.key ? THEME.border : "transparent"}`,
                  borderRadius: 6,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                  cursor: "pointer",
                  boxShadow: mode === t.key ? "0 1px 2px rgba(15,23,42,0.06)" : "none"
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {mode === "payment" ? (
            <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "1fr 1fr", gap: 18 }}>
              <div>
                <NumberField label="Home Price" value={price} onChange={setPrice} prefix="$" />
                <NumberField label="Down Payment %" value={downPct} onChange={setDownPct} prefix="%" />
                <NumberField label="Interest Rate %" value={rate} onChange={setRate} prefix="%" />
                <NumberField label="Loan Term (Years)" value={term} onChange={setTerm} />
                <NumberField label="Property Tax (Annual)" value={propTax} onChange={setPropTax} prefix="$" />
                <NumberField label="Insurance (Annual)" value={insurance} onChange={setInsurance} prefix="$" />
                <NumberField label="HOA (Monthly)" value={hoa} onChange={setHoa} prefix="$" />
              </div>
              <div>
                <div style={{
                  padding: 18, background: THEME.bgPanel,
                  border: `1px solid ${THEME.border}`, borderRadius: 8
                }}>
                  <div className="label-xs" style={{ marginBottom: 10, color: THEME.accent }}>
                    Results
                  </div>
                  <StatRow label="Loan Amount" value={fmtUSD(payment.loan)} bold />
                  <StatRow label="Monthly P&I" value={fmtUSD(payment.pi)} tooltip={{
                    title: "Principal & Interest",
                    description: "Standard amortized payment.",
                    formula: "L·r/(1 − (1+r)^-n)"
                  }} />
                  <StatRow label="Monthly Tax + Insurance" value={fmtUSD(payment.taxIns)} />
                  <StatRow label="Monthly HOA" value={fmtUSD(payment.hoa)} />
                  <StatRow
                    label="Total Monthly Payment (PITI + HOA)"
                    value={fmtUSD(payment.total)}
                    bold
                    borderTop
                    valueColor={THEME.accent}
                  />
                </div>
                <div style={{
                  marginTop: 12, padding: 12,
                  background: THEME.bgRaised, borderRadius: 6,
                  fontSize: 11, color: THEME.textMuted, lineHeight: 1.5
                }}>
                  <Info size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  Totals cover PITI + HOA. Does not include PMI or HOA special assessments.
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "1fr 1fr", gap: 18 }}>
              <div>
                <NumberField label="Gross Annual Income" value={income} onChange={setIncome} prefix="$" helper="Pre-tax" />
                <NumberField label="Existing Monthly Debts" value={debts} onChange={setDebts} prefix="$" helper="Car, student loans, CC mins" />
                <NumberField label="Target DTI %" value={dti} onChange={setDti} prefix="%" helper="Lenders typically accept 36-43%" />
                <NumberField label="Down Payment Cash" value={downCash} onChange={setDownCash} prefix="$" />
                <NumberField label="Interest Rate %" value={rate} onChange={setRate} prefix="%" />
                <NumberField label="Loan Term (Years)" value={term} onChange={setTerm} />
              </div>
              <div>
                <div style={{
                  padding: 18, background: THEME.bgPanel,
                  border: `1px solid ${THEME.border}`, borderRadius: 8
                }}>
                  <div className="label-xs" style={{ marginBottom: 10, color: THEME.teal }}>
                    What you can afford
                  </div>
                  <StatRow
                    label="Target Monthly Payment"
                    value={fmtUSD(afford.targetPayment)}
                    tooltip={{
                      title: "Target monthly housing cost",
                      description: "Based on your DTI target, minus existing debts.",
                      formula: "(Income/12 × DTI%) − Existing Debts"
                    }}
                  />
                  <StatRow
                    label="Max Loan Supported"
                    value={fmtUSD(afford.maxLoan)}
                    tooltip={{
                      title: "Max Loan at Target Payment",
                      description: "Reverse-amortized from the target payment.",
                      formula: "Payment × (1 − (1+r)^-n) / r"
                    }}
                  />
                  <StatRow
                    label="Max Home Price"
                    value={fmtUSD(afford.maxPrice)}
                    bold
                    valueColor={THEME.teal}
                    borderTop
                    tooltip={{
                      title: "Max Home Price",
                      description: "Max Loan + the down-payment cash you said you have.",
                      formula: "Max Loan + Down Cash"
                    }}
                  />
                </div>
                <div style={{
                  marginTop: 12, padding: 12,
                  background: THEME.bgRaised, borderRadius: 6,
                  fontSize: 11, color: THEME.textMuted, lineHeight: 1.5
                }}>
                  <Info size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  This is a rough screen. Real lenders also weigh credit score, reserves, and
                  property type. Tax/insurance impact isn't folded into the target payment here.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
