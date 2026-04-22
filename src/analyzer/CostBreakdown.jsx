/* ============================================================================
   COST BREAKDOWN — full all-in project cost summary + ARV verdict.
   ============================================================================ */
import React from "react";
import { DollarSign, PiggyBank } from "lucide-react";
import { THEME } from "../theme.js";
import { fmtUSD, n, isMobile } from "../utils.js";
import { NumberField, CalcTooltip, Panel } from "../primitives.jsx";

export const CostRow = ({ label, value, amount, tooltip, highlight = false, muted = false, borderTop = false, subtotal = false }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: subtotal ? "12px 0" : "10px 0",
    borderTop: borderTop ? `1px solid ${THEME.border}` : "none"
  }}>
    <div style={{ display: "inline-flex", alignItems: "center" }}>
      <span style={{
        fontSize: subtotal ? 13 : 12.5,
        fontWeight: subtotal ? 700 : highlight ? 600 : 500,
        color: muted ? THEME.textMuted : THEME.text
      }}>
        {label}
      </span>
      {tooltip && <CalcTooltip size={12} {...tooltip} />}
    </div>
    <div className="mono" style={{
      fontSize: subtotal ? 15 : 13,
      fontWeight: subtotal ? 700 : highlight ? 700 : 500,
      color: highlight ? THEME.accent : muted ? THEME.textMuted : THEME.text
    }}>
      {amount}
    </div>
  </div>
);

