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

  return {
    totalInvested, monthlyPI, monthlyCosts, monthlyCashFlow, annualCashFlow,
    cashOnCash, capRate, seventyPercentRule, onePercentRule, score, grade,
    vacancyLoss, mgmtCost, effectiveIncome, totalROI,
    cashDown, totalRefiClosingCosts, refiOrigination, refiBaseCosts,
    totalAllIn, allInToArv, projectedNewLoan
  };
};

