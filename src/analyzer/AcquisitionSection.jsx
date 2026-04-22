/* ============================================================================
   ACQUISITION ANALYSIS SECTION — first tab of the Analyzer.
   ============================================================================ */
import React, { useState } from "react";
import { Search, Calculator } from "lucide-react";
import { THEME } from "../theme.js";
import { fmtUSD, isMobile } from "../utils.js";
import { NumberField, StatRow, Panel } from "../primitives.jsx";

export const AcquisitionSection = ({ deal, onUpdate, metrics }) => {
  const [acquisitionStrategy, setAcquisitionStrategy] = useState(deal.acquisitionStrategy || "conventional");
  const [dueDiligenceItems, setDueDiligenceItems] = useState(deal.dueDiligenceItems || {});

  const financingOptions = {
    conventional: { name: "Conventional Loan", downPayment: 25, rate: 7.5, description: "Standard investment property loan" },
    hardMoney: { name: "Hard Money", downPayment: 20, rate: 12.0, description: "Short-term bridge financing" },
    cash: { name: "Cash Purchase", downPayment: 100, rate: 0, description: "All-cash acquisition" },
    portfolio: { name: "Portfolio Lender", downPayment: 20, rate: 8.0, description: "Local bank portfolio loan" },
    seller: { name: "Seller Financing", downPayment: 10, rate: 6.5, description: "Owner-carry financing" }
  };

  const dueDiligenceChecklist = [
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
            <div>
              <div className="label-xs" style={{ marginBottom: 8 }}>Days on Market</div>
              <input
                type="number"
                value={deal.daysOnMarket || 45}
                onChange={(e) => onUpdate({ daysOnMarket: parseInt(e.target.value) || 0 })}
                style={{ width: "100%", padding: "9px 10px", fontSize: 13 }}
              />
            </div>
            <div>
              <div className="label-xs" style={{ marginBottom: 8 }}>Negotiation Discount</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: THEME.green, padding: "9px 10px" }}>
                {deal.listPrice > 0 ? `${(((deal.listPrice - deal.purchasePrice) / deal.listPrice) * 100).toFixed(1)}%` : "0%"}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: 14, marginBottom: 16, color: THEME.text }}>Financing Strategy</h4>
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            {Object.entries(financingOptions).map(([key, option]) => (
              <button
                key={key}
                onClick={() => {
                  setAcquisitionStrategy(key);
                  onUpdate({
                    acquisitionStrategy: key,
                    downPayment: option.downPayment,
                    interestRate: option.rate
                  });
                }}
                style={{
                  padding: 12,
                  border: `2px solid ${acquisitionStrategy === key ? THEME.accent : THEME.border}`,
                  borderRadius: 6,
                  background: acquisitionStrategy === key ? THEME.bgRaised : THEME.bgPanel,
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{option.name}</div>
                <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 6 }}>{option.description}</div>
                <div style={{ fontSize: 12 }}>
                  {option.downPayment}% down • {option.rate}% rate
                </div>
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(4, 1fr)", gap: 16 }}>
            <NumberField
              label="Down Payment %"
              value={deal.downPayment}
              onChange={(val) => onUpdate({ downPayment: val })}
              prefix="%"
            />
            <NumberField
              label="Interest Rate %"
              value={deal.interestRate}
              onChange={(val) => onUpdate({ interestRate: val })}
              prefix="%"
            />
            <NumberField
              label="Loan Term (Years)"
              value={deal.loanTermYears || 30}
              onChange={(val) => onUpdate({ loanTermYears: val })}
              integer
            />
            <NumberField
              label="Closing Costs"
              value={deal.closingCosts || Math.round(deal.purchasePrice * 0.02)}
              onChange={(val) => onUpdate({ closingCosts: val })}
              prefix="$"
            />
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: 14, marginBottom: 16, color: THEME.text }}>Due Diligence Checklist</h4>
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(2, 1fr)", gap: 8 }}>
            {dueDiligenceChecklist.map(item => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
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
              </div>
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
          label="70% Rule Status"
          value={metrics.seventyPercentRule ? "PASS" : "FAIL"}
          valueColor={metrics.seventyPercentRule ? THEME.green : THEME.red}
          bold
          tooltip={{
            title: "70% Rule",
            description: "Classic flipper/BRRRR screen. Pass means you can likely pull most capital back at refi.",
            formula: "(Purchase + Rehab) ≤ (ARV × 0.70)"
          }}
        />
        <StatRow
          label="Due Diligence Progress"
          value={`${Object.values(dueDiligenceItems).filter(Boolean).length}/${dueDiligenceChecklist.length} items`}
          valueColor={Object.values(dueDiligenceItems).filter(Boolean).length >= 6 ? THEME.green : THEME.orange}
        />
      </Panel>
    </div>
  );
};
