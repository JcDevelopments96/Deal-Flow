/* ============================================================================
   Quick-cashflow estimate for a single listing.
   Used on the listing card + detail modal so investors can screen fast
   without opening the full analyzer.
   ============================================================================ */

/**
 * Estimate monthly cashflow for a listing using HUD Fair Market Rents + live
 * mortgage rate as inputs. Assumptions below are deliberately conservative:
 *   - 25% down, 30-year fixed at current FRED 30yr rate
 *   - Property tax: 1.2% annual of price
 *   - Insurance: 0.5% annual of price
 *   - Mgmt + vacancy + capex reserve: 20% of rent (standard rule of thumb)
 *
 * Returns null if we don't have enough data to estimate (no FMR, no rate,
 * no price). Callers should render nothing in that case.
 *
 * @param {object} opts
 * @param {number} opts.price           List price
 * @param {number} opts.bedrooms        0..5
 * @param {object} opts.fmr             HUD FMR response: { fmr: {studio,one,two,three,four}, year, ... }
 * @param {number} opts.mortgageRate    FRED 30yr rate, e.g. 7.12 (percent)
 */
export function estimateCashflow({ price, bedrooms, fmr, mortgageRate }) {
  if (!price || !fmr?.fmr || typeof mortgageRate !== "number") return null;

  const bedKey = bedrooms >= 4 ? "four"
    : bedrooms === 3 ? "three"
    : bedrooms === 2 ? "two"
    : bedrooms === 1 ? "one"
    : "studio";
  const monthlyRent = Number(fmr.fmr[bedKey]) || null;
  if (!monthlyRent) return null;

  // Mortgage payment — standard amortization formula
  const downPct = 0.25;
  const loanAmount = price * (1 - downPct);
  const monthlyRate = (mortgageRate / 100) / 12;
  const termMonths = 30 * 12;
  const monthlyPI = monthlyRate > 0
    ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1)
    : loanAmount / termMonths;

  const monthlyTax = price * 0.012 / 12;
  const monthlyIns = price * 0.005 / 12;
  const monthlyReserves = monthlyRent * 0.20;

  const monthlyCashflow = monthlyRent - monthlyPI - monthlyTax - monthlyIns - monthlyReserves;

  // Cash-on-cash = annual cashflow / total cash invested
  const downCash = price * downPct;
  const closingCash = price * 0.03;
  const totalCash = downCash + closingCash;
  const annualCashflow = monthlyCashflow * 12;
  const cashOnCash = totalCash > 0 ? (annualCashflow / totalCash) * 100 : null;

  // Cap rate = NOI / price. NOI = rent - operating (tax, ins, reserves). Excludes debt service.
  const monthlyNOI = monthlyRent - monthlyTax - monthlyIns - monthlyReserves;
  const annualNOI = monthlyNOI * 12;
  const capRate = price > 0 ? (annualNOI / price) * 100 : null;

  return {
    monthlyRent,
    monthlyPI: Math.round(monthlyPI),
    monthlyCashflow: Math.round(monthlyCashflow),
    capRate: capRate != null ? +capRate.toFixed(1) : null,
    cashOnCash: cashOnCash != null ? +cashOnCash.toFixed(1) : null,
    assumptions: {
      downPct, mortgageRate,
      fmrYear: fmr.year,
      propertyTaxPct: 1.2,
      insurancePct: 0.5,
      reservesPctOfRent: 20
    }
  };
}