export const CostBreakdown = ({ deal, metrics, onUpdate }) => {
  const {
    cashDown, totalInvested, totalRefiClosingCosts, refiOrigination,
    refiBaseCosts, totalAllIn, allInToArv, projectedNewLoan
  } = metrics;

  const purchasePrice = n(deal.purchasePrice);
  const closingCosts = n(deal.closingCosts);
  const rehabBudget = n(deal.rehabBudget);
  const holdingCosts = n(deal.holdingCosts);
  const arv = n(deal.arv);

  // Post-refi position
  const equityAtARV = arv - totalAllIn;
  const cashLeftInDeal = Math.max(0, totalInvested - (projectedNewLoan - (purchasePrice * (100 - deal.downPayment) / 100)));

  const ratioColor =
    allInToArv <= 70 ? THEME.green :
    allInToArv <= 80 ? THEME.orange : THEME.red;

  return (
    <div>
      <Panel
        title="Cost Breakdown"
        icon={<DollarSign size={16} />}
        accent
        style={{ marginBottom: 24 }}
      >
        <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 18, lineHeight: 1.5 }}>
          Every dollar that goes into this deal — from the accepted offer through the cash-out refinance. Hover the info icons to see how each number is calculated.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "1fr 1fr", gap: 20 }}>
          {/* LEFT: Editable cost inputs */}
          <div>
            <div className="label-xs" style={{ marginBottom: 10, color: THEME.accent }}>Edit Cost Inputs</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <NumberField
                label="Purchase Price"
                value={deal.purchasePrice}
                onChange={(val) => onUpdate({ purchasePrice: val })}
                prefix="$"
              />
              <NumberField
                label="Closing Costs"
                value={deal.closingCosts}
                onChange={(val) => onUpdate({ closingCosts: val })}
                prefix="$"
                helper="Title, escrow, transfer tax"
              />
              <NumberField
                label="Rehab Budget"
                value={deal.rehabBudget}
                onChange={(val) => onUpdate({ rehabBudget: val })}
                prefix="$"
              />
              <NumberField
                label="Holding Costs"
                value={deal.holdingCosts}
                onChange={(val) => onUpdate({ holdingCosts: val })}
                prefix="$"
                helper="Utilities, taxes, insurance during rehab"
              />
              <NumberField
                label="ARV (After Repair Value)"
                value={deal.arv}
                onChange={(val) => onUpdate({ arv: val })}
                prefix="$"
              />
              <NumberField
                label="Down Payment %"
                value={deal.downPayment}
                onChange={(val) => onUpdate({ downPayment: val })}
                prefix="%"
              />
            </div>
          </div>

          {/* RIGHT: Cost summary ledger */}
          <div style={{
            background: THEME.bg,
            border: `1px solid ${THEME.border}`,
            borderRadius: 8,
            padding: 18
          }}>
            <div className="label-xs" style={{ marginBottom: 12, color: THEME.accent }}>
              Project Cost Ledger
            </div>

            <CostRow
              label="Purchase Price"
              amount={fmtUSD(purchasePrice)}
              tooltip={{
                title: "Purchase Price",
                description: "Final negotiated price paid to the seller at close.",
                formula: "Accepted offer after negotiation"
              }}
            />
            <CostRow
              label="Closing Costs"
              amount={fmtUSD(closingCosts)}
              tooltip={{
                title: "Acquisition Closing Costs",
                description: "Title, escrow, recording, lender origination, transfer tax.",
                formula: "Entered directly — typical 1.5–3% of purchase"
              }}
            />
            <CostRow
              label="Rehab Budget"
              amount={fmtUSD(rehabBudget)}
              tooltip={{
                title: "Rehab Budget",
                description: "All construction, materials, labor & contingency to reach ARV condition.",
                formula: "Sum of rehab line items + contingency"
              }}
            />
            <CostRow
              label="Holding Costs"
              amount={fmtUSD(holdingCosts)}
              tooltip={{
                title: "Holding Costs",
                description: "Debt service, insurance, utilities and property taxes during rehab.",
                formula: "Sum of carrying costs × Rehab Months"
              }}
            />
            <CostRow
              label="Refi Closing Costs"
              amount={fmtUSD(totalRefiClosingCosts)}
              muted
              borderTop
              tooltip={{
                title: "Refinance Closing Costs",
                description: "Appraisal, title, legal, misc + 1% origination on the new loan.",
                formula: `Base (${fmtUSD(refiBaseCosts)}) + Origination (${fmtUSD(refiOrigination)})`
              }}
            />

            <CostRow
              label="Total All-In"
              amount={fmtUSD(totalAllIn)}
              highlight
              subtotal
              borderTop
              tooltip={{
                title: "Total All-In Cost",
                description: "Every dollar out of pocket + financed, through the completed refi.",
                formula: "Purchase + Closing + Rehab + Holding + Refi Closing"
              }}
            />

            <div style={{
              marginTop: 14, padding: 14,
              background: THEME.bgRaised, borderRadius: 6,
              border: `1px solid ${THEME.border}`
            }}>
              <CostRow
                label="ARV"
                amount={fmtUSD(arv)}
                tooltip={{
                  title: "After Repair Value",
                  description: "Stabilized market value once rehab is complete.",
                  formula: "Based on appraisal / recent comparable sales"
                }}
              />
              <CostRow
                label="All-In / ARV"
                amount={`${allInToArv.toFixed(1)}%`}
                tooltip={{
                  title: "All-In to ARV Ratio",
                  description: "BRRRR readiness: under 70% = strong refi, under 80% = acceptable, 80%+ risky.",
                  formula: "(Total All-In ÷ ARV) × 100"
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: `1px solid ${THEME.border}` }}>
                <div style={{ fontSize: 12, color: THEME.textMuted, display: "inline-flex", alignItems: "center" }}>
                  Projected Equity @ ARV
                  <CalcTooltip
                    size={12}
                    title="Equity at ARV"
                    description="Value created after rehab, before you pull any cash out."
                    formula="ARV − Total All-In"
                  />
                </div>
                <div className="mono" style={{ fontWeight: 700, color: equityAtARV >= 0 ? THEME.green : THEME.red }}>
                  {fmtUSD(equityAtARV)}
                </div>
              </div>
            </div>

            <div style={{
              marginTop: 14, padding: "10px 14px",
              background: ratioColor === THEME.green ? THEME.greenDim :
                          ratioColor === THEME.orange ? THEME.bgOrange : THEME.redDim,
              borderRadius: 6,
              fontSize: 12, color: ratioColor, fontWeight: 600,
              textAlign: "center"
            }}>
              {allInToArv <= 70
                ? `Strong — ${allInToArv.toFixed(1)}% of ARV, healthy refi margin`
                : allInToArv <= 80
                ? `Acceptable — ${allInToArv.toFixed(1)}% of ARV, some capital will stay in the deal`
                : `Risky — ${allInToArv.toFixed(1)}% of ARV, limited BRRRR recovery`}
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Cash Position Summary" icon={<PiggyBank size={16} />}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr 1fr" : "repeat(4, 1fr)", gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 4, display: "inline-flex", alignItems: "center" }}>
              CASH DOWN
              <CalcTooltip
                size={12}
                title="Cash Down at Acquisition"
                description="Equity portion you bring at closing."
                formula="Purchase × (Down % ÷ 100)"
              />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: THEME.navy }}>{fmtUSD(cashDown)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 4, display: "inline-flex", alignItems: "center" }}>
              TOTAL CASH IN
              <CalcTooltip
                size={12}
                title="Total Cash Invested"
                description="Actual cash required through rehab (pre-refi)."
                formula="Cash Down + Rehab + Closing + Holding"
              />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: THEME.teal }}>{fmtUSD(totalInvested)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 4, display: "inline-flex", alignItems: "center" }}>
              TOTAL ALL-IN
              <CalcTooltip
                size={12}
                title="Total Project Cost"
                description="Full cost of the project including refi closing costs."
                formula="Purchase + Closing + Rehab + Holding + Refi Closing"
              />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: THEME.accent }}>{fmtUSD(totalAllIn)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 4, display: "inline-flex", alignItems: "center" }}>
              ALL-IN / ARV
              <CalcTooltip
                size={12}
                title="All-In to ARV"
                description="The BRRRR margin — lower is better."
                formula="(Total All-In ÷ ARV) × 100"
              />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: ratioColor }}>
              {allInToArv.toFixed(1)}%
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
};
