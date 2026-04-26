/* ============================================================================
   STRATEGY RECOMMENDATION — scores Flip / BRRRR / Long-Term Rental / STR for
   the current deal and tags the best fit. Lives at the top of the new
   Summary tab so the user gets an answer ("which play is this?") on landing
   instead of having to interpret tabs of numbers.

   Each strategy gets:
     - one headline metric in its native unit
     - a 5-year wealth number so they're comparable
     - a one-line "best for…" tag
   The card with the highest 5-year wealth wins the BEST FIT badge.
   ============================================================================ */
import React, { useMemo } from "react";
import { TrendingUp, Hammer, RotateCcw, Home, Bed, Sparkles, AlertCircle } from "lucide-react";
import { THEME } from "../theme.js";
import { fmtUSD, isMobile, n, projectHold } from "../utils.js";
import { Panel, NumberField } from "../primitives.jsx";

const Card = ({ title, icon, color, headline, headlineLabel, wealth, bestFor, isBest, disabled, disabledNote }) => (
  <div style={{
    padding: 16,
    border: `2px solid ${isBest ? color : THEME.border}`,
    borderRadius: 10,
    background: isBest ? `${color}10` : THEME.bgPanel,
    position: "relative",
    opacity: disabled ? 0.55 : 1,
    display: "flex", flexDirection: "column", gap: 8
  }}>
    {isBest && (
      <div style={{
        position: "absolute", top: -10, right: 12,
        padding: "3px 9px", fontSize: 10, fontWeight: 700,
        letterSpacing: "0.08em", textTransform: "uppercase",
        background: color, color: "#FFFFFF", borderRadius: 999
      }}>
        Best fit
      </div>
    )}
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: color, color: "#FFFFFF",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
    </div>

    <div>
      <div style={{ fontSize: 10, color: THEME.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {headlineLabel}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{headline}</div>
    </div>

    <div style={{ fontSize: 11, color: THEME.textMuted, paddingTop: 4, borderTop: `1px solid ${THEME.borderLight}` }}>
      <strong style={{ color: THEME.text }}>5-yr wealth:</strong>{" "}
      {wealth == null ? "—" : fmtUSD(wealth)}
    </div>

    <div style={{ fontSize: 11, color: THEME.textMuted, lineHeight: 1.5 }}>
      <strong style={{ color: THEME.text }}>Best for:</strong> {bestFor}
    </div>

    {disabled && disabledNote && (
      <div style={{
        marginTop: 4, padding: "6px 8px",
        background: THEME.bgRaised, borderRadius: 6,
        fontSize: 10, color: THEME.textMuted, lineHeight: 1.4,
        display: "flex", gap: 6, alignItems: "flex-start"
      }}>
        <AlertCircle size={12} color={THEME.orange} style={{ marginTop: 1, flexShrink: 0 }} />
        <span>{disabledNote}</span>
      </div>
    )}
  </div>
);

export const StrategyRecommendation = ({ deal, metrics, onUpdate }) => {
  const arv          = n(deal.arv);
  const purchase     = n(deal.purchasePrice);
  const rehab        = n(deal.rehabBudget);
  const totalAllIn   = metrics.totalAllIn;
  const totalInvest  = metrics.totalInvested;
  const currentLoan  = n(deal.loanAmount);

  const strategies = useMemo(() => {
    /* ── Flip ─────────────────────────────────────────────────────────── */
    const saleCostPct = 0.07;
    const flipProfit = arv * (1 - saleCostPct) - totalAllIn;
    const flipMonths = Math.max(n(deal.rehabMonths) || 3, 1);
    const annualizedFlipROI = totalInvest > 0
      ? (flipProfit / totalInvest) * (12 / flipMonths) * 100
      : 0;

    /* ── BRRRR ────────────────────────────────────────────────────────── */
    const refiLtv = 0.75;
    const newLoanAmount = arv * refiLtv;
    const refiClosing = metrics.totalRefiClosingCosts || (newLoanAmount * 0.01 + 3000);
    const cashRecovered = newLoanAmount - currentLoan - refiClosing;
    const newRate = 7.5;
    const r = newRate / 100 / 12;
    const newPI = newLoanAmount > 0
      ? newLoanAmount * (r * Math.pow(1 + r, 360)) / (Math.pow(1 + r, 360) - 1)
      : 0;
    const capitalLeftIn = Math.max(0, totalInvest - cashRecovered);
    const brrrrProj = projectHold(deal, metrics, {
      monthlyPI: newPI,
      loanAmount: newLoanAmount,
      ratePct: newRate,
      termYears: 30,
      initialInvested: capitalLeftIn
    });
    // Post-refi monthly CF using the new (larger) loan payment.
    const grossMonthly  = n(deal.rentEstimate);
    const effIncome     = grossMonthly * (1 - n(deal.vacancy)/100 - n(deal.mgmtFee)/100);
    const monthlyOpEx   = (n(deal.propertyTax) + n(deal.insurance)) / 12
                          + n(deal.capex) + n(deal.repairMaintenance) + n(deal.hoa);
    const brrrrMonthlyCF = effIncome - monthlyOpEx - newPI;
    const brrrrCoC = capitalLeftIn > 0
      ? (brrrrMonthlyCF * 12 / capitalLeftIn) * 100
      : (brrrrMonthlyCF > 0 ? Infinity : 0);
    const brrrrWealth = cashRecovered + brrrrProj.exitProceeds + brrrrProj.cumulativeCF;

    /* ── Long-Term Rental ─────────────────────────────────────────────── */
    const ltrProj = metrics.projection || projectHold(deal, metrics);
    const ltrWealth = ltrProj.exitProceeds + ltrProj.cumulativeCF;
    const ltrIRR = ltrProj.irrPct;

    /* ── Short-Term Rental (Airbnb / VRBO) ────────────────────────────── */
    const nightly  = n(deal.airbnbNightlyRate);
    const occupancyPct = n(deal.airbnbOccupancy) || 65;
    const strMonthlyGross = nightly * 30 * (occupancyPct / 100);
    const strProj = nightly > 0
      ? projectHold(deal, metrics, {
          monthlyIncome: strMonthlyGross,
          // STRs add cleaning, supplies, higher utilities — bake in extra
          // monthly opex roughly equal to 15% of gross.
          monthlyOpExtra: strMonthlyGross * 0.15,
          // STRs run higher PM (co-host / cleaning fees absorbed in mgmt)
          // and slightly higher vacancy. We piggyback on deal.vacancy and
          // mgmtFee so we don't duplicate state — instead just pass higher
          // through opExtra above.
        })
      : null;
    const strWealth = strProj ? strProj.exitProceeds + strProj.cumulativeCF : null;
    const strIRR = strProj ? strProj.irrPct : null;

    return {
      flip: {
        key: "flip", title: "Flip",
        icon: <Hammer size={16} />, color: "#DC2626",
        headlineLabel: "Annualized ROI",
        headline: `${annualizedFlipROI.toFixed(1)}%`,
        wealth: flipProfit,
        bestFor: "Capital-constrained investors who want a payday in 3-6 months without becoming a landlord.",
        score: flipProfit > 0 ? annualizedFlipROI : -Infinity
      },
      brrrr: {
        key: "brrrr", title: "BRRRR",
        icon: <RotateCcw size={16} />, color: "#9333EA",
        headlineLabel: "Cash Recovered",
        headline: `${fmtUSD(cashRecovered)}${capitalLeftIn === 0 ? " (all out)" : ""}`,
        wealth: brrrrWealth,
        bestFor: "Scaling a portfolio fast — pull capital back, repeat. Needs strong refi margin (All-In ÷ ARV ≤ 75%).",
        score: brrrrWealth,
        warning: cashRecovered < 0
          ? "Refi pulls less than the original loan — cash recovery is negative."
          : null
      },
      ltr: {
        key: "ltr", title: "Long-Term Rental",
        icon: <Home size={16} />, color: THEME.accent,
        headlineLabel: "5-yr IRR",
        headline: ltrIRR != null ? `${ltrIRR.toFixed(1)}%` : "—",
        wealth: ltrWealth,
        bestFor: "Steady monthly cash flow + appreciation. Lower hands-on work once a tenant is placed.",
        score: ltrWealth
      },
      str: {
        key: "str", title: "Short-Term Rental",
        icon: <Bed size={16} />, color: "#0891B2",
        headlineLabel: "5-yr IRR",
        headline: strIRR != null ? `${strIRR.toFixed(1)}%` : "—",
        wealth: strWealth,
        bestFor: "Vacation/destination markets where nightly rates carry the building. Higher hands-on management.",
        score: strWealth ?? -Infinity,
        disabled: nightly <= 0,
        disabledNote: "Enter a nightly rate and occupancy below to score this strategy."
      }
    };
  }, [deal, metrics, arv, totalAllIn, totalInvest, currentLoan]);

  const eligible = Object.values(strategies).filter(s => !s.disabled);
  const best = eligible.reduce((b, s) => (s.score > (b?.score ?? -Infinity) ? s : b), null);

  return (
    <Panel title="Strategy Recommendation" icon={<Sparkles size={16} />} accent style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 14, lineHeight: 1.55 }}>
        How this property scores across the four most common plays. The best-fit card is the one that produces the most wealth over a 5-year horizon. Tweak the STR inputs below to score the Airbnb option.
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile() ? "1fr" : "repeat(2, 1fr)",
        gap: 14
      }}>
        {Object.values(strategies).map(s => (
          <Card
            key={s.key}
            title={s.title}
            icon={s.icon}
            color={s.color}
            headline={s.headline}
            headlineLabel={s.headlineLabel}
            wealth={s.wealth}
            bestFor={s.bestFor}
            isBest={best?.key === s.key}
            disabled={s.disabled}
            disabledNote={s.disabledNote}
          />
        ))}
      </div>

      {/* STR inputs — kept here on the Summary tab so the user can score
          the Airbnb option without hopping to another section. */}
      <div style={{
        marginTop: 18, padding: 14,
        background: THEME.bgRaised, borderRadius: 8,
        border: `1px solid ${THEME.border}`
      }}>
        <div className="label-xs" style={{ color: THEME.accent, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <Bed size={13} /> Short-term rental inputs
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "1fr 1fr", gap: 12 }}>
          <NumberField
            label="Avg Nightly Rate"
            value={deal.airbnbNightlyRate}
            onChange={(val) => onUpdate({ airbnbNightlyRate: val })}
            prefix="$"
            helper="Pull from AirDNA / Airbnb comps for the area"
          />
          <NumberField
            label="Occupancy %"
            value={deal.airbnbOccupancy}
            onChange={(val) => onUpdate({ airbnbOccupancy: val })}
            prefix="%"
            helper="65% is the national STR average; coastal/mountain markets often hit 70-80%"
          />
        </div>
      </div>

      {best && (
        <div style={{
          marginTop: 16, padding: 14,
          background: `${best.color}12`,
          border: `1px solid ${best.color}40`,
          borderRadius: 8
        }}>
          <div style={{ fontSize: 13, lineHeight: 1.55 }}>
            <strong>Best fit:</strong> {best.title}.{" "}
            {best.bestFor}
          </div>
        </div>
      )}
    </Panel>
  );
};
