/* ============================================================================
   ACQUISITION ANALYSIS SECTION — first tab of the Analyzer.

   Financing strategy: pick a loan type and the down payment / rate / term
   auto-populate using current-market typical numbers. Each field stays
   editable underneath so the user can dial in the actual quote they got.
   ============================================================================ */
import React, { useState } from "react";
import { Search, Calculator, Check, X } from "lucide-react";
import { THEME } from "../theme.js";
import { fmtUSD, isMobile } from "../utils.js";
import { NumberField, StatRow, Panel, PercentDollarField } from "../primitives.jsx";

// Typical investor-loan starting points — meant as a quick set-up, not as
// a quoted rate. Updated April 2026; user should override with their actual
// loan estimate. Term defaults are how each loan type is most commonly
// structured (HM short, conventional 30, etc.).
//
// Conventional rate (7.25%) reflects the current 30-yr fixed for investment
// properties — investor rates run ~0.5-1% above the owner-occupied headline
// rate (~6.0% as of April 2026). Update when the broader rate environment
// shifts noticeably.
const FINANCING_OPTIONS = {
  conventional: { name: "Conventional",   downPayment: 20,  rate: 7.25, termYears: 30, description: "Fannie/Freddie investor loan — standard 30-yr financing. Rate reflects current investor 30-yr fixed." },
  dscr:         { name: "DSCR Loan",      downPayment: 20,  rate: 7.75, termYears: 30, description: "Qualifies on the property's rent, not your W2 — popular for pros." },
  hardMoney:    { name: "Hard Money",     downPayment: 20,  rate: 11.0, termYears: 1,  description: "Short-term bridge, interest-only, fast close. Refi out within 12 mo." },
  portfolio:    { name: "Portfolio Bank", downPayment: 20,  rate: 8.0,  termYears: 25, description: "Local/community bank balance-sheet loan — flexible underwriting." },
  fha:          { name: "FHA House Hack", downPayment: 3.5, rate: 6.5,  termYears: 30, description: "Low-down owner-occupied — live in one unit of a 2-4 unit." },
  seller:       { name: "Seller Finance", downPayment: 10,  rate: 6.5,  termYears: 30, description: "Owner-carry — terms negotiated directly with the seller." },
  cash:         { name: "Cash",           downPayment: 100, rate: 0,    termYears: 0,  description: "All-cash purchase, no financing costs." }
};

const DUE_DILIGENCE_CHECKLIST = [
  { id: "inspection", label: "Professional Inspection", critical: true },
  { id: "appraisal", label: "Property Appraisal", critical: true },
  { id: "title", label: "Title Search & Insurance", critical: true },
  { id: "permits", label: "Permit History Review", critical: false },
  { id: "comps", label: "Comparable Sales Analysis", critical: true },
  { id: "rentRoll", label: "Rent Roll & Market Analysis", critical: true },
  { id: "environmental", label: "Environmental Assessment", critical: false },
  { id: "survey", label: "Property Survey", critical: false },
  { id: "hoa", label: "HOA Documents Review", critical: false },
  { id: "utilities", label: "Utility Transfer & Costs", critical: false }
];

