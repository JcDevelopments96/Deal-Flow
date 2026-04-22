/* ============================================================================
   REFINANCE SECTION — LTV scenarios, cash-out analysis, BRRRR readout.
   ============================================================================ */
import React, { useState } from "react";
import { PiggyBank, RotateCcw } from "lucide-react";
import { THEME } from "../theme.js";
import { fmtUSD, isMobile } from "../utils.js";
import { NumberField, StatRow, Panel } from "../primitives.jsx";

const RepeatIcon = RotateCcw;

export const RefinanceSection = ({ deal, onUpdate, metrics }) => {
  const [refiScenarios, setRefiScenarios] = useState(deal.refiScenarios || {
    conservativeRefi: { ltv: 70, rate: 7.25, name: "Conservative 70% LTV" },
    standardRefi: { ltv: 75, rate: 7.5, name: "Standard 75% LTV" },
    aggressiveRefi: { ltv: 80, rate: 7.75, name: "Aggressive 80% LTV" }
  });

  const [selectedScenario, setSelectedScenario] = useState("standardRefi");
  const [refiCosts, setRefiCosts] = useState(deal.refiCosts || {
    appraisal: 500,
    title: 1200,
    legal: 800,
    origination: 0,
    misc: 500
  });

  const calculateRefiScenario = (scenarioKey) => {
    const scenario = refiScenarios[scenarioKey];
    const arv = deal.arv || 0;
    const currentLoan = deal.loanAmount || ((deal.purchasePrice || 0) * (100 - (deal.downPayment || 25)) / 100);

    const newLoanAmount = arv * (scenario.ltv / 100);
    const originationFee = newLoanAmount * 0.01;
    const totalRefiCosts = Object.values(refiCosts).reduce((sum, cost) => sum + cost, 0) + originationFee;
    const grossCashOut = newLoanAmount - currentLoan;
    const netCashOut = grossCashOut - totalRefiCosts;

    const newMonthlyPI = newLoanAmount > 0 ?
      newLoanAmount * (scenario.rate / 100 / 12 * Math.pow(1 + scenario.rate / 100 / 12, 30 * 12)) /
      (Math.pow(1 + scenario.rate / 100 / 12, 30 * 12) - 1) : 0;

    const capitalRecovery = metrics.totalInvested > 0 ? (netCashOut / metrics.totalInvested) * 100 : 0;

    return {
      newLoanAmount,
      grossCashOut,
      netCashOut,
      totalRefiCosts,
      newMonthlyPI,
      capitalRecovery,
      loanToValue: scenario.ltv,
      interestRate: scenario.rate,
      originationFee
    };
  };

  const scenarios = Object.keys(refiScenarios).reduce((acc, key) => {
    acc[key] = calculateRefiScenario(key);
    return acc;
  }, {});

  const bestScenario = Object.entries(scenarios).reduce((best, [key, scenario]) =>
    scenario.netCashOut > best.netCashOut ? { key, ...scenario } : best,
    { netCashOut: -Infinity }
  );

  const updateRefiCost = (category, value) => {
    const updated = { ...refiCosts, [category]: value };
    setRefiCosts(updated);
    onUpdate({ refiCosts: updated });
  };

  const updateRefiScenario = (scenarioKey, field, value) => {
    const updated = {
      ...refiScenarios,
      [scenarioKey]: { ...refiScenarios[scenarioKey], [field]: value }
    };
    setRefiScenarios(updated);
    onUpdate({ refiScenarios: updated });
  };

  return (
    <div>
      <Panel title="Refinance Strategy & Analysis" icon={<PiggyBank size={16} />} accent style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: 14, marginBottom: 16, color: THEME.text }}>After Repair Value (ARV) Analysis</h4>
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
            <NumberField
              label="Estimated ARV"
              value={deal.arv}
              onChange={(val) => onUpdate({ arv: val })}
              prefix="$"
              helper="Professional appraisal estimate"
            />
            <NumberField
              label="Comparable Sales Avg"
              value={deal.compSalesAvg || deal.arv}
              onChange={(val) => onUpdate({ compSalesAvg: val })}
              prefix="$"
              helper="Recent comparable sales"
            />
            <NumberField
              label="Conservative ARV"
              value={deal.conservativeARV || Math.round((deal.arv || 0) * 0.95)}
              onChange={(val) => onUpdate({ conservativeARV: val })}
              prefix="$"
              helper="5% below estimate"
            />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: 14, marginBottom: 16, color: THEME.text }}>Refinance Costs</h4>
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(5, 1fr)", gap: 12 }}>
            <NumberField label="Appraisal" value={refiCosts.appraisal} onChange={(val) => updateRefiCost('appraisal', val)} prefix="$" />
            <NumberField label="Title Insurance" value={refiCosts.title} onChange={(val) => updateRefiCost('title', val)} prefix="$" />
            <NumberField label="Legal/Attorney" value={refiCosts.legal} onChange={(val) => updateRefiCost('legal', val)} prefix="$" />
            <NumberField label="Misc Fees" value={refiCosts.misc} onChange={(val) => updateRefiCost('misc', val)} prefix="$" />
            <div>
              <div className="label-xs" style={{ marginBottom: 6 }}>Origination (1%)</div>
              <div style={{
                padding: "9px 10px",
                background: THEME.bgRaised,
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 600
              }}>
                {fmtUSD(scenarios[selectedScenario]?.originationFee || 0)}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: 14, marginBottom: 16, color: THEME.text }}>Refinance Scenarios</h4>
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
            {Object.entries(refiScenarios).map(([scenarioKey, scenario]) => {
              const calc = scenarios[scenarioKey];
              const isSelected = selectedScenario === scenarioKey;
              const isBest = scenarioKey === bestScenario.key;

              return (
                <div
                  key={scenarioKey}
                  onClick={() => setSelectedScenario(scenarioKey)}
                  style={{
                    padding: 16,
                    border: `2px solid ${isSelected ? THEME.accent : isBest ? THEME.secondary : THEME.border}`,
                    borderRadius: 8,
                    background: isSelected ? THEME.bgRaised : THEME.bgPanel,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    position: "relative"
                  }}
                >
                  {isBest && (
                    <div style={{
                      position: "absolute",
                      top: -8,
                      right: 8,
                      background: THEME.secondary,
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700
                    }}>
                      BEST
                    </div>
                  )}

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                      {scenario.name}
                    </div>
                    <div style={{ fontSize: 12, color: THEME.textMuted }}>
                      {scenario.ltv}% LTV • {scenario.rate}% Rate
                    </div>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: THEME.textMuted }}>Net Cash Out</div>
                    <div style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: calc.netCashOut > 0 ? THEME.green : THEME.red
                    }}>
                      {fmtUSD(calc.netCashOut)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: THEME.textMuted }}>Capital Recovery</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {calc.capitalRecovery.toFixed(1)}%
                    </div>
                  </div>

                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${THEME.border}` }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
                      <div>
                        <div style={{ color: THEME.textMuted }}>New P&I</div>
                        <div style={{ fontWeight: 600 }}>{fmtUSD(calc.newMonthlyPI)}</div>
                      </div>
                      <div>
                        <div style={{ color: THEME.textMuted }}>Refi Costs</div>
                        <div style={{ fontWeight: 600 }}>{fmtUSD(calc.totalRefiCosts)}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${THEME.border}` }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <div className="label-xs" style={{ marginBottom: 4 }}>LTV %</div>
                        <input
                          type="number"
                          value={scenario.ltv}
                          onChange={(e) => updateRefiScenario(scenarioKey, 'ltv', parseFloat(e.target.value))}
                          style={{
                            width: "100%",
                            padding: "4px 6px",
                            fontSize: 12,
                            border: `1px solid ${THEME.border}`,
                            borderRadius: 3
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div>
                        <div className="label-xs" style={{ marginBottom: 4 }}>Rate %</div>
                        <input
                          type="number"
                          step="0.25"
                          value={scenario.rate}
                          onChange={(e) => updateRefiScenario(scenarioKey, 'rate', parseFloat(e.target.value))}
                          style={{
                            width: "100%",
                            padding: "4px 6px",
                            fontSize: 12,
                            border: `1px solid ${THEME.border}`,
                            borderRadius: 3
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: 20, background: THEME.bgRaised, borderRadius: 8 }}>
          <h4 style={{ fontSize: 16, marginBottom: 16, color: THEME.accent }}>
            Selected Scenario: {refiScenarios[selectedScenario]?.name}
          </h4>

          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(2, 1fr)", gap: 24 }}>
            <div>
              <h5 style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12, textTransform: "uppercase" }}>
                Loan Details
              </h5>
              <StatRow
                label="New Loan Amount"
                value={fmtUSD(scenarios[selectedScenario]?.newLoanAmount)}
                bold
                tooltip={{
                  title: "New Loan (Refi)",
                  description: "Loan size at refinance, sized to ARV and LTV.",
                  formula: "ARV × (LTV % ÷ 100)"
                }}
              />
              <StatRow label="Loan-to-Value Ratio" value={`${scenarios[selectedScenario]?.loanToValue}%`} />
              <StatRow label="Interest Rate" value={`${scenarios[selectedScenario]?.interestRate}%`} />
              <StatRow
                label="New Monthly P&I"
                value={fmtUSD(scenarios[selectedScenario]?.newMonthlyPI)}
                valueColor={THEME.secondary}
                tooltip={{
                  title: "New Monthly P&I",
                  description: "Amortized payment on the refinanced loan (30-yr assumed).",
                  formula: "L·r/(1 − (1+r)^-n)   30-year schedule"
                }}
              />
            </div>

            <div>
              <h5 style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12, textTransform: "uppercase" }}>
                Cash Out Analysis
              </h5>
              <StatRow
                label="Gross Cash Out"
                value={fmtUSD(scenarios[selectedScenario]?.grossCashOut)}
                tooltip={{
                  title: "Gross Cash Out",
                  description: "Cash generated by refi before refi costs.",
                  formula: "New Loan − Current Loan Balance"
                }}
              />
              <StatRow
                label="Total Refi Costs"
                value={fmtUSD(scenarios[selectedScenario]?.totalRefiCosts)}
                valueColor={THEME.red}
                tooltip={{
                  title: "Total Refinance Costs",
                  description: "All closing costs on the new loan.",
                  formula: "Appraisal + Title + Legal + Misc + (New Loan × 1%)"
                }}
              />
              <StatRow label="Net Cash Out"
                value={fmtUSD(scenarios[selectedScenario]?.netCashOut)}
                valueColor={scenarios[selectedScenario]?.netCashOut > 0 ? THEME.green : THEME.red}
                bold
                tooltip={{
                  title: "Net Cash Out",
                  description: "Cash in your hand after refi closing costs.",
                  formula: "Gross Cash Out − Total Refi Costs"
                }}
              />
              <StatRow label="Capital Recovery %"
                value={`${scenarios[selectedScenario]?.capitalRecovery.toFixed(1)}%`}
                valueColor={scenarios[selectedScenario]?.capitalRecovery >= 75 ? THEME.green :
                           scenarios[selectedScenario]?.capitalRecovery >= 50 ? THEME.orange : THEME.red}
                bold
                tooltip={{
                  title: "Capital Recovery",
                  description: "% of initial cash you pull back at refi. BRRRR targets 100%+.",
                  formula: "(Net Cash Out ÷ Total Invested) × 100"
                }}
              />
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="BRRRR Strategy Assessment" icon={<RepeatIcon size={16} />}>
        <div style={{ padding: 16, background: THEME.bgRaised, borderRadius: 6, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 8 }}>
            BRRRR Effectiveness
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.5 }}>
            {scenarios[selectedScenario]?.capitalRecovery >= 90 ?
              <span style={{ color: THEME.green }}>
                <strong>Excellent BRRRR candidate!</strong> You can recover {scenarios[selectedScenario]?.capitalRecovery.toFixed(1)}% of invested capital and repeat the strategy with minimal additional cash.
              </span> :
              scenarios[selectedScenario]?.capitalRecovery >= 70 ?
              <span style={{ color: THEME.orange }}>
                <strong>Good BRRRR potential.</strong> You'll recover {scenarios[selectedScenario]?.capitalRecovery.toFixed(1)}% of capital. Consider if remaining cash tied up is acceptable for portfolio growth.
              </span> :
              <span style={{ color: THEME.red }}>
                <strong>Limited BRRRR effectiveness.</strong> Only {scenarios[selectedScenario]?.capitalRecovery.toFixed(1)}% capital recovery. This property may be better as a long-term hold for appreciation.
              </span>
            }
          </div>
        </div>

        <StatRow label="Original Investment" value={fmtUSD(metrics.totalInvested)} />
        <StatRow label="Cash Recovered via Refinance"
          value={fmtUSD(scenarios[selectedScenario]?.netCashOut)}
          valueColor={scenarios[selectedScenario]?.netCashOut > 0 ? THEME.green : THEME.red}
        />
        <StatRow label="Cash Left in Deal"
          value={fmtUSD(Math.max(0, metrics.totalInvested - (scenarios[selectedScenario]?.netCashOut || 0)))}
          valueColor={THEME.text}
        />
        <StatRow label="Remaining Cash Flow Impact"
          value={fmtUSD((metrics.monthlyCashFlow || 0) - ((scenarios[selectedScenario]?.newMonthlyPI || 0) - (metrics.monthlyPI || 0)))}
          valueColor={(metrics.monthlyCashFlow || 0) - ((scenarios[selectedScenario]?.newMonthlyPI || 0) - (metrics.monthlyPI || 0)) > 0 ? THEME.green : THEME.red}
          bold
        />
      </Panel>
    </div>
  );
};
