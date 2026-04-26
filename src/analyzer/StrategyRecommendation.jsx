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

const Card = ({ title, icon, color, headline, headlineLabel, wealth, bestFor, why, watchOut, isBest, disabled, disabledNote }) => (
  <div style={{
    padding: 16,
    border: `2px solid ${isBest ? color : THEME.border}`,
    borderRadius: 10,
    background: isBest ? `${color}10` : THEME.bgPanel,
    position: "relative",
    opacity: disabled ? 0.55 : 1,
    display: "flex", flexDirection: "column", gap: 10
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

    {why && (
      <div style={{ fontSize: 11, color: THEME.textMuted, lineHeight: 1.5 }}>
        <strong style={{ color: THEME.text }}>Why for this deal:</strong> {why}
      </div>
    )}

    <div style={{ fontSize: 11, color: THEME.textMuted, lineHeight: 1.5 }}>
      <strong style={{ color: THEME.text }}>Best for:</strong> {bestFor}
    </div>

    {watchOut && (
      <div style={{
        marginTop: 2, padding: "6px 8px",
        background: `${THEME.orange}15`, borderRadius: 6,
        fontSize: 11, color: THEME.text, lineHeight: 1.4,
        display: "flex", gap: 6, alignItems: "flex-start"
      }}>
        <AlertCircle size={12} color={THEME.orange} style={{ marginTop: 1, flexShrink: 0 }} />
        <span><strong>Watch out:</strong> {watchOut}</span>
      </div>
    )}

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
    const ltrMonthlyCF = metrics.monthlyCashFlow;

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
        })
      : null;
    const strWealth = strProj ? strProj.exitProceeds + strProj.cumulativeCF : null;
    // STR monthly CF: gross income minus operating costs and the same loan
    // payment as the LTR scenario. Cleaning/PM bundled into opEx via the
    // 15% bump above.
    const strMonthlyCF = nightly > 0
      ? strMonthlyGross - strMonthlyGross * 0.15
        - (n(deal.propertyTax) + n(deal.insurance)) / 12
        - n(deal.capex) - n(deal.repairMaintenance) - n(deal.hoa)
        - metrics.monthlyPI
      : null;

    /* ── Deal-specific reasoning ──────────────────────────────────────
     * Each card gets a 1-line "why this fits THIS deal" pulled from the
     * actual numbers (margin %, CoC, etc.) so the recommendation isn't
     * generic advice — it cites the property's own math.
     */
    const allInRatio = arv > 0 ? (totalAllIn / arv) * 100 : 0;
    const onePctRent = purchase > 0 ? (n(deal.rentEstimate) / purchase) * 100 : 0;
    const monthlyCF  = metrics.monthlyCashFlow;
    const strLtrLift = (strMonthlyCF != null && ltrMonthlyCF != null)
      ? strMonthlyCF - ltrMonthlyCF
      : null;

    const flipWhy = arv === 0
      ? "Set an ARV first to see flip economics."
      : flipProfit > 30000
        ? `Roughly ${fmtUSD(flipProfit)} of profit on a ${flipMonths}-month rehab — solid one-time payday.`
        : flipProfit > 0
          ? `Profit margin is thin (${fmtUSD(flipProfit)}). One surprise during rehab could wipe it out.`
          : "Sale price doesn't cover all-in cost — flipping this deal loses money.";

    const flipWatch = flipProfit > 0 && flipProfit < 30000
      ? "Margin under $30K leaves little room for rehab overruns or a slow market."
      : null;

    const brrrrWhy = arv === 0
      ? "Set an ARV to see if this BRRRRs."
      : allInRatio <= 75
        ? `All-In ÷ ARV is ${allInRatio.toFixed(0)}% — under 75% means the refi pulls back ${fmtUSD(cashRecovered)} of your ${fmtUSD(totalInvest)} in.`
        : allInRatio <= 85
          ? `All-In ÷ ARV is ${allInRatio.toFixed(0)}% — workable, but you'll leave ${fmtUSD(capitalLeftIn)} of capital in the deal.`
          : `All-In ÷ ARV is ${allInRatio.toFixed(0)}% — too tight to recycle capital. Look for a lower buy or higher ARV.`;

    const brrrrWatch = cashRecovered < 0
      ? "Refi pulls less than the original loan. Either ARV is too low or rehab budget is too high."
      : capitalLeftIn > totalInvest * 0.5
        ? "More than half your capital stays trapped — this isn't really a BRRRR, it's a refi with extra steps."
        : null;

    const ltrWhy = monthlyCF > 0
      ? `Throws off ${fmtUSD(monthlyCF)}/mo right now and grows with rent over 5 years.`
      : `Negative cash flow today (${fmtUSD(monthlyCF)}/mo) — you'd be feeding the property until rents catch up or you refinance.`;

    const ltrWatch = monthlyCF < 0
      ? "Negative monthly cash flow. Either rent is below-market, the loan terms need work, or this isn't a rental deal."
      : onePctRent < 0.7 && onePctRent > 0
        ? `Rent ÷ purchase is only ${onePctRent.toFixed(2)}% — well below the 1% rule. Cash flow will be thin.`
        : null;

    const strWhy = nightly <= 0
      ? "Add a nightly rate to score this."
      : strLtrLift != null && strLtrLift > 500
        ? `STR throws off ${fmtUSD(strLtrLift)}/mo more than long-term rental — local nightly market is carrying the deal.`
        : strLtrLift != null && strLtrLift > 0
          ? `STR edges out long-term rental by ${fmtUSD(strLtrLift)}/mo. Worth it if you want to operate it actively.`
          : `STR underperforms long-term rental here. Long-term tenants likely better risk-adjusted.`;

    const strWatch = nightly > 0 && strLtrLift != null && strLtrLift < 0
      ? "STR is underperforming the LTR baseline. Reconsider unless this is a destination market."
      : nightly > 0 && n(deal.airbnbOccupancy) > 80
        ? "Occupancy assumption above 80% is aggressive — pressure-test against AirDNA before committing."
        : null;

    return {
      flip: {
        key: "flip", title: "Flip",
        icon: <Hammer size={16} />, color: "#DC2626",
        headlineLabel: "Annualized ROI",
        headline: `${annualizedFlipROI.toFixed(1)}%`,
        wealth: flipProfit,
        why: flipWhy,
        watchOut: flipWatch,
        bestFor: "Capital-constrained investors who want a payday in 3-6 months without becoming a landlord.",
        score: flipProfit > 0 ? annualizedFlipROI : -Infinity
      },
      brrrr: {
        key: "brrrr", title: "BRRRR",
        icon: <RotateCcw size={16} />, color: "#9333EA",
        headlineLabel: "Cash Recovered",
        headline: `${fmtUSD(cashRecovered)}${capitalLeftIn === 0 ? " (all out)" : ""}`,
        wealth: brrrrWealth,
        why: brrrrWhy,
        watchOut: brrrrWatch,
        bestFor: "Scaling a portfolio fast — pull capital back, repeat. Needs strong refi margin (All-In ÷ ARV ≤ 75%).",
        score: brrrrWealth
      },
      ltr: {
        key: "ltr", title: "Long-Term Rental",
        icon: <Home size={16} />, color: THEME.accent,
        headlineLabel: "Monthly Cash Flow",
        headline: fmtUSD(ltrMonthlyCF),
        wealth: ltrWealth,
        why: ltrWhy,
        watchOut: ltrWatch,
        bestFor: "Steady monthly cash flow + appreciation. Lower hands-on work once a tenant is placed.",
        score: ltrWealth
      },
      str: {
        key: "str", title: "Short-Term Rental",
        icon: <Bed size={16} />, color: "#0891B2",
        headlineLabel: "Monthly Cash Flow",
        headline: strMonthlyCF != null ? fmtUSD(strMonthlyCF) : "—",
        wealth: strWealth,
        why: strWhy,
        watchOut: strWatch,
        bestFor: "Vacation/destination markets where nightly rates carry the building. Higher hands-on management.",
        score: strWealth ?? -Infinity,
        disabled: nightly <= 0,
        disabledNote: "Enter a nightly rate and occupancy below to score this strategy."
      }
    };
  }, [deal, metrics, arv, totalAllIn, totalInvest, currentLoan, purchase]);

  const eligible = Object.values(strategies).filter(s => !s.disabled);
  const best = eligible.reduce((b, s) => (s.score > (b?.score ?? -Infinity) ? s : b), null);
  const inputsLook  = arv > 0 && purchase > 0 && n(deal.rentEstimate) > 0;

  return (
    <Panel title="Strategy Recommendation" icon={<Sparkles size={16} />} accent style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 13, color: THEME.text, marginBottom: 8, lineHeight: 1.6 }}>
        This is the recap for {deal.address || "this property"}. We've taken everything you entered across the previous tabs — purchase price, rehab budget, rent, financing — and run it through the four most common investor plays. Each card shows the metric that strategy is judged by, what it produces over five years, why it does or doesn't fit <em>this specific deal</em>, and what to watch out for.
      </div>
      <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 14, lineHeight: 1.55 }}>
        The "Best fit" badge goes to whichever strategy produces the most total wealth (cash flow + sale proceeds) over a 5-year hold. Add a nightly rate below to score the Short-Term Rental option.
        {!inputsLook && (
          <>
            <br />
            <strong style={{ color: THEME.orange }}>Heads up:</strong> a few key inputs (purchase price, ARV, or rent) are still blank — the recommendation will sharpen once you fill them in on the earlier tabs.
          </>
        )}
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
          marginTop: 16, padding: 16,
          background: `${best.color}12`,
          border: `1px solid ${best.color}40`,
          borderRadius: 8
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", color: best.color, marginBottom: 6
          }}>
            Recommendation
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, marginBottom: 6 }}>
            Run this as a <span style={{ color: best.color }}>{best.title}</span>.
          </div>
          <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.6 }}>
            {best.why} {best.bestFor} Projected 5-yr wealth: <strong style={{ color: THEME.text }}>{fmtUSD(best.wealth)}</strong>.
          </div>
          {best.watchOut && (
            <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 8, lineHeight: 1.6 }}>
              <strong style={{ color: THEME.orange }}>Watch out:</strong> {best.watchOut}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
};