export const AcquisitionSection = ({ deal, onUpdate, metrics }) => {
  const [acquisitionStrategy, setAcquisitionStrategy] = useState(deal.acquisitionStrategy || "conventional");
  const [dueDiligenceItems, setDueDiligenceItems] = useState(deal.dueDiligenceItems || {});

  const applyStrategy = (key) => {
    const opt = FINANCING_OPTIONS[key];
    setAcquisitionStrategy(key);
    onUpdate({
      acquisitionStrategy: key,
      downPayment: opt.downPayment,
      interestRate: opt.rate,
      loanTermYears: opt.termYears || deal.loanTermYears || 30
    });
  };

  const ddDone = Object.values(dueDiligenceItems).filter(Boolean).length;

  return (
    <div>
      <Panel title="Acquisition Strategy & Analysis" icon={<Search size={16} />} accent style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: 14, marginBottom: 16, color: THEME.text }}>Purchase Details</h4>
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
            <NumberField
              label="List Price"
              value={deal.listPrice || Math.round(deal.purchasePrice * 1.1)}
              onChange={(val) => onUpdate({ listPrice: val })}
              prefix="$"
              helper="Original asking price"
            />
            <NumberField
              label="Offer Price"
              value={deal.offerPrice || deal.purchasePrice}
              onChange={(val) => onUpdate({ offerPrice: val })}
              prefix="$"
              helper="Your initial offer"
            />
            <NumberField
              label="Final Purchase Price"
              value={deal.purchasePrice}
              onChange={(val) => onUpdate({ purchasePrice: val })}
              prefix="$"
              helper="Negotiated final price"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "1fr 1fr", gap: 16, marginTop: 16 }}>
            <NumberField
              label="Days on Market"
              value={deal.daysOnMarket || 45}
              onChange={(val) => onUpdate({ daysOnMarket: val })}
              integer
            />
            <div>
              <div className="label-xs" style={{ marginBottom: 8 }}>Negotiation Discount</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: THEME.green, padding: "9px 10px" }}>
                {deal.listPrice > 0 ? `${(((deal.listPrice - deal.purchasePrice) / deal.listPrice) * 100).toFixed(1)}%` : "0%"}
              </div>
            </div>
          </div>
        </div>

        {/* ── Financing strategy ───────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <h4 style={{ fontSize: 14, color: THEME.text, margin: 0 }}>Financing Strategy</h4>
            <span style={{ fontSize: 11, color: THEME.textMuted }}>
              Pick a loan type — fields auto-fill, then edit to your actual quote.
            </span>
          </div>

          {/* Single-row pill selector — wraps on small screens */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {Object.entries(FINANCING_OPTIONS).map(([key, option]) => {
              const active = acquisitionStrategy === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyStrategy(key)}
                  title={option.description}
                  style={{
                    padding: "8px 14px", fontSize: 12, fontWeight: 600,
                    border: `1.5px solid ${active ? THEME.accent : THEME.border}`,
                    borderRadius: 999,
                    background: active ? THEME.accent : THEME.bgPanel,
                    color: active ? "#FFFFFF" : THEME.text,
                    cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: 6
                  }}
                >
                  {option.name}
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    color: active ? "rgba(255,255,255,0.85)" : THEME.textMuted
                  }}>
                    {option.downPayment}% / {option.rate}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Description for the active strategy */}
          <div style={{
            padding: "10px 14px", marginBottom: 14,
            background: THEME.bgRaised, borderRadius: 6,
            fontSize: 12, color: THEME.textMuted, lineHeight: 1.5
          }}>
            {FINANCING_OPTIONS[acquisitionStrategy]?.description}
          </div>

          {/* Editable fields — pre-filled from the chosen strategy */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(4, 1fr)", gap: 16 }}>
            <NumberField
              label="Down Payment %"
              value={deal.downPayment}
              onChange={(val) => onUpdate({ downPayment: val })}
              prefix="%"
              helper={`Strategy default: ${FINANCING_OPTIONS[acquisitionStrategy]?.downPayment}%`}
            />
            <NumberField
              label="Interest Rate %"
              value={deal.interestRate}
              onChange={(val) => onUpdate({ interestRate: val })}
              prefix="%"
              helper={`Strategy default: ${FINANCING_OPTIONS[acquisitionStrategy]?.rate}%`}
            />
            <NumberField
              label="Loan Term (Years)"
              value={deal.loanTermYears || 30}
              onChange={(val) => onUpdate({ loanTermYears: val })}
              integer
              helper={`Strategy default: ${FINANCING_OPTIONS[acquisitionStrategy]?.termYears}yr`}
            />
            {/* Closing costs run ~2-5% of purchase nationally; 3% is the
                modal buyer-side number. Toggle lets the user enter $ or %
                — value is stored as $ so historical deals don't shift. */}
            <PercentDollarField
              label="Closing Costs"
              value={deal.closingCosts || Math.round((deal.purchasePrice || 0) * 0.03)}
              base={deal.purchasePrice || 0}
              baseLabel="of purchase"
              onChange={(val) => onUpdate({ closingCosts: val })}
              helper="Title, escrow, lender fees · typical 2-3%"
            />
          </div>
        </div>

        {/* ── Due diligence checklist ──────────────────────────────────── */}
        <div>
          <h4 style={{ fontSize: 14, marginBottom: 16, color: THEME.text }}>Due Diligence Checklist</h4>
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(2, 1fr)", gap: 8 }}>
            {DUE_DILIGENCE_CHECKLIST.map(item => (
              <label key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={dueDiligenceItems[item.id] || false}
                  onChange={(e) => {
                    const updated = { ...dueDiligenceItems, [item.id]: e.target.checked };
                    setDueDiligenceItems(updated);
                    onUpdate({ dueDiligenceItems: updated });
                  }}
                  style={{ width: 16, height: 16 }}
                />
                <span style={{
                  fontSize: 13,
                  color: item.critical ? THEME.text : THEME.textMuted,
                  fontWeight: item.critical ? 600 : 400
                }}>
                  {item.label} {item.critical && <span style={{ color: THEME.red }}>*</span>}
                </span>
              </label>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="Acquisition Summary" icon={<Calculator size={16} />}>
        <StatRow
          label="Total Cash Required"
          value={fmtUSD(metrics.totalInvested)}
          bold valueColor={THEME.accent}
          tooltip={{
            title: "Total Cash Required",
            description: "All-in cash needed to close and stabilize.",
            formula: "(Purchase × Down %) + Rehab + Closing + Holding"
          }}
        />
        <StatRow
          label="Loan Amount"
          value={fmtUSD(deal.purchasePrice * ((100 - deal.downPayment) / 100))}
          tooltip={{
            title: "Loan Amount",
            description: "Portion of the purchase price financed by the lender.",
            formula: "Purchase × (100 − Down %) ÷ 100"
          }}
        />
        <StatRow
          label="Monthly P&I Payment"
          value={fmtUSD(metrics.monthlyPI)}
          tooltip={{
            title: "Monthly Principal & Interest",
            description: "Standard amortized payment based on rate and term.",
            formula: "L·r/(1 − (1+r)^-n)   r = rate/12, n = term·12"
          }}
        />
        <StatRow
          label="Purchase vs ARV"
          value={`${((deal.purchasePrice / deal.arv) * 100).toFixed(1)}%`}
          valueColor={deal.purchasePrice <= deal.arv * 0.7 ? THEME.green : THEME.orange}
          tooltip={{
            title: "Purchase-to-ARV Ratio",
            description: "Lower is better. Under 70% leaves room for rehab + refi equity.",
            formula: "(Purchase Price ÷ ARV) × 100"
          }}
        />
        <StatRow
          label="70% Rule"
          value={metrics.seventyPercentRule
            ? <Check size={18} color={THEME.green} aria-label="Pass" />
            : <X size={18} color={THEME.red} aria-label="Fail" />}
          mono={false}
          bold
          tooltip={{
            title: "70% Rule",
            description: "Classic flipper/BRRRR screen. Pass means you can likely pull most capital back at refi.",
            formula: "(Purchase + Rehab) ≤ (ARV × 0.70)"
          }}
        />
        <StatRow
          label="Due Diligence Progress"
          value={`${ddDone}/${DUE_DILIGENCE_CHECKLIST.length} items`}
          valueColor={ddDone >= 6 ? THEME.green : THEME.orange}
        />
      </Panel>
    </div>
  );
};
