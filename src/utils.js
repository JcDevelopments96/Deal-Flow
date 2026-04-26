/* ============================================================================
   UTILITIES — responsive helpers, number/currency formatting, deal metrics.
   PDF/Excel/Word export lives in src/lib/exports.js (lazy-loaded).
   ============================================================================ */

/* ── Responsive breakpoints ──────────────────────────────────────────── */
export const isMobile = () => typeof window !== "undefined" && window.innerWidth <= 768;
export const isTablet = () => typeof window !== "undefined" && window.innerWidth <= 1024 && window.innerWidth > 768;

/* ── Number / currency helpers ───────────────────────────────────────── */
export const n = (val) => Number(val) || 0;

export const fmtUSD = (value, opts = {}) => {
  if (typeof value !== 'number') value = parseFloat(value) || 0;
  if (opts.short && value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (opts.short && value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

/* ── IRR (Newton-Raphson) ────────────────────────────────────────────────
 * Internal Rate of Return for a stream of cash flows where index 0 is the
 * initial investment (negative) and subsequent indices are end-of-year
 * cash flows (positive for inflows). Returns annual IRR as a percentage,
 * or null if the solver can't converge. Used everywhere the analyzer
 * needs a time-value-of-money return (long-term hold, BRRRR, STR).
 */
export const irr = (cashFlows, guess = 0.1) => {
  if (!Array.isArray(cashFlows) || cashFlows.length < 2) return null;
  if (cashFlows[0] >= 0) return null;            // need a negative initial outflow
  const npv = (rate) => cashFlows.reduce((s, cf, t) => s + cf / Math.pow(1 + rate, t), 0);
  const dnpv = (rate) => cashFlows.reduce((s, cf, t) => s - (t * cf) / Math.pow(1 + rate, t + 1), 0);
  let rate = guess;
  for (let i = 0; i < 100; i++) {
    const f = npv(rate);
    if (Math.abs(f) < 1e-6) return rate * 100;
    const df = dnpv(rate);
    if (df === 0) break;
    let next = rate - f / df;
    if (next < -0.99) next = -0.99;              // keep rate above -100%
    if (Math.abs(next - rate) < 1e-7) return next * 100;
    rate = next;
  }
  return null;
};

/* ── Remaining loan balance after N months on an amortizing loan ────── */
export const remainingLoanBalance = (loanAmount, annualRatePct, termYears, monthsPaid) => {
  if (loanAmount <= 0) return 0;
  if (monthsPaid <= 0) return loanAmount;
  const r = annualRatePct / 100 / 12;
  const nMonths = termYears * 12;
  if (monthsPaid >= nMonths) return 0;
  if (r === 0) return loanAmount * (1 - monthsPaid / nMonths);
  const pmt = loanAmount * (r * Math.pow(1 + r, nMonths)) / (Math.pow(1 + r, nMonths) - 1);
  const bal = loanAmount * Math.pow(1 + r, monthsPaid) - pmt * (Math.pow(1 + r, monthsPaid) - 1) / r;
  return Math.max(0, bal);
};

/* ── Long-term hold projection ──────────────────────────────────────────
 * Models a multi-year buy-and-hold: rent + expense growth, loan paydown,
 * appreciation, and a final sale. Used for IRR in the Key Metrics panel
 * AND as the engine behind the Exit and Strategy Recommendation views.
 *
 * opts:
 *   years          (default 5)   — hold period
 *   appreciation   (default 4)   — annual %
 *   rentGrowth     (default 3)   — annual %
 *   expenseGrowth  (default 2.5) — annual %
 *   saleCostPct    (default 7)   — % of sale price (realtor + closing)
 *   monthlyIncome  optional      — overrides deal.rentEstimate (for STR)
 *   monthlyOpExtra optional      — extra monthly cost (e.g., STR cleaning/mgmt)
 *   loanAmount, monthlyPI, ratePct, termYears  optional — override the
 *                                  deal's loan terms (for post-refi BRRRR)
 *   initialInvested optional     — overrides totalInvested (for BRRRR after
 *                                  cash-out, the *remaining* invested capital)
 */
export const projectHold = (deal, metrics, opts = {}) => {
  const years          = opts.years ?? 5;
  const appreciation   = (opts.appreciation ?? 4) / 100;
  const rentGrowth     = (opts.rentGrowth ?? 3) / 100;
  const expenseGrowth  = (opts.expenseGrowth ?? 2.5) / 100;
  const saleCostPct    = (opts.saleCostPct ?? 7) / 100;

  const arv            = n(deal.arv);
  const rentBase       = opts.monthlyIncome ?? n(deal.rentEstimate);
  const opExtra        = opts.monthlyOpExtra ?? 0;
  const monthlyPI      = opts.monthlyPI ?? metrics.monthlyPI;
  const loanAmount     = opts.loanAmount ?? n(deal.loanAmount);
  const ratePct        = opts.ratePct ?? n(deal.interestRate);
  const termYears      = opts.termYears ?? (n(deal.loanTermYears) || 30);
  const initialInvest  = opts.initialInvested ?? metrics.totalInvested;

  const propTax        = n(deal.propertyTax);
  const insurance      = n(deal.insurance);
  const monthlyOp      = n(deal.capex) + n(deal.repairMaintenance) + n(deal.hoa) + opExtra;
  const vacancyPct     = n(deal.vacancy) / 100;
  const mgmtPct        = n(deal.mgmtFee) / 100;

  const cashFlows = [-initialInvest];
  let rent = rentBase;
  let yearOpAnnual = (propTax + insurance) + monthlyOp * 12;
  let cumulativeCF = 0;

  for (let y = 1; y <= years; y++) {
    const grossRentAnnual = rent * 12;
    const effectiveIncome = grossRentAnnual * (1 - vacancyPct - mgmtPct);
    const yearCF = effectiveIncome - yearOpAnnual - monthlyPI * 12;
    cumulativeCF += yearCF;

    if (y < years) {
      cashFlows.push(yearCF);
    } else {
      const futureValue = arv * Math.pow(1 + appreciation, years);
      const remBal      = remainingLoanBalance(loanAmount, ratePct, termYears, years * 12);
      const saleCosts   = futureValue * saleCostPct;
      const exitProceeds = futureValue - saleCosts - remBal;
      cashFlows.push(yearCF + exitProceeds);
    }

    rent          *= (1 + rentGrowth);
    yearOpAnnual  *= (1 + expenseGrowth);
  }

  const futureValue  = arv * Math.pow(1 + appreciation, years);
  const remBal       = remainingLoanBalance(loanAmount, ratePct, termYears, years * 12);
  const exitProceeds = futureValue * (1 - saleCostPct) - remBal;
  const irrPct       = irr(cashFlows);

  return { cashFlows, cumulativeCF, futureValue, remainingBalance: remBal, exitProceeds, irrPct, years };
};

/* ── Deal metrics — single source of truth for cash-flow / ROI math ── */
export const calcMetrics = (deal) => {
  const purchasePrice = n(deal.purchasePrice);
  const rehabBudget = n(deal.rehabBudget);
  const arv = n(deal.arv);
  const rentEstimate = n(deal.rentEstimate);
  const downPayment = n(deal.downPayment);
  const loanAmount = n(deal.loanAmount);
  const interestRate = n(deal.interestRate);
  const loanTermYears = n(deal.loanTermYears);
  const closingCosts = n(deal.closingCosts);
  const holdingCosts = n(deal.holdingCosts);
  const propertyTax = n(deal.propertyTax);
  const insurance = n(deal.insurance);
  const capex = n(deal.capex);
  const repairMaintenance = n(deal.repairMaintenance);
  const vacancy = n(deal.vacancy);
  const mgmtFee = n(deal.mgmtFee);
  const hoa = n(deal.hoa);

  const cashDown = purchasePrice * (downPayment / 100);
  const totalInvested = cashDown + rehabBudget + closingCosts + holdingCosts;

  // Refi closing costs (pulled from deal's refiCosts + 1% origination on projected new loan)
  const refiCostsObj = deal.refiCosts || { appraisal: 500, title: 1200, legal: 800, origination: 0, misc: 500 };
  const refiBaseCosts = Object.values(refiCostsObj).reduce((sum, cost) => sum + (Number(cost) || 0), 0);
  const refiLtv = deal.refiLtv || 75;
  const projectedNewLoan = arv * (refiLtv / 100);
  const refiOrigination = projectedNewLoan * 0.01;
  const totalRefiClosingCosts = refiBaseCosts + refiOrigination;

  // All-in cost: the full capital project cost, including refi closing
  const totalAllIn = purchasePrice + closingCosts + rehabBudget + holdingCosts + totalRefiClosingCosts;
  const allInToArv = arv > 0 ? (totalAllIn / arv) * 100 : 0;

  const monthlyPI = loanAmount > 0 && interestRate > 0 ?
    loanAmount * (interestRate / 100 / 12 * Math.pow(1 + interestRate / 100 / 12, loanTermYears * 12)) /
    (Math.pow(1 + interestRate / 100 / 12, loanTermYears * 12) - 1) : 0;

  const monthlyTaxIns = (propertyTax + insurance) / 12;
  const monthlyCosts = monthlyPI + monthlyTaxIns + capex + repairMaintenance + hoa;

  const vacancyLoss = rentEstimate * (vacancy / 100);
  const mgmtCost = rentEstimate * (mgmtFee / 100);
  const effectiveIncome = rentEstimate - vacancyLoss - mgmtCost;

  const monthlyCashFlow = effectiveIncome - monthlyCosts;
  const annualCashFlow = monthlyCashFlow * 12;
  const cashOnCash = totalInvested > 0 ? (annualCashFlow / totalInvested) * 100 : 0;
  const capRate = purchasePrice > 0 ? (annualCashFlow / purchasePrice) * 100 : 0;

  const seventyPercentRule = purchasePrice + rehabBudget <= arv * 0.7;
  const onePercentRule = rentEstimate >= purchasePrice * 0.01;

  let score = 0;
  if (seventyPercentRule) score += 25;
  if (onePercentRule) score += 15;
  if (monthlyCashFlow > 0) score += 20;
  if (cashOnCash > 8) score += 15;
  if (capRate > 6) score += 10;
  if (monthlyCashFlow > 200) score += 10;
  if (cashOnCash > 12) score += 5;

  const grade = score >= 80 ? "A" : score >= 70 ? "B+" : score >= 60 ? "B" : score >= 50 ? "C" : "D";
  const totalROI = totalInvested > 0 ? ((arv - totalInvested) / totalInvested) * 100 : 0;

  // Headline IRR — 5-year long-term hold using sane defaults. The Exit
  // tab can recompute with its own appreciation/horizon; this is the
  // "screen-it-on-the-spot" number you compare across deals.
  const baseMetrics = {
    totalInvested, monthlyPI, monthlyCosts, monthlyCashFlow, annualCashFlow,
    cashOnCash, capRate, seventyPercentRule, onePercentRule, score, grade,
    vacancyLoss, mgmtCost, effectiveIncome, totalROI,
    cashDown, totalRefiClosingCosts, refiOrigination, refiBaseCosts,
    totalAllIn, allInToArv, projectedNewLoan
  };
  const projection = projectHold(deal, baseMetrics);
  return { ...baseMetrics, irr5yr: projection.irrPct, projection };
};

