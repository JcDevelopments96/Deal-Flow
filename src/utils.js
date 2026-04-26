/* ============================================================================
   UTILITIES — responsive helpers, number/currency formatting, deal metrics,
   and PDF export.
   ============================================================================ */

// Safe PDF library access (avoids crash if script not loaded)
export const getJsPDF = () => (typeof window !== "undefined" && window.jspdf && window.jspdf.jsPDF)
  || (typeof window !== "undefined" && window.jsPDF)
  || null;

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

/* ── PDF report ──────────────────────────────────────────────────────── */
export const generatePDFReport = async (deal, metrics /* , type = "investor" */) => {
  // Defensive normalizers — every formatter below tolerates null/undefined
  // metrics so a partially-filled deal never crashes the export. Also
  // strips characters jsPDF's WinAnsi default encoding can't render.
  const safe = (v) => (v == null ? "" : String(v).replace(/[^\x20-\x7E]/g, ""));
  const num  = (v) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const fmt$ = (v) => `$${num(v).toLocaleString()}`;
  const fmt$0 = (v) => `$${num(v).toFixed(0)}`;
  const fmtPct = (v, digits = 1) => `${num(v).toFixed(digits)}%`;

  try {
    const JsPDFCtor = getJsPDF();
    if (!JsPDFCtor) {
      return { success: false, error: "jsPDF library not loaded. Include jspdf via a <script> tag or npm install jspdf." };
    }
    if (!deal) {
      return { success: false, error: "No deal data — open a deal first, then export." };
    }
    const m = metrics || {};

    const pdf = new JsPDFCtor();
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;

    // Title — orange accent for a subtle warm note in an otherwise teal report
    pdf.setFontSize(24);
    pdf.setTextColor(234, 88, 12); // Orange-600
    pdf.text("Deal Docket Investment Report", margin, 30);

    // Thin orange rule under the title — a small, deliberate highlight
    pdf.setDrawColor(234, 88, 12);
    pdf.setLineWidth(0.8);
    pdf.line(margin, 33, margin + 60, 33);

    pdf.setFontSize(16);
    pdf.setTextColor(51, 51, 51);
    pdf.text(safe(deal.address) || "Property Address", margin, 48);
    pdf.text(`${safe(deal.city) || "City"}, ${safe(deal.state) || "State"}`, margin, 58);

    pdf.setDrawColor(226, 232, 240);
    pdf.rect(margin, 70, pageWidth - 2 * margin, 40);

    pdf.setFontSize(12);
    pdf.setTextColor(30, 41, 59);
    pdf.text(`Purchase Price: ${fmt$(deal.purchasePrice)}`, margin + 5, 85);
    pdf.text(`Rehab Budget: ${fmt$(deal.rehabBudget)}`,    margin + 5, 95);
    pdf.text(`ARV: ${fmt$(deal.arv)}`,                     pageWidth / 2, 85);
    pdf.text(`Monthly Rent: ${fmt$(deal.rentEstimate)}`,   pageWidth / 2, 95);

    pdf.setFontSize(14);
    pdf.setTextColor(13, 148, 136);
    pdf.text("Investment Metrics", margin, 130);

    pdf.setFontSize(11);
    pdf.setTextColor(30, 41, 59);
    let y = 145;

    const equityGained = num(deal.arv) - num(m.totalInvested);
    const score = (m.score == null) ? 0 : Math.round(num(m.score));
    const grade = safe(m.grade) || "—";

    const metricsToShow = [
      [`Cash Flow: ${fmt$0(m.monthlyCashFlow)}/month`, `Cap Rate: ${fmtPct(m.capRate)}`],
      [`Cash on Cash: ${fmtPct(m.cashOnCash)}`,        `1% Rule: ${m.onePercentRule ? "Yes" : "No"}`],
      [`Total Investment: ${fmt$(m.totalInvested)}`,    `Equity Gained: ${fmt$(equityGained)}`],
      [`Deal Score: ${score}/100 (${grade})`,           `ROI: ${fmtPct(m.totalROI)}`]
    ];

    metricsToShow.forEach(([left, right]) => {
      pdf.text(left, margin, y);
      pdf.text(right, pageWidth / 2, y);
      y += 12;
    });

    const slug = safe(deal.address || deal.title).replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const filename = `DealDocket-${slug || "Property"}-${Date.now()}.pdf`;
    pdf.save(filename);

    return { success: true, filename };
  } catch (error) {
    console.error("PDF generation error:", error, "deal:", deal, "metrics:", metrics);
    return { success: false, error: error?.message || "PDF export failed — try again, or check the browser console for details." };
  }
};
