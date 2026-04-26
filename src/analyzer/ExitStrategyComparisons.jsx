/* ============================================================================
   EXIT STRATEGY COMPARISONS — Sell-After-Rehab vs. Hold 2-3yr vs. Hold 5+yr
   vs. BRRRR. Numbers are computed against the shared projectHold engine in
   utils.js so loan paydown, rent growth, and appreciation behave consistently
   here AND in the headline IRR + Strategy Recommendation card.
   ============================================================================ */
import React, { useState, useMemo } from "react";
import { Target } from "lucide-react";
import { THEME } from "../theme.js";
import { fmtUSD, isMobile, n, projectHold, remainingLoanBalance } from "../utils.js";
import { Panel } from "../primitives.jsx";

export const ExitStrategyComparisons = ({ deal, metrics }) => {
  const [timeHorizon, setTimeHorizon] = useState(5);
  const [appreciationRate, setAppreciationRate] = useState(4);
  const [rentGrowth, setRentGrowth] = useState(3);

  const strategies = useMemo(() => {
    const arv = n(deal.arv);
    const currentLoan = n(deal.loanAmount);
    const saleCostPct = 0.07;

    // Sell-after-rehab: out at the end of rehab. Sale price = ARV (fresh
    // comps), minus 7% selling costs and the loan you took to buy.
    const sellNowProceeds = arv * (1 - saleCostPct) - currentLoan;

    // Hold 2-3yr: same projection engine, just a 2.5-year horizon. This
    // properly compounds the user's chosen appreciation + rent growth and
    // pays down principal on the loan.
    const holdShortProj = projectHold(deal, metrics, {
      years: 2.5,
      appreciation: appreciationRate,
      rentGrowth
    });
    const holdShortNet = holdShortProj.exitProceeds + holdShortProj.cumulativeCF;

    // Hold long: full user-chosen horizon.
    const holdLongProj = projectHold(deal, metrics, {
      years: timeHorizon,
      appreciation: appreciationRate,
      rentGrowth
    });
    const holdLongNet = holdLongProj.exitProceeds + holdLongProj.cumulativeCF;

    // BRRRR: refi at 75% LTV after rehab, pull cash out, then hold for
    // cash flow with the *new* loan (typically larger principal). Cash
    // recovered counts as immediate proceeds; ongoing CF uses the new
    // payment. We approximate the new loan at 7.5% / 30yr — close enough
    // for a planning view, the Refinance tab does the real scenario work.
    const refiLtv = 0.75;
    const newLoanAmount = arv * refiLtv;
    const refiClosing = metrics.totalRefiClosingCosts || (newLoanAmount * 0.01 + 3000);
    const cashRecovered = newLoanAmount - currentLoan - refiClosing;
    const newRate = 7.5;
    const r = newRate / 100 / 12;
    const newPI = newLoanAmount > 0
      ? newLoanAmount * (r * Math.pow(1 + r, 360)) / (Math.pow(1 + r, 360) - 1)
      : 0;
    const brrrrProj = projectHold(deal, metrics, {
      years: timeHorizon,
      appreciation: appreciationRate,
      rentGrowth,
      monthlyPI: newPI,
      loanAmount: newLoanAmount,
      ratePct: newRate,
      termYears: 30,
      // Capital remaining in the deal AFTER the cash-out refi. That's the
      // base your ongoing returns are measured against.
      initialInvested: Math.max(0, metrics.totalInvested - cashRecovered)
    });
    const brrrrNet = cashRecovered + brrrrProj.exitProceeds + brrrrProj.cumulativeCF;

    return {
      sellNow: {
        name: "Sell After Rehab",
        netProceeds: sellNowProceeds,
        timeToExit: deal.rehabMonths || 3,
        pros: ["Quick capital recovery", "No landlord responsibilities", "Immediate profit realization"],
        cons: ["No ongoing cash flow", "Loss of appreciation potential", "Capital gains tax"]
      },
      holdShort: {
        name: "Hold & Sell (2-3 years)",
        netProceeds: holdShortNet,
        timeToExit: 30,
        pros: ["Moderate appreciation capture", "Some rental income", "Potential tax benefits"],
        cons: ["Property management needed", "Market risk", "Selling costs still apply"]
      },
      holdLong: {
        name: `Hold Long-Term (${timeHorizon}+ years)`,
        netProceeds: holdLongNet,
        timeToExit: timeHorizon * 12,
        pros: ["Maximum appreciation potential", "Steady cash flow", "Tax depreciation benefits"],
        cons: ["Longest capital tie-up", "Market volatility risk", "Ongoing management"]
      },
      brrrr: {
        name: "BRRRR & Repeat",
        netProceeds: brrrrNet,
        timeToExit: 6,
        pros: ["Capital recycling", "Portfolio scaling", "Ongoing cash flow", "Tax advantages"],
        cons: ["Most complex", "Refinance costs", "Interest rate risk"]
      }
    };
  }, [deal, metrics, timeHorizon, appreciationRate, rentGrowth]);

  const bestStrategy = Object.entries(strategies).reduce((best, [key, strategy]) =>
    strategy.netProceeds > best.netProceeds ? { key, ...strategy } : best,
    { netProceeds: -Infinity }
  );

  return (
    <Panel title="Exit Strategy Analysis" icon={<Target size={16} />} accent>
      <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div>
          <div className="label-xs" style={{ marginBottom: 6 }}>Time Horizon (Years)</div>
          <input
            type="range"
            min="1"
            max="10"
            value={timeHorizon}
            onChange={(e) => setTimeHorizon(parseInt(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ textAlign: "center", fontSize: 12, color: THEME.textMuted }}>{timeHorizon} years</div>
        </div>

        <div>
          <div className="label-xs" style={{ marginBottom: 6 }}>Annual Appreciation %</div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={appreciationRate}
            onChange={(e) => setAppreciationRate(parseFloat(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ textAlign: "center", fontSize: 12, color: THEME.textMuted }}>{appreciationRate}% annually</div>
        </div>

        <div>
          <div className="label-xs" style={{ marginBottom: 6 }}>Annual Rent Growth %</div>
          <input
            type="range"
            min="0"
            max="8"
            step="0.5"
            value={rentGrowth}
            onChange={(e) => setRentGrowth(parseFloat(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ textAlign: "center", fontSize: 12, color: THEME.textMuted }}>{rentGrowth}% annually</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
        {Object.entries(strategies).map(([key, strategy]) => (
          <div
            key={key}
            style={{
              padding: 16,
              border: `2px solid ${key === bestStrategy.key ? THEME.accent : THEME.border}`,
              borderRadius: 8,
              background: key === bestStrategy.key ? THEME.bgRaised : THEME.bgPanel
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{strategy.name}</div>
              {key === bestStrategy.key && (
                <div style={{ fontSize: 10, color: THEME.accent, fontWeight: 700 }}>BEST PROCEEDS</div>
              )}
            </div>

            <div style={{ fontSize: 18, fontWeight: 700, color: THEME.accent, marginBottom: 8 }}>
              {fmtUSD(strategy.netProceeds)}
            </div>

            <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12 }}>
              Exit in {strategy.timeToExit >= 12 ? `${Math.round(strategy.timeToExit / 12)} years` : `${strategy.timeToExit} months`}
            </div>

            <div style={{ fontSize: 11, color: THEME.green, marginBottom: 6 }}>
              + {strategy.pros[0]}
            </div>
            <div style={{ fontSize: 11, color: THEME.red }}>
              - {strategy.cons[0]}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, padding: 16, background: THEME.bgRaised, borderRadius: 6 }}>
        <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 8 }}>
          Recommendation
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.4 }}>
          Based on your projections, <strong>{bestStrategy.name}</strong> offers the highest net proceeds
          of {fmtUSD(bestStrategy.netProceeds)}. Consider your risk tolerance and capital needs when deciding.
        </div>
        <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 8, lineHeight: 1.5 }}>
          Hold projections include loan principal paydown, {rentGrowth}% annual rent growth, and {appreciationRate}% appreciation.
          Sale costs assumed at 7%. BRRRR scenario assumes 75% LTV refi at 7.5% / 30yr with cash-out applied immediately.
        </div>
      </div>
    </Panel>
  );
};
