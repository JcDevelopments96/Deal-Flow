import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Building2, Calculator, TrendingUp, MapPin, Search, Plus, Trash2,
  Home, Calendar, FileText, X, ChevronRight, AlertTriangle, CheckCircle2,
  Info, Save, Sparkles, Wrench, Key, DoorOpen, Flame, Flag, BarChart3,
  Edit3, Copy, Filter, ArrowRight, Shield, Zap, ExternalLink,
  RefreshCw, Star, Target, Clock, Upload, BookOpen, GraduationCap,
  DollarSign, TrendingDown, Percent, Download, FileDown,
  LineChart, Activity, Briefcase, Award, Globe, Phone,
  Mail, Eye, Settings,
  ChevronDown, ChevronUp, MoreHorizontal, Layout, Smartphone, Tablet,
  Wifi, WifiOff, Timer, Gauge, Layers, Hammer,
  PiggyBank, RotateCcw, Trophy, Users
} from "lucide-react";

// Map visualization — requires: npm install react-simple-maps
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

// Alias for semantic naming
const RepeatIcon = RotateCcw;

// Safe PDF library access (avoids crash if script not loaded)
const getJsPDF = () => (typeof window !== "undefined" && window.jspdf && window.jspdf.jsPDF)
  || (typeof window !== "undefined" && window.jsPDF)
  || null;

/* ============================================================================
   THEME + FONTS (WHITE PRIMARY · NAVY · TEAL · ORANGE accents)
   ============================================================================ */
const THEME = {
  bg: "#FFFFFF",          // Pure white canvas
  bgPanel: "#F8FAFC",     // Panel surfaces — slate-50
  bgInput: "#FFFFFF",     // Inputs match canvas
  bgRaised: "#EFF6FF",    // Hover / raised — blue-50 (harmonizes with navy)
  bgTeal: "#F0FDFA",      // Teal-50 — soft teal surface
  bgOrange: "#FFF7ED",    // Orange-50 — soft orange surface for highlights
  border: "#E2E8F0",      // Standard border (slate-200)
  borderLight: "#F1F5F9", // Subtle dividers
  text: "#0F172A",        // Primary text (slate-900)
  textMuted: "#475569",   // Secondary text (slate-600) — high-contrast for scanning
  textDim: "#94A3B8",     // Placeholders / tertiary (slate-400)
  accent: "#1E3A8A",      // Navy-900 — primary CTA & active states
  accentDim: "#1E40AF",   // Navy-800 — hover
  navy: "#1E3A8A",        // Navy explicit reference
  navyDim: "#1E40AF",     // Navy hover
  secondary: "#0D9488",   // Teal-600 — secondary emphasis
  secondaryDim: "#0F766E",// Teal-700 — hover
  teal: "#0D9488",        // Teal explicit reference
  tealDim: "#0F766E",     // Teal hover
  green: "#059669",       // Emerald-600 (positive cash flow)
  greenDim: "#D1FAE5",    // Emerald-100
  red: "#DC2626",         // Red-600 (negative / delete)
  redDim: "#FEE2E2",      // Red-100
  orange: "#EA580C",      // Orange-600 — tertiary highlight
  orangeDim: "#C2410C",   // Orange-700 — orange hover
  blue: "#2563EB",
  purple: "#7C3AED"
};

const STYLE_TAG = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;700&display=swap');
* { box-sizing: border-box; }
html, body { background: ${THEME.bg}; }
body { margin: 0; }
.brrrr-root {
  font-family: 'DM Sans', sans-serif;
  color: ${THEME.text};
  background: ${THEME.bg};
  min-height: 100vh;
  letter-spacing: -0.005em;
  font-size: 14px;
}
.serif { font-family: 'Fraunces', serif; letter-spacing: -0.025em; font-feature-settings: "ss01"; }
.mono { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
.label-xs {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: 0.18em;
  text-transform: uppercase; color: ${THEME.textMuted}; font-weight: 500;
}
.label-xs-accent {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: 0.18em;
  text-transform: uppercase; color: ${THEME.accent}; font-weight: 500;
}
input, select, textarea {
  font-family: inherit; background: ${THEME.bgInput}; color: ${THEME.text};
  border: 1px solid ${THEME.border}; outline: none; border-radius: 6px;
}
input::placeholder, textarea::placeholder { color: ${THEME.textDim}; }
input:focus, select:focus, textarea:focus {
  border-color: ${THEME.accent}; box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.15);
}
input[type="checkbox"] { accent-color: ${THEME.accent}; }
input[type="range"] { accent-color: ${THEME.accent}; }
button {
  font-family: inherit; border: none; outline: none; cursor: pointer;
  background: transparent; color: ${THEME.textMuted}; border-radius: 6px;
  transition: all 0.15s ease;
}
.btn-primary {
  background: ${THEME.accent}; color: #FFFFFF; font-weight: 600;
  padding: 8px 14px; font-size: 13px; display: inline-flex;
  align-items: center; gap: 6px; transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}
.btn-primary:hover { background: ${THEME.accentDim}; }
.btn-secondary {
  border: 1px solid ${THEME.border};
  color: ${THEME.text}; padding: 8px 14px; font-size: 13px;
  display: inline-flex; align-items: center; gap: 6px;
  background: ${THEME.bg};
}
.btn-secondary:hover {
  border-color: ${THEME.accent};
  color: ${THEME.accent};
  background: ${THEME.bgRaised};
}
.btn-accent-teal {
  background: ${THEME.secondary}; color: #FFFFFF; font-weight: 600;
  padding: 8px 14px; font-size: 13px; display: inline-flex;
  align-items: center; gap: 6px; transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}
.btn-accent-teal:hover { background: ${THEME.secondaryDim}; }
.btn-ghost { color: ${THEME.textMuted}; }
.btn-ghost:hover { color: ${THEME.accent}; background: ${THEME.bgRaised}; }
.btn-danger { color: ${THEME.red}; }
.btn-danger:hover { color: #B91C1C; background: ${THEME.redDim}; }
.btn-accent-orange {
  background: ${THEME.orange}; color: #FFFFFF; font-weight: 600;
  padding: 8px 14px; font-size: 13px; display: inline-flex;
  align-items: center; gap: 6px; transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}
.btn-accent-orange:hover { background: ${THEME.orangeDim}; }

/* ── CalcTooltip: hover-revealed formula explanations ─────────────────── */
.calc-tip { position: relative; display: inline-flex; align-items: center; }
.calc-tip__icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 14px; height: 14px; border-radius: 50%;
  color: ${THEME.textMuted}; cursor: help;
  transition: color 0.15s ease;
}
.calc-tip__icon:hover { color: ${THEME.accent}; }
.calc-tip__body {
  position: absolute; z-index: 1000; top: 100%; left: 50%;
  transform: translate(-50%, 6px);
  background: ${THEME.text}; color: #fff;
  padding: 10px 12px; border-radius: 6px;
  font-size: 11px; line-height: 1.5; font-weight: 400;
  width: max-content; max-width: 280px;
  opacity: 0; pointer-events: none;
  transition: opacity 0.15s ease;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.18);
  text-align: left;
}
.calc-tip__body::before {
  content: ""; position: absolute; top: -4px; left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 8px; height: 8px; background: ${THEME.text};
}
.calc-tip:hover .calc-tip__body,
.calc-tip:focus-within .calc-tip__body { opacity: 1; }
.calc-tip__title { font-weight: 700; color: ${THEME.orange}; margin-bottom: 4px; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; }
.calc-tip__formula { font-family: 'JetBrains Mono', monospace; color: #fbbf24; margin-top: 4px; font-size: 10.5px; }

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

/* ============================================================================
   DEAL TEMPLATES
   ============================================================================ */
const DEAL_TEMPLATES = {
  singleFamily: {
    name: "Single Family Home",
    icon: <Home size={16} />,
    description: "Standard 3-4BR suburban rental property",
    defaults: {
      propertyType: "Single Family",
      bedrooms: 3, bathrooms: 2, sqft: 1500,
      purchasePrice: 180000, rehabBudget: 35000,
      arv: 245000, rentEstimate: 1950, rehabMonths: 3,
      city: "Columbus", state: "OH", neighborhood: "Central",
      propertyTax: 3600, insurance: 1800, capex: 200,
      repairMaintenance: 195, vacancy: 8, mgmtFee: 10,
      notes: "Standard single family rental in good school district"
    }
  },
  duplex: {
    name: "Duplex / Multi-Family",
    icon: <Building2 size={16} />,
    description: "2-4 unit rental property",
    defaults: {
      propertyType: "Duplex", bedrooms: 6, bathrooms: 4, sqft: 2400,
      purchasePrice: 285000, rehabBudget: 45000,
      arv: 385000, rentEstimate: 3200, rehabMonths: 4,
      city: "Cleveland", state: "OH", neighborhood: "East Side",
      propertyTax: 4800, insurance: 2400, capex: 320,
      repairMaintenance: 280, vacancy: 6, mgmtFee: 8,
      notes: "Duplex with separate entrances and utilities"
    }
  },
  condo: {
    name: "Condo / Townhome",
    icon: <Building2 size={16} />,
    description: "Condo or townhome with HOA",
    defaults: {
      propertyType: "Condo", bedrooms: 2, bathrooms: 2, sqft: 1200,
      purchasePrice: 145000, rehabBudget: 25000,
      arv: 195000, rentEstimate: 1750, rehabMonths: 2,
      city: "Orlando", state: "FL", neighborhood: "Downtown",
      propertyTax: 2800, insurance: 1500, capex: 150,
      repairMaintenance: 140, vacancy: 7, mgmtFee: 10,
      hoa: 185, notes: "Modern condo with amenities, check HOA rental restrictions"
    }
  },
  luxury: {
    name: "Luxury Property",
    icon: <Award size={16} />,
    description: "High-end property for premium market",
    defaults: {
      propertyType: "Single Family", bedrooms: 4, bathrooms: 3, sqft: 2800,
      purchasePrice: 425000, rehabBudget: 75000,
      arv: 585000, rentEstimate: 3800, rehabMonths: 5,
      city: "Austin", state: "TX", neighborhood: "West Lake Hills",
      propertyTax: 8500, insurance: 3200, capex: 380,
      repairMaintenance: 350, vacancy: 10, mgmtFee: 8,
      notes: "Luxury finishes, pool, waterfront or golf course community"
    }
  },
  commercial: {
    name: "Small Commercial",
    icon: <Briefcase size={16} />,
    description: "Small retail or office space",
    defaults: {
      propertyType: "Commercial", bedrooms: 0, bathrooms: 2, sqft: 2500,
      purchasePrice: 350000, rehabBudget: 55000,
      arv: 485000, rentEstimate: 4200, rehabMonths: 4,
      city: "Phoenix", state: "AZ", neighborhood: "Downtown",
      propertyTax: 6500, insurance: 2800, capex: 420,
      repairMaintenance: 400, vacancy: 12, mgmtFee: 6,
      notes: "Ground floor retail or office, verify zoning and permits"
    }
  },
  fixerUpper: {
    name: "Heavy Rehab / Fixer",
    icon: <Wrench size={16} />,
    description: "Distressed property needing major work",
    defaults: {
      propertyType: "Single Family", bedrooms: 3, bathrooms: 2, sqft: 1350,
      purchasePrice: 95000, rehabBudget: 65000,
      arv: 215000, rentEstimate: 1850, rehabMonths: 6,
      city: "Detroit", state: "MI", neighborhood: "Central",
      propertyTax: 3200, insurance: 2200, capex: 185,
      repairMaintenance: 175, vacancy: 8, mgmtFee: 10,
      notes: "Major rehab required - structural, electrical, plumbing, HVAC"
    }
  }
};

/* ============================================================================
   MOBILE OPTIMIZATION
   ============================================================================ */
const isMobile = () => typeof window !== "undefined" && window.innerWidth <= 768;
const isTablet = () => typeof window !== "undefined" && window.innerWidth <= 1024 && window.innerWidth > 768;

const MobileOptimizedButton = ({ onClick, children, style = {}, disabled = false, variant = "primary" }) => {
  const baseStyle = {
    minHeight: 44,
    padding: isMobile() ? "12px 20px" : "8px 16px",
    fontSize: isMobile() ? 16 : 14,
    fontWeight: 600,
    border: "none",
    borderRadius: 6,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...style
  };

  const variantStyles = {
    primary: {
      background: disabled ? THEME.border : THEME.accent,
      color: disabled ? THEME.textMuted : THEME.bg
    },
    secondary: {
      background: disabled ? THEME.bgPanel : THEME.secondary,
      color: disabled ? THEME.textMuted : THEME.bg
    },
    outline: {
      background: "transparent",
      color: disabled ? THEME.textMuted : THEME.accent,
      border: `2px solid ${disabled ? THEME.border : THEME.accent}`
    }
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...baseStyle, ...variantStyles[variant] }}
      onTouchStart={() => {}}
    >
      {children}
    </button>
  );
};

/* ============================================================================
   CORE LOGIC
   ============================================================================ */
const n = (val) => Number(val) || 0;
const fmtUSD = (value, opts = {}) => {
  if (typeof value !== 'number') value = parseFloat(value) || 0;
  if (opts.short && value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (opts.short && value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

const calcMetrics = (deal) => {
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

/* ============================================================================
   PDF REPORT GENERATION
   ============================================================================ */
const generatePDFReport = async (deal, metrics, type = "investor") => {
  try {
    const JsPDFCtor = getJsPDF();
    if (!JsPDFCtor) {
      return { success: false, error: "jsPDF library not loaded. Include jspdf via a <script> tag or npm install jspdf." };
    }
    const pdf = new JsPDFCtor();
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;

    pdf.setFontSize(24);
    pdf.setTextColor(13, 148, 136);
    pdf.text("DealTrack Investment Report", margin, 30);

    pdf.setFontSize(16);
    pdf.setTextColor(51, 51, 51);
    pdf.text(`${deal.address || 'Property Address'}`, margin, 45);
    pdf.text(`${deal.city || 'City'}, ${deal.state || 'State'}`, margin, 55);

    pdf.setDrawColor(226, 232, 240);
    pdf.rect(margin, 70, pageWidth - 2 * margin, 40);

    pdf.setFontSize(12);
    pdf.setTextColor(30, 41, 59);
    pdf.text(`Purchase Price: $${(deal.purchasePrice || 0).toLocaleString()}`, margin + 5, 85);
    pdf.text(`Rehab Budget: $${(deal.rehabBudget || 0).toLocaleString()}`, margin + 5, 95);
    pdf.text(`ARV: $${(deal.arv || 0).toLocaleString()}`, pageWidth/2, 85);
    pdf.text(`Monthly Rent: $${(deal.rentEstimate || 0).toLocaleString()}`, pageWidth/2, 95);

    pdf.setFontSize(14);
    pdf.setTextColor(13, 148, 136);
    pdf.text("Investment Metrics", margin, 130);

    pdf.setFontSize(11);
    pdf.setTextColor(30, 41, 59);
    let y = 145;

    const metricsToShow = [
      [`Cash Flow: $${metrics.monthlyCashFlow?.toFixed(0) || '0'}/month`, `Cap Rate: ${metrics.capRate?.toFixed(1) || '0.0'}%`],
      [`Cash on Cash: ${metrics.cashOnCash?.toFixed(1) || '0.0'}%`, `1% Rule: ${metrics.onePercentRule ? 'Yes' : 'No'}`],
      [`Total Investment: $${metrics.totalInvested?.toLocaleString() || '0'}`, `Equity Gained: $${((deal.arv || 0) - metrics.totalInvested).toLocaleString()}`],
      [`Deal Score: ${metrics.score}/100 (${metrics.grade})`, `ROI: ${metrics.totalROI?.toFixed(1) || '0.0'}%`]
    ];

    metricsToShow.forEach(([left, right]) => {
      pdf.text(left, margin, y);
      pdf.text(right, pageWidth/2, y);
      y += 12;
    });

    const filename = `DealTrack-${deal.address?.replace(/[^a-zA-Z0-9]/g, '-') || 'Property'}-${Date.now()}.pdf`;
    pdf.save(filename);

    return { success: true, filename };
  } catch (error) {
    console.error('PDF generation error:', error);
    return { success: false, error: error.message };
  }
};

/* ============================================================================
   BASIC COMPONENTS
   ============================================================================ */
const TextField = ({ label, value, onChange, placeholder, helper }) => (
  <div style={{ marginBottom: 14 }}>
    <div className="label-xs" style={{ marginBottom: 6 }}>{label}</div>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: "100%", padding: "9px 10px", fontSize: 13 }}
    />
    {helper && <div style={{ fontSize: 11, color: THEME.textDim, marginTop: 4 }}>{helper}</div>}
  </div>
);

const NumberField = ({ label, value, onChange, placeholder, helper, prefix }) => (
  <div style={{ marginBottom: 14 }}>
    <div className="label-xs" style={{ marginBottom: 6 }}>{label}</div>
    <div style={{ position: "relative" }}>
      {prefix && (
        <span style={{
          position: "absolute",
          left: 10,
          top: "50%",
          transform: "translateY(-50%)",
          color: THEME.textMuted,
          fontSize: 13,
          zIndex: 1
        }}>
          {prefix}
        </span>
      )}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: prefix ? "9px 10px 9px 25px" : "9px 10px",
          fontSize: 13
        }}
      />
    </div>
    {helper && <div style={{ fontSize: 11, color: THEME.textDim, marginTop: 4 }}>{helper}</div>}
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 14 }}>
    <div className="label-xs" style={{ marginBottom: 6 }}>{label}</div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", padding: "9px 10px", fontSize: 13 }}
    >
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>
);

const StatRow = ({ label, value, valueColor, bold, mono = true, borderTop, sublabel, tooltip }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "9px 0",
    borderTop: borderTop ? `1px solid ${THEME.border}` : "none"
  }}>
    <div>
      <div style={{ fontSize: 12, color: THEME.textMuted, fontWeight: bold ? 600 : 400, display: "inline-flex", alignItems: "center" }}>
        {label}
        {tooltip && <CalcTooltip size={12} {...tooltip} />}
      </div>
      {sublabel && <div style={{ fontSize: 10, color: THEME.textDim, marginTop: 2 }}>{sublabel}</div>}
    </div>
    <div
      className={mono ? "mono" : ""}
      style={{
        fontSize: bold ? 15 : 13,
        color: valueColor || THEME.text,
        fontWeight: bold ? 700 : 500
      }}
    >
      {value}
    </div>
  </div>
);

const Panel = ({ title, icon, children, accent, action, style = {} }) => (
  <div style={{
    background: THEME.bgPanel,
    border: `1px solid ${THEME.border}`,
    borderRadius: 8,
    ...style
  }}>
    {title && (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px",
        borderBottom: `1px solid ${THEME.border}`,
        background: accent ? THEME.bgRaised : "transparent"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {icon}
          <span className="label-xs" style={{ color: accent ? THEME.accent : THEME.textMuted, fontSize: 11 }}>{title}</span>
        </div>
        {action}
      </div>
    )}
    <div style={{ padding: 18 }}>{children}</div>
  </div>
);

// CalcTooltip — hover an info icon to reveal the formula behind a calculated value
const CalcTooltip = ({ title, description, formula, size = 13, inline = true }) => (
  <span
    className="calc-tip"
    style={{ marginLeft: 6, verticalAlign: inline ? "middle" : "baseline" }}
    tabIndex={0}
    aria-label={title ? `How ${title} is calculated` : "Calculation details"}
  >
    <span className="calc-tip__icon">
      <Info size={size} />
    </span>
    <span className="calc-tip__body">
      {title && <div className="calc-tip__title">{title}</div>}
      {description && <div>{description}</div>}
      {formula && <div className="calc-tip__formula">{formula}</div>}
    </span>
  </span>
);

/* ============================================================================
   ACQUISITION ANALYSIS SECTION
   ============================================================================ */
const AcquisitionSection = ({ deal, onUpdate, metrics }) => {
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
              value={deal.listPrice || deal.purchasePrice * 1.1}
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

/* ============================================================================
   COMPREHENSIVE REHAB PLANNING SECTION
   ============================================================================ */
const RehabSection = ({ deal, onUpdate }) => {
  const [rehabDetails, setRehabDetails] = useState(deal.rehabDetails || {
    kitchen: { cost: 0, weeks: 0, priority: "high", contractor: "", notes: "" },
    bathrooms: { cost: 0, weeks: 0, priority: "high", contractor: "", notes: "" },
    flooring: { cost: 0, weeks: 0, priority: "high", contractor: "", notes: "" },
    paintInterior: { cost: 0, weeks: 0, priority: "medium", contractor: "", notes: "" },
    cabinets: { cost: 0, weeks: 0, priority: "medium", contractor: "", notes: "" },
    appliances: { cost: 0, weeks: 0, priority: "medium", contractor: "", notes: "" },
    lighting: { cost: 0, weeks: 0, priority: "low", contractor: "", notes: "" },
    electrical: { cost: 0, weeks: 0, priority: "high", contractor: "", notes: "" },
    plumbing: { cost: 0, weeks: 0, priority: "high", contractor: "", notes: "" },
    hvac: { cost: 0, weeks: 0, priority: "high", contractor: "", notes: "" },
    roofing: { cost: 0, weeks: 0, priority: "critical", contractor: "", notes: "" },
    windows: { cost: 0, weeks: 0, priority: "medium", contractor: "", notes: "" },
    siding: { cost: 0, weeks: 0, priority: "medium", contractor: "", notes: "" },
    landscaping: { cost: 0, weeks: 0, priority: "low", contractor: "", notes: "" },
    driveway: { cost: 0, weeks: 0, priority: "low", contractor: "", notes: "" },
    permits: { cost: 0, weeks: 0, priority: "critical", contractor: "", notes: "" },
    dumpster: { cost: 0, weeks: 0, priority: "high", contractor: "", notes: "" },
    contingency: { cost: 0, weeks: 0, priority: "critical", contractor: "", notes: "" }
  });

  const [rehabTimeline, setRehabTimeline] = useState(deal.rehabTimeline || {
    startDate: "",
    endDate: "",
    milestones: []
  });

  const rehabCategories = {
    interior: {
      name: "Interior Renovations",
      color: THEME.blue,
      items: ["kitchen", "bathrooms", "flooring", "paintInterior", "cabinets", "appliances", "lighting"]
    },
    systems: {
      name: "Major Systems",
      color: THEME.secondary,
      items: ["electrical", "plumbing", "hvac"]
    },
    structural: {
      name: "Structural & Exterior",
      color: THEME.green,
      items: ["roofing", "windows", "siding", "landscaping", "driveway"]
    },
    other: {
      name: "Permits & Contingency",
      color: THEME.purple,
      items: ["permits", "dumpster", "contingency"]
    }
  };

  const priorityColors = {
    critical: THEME.red,
    high: THEME.secondary,
    medium: THEME.accent,
    low: THEME.textMuted
  };

  const updateRehabDetail = (category, field, value) => {
    const updated = {
      ...rehabDetails,
      [category]: { ...rehabDetails[category], [field]: value }
    };
    setRehabDetails(updated);

    const totalCost = Object.values(updated).reduce((sum, item) => sum + (item.cost || 0), 0);
    const weekValues = Object.values(updated).map(item => item.weeks || 0);
    const totalWeeks = weekValues.length ? Math.max(...weekValues) : 0;

    onUpdate({
      rehabBudget: totalCost,
      rehabDetails: updated,
      rehabMonths: Math.ceil(totalWeeks / 4.33)
    });
  };

  const getTotalByCategory = (category) => {
    return rehabCategories[category].items.reduce((sum, item) => {
      return sum + (rehabDetails[item]?.cost || 0);
    }, 0);
  };

  const getOverallTotals = () => {
    const totalCost = Object.values(rehabDetails).reduce((sum, item) => sum + (item.cost || 0), 0);
    const weekValues = Object.values(rehabDetails).map(item => item.weeks || 0);
    const totalWeeks = weekValues.length ? Math.max(...weekValues) : 0;
    const criticalItems = Object.entries(rehabDetails).filter(([_, item]) => item.priority === "critical" && item.cost > 0).length;
    return { totalCost, totalWeeks, criticalItems };
  };

  const totals = getOverallTotals();

  return (
    <div>
      <Panel title="Comprehensive Rehab Planning" icon={<Hammer size={16} />} accent style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <div style={{ padding: 16, background: THEME.bgRaised, borderRadius: 6, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 4 }}>TOTAL BUDGET</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: THEME.accent }}>
              {fmtUSD(totals.totalCost)}
            </div>
          </div>
          <div style={{ padding: 16, background: THEME.bgRaised, borderRadius: 6, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 4 }}>TIMELINE</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: THEME.secondary }}>
              {Math.ceil(totals.totalWeeks / 4.33) || 0}mo
            </div>
          </div>
          <div style={{ padding: 16, background: THEME.bgRaised, borderRadius: 6, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 4 }}>CRITICAL ITEMS</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: THEME.red }}>
              {totals.criticalItems}
            </div>
          </div>
          <div style={{ padding: 16, background: THEME.bgRaised, borderRadius: 6, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 4 }}>$/SQ FT</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: THEME.text }}>
              {deal.sqft ? `$${(totals.totalCost / deal.sqft).toFixed(0)}` : "$0"}
            </div>
          </div>
        </div>

        {Object.entries(rehabCategories).map(([categoryKey, category]) => (
          <div key={categoryKey} style={{ marginBottom: 32 }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16
            }}>
              <h4 style={{
                fontSize: 16,
                color: category.color,
                fontWeight: 600,
                margin: 0
              }}>
                {category.name}
              </h4>
              <div style={{
                fontSize: 16,
                fontWeight: 700,
                color: category.color
              }}>
                {fmtUSD(getTotalByCategory(categoryKey))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              {category.items.map(itemKey => {
                const item = rehabDetails[itemKey];
                const itemName = itemKey.charAt(0).toUpperCase() + itemKey.slice(1).replace(/([A-Z])/g, ' $1');

                return (
                  <div key={itemKey} style={{
                    padding: 16,
                    border: `1px solid ${item.cost > 0 ? category.color + '40' : THEME.border}`,
                    borderRadius: 6,
                    background: item.cost > 0 ? category.color + '0D' : THEME.bgPanel
                  }}>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "2fr 1fr 1fr 1fr", gap: 12, alignItems: "end" }}>
                      <div>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 8
                        }}>
                          <div style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: priorityColors[item.priority]
                          }} />
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{itemName}</span>
                          <span style={{
                            fontSize: 10,
                            color: priorityColors[item.priority],
                            textTransform: "uppercase",
                            fontWeight: 600
                          }}>
                            {item.priority}
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder="Notes & specifications..."
                          value={item.notes}
                          onChange={(e) => updateRehabDetail(itemKey, 'notes', e.target.value)}
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            fontSize: 12,
                            border: `1px solid ${THEME.border}`,
                            borderRadius: 3
                          }}
                        />
                      </div>

                      <div>
                        <div className="label-xs" style={{ marginBottom: 6 }}>Cost</div>
                        <input
                          type="number"
                          placeholder="$0"
                          value={item.cost}
                          onChange={(e) => updateRehabDetail(itemKey, 'cost', parseInt(e.target.value) || 0)}
                          style={{
                            width: "100%",
                            padding: "8px",
                            fontSize: 13,
                            border: `1px solid ${THEME.border}`,
                            borderRadius: 3
                          }}
                        />
                      </div>

                      <div>
                        <div className="label-xs" style={{ marginBottom: 6 }}>Weeks</div>
                        <input
                          type="number"
                          placeholder="0"
                          value={item.weeks}
                          onChange={(e) => updateRehabDetail(itemKey, 'weeks', parseInt(e.target.value) || 0)}
                          style={{
                            width: "100%",
                            padding: "8px",
                            fontSize: 13,
                            border: `1px solid ${THEME.border}`,
                            borderRadius: 3
                          }}
                        />
                      </div>

                      <div>
                        <div className="label-xs" style={{ marginBottom: 6 }}>Contractor</div>
                        <input
                          type="text"
                          placeholder="TBD"
                          value={item.contractor}
                          onChange={(e) => updateRehabDetail(itemKey, 'contractor', e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px",
                            fontSize: 12,
                            border: `1px solid ${THEME.border}`,
                            borderRadius: 3
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 24 }}>
          <h4 style={{ fontSize: 14, marginBottom: 16, color: THEME.text }}>Quick Budget Templates</h4>
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(4, 1fr)", gap: 12 }}>
            {[
              { name: "Light Cosmetic", factor: 15, desc: "Paint, flooring, fixtures" },
              { name: "Medium Rehab", factor: 25, desc: "Kitchen, bath, systems" },
              { name: "Heavy Renovation", factor: 40, desc: "Full gut, structural" },
              { name: "Luxury Upgrade", factor: 60, desc: "High-end finishes" }
            ].map(template => (
              <button
                key={template.name}
                onClick={() => {
                  const sqft = deal.sqft || 1500;
                  const budgetByCategory = {
                    kitchen: template.factor >= 25 ? sqft * 8 : 0,
                    bathrooms: template.factor >= 15 ? sqft * 5 : 0,
                    flooring: template.factor >= 15 ? sqft * 6 : 0,
                    paintInterior: template.factor >= 15 ? sqft * 2 : 0,
                    electrical: template.factor >= 25 ? sqft * 3 : 0,
                    plumbing: template.factor >= 25 ? sqft * 4 : 0,
                    hvac: template.factor >= 40 ? sqft * 6 : 0,
                    contingency: (sqft * template.factor) * 0.1
                  };

                  const updatedDetails = { ...rehabDetails };
                  Object.entries(budgetByCategory).forEach(([key, cost]) => {
                    if (updatedDetails[key]) {
                      updatedDetails[key] = { ...updatedDetails[key], cost };
                    }
                  });

                  setRehabDetails(updatedDetails);
                  onUpdate({
                    rehabDetails: updatedDetails,
                    rehabBudget: Object.values(budgetByCategory).reduce((sum, cost) => sum + cost, 0)
                  });
                }}
                style={{
                  padding: 12,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 6,
                  background: THEME.bgPanel,
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{template.name}</div>
                <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 4 }}>{template.desc}</div>
                <div style={{ fontSize: 12, color: THEME.accent }}>
                  ~{fmtUSD((deal.sqft || 1500) * template.factor)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="Project Timeline & Management" icon={<Calendar size={16} />}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <div className="label-xs" style={{ marginBottom: 6 }}>Estimated Start Date</div>
            <input
              type="date"
              value={rehabTimeline.startDate}
              onChange={(e) => {
                const updated = { ...rehabTimeline, startDate: e.target.value };
                setRehabTimeline(updated);
                onUpdate({ rehabTimeline: updated });
              }}
              style={{
                width: "100%",
                padding: "9px 10px",
                fontSize: 13,
                border: `1px solid ${THEME.border}`,
                borderRadius: 4
              }}
            />
          </div>
          <div>
            <div className="label-xs" style={{ marginBottom: 6 }}>Target Completion</div>
            <input
              type="date"
              value={rehabTimeline.endDate}
              onChange={(e) => {
                const updated = { ...rehabTimeline, endDate: e.target.value };
                setRehabTimeline(updated);
                onUpdate({ rehabTimeline: updated });
              }}
              style={{
                width: "100%",
                padding: "9px 10px",
                fontSize: 13,
                border: `1px solid ${THEME.border}`,
                borderRadius: 4
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <StatRow
            label="Total Rehab Budget"
            value={fmtUSD(totals.totalCost)}
            valueColor={THEME.accent}
            bold
          />
          <StatRow
            label="Cost per Square Foot"
            value={deal.sqft ? `$${(totals.totalCost / deal.sqft).toFixed(0)}` : "$0"}
            valueColor={THEME.secondary}
          />
          <StatRow
            label="Estimated Timeline"
            value={`${Math.ceil(totals.totalWeeks / 4.33) || 0} months`}
            valueColor={THEME.text}
          />
          <StatRow
            label="Critical Priority Items"
            value={`${totals.criticalItems} items`}
            valueColor={totals.criticalItems > 0 ? THEME.red : THEME.green}
          />
          <StatRow
            label="Budget as % of Purchase"
            value={`${deal.purchasePrice > 0 ? ((totals.totalCost / deal.purchasePrice) * 100).toFixed(1) : 0}%`}
            valueColor={((totals.totalCost / (deal.purchasePrice || 1)) * 100) < 20 ? THEME.green : THEME.orange}
          />
        </div>
      </Panel>
    </div>
  );
};

/* ============================================================================
   REFINANCE STRATEGY SECTION
   ============================================================================ */
const RefinanceSection = ({ deal, onUpdate, metrics }) => {
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

/* ============================================================================
   EXIT STRATEGY COMPARISONS
   ============================================================================ */
const ExitStrategyComparisons = ({ deal, metrics }) => {
  const [timeHorizon, setTimeHorizon] = useState(5);
  const [appreciationRate, setAppreciationRate] = useState(4);

  const strategies = useMemo(() => {
    const currentARV = deal.arv || 0;
    const futureValue = currentARV * Math.pow(1 + appreciationRate / 100, timeHorizon);
    const totalCashFlow = (metrics.monthlyCashFlow || 0) * 12 * timeHorizon;
    const currentEquity = currentARV - (deal.loanAmount || 0);

    return {
      sellNow: {
        name: "Sell After Rehab",
        netProceeds: currentARV * 0.94 - (deal.loanAmount || 0),
        timeToExit: deal.rehabMonths || 3,
        pros: ["Quick capital recovery", "No landlord responsibilities", "Immediate profit realization"],
        cons: ["No ongoing cash flow", "Loss of appreciation potential", "Capital gains tax"]
      },
      holdShort: {
        name: "Hold & Sell (2-3 years)",
        netProceeds: futureValue * Math.pow(1.04, 2.5) * 0.94 - (deal.loanAmount || 0) + totalCashFlow * (2.5 / timeHorizon),
        timeToExit: 30,
        pros: ["Moderate appreciation capture", "Some rental income", "Potential tax benefits"],
        cons: ["Property management needed", "Market risk", "Selling costs still apply"]
      },
      holdLong: {
        name: "Hold Long-Term (5+ years)",
        netProceeds: futureValue * 0.94 - (deal.loanAmount || 0) + totalCashFlow,
        timeToExit: 60,
        pros: ["Maximum appreciation potential", "Steady cash flow", "Tax depreciation benefits"],
        cons: ["Longest capital tie-up", "Market volatility risk", "Ongoing management"]
      },
      brrrr: {
        name: "BRRRR & Repeat",
        netProceeds: (currentARV * 0.75 - (deal.loanAmount || 0)) + totalCashFlow,
        timeToExit: 6,
        pros: ["Capital recycling", "Portfolio scaling", "Ongoing cash flow", "Tax advantages"],
        cons: ["Most complex", "Refinance costs", "Interest rate risk"]
      }
    };
  }, [deal, metrics, timeHorizon, appreciationRate]);

  const bestStrategy = Object.entries(strategies).reduce((best, [key, strategy]) =>
    strategy.netProceeds > best.netProceeds ? { key, ...strategy } : best,
    { netProceeds: -Infinity }
  );

  return (
    <Panel title="Exit Strategy Analysis" icon={<Target size={16} />} accent>
      <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 20 }}>
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
                <div style={{ fontSize: 10, color: THEME.accent, fontWeight: 700 }}>BEST ROI</div>
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
          Based on your projections, <strong>{bestStrategy.name}</strong> offers the highest return
          of {fmtUSD(bestStrategy.netProceeds)}. Consider your risk tolerance and capital needs when deciding.
        </div>
      </div>
    </Panel>
  );
};

/* ============================================================================
   COST BREAKDOWN — full all-in project cost summary
   ============================================================================ */
const CostRow = ({ label, value, amount, tooltip, highlight = false, muted = false, borderTop = false, subtotal = false }) => (
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

const CostBreakdown = ({ deal, metrics, onUpdate }) => {
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

/* ============================================================================
   US COUNTY MAP — interactive, county-level
   ============================================================================ */
const STATE_FIPS_BY_CODE = {
  AL: "01", AK: "02", AZ: "04", AR: "05", CA: "06", CO: "08", CT: "09", DE: "10",
  DC: "11", FL: "12", GA: "13", HI: "15", ID: "16", IL: "17", IN: "18", IA: "19",
  KS: "20", KY: "21", LA: "22", ME: "23", MD: "24", MA: "25", MI: "26", MN: "27",
  MS: "28", MO: "29", MT: "30", NE: "31", NV: "32", NH: "33", NJ: "34", NM: "35",
  NY: "36", NC: "37", ND: "38", OH: "39", OK: "40", OR: "41", PA: "42", RI: "44",
  SC: "45", SD: "46", TN: "47", TX: "48", UT: "49", VT: "50", VA: "51", WA: "53",
  WV: "54", WI: "55", WY: "56"
};

const STATE_MAP_VIEW = {
  FL: { center: [-82, 28], zoom: 4 },
  NY: { center: [-75.5, 43], zoom: 3.5 },
  TX: { center: [-99, 31.5], zoom: 2.8 },
  OH: { center: [-82.5, 40.5], zoom: 5 },
  PA: { center: [-77.5, 41], zoom: 4.5 },
  GA: { center: [-83, 32.5], zoom: 4.5 },
  NC: { center: [-79.5, 35.5], zoom: 4 },
  SC: { center: [-81, 34], zoom: 5 },
  TN: { center: [-86, 36], zoom: 4 },
  MI: { center: [-85, 44.5], zoom: 3.5 },
  IN: { center: [-86, 40], zoom: 4.8 },
  IL: { center: [-89, 40], zoom: 3.5 },
  AZ: { center: [-112, 34], zoom: 3.5 },
  CO: { center: [-106, 39], zoom: 3.8 },
  NJ: { center: [-74.5, 40.3], zoom: 7 }
};

const COUNTIES_TOPOJSON = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";

const normalizeCountyName = (name) =>
  (name || "").toLowerCase().replace(/\s+county$/i, "").trim();

// Return a red→yellow→green heatmap fill based on normalized score (0..1).
// Low score = vibrant red, mid = true yellow, high = vibrant green.
const scoreToHeatFill = (t) => {
  const clamped = Math.max(0, Math.min(1, t));
  // Three color stops (Tailwind-style vibrant palette):
  //   0.0 = red-500    (239, 68, 68)
  //   0.5 = yellow-400 (250, 204, 21)
  //   1.0 = green-500  (34, 197, 94)
  let r, g, b;
  if (clamped < 0.5) {
    const k = clamped / 0.5; // 0..1 within red→yellow band
    r = Math.round(239 + (250 - 239) * k);
    g = Math.round(68 + (204 - 68) * k);
    b = Math.round(68 + (21 - 68) * k);
  } else {
    const k = (clamped - 0.5) / 0.5; // 0..1 within yellow→green band
    r = Math.round(250 + (34 - 250) * k);
    g = Math.round(204 + (197 - 204) * k);
    b = Math.round(21 + (94 - 21) * k);
  }
  return `rgba(${r}, ${g}, ${b}, 0.90)`;
};

const scoreToHeatStroke = (t) => {
  const clamped = Math.max(0, Math.min(1, t));
  if (clamped < 0.33) return "#B91C1C"; // red-700
  if (clamped < 0.67) return "#A16207"; // yellow-700
  return "#15803D"; // green-700
};

// BRRRR scores typically land in the 50–100 range. Using a fixed scale (rather
// than min/max of the dataset) means the colors carry absolute meaning: a score
// of 65 always looks the same shade whether the dataset ranges 60–90 or 50–100.
const HEAT_SCALE_MIN = 55;
const HEAT_SCALE_MAX = 95;
const scoreToT = (score) => {
  const range = HEAT_SCALE_MAX - HEAT_SCALE_MIN;
  return Math.max(0, Math.min(1, (score - HEAT_SCALE_MIN) / range));
};

const USCountyMap = ({ allMarkets, selectedState, highlightedMarket, onCountyClick }) => {
  // Score range across the dataset — drives the gradient scale
  const { minScore, maxScore } = useMemo(() => {
    const scores = allMarkets
      .map(m => (typeof m.brrrrScore === "number" ? m.brrrrScore : m.score))
      .filter(s => typeof s === "number");
    if (scores.length === 0) return { minScore: 0, maxScore: 100 };
    return {
      minScore: Math.min(...scores),
      maxScore: Math.max(...scores)
    };
  }, [allMarkets]);

  // Build lookup: stateFips -> Map(normalizedCountyName -> market)
  const marketLookup = useMemo(() => {
    const lookup = new Map();
    allMarkets.forEach(m => {
      const sf = STATE_FIPS_BY_CODE[m.state];
      if (!sf) return;
      if (!lookup.has(sf)) lookup.set(sf, new Map());
      lookup.get(sf).set(normalizeCountyName(m.county), m);
    });
    return lookup;
  }, [allMarkets]);

  const view = (selectedState && STATE_MAP_VIEW[selectedState])
    ? STATE_MAP_VIEW[selectedState]
    : { center: [-96, 38], zoom: 1 };

  const highlightedFips = highlightedMarket ? STATE_FIPS_BY_CODE[highlightedMarket.state] : null;
  const highlightedCounty = highlightedMarket ? normalizeCountyName(highlightedMarket.county) : null;
  const selectedFips = selectedState ? STATE_FIPS_BY_CODE[selectedState] : null;

  const getScore = (m) => (typeof m.brrrrScore === "number" ? m.brrrrScore : m.score) || 0;

  return (
    <div>
      <div style={{
        background: THEME.bgInput,
        border: `1px solid ${THEME.border}`,
        borderRadius: 6,
        padding: 12,
        overflow: "hidden"
      }}>
        <ComposableMap
          projection="geoAlbersUsa"
          style={{ width: "100%", height: "auto", maxHeight: 480, display: "block" }}
        >
          <ZoomableGroup
            center={view.center}
            zoom={view.zoom}
            minZoom={1}
            maxZoom={12}
          >
            <Geographies geography={COUNTIES_TOPOJSON}>
              {({ geographies }) => {
                if (!geographies || geographies.length === 0) return null;
                return geographies.map(geo => {
                  const fips = String(geo.id || "");
                  const stateFips = fips.slice(0, 2);
                  const countyNorm = normalizeCountyName(geo.properties.name);

                  const stateMarkets = marketLookup.get(stateFips);
                  const market = stateMarkets ? stateMarkets.get(countyNorm) : null;
                  const isMarket = !!market;
                  const isHighlighted = highlightedFips === stateFips && highlightedCounty === countyNorm;
                  const isInSelectedState = selectedFips === stateFips;

                  let fill = THEME.bgPanel;
                  let stroke = THEME.border;
                  let strokeWidth = 0.3;

                  if (isInSelectedState) {
                    fill = THEME.bgRaised;
                    stroke = THEME.border;
                  }
                  if (isMarket) {
                    const score = getScore(market);
                    const t = scoreToT(score);
                    fill = scoreToHeatFill(t);
                    stroke = scoreToHeatStroke(t);
                    strokeWidth = 0.5;
                  }
                  if (isHighlighted) {
                    fill = THEME.accent;
                    stroke = THEME.accentDim;
                    strokeWidth = 1.4;
                  }

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      style={{
                        default: { outline: "none", transition: "fill 0.2s" },
                        hover: {
                          fill: isMarket ? THEME.accent : (isInSelectedState ? THEME.border : THEME.bgRaised),
                          outline: "none",
                          cursor: isMarket ? "pointer" : "default"
                        },
                        pressed: { outline: "none" }
                      }}
                      onClick={() => {
                        if (market && onCountyClick) onCountyClick(market);
                      }}
                    />
                  );
                });
              }}
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Gradient legend */}
      <div style={{
        marginTop: 14,
        padding: "10px 14px",
        background: THEME.bgPanel,
        border: `1px solid ${THEME.border}`,
        borderRadius: 6
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6
        }}>
          <span className="label-xs">Deal Score Heatmap</span>
          <span style={{ fontSize: 10, color: THEME.textDim }}>
            {allMarkets.length} markets &bull; your range {minScore}-{maxScore}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="mono" style={{ fontSize: 11, color: "#B91C1C", minWidth: 28, fontWeight: 700 }}>
            {HEAT_SCALE_MIN}
          </span>
          <div style={{
            flex: 1,
            height: 12,
            borderRadius: 2,
            border: `1px solid ${THEME.border}`,
            background: `linear-gradient(90deg, ${scoreToHeatFill(0)} 0%, ${scoreToHeatFill(0.25)} 25%, ${scoreToHeatFill(0.5)} 50%, ${scoreToHeatFill(0.75)} 75%, ${scoreToHeatFill(1)} 100%)`
          }} />
          <span className="mono" style={{ fontSize: 11, color: "#15803D", minWidth: 28, textAlign: "right", fontWeight: 700 }}>
            {HEAT_SCALE_MAX}
          </span>
        </div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
          fontSize: 10,
          color: THEME.textDim,
          paddingLeft: 38,
          paddingRight: 38
        }}>
          <span>Weak</span>
          <span>Average</span>
          <span>Strong</span>
        </div>
      </div>

      {/* Legend + info readout */}
      <div style={{
        display: "flex",
        gap: 18,
        marginTop: 10,
        fontSize: 11,
        color: THEME.textMuted,
        flexWrap: "wrap",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 14, height: 14, borderRadius: 2,
            background: scoreToHeatFill(0.5),
            border: `1px solid ${scoreToHeatStroke(0.5)}`
          }} />
          <span>Tracked Market</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 14, height: 14, borderRadius: 2,
            background: THEME.accent
          }} />
          <span>Selected</span>
        </div>
        {highlightedMarket && (
          <div style={{ color: THEME.accent, fontWeight: 600 }}>
            {highlightedMarket.city}, {highlightedMarket.state} &mdash; {highlightedMarket.county}
            &nbsp;&bull;&nbsp;
            Score {getScore(highlightedMarket)}
          </div>
        )}
        <div style={{ color: THEME.textDim, marginLeft: "auto", fontSize: 10 }}>
          Click a market &bull; Scroll to zoom &bull; Drag to pan
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   ADVANCED MARKET INTEL WITH LOCATION PREFERENCES
   ============================================================================ */
/* ============================================================================
   LIVE LISTINGS & COMPARABLES — RentCast integration + demo fallback
   Docs: https://developers.rentcast.io
   Signup (free tier 50 req/mo): https://app.rentcast.io/app/api
   ============================================================================ */
const RENTCAST_STORAGE_KEY = "dealtrack-rentcast-key";

const buildDemoListings = (state, city, marketRef) => {
  if (!marketRef) return [];
  const base = marketRef.medianPrice || 275000;
  const streets = ["Oak Ave", "Maple St", "Sunset Blvd", "Palm Dr", "Magnolia Ln", "Pine Ct", "Harbor Rd", "Laurel Way"];
  return Array.from({ length: 6 }).map((_, i) => {
    const variation = 0.78 + (i * 0.08);
    const price = Math.round(base * variation / 1000) * 1000;
    const sqft = 1000 + i * 220;
    return {
      id: `demo-${state}-${city}-${i}`,
      formattedAddress: `${1200 + i * 37} ${streets[i % streets.length]}, ${city}, ${state}`,
      addressLine1: `${1200 + i * 37} ${streets[i % streets.length]}`,
      city,
      state,
      price,
      bedrooms: 2 + (i % 3),
      bathrooms: 1.5 + (i % 3) * 0.5,
      squareFootage: sqft,
      propertyType: i % 4 === 3 ? "Multi-Family" : "Single Family",
      yearBuilt: 1960 + ((i * 7) % 55),
      listedDate: new Date(Date.now() - i * 86400000 * 9).toISOString(),
      pricePerSqft: Math.round(price / sqft),
      daysOnMarket: 7 + i * 9,
      status: "Active",
      demo: true
    };
  });
};

const buildDemoComps = (state, city, marketRef) => {
  if (!marketRef) return [];
  const baseRent = marketRef.medianRent || 1800;
  const streets = ["Cypress Rd", "Mariner Way", "Lakeshore Dr", "Coral Ave", "Orchid Ln", "Heron Ct"];
  return Array.from({ length: 6 }).map((_, i) => {
    const variation = 0.85 + (i * 0.06);
    const rent = Math.round(baseRent * variation / 25) * 25;
    const sqft = 950 + i * 180;
    return {
      id: `demo-rent-${state}-${city}-${i}`,
      formattedAddress: `${800 + i * 44} ${streets[i % streets.length]}, ${city}, ${state}`,
      addressLine1: `${800 + i * 44} ${streets[i % streets.length]}`,
      city,
      state,
      price: rent,
      bedrooms: 2 + (i % 3),
      bathrooms: 1 + (i % 2) * 0.5 + 1,
      squareFootage: sqft,
      propertyType: i % 3 === 2 ? "Condo" : "Single Family",
      listedDate: new Date(Date.now() - i * 86400000 * 6).toISOString(),
      pricePerSqft: +(rent / sqft).toFixed(2),
      daysOnMarket: 5 + i * 7,
      status: "Active",
      demo: true
    };
  });
};

const formatRentCastListing = (raw) => ({
  id: raw.id || `${raw.addressLine1}-${raw.zipCode}`,
  formattedAddress: raw.formattedAddress || `${raw.addressLine1 || ""}, ${raw.city || ""}, ${raw.state || ""}`,
  addressLine1: raw.addressLine1,
  city: raw.city,
  state: raw.state,
  price: raw.price,
  bedrooms: raw.bedrooms,
  bathrooms: raw.bathrooms,
  squareFootage: raw.squareFootage,
  propertyType: raw.propertyType,
  yearBuilt: raw.yearBuilt,
  listedDate: raw.listedDate,
  pricePerSqft: raw.price && raw.squareFootage ? Math.round(raw.price / raw.squareFootage) : null,
  daysOnMarket: raw.daysOnMarket,
  status: raw.status || "Active",
  latitude: raw.latitude,
  longitude: raw.longitude
});

const ListingCard = ({ listing, type = "sale", onUseInDeal }) => {
  const isRental = type === "rental";
  return (
    <div style={{
      padding: 14,
      border: `1px solid ${THEME.border}`,
      borderRadius: 8,
      background: THEME.bg,
      position: "relative"
    }}>
      {listing.demo && (
        <div style={{
          position: "absolute", top: 8, right: 8,
          padding: "2px 7px", fontSize: 9, fontWeight: 700,
          background: THEME.bgOrange, color: THEME.orange,
          borderRadius: 4, letterSpacing: "0.06em", textTransform: "uppercase"
        }}>
          Demo
        </div>
      )}
      <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text, marginBottom: 4, paddingRight: 48 }}>
        {listing.formattedAddress}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: isRental ? THEME.teal : THEME.accent }}>
          {fmtUSD(listing.price)}{isRental ? <span style={{ fontSize: 11, fontWeight: 500, color: THEME.textMuted }}> /mo</span> : null}
        </div>
        {listing.pricePerSqft && (
          <div style={{ fontSize: 11, color: THEME.textMuted }}>
            {isRental ? `$${listing.pricePerSqft}/sqft` : `${fmtUSD(listing.pricePerSqft)}/sqft`}
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, fontSize: 11, marginBottom: 10 }}>
        <div>
          <div style={{ color: THEME.textDim }}>BEDS</div>
          <div style={{ fontWeight: 600 }}>{listing.bedrooms || "—"}</div>
        </div>
        <div>
          <div style={{ color: THEME.textDim }}>BATHS</div>
          <div style={{ fontWeight: 600 }}>{listing.bathrooms || "—"}</div>
        </div>
        <div>
          <div style={{ color: THEME.textDim }}>SQFT</div>
          <div style={{ fontWeight: 600 }}>{listing.squareFootage ? listing.squareFootage.toLocaleString() : "—"}</div>
        </div>
        <div>
          <div style={{ color: THEME.textDim }}>DOM</div>
          <div style={{ fontWeight: 600 }}>{listing.daysOnMarket ?? "—"}</div>
        </div>
      </div>
      <div style={{
        fontSize: 10, color: THEME.textMuted,
        paddingTop: 8, borderTop: `1px solid ${THEME.borderLight}`,
        display: "flex", justifyContent: "space-between"
      }}>
        <span>{listing.propertyType || "—"}</span>
        {listing.yearBuilt && <span>Built {listing.yearBuilt}</span>}
      </div>
      {onUseInDeal && !isRental && (
        <button
          onClick={() => onUseInDeal(listing)}
          className="btn-secondary"
          style={{ width: "100%", marginTop: 10, padding: "6px 10px", fontSize: 11 }}
        >
          <Plus size={12} /> Use in Deal Analyzer
        </button>
      )}
    </div>
  );
};

const LiveListingsPanel = ({ selectedState, selectedCity, stateName, stateMarkets }) => {
  const [apiKey, setApiKey] = useState(() => {
    try {
      return (typeof window !== "undefined" && window.localStorage.getItem(RENTCAST_STORAGE_KEY)) || "";
    } catch { return ""; }
  });
  const [keyDraft, setKeyDraft] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [listings, setListings] = useState([]);
  const [rentComps, setRentComps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [liveMode, setLiveMode] = useState(false);

  // Primary reference market for demo defaults
  const referenceMarket = useMemo(() => {
    if (!selectedState) return null;
    if (selectedCity) {
      const match = (stateMarkets || []).find(m => m.city.toLowerCase() === selectedCity.toLowerCase());
      if (match) return match;
    }
    return (stateMarkets && stateMarkets[0]) || null;
  }, [selectedState, selectedCity, stateMarkets]);

  const targetCity = selectedCity || (referenceMarket && referenceMarket.city);

  const loadData = useCallback(async () => {
    if (!selectedState || !targetCity) return;

    if (!apiKey) {
      setListings(buildDemoListings(selectedState, targetCity, referenceMarket));
      setRentComps(buildDemoComps(selectedState, targetCity, referenceMarket));
      setLiveMode(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        city: targetCity,
        state: selectedState,
        limit: "10"
      });
      const [saleRes, rentRes] = await Promise.all([
        fetch(`https://api.rentcast.io/v1/listings/sale?${params.toString()}`, {
          headers: { "X-Api-Key": apiKey, "accept": "application/json" }
        }),
        fetch(`https://api.rentcast.io/v1/listings/rental/long-term?${params.toString()}`, {
          headers: { "X-Api-Key": apiKey, "accept": "application/json" }
        })
      ]);

      if (!saleRes.ok) throw new Error(`Listings request failed (${saleRes.status}). Check your API key.`);
      const saleJson = await saleRes.json();
      const rentJson = rentRes.ok ? await rentRes.json() : [];

      const saleList = Array.isArray(saleJson) ? saleJson : (saleJson.listings || []);
      const rentList = Array.isArray(rentJson) ? rentJson : (rentJson.listings || []);

      if (saleList.length === 0 && rentList.length === 0) {
        setListings(buildDemoListings(selectedState, targetCity, referenceMarket));
        setRentComps(buildDemoComps(selectedState, targetCity, referenceMarket));
        setLiveMode(false);
        setError("No live results for this area — showing demo data.");
      } else {
        setListings(saleList.map(formatRentCastListing));
        setRentComps(rentList.map(formatRentCastListing));
        setLiveMode(true);
      }
    } catch (err) {
      console.warn("RentCast fetch failed:", err);
      setListings(buildDemoListings(selectedState, targetCity, referenceMarket));
      setRentComps(buildDemoComps(selectedState, targetCity, referenceMarket));
      setLiveMode(false);
      setError(err.message || "Live data unavailable — showing demo data.");
    } finally {
      setLoading(false);
    }
  }, [apiKey, selectedState, targetCity, referenceMarket]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveKey = (val) => {
    const trimmed = (val || "").trim();
    setApiKey(trimmed);
    try {
      if (trimmed) window.localStorage.setItem(RENTCAST_STORAGE_KEY, trimmed);
      else window.localStorage.removeItem(RENTCAST_STORAGE_KEY);
    } catch {}
    setShowKeyInput(false);
    setKeyDraft("");
  };

  if (!selectedState) return null;

  return (
    <Panel
      title="Live Listings & Comparables"
      icon={<Home size={16} />}
      accent
      style={{ marginBottom: 24 }}
      action={
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{
            padding: "3px 9px",
            fontSize: 10, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
            borderRadius: 4,
            background: liveMode ? THEME.greenDim : THEME.bgOrange,
            color: liveMode ? THEME.green : THEME.orange
          }}>
            {liveMode ? "Live" : "Demo"}
          </span>
          <button
            onClick={() => setShowKeyInput(s => !s)}
            className="btn-ghost"
            style={{ padding: "4px 10px", fontSize: 11 }}
          >
            <Settings size={12} /> {apiKey ? "API Key" : "Connect"}
          </button>
          <button
            onClick={loadData}
            className="btn-ghost"
            style={{ padding: "4px 10px", fontSize: 11 }}
            disabled={loading}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      }
    >
      <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
        Properties currently for sale and recent rental comparables in <strong>{targetCity}, {selectedState}</strong>
        {stateName && ` (${stateName})`}. Click the "Use in Deal Analyzer" button to pre-populate a new deal.
      </div>

      {showKeyInput && (
        <div style={{
          padding: 14, marginBottom: 16,
          background: THEME.bgRaised, borderRadius: 6, border: `1px solid ${THEME.border}`
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: THEME.text }}>
            RentCast API Key
          </div>
          <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 10, lineHeight: 1.5 }}>
            Paste your RentCast API key to pull live MLS data. Free tier = 50 requests/month.{" "}
            <a href="https://app.rentcast.io/app/api" target="_blank" rel="noopener noreferrer" style={{ color: THEME.accent }}>
              Get a key →
            </a>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="password"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder={apiKey ? "••••••••••••••" : "Paste API key"}
              style={{ flex: 1, padding: "8px 10px", fontSize: 12 }}
            />
            <button onClick={() => saveKey(keyDraft)} className="btn-primary" style={{ padding: "6px 12px", fontSize: 12 }}>
              Save
            </button>
            {apiKey && (
              <button onClick={() => saveKey("")} className="btn-danger" style={{ padding: "6px 12px", fontSize: 12 }}>
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          padding: "8px 12px", marginBottom: 14, fontSize: 12,
          background: THEME.bgOrange, color: THEME.orange,
          borderRadius: 6, border: `1px solid ${THEME.orange}`
        }}>
          <AlertTriangle size={12} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: 30, color: THEME.textMuted, fontSize: 13 }}>
          <RefreshCw size={16} className="mono" style={{ animation: "spin 1s linear infinite" }} /> Loading live data…
        </div>
      )}

      {!loading && (
        <>
          <div style={{
            fontSize: 12, fontWeight: 700, color: THEME.accent,
            textTransform: "uppercase", letterSpacing: "0.1em",
            marginBottom: 10, display: "flex", alignItems: "center", gap: 8
          }}>
            <Building2 size={13} />
            Properties For Sale ({listings.length})
          </div>
          {listings.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: THEME.textMuted, fontSize: 12 }}>
              No active listings found for this area.
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile() ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 10, marginBottom: 24
            }}>
              {listings.map(l => <ListingCard key={l.id} listing={l} type="sale" />)}
            </div>
          )}

          <div style={{
            fontSize: 12, fontWeight: 700, color: THEME.teal,
            textTransform: "uppercase", letterSpacing: "0.1em",
            marginBottom: 10, display: "flex", alignItems: "center", gap: 8
          }}>
            <Home size={13} />
            Rental Comparables ({rentComps.length})
          </div>
          {rentComps.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: THEME.textMuted, fontSize: 12 }}>
              No rental comparables found for this area.
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile() ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 10
            }}>
              {rentComps.map(l => <ListingCard key={l.id} listing={l} type="rental" />)}
            </div>
          )}
        </>
      )}
    </Panel>
  );
};

const AdvancedMarketIntel = () => {
  const [selectedMetric, setSelectedMetric] = useState("capRate");
  const [investmentGoal, setInvestmentGoal] = useState("cashFlow");
  const [selectedState, setSelectedState] = useState("");
  const [showStateResults, setShowStateResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const marketData = {
    northeast: {
      name: "Northeast",
      markets: [
        {
          city: "Buffalo", state: "NY", county: "Erie County",
          description: "Rust Belt city experiencing revitalization with strong university presence (UB) and growing tech sector. Affordable housing market with high rental demand.",
          medianPrice: 165000, medianRent: 1200, capRate: 9.8, rentGrowth: 10, inventory: 4.2, score: 85,
          brrrrScore: 78,
          brrrrFactors: { buy: 85, rehab: 75, rent: 80, refinance: 70, repeat: 80 },
          airbnb: {
            nightly: { min: 75, max: 120, avg: 95 },
            occupancy: { min: 55, max: 75, avg: 65 },
            monthlyRevenue: { min: 1500, max: 2300, avg: 1900 },
            competition: "Medium",
            adr: "$75-120",
            occupancyRange: "55-75%"
          },
          restrictions: {
            str: "Allowed", minStay: "2 nights", license: "Required",
            notes: "Registration required, safety inspections",
            details: "Host permit required through city. Annual license fee $150. Property inspection mandatory. Owner-occupied properties preferred."
          },
          dueDiligence: {
            keyFactors: [
              "Check neighborhood crime rates - varies significantly by area",
              "Verify property taxes - can be high in certain districts",
              "Snow load requirements for roof structures",
              "Lead paint disclosure for pre-1978 properties"
            ],
            marketRisks: ["Population decline in some areas", "Harsh winter weather impacts", "Property tax increases"],
            opportunities: ["University rental demand", "Downtown revitalization projects", "Proximity to Canada border"]
          },
          distressedProperties: {
            sources: [
              "Erie County Clerk's Office - foreclosure listings",
              "Buffalo Housing Court - code violation properties",
              "BiggerPockets Buffalo forums",
              "Local real estate agents specializing in distressed sales",
              "BUDC (Buffalo Urban Development Corporation) properties"
            ],
            bestAreas: ["Elmwood Village", "Allentown", "North Buffalo"],
            avoidAreas: ["East Buffalo", "Certain parts of West Side"]
          }
        },
        {
          city: "Rochester", state: "NY", county: "Monroe County",
          description: "Former industrial city transforming into tech hub with strong medical sector (University of Rochester). Affordable properties with solid rental demand.",
          medianPrice: 145000, medianRent: 1100, capRate: 10.1, rentGrowth: 11, inventory: 3.8, score: 88,
          brrrrScore: 82,
          brrrrFactors: { buy: 90, rehab: 80, rent: 85, refinance: 75, repeat: 75 },
          airbnb: {
            nightly: { min: 65, max: 105, avg: 85 },
            occupancy: { min: 52, max: 72, avg: 62 },
            monthlyRevenue: { min: 1200, max: 2100, avg: 1650 },
            competition: "Low",
            adr: "$65-105",
            occupancyRange: "52-72%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Host permit required",
            details: "Simple registration process. $75 annual fee. Basic safety requirements. No caps on number of units."
          },
          dueDiligence: {
            keyFactors: [
              "Research neighborhood school districts",
              "Check for environmental issues near Kodak sites",
              "Verify heating systems for harsh winters",
              "Review flood zone maps near Genesee River"
            ],
            marketRisks: ["Economic dependence on major employers", "Seasonal tourism fluctuations", "Aging infrastructure"],
            opportunities: ["University of Rochester expansion", "Medical corridor growth", "Tech company relocations"]
          },
          distressedProperties: {
            sources: [
              "Monroe County foreclosure auctions",
              "Rochester City Hall - tax lien properties",
              "RHDC (Rochester Housing Development Corp)",
              "Local wholesalers network",
              "MLS distressed property filters"
            ],
            bestAreas: ["Park Avenue", "Monroe Village", "Corn Hill"],
            avoidAreas: ["Parts of northeast Rochester"]
          }
        },
        {
          city: "Syracuse", state: "NY", county: "Onondaga County",
          description: "College town with Syracuse University driving rental demand. Affordable market with strong cash flow potential and growing downtown area.",
          medianPrice: 135000, medianRent: 1050, capRate: 10.5, rentGrowth: 12, inventory: 4.5, score: 90,
          brrrrScore: 85,
          brrrrFactors: { buy: 95, rehab: 85, rent: 90, refinance: 75, repeat: 80 },
          airbnb: {
            nightly: { min: 60, max: 100, avg: 80 },
            occupancy: { min: 48, max: 68, avg: 58 },
            monthlyRevenue: { min: 1100, max: 1800, avg: 1450 },
            competition: "Low",
            adr: "$60-100",
            occupancyRange: "48-68%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Optional",
            notes: "Minimal restrictions",
            details: "Very permissive regulations. No licensing required. Basic safety standards apply. Popular for Syracuse University events."
          },
          dueDiligence: {
            keyFactors: [
              "Proximity to Syracuse University for rental demand",
              "Snow removal requirements and costs",
              "Student housing regulations if targeting students",
              "Seasonal demand fluctuations"
            ],
            marketRisks: ["Heavy snow and weather damage", "Student-dependent areas can be volatile", "Limited job diversity beyond university"],
            opportunities: ["University growth and expansion", "Strong alumni network for STR demand", "Downtown revitalization projects"]
          },
          distressedProperties: {
            sources: [
              "Onondaga County tax sale lists",
              "Syracuse city code violation database",
              "University area landlord networks",
              "Local real estate investment groups",
              "Probate court listings"
            ],
            bestAreas: ["University Hill", "Downtown", "Westcott"],
            avoidAreas: ["South Side industrial areas"]
          }
        },
        {
          city: "Philadelphia", state: "PA", county: "Philadelphia County",
          description: "Major East Coast city with strong job market, universities, and tourism. Diverse neighborhoods with varying investment potential.",
          medianPrice: 195000, medianRent: 1450, capRate: 8.9, rentGrowth: 9, inventory: 3.2, score: 78,
          brrrrScore: 70,
          brrrrFactors: { buy: 75, rehab: 70, rent: 80, refinance: 65, repeat: 65 },
          airbnb: {
            nightly: { min: 100, max: 150, avg: 125 },
            occupancy: { min: 62, max: 82, avg: 72 },
            monthlyRevenue: { min: 2200, max: 3400, avg: 2800 },
            competition: "High",
            adr: "$100-150",
            occupancyRange: "62-82%"
          },
          restrictions: {
            str: "Restricted", minStay: "30 days", license: "Required",
            notes: "Primary residence only",
            details: "Highly regulated. Must be owner-occupied primary residence. 30-day minimum stay. $300 license fee."
          },
          dueDiligence: {
            keyFactors: ["Research zoning laws - very strict", "Check property tax assessment accuracy", "Verify rental licensing requirements", "Review neighborhood crime statistics"],
            marketRisks: ["Complex regulatory environment", "High property taxes", "Competitive rental market"],
            opportunities: ["Strong tourism and business travel", "Multiple universities nearby", "Growing tech sector"]
          },
          distressedProperties: {
            sources: ["Philadelphia Sheriff's Office - foreclosure sales", "Philadelphia Land Bank properties", "Local real estate investment meetups", "MLS distressed listings", "Probate and estate sales"],
            bestAreas: ["Northern Liberties", "Fishtown", "Graduate Hospital"],
            avoidAreas: ["Certain North Philadelphia areas"]
          }
        },
        {
          city: "Pittsburgh", state: "PA", county: "Allegheny County",
          description: "Transformed steel city now tech hub with strong healthcare and education sectors. Affordable market with neighborhood-specific opportunities.",
          medianPrice: 145000, medianRent: 1150, capRate: 9.7, rentGrowth: 10, inventory: 3.9, score: 82,
          brrrrScore: 80,
          brrrrFactors: { buy: 85, rehab: 80, rent: 85, refinance: 75, repeat: 75 },
          airbnb: {
            nightly: { min: 90, max: 130, avg: 110 },
            occupancy: { min: 58, max: 78, avg: 68 },
            monthlyRevenue: { min: 1900, max: 2800, avg: 2350 },
            competition: "Medium",
            adr: "$90-130",
            occupancyRange: "58-78%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Registration & inspection required",
            details: "Moderate regulations. $50 annual registration. Safety inspection required."
          },
          dueDiligence: {
            keyFactors: ["Check hillside properties for foundation issues", "Verify parking availability requirements", "Research neighborhood gentrification trends", "Bridge and tunnel access considerations"],
            marketRisks: ["Topographical challenges for some properties", "Weather-related maintenance costs", "Economic dependence on major employers"],
            opportunities: ["Tech sector growth", "Strong healthcare and education", "Growing arts and culture scene"]
          },
          distressedProperties: {
            sources: ["Allegheny County Sheriff's sales", "Pittsburgh city tax lien sales", "Local real estate investment groups", "Renovation contractor networks", "Estate sale companies"],
            bestAreas: ["Lawrenceville", "Shadyside", "Oakland"],
            avoidAreas: ["Some outlying mill towns"]
          }
        },
        {
          city: "Newark", state: "NJ", county: "Essex County",
          description: "Gateway to NYC with major airport and transportation hub. Undergoing revitalization with new developments.",
          medianPrice: 285000, medianRent: 2100, capRate: 7.2, rentGrowth: 8, inventory: 2.8, score: 75,
          brrrrScore: 65,
          brrrrFactors: { buy: 70, rehab: 60, rent: 75, refinance: 60, repeat: 65 },
          airbnb: {
            nightly: { min: 115, max: 155, avg: 135 },
            occupancy: { min: 65, max: 85, avg: 75 },
            monthlyRevenue: { min: 2700, max: 3700, avg: 3200 },
            competition: "High",
            adr: "$115-155",
            occupancyRange: "65-85%"
          },
          restrictions: {
            str: "Restricted", minStay: "30 days", license: "Required",
            notes: "Long-term rentals only",
            details: "30-day minimum stay enforced. Complex licensing process."
          },
          dueDiligence: {
            keyFactors: ["Research neighborhood safety improvements", "Check property tax trends", "Verify transportation access to NYC", "Review local development plans"],
            marketRisks: ["Crime rates in some areas", "Complex local regulations", "Competition from NYC market"],
            opportunities: ["Airport proximity for business travel", "NYC commuter demand", "Downtown revitalization projects"]
          },
          distressedProperties: {
            sources: ["Essex County Sheriff's sales", "Newark Housing Authority properties", "Local real estate investment networks", "Tax lien auction lists", "Commercial property brokers"],
            bestAreas: ["Downtown", "Ironbound District", "Forest Hill"],
            avoidAreas: ["Some South and West Ward areas"]
          }
        },
        {
          city: "Camden", state: "NJ", county: "Camden County",
          description: "Recovering post-industrial city with major revitalization efforts. Low entry prices but higher risk/reward profile.",
          medianPrice: 125000, medianRent: 1200, capRate: 11.5, rentGrowth: 11, inventory: 4.8, score: 89,
          brrrrScore: 85,
          brrrrFactors: { buy: 95, rehab: 80, rent: 85, refinance: 75, repeat: 90 },
          airbnb: {
            nightly: { min: 70, max: 110, avg: 90 },
            occupancy: { min: 45, max: 65, avg: 55 },
            monthlyRevenue: { min: 1200, max: 1900, avg: 1550 },
            competition: "Low",
            adr: "$70-110",
            occupancyRange: "45-65%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Optional",
            notes: "Few restrictions",
            details: "Very permissive regulations. No licensing required currently. Basic safety standards."
          },
          dueDiligence: {
            keyFactors: ["Research ongoing redevelopment projects", "Check neighborhood safety statistics", "Verify proximity to universities and hospitals", "Review flood zone maps near Delaware River"],
            marketRisks: ["Crime rates still above average", "Economic recovery still developing", "Limited amenities in some areas"],
            opportunities: ["Major redevelopment investments", "Cooper Medical School expansion", "Proximity to Philadelphia"]
          },
          distressedProperties: {
            sources: ["Camden Redevelopment Agency", "Camden County Sheriff's sales", "Cooper Foundation property programs", "Local church and nonprofit sales", "Wholesaler networks specializing in Camden"],
            bestAreas: ["Cooper Grant", "Cramer Hill", "Fairview"],
            avoidAreas: ["Some central Camden areas still recovering"]
          }
        }
      ]
    },
    southeast: {
      name: "Southeast",
      markets: [
        {
          city: "Orlando", state: "FL", county: "Orange County",
          description: "World's theme park capital with massive tourism industry. Strong STR market but high competition.",
          medianPrice: 320000, medianRent: 1850, capRate: 7.2, rentGrowth: 18, inventory: 2.1, score: 85,
          brrrrScore: 75,
          brrrrFactors: { buy: 70, rehab: 85, rent: 85, refinance: 70, repeat: 75 },
          airbnb: {
            nightly: { min: 140, max: 190, avg: 165 },
            occupancy: { min: 68, max: 88, avg: 78 },
            monthlyRevenue: { min: 3200, max: 4900, avg: 4050 },
            competition: "Very High",
            adr: "$140-190",
            occupancyRange: "68-88%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Business license required",
            details: "Business tax receipt required. Zoning compliance mandatory."
          },
          dueDiligence: {
            keyFactors: ["Research proximity to theme parks and attractions", "Check HOA restrictions on short-term rentals", "Verify hurricane insurance requirements", "Review vacation rental saturation in area"],
            marketRisks: ["Hurricane and weather damage", "Tourism industry volatility", "High competition in STR market"],
            opportunities: ["Year-round tourism demand", "Major corporate relocations", "International airport proximity"]
          },
          distressedProperties: {
            sources: ["Orange County Clerk's foreclosure auctions", "Orlando REO listings", "Local investor meetups and networks", "Wholesale property dealers", "Bank-owned property specialists"],
            bestAreas: ["Dr. Phillips", "Winter Park adjacent", "Tourist corridor properties"],
            avoidAreas: ["Some outlying Orange County areas"]
          }
        },
        {
          city: "Tampa", state: "FL", county: "Hillsborough County",
          description: "Major business and cultural center with growing downtown, universities, and sports teams.",
          medianPrice: 365000, medianRent: 2100, capRate: 6.8, rentGrowth: 14, inventory: 1.9, score: 82,
          brrrrScore: 78,
          brrrrFactors: { buy: 75, rehab: 85, rent: 85, refinance: 75, repeat: 80 },
          airbnb: {
            nightly: { min: 130, max: 180, avg: 155 },
            occupancy: { min: 64, max: 84, avg: 74 },
            monthlyRevenue: { min: 2900, max: 4300, avg: 3600 },
            competition: "High",
            adr: "$130-180",
            occupancyRange: "64-84%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "License & safety inspection required",
            details: "Business license required. Annual inspection."
          },
          dueDiligence: {
            keyFactors: ["Check flood zone designations", "Research neighborhood development plans", "Verify parking and HOA requirements", "Review hurricane preparedness requirements"],
            marketRisks: ["Hurricane exposure", "Flood risk in some areas", "High property insurance costs"],
            opportunities: ["Major corporate headquarters", "University of South Florida growth", "Strong tourism and business travel"]
          },
          distressedProperties: {
            sources: ["Hillsborough County foreclosure sales", "Tampa Housing Authority properties", "Local real estate investor networks", "MLS distressed property searches", "Estate and probate sales"],
            bestAreas: ["Hyde Park", "Seminole Heights", "Westshore"],
            avoidAreas: ["Some East Tampa areas"]
          }
        },
        {
          city: "Jacksonville", state: "FL", county: "Duval County",
          description: "Major port city and financial center with growing population. Largest city by land area in US.",
          medianPrice: 295000, medianRent: 1750, capRate: 7.1, rentGrowth: 16, inventory: 2.8, score: 83,
          brrrrScore: 80,
          brrrrFactors: { buy: 80, rehab: 80, rent: 85, refinance: 75, repeat: 80 },
          airbnb: {
            nightly: { min: 120, max: 170, avg: 145 },
            occupancy: { min: 61, max: 81, avg: 71 },
            monthlyRevenue: { min: 2700, max: 3700, avg: 3200 },
            competition: "High",
            adr: "$120-170",
            occupancyRange: "61-81%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Business license & inspection required",
            details: "Business tax receipt required. Zoning compliance mandatory."
          },
          dueDiligence: {
            keyFactors: ["Research specific Jacksonville neighborhoods", "Check military base proximity for rental demand", "Verify coastal insurance requirements", "Review transportation access downtown"],
            marketRisks: ["Hurricane and coastal storm damage", "Economic dependence on port/military", "Large geographic area with varying conditions"],
            opportunities: ["Growing population and job market", "Major port expansion projects", "Strong military rental demand"]
          },
          distressedProperties: {
            sources: ["Duval County Clerk foreclosure listings", "Jacksonville Sheriff's Office sales", "Local REI groups and meetups", "NFHP programs", "Military relocation specialists"],
            bestAreas: ["Riverside", "Avondale", "Atlantic Beach area"],
            avoidAreas: ["Some Northwest Jacksonville areas"]
          }
        },
        {
          city: "Miami", state: "FL", county: "Miami-Dade County",
          description: "International business and tourism hub with luxury market focus. High-end properties and strict STR regulations.",
          medianPrice: 485000, medianRent: 2800, capRate: 6.2, rentGrowth: 15, inventory: 2.5, score: 80,
          brrrrScore: 65,
          brrrrFactors: { buy: 60, rehab: 70, rent: 75, refinance: 65, repeat: 70 },
          airbnb: {
            nightly: { min: 165, max: 225, avg: 195 },
            occupancy: { min: 72, max: 92, avg: 82 },
            monthlyRevenue: { min: 4200, max: 5800, avg: 5000 },
            competition: "Very High",
            adr: "$165-225",
            occupancyRange: "72-92%"
          },
          restrictions: {
            str: "Restricted", minStay: "30 days", license: "Required",
            notes: "Highly regulated, minimum stay requirements",
            details: "30-day minimum strictly enforced. Complex licensing. High fees."
          },
          dueDiligence: {
            keyFactors: ["Verify condo association STR policies", "Check zoning for vacation rental compliance", "Research flood and hurricane insurance costs", "Review international buyer financing options"],
            marketRisks: ["Strict STR regulations", "Hurricane and flood exposure", "High cost of entry and operations"],
            opportunities: ["International tourism demand", "Strong luxury rental market", "Growing tech and finance sectors"]
          },
          distressedProperties: {
            sources: ["Miami-Dade County foreclosure auctions", "Luxury property liquidation sales", "International investor distress sales", "Bank REO specialists", "Condo association distressed units"],
            bestAreas: ["Brickell", "South Beach (limited STR)", "Coral Gables"],
            avoidAreas: ["Some areas with strict STR bans"]
          }
        },
        {
          city: "Fort Lauderdale", state: "FL", county: "Broward County",
          description: "Major cruise port and beach destination with year-round tourism.",
          medianPrice: 425000, medianRent: 2400, capRate: 6.5, rentGrowth: 13, inventory: 2.2, score: 79,
          brrrrScore: 72,
          brrrrFactors: { buy: 70, rehab: 80, rent: 85, refinance: 70, repeat: 75 },
          airbnb: {
            nightly: { min: 150, max: 200, avg: 175 },
            occupancy: { min: 68, max: 88, avg: 78 },
            monthlyRevenue: { min: 3600, max: 4900, avg: 4250 },
            competition: "Very High",
            adr: "$150-200",
            occupancyRange: "68-88%"
          },
          restrictions: {
            str: "Restricted", minStay: "30 days", license: "Required",
            notes: "Long-term only in most areas",
            details: "30-day minimum in residential zones. Business license required."
          },
          dueDiligence: {
            keyFactors: ["Check hurricane and flood zone designations", "Verify HOA STR restrictions", "Research tourism seasonal patterns", "Review parking requirements"],
            marketRisks: ["Hurricane exposure", "High competition", "Seasonal tourism fluctuations"],
            opportunities: ["Year-round tourism", "Business travel demand", "Growing tech sector"]
          },
          distressedProperties: {
            sources: ["Broward County foreclosure auctions", "Cruise industry worker relocations", "Condo liquidation sales", "REO property specialists", "International investor distress sales"],
            bestAreas: ["Las Olas", "Victoria Park", "Colee Hammock"],
            avoidAreas: ["Some inland areas with lower tourism appeal"]
          }
        },
        {
          city: "West Palm Beach", state: "FL", county: "Palm Beach County",
          description: "Wealthy coastal city with strong business district and affluent retirees.",
          medianPrice: 395000, medianRent: 2200, capRate: 6.7, rentGrowth: 12, inventory: 2.4, score: 81,
          brrrrScore: 74,
          brrrrFactors: { buy: 72, rehab: 82, rent: 80, refinance: 75, repeat: 75 },
          airbnb: {
            nightly: { min: 140, max: 185, avg: 165 },
            occupancy: { min: 65, max: 85, avg: 75 },
            monthlyRevenue: { min: 3300, max: 4600, avg: 3950 },
            competition: "High",
            adr: "$140-185",
            occupancyRange: "65-85%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "License required, varies by district",
            details: "Business tax receipt required. Some historic districts have additional rules."
          },
          dueDiligence: {
            keyFactors: ["Research historic district regulations", "Check affluent neighborhood HOA rules", "Verify beach access rights", "Review seasonal rental patterns"],
            marketRisks: ["Hurricane and weather exposure", "Affluent buyer competition", "Seasonal demand fluctuations"],
            opportunities: ["Wealthy retiree market", "Business travel demand", "Cultural events and attractions"]
          },
          distressedProperties: {
            sources: ["Palm Beach County clerk sales", "Luxury property liquidations", "Estate sales and probate", "Country club area distress sales", "Senior downsizing sales"],
            bestAreas: ["Clematis Street area", "Flagler Drive", "El Cid neighborhood"],
            avoidAreas: ["Some areas too expensive for cash flow"]
          }
        },
        {
          city: "Pensacola", state: "FL", county: "Escambia County",
          description: "Military town with beautiful beaches and growing tourism.",
          medianPrice: 265000, medianRent: 1650, capRate: 7.8, rentGrowth: 14, inventory: 3.1, score: 86,
          brrrrScore: 82,
          brrrrFactors: { buy: 85, rehab: 80, rent: 85, refinance: 80, repeat: 85 },
          airbnb: {
            nightly: { min: 110, max: 160, avg: 135 },
            occupancy: { min: 58, max: 78, avg: 68 },
            monthlyRevenue: { min: 2200, max: 3400, avg: 2800 },
            competition: "Medium",
            adr: "$110-160",
            occupancyRange: "58-78%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Registration required",
            details: "Business license required. Safety inspection."
          },
          dueDiligence: {
            keyFactors: ["Research proximity to Naval Air Station", "Check hurricane preparedness requirements", "Verify beach access and restrictions", "Review military housing allowances"],
            marketRisks: ["Hurricane exposure", "Military base dependency", "Seasonal tourism patterns"],
            opportunities: ["Strong military rental demand", "Growing beach tourism", "Limited coastal supply"]
          },
          distressedProperties: {
            sources: ["Escambia County foreclosures", "Military relocation sales", "Hurricane damage properties", "Local real estate investor groups", "Beach property liquidations"],
            bestAreas: ["Downtown historic", "Near Naval base", "Beach corridor"],
            avoidAreas: ["Flood-prone inland areas"]
          }
        },
        {
          city: "Atlanta", state: "GA", county: "Fulton County",
          description: "Major Southeast business hub with diverse economy, major airport, and strong job growth.",
          medianPrice: 385000, medianRent: 2100, capRate: 6.5, rentGrowth: 11, inventory: 2.8, score: 80,
          brrrrScore: 75,
          brrrrFactors: { buy: 75, rehab: 80, rent: 80, refinance: 75, repeat: 70 },
          airbnb: {
            nightly: { min: 95, max: 145, avg: 120 },
            occupancy: { min: 62, max: 82, avg: 72 },
            monthlyRevenue: { min: 2100, max: 3200, avg: 2650 },
            competition: "High",
            adr: "$95-145",
            occupancyRange: "62-82%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Registration required, varies by neighborhood",
            details: "Business license required. Some neighborhoods restrict STRs."
          },
          dueDiligence: {
            keyFactors: ["Research neighborhood STR regulations", "Check proximity to MARTA transit", "Verify property tax trends", "Review traffic and accessibility"],
            marketRisks: ["Traffic congestion", "Neighborhood regulation changes", "High competition"],
            opportunities: ["Airport business travel", "Major corporate presence", "Convention and event demand"]
          },
          distressedProperties: {
            sources: ["Fulton County Sheriff's sales", "Atlanta foreclosure auctions", "Corporate relocation sales", "Major real estate investor networks", "Gentrification opportunity areas"],
            bestAreas: ["Intown neighborhoods", "Near MARTA lines", "Midtown area"],
            avoidAreas: ["Some far suburban areas"]
          }
        },
        {
          city: "Charlotte", state: "NC", county: "Mecklenburg County",
          description: "Major banking center with rapidly growing population. Strong job market and diverse economy.",
          medianPrice: 345000, medianRent: 1850, capRate: 6.4, rentGrowth: 13, inventory: 2.6, score: 82,
          brrrrScore: 78,
          brrrrFactors: { buy: 78, rehab: 85, rent: 85, refinance: 75, repeat: 80 },
          airbnb: {
            nightly: { min: 85, max: 125, avg: 105 },
            occupancy: { min: 58, max: 78, avg: 68 },
            monthlyRevenue: { min: 1800, max: 2700, avg: 2250 },
            competition: "Medium",
            adr: "$85-125",
            occupancyRange: "58-78%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Registration required",
            details: "Business license required. Zoning compliance."
          },
          dueDiligence: {
            keyFactors: ["Research rapid development areas", "Check HOA short-term rental policies", "Verify school district quality for families", "Review transportation access"],
            marketRisks: ["Rapid price appreciation", "Development oversupply risk", "Competition from new builds"],
            opportunities: ["Strong job growth", "Major banking sector", "University presence"]
          },
          distressedProperties: {
            sources: ["Mecklenburg County foreclosures", "Banking industry relocations", "Developer distress sales", "Local real estate investor meetups", "Corporate housing liquidations"],
            bestAreas: ["South End", "NoDa", "University area"],
            avoidAreas: ["Some outer suburban developments"]
          }
        },
        {
          city: "Nashville", state: "TN", county: "Davidson County",
          description: "Music City with booming tourism, growing tech sector, and strong job market.",
          medianPrice: 425000, medianRent: 2000, capRate: 5.6, rentGrowth: 15, inventory: 2.1, score: 84,
          brrrrScore: 80,
          brrrrFactors: { buy: 75, rehab: 85, rent: 90, refinance: 75, repeat: 85 },
          airbnb: {
            nightly: { min: 110, max: 160, avg: 135 },
            occupancy: { min: 68, max: 88, avg: 78 },
            monthlyRevenue: { min: 2700, max: 4100, avg: 3400 },
            competition: "Very High",
            adr: "$110-160",
            occupancyRange: "68-88%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Permit required, limit per neighborhood",
            details: "STRP permit required ($150). Neighborhood caps on permits."
          },
          dueDiligence: {
            keyFactors: ["Check STRP permit availability in area", "Research music venue proximity", "Verify parking requirements", "Review event calendar impact"],
            marketRisks: ["Permit availability", "Noise complaints", "High competition", "Regulatory changes"],
            opportunities: ["Year-round music tourism", "Growing tech sector", "Major event demand"]
          },
          distressedProperties: {
            sources: ["Davidson County foreclosures", "Music industry worker relocations", "Developer overextension sales", "Local investor networks", "Entertainment district properties"],
            bestAreas: ["Music Row area", "The Gulch", "East Nashville"],
            avoidAreas: ["Some areas too expensive for cash flow"]
          }
        }
      ]
    },
    midwest: {
      name: "Midwest",
      markets: [
        {
          city: "Columbus", state: "OH", county: "Franklin County",
          description: "State capital with Ohio State University, diverse economy including tech, healthcare, and government.",
          medianPrice: 215000, medianRent: 1400, capRate: 7.8, rentGrowth: 11, inventory: 3.2, score: 84,
          brrrrScore: 85,
          brrrrFactors: { buy: 85, rehab: 85, rent: 90, refinance: 80, repeat: 80 },
          airbnb: {
            nightly: { min: 105, max: 145, avg: 125 },
            occupancy: { min: 60, max: 80, avg: 70 },
            monthlyRevenue: { min: 2200, max: 3200, avg: 2750 },
            competition: "Medium",
            adr: "$105-145",
            occupancyRange: "60-80%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Business license required",
            details: "Business license required ($25). Basic safety requirements."
          },
          dueDiligence: {
            keyFactors: ["Research proximity to Ohio State University", "Check neighborhood development plans", "Verify winter heating costs", "Review local job market trends"],
            marketRisks: ["Cold weather maintenance", "Student housing competition", "Economic dependence on state government"],
            opportunities: ["University rental demand", "State government stability", "Growing tech sector"]
          },
          distressedProperties: {
            sources: ["Franklin County Sheriff's sales", "Columbus city tax lien sales", "University area landlord networks", "Ohio real estate investor groups", "Student housing conversions"],
            bestAreas: ["Short North", "German Village", "University District"],
            avoidAreas: ["Some far east suburban areas"]
          }
        },
        {
          city: "Cleveland", state: "OH", county: "Cuyahoga County",
          description: "Major Great Lakes city undergoing revitalization with strong healthcare sector and cultural attractions.",
          medianPrice: 155000, medianRent: 1200, capRate: 9.3, rentGrowth: 12, inventory: 4.1, score: 87,
          brrrrScore: 88,
          brrrrFactors: { buy: 95, rehab: 85, rent: 85, refinance: 85, repeat: 85 },
          airbnb: {
            nightly: { min: 85, max: 125, avg: 105 },
            occupancy: { min: 55, max: 75, avg: 65 },
            monthlyRevenue: { min: 1600, max: 2600, avg: 2100 },
            competition: "Low",
            adr: "$85-125",
            occupancyRange: "55-75%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Registration required",
            details: "Business license required ($100). Fire safety inspection."
          },
          dueDiligence: {
            keyFactors: ["Research neighborhood safety and development", "Check Cleveland Clinic proximity for demand", "Verify winter maintenance requirements", "Review lake effect snow considerations"],
            marketRisks: ["Harsh winter weather", "Population decline in some areas", "Economic transition challenges"],
            opportunities: ["Healthcare sector growth", "Downtown revitalization", "Cultural attractions tourism"]
          },
          distressedProperties: {
            sources: ["Cuyahoga County foreclosures", "Cleveland Land Bank properties", "Healthcare worker relocations", "Industrial area redevelopment", "Local wholesaler networks"],
            bestAreas: ["Ohio City", "Tremont", "University Circle"],
            avoidAreas: ["Some East Side areas still declining"]
          }
        },
        {
          city: "Cincinnati", state: "OH", county: "Hamilton County",
          description: "Historic riverfront city with strong corporate presence and growing downtown.",
          medianPrice: 185000, medianRent: 1300, capRate: 8.4, rentGrowth: 10, inventory: 3.7, score: 83,
          brrrrScore: 82,
          brrrrFactors: { buy: 85, rehab: 80, rent: 85, refinance: 80, repeat: 80 },
          airbnb: {
            nightly: { min: 90, max: 130, avg: 110 },
            occupancy: { min: 58, max: 78, avg: 68 },
            monthlyRevenue: { min: 1800, max: 2800, avg: 2300 },
            competition: "Medium",
            adr: "$90-130",
            occupancyRange: "58-78%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Registration required",
            details: "Business license required. Historic districts may have additional rules."
          },
          dueDiligence: {
            keyFactors: ["Research historic district regulations", "Check flood zone designations near river", "Verify neighborhood gentrification trends", "Review corporate job market stability"],
            marketRisks: ["Flood risk near river", "Economic dependence on major employers", "Competition from suburban areas"],
            opportunities: ["Downtown revitalization", "Corporate headquarters demand", "Historic charm appeal"]
          },
          distressedProperties: {
            sources: ["Hamilton County Sheriff's sales", "Cincinnati city foreclosures", "Historic renovation opportunities", "Corporate relocation sales", "Riverfront redevelopment"],
            bestAreas: ["Over-the-Rhine", "Mount Adams", "Downtown"],
            avoidAreas: ["Some flood-prone riverfront areas"]
          }
        },
        {
          city: "Detroit", state: "MI", county: "Wayne County",
          description: "Recovering industrial city with major revitalization efforts downtown. Extremely affordable with high risk/reward potential.",
          medianPrice: 85000, medianRent: 750, capRate: 10.6, rentGrowth: 12, inventory: 6.8, score: 91,
          brrrrScore: 85,
          brrrrFactors: { buy: 98, rehab: 75, rent: 80, refinance: 75, repeat: 95 },
          airbnb: {
            nightly: { min: 55, max: 85, avg: 65 },
            occupancy: { min: 42, max: 62, avg: 52 },
            monthlyRevenue: { min: 800, max: 1300, avg: 1050 },
            competition: "Low",
            adr: "$55-85",
            occupancyRange: "42-62%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Optional",
            notes: "Revitalizing area, few restrictions",
            details: "Very permissive regulations. City encourages investment."
          },
          dueDiligence: {
            keyFactors: ["Research specific neighborhood recovery status", "Check proximity to downtown revival areas", "Verify property tax payment history", "Review crime statistics by block"],
            marketRisks: ["Neighborhood quality varies dramatically", "Infrastructure challenges", "Property tax issues"],
            opportunities: ["Massive appreciation potential", "Downtown revival spillover", "Rock-bottom entry prices"]
          },
          distressedProperties: {
            sources: ["Wayne County tax foreclosures", "Detroit Land Bank Authority", "Automotive worker relocations", "Downtown revitalization spillover", "Community development programs"],
            bestAreas: ["Downtown", "Midtown", "Corktown"],
            avoidAreas: ["Research each area carefully - quality varies by block"]
          }
        },
        {
          city: "Indianapolis", state: "IN", county: "Marion County",
          description: "State capital with diverse economy, major sports venues, and strong job market.",
          medianPrice: 185000, medianRent: 1200, capRate: 7.8, rentGrowth: 10, inventory: 3.6, score: 83,
          brrrrScore: 82,
          brrrrFactors: { buy: 85, rehab: 85, rent: 85, refinance: 80, repeat: 75 },
          airbnb: {
            nightly: { min: 85, max: 120, avg: 100 },
            occupancy: { min: 55, max: 75, avg: 65 },
            monthlyRevenue: { min: 1600, max: 2400, avg: 2000 },
            competition: "Medium",
            adr: "$85-120",
            occupancyRange: "55-75%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Business license required",
            details: "Business license required. Indianapolis 500 and sports events drive major demand spikes."
          },
          dueDiligence: {
            keyFactors: ["Research proximity to downtown and sports venues", "Check state government job stability", "Verify racing event rental potential", "Review neighborhood development plans"],
            marketRisks: ["Economic dependence on government/sports", "Weather maintenance costs", "Competition from suburban areas"],
            opportunities: ["Indianapolis 500 and sports events", "State government stability", "Growing tech sector"]
          },
          distressedProperties: {
            sources: ["Marion County Sheriff's sales", "Indianapolis foreclosure auctions", "Government worker relocations", "Sports venue area properties", "Local real estate investor networks"],
            bestAreas: ["Mass Ave", "Fountain Square", "Broad Ripple"],
            avoidAreas: ["Some far west side areas"]
          }
        },
        {
          city: "Chicago", state: "IL", county: "Cook County",
          description: "Major international city with diverse economy, world-class attractions, and complex regulatory environment.",
          medianPrice: 485000, medianRent: 2400, capRate: 5.9, rentGrowth: 8, inventory: 2.1, score: 77,
          brrrrScore: 68,
          brrrrFactors: { buy: 60, rehab: 65, rent: 80, refinance: 70, repeat: 65 },
          airbnb: {
            nightly: { min: 130, max: 180, avg: 155 },
            occupancy: { min: 65, max: 85, avg: 75 },
            monthlyRevenue: { min: 3000, max: 4300, avg: 3650 },
            competition: "Very High",
            adr: "$130-180",
            occupancyRange: "65-85%"
          },
          restrictions: {
            str: "Restricted", minStay: "1 night", license: "Required",
            notes: "Complex regulations, varies by ward",
            details: "Complex licensing by ward. Some areas prohibit STRs."
          },
          dueDiligence: {
            keyFactors: ["Research ward-specific STR regulations", "Check property tax trends", "Verify transportation access", "Review crime statistics by area"],
            marketRisks: ["Complex regulatory environment", "High property taxes", "Crime in some areas"],
            opportunities: ["Major tourism and business travel", "World-class attractions", "Transportation hub"]
          },
          distressedProperties: {
            sources: ["Cook County foreclosure auctions", "Chicago city tax sales", "Corporate relocation liquidations", "Condo conversion opportunities", "Luxury market distress sales"],
            bestAreas: ["Lincoln Park", "River North", "Gold Coast"],
            avoidAreas: ["Some South and West Side areas"]
          }
        }
      ]
    },
    southwest: {
      name: "Southwest",
      markets: [
        {
          city: "Phoenix", state: "AZ", county: "Maricopa County",
          description: "Major desert metropolis with year-round sunshine, growing tech sector, and strong retiree migration.",
          medianPrice: 415000, medianRent: 2200, capRate: 6.4, rentGrowth: 16, inventory: 2.1, score: 79,
          brrrrScore: 75,
          brrrrFactors: { buy: 70, rehab: 80, rent: 85, refinance: 75, repeat: 75 },
          airbnb: {
            nightly: { min: 155, max: 195, avg: 175 },
            occupancy: { min: 65, max: 85, avg: 75 },
            monthlyRevenue: { min: 3400, max: 4800, avg: 4100 },
            competition: "High",
            adr: "$155-195",
            occupancyRange: "65-85%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Business license and tax ID required",
            details: "Business license required. Transient occupancy tax."
          },
          dueDiligence: {
            keyFactors: ["Research extreme heat summer impacts", "Check HOA short-term rental policies", "Verify pool maintenance and liability", "Review seasonal demand patterns"],
            marketRisks: ["Extreme summer heat reduces demand", "High competition from hotels/resorts", "Water usage restrictions"],
            opportunities: ["Year-round tourism", "Major retiree destination", "Growing tech and healthcare sectors"]
          },
          distressedProperties: {
            sources: ["Maricopa County foreclosure auctions", "Retiree downsizing sales", "Seasonal property liquidations", "Resort area distressed sales", "Local real estate investor networks"],
            bestAreas: ["Scottsdale adjacent", "Central Phoenix", "Tempe area"],
            avoidAreas: ["Some far suburban developments"]
          }
        },
        {
          city: "Dallas", state: "TX", county: "Dallas County",
          description: "Major business hub with diverse economy, no state income tax, and strong job growth.",
          medianPrice: 285000, medianRent: 1700, capRate: 7.1, rentGrowth: 13, inventory: 2.6, score: 82,
          brrrrScore: 80,
          brrrrFactors: { buy: 80, rehab: 85, rent: 85, refinance: 80, repeat: 75 },
          airbnb: {
            nightly: { min: 115, max: 155, avg: 135 },
            occupancy: { min: 61, max: 81, avg: 71 },
            monthlyRevenue: { min: 2400, max: 3600, avg: 3000 },
            competition: "Medium",
            adr: "$115-155",
            occupancyRange: "61-81%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Business license required",
            details: "Business license required. Hotel occupancy tax."
          },
          dueDiligence: {
            keyFactors: ["Research specific Dallas neighborhood regulations", "Check proximity to business districts", "Verify airport flight path noise", "Review corporate travel patterns"],
            marketRisks: ["Economic dependence on oil/energy sector", "Hot summer weather", "Competition from business hotels"],
            opportunities: ["Major corporate presence", "DFW airport business travel", "No state income tax"]
          },
          distressedProperties: {
            sources: ["Dallas County foreclosure auctions", "Corporate relocation sales", "Energy sector worker relocations", "Local real estate investment groups", "Commercial property conversions"],
            bestAreas: ["Deep Ellum", "Bishop Arts District", "Uptown Dallas"],
            avoidAreas: ["Some far suburban areas with long commutes"]
          }
        },
        {
          city: "Austin", state: "TX", county: "Travis County",
          description: "Tech hub and capital city with major university, live music scene.",
          medianPrice: 485000, medianRent: 2600, capRate: 6.4, rentGrowth: 14, inventory: 1.8, score: 76,
          brrrrScore: 70,
          brrrrFactors: { buy: 65, rehab: 75, rent: 85, refinance: 75, repeat: 75 },
          airbnb: {
            nightly: { min: 165, max: 205, avg: 185 },
            occupancy: { min: 67, max: 87, avg: 77 },
            monthlyRevenue: { min: 3800, max: 5100, avg: 4450 },
            competition: "Very High",
            adr: "$165-205",
            occupancyRange: "67-87%"
          },
          restrictions: {
            str: "Restricted", minStay: "30 days", license: "Required",
            notes: "Type 2 license required, highly regulated",
            details: "30-day minimum in most residential areas. Type 2 license required ($271)."
          },
          dueDiligence: {
            keyFactors: ["Research Austin's complex STR zoning laws", "Check Type 2 license availability", "Verify music venue proximity", "Review major event calendar impact"],
            marketRisks: ["Restrictive STR regulations", "High property prices", "University student competition"],
            opportunities: ["Major tech sector growth", "SXSW and music events", "University of Texas demand"]
          },
          distressedProperties: {
            sources: ["Travis County foreclosure sales", "Tech worker relocations", "Music venue area properties", "University area investments", "SXSW event-driven opportunities"],
            bestAreas: ["East Austin", "South Austin", "Downtown areas"],
            avoidAreas: ["Areas with strict STR bans"]
          }
        },
        {
          city: "Denver", state: "CO", county: "Denver County",
          description: "Mile High City with outdoor recreation focus, growing cannabis industry, and major airport hub.",
          medianPrice: 495000, medianRent: 2600, capRate: 6.3, rentGrowth: 13, inventory: 1.9, score: 76,
          brrrrScore: 72,
          brrrrFactors: { buy: 65, rehab: 75, rent: 85, refinance: 75, repeat: 75 },
          airbnb: {
            nightly: { min: 165, max: 205, avg: 185 },
            occupancy: { min: 64, max: 84, avg: 74 },
            monthlyRevenue: { min: 3600, max: 4990, avg: 4295 },
            competition: "Very High",
            adr: "$165-205",
            occupancyRange: "64-84%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "License and inspection required",
            details: "Primary residence requirement for some licenses."
          },
          dueDiligence: {
            keyFactors: ["Research Denver's primary residence requirements", "Check altitude and weather impacts", "Verify proximity to ski areas", "Review cannabis tourism regulations"],
            marketRisks: ["High altitude construction challenges", "Seasonal tourism fluctuations", "Complex licensing requirements"],
            opportunities: ["Outdoor recreation tourism", "Growing tech sector", "Cannabis industry growth"]
          },
          distressedProperties: {
            sources: ["Denver County foreclosure auctions", "Tech worker relocations", "Cannabis industry properties", "Outdoor recreation area sales", "Ski tourism related distress"],
            bestAreas: ["RiNo", "Highlands", "Cap Hill"],
            avoidAreas: ["Some industrial areas still transitioning"]
          }
        },
        {
          city: "Houston", state: "TX", county: "Harris County",
          description: "Energy capital with major port, diverse economy, and no zoning laws.",
          medianPrice: 235000, medianRent: 1500, capRate: 7.7, rentGrowth: 11, inventory: 3.2, score: 83,
          brrrrScore: 82,
          brrrrFactors: { buy: 85, rehab: 80, rent: 85, refinance: 80, repeat: 80 },
          airbnb: {
            nightly: { min: 100, max: 140, avg: 120 },
            occupancy: { min: 58, max: 78, avg: 68 },
            monthlyRevenue: { min: 2100, max: 3000, avg: 2550 },
            competition: "Medium",
            adr: "$100-140",
            occupancyRange: "58-78%"
          },
          restrictions: {
            str: "Allowed", minStay: "1 night", license: "Required",
            notes: "Business license and permit required",
            details: "Business license required. Hotel occupancy tax."
          },
          dueDiligence: {
            keyFactors: ["Research flood zone designations carefully", "Check energy sector job stability", "Verify hurricane preparedness", "Review medical center proximity"],
            marketRisks: ["Flood and hurricane exposure", "Oil price volatility", "Hurricane/weather damage"],
            opportunities: ["Major energy sector", "Medical center demand", "Port and international business"]
          },
          distressedProperties: {
            sources: ["Harris County foreclosure sales", "Energy sector worker relocations", "Hurricane damage properties", "Medical center area investments", "International business relocations"],
            bestAreas: ["Medical Center area", "Heights", "Montrose"],
            avoidAreas: ["High flood risk zones"]
          }
        }
      ]
    }
  };

  // CRITICAL: allMarkets must be defined BEFORE anything that references it
  const allMarkets = useMemo(() => {
    return Object.values(marketData).flatMap(region => region.markets);
  }, []);

  const availableStates = useMemo(() => {
    const states = [...new Set(allMarkets.map(m => m.state))].sort();
    return states;
  }, [allMarkets]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    const results = allMarkets.filter(market => {
      return market.city.toLowerCase().includes(query) ||
             market.state.toLowerCase().includes(query) ||
             (market.county && market.county.toLowerCase().includes(query));
    });
    return results.slice(0, 8);
  }, [searchQuery, allMarkets]);

  const isStateSearch = useMemo(() => {
    if (!searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase().trim();
    const stateMatches = availableStates.filter(state => state.toLowerCase() === query);
    return stateMatches.length > 0;
  }, [searchQuery, availableStates]);

  const getStateInfo = (stateCode) => {
    const stateNames = {
      FL: "Florida", OH: "Ohio", TX: "Texas", NY: "New York",
      PA: "Pennsylvania", NJ: "New Jersey", GA: "Georgia",
      NC: "North Carolina", SC: "South Carolina", TN: "Tennessee",
      MI: "Michigan", IN: "Indiana", IL: "Illinois",
      AZ: "Arizona", CO: "Colorado"
    };
    const cityCount = allMarkets.filter(m => m.state === stateCode).length;
    return { name: stateNames[stateCode] || stateCode, cityCount };
  };

  const getStateMarkets = (stateCode) => {
    return allMarkets.filter(market => market.state === stateCode);
  };

  const handleStateChange = (stateCode) => {
    setSelectedState(stateCode);
    setShowStateResults(!!stateCode);
    if (stateCode) {
      setSearchQuery("");
      setShowSearchResults(false);
    }
  };

  const clearStateSelection = () => {
    setSelectedState("");
    setShowStateResults(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setShowSearchResults(!!value.trim());
    if (value.trim()) {
      setSelectedState("");
      setShowStateResults(false);
    }
  };

  const getTopMarkets = (metric, count = 5) => {
    return [...allMarkets]
      .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
      .slice(0, count);
  };

  const getRecommendedMarkets = (goal) => {
    const goalMap = {
      cashFlow: "capRate",
      appreciation: "rentGrowth",
      brrrr: "brrrrScore",
      balanced: "score"
    };
    return getTopMarkets(goalMap[goal] || "score", 3);
  };

  const recommendedMarkets = getRecommendedMarkets(investmentGoal);
  const topMarkets = getTopMarkets(selectedMetric, 5);
  const stateMarkets = selectedState ? getStateMarkets(selectedState) : [];
  const stateInfo = selectedState ? getStateInfo(selectedState) : null;

  // Map-derived focus: state selection > single search match > full US
  const mapFocusState = useMemo(() => {
    if (selectedState) return selectedState;
    if (searchResults.length === 1) return searchResults[0].state;
    return null;
  }, [selectedState, searchResults]);

  // Map highlight: single search match gets the bright pin; state browsing shows all state counties
  const mapHighlight = useMemo(() => {
    if (searchResults.length === 1) return searchResults[0];
    return null;
  }, [searchResults]);

  // Clicking a county on the map drives the existing search flow
  const handleMapCountyClick = useCallback((market) => {
    setSearchQuery(market.city);
    setShowSearchResults(true);
    setSelectedState("");
    setShowStateResults(false);
  }, []);

  const renderMarketCard = (market, showRank = false, rank = 0) => (
    <div
      key={`${market.city}-${market.state}`}
      style={{
        padding: 16,
        border: `1px solid ${THEME.border}`,
        borderRadius: 8,
        background: THEME.bgPanel,
        marginBottom: 12
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {showRank && (
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: THEME.accent, color: THEME.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700
              }}>
                {rank}
              </div>
            )}
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              {market.city}, {market.state}
            </div>
          </div>
          {market.county && (
            <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 2 }}>
              {market.county}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: THEME.textMuted }}>Deal Score</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: THEME.accent }}>
            {market.brrrrScore || market.score}
          </div>
        </div>
      </div>

      {market.description && (
        <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12, lineHeight: 1.4 }}>
          {market.description}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: THEME.textMuted }}>MEDIAN</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{fmtUSD(market.medianPrice, { short: true })}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: THEME.textMuted }}>RENT</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>${market.medianRent}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: THEME.textMuted }}>CAP RATE</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: THEME.green }}>{market.capRate}%</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: THEME.textMuted }}>GROWTH</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: THEME.secondary }}>+{market.rentGrowth}%</div>
        </div>
      </div>

      {market.airbnb && (
        <div style={{
          padding: 10, background: THEME.bgRaised, borderRadius: 6,
          marginBottom: 10, fontSize: 12
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: THEME.textMuted }}>STR Nightly</span>
            <span style={{ fontWeight: 600 }}>{market.airbnb.adr || `$${market.airbnb.nightly?.avg || 0}`}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: THEME.textMuted }}>Occupancy</span>
            <span style={{ fontWeight: 600 }}>{market.airbnb.occupancyRange || `${market.airbnb.occupancy?.avg || 0}%`}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: THEME.textMuted }}>Competition</span>
            <span style={{ fontWeight: 600 }}>{market.airbnb.competition}</span>
          </div>
        </div>
      )}

      {market.restrictions && (
        <div style={{ fontSize: 11, color: THEME.textMuted, padding: "6px 0", borderTop: `1px solid ${THEME.borderLight}` }}>
          <strong>STR:</strong> {market.restrictions.str} | <strong>Min Stay:</strong> {market.restrictions.minStay} | <strong>License:</strong> {market.restrictions.license}
        </div>
      )}

      {market.dueDiligence && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: THEME.accent, marginBottom: 4 }}>Key Due Diligence</div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: THEME.textMuted }}>
            {market.dueDiligence.keyFactors.slice(0, 2).map((factor, idx) => (
              <li key={idx} style={{ marginBottom: 2 }}>{factor}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  // City drill-down when a specific search match is active (used by Live Listings)
  const liveListingsCity = useMemo(() => {
    if (searchResults.length === 1) return searchResults[0].city;
    if (selectedState && stateMarkets.length > 0) return stateMarkets[0].city;
    return null;
  }, [searchResults, selectedState, stateMarkets]);

  const liveListingsStateMarkets = useMemo(() => {
    if (selectedState) return stateMarkets;
    if (searchResults.length === 1) return allMarkets.filter(m => m.state === searchResults[0].state);
    return [];
  }, [selectedState, stateMarkets, searchResults, allMarkets]);

  const liveListingsState = selectedState || (searchResults.length === 1 ? searchResults[0].state : "");

  return (
    <div>
      {/* 1. STATE FILTER — first thing the user sees */}
      <Panel title="Filter by State" icon={<Filter size={16} />} accent style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
          Start by picking a state to narrow the map, then browse the live listings and comparables for that area.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "2fr 3fr", gap: 16 }}>
          <div>
            <div className="label-xs" style={{ marginBottom: 8 }}>Browse by State</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                style={{ flex: 1, padding: "10px 12px", fontSize: 14 }}
              >
                <option value="">Select a state...</option>
                {availableStates.map(state => {
                  const info = getStateInfo(state);
                  return (
                    <option key={state} value={state}>
                      {info.name} ({info.cityCount} {info.cityCount === 1 ? "city" : "cities"})
                    </option>
                  );
                })}
              </select>
              {selectedState && (
                <button
                  onClick={clearStateSelection}
                  className="btn-ghost"
                  style={{ padding: "8px 12px", fontSize: 12 }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="label-xs" style={{ marginBottom: 8 }}>Or search by city / county</div>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by city, state, or county (e.g. Columbus, OH, Tampa)"
                style={{
                  width: "100%", padding: "10px 36px 10px 12px", fontSize: 14,
                  border: `1px solid ${THEME.border}`, borderRadius: 6
                }}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  style={{
                    position: "absolute", right: 8, top: "50%",
                    transform: "translateY(-50%)", background: "transparent",
                    color: THEME.textMuted, padding: 4
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: THEME.textDim, marginBottom: 6 }}>Quick picks</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["FL", "OH", "TX", "Columbus OH", "Tampa FL", "Detroit MI", "Memphis TN"].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => handleSearchChange(suggestion)}
                style={{
                  padding: "4px 10px", fontSize: 11,
                  background: THEME.bg, border: `1px solid ${THEME.border}`,
                  borderRadius: 12, color: THEME.textMuted, cursor: "pointer"
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {/* 2. MAP — below the filter */}
      <Panel title="Market Map — US Counties" icon={<MapPin size={16} />} accent style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 14 }}>
          Every tracked market, color-coded by overall deal score on a red-yellow-green heatmap. Red indicates weaker markets, yellow is average, and green represents the strongest investment conditions. Click a county to drill in.
        </div>
        <USCountyMap
          allMarkets={allMarkets}
          selectedState={mapFocusState}
          highlightedMarket={mapHighlight}
          onCountyClick={handleMapCountyClick}
        />
      </Panel>

      {/* 3. LIVE LISTINGS & COMPARABLES — when a state / area is active */}
      {liveListingsState && (
        <LiveListingsPanel
          selectedState={liveListingsState}
          selectedCity={liveListingsCity}
          stateName={stateInfo ? stateInfo.name : null}
          stateMarkets={liveListingsStateMarkets}
        />
      )}

      {/* 4. SEARCH / STATE RESULT CARDS */}
      {showSearchResults && searchResults.length > 0 && (
        <Panel title={`Search Results (${searchResults.length})`} icon={<Search size={16} />} style={{ marginBottom: 24 }}>
          {searchResults.map(market => renderMarketCard(market))}
        </Panel>
      )}

      {showSearchResults && searchResults.length === 0 && searchQuery.trim() && (
        <Panel title="Search Results" icon={<Search size={16} />} style={{ marginBottom: 24 }}>
          <div style={{ padding: 20, textAlign: "center", color: THEME.textMuted, fontSize: 13 }}>
            No markets found matching "{searchQuery}". Try a city or state name.
          </div>
        </Panel>
      )}

      {showStateResults && stateInfo && (
        <Panel title={`${stateInfo.name} Markets (${stateInfo.cityCount})`} icon={<MapPin size={16} />} style={{ marginBottom: 24 }}>
          {stateMarkets.map(market => renderMarketCard(market))}
        </Panel>
      )}

      {/* 5. GOAL & RECOMMENDATIONS */}
      <Panel title="Investment Goal & Recommendations" icon={<Target size={16} />} style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <div className="label-xs" style={{ marginBottom: 10 }}>What's your primary investment goal?</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
            {[
              { key: "cashFlow", label: "Cash Flow", icon: <DollarSign size={16} /> },
              { key: "appreciation", label: "Appreciation", icon: <TrendingUp size={16} /> },
              { key: "brrrr", label: "BRRRR", icon: <RepeatIcon size={16} /> },
              { key: "balanced", label: "Balanced", icon: <Gauge size={16} /> }
            ].map(goal => (
              <button
                key={goal.key}
                onClick={() => setInvestmentGoal(goal.key)}
                style={{
                  padding: 12,
                  border: `2px solid ${investmentGoal === goal.key ? THEME.accent : THEME.border}`,
                  borderRadius: 6,
                  background: investmentGoal === goal.key ? THEME.bgRaised : THEME.bgPanel,
                  display: "flex", alignItems: "center", gap: 8,
                  justifyContent: "center", cursor: "pointer",
                  color: investmentGoal === goal.key ? THEME.accent : THEME.text,
                  fontWeight: 600, fontSize: 13
                }}
              >
                {goal.icon}
                {goal.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="label-xs" style={{ marginBottom: 10 }}>Top Recommended Markets For Your Goal</div>
          {recommendedMarkets.map((market, idx) => renderMarketCard(market, true, idx + 1))}
        </div>
      </Panel>

      {/* 6. TOP 5 MARKETS */}
      <Panel title="Top 5 Markets" icon={<Trophy size={16} />}>
        <div style={{ marginBottom: 16 }}>
          <div className="label-xs" style={{ marginBottom: 8 }}>Rank by:</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { key: "capRate", label: "Cap Rate" },
              { key: "rentGrowth", label: "Rent Growth" },
              { key: "score", label: "Overall Score" },
              { key: "brrrrScore", label: "Deal Score" }
            ].map(metric => (
              <button
                key={metric.key}
                onClick={() => setSelectedMetric(metric.key)}
                style={{
                  padding: "6px 12px", fontSize: 12,
                  background: selectedMetric === metric.key ? THEME.accent : THEME.bgPanel,
                  color: selectedMetric === metric.key ? THEME.bg : THEME.text,
                  border: `1px solid ${selectedMetric === metric.key ? THEME.accent : THEME.border}`,
                  borderRadius: 4, fontWeight: 600, cursor: "pointer"
                }}
              >
                {metric.label}
              </button>
            ))}
          </div>
        </div>

        {topMarkets.map((market, idx) => renderMarketCard(market, true, idx + 1))}
      </Panel>
    </div>
  );
};

/* ============================================================================
   HEADER
   ============================================================================ */
const Header = ({ view, onChangeView, onNewDeal }) => (
  <div style={{
    borderBottom: `1px solid ${THEME.border}`,
    background: THEME.bg,
    position: "sticky", top: 0, zIndex: 10
  }}>
    <div style={{
      maxWidth: 1400, margin: "0 auto",
      padding: isMobile() ? "12px 16px" : "14px 28px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 12
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: `linear-gradient(135deg, ${THEME.navy}, ${THEME.teal})`,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Building2 size={20} color="white" />
        </div>
        <div>
          <div className="serif" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
            DealTrack
          </div>
          <div style={{ fontSize: 10, color: THEME.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
            Real Estate Investment Platform
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        {[
          { key: "dashboard", label: "Dashboard", icon: <Layout size={14} /> },
          { key: "analyzer", label: "Analyzer", icon: <Calculator size={14} /> },
          { key: "market", label: "Market Intel", icon: <MapPin size={14} /> },
          { key: "education", label: "Learn", icon: <GraduationCap size={14} /> }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => onChangeView(tab.key)}
            style={{
              padding: "8px 14px", fontSize: 13, fontWeight: 600,
              background: view === tab.key ? THEME.bgRaised : "transparent",
              color: view === tab.key ? THEME.accent : THEME.textMuted,
              borderRadius: 6,
              display: "flex", alignItems: "center", gap: 6, cursor: "pointer"
            }}
          >
            {tab.icon}
            {!isMobile() && tab.label}
          </button>
        ))}

        <button className="btn-primary" onClick={onNewDeal} style={{ marginLeft: 8 }}>
          <Plus size={14} />
          {!isMobile() && "New Deal"}
        </button>
      </div>
    </div>
  </div>
);

/* ============================================================================
   ANALYZER
   ============================================================================ */
const Analyzer = ({ deal, onUpdate, onSave, onBack, onDelete }) => {
  const [section, setSection] = useState("acquisition");
  const metrics = useMemo(() => calcMetrics(deal), [deal]);

  const sections = [
    { key: "acquisition", label: "Acquisition", icon: <Search size={14} /> },
    { key: "rehab", label: "Rehab", icon: <Hammer size={14} /> },
    { key: "costs", label: "Costs", icon: <DollarSign size={14} /> },
    { key: "rent", label: "Rent", icon: <Home size={14} /> },
    { key: "refinance", label: "Refinance", icon: <PiggyBank size={14} /> },
    { key: "exit", label: "Exit", icon: <Target size={14} /> }
  ];

  const handleExportPDF = async () => {
    const result = await generatePDFReport(deal, metrics, "investor");
    if (!result.success) {
      alert(result.error || "PDF generation failed.");
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile() ? "16px" : "24px 28px" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 20, flexWrap: "wrap", gap: 12
      }}>
        <div>
          <button onClick={onBack} className="btn-ghost" style={{ marginBottom: 8, fontSize: 12 }}>
            <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to Dashboard
          </button>
          <h1 className="serif" style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
            {deal.address || "New Deal Analysis"}
          </h1>
          <div style={{ fontSize: 13, color: THEME.textMuted, marginTop: 4 }}>
            {deal.city}, {deal.state} • {deal.propertyType}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn-secondary" onClick={handleExportPDF}>
            <FileDown size={14} />
            Export PDF
          </button>
          <button className="btn-primary" onClick={onSave}>
            <Save size={14} />
            Save Deal
          </button>
          {onDelete && (
            <button className="btn-danger" onClick={onDelete} style={{ padding: "8px 12px" }}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <Panel style={{ marginBottom: 24 }} title="Key Metrics" icon={<BarChart3 size={16} />} accent>
        <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr 1fr" : "repeat(5, 1fr)", gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 4, display: "inline-flex", alignItems: "center" }}>
              MONTHLY CASH FLOW
              <CalcTooltip
                size={12}
                title="Monthly Cash Flow"
                description="Effective rent after vacancy and management, minus all operating costs and the mortgage payment."
                formula="(Rent − Vacancy − Mgmt) − (P&I + Tax/Ins + CapEx + Maint + HOA)"
              />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: metrics.monthlyCashFlow > 0 ? THEME.green : THEME.red }}>
              {fmtUSD(metrics.monthlyCashFlow)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 4, display: "inline-flex", alignItems: "center" }}>
              CAP RATE
              <CalcTooltip
                size={12}
                title="Capitalization Rate"
                description="Annual cash flow divided by purchase price. Measures unlevered yield of the property."
                formula="(Annual Cash Flow ÷ Purchase Price) × 100"
              />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: THEME.accent }}>
              {metrics.capRate.toFixed(1)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 4, display: "inline-flex", alignItems: "center" }}>
              CASH ON CASH
              <CalcTooltip
                size={12}
                title="Cash-on-Cash Return"
                description="Yearly return on the actual cash you put in. Favored by cash-flow investors."
                formula="(Annual Cash Flow ÷ Total Invested) × 100"
              />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: THEME.secondary }}>
              {metrics.cashOnCash.toFixed(1)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 4, display: "inline-flex", alignItems: "center" }}>
              TOTAL INVESTED
              <CalcTooltip
                size={12}
                title="Total Cash Invested"
                description="All cash required to acquire and stabilize the property before refinancing."
                formula="Down Payment + Rehab + Closing Costs + Holding Costs"
              />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              {fmtUSD(metrics.totalInvested, { short: true })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 4, display: "inline-flex", alignItems: "center" }}>
              DEAL SCORE
              <CalcTooltip
                size={12}
                title="Deal Score (0-100)"
                description="Composite score combining the 70% rule, 1% rule, cash flow, cap rate and cash-on-cash thresholds. 80+ = A grade."
                formula="70%·25 + 1%·15 + CF>0·20 + CoC>8%·15 + Cap>6%·10 + CF>$200·10 + CoC>12%·5"
              />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: THEME.accent }}>
              {metrics.score}/100 <span style={{ fontSize: 14 }}>({metrics.grade})</span>
            </div>
          </div>
        </div>
      </Panel>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {sections.map(s => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            style={{
              padding: "10px 16px", fontSize: 13, fontWeight: 600,
              background: section === s.key ? THEME.accent : THEME.bgPanel,
              color: section === s.key ? THEME.bg : THEME.text,
              border: `1px solid ${section === s.key ? THEME.accent : THEME.border}`,
              borderRadius: 6,
              display: "flex", alignItems: "center", gap: 6, cursor: "pointer"
            }}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {section === "acquisition" && <AcquisitionSection deal={deal} onUpdate={onUpdate} metrics={metrics} />}
      {section === "rehab" && <RehabSection deal={deal} onUpdate={onUpdate} />}
      {section === "costs" && <CostBreakdown deal={deal} metrics={metrics} onUpdate={onUpdate} />}
      {section === "rent" && (
        <Panel title="Rental Income Analysis" icon={<Home size={16} />} accent>
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
            <NumberField
              label="Monthly Rent Estimate"
              value={deal.rentEstimate}
              onChange={(val) => onUpdate({ rentEstimate: val })}
              prefix="$"
              helper="Market rent for this property"
            />
            <NumberField
              label="Property Tax (Annual)"
              value={deal.propertyTax}
              onChange={(val) => onUpdate({ propertyTax: val })}
              prefix="$"
            />
            <NumberField
              label="Insurance (Annual)"
              value={deal.insurance}
              onChange={(val) => onUpdate({ insurance: val })}
              prefix="$"
            />
            <NumberField
              label="CapEx Reserve (Monthly)"
              value={deal.capex}
              onChange={(val) => onUpdate({ capex: val })}
              prefix="$"
            />
            <NumberField
              label="Repairs & Maintenance (Monthly)"
              value={deal.repairMaintenance}
              onChange={(val) => onUpdate({ repairMaintenance: val })}
              prefix="$"
            />
            <NumberField
              label="Vacancy %"
              value={deal.vacancy}
              onChange={(val) => onUpdate({ vacancy: val })}
              prefix="%"
            />
            <NumberField
              label="Management Fee %"
              value={deal.mgmtFee}
              onChange={(val) => onUpdate({ mgmtFee: val })}
              prefix="%"
            />
            <NumberField
              label="HOA (Monthly)"
              value={deal.hoa}
              onChange={(val) => onUpdate({ hoa: val })}
              prefix="$"
            />
          </div>

          <div style={{ marginTop: 24, padding: 16, background: THEME.bgRaised, borderRadius: 6 }}>
            <h4 style={{ fontSize: 14, marginBottom: 12 }}>Rent Analysis</h4>
            <StatRow label="Gross Monthly Rent" value={fmtUSD(deal.rentEstimate)} />
            <StatRow
              label="Vacancy Loss"
              value={`-${fmtUSD(metrics.vacancyLoss)}`}
              valueColor={THEME.red}
              tooltip={{
                title: "Vacancy Allowance",
                description: "Reserve for months the unit is empty between tenants.",
                formula: "Gross Rent × (Vacancy % ÷ 100)"
              }}
            />
            <StatRow
              label="Management Cost"
              value={`-${fmtUSD(metrics.mgmtCost)}`}
              valueColor={THEME.red}
              tooltip={{
                title: "Property Management",
                description: "Monthly fee paid to a PM company (typical 8–10% of gross rent).",
                formula: "Gross Rent × (Mgmt Fee % ÷ 100)"
              }}
            />
            <StatRow
              label="Effective Income"
              value={fmtUSD(metrics.effectiveIncome)}
              bold valueColor={THEME.green}
              tooltip={{
                title: "Effective Gross Income",
                description: "Rent that actually lands in your account.",
                formula: "Gross Rent − Vacancy − Management"
              }}
            />
            <StatRow
              label="Operating Expenses"
              value={`-${fmtUSD(metrics.monthlyCosts)}`}
              valueColor={THEME.red}
              borderTop
              tooltip={{
                title: "Monthly Operating Costs",
                description: "All costs to own and service the loan.",
                formula: "P&I + (Tax + Ins)/12 + CapEx + Maint + HOA"
              }}
            />
            <StatRow label="Net Monthly Cash Flow"
              value={fmtUSD(metrics.monthlyCashFlow)}
              bold
              valueColor={metrics.monthlyCashFlow > 0 ? THEME.green : THEME.red}
              tooltip={{
                title: "Net Monthly Cash Flow",
                description: "What remains after all operating costs.",
                formula: "Effective Income − Operating Expenses"
              }}
            />
            <StatRow label="1% Rule Status"
              value={metrics.onePercentRule ? "PASS" : "FAIL"}
              valueColor={metrics.onePercentRule ? THEME.green : THEME.red}
              bold
              borderTop
              tooltip={{
                title: "1% Rule",
                description: "Fast-screen heuristic for rental viability.",
                formula: "Monthly Rent ≥ Purchase × 1%"
              }}
            />
          </div>
        </Panel>
      )}
      {section === "refinance" && <RefinanceSection deal={deal} onUpdate={onUpdate} metrics={metrics} />}
      {section === "exit" && <ExitStrategyComparisons deal={deal} metrics={metrics} />}
    </div>
  );
};

/* ============================================================================
   EDUCATION CENTER — comprehensive real estate investment curriculum
   ============================================================================ */
const EducationCenter = () => {
  const [activeCategory, setActiveCategory] = useState("brrrr");
  const [activeTopic, setActiveTopic] = useState("brrrr-basics");
  const [glossarySearch, setGlossarySearch] = useState("");

  const curriculum = {
    brrrr: {
      title: "BRRRR Strategy",
      icon: <RepeatIcon size={16} />,
      topics: {
        "brrrr-basics": {
          title: "The BRRRR Method: Complete Overview",
          icon: <BookOpen size={14} />,
          sections: [
            {
              heading: "What BRRRR Stands For",
              body: "BRRRR is an acronym for Buy, Rehab, Rent, Refinance, Repeat. Coined and popularized by Brandon Turner of BiggerPockets, it describes a five-step strategy for building a rental portfolio without continually injecting new capital into each deal. Each completed cycle recycles most or all of your initial investment so you can redeploy into the next property. Over 5-10 years, a disciplined investor can scale from zero to 10+ rental properties using the same working capital that would otherwise buy only one or two traditional rentals."
            },
            {
              heading: "Why The Strategy Exists",
              body: "Traditional buy-and-hold investing requires a fresh 20-25% down payment on every property, which caps growth at the rate you can save capital. BRRRR gets around this by (1) buying properties below market value, (2) forcing appreciation through strategic renovation, and (3) refinancing against the new higher appraised value to pull your original capital back out. If you bought at $150K, put $40K into rehab, and the ARV (After Repair Value) is $275K, a 75% LTV cash-out refinance gives you a $206K loan — recovering your $190K total basis and leaving you with a cash-flowing property."
            },
            {
              heading: "Step 1 — Buy",
              body: "The deal is made at acquisition. You must purchase at a discount large enough that purchase + rehab is well under 75% of ARV (the 70% Rule is a common guideline, with 5% additional buffer for refi costs). Sources of discounted properties include: MLS stale listings, foreclosure auctions, tax lien sales, probate sales, direct-to-seller mail and SMS marketing, wholesaler relationships, driving for dollars, expired listings, and FSBO properties. Hard money, private money, HELOC, or cash are typical acquisition financing vehicles because conventional lenders won't finance properties in poor condition."
            },
            {
              heading: "Step 2 — Rehab",
              body: "The rehab scope must achieve three goals simultaneously: (1) bring the property to rent-ready condition, (2) meet lender condition requirements for the eventual refinance (typically habitable with functional mechanicals), and (3) force the appraisal high enough to support the refinance. Over-renovating for the neighborhood destroys ROI; under-renovating leaves ARV on the table. Target the 'rental-grade' finish level: durable flooring (LVP), quartz or mid-grade granite, stainless appliances, neutral paint. Skip premium finishes unless the comps demand them."
            },
            {
              heading: "Step 3 — Rent",
              body: "You must have a qualified tenant in place (ideally with a 12-month lease) before refinancing with most lenders. DSCR lenders specifically underwrite the loan to the rental income, so weak rents directly reduce your loan amount. Price the rental slightly below market rent to fill quickly — every month of vacancy on a distressed-acquisition property crushes your returns. Screen tenants rigorously: credit 620+, 3x monthly rent in verifiable income, no evictions, clean criminal background. A bad tenant during the seasoning period can torpedo the whole deal."
            },
            {
              heading: "Step 4 — Refinance",
              body: "Wait out the lender's seasoning period (typically 6 months for conventional, 3-6 months for DSCR) then refinance with a cash-out loan. Standard cash-out LTV on investment properties is 70-75%. Your lender will order a new appraisal — this is the moment of truth. The new loan pays off your acquisition loan and returns the remaining cash to you. Refinance closing costs typically run 2-3% of the loan amount, so budget for them in your deal analysis. If the appraisal comes in short, you have three choices: bring cash to close the gap, wait and appeal, or keep the property as a traditional rental and accept cash tied up."
            },
            {
              heading: "Step 5 — Repeat",
              body: "Take the cash pulled from refinance and deploy it into the next BRRRR. Experienced operators run 2-6 deals per year on staggered timelines so there's always money working. The compounding effect is powerful: in year one you complete one deal; in year three you might complete four simultaneously because each new rental adds cash flow and equity that supports the next acquisition. Build systems before you scale — contractors, property managers, lenders, inspectors, and title companies you trust make the difference between scaling and burning out."
            },
            {
              heading: "The Mathematical Foundation",
              body: "BRRRR math centers on a single question: can you buy + rehab for less than or equal to 75% of ARV? If yes, a 75% LTV refinance recovers all invested capital. Worked example: ARV $300,000; target all-in cost $225,000 (75% of $300K). If rehab is $40K, max purchase price is $185K. Refinance at 75% LTV = $225K cash out, minus 2% closing costs ($4.5K) = $220.5K net. Your $225K basis is recovered within $4.5K, and you now own a $300K asset with ~$75K equity and (hopefully) positive cash flow. The 'infinite return' pitch of BRRRR rests on this math working out — which it won't if you overpay on acquisition or the appraisal underperforms."
            },
            {
              heading: "Realistic Expectations vs. Influencer Hype",
              body: "Social media BRRRR content is survivorship-biased. Deals that go sideways rarely get posted. Real-world BRRRR outcomes usually fall into one of three buckets: (1) 'Clean BRRRR' where you pull out 90-100% of invested capital — maybe 25% of deals; (2) 'Partial BRRRR' where 10-40% of your cash stays trapped in equity — the most common outcome; (3) 'Failed BRRRR' where the appraisal comes in low, rehab overruns crush margins, or market shifts sink comps. Plan for partial BRRRRs as the baseline and treat clean BRRRRs as a bonus."
            }
          ]
        },
        "brrrr-pitfalls": {
          title: "BRRRR Pitfalls and How to Avoid Them",
          icon: <AlertTriangle size={14} />,
          sections: [
            {
              heading: "Pitfall 1 — Buying Too Close to ARV",
              body: "The single most common BRRRR failure. Excitement, competition, or 'falling in love' with a deal leads investors to pay 80-90% of ARV minus rehab, leaving no margin for appraisal softness or rehab overruns. The fix: write your maximum allowable offer (MAO) on a piece of paper BEFORE negotiating, and don't exceed it. MAO = (ARV x 0.70) − Rehab − Closing Costs − Holding Costs − Desired Minimum Equity."
            },
            {
              heading: "Pitfall 2 — Underestimating Rehab",
              body: "First-time BRRRR investors routinely underbid rehab by 25-50%. Reasons include: not seeing hidden damage at walk-through (knob-and-tube wiring, failed sewer lines, asbestos, mold behind walls), not accounting for permit costs, not budgeting for holding costs (taxes, utilities, insurance during rehab), ignoring contractor draw schedules and change orders. The fix: add a 15-20% contingency to every rehab budget, walk the property with a licensed GC before closing, and get written quotes (not verbal estimates) for major systems."
            },
            {
              heading: "Pitfall 3 — Appraisal Comes in Short",
              body: "Even well-executed rehabs can face appraisals that come in 5-15% below your ARV estimate. Common reasons: appraiser used weak comps, market softened between contract and refi, unique property features weren't fully valued, appraiser unfamiliar with the area. The fix: when your loan officer orders the appraisal, ask if you can provide a 'comps packet' — 3-6 recent sold comparable properties within a half-mile radius, similar square footage, and similar condition. Include photos of your rehab scope. Many appraisers will review this before their visit."
            },
            {
              heading: "Pitfall 4 — Seasoning Period Surprises",
              body: "Most conventional lenders require 6 months of 'seasoning' (you own the property for 6+ months) before they'll let you refinance based on new appraised value rather than purchase price. Some require 12. DSCR lenders are often more flexible (3-6 months). The fix: confirm seasoning requirements IN WRITING with your refinance lender BEFORE you close on the acquisition. Never assume the rules you read online are current."
            },
            {
              heading: "Pitfall 5 — Interest Rate Changes During Hold",
              body: "A BRRRR deal underwritten at 7% interest rates can break at 9%. Rate increases during your hold period directly reduce cash flow because your new loan payment is higher. The fix: stress-test every deal at +2% above current rates during analysis. If the deal only works at today's rates, it's a fragile deal."
            },
            {
              heading: "Pitfall 6 — The Tired Landlord Trap",
              body: "After 3-5 BRRRRs, many investors hit a wall: the properties are cash-flowing but management is eating their life. Self-managing 5+ single-family rentals across a metro area is brutal. The fix: Build property management into your deal analysis from deal #1. Budget 8-10% of gross rents for management even if you're self-managing now — you'll want professional management eventually."
            }
          ]
        },
        "brrrr-alternatives": {
          title: "BRRRR Alternatives and Hybrid Strategies",
          icon: <Layers size={14} />,
          sections: [
            {
              heading: "Traditional Buy-and-Hold",
              body: "Purchase a rent-ready or lightly-updated property with 20-25% down and hold it as a rental. Advantages: less complexity, lower renovation risk, faster to execute. Disadvantages: requires fresh capital every deal, so portfolio growth is capped at your savings rate. Best for investors who value simplicity over speed or are working with limited handyman/contractor relationships."
            },
            {
              heading: "Fix and Flip",
              body: "Same acquisition process as BRRRR, but sell the property on the retail market instead of refinancing and holding. Advantages: faster capital turnover (4-8 month cycle vs 8-14 months for BRRRR), no landlord hassle, taxed as short-term capital gain or dealer income but realized immediately. Disadvantages: no long-term equity buildup, full taxation on each flip, selling costs (6-8% of sale price) eat into profit, market downturn risk if you can't sell."
            },
            {
              heading: "The BRRRR-Flip Hybrid",
              body: "Start every deal with both exit strategies open. After rehab, run the numbers: if holding produces strong cash flow and the refinance math works cleanly, refinance and rent. If the market is hot and flip profit is large, sell. This optionality increases your average returns but requires discipline not to chase the option that felt right at purchase time."
            },
            {
              heading: "House Hacking",
              body: "Buy a 2-4 unit property, live in one unit, rent the others. Qualifies for owner-occupant financing (FHA 3.5% down, VA 0% down, conventional 5% down) — dramatically lower down payment than investment property loans. After 12 months of owner-occupancy you can move out and either refinance or keep the low-down-payment mortgage. Among the fastest ways to get started for investors with limited capital."
            },
            {
              heading: "Live-In Flip",
              body: "Buy a primary residence that needs work, renovate while living in it, sell after 2+ years to qualify for the Section 121 capital gains exclusion ($250K single / $500K married). The federal tax exemption on the gain is often more valuable than the rental cash flow a BRRRR would produce. Major advantage for investors in high-tax brackets."
            },
            {
              heading: "Turnkey Rental",
              body: "Buy a fully renovated, already-tenanted property from a turnkey provider. Advantages: no rehab risk, immediate cash flow, minimal time commitment. Disadvantages: paying retail price (so little equity built in), quality varies wildly by provider, no forced appreciation upside. Reasonable for busy professionals with capital but no time for active BRRRRs."
            }
          ]
        },
        "brrrr-financing": {
          title: "Financing the BRRRR Cycle",
          icon: <DollarSign size={14} />,
          sections: [
            {
              heading: "The Two-Loan Structure",
              body: "BRRRR financing almost always involves two distinct loans: a short-term acquisition loan (hard money, private money, HELOC, or cash) and a long-term refinance loan (conventional or DSCR). The acquisition loan funds purchase + rehab, the refi loan replaces it at the end. Understanding how these two loans interact is the most important operational skill in BRRRR."
            },
            {
              heading: "Hard Money Details for BRRRR",
              body: "Typical 2024-2025 hard money terms for BRRRR: 85-90% of purchase price + 100% of rehab financed, 10-12% interest-only, 2-3 points upfront, 6-12 month term. Lender holds back rehab funds in 'draws' released as work is completed (typically 3-4 draws tied to inspection milestones). Total out-of-pocket cash at closing: 10-15% of purchase + closing costs (~3%) + first few months of interest reserves. On a $150K purchase with $40K rehab, expect ~$22-30K cash to close."
            },
            {
              heading: "90/100 and 100/100 Financing",
              body: "'90/100' means 90% of purchase + 100% of rehab. '100/100' means 100% of both, but only up to a combined max typically of 75% of ARV. Example: $150K purchase + $40K rehab = $190K total; 75% of $275K ARV = $206K loan max. Since $190K < $206K, a 100/100 loan is possible. Very few lenders offer true 100/100 — usually reserved for experienced investors with 5+ completed BRRRRs."
            },
            {
              heading: "Interest Reserves and Carrying Costs",
              body: "Hard money lenders often require 3-6 months of interest reserves held in escrow at closing. On a $190K loan at 11%: monthly interest = $1,742; 6 months = $10,452 held in reserve. This protects the lender if you miss payments during rehab. You'll also pay property taxes, insurance (vacant policy typically), and utilities during the 3-6 month rehab period — budget $150-400/month for these combined."
            },
            {
              heading: "The Refinance Bridge",
              body: "The day your rehab is done is not the day you refinance. You need: (1) rent-ready property with CO if required by jurisdiction, (2) tenant in place with signed lease (some lenders require), (3) seasoning period completed, (4) documented rehab receipts and photos for the appraiser. From rehab complete to cash in hand: typically 45-75 days through the refinance process. Plan for 2 months of rent + operating expenses between rehab completion and refi closing."
            },
            {
              heading: "Transitioning to DSCR",
              body: "Most BRRRR investors end up refinancing with DSCR loans because: (1) conventional loans require personal income documentation, (2) conventional limits at 10 financed properties, (3) DSCR allows LLC ownership from origination, (4) DSCR seasoning is often shorter. Typical DSCR refinance: 75% LTV cash-out, 7-9% rate (in 2024-2025), 30-year amortization, $500-$3,000 lender fees, appraisal $550-$750. Prepayment penalty is standard — usually 3-5 years of declining schedule."
            },
            {
              heading: "Exit Scenarios When Refi Falls Short",
              body: "If the refinance appraisal comes in 10%+ below target, you have options: (1) Accept partial cash-out and leave equity in, which becomes a 'partial BRRRR' rather than a failure; (2) Switch to an 80% LTV rate-and-term (requires bringing cash but gets out of hard money); (3) Season longer and reappraise in 6 months if market is improving; (4) Sell the property as a flip if your acquisition + rehab allows profit at retail. Never default on hard money — the property goes back to the lender and your credit takes years to rebuild."
            }
          ]
        },
        "brrrr-examples": {
          title: "BRRRR Worked Examples: 3 Case Studies",
          icon: <Calculator size={14} />,
          sections: [
            {
              heading: "Case 1 — The Clean BRRRR",
              body: "Suburban 3-bed/2-bath in a B-class neighborhood. Purchase: $135,000. Hard money 85/100: $114,750 purchase loan + $35,000 rehab loan = $149,750 total HM debt. Cash to close: $24,000. Rehab: $34,200 actual vs $35,000 budgeted. Rehab time: 14 weeks. Market rent: $1,825/month. Refi appraisal: $265,000 (right at target). DSCR cash-out refi at 75% LTV: $198,750 loan. Payoff hard money + closing costs: $154,750. Cash returned to investor: $44,000. Net outcome: all capital back plus $20,800 extra, property cash-flowing $285/month after all expenses and reserves. Textbook BRRRR."
            },
            {
              heading: "Case 2 — The Partial BRRRR (Most Common)",
              body: "Urban 4-plex. Purchase: $195,000. Hard money 80/100: $156,000 + $65,000 rehab = $221,000 HM debt. Cash to close: $43,000. Rehab: $74,800 actual (15% over $65K budget due to foundation work discovered during demo). Total in deal: $52,800 cash invested. Market rent after rehab: $4,400/month combined. Refi appraisal: $325,000 (8% below $350K target due to softening market). DSCR 75% LTV = $243,750 loan. Payoff HM + closing costs: $226,500. Cash returned: $17,250. Cash still trapped: $35,550. Property cash-flowing $720/month. Cash-on-cash return ~24% rather than infinite — still strong, just not clean."
            },
            {
              heading: "Case 3 — The Failed BRRRR",
              body: "Rural cottage, 2-bed/1-bath. Purchase: $85,000. Hard money 85/100: $72,250 + $38,000 rehab. Cash to close: $16,500. Rehab: $54,300 actual vs $38,000 budgeted (42% overrun due to hidden sewer line failure, termite damage, and mold behind bathroom walls). Rehab time: 24 weeks (vs 12 planned). Additional carrying costs: $8,000. Market rent: $1,100/month (lower than $1,350 projected — rural market weaker than expected). Refi appraisal: $148,000 (vs $185,000 target). 75% LTV = $111,000 — barely covers HM payoff. Net cash returned: $0. Total cash trapped: $40,800. Lessons: rural markets have thinner comps and more appraisal risk; sewer scope inspection would have caught the line failure pre-purchase; 15% rehab contingency was too thin for a 1950s house."
            },
            {
              heading: "The Portfolio Math Over Time",
              body: "Running Case 1-style BRRRRs at 2 per year over 5 years: 10 properties, approximately $3,000/month total cash flow after reserves, ~$400K total equity, ~$200-250K still deployed from the 3-4 partial BRRRRs along the way. Starting capital needed: one deal's worth (~$30K) if all BRRRRs recycle cleanly. Reality-adjusted: ~$100-150K starting capital to absorb partial BRRRRs and reserve funding. The compounding effect matters more than any single deal's outcome — 10 traditional rentals would require $400K+ in down payments alone."
            },
            {
              heading: "Key Takeaways From the Case Studies",
              body: "(1) Aim for 70% Rule, plan for 75% — even disciplined investors slip. (2) Rehab contingency of 15-20% is non-negotiable, and higher (25%) for pre-1970s houses. (3) Appraisal is the single biggest risk factor — prepare for it, don't hope for it. (4) Market softening during your hold can sink a deal that underwrote fine; stress test at -5% ARV and -10% rents. (5) 'Partial BRRRRs' are not failures; they're the realistic baseline. (6) The compounding effect of repeated cycles matters more than any single deal's outcome."
            }
          ]
        }
      }
    },

    flip: {
      title: "Fix & Flip",
      icon: <Hammer size={16} />,
      topics: {
        "flip-fundamentals": {
          title: "Flip Fundamentals and Economics",
          icon: <DollarSign size={14} />,
          sections: [
            {
              heading: "What a Flip Actually Is",
              body: "Fix and flip is buying a property at a discount, renovating quickly, and selling on the retail market — typically within 4-9 months of purchase. Unlike BRRRR, you don't hold as a rental. Profit is realized on sale. The strategy trades long-term wealth-building for faster capital turnover: you can run 2-4 flips per year with the same capital that would buy 1-2 BRRRR properties."
            },
            {
              heading: "The Flip Math",
              body: "Profit = Sale Price − Purchase − Rehab − Holding Costs − Selling Costs − Financing Costs. Example: Sell $320K, purchase $175K, rehab $45K, holding $8K (6 months of taxes, insurance, utilities, HOA), selling $22K (6-7% agent commission + closing), financing $12K (hard money interest + points). Profit = $320K − $262K = $58K. Target minimum profit: $40K per flip in typical markets, $60K+ in higher-cost metros."
            },
            {
              heading: "The 70% Rule Applied to Flips",
              body: "Same formula as BRRRR: Max Offer = (ARV × 0.70) − Rehab. The 30% buffer covers holding costs (~3-5%), selling costs (6-8%), financing costs (3-5%), and profit margin (15-20%). On a $320K ARV with $45K rehab: Max Offer = $224K − $45K = $179K. Going above this crushes margin. In hot markets some flippers stretch to 75%; in soft markets discipline at 65%."
            },
            {
              heading: "Capital Requirements",
              body: "Typical cash outlay on a $175K purchase with $45K rehab using 85/100 hard money: $26K down (15% of purchase) + 3% closing costs ($5K) + 3-month interest reserve ($6K) = $37K at closing. Plus $10K-$15K working capital for rehab draws and holding costs. Total: ~$50K to execute a flip of this size. More at higher price points."
            },
            {
              heading: "Flip vs BRRRR Decision Framework",
              body: "Flip when: (1) the numbers produce $40K+ profit at sale, (2) the property wouldn't cash flow as a rental, (3) market is hot and selling will be fast, (4) you need to realize capital quickly for another opportunity. BRRRR when: (1) the property cash flows strongly as a rental, (2) refinance math works to recover most capital, (3) you want long-term equity and appreciation exposure. Some deals work as either — run both analyses and pick the better outcome."
            },
            {
              heading: "Realistic Expectations",
              body: "Social media portrays flipping as consistent $50K-$100K paydays. Reality: first-time flippers often break even or lose money on deal #1 due to rehab overruns, timeline slippage, or selling-season mistiming. Experienced flippers average $35K-$50K profit per deal in most markets, with 30-40% of deals disappointing. Plan for 3-4 deals per year at $40K average — about $140K gross annual profit, taxed as ordinary income if classified as dealer activity."
            }
          ]
        },
        "finding-flips": {
          title: "Sourcing Flip-Worthy Properties",
          icon: <Search size={14} />,
          sections: [
            {
              heading: "What Makes a Property Flip-Ready",
              body: "Ideal flip target: 3-4 bed, 2+ bath, 1,200-2,200 sqft, in a neighborhood with active buyer demand. Cosmetic-to-moderate rehab scope (avoid major structural, foundation, or full-gut projects unless experienced). Age 1980-2010 sweet spot — old enough to need updating, new enough to avoid lead paint, knob-and-tube, or galvanized plumbing horror stories. School district rating 6+ for family-buyer appeal."
            },
            {
              heading: "Sources for Flip Deals",
              body: "Rank-ordered by volume: (1) MLS stale listings and price drops, (2) wholesaler networks, (3) direct-mail to absentee owners and pre-foreclosures, (4) foreclosure auctions (risky but deep discounts), (5) REO bank-owned, (6) off-market referrals from agents and other investors. Running a flip business typically means sourcing 20-30 potential deals per month to close 2-3 flips per quarter."
            },
            {
              heading: "Neighborhood Selection for Flips",
              body: "B+ and A- neighborhoods generally produce the most profitable flips — strong buyer demand, appraisals that support reasonable ARVs, short days-on-market. Class C neighborhoods have cheaper acquisition but thinner buyer pools and longer sale times, which increases holding costs. Class D almost never flip-profitable — investors pay retail for rentals there, not end-users. Avoid markets with declining population or industry collapse."
            },
            {
              heading: "Reading Comps Like a Retail Appraiser",
              body: "Flip ARV estimation is stricter than BRRRR ARV estimation. Retail buyers and their appraisers are picky — comp must be within 0.25-0.5 miles, same school attendance zone, similar lot size, similar style, sold in last 90 days, similar rehab level. Use 4-6 tight comps, not wide ones. A 0.75-mile comp or 120-day-old sale may make a BRRRR refi but can tank a flip appraisal."
            },
            {
              heading: "Red Flag Properties to Avoid",
              body: "Pass on flips with: location issues (backing to a highway, next to commercial, flood zone, unusual lot), structural issues (foundation movement, sagging roof line, pest damage), pre-1978 homes unless you're certified for lead paint RRP work, unpermitted additions (disclosure required and appraisal problems), properties with active tenants on leases, properties in HOAs with special assessments pending. These all reduce buyer pool and complicate timeline."
            },
            {
              heading: "The 'Best Street, Worst House' Heuristic",
              body: "The highest-return flips are the ugliest house on a strong street. The ARV is pulled up by surrounding property values, your rehab costs to bring it to neighborhood standard are predictable, and end-buyers pay a premium for the location. Inverse: the best house on a weak street is a terrible flip — surrounding values cap your ARV below your rehabbed property's standalone value."
            }
          ]
        },
        "rehab-for-retail": {
          title: "Rehab Scope for Retail Sale",
          icon: <Wrench size={14} />,
          sections: [
            {
              heading: "Flip-Grade vs Rental-Grade Finishes",
              body: "Flips need to wow retail buyers; rentals need durable, budget-friendly finishes. Flip-grade kitchen: quartz counters (not butcher block or laminate), stainless appliance package ($2,500-$3,500), soft-close cabinets, designer-grade lighting, tile backsplash. Flip-grade bathroom: tiled showers (not fiberglass), vanity with stone top, upgraded fixtures, modern lighting. Expect to spend 30-50% more on finishes than a comparable BRRRR rehab."
            },
            {
              heading: "What Retail Buyers Actually Pay For",
              body: "Buyers pay premiums for: updated kitchens (highest ROI), updated primary bathrooms, fresh paint in modern neutrals, new flooring throughout (hardwood or premium LVP — not carpet in main living), curb appeal (fresh landscaping, painted exterior, new front door). Buyers pay less for: secondary bathroom upgrades, garage upgrades, basement finishing (ROI often under 70%), pool additions (negative in many markets), elaborate landscaping."
            },
            {
              heading: "Kitchen Investment for Flips",
              body: "Flip kitchen budget: $18K-$35K depending on size and market. Scope: new semi-custom cabinets ($6K-$14K), quartz or granite counters ($3K-$6K), stainless appliance suite ($2.5K-$4K), subway or modern tile backsplash ($800-$2K), luxury vinyl plank or tile floor ($3K-$6K), modern lighting + island pendant ($500-$1.5K), updated sink + faucet ($400-$800), paint + hardware ($500-$1K). Never cheap out on the kitchen — it's the most valued room."
            },
            {
              heading: "Primary Bathroom Investment",
              body: "Flip primary bath budget: $8K-$18K. Scope: tiled walk-in shower with glass enclosure ($3K-$5K), stone-top vanity ($1K-$2.5K), free-standing tub if space allows ($1.5K-$3K — high perceived value), new toilet, tiled floor ($1.5K-$3K), modern fixtures and lighting ($500-$1.5K). Two-bath homes: primary gets full treatment, secondary gets lighter refresh ($4K-$7K)."
            },
            {
              heading: "Exterior and Curb Appeal",
              body: "Budget $3K-$12K for exterior improvements. High-ROI items: fresh paint or siding refresh, new front door ($800-$2K, often highest ROI-per-dollar improvement), landscaping refresh (mulch, trimming, seasonal plants: $1K-$3K), power washing, driveway seal, mailbox replacement, modern house numbers. Low-ROI: custom hardscaping, elaborate fencing, pool renovations."
            },
            {
              heading: "Neutral Everywhere",
              body: "Personal taste kills flips. Paint: warm white (Sherwin-Williams Alabaster, Benjamin Moore Simply White) or very light greige. Cabinet colors: white, warm white, or medium stained wood — never bright colors. Flooring: light-to-medium warm tones, never super-dark or super-light. Fixtures: matte black or brushed nickel trending; avoid oil-rubbed bronze (dating) and polished chrome (dating). Modern and neutral outsells any specific style."
            }
          ]
        },
        "staging-selling": {
          title: "Staging, Listing, and Selling",
          icon: <Home size={14} />,
          sections: [
            {
              heading: "Staging Matters",
              body: "Staged homes sell 30-70% faster than vacant ones and often for 1-5% more. Full staging for a 2,000 sqft home: $1,500-$4,000/month with typical 2-3 month engagement. Virtual staging (digital): $25-$75 per photo, faster but less effective. Minimum viable: stage the living room, primary bedroom, and primary bath. Buyers struggle to visualize empty space — staging solves that problem."
            },
            {
              heading: "Photography Drives Listing Performance",
              body: "Professional real estate photography: $300-$700 for a comprehensive package (30-50 edited photos, drone aerials, twilight exterior). First-day listing traffic is overwhelmingly driven by MLS photos. Skip this and you lose 40-60% of potential buyers. Budget for: wide-angle interior lens, HDR compositing, grass/sky enhancement in post, drone exterior, twilight shots of lit exterior."
            },
            {
              heading: "Pricing Strategy",
              body: "Price 1-3% below ARV to generate multiple-offer scenarios. Overpricing by 5%+ sits the listing, which cuts into your buyer pool. First 10-14 days on market generates 60% of showing activity — you want to be attractively priced from day one. Reduce quickly if showings are slow: don't let 30 days pass without action."
            },
            {
              heading: "Listing Agent Selection",
              body: "Interview 2-3 agents before listing. Questions: (1) Number of flips they've listed in last 12 months, (2) average days on market for their flip listings, (3) price-to-list ratio on closed flips, (4) marketing plan specifics (staging budget, photography, open houses, social media, broker networking), (5) commission structure (5-6% standard, negotiate to 5% on higher-priced flips). Avoid agents with limited flip experience — retail listings and investor listings have different marketing needs."
            },
            {
              heading: "Offer Evaluation",
              body: "In multiple-offer situations, evaluate beyond headline price: cash vs financed, pre-approval strength, contingencies (inspection, appraisal, financing), closing timeline, earnest money size, concession requests. A $330K cash offer with 21-day close often beats a $340K offer with 45-day financing timeline and extensive contingencies. Your agent should present all offers side-by-side in a spreadsheet."
            },
            {
              heading: "Inspection Response Strategy",
              body: "Buyer's inspector will find items. Categories: safety items (address always), major system items (HVAC nearing end of life, roof issues — address if significant), cosmetic items (paint scrapes, loose hardware — rarely address), code items on pre-existing conditions (usually not required to fix for FHA/VA, negotiate). Budget $1,500-$4,000 for post-inspection concessions on a typical flip. Offer a credit at closing rather than doing repairs yourself — keeps timeline moving."
            }
          ]
        },
        "flip-timeline-capital": {
          title: "Timeline and Capital Management",
          icon: <Clock size={14} />,
          sections: [
            {
              heading: "Typical Flip Timeline",
              body: "Close to sold: 4-9 months in most markets. Breakdown: Close acquisition (day 0), demo and rough-in (weeks 1-3), mechanicals (weeks 2-5), drywall and trim (weeks 4-7), finishes (weeks 6-10), final punch and photos (week 11-12), list (week 12-13), under contract (week 14-16), close sale (week 18-20). Each slippage week adds $500-$1,500 in holding costs depending on property value and financing."
            },
            {
              heading: "Holding Costs Breakdown",
              body: "Monthly holding costs on a $220K flip with hard money: mortgage interest $1,800 (at 11% on $200K loan), property taxes $220, insurance $140 (vacant policy), utilities $120, HOA if applicable $50-$300, maintenance/snow/lawn $100. Total: $2,430-$2,730/month. Budget 6 months of holding = $14,500-$16,400. Plan for 8 months worst-case before eating into profit margin materially."
            },
            {
              heading: "Working With a GC vs Self-Managing",
              body: "Using a General Contractor: +8-15% over trades' direct costs, but GC handles scheduling, quality, and problem-solving. Self-managing trades: cheaper but time-consuming and relies on your project management skills. Recommendation for new flippers: use a GC on first 2-3 flips to learn the process; self-manage once you understand what's being done and can spot quality issues."
            },
            {
              heading: "Draw Schedule and Cash Flow",
              body: "Hard money rehab funds release in 3-5 draws tied to inspection milestones. Typical schedule: 20% at signing, 25% after demo + rough-in complete, 25% after drywall and trim, 20% after finishes, 10% final. You front contractor payments, then submit receipts and get reimbursed by lender. This means you need $15K-$30K working capital beyond the down payment."
            },
            {
              heading: "Contingency and Overrun Management",
              body: "Expect 10-20% budget overrun on first-time flips, 5-10% once experienced. Common overrun sources: hidden damage revealed during demo (termite, water, electrical issues), scope creep (deciding to renovate more rooms), schedule slippage (holding costs extend), material price increases. Build 15% contingency into every flip budget, not 5%."
            },
            {
              heading: "Exit Planning Before Purchase",
              body: "Before buying a flip, validate: at the projected ARV, is this a 30-day sale or a 90-day sale? Check current DOM in that specific neighborhood for renovated homes in similar price range. If DOM is already 45-60 days, your flip will sit — budget extended holding. If DOM is 7-15 days, you have optionality to price aggressively for quick sale. This pre-purchase validation separates reliable flippers from gamblers."
            }
          ]
        },
        "flip-taxes": {
          title: "Tax Treatment of Flipping",
          icon: <FileText size={14} />,
          sections: [
            {
              heading: "Dealer vs Investor Status",
              body: "The IRS classifies flippers who do multiple deals per year as 'dealers' — property is inventory, not investment. Consequences: profits taxed as ordinary income (up to 37% federal) + self-employment tax (15.3% on net), no long-term capital gains treatment even if held >1 year, no 1031 exchange eligibility. One occasional flip may qualify as investment; a pattern of flipping triggers dealer classification. Most active flippers pay 30-50% of profit in combined taxes."
            },
            {
              heading: "Entity Choice for Flipping",
              body: "Unlike rentals (where LLC taxed as disregarded entity is typical), flipping benefits from S-Corp election. Why: S-Corp allows you to pay yourself a reasonable salary (subject to employment taxes) and take the remainder as distributions (no SE tax). On $120K flip profit, switching from sole prop to S-Corp can save $8K-$12K in self-employment taxes annually. Requires formal payroll processing, quarterly estimated taxes, more complex tax filing."
            },
            {
              heading: "Deductible Flip Expenses",
              body: "Fully deductible against flip profit: all rehab costs, acquisition costs (title, inspection, lender fees), interim financing costs, insurance, utilities, taxes during hold, marketing and listing costs, commissions paid, staging, professional fees (CPA, attorney), vehicle mileage for property visits, home office for flip business, tools and equipment. Keep receipts for everything."
            },
            {
              heading: "Quarterly Estimated Taxes",
              body: "Flippers must pay quarterly estimated taxes to avoid IRS penalties. Federal + state combined can reach 40-50% of net profit. On $40K flip profit closing in Q2, plan to send $16K-$20K to IRS and state DOR by the next quarterly deadline. Failure to pay quarterly generates penalty + interest charges. Set up a separate savings account for tax reserves — transfer 30-40% of every closing check."
            },
            {
              heading: "The 1031 Exchange Gap",
              body: "1031 exchanges defer capital gains tax on investment property sales — but flips don't qualify. IRS treats flip profit as inventory income, which is ineligible. Workaround: convert flip to rental for 2+ years before sale (changes tax character from dealer to investor). Impractical for most flippers, but worth considering if capital is tied up and you have strong rental demand."
            },
            {
              heading: "Loss Handling",
              body: "Flip losses are ordinary losses (not capital losses), deductible in full against other income. This is actually favorable — capital losses are limited to $3K/year against ordinary income, but ordinary losses have no cap. Small consolation for a failed flip, but the tax treatment softens the blow. Document everything carefully — the IRS scrutinizes loss deductions on real estate."
            }
          ]
        }
      }
    },

    str: {
      title: "Short-Term Rentals",
      icon: <Key size={16} />,
      topics: {
        "str-business-model": {
          title: "The STR Business Model",
          icon: <Home size={14} />,
          sections: [
            {
              heading: "How Short-Term Rentals Differ From Long-Term",
              body: "STRs (Airbnb, Vrbo, Furnished Finder) operate more like hospitality than rental real estate. Average stays: 2-7 nights. Revenue: 1.5-3x long-term rental potential in strong markets. Expenses: 3-5x higher (cleaning, utilities, platform fees, dynamic pricing tools, furnishings, consumables, maintenance). Net profit often 1.5-2x LTR after all costs, with dramatically more operational complexity."
            },
            {
              heading: "Revenue Components",
              body: "STR gross revenue breakdown: Average Daily Rate (ADR) × occupancy × days available = gross booking revenue. Example: $180 ADR × 70% occupancy × 350 nights available = $44,100 gross. Minus platform fees (14-16% Airbnb, 8% Vrbo), cleaning fees (passed through to guest), OTA commissions. Net to operator: typically 75-80% of gross. Add: cleaning fee markup ($15-$30 per stay retained by operator), extended-stay discounts affect margins."
            },
            {
              heading: "The Unit Economics",
              body: "On a $400K STR property: mortgage $2,200/mo, taxes $350, insurance $200 (STR requires specialty coverage), utilities + internet $350 (landlord-paid), cleaning supplies and consumables $150, software tools $80 (dynamic pricing + channel manager), maintenance reserve $300, CapEx reserve $400. Total fixed costs: ~$4,030/mo. Required revenue: $4,030 breakeven; $6,500-$8,500 target for attractive returns. Requires strong market and operational execution."
            },
            {
              heading: "Capital Requirements Beyond the Property",
              body: "Furnishing a 2-bedroom STR: $15K-$30K for mid-tier market, $40K-$80K for luxury. Includes: full furniture package, linens and bath supplies, kitchen equipment, decor and art, TVs, outdoor furniture, grill, coffee supplies, consumable starter kit. Multiply by 1.5x for 3-bedroom, 2x for 4-bedroom. This is cash that doesn't exist in LTR investing."
            },
            {
              heading: "The Time Investment Reality",
              body: "Self-managed STRs: 15-25 hours/week per property for messaging guests, coordinating cleanings, handling maintenance, managing listings, adjusting prices. Full-service STR management companies: 20-30% of gross revenue (huge cut) but handle everything. Co-hosting model: 15-20% of gross with shared responsibilities. Most investors underestimate time investment by 3-5x — plan for high time commitment in year one before systemizing."
            },
            {
              heading: "Who STR Works For",
              body: "STR suits: investors with tolerance for operational complexity, sole proprietors who can absorb time investment, those in or near STR markets for self-management, investors seeking higher returns in exchange for more work. STR doesn't suit: passive investors wanting hands-off returns, people with W-2 jobs that don't permit phone interruptions, investors in heavily regulated markets, those with low risk tolerance (regulations can change quickly)."
            }
          ]
        },
        "str-market-selection": {
          title: "STR Market Selection and Validation",
          icon: <MapPin size={14} />,
          sections: [
            {
              heading: "What Makes a Strong STR Market",
              body: "Key characteristics: tourism anchor (beach, mountains, national park, major city, festival town), year-round demand (not just seasonal), permissive regulations, manageable saturation (not oversupplied), proximity to dining/entertainment, good walk score or drive score. Examples of strong STR markets: Pensacola FL, Chattanooga TN, Broken Bow OK, Asheville NC (with regs), Galena IL, Joshua Tree CA. Avoid: cities banning STRs, oversaturated beach towns where rates are compressed."
            },
            {
              heading: "Using AirDNA and Rabbu for Market Data",
              body: "AirDNA ($50-$200/mo subscription) provides: market-wide ADR, occupancy, RevPAR, active listing count, seasonality patterns, top-performing property profiles, competitive analysis. Free alternative Rabbu: basic market metrics and property projections. Minimum viable analysis: pull 12 months of data, identify seasonal highs/lows, compare to your financial projections. Don't trust vague marketing claims — get the numbers."
            },
            {
              heading: "Regulatory Research",
              body: "Before buying, verify: (1) Is STR legal in this jurisdiction? (2) Is permit/license required? What's the cost and process? (3) Is owner occupancy required for some of the year? (4) Are there minimum-night restrictions? (5) Occupancy limits per property? (6) Parking requirements? (7) Noise ordinances? (8) What's the HOA stance (can kill STR even where legal)? Check city/county code, planning department, STR association websites, recent news articles."
            },
            {
              heading: "Competitive Saturation Analysis",
              body: "Count active STR listings in your target neighborhood using AirDNA. Too few: demand may be weak. Too many: rates compressed. Sweet spot varies but generally 5-15 listings in a mile radius for suburban/small town, 30-50 for urban. Check 'submarket' data — a city might look saturated overall but have under-served neighborhoods."
            },
            {
              heading: "Seasonality and Revenue Pacing",
              body: "Understand when peak season hits and what the off-season looks like. Beach markets: 4-6 month strong season, 2-3 month weak. Mountain/snow: winter-focused with summer secondary. Urban: surprisingly steady year-round. Festival towns: intense weeks around events. Annual revenue = peak months weighted heavily. A property generating $8K/month in peak but $2K in off-season averages $5K — model this accurately."
            },
            {
              heading: "Validating With Listings at Your Price Point",
              body: "Search Airbnb for properties similar to yours in your target market. Filter by: same bedroom count, similar pool/amenities. Check their pricing, calendar booking density (see when they're booked in next 60 days), reviews count and rating. If top-20 similar properties average 60%+ occupancy at your target ADR, demand supports your plan. If they're showing wide-open calendars, reconsider."
            }
          ]
        },
        "str-property-selection": {
          title: "Property Selection for STR",
          icon: <Home size={14} />,
          sections: [
            {
              heading: "Property Features That Drive Bookings",
              body: "Proven revenue drivers: private hot tub (+15-30% revenue on average), pool in warm markets (+20-40%), game room with pool table or arcade (+10-20%), fire pit or outdoor entertainment space (+5-15%), king bed in primary (vs queen), ensuite bathrooms, high-speed WiFi and workspace (critical for extended stays), designated parking for 4+ vehicles. One or two of these amenities can differentiate your listing from identical properties without them."
            },
            {
              heading: "Size and Layout Sweet Spots",
              body: "Strong performers by market: Urban/small town: 1-bed studios and 2-bed condos (business travelers, couples, short stays). Suburban/vacation: 3-4 bed with multiple baths (families, small groups). Large vacation markets: 5-7 bed with bunk rooms (reunions, bachelor/ette parties, groups). Luxury: 4+ bed with premium amenities. Avoid: 2-bed vacation rentals (too small for groups, too expensive for couples), 6+ bed without group-friendly features."
            },
            {
              heading: "Location Within the Market",
              body: "Walking distance to bars/restaurants/attractions = higher ADR in urban markets. Beach within 5 blocks vs 10 blocks = 20-40% ADR difference. Lake frontage vs lake view vs lake access: each step down cuts 15-25% from revenue potential. Quiet residential neighborhoods can command premiums if they're 'character' (cute historic district) but not if they're just residential."
            },
            {
              heading: "Avoiding Operational Nightmares",
              body: "Red-flag properties: shared walls (noise complaints from neighbors kill reviews and may trigger HOA action), unclear parking (guest frustration source), stairs as primary access (cuts out family, older, mobility-limited guests = 25% of demand), wells or septic (maintenance risk with high-volume use), private roads (plowing and access issues). Even if price is attractive, operational headaches reduce revenue and review scores."
            },
            {
              heading: "Purchase Price vs Revenue Trade-offs",
              body: "Cheaper properties in weaker sub-markets often have worse revenue-to-price ratios than well-located properties. Example: $350K in walking-distance downtown with $65K projected revenue beats $250K on the outskirts with $35K projected revenue. Calculate revenue/price ratio (gross annual / purchase price) — target 15-20% minimum for STR. Properties below 12% rarely produce attractive net returns."
            },
            {
              heading: "Zoning and HOA Compatibility",
              body: "Before closing, get in writing: (1) property zoning explicitly permits STR, (2) HOA (if any) permits STR (many prohibit, some require permits, some limit to minimum-stays), (3) any condo association rules, (4) local STR permit/license availability. One property with STR-permissive zoning next door to one with prohibited zoning is common — block-by-block verification is essential."
            }
          ]
        },
        "str-furnishing-design": {
          title: "Furnishing, Design, and Amenities",
          icon: <Sparkles size={14} />,
          sections: [
            {
              heading: "The 'Instagram-Worthy' Principle",
              body: "Modern STR success depends on photogenic design. Unique, memorable, photo-ready spaces generate social sharing, saved listings, and book-it-now decisions. Look at AirDNA's top-performing properties in your market — they share cohesive design themes (mid-century modern, boho coastal, rustic industrial, etc.), intentional color palettes, and at least one 'wow' feature (striking mural, statement furniture, dramatic bedroom design)."
            },
            {
              heading: "Furnishing Budget Allocation",
              body: "$25K for a 3-bed STR, allocated roughly: Living room $4K (sofa, chairs, coffee table, rug, art, lamps, TV $800), primary bedroom $3K (king bed, nightstands, dresser, lamps, art), secondary bedrooms $2K each (queen or twins, nightstand, lamp), bathrooms $800 each, kitchen $3K (dishes, cookware, appliances, table + chairs), outdoor $2K, decor and linens $3K, misc $2K. Don't cheap out on the mattress — 'uncomfortable bed' kills reviews."
            },
            {
              heading: "Durable Materials That Look Nice",
              body: "Everything gets beaten up. Choose: sofas with removable washable covers, performance fabrics (Sunbrella, Crypton), solid wood furniture (holds up better than veneer), commercial-grade carpet (or avoid carpet entirely), stone or tile counters (not laminate), durable outdoor furniture (aluminum/powder-coated, not wood that rots or rusts prone). Spend on mattresses, pillows, linens — guest sleep quality drives reviews."
            },
            {
              heading: "Consumables and Starter Supplies",
              body: "Guests expect basics stocked: toilet paper, paper towels, hand soap, dish soap, dishwasher tabs, laundry detergent, coffee + filters, salt/pepper/oil/vinegar starter kit, shampoo/conditioner/body wash, trash bags, sponges, cleaning supplies. Initial stocking cost: $200-$400. Reorder every 1-3 months. Many guests appreciate a 'welcome basket' (snacks, water, local treats) — $15-$25 and often generates 5-star reviews."
            },
            {
              heading: "Tech and Entertainment",
              body: "Essential: strong WiFi (minimum 100 Mbps, tested), smart locks (Schlage Encode, Yale Assure, RemoteLock — enables automated access), smart thermostat (Ecobee or Nest), video doorbell (Ring — deters parties), smoke/CO detectors (required). Nice-to-have: smart TV with streaming apps (Roku TVs, Apple TVs, not cable), board games, books, local guidebook, portable speaker, exercise equipment in basement."
            },
            {
              heading: "The Photoshoot That Pays Back 10x",
              body: "Professional STR-specific photographer: $400-$900 for 30-60 edited photos, twilight exterior, drone shots if relevant. STR photographers understand vertical composition (for mobile), detail shots (for amenities), and lifestyle staging (styled plates, flowers, books). DIY phone photos are a $500K property mistake — they reduce listing performance 40%+. Reshoot when you update furniture or major decor."
            }
          ]
        },
        "str-operations": {
          title: "Operations, Tech, and Automation",
          icon: <Sparkles size={14} />,
          sections: [
            {
              heading: "The Tech Stack",
              body: "Core tools for a professional STR operation: (1) Listing platforms: Airbnb + Vrbo minimum, add Booking.com and direct booking site. (2) Channel manager: Hospitable ($40-$100/mo), Hostaway, Guesty — syncs calendars and messaging across platforms. (3) Dynamic pricing: PriceLabs ($20-$40/mo per property), Wheelhouse — adjusts rates daily based on demand. (4) Smart lock: Schlage Encode or similar ($200-$350). (5) Video doorbell: Ring ($100-$250). (6) Security camera exteriors (NOT interior — prohibited): additional Ring cameras."
            },
            {
              heading: "Cleaning Team Management",
              body: "Your most critical operational partner. Options: individual cleaner ($20-$35/hr, 3-5 hours per turnover, $60-$175 per clean), cleaning company ($100-$250 per turnover, includes linens laundry, more reliable), turnover specialist (STR-focused cleaners like Turno platform, $80-$200). Requirements: photo checklist completion, linen management, supply restocking, damage reporting. Build relationships with 2+ cleaners for backup coverage."
            },
            {
              heading: "Messaging Automation and Templates",
              body: "Automate 70-80% of guest communication with scheduled messages: booking confirmation, 7-day pre-arrival (house rules + confirmation), arrival day check-in (smart lock code + arrival instructions), mid-stay check-in (problem anticipation), departure day reminder (check-out time + cleaning responsibility), post-stay thank-you (review request). Hospitable, Host Tools, and similar platforms handle this. Manual messaging for unique situations only."
            },
            {
              heading: "Pricing Strategy",
              body: "Static pricing leaves 20-40% of revenue on the table. Dynamic pricing (PriceLabs/Wheelhouse) adjusts daily based on: day of week, seasonality, local events, competitor pricing, booking pace, historical occupancy. Set base rate, minimum rate (never go below this), maximum rate, orphan day discounts (single-night gaps), last-minute discounts. Review pricing rules monthly — markets change, your property's performance changes."
            },
            {
              heading: "Review Management",
              body: "4.9+ rating is critical for top-tier search ranking. 4.7 or below hurts bookings. Drive 5-star reviews: accurate listing photos, immaculate cleanliness, clear check-in instructions, responsive messaging (under 1 hour when possible), thoughtful touches (welcome note, local guide, snacks). Handle complaints proactively — guests who raise issues during stay give better final reviews than those who stew silently."
            },
            {
              heading: "The Manual That Pays You Back",
              body: "Create a digital guest guide (Touch Stay, StayFi, or PDF) covering: house rules, check-in/out procedures, WiFi password, appliance operation (washing machines, coffee makers, TVs — things that vary by property), trash/recycling procedures, parking details, local recommendations (restaurants, attractions, groceries, emergency contacts). Reduces guest questions by 70%, improves review scores, professionalizes the operation."
            }
          ]
        },
        "str-regulations-risk": {
          title: "Regulations, Insurance, and Risk",
          icon: <Shield size={14} />,
          sections: [
            {
              heading: "The Regulatory Landscape",
              body: "STR regulations have tightened dramatically since 2020. Common regulatory structures: (1) Outright bans in residential zones (NYC, Miami Beach residential areas). (2) Primary-residence-only requirements (Portland OR, Santa Monica). (3) Registration/permit systems with caps (Austin Type 2, Charleston). (4) Occupancy and minimum-night limits. (5) Neighborhood impact fees. (6) Lodging tax collection requirements. Before buying, call the local STR association or permitting office directly — online info is often outdated."
            },
            {
              heading: "Specialty STR Insurance",
              body: "Standard landlord insurance won't cover STR operations. You need a policy specifically for short-term rentals. Providers: Proper Insurance (specialty STR carrier), Safely, CBIZ, some regional brokers. Coverage includes: liability $1M-$3M, building coverage, contents coverage, lost income, guest injury. Annual cost: 1.5-3x landlord policy. Airbnb's AirCover and host guarantees don't replace your own policy — they fill gaps only."
            },
            {
              heading: "Liability Exposure and Risk Mitigation",
              body: "STR liability risk: guest injury (slip on wet bathroom floor, drowning in pool, fall from stairs), property damage by guests, damage to neighboring property, noise/nuisance complaints triggering fines, guest illness from property conditions. Mitigation: post safety signage, maintain all systems rigorously, install smoke/CO detectors and test monthly, require rental agreement (Airbnb/Vrbo don't include one by default), umbrella policy $1-$5M."
            },
            {
              heading: "Local Occupancy and Lodging Taxes",
              body: "Most jurisdictions require STR operators to collect and remit local taxes: state lodging tax, county tax, city tax. Airbnb and Vrbo collect and remit automatically in many markets, but not all — verify for your specific property. Non-compliance: back taxes + penalties + interest + potential operating ban. Register with state DOR and local tax authority before taking first booking."
            },
            {
              heading: "HOA and Neighbor Relations",
              body: "Even where STRs are legal, HOAs often restrict or ban them. Review HOA CCRs (covenants) carefully before buying — they may require minimum lease terms (30+ days disqualifies most STR operations). For non-HOA neighborhoods: proactive neighbor relationships reduce complaints. Introduce yourself, provide your phone number for issues, enforce party rules aggressively (200+ point review deductions aren't worth a rowdy guest's booking)."
            },
            {
              heading: "Exit Planning for STRs",
              body: "Regulatory risk is the biggest concern. If your city bans STRs mid-ownership, you have three options: convert to long-term rental (usually means revenue drops 50-70%), convert to mid-term rental (Furnished Finder, 30+ day stays), or sell the property. Before buying, run the numbers as if it might be forced LTR — if the LTR numbers are catastrophic, your downside is too severe regardless of current STR potential."
            }
          ]
        }
      }
    },

    construction: {
      title: "New Construction",
      icon: <Building2 size={16} />,
      topics: {
        "build-vs-buy": {
          title: "Build-vs-Buy Economics",
          icon: <Calculator size={14} />,
          sections: [
            {
              heading: "When Building Makes Sense",
              body: "New construction is attractive when: (1) existing housing stock in your target market is expensive or poor quality, (2) land is available at reasonable prices, (3) construction costs + land < retail price of comparable finished homes (positive 'build spread'), (4) you have builder relationships or development experience, (5) you want a specific configuration (STR layout, multifamily) that's rare in existing inventory. Building typically yields 15-25% profit margins when executed well — comparable to or better than flipping."
            },
            {
              heading: "The Build Spread Calculation",
              body: "Build Spread = Retail ARV − (Land Cost + Hard Construction + Soft Costs + Financing + Profit Margin). Example: ARV $450K, land $65K, hard construction $220K ($150/sqft × 1,467 sqft), soft costs (architect, permits, utilities hookup) $22K, financing costs $15K. Raw cost: $322K. Spread to ARV: $128K or 28%. Minus 10% target profit margin = $83K available for contingency and risk. Positive but thin — requires execution."
            },
            {
              heading: "Construction Cost Ranges by Grade",
              body: "Builder-grade (entry-level subdivisions): $130-$170/sqft. Mid-grade (typical suburban): $170-$230/sqft. Semi-custom (upgraded finishes, architect-designed): $230-$320/sqft. Custom (full architect, premium materials): $320-$500/sqft. Luxury: $500-$1,000+/sqft. These are national averages for 2024-2025 — high-cost metros (Bay Area, NYC, Boston) add 40-80%. Rural markets with local labor: often 15-30% below."
            },
            {
              heading: "Land Cost as Percent of Total",
              body: "Healthy build economics keep land at 20-30% of total finished value. Above 35% and margins get thin. Above 40% and the deal often doesn't work unless ARV is unusually strong. Example: $450K ARV property with $65K land = 14% ratio (very healthy). $450K with $160K land = 36% (stretched). Use this ratio as a quick screen before going deep on a land deal."
            },
            {
              heading: "Build Time as a Cost",
              body: "Typical single-family build: 7-12 months from groundbreaking to CO. Pre-construction (permits, plans, utility arrangements): 3-9 months. Total project timeline: 10-21 months from land purchase to finished home. Financing costs compound over this period — longer timeline, more interest. This is why experienced builders run 5-10 projects simultaneously: cost and timeline averages smooth out across a portfolio."
            },
            {
              heading: "Risk Profile vs Flipping and BRRRR",
              body: "New construction risks: entitlement/permitting delays (3-12 months added), construction cost overruns (10-25% typical), interest rate changes during long timeline, material price volatility, labor availability, weather delays, code compliance issues, market shifts during build. Rewards: higher margins than flips when executed well, differentiated product in the market, potential for repeat projects with same builder and plans. Higher complexity, not a starter strategy."
            }
          ]
        },
        "land-acquisition": {
          title: "Land Acquisition and Due Diligence",
          icon: <MapPin size={14} />,
          sections: [
            {
              heading: "Types of Land",
              body: "Infill lots: existing neighborhoods with vacant or teardown lots. Easiest because utilities exist, neighborhood sold comps available, zoning typically residential-by-right. Subdivision lots: pre-developed lots in new subdivisions, premium pricing but turnkey for construction. Raw land: unsubdivided, may require entitlement. Land with old structure: teardown situations, sometimes cheaper per lot than infill. For first-time builders, infill lots are strongly recommended."
            },
            {
              heading: "Entitlement Status — What Can You Build?",
              body: "Before buying land, verify: current zoning classification, permitted uses in that zoning, setbacks and height restrictions, lot coverage maximums (footprint as % of lot), parking requirements, minimum lot size for proposed use, overlay districts (historic, environmental, flood), variances required (avoid unless you know the local planning department will grant). One zoning miscalculation can kill a project — consult a land-use attorney or municipal planner before close."
            },
            {
              heading: "Utility Availability",
              body: "Critical: (1) Water — public water service at the lot line, or well-drilling viable? (2) Sewer — public sewer at lot line, or septic system feasible and permitted? (3) Electric — service at the lot? How far from pole? (4) Gas — natural gas available, or propane/electric heat required? (5) Telecom — fiber/cable/phone service. Utility extensions can cost $20K-$100K+ if far from infrastructure. Get written commitments from utility companies before close."
            },
            {
              heading: "Soil and Site Conditions",
              body: "Soil testing (percolation test for septic, soil bearing capacity for foundation): $500-$2,500. Required before septic design and foundation engineering. Poor soil can require: engineered foundation (+$15K-$40K), special drainage systems, excavation of problem soil (+$10K-$50K). Sloped lots require: retaining walls, regrading, specialty foundation work. Walk the site after heavy rain to see drainage patterns."
            },
            {
              heading: "Title and Deed Restrictions",
              body: "Standard title search plus: recorded subdivision covenants (may limit building style, size, materials), deed restrictions from prior owners, HOA rules if applicable, recorded easements (utility, drainage, access), adverse possession risks, boundary disputes. Buy title insurance. Read every recorded document in the title report. Subdivision covenants often include design review committees that approve house plans before building — factor into timeline."
            },
            {
              heading: "Environmental Due Diligence",
              body: "Environmental Phase I assessment ($1,500-$3,500): reviews historical uses, potential contamination, wetlands, endangered species. Required by most construction lenders for commercial projects, prudent for all builders. Red flags: former industrial or gas station sites, wetlands restrictions, protected species habitat, lead paint in any existing structures (requires EPA-certified demolition). Environmental issues can kill a project entirely or add $50K+ in remediation."
            }
          ]
        },
        "construction-loans": {
          title: "Construction Loans and Financing",
          icon: <DollarSign size={14} />,
          sections: [
            {
              heading: "How Construction Loans Work",
              body: "Construction loans fund in 'draws' tied to construction milestones rather than a lump sum at closing. Typical draw schedule (5-10 draws): foundation, framing, rough-in (plumbing/electric/HVAC), drywall, finishes, final. Lender inspects progress before each draw release. Interest accrues only on drawn amounts. Loan terms: 12-18 month duration, interest-only payments during construction, single-close or construction-to-permanent structures."
            },
            {
              heading: "Construction-to-Permanent (C-to-P) Loans",
              body: "Popular structure: one closing covers both construction and permanent mortgage. When CO is issued, loan converts automatically to a 30-year mortgage with pre-agreed terms. Advantages: single set of closing costs, rate locked at application (protection against rate increases during build), no second application. Typical terms: 20-25% down on total project cost, 7-9% rate in 2024-2025, 30-year amortization post-conversion."
            },
            {
              heading: "Single-Close Construction Loans (Investor)",
              body: "For investors who'll sell or refinance at completion rather than hold: 12-18 month interest-only construction loan, then either pay off with sale proceeds or refinance with a DSCR or conventional investment loan. Higher rates (9-12%) than C-to-P. Advantages: flexibility on exit, don't commit to terms for long hold before building. Typical lenders: regional banks, portfolio lenders, non-QM construction specialists."
            },
            {
              heading: "Documentation Required",
              body: "Construction loan packages are document-heavy. Required: architect-stamped plans, detailed construction budget itemized by trade, contractor's builder risk insurance, contractor's license and insurance, builder/owner contract, schedule of values showing cost allocations, preliminary title, soil report, survey, appraisal of subject (based on plans and specs), personal financial statement, last 2 years tax returns. Expect 45-75 day close timeline."
            },
            {
              heading: "The 'Builder Risk' Appraisal",
              body: "Construction lenders appraise based on proposed plans — the 'subject to completion' value. Appraiser reviews plans, specs, and comparable finished construction in the area. Low appraisal = reduced loan amount = more cash you bring. Appraiser packet matters: provide your 3-6 best comps of similar new construction in the same area, photos of prior projects if available, plans and specs clearly presented."
            },
            {
              heading: "Contingency and Soft Cost Buffer",
              body: "Build 10-15% contingency into your budget before financing — lenders will fund you based on total budget including contingency. Soft costs that can be financed: architect fees, engineering, permits, impact fees, utility hookups, builder risk insurance. Uncovered: legal fees, marketing, furnishings (for STR or spec). Plan your cash needs beyond the loan: $40K-$100K of personal cash typical for mid-size build."
            }
          ]
        },
        "builder-architect": {
          title: "Builder, Architect, and Permitting",
          icon: <Users size={14} />,
          sections: [
            {
              heading: "Selecting a General Contractor",
              body: "Interview 3-5 GCs before hiring. Verify: state license in good standing, liability insurance ($1M+), workers comp, references from 5+ past clients (call them), ideally visit 2-3 completed projects. Red flags: wants large upfront payment (standard is 10% at signing), can't provide detailed line-item budget, dismissive of change order process, has pending lawsuits or complaints. A $300K build with a bad GC becomes a $400K nightmare with a court case attached."
            },
            {
              heading: "Fixed-Price vs Cost-Plus Contracts",
              body: "Fixed-price: GC commits to a lump sum for specified work. Advantages: budget certainty for you. Disadvantages: GC pads for risk, change orders contentious. Cost-plus: you pay actual costs plus GC markup (typically 15-20%). Advantages: no pad, flexibility. Disadvantages: no cost ceiling, requires careful oversight. Hybrid: guaranteed maximum price (GMP) combines fixed cap with cost-plus flexibility. For first-time builders: fixed-price with clear scope and change order procedures."
            },
            {
              heading: "Architect and Engineering Fees",
              body: "Architect fees: 6-15% of construction cost (lower for simpler projects, higher for custom). Structural engineering: $2K-$8K for residential. Civil engineering (site plans): $3K-$10K. Mechanical/electrical/plumbing engineering: $2K-$6K. Survey: $500-$2K. Soils report: $500-$2,500. Total soft costs typically 8-15% of hard construction cost. Pre-purchase plans/stock plans reduce architect fees to $2K-$6K for customization."
            },
            {
              heading: "Permitting Process",
              body: "Typical residential permit timeline: 2-12 weeks depending on jurisdiction. Fast jurisdictions (small suburbs, unincorporated areas): 2-4 weeks. Slow jurisdictions (California cities, urban centers): 3-8 months for complex projects. Permit fees: 0.5-2% of construction cost. Impact fees (for schools, transportation, parks): $5K-$25K in growth areas. Plan reviewers request revisions — factor 2-3 rounds of revisions into timeline."
            },
            {
              heading: "Change Orders",
              body: "Mid-construction changes cost 2-5x what the same work would cost if planned originally. Reasons: time lost, rework required, GC markup on change orders (15-30%), materials ordering complications. Plan thoroughly upfront. When changes are needed (and they will be), document in writing via signed change order including cost, timeline impact, and scope specifics. Never verbal — verbal change orders become legal disputes."
            },
            {
              heading: "Inspections and Certificate of Occupancy",
              body: "Construction triggers multiple required inspections: foundation, framing, rough plumbing, rough electrical, rough HVAC, insulation, drywall, final plumbing, final electrical, final HVAC, final inspection. Each must pass before proceeding. Failed inspection = reinspection fees + timeline delay. Certificate of Occupancy (CO) issued after final inspection — property is now legally habitable. No CO = no move-in, no refinance, no sale."
            }
          ]
        },
        "build-process": {
          title: "The Build Process Stage by Stage",
          icon: <Hammer size={14} />,
          sections: [
            {
              heading: "Pre-Construction (Months 1-6)",
              body: "Activities: land purchase, architectural design, permit application, engineering (structural, civil, MEP), surveying, soil testing, construction loan closing, GC selection and contract. Deliverables: permits issued, construction drawings finalized, GC under contract, loan funded. This phase often takes longer than construction itself. Errors here (inadequate plans, skipped engineering) cause massive problems later."
            },
            {
              heading: "Site Work and Foundation (Months 6-7)",
              body: "Lot preparation: clearing, grading, excavation. Utility trenches installed. Foundation poured — slab, crawlspace, or basement depending on region and design. Waterproofing for basements. Drainage installed. This phase is weather-dependent (can't pour concrete in freezing or very wet conditions). Budget delays: 2-4 weeks weather typical. Post-foundation inspection before framing begins."
            },
            {
              heading: "Framing and Exterior (Months 7-8)",
              body: "Framed shell: floors, walls, roof. Roof sheathing and shingles/metal/tiles applied. Exterior sheathing and house wrap. Windows and doors installed. Siding begins. End of this phase: the house is 'dried in' — enclosed against weather. Framing inspection required before rough-in trades. First substantial visible progress milestone."
            },
            {
              heading: "Rough-In Trades (Months 8-9)",
              body: "Plumbing, electrical, HVAC, low-voltage (internet, cable, security) all installed inside the framed walls before drywall. Inspected at rough-in stage — crucial inspection because drywall hides everything afterward. Change orders during rough-in still manageable; changes after drywall are expensive. Walk the house with contractors during this phase to verify outlet locations, lighting plans, etc."
            },
            {
              heading: "Drywall, Trim, Finishes (Months 9-11)",
              body: "Insulation installed before drywall. Drywall hung, taped, mudded — longest finish sub-phase. Interior paint. Flooring installed. Trim and doors hung. Kitchen cabinets installed. Countertops templated, fabricated, installed (3-week lag typical for stone). Bathroom tile, vanities, fixtures. Appliances delivered and installed. This is the 'magical' phase where the raw shell becomes a finished home."
            },
            {
              heading: "Punch List and CO (Month 11-12)",
              body: "Final mechanical trims (outlet covers, switch plates, faucets, fixtures). Landscaping and grading finished. Driveway poured and cured. Final cleaning. Walkthrough with you — document punch list items. GC completes punch list items (typically 2-4 weeks). Final inspection. CO issued. Loan converts to permanent or property is ready for sale. Budget 4-8 weeks from 'substantially complete' to truly ready."
            }
          ]
        },
        "spec-vs-custom": {
          title: "Spec Home vs Custom Build Economics",
          icon: <TrendingUp size={14} />,
          sections: [
            {
              heading: "The Two Models",
              body: "Spec build: you build speculatively — no buyer identified — and sell to the retail market at completion. You own the risk and reward of market timing. Custom build: buyer commits upfront with contract, you build to their specifications, they take title at completion or close on the finished home. Spec = more risk and more potential reward; custom = less risk and thinner margins but faster capital turnover."
            },
            {
              heading: "Spec Home Margins and Risk",
              body: "Target spec margins: 18-25% net of all costs and financing. Example: $500K ARV, total cost $380K, profit $120K (24%). Risks: market downturn during build, inability to price correctly for actual demand, carrying costs extending post-completion, buyer preferences mismatch (wrong room configuration, finish level). Best markets for spec: appreciating, undersupplied, 15-30 day DOM on finished comparables."
            },
            {
              heading: "Custom Build Margins and Structure",
              body: "Target custom margins: 12-18% of construction cost (lower than spec, less risk). Buyer contracts typically include: deposit (5-10% of price), progress payments tied to construction milestones, final payment at CO. Protects you from build-and-can't-sell risk. Downside: buyer change orders can be contentious, buyer walkthroughs during build slow progress, buyer financing issues can kill mid-stream deals."
            },
            {
              heading: "Design Decisions for Spec Homes",
              body: "Build broadly appealing, not personally-preferred. Modern farmhouse exterior aesthetics outsell other styles in most US markets. Floor plan priorities: open concept kitchen/family, primary bedroom on main level (for multi-generational appeal), 3-4 bedrooms, 2.5-3 baths, mudroom or drop zone, laundry on main or near bedrooms, home office or flex room. Avoid: overly small closets, galley kitchens, split-level designs, wall-to-wall carpet in main living."
            },
            {
              heading: "Pre-Selling During Build",
              body: "Marketing spec homes during construction: stake sign 'Coming Soon,' professional rendering signage, drip marketing to your buyer list and agent network, list on MLS as 'under construction' once substantially enclosed. Pre-selling before CO: reduces carrying costs, locks in sale price before market can shift, eliminates staging cost. Offer small customization options (paint colors, light fixtures) to pre-sale buyers to increase conversion."
            },
            {
              heading: "Scaling a Construction Business",
              body: "Experienced builders run 3-10+ projects simultaneously. Keys: standardized plans (2-3 approved designs with customization options), repeating GC and sub-contractor teams, consistent lender relationships, bulk purchasing relationships (cabinets, flooring, appliances). Scale tends to reduce per-unit costs 5-15% and eliminate the learning curve. Most single-project builders who tried 'just one house' stop after one — the complexity and risk require either commitment to scaling or one-and-done acceptance."
            }
          ]
        }
      }
    },
    analysis: {
      title: "Property Analysis",
      icon: <Calculator size={16} />,
      topics: {
        "key-metrics": {
          title: "Key Investment Metrics Explained",
          icon: <BarChart3 size={14} />,
          sections: [
            {
              heading: "Cash Flow",
              body: "The monthly cash left over after collecting rent and paying all expenses: mortgage principal & interest (P&I), property taxes, insurance, property management, vacancy reserves, repairs & maintenance reserves, capital expenditure reserves, HOA fees, and utilities (if landlord-paid). Formula: Monthly Cash Flow = Gross Monthly Rent − All Monthly Expenses. Positive cash flow is non-negotiable for most investors — it means the property pays you every month to own it, regardless of appreciation."
            },
            {
              heading: "Cap Rate (Capitalization Rate)",
              body: "A measure of return independent of financing, useful for comparing properties. Formula: Cap Rate = Net Operating Income (NOI) / Property Value. NOI excludes mortgage payments. A property producing $18,000/year in NOI on a $250,000 value has a 7.2% cap rate. Cap rates are market-dependent: 4-5% is typical in premium coastal markets, 6-8% in secondary markets, 9%+ in tertiary or distressed markets (higher cap rate = lower price = more perceived risk)."
            },
            {
              heading: "Cash-on-Cash Return (CoC)",
              body: "Annual pre-tax cash flow divided by total cash invested. Unlike cap rate, CoC accounts for leverage. Formula: CoC = Annual Cash Flow / Total Cash Invested x 100. Example: $4,800/yr cash flow on $40K invested = 12% CoC. Target CoC ranges: 8-10% is solid, 10-15% is strong, 15%+ is excellent (but check for hidden risks). Post-BRRRR refinance, CoC often becomes 'infinite' because you have zero cash left in the deal."
            },
            {
              heading: "Net Operating Income (NOI)",
              body: "Annual gross rental income minus all operating expenses (taxes, insurance, management, vacancy, maintenance, utilities), but BEFORE debt service. NOI is the standard income metric for commercial real estate valuation and is directly used in cap rate calculations. A $2,500/mo rental with $900/mo in operating expenses produces NOI of $19,200/year."
            },
            {
              heading: "Gross Rent Multiplier (GRM)",
              body: "Property price divided by annual gross rent. A $200,000 property renting for $1,800/month ($21,600/year) has a GRM of 9.3. Lower is better. Useful for quick market comparisons without needing expense data, but a rough metric — doesn't account for expenses, vacancy, or property condition. Use GRM for screening, cap rate and CoC for decision-making."
            },
            {
              heading: "Debt Service Coverage Ratio (DSCR)",
              body: "NOI divided by annual debt service (mortgage P&I). A DSCR of 1.25 means the property produces 25% more income than the mortgage payment. Most DSCR lenders require 1.2-1.25 minimum; some require 1.0 (breakeven) with rate pricing adjustments. A property with $18K NOI and $14K in mortgage payments has a DSCR of 1.29."
            },
            {
              heading: "Loan-to-Value (LTV)",
              body: "Loan amount divided by property value. $200K loan on $250K property = 80% LTV. Investment property LTV maxes out at 80% for purchases, 75% for cash-out refinances under most conventional programs. Lower LTV = more equity cushion = better loan terms, but also more cash tied up."
            },
            {
              heading: "Total Return / Internal Rate of Return (IRR)",
              body: "Sophisticated metric that accounts for the time value of money across the full hold period: cash flow, principal paydown, appreciation, and sale proceeds. IRR calculates the annualized return that equates your initial investment with all future cash flows. Typically 15-20% IRR is strong for rental real estate. Requires modeling assumptions (appreciation rate, rent growth, exit cap rate) — garbage in, garbage out."
            }
          ]
        },
        "the-rules": {
          title: "The Famous Rules: 70%, 1%, 2%, 50%",
          icon: <Percent size={14} />,
          sections: [
            {
              heading: "The 70% Rule (for BRRRR and Flips)",
              body: "Max All-In Cost = ARV x 0.70. The 30% gap covers closing costs (2-3%), holding costs (3-5%), refinance costs (2-3%), and your profit margin (15-20%). In hot markets, investors stretch to 75%. In cold markets, disciplined investors hold at 65%. Example: ARV $300K x 70% = $210K max all-in. If rehab is $45K, max purchase is $165K."
            },
            {
              heading: "The 1% Rule (for Rentals)",
              body: "Monthly rent should be at least 1% of the total acquisition cost. A $180,000 all-in property should rent for $1,800/month. This is a screening heuristic, not a deal-maker. It works as a quick sanity check: properties that fail 1% almost always produce negative cash flow after expenses. Properties that clear 1% may or may not cash flow — you still have to run full numbers."
            },
            {
              heading: "The 2% Rule (Aggressive Cash Flow)",
              body: "The 1% rule's more demanding cousin: 2% of all-in cost in monthly rent. A $100K property renting for $2,000/month. Achievable only in truly distressed markets (rust-belt urban cores, rural) where purchase prices are rock-bottom. Properties hitting 2% often have hidden issues: crime, tenant class challenges, population decline. Don't chase 2% without understanding why the numbers are that good."
            },
            {
              heading: "The 50% Rule (Expense Estimation)",
              body: "Operating expenses (excluding mortgage) consume roughly 50% of gross rent over the long run. Includes: taxes, insurance, vacancy, management, repairs, capex, utilities if landlord-paid. A property renting for $2,000/month will average $1,000/month in operating expenses across a multi-year hold. If mortgage P&I is $800/month, cash flow is $200/month. This is a long-run average — in a good year expenses might be 35%; in a bad year, 65%."
            },
            {
              heading: "Putting The Rules Together",
              body: "Professional analysis uses the rules as quick filters, then confirms with itemized projections. Workflow: (1) Does it clear 1% rent-to-price? If no, pass. (2) Does purchase + rehab fit the 70% Rule? If no, re-negotiate or pass. (3) Do detailed expense projections beat the 50% Rule? If no, budget more conservatively. (4) Final decision based on cash flow, CoC, and strategic fit — not the rules."
            }
          ]
        },
        "arv-estimation": {
          title: "Estimating ARV: The Appraiser's Process",
          icon: <Target size={14} />,
          sections: [
            {
              heading: "What ARV Means",
              body: "After Repair Value is what the property will appraise for once renovations are complete. It's the single most important number in a BRRRR or flip — if you're wrong by 10%, the deal can fail. ARV determines both your maximum allowable offer and your eventual refinance loan amount. Don't outsource this estimate to wholesalers or listing agents, who have incentives to inflate it."
            },
            {
              heading: "The Comparable Sales (Comps) Approach",
              body: "Appraisers and informed investors estimate ARV by analyzing recent sold properties nearby with similar characteristics. Criteria for a 'good comp': sold within the last 6 months (ideally 3), within 0.5-1 mile radius, similar square footage (+/- 15%), same bedroom/bathroom count, similar condition post-rehab, same school district, similar lot size, similar style (ranch, 2-story, etc.). Use 3-6 comps, not 1-2."
            },
            {
              heading: "Sources for Comp Data",
              body: "Professionals use the MLS, which requires an agent. Free alternatives: Zillow (approximate), Redfin (good for recent sales), Realtor.com, county assessor sites (lag behind market but accurate), PropStream or DealMachine (paid but comprehensive). Never rely on Zillow Zestimate for investment decisions — it's an algorithmic estimate that can be off by 20% in either direction."
            },
            {
              heading: "Price-Per-Square-Foot Method",
              body: "Quick sanity check: calculate $/sqft on recent comp sales, average them, multiply by subject property sqft. If 3 comps sold at $158, $165, $161 per sqft and your 1,600 sqft subject averages $161/sqft, ARV estimate is $258K. This method is most reliable when comps are tight in size and condition. Less reliable across varying floor plans (a home with more bedrooms typically sells higher $/sqft than one with larger bedrooms)."
            },
            {
              heading: "Adjustments for Differences",
              body: "No two properties are identical. Appraisers adjust comp values for differences: +$5K-$15K for extra bedroom, +$5K-$10K for extra bathroom, +$10K-$25K for garage vs no garage, +$15K-$50K for finished basement, +/-$5K for major upgrades or defects. Adjustments should be conservative — err low on subject property value, high on comp negatives."
            },
            {
              heading: "Defending Your ARV to the Appraiser",
              body: "When the refinance appraiser visits, hand them a folder: your three strongest comps with MLS printouts, photos of your completed rehab scope, a one-page list of upgrades with receipts, and the neighborhood's recent sale trajectory. Most appraisers accept well-prepared investor packets — it makes their job easier and gives them cover for a higher value. This practice is legal, common, and often decisive."
            }
          ]
        },
        "rehab-budgeting": {
          title: "Rehab Budgeting and Scope",
          icon: <Hammer size={14} />,
          sections: [
            {
              heading: "Ranges by Rehab Level",
              body: "Light cosmetic (paint, carpet, fixtures, cleaning): $10-$20/sqft. Medium rehab (kitchen and bath refresh, new flooring, some systems): $25-$40/sqft. Heavy rehab (full kitchen/bath gut, new electrical/plumbing, HVAC, roof): $45-$70/sqft. Full gut including structural: $75-$125/sqft. These are 2025 national averages — high-cost metros (Bay Area, NYC, Boston) run 40-80% higher. Rural markets run 15-30% lower."
            },
            {
              heading: "The Renovation Hierarchy (In Order of Priority)",
              body: "For rental properties, always address in this order: (1) Safety & code violations — fire hazards, electrical issues, structural, lead paint, mold; (2) Mechanical systems — HVAC, plumbing, electrical, roof, water heater; (3) Envelope — windows, siding, insulation; (4) Interior finishes — kitchens, baths, flooring, paint; (5) Cosmetic — landscaping, fixtures, hardware. Cutting corners on (1) or (2) creates future expenses that dwarf what you saved."
            },
            {
              heading: "Kitchen Renovations for Rentals",
              body: "Rental-grade kitchen budget: $6,000-$12,000. Typical scope: new stock cabinets (or paint existing), mid-grade quartz or butcher-block counters, stainless appliance package ($1,800-$2,400), LVP flooring ($4-$6/sqft installed), single-basin stainless sink, widespread faucet, new outlets and lighting. Avoid high-end tile backsplashes and custom cabinetry — they don't increase rental appraisal much in most markets."
            },
            {
              heading: "Bathroom Renovations for Rentals",
              body: "Rental-grade full-bath budget: $3,500-$6,500 for a standard gut. Scope: new tub/shower (fiberglass insert, not tile, unless high-end market), new toilet, vanity with integrated top, moisture-resistant flooring, new lighting, exhaust fan. Subway tile remains timeless and cheap. Avoid ornate tile patterns that date quickly."
            },
            {
              heading: "Flooring Decisions",
              body: "Luxury Vinyl Plank (LVP) is the rental market standard: waterproof, scratch-resistant, looks like wood, $4-$6/sqft installed. Use in all main living areas and kitchens. Carpet only in bedrooms (cheap replaceable carpet is actually fine: $2-$3/sqft installed, replace between tenants). Avoid hardwood refinishing in rentals — expensive and easily damaged."
            },
            {
              heading: "The Contingency Line",
              body: "Every rehab budget should include a 15-20% contingency for unknowns. On a $40K rehab, that's $6K-$8K. Unknowns always exist: rotten subfloor under the tub, outdated electrical panel that fails code, termites in the sill plate, lead paint remediation. Investors who skip contingency are investors who end up borrowing money mid-rehab at punitive rates."
            },
            {
              heading: "Permits: When to Pull Them",
              body: "Most jurisdictions require permits for: electrical changes, plumbing changes beyond fixture swaps, HVAC, structural alterations, additions. Unpermitted work creates problems at refinance (appraiser may flag it), at sale (disclosure obligations), and at insurance claim time (denied claims). Budget for permits: $500-$2,000 depending on scope. Permit timelines can add 2-8 weeks to a project — factor into your holding cost projections."
            },
            {
              heading: "Contractor Management",
              body: "Never pay more than 10-20% upfront. Use a draw schedule tied to milestones: e.g., 20% on contract signing, 30% on rough-in complete, 30% on drywall complete, 20% on final walkthrough. Require lien waivers before each draw. Get three written bids for any job over $5K. Verify licenses and insurance on every tradesperson — unlicensed contractors can't file liens but can still sue, and their insurance won't cover injuries on your property."
            }
          ]
        },
        "due-diligence": {
          title: "Due Diligence Checklist",
          icon: <FileText size={14} />,
          sections: [
            {
              heading: "The Property Walkthrough",
              body: "Walk every room with the seller or listing agent first, then a second time alone with a notepad. Document: exterior condition (roof age, siding, foundation cracks, drainage, trees near structure), mechanicals (HVAC age/condition, water heater age, electrical panel age/amperage, plumbing material visible), interior (flooring under tiles/carpet, ceiling stains indicating roof leaks, door and window operation, kitchen and bath water damage). Take 75-100 photos — you'll want them during analysis and for contractor bidding."
            },
            {
              heading: "The Professional Inspection",
              body: "Budget $400-$700 for a full property inspection. Never skip this to save money or win a deal. Specialty inspections to add as warranted: sewer scope ($175-$350, essential for pre-1970s homes), termite inspection ($75-$150, essential in warm climates), mold testing ($300-$500 if visible water damage), foundation inspection (if cracks observed, $300-$500), roof inspection (if age >15 years, $150-$300), radon test (essential in northern climates, $150-$250)."
            },
            {
              heading: "Title Search and Insurance",
              body: "Your title company performs a title search as part of closing. Key things they check: open liens (mortgages, tax liens, mechanic's liens, judgments), easements (utilities, access, shared driveways), boundary disputes (surveys should match deed), chain of title (clean transfers back 30+ years). Red flags: open liens that won't be satisfied at closing, lis pendens (pending lawsuit), unresolved easements, missing links in chain of title. Buy an owner's title insurance policy — one-time fee of 0.5-1% of purchase price, lifetime protection."
            },
            {
              heading: "Financial Due Diligence",
              body: "Before closing, verify: property tax history (check assessor site — taxes after sale may reassess higher), insurance quotes (get a real quote before closing, not just an online estimate), HOA docs if applicable (dues, restrictions, pending assessments, rental restrictions), utility costs (ask seller for 12 months of bills), existing lease if tenanted (review all terms, check if below-market), rent roll and estoppel letters for multifamily."
            },
            {
              heading: "Zoning and Permit Verification",
              body: "Check: zoning classification (matches your intended use?), any overlay districts, setback requirements, parking requirements, rental licensing requirements (some cities require landlord registration), STR regulations (if relevant), any code violations on file (pull permits history from building department). Open permits from prior work that were never closed can become your problem at sale."
            },
            {
              heading: "Neighborhood Verification",
              body: "Drive the neighborhood at 8am, 1pm, 6pm, and 10pm. Different times reveal different issues: morning commute traffic, midday quiet or activity, evening post-work neighborhood feel, nighttime safety. Talk to 2-3 neighbors — they'll share honest intel you won't get anywhere else. Check the sex offender registry, recent police calls to the address, and crime heat maps."
            },
            {
              heading: "Environmental and Structural Red Flags",
              body: "Near-automatic deal-killers: foundation movement beyond hairline cracks, active roof leaks with interior damage, knob-and-tube or aluminum wiring (retrofit cost: $10K-$25K), cast iron or galvanized supply plumbing (replacement cost: $8K-$20K), sewer line breaks under slab, underground oil tanks (remediation $5K-$50K), meth contamination (remediation $10K-$50K and disclosure follows forever), presence of asbestos in HVAC or flooring (removal required before most rehabs), lead paint in occupied rentals (federal disclosure + EPA RRP certified contractors required)."
            }
          ]
        },
        "running-numbers": {
          title: "Running Numbers: Complete Walkthrough",
          icon: <Calculator size={14} />,
          sections: [
            {
              heading: "Step 1 — Gather Inputs",
              body: "You need 12 inputs minimum: asking price, estimated ARV (from comps), estimated rehab cost (from walkthrough), estimated market rent (from Rentometer + local comps), property taxes (from assessor), insurance estimate (from quick quote), HOA/condo fees if any, expected vacancy rate (usually 8-10%), property management rate (8-10%), maintenance reserve ($100-$200/month), CapEx reserve ($200-$400/month), and your financing assumptions (down %, rate, term)."
            },
            {
              heading: "Step 2 — Maximum Allowable Offer",
              body: "MAO = (ARV x 0.70) − Rehab − Closing Costs − Desired Profit Margin. Example: ARV $265,000, rehab $35,000, target 10% equity at refi. MAO = ($265K x 0.70) − $35K − ($265K x 0.03 closing) − ($265K x 0.10 margin) = $185,500 − $35K − $7,950 − $26,500 = $116,050. If asking price is $135K, you need to negotiate to $116K or lower — or pass."
            },
            {
              heading: "Step 3 — Itemized Rehab Budget",
              body: "Itemize major buckets: exterior (roof if needed, siding, paint, landscaping), interior paint, flooring, kitchen, bathrooms, mechanicals (HVAC, plumbing, electrical, water heater), windows if needed, permits and misc. For a $35K budget on a 1,500 sqft home: $1,200 exterior cleanup + $2,800 interior paint + $8,500 LVP flooring 1,300 sqft + $9,000 kitchen + $5,000 one bathroom + $2,500 mechanicals + $1,500 permits and misc + $4,500 contingency (15%)."
            },
            {
              heading: "Step 4 — Post-Refi Cash Flow Calculation",
              body: "Calculate post-refi monthly cash flow assuming 75% LTV on ARV. ARV $265K x 75% = $198,750 loan. At 8% / 30 years = $1,457/month P&I. Property taxes $185/mo, insurance $105/mo, vacancy $146/mo (8%), management $146/mo (8%), maintenance $150/mo, CapEx $250/mo. Total expenses: $2,439. Rent $1,825 minus expenses $2,439 = ($614) NEGATIVE cash flow. This deal breaks at full refi — the numbers are telling you something important."
            },
            {
              heading: "Step 5 — Adjust or Walk",
              body: "Negative cash flow means options: (1) refi at lower LTV — 65% LTV = $172K loan, $1,260 P&I, cash flow still negative at ($417). (2) Negotiate purchase lower so you can refi at less than full LTV and still get capital out. (3) Rent higher — only valid if comps support it. (4) Skip the refi entirely — keep the rental long-term with smaller cash-out to cover hard money payoff. (5) Pass. The math doesn't care about how much you like the deal. Deals that don't cash flow at the analysis stage don't magically cash flow after closing."
            },
            {
              heading: "Step 6 — Stress Testing",
              body: "Before committing, run three downside scenarios: (A) ARV comes in 10% below estimate — does the deal still work? (B) Rehab runs 25% over budget — can you absorb? (C) Market rent is 10% below projected — does cash flow still pencil? (D) Interest rates rise 1.5% between acquisition and refi — is the refi still viable? Robust deals survive all four. Fragile deals pencil only with perfect execution — avoid them."
            },
            {
              heading: "The Lesson",
              body: "Most properties fail one of the two BRRRR tests: (1) the refinance math (can you get your capital out?), or (2) the cash flow test (does it pay you to hold it?). Running numbers on 100 properties to find 3 that pass both is normal. Don't fall in love with deals — the numbers either work or they don't."
            }
          ]
        }
      }
    },

    financing: {
      title: "Financing & Capital",
      icon: <PiggyBank size={16} />,
      topics: {
        "loan-types": {
          title: "Complete Guide to Loan Types",
          icon: <DollarSign size={14} />,
          sections: [
            {
              heading: "Conventional Investment Property Loans",
              body: "Fannie Mae / Freddie Mac conforming loans for 1-4 unit investment properties. Requirements: 20-25% down for single-family (25% for cash-out refi), 720+ credit score for best pricing, 6 months reserves per financed property. Rate premium vs primary residence: +0.5% to +1.0%. Maximum 10 financed properties per borrower across both Fannie and Freddie combined. Best for: core investors with strong W-2 income building early portfolio."
            },
            {
              heading: "DSCR (Debt Service Coverage Ratio) Loans",
              body: "Non-QM (non-qualified mortgage) loans that underwrite to the property's rental income rather than the borrower's personal income. Requirements: 20-25% down, 620+ credit score, no personal income or tax return documentation, property must cash-flow at or above 1.0-1.25 DSCR depending on program. Rate premium: +0.75% to +2.0% over conventional. No cap on number of financed properties. Best for: self-employed investors, those who've maxed conventional slots, investors with complex tax situations."
            },
            {
              heading: "Hard Money Loans",
              body: "Short-term, asset-based loans from private or semi-institutional lenders for acquisition and rehab. Typical terms: 10-14% interest, 2-4 points upfront, 6-18 month term, interest-only payments, 85-90% of purchase + 100% of rehab (often called '90/100' financing). Lender focuses on the deal's ARV, not borrower income. Use case: acquisition-rehab leg of BRRRR, or flips where conventional doesn't work. Critical: have your refinance or sale plan locked in before closing — hard money default rates are punishing."
            },
            {
              heading: "Private Money Loans",
              body: "Loans from individual lenders (family, friends, accredited investors in your network) secured by the property. Terms are fully negotiable — 6-10% interest is common, 0-2 points, flexible on term and extensions. Best for relationship-based deals where the lender trusts your track record. Document every private loan with a proper promissory note and recorded mortgage/deed of trust — handshake deals create legal nightmares."
            },
            {
              heading: "Home Equity Line of Credit (HELOC)",
              body: "A revolving credit line secured by the equity in your primary residence. Typical: prime + 0.5% to prime + 2.5% variable rate, draw period 10 years, repayment period 20 years. Very flexible — pay interest only on what you've drawn. Use cases: down payment / rehab funding, emergency reserves. Risk: variable rates can spike (many HELOCs repriced 3-5% higher during 2022-2023), and if the deal fails, your house is on the hook."
            },
            {
              heading: "Portfolio Loans",
              body: "Loans held 'in portfolio' by a local bank or credit union rather than sold to Fannie/Freddie. Advantages: flexible underwriting (can work around complex self-employment, LLC-held properties, unusual property types), often blanket loans covering multiple properties. Disadvantages: slightly higher rates, require relationship-building, typically shorter amortization (20-year vs 30-year). Best for: investors with local banking relationships and atypical profiles."
            },
            {
              heading: "Seller Financing",
              body: "The seller carries part or all of the purchase price as a mortgage. Terms are fully negotiable: 5-8% interest is common, 5-20% down, 5-30 year amortization, often with a balloon payment at 5-10 years. Works best when: seller owns property free-and-clear, is selling for tax reasons, or can't find a retail buyer. Advantages: flexible terms, faster closing, no institutional underwriting. Downsides: often requires higher purchase prices, must refinance into conventional at balloon."
            },
            {
              heading: "Owner-Occupant Loans (FHA, VA, Conventional 5%)",
              body: "If you'll live in the property for at least 12 months, you qualify for dramatically better terms: FHA (3.5% down, lower credit requirement, allows 2-4 unit properties), VA (0% down for veterans, no PMI, 2-4 unit allowed), conventional 5% down. House hacking strategy: buy a duplex/triplex/quadplex, live in one unit, rent the others. After 12 months you can keep the low-down-payment loan and move out. The single most capital-efficient way to start a rental portfolio."
            },
            {
              heading: "Commercial Loans (5+ Unit Properties)",
              body: "Required for any property with 5+ residential units or any commercial use. Typical terms: 25-30% down, 5-year fixed / 25-year amortization with balloon at 5, DSCR-based underwriting (1.25+ required), recourse or non-recourse options. Rate premium: +0.5 to +1.5% over residential. Higher complexity but better economics at scale — commercial properties are valued on NOI, so forced appreciation from operational improvements directly increases equity."
            }
          ]
        },
        "refinancing": {
          title: "Refinancing: Timing, Lenders, Strategy",
          icon: <RefreshCw size={14} />,
          sections: [
            {
              heading: "Rate-and-Term vs Cash-Out Refinance",
              body: "Rate-and-term: refinance for the same loan amount (or less) to get a better rate or term. Typical max 80-85% LTV. Cash-out: refinance for more than you owe, pulling the difference out as cash. Typical max 70-75% LTV for investment properties. Cash-out is the BRRRR exit mechanism; rate-and-term is for optimizing existing debt."
            },
            {
              heading: "Seasoning Requirements",
              body: "Most conventional lenders require you to own the property for 6-12 months before they'll refinance based on appraised value rather than purchase price (the 'delayed financing' rule is an exception, allowing immediate refi of cash-purchased property up to 80% LTV). DSCR lenders are often more flexible: 3-6 months seasoning is common, some do no-seasoning refinances with pricing adjustments. Always confirm seasoning in writing before acquisition."
            },
            {
              heading: "Shopping for Refinance Lenders",
              body: "Get quotes from at least 3 lenders: a conventional bank, a mortgage broker with access to DSCR wholesalers, and a local portfolio lender. Compare: rate, points, lender fees, LTV available, seasoning requirement, prepayment penalty (common on DSCR), appraisal cost, total closing costs. Rate alone is misleading — a 0.25% lower rate offset by $4K more in fees is worse on a short hold."
            },
            {
              heading: "Appraisal Management",
              body: "Your refinance hinges on the appraisal. Actions that help: hand the appraiser a comps packet, have the property professionally cleaned before the visit, leave a one-page list of renovations with dates and costs, ensure all mechanical systems are accessible and functional. Actions that hurt: aggressive cleaning that reveals flaws previously hidden, discussing your 'hope' for a value (stay factual), failing to have utilities on (appraiser may reschedule)."
            },
            {
              heading: "When Appraisal Comes In Short",
              body: "Three options: (1) Accept the lower value and bring cash to close the gap — sometimes worth it if the property is strong otherwise. (2) Appeal the appraisal with new comps — success rate is low (10-15%) but free. (3) Walk away from the refinance and keep the current financing — works if your current loan is tolerable. Never pressure the appraiser — it's unethical and won't change the outcome, just creates risk."
            },
            {
              heading: "Prepayment Penalties",
              body: "Many DSCR loans carry prepayment penalties (PPP): 3-2-1 (3% year 1, 2% year 2, 1% year 3), 5-4-3-2-1, or 5-year flat 5% PPP. If you might refinance or sell within the PPP period, negotiate the PPP out (costs +0.25% to +0.5% in rate typically) or factor the exit penalty into your analysis. On a $250K loan, a 3% PPP is $7,500 — a significant drag on returns."
            }
          ]
        },
        "building-capital": {
          title: "Building and Recycling Capital",
          icon: <TrendingUp size={14} />,
          sections: [
            {
              heading: "The Capital Stack",
              body: "Every deal's funding is a 'stack' of capital sources layered by seniority: senior debt (the main mortgage), mezzanine debt (second-position loans), preferred equity (gets paid before common but after debt), common equity (you). Each layer takes more risk and demands higher returns. Beginning BRRRR investors typically use only senior debt + common equity (themselves). Experienced operators leverage the full stack to scale faster."
            },
            {
              heading: "HELOC into BRRRR into Repay HELOC Cycle",
              body: "Classic early-stage investor cycle: (1) Draw $60K from HELOC for down payment + rehab on BRRRR #1. (2) Complete BRRRR, refinance, pull $55K cash out. (3) Pay down HELOC with refinance proceeds. (4) HELOC is now available again for the next deal. Requires clean BRRRR math — partial BRRRRs leave HELOC debt drag."
            },
            {
              heading: "1031 Exchange for Tax-Deferred Scaling",
              body: "IRS Section 1031 allows you to sell an investment property and reinvest the proceeds into a 'like-kind' replacement property without paying capital gains tax. Requirements: identify replacement property within 45 days, close within 180 days, use a qualified intermediary (not the seller's own bank account). Massive wealth-building tool — can defer gains indefinitely across decades of upgrades."
            },
            {
              heading: "Syndication: Raising Other People's Money",
              body: "Partnering with multiple passive investors on larger deals. Typical structure: general partner (you) + limited partners (capital providers). LPs put up 90% of equity, earn preferred return (6-8%) and share of profits; GP earns sponsorship fees plus back-end split (20-30%). Requires securities compliance (Reg D 506(b) or 506(c)), legal counsel, and track record. Best path to scaling beyond personal-capital deals, but not a starting point."
            },
            {
              heading: "Self-Directed IRA / Solo 401(k) Investing",
              body: "Use retirement account funds to invest in real estate. Self-directed IRAs can own rental property directly (with a custodian); Solo 401(k)s allow higher contribution limits and checkbook control. Restrictions: no personal use of the property, can't lend to yourself, all expenses/income must flow through the account. Unrelated Business Income Tax (UBIT) applies if leverage is used inside an IRA. Complex — work with a specialized custodian and CPA."
            }
          ]
        },
        "creative-financing": {
          title: "Creative Financing Techniques",
          icon: <Sparkles size={14} />,
          sections: [
            {
              heading: "Subject-To (Taking Over Payments)",
              body: "Buyer takes title to property while the seller's mortgage stays in place. Buyer makes payments directly to the seller's lender. Strategic use: seller facing foreclosure, inherited property they can't afford, relocation. Pros: no new loan qualification, inherit low rate if the existing loan is favorable, fast closing. Cons: due-on-sale clause risk (lender can technically call the loan), title in your name but debt in theirs creates liability, seller remains legally on the hook. Requires: written agreement, authorization for information release, property in trust or LLC to reduce due-on-sale visibility. Advanced strategy — not beginner territory."
            },
            {
              heading: "Wraparound Mortgages",
              body: "Seller carries a new 'wrap' mortgage that 'wraps' around their existing mortgage. Buyer pays seller a single payment; seller pays their original lender. Spread between the two notes is the seller's profit. Works well when: seller's existing rate is low but they want income stream from sale, buyer can't qualify conventionally. Due-on-sale clause applies same as subject-to. Typically structured with attorney-drafted land trust or deed-of-trust + promissory note. Properly documented, this is a legitimate tool used across all markets."
            },
            {
              heading: "Land Contract / Contract for Deed",
              body: "Seller retains title until buyer completes payments over a defined term (5-30 years); buyer has equitable interest and possession. Default is simpler than foreclosure in most states — seller terminates contract, keeps all payments as rent, retakes property. Strategic for: buyers who can't qualify conventionally, sellers wanting monthly income with recapture security. Terms: typically 10-20% down, 7-9% interest, 5-year balloon common. Risk for buyer: no title transfer means no equity protection if seller defaults on their own mortgage or dies without estate planning."
            },
            {
              heading: "Lease Option (Lease + Option to Buy)",
              body: "Two separate agreements: a lease for 1-3 years with option to purchase at agreed price before expiration. Typical structure: market rent + 'rent credit' toward purchase (e.g., $1,800 rent with $300 credit if purchase exercised), option consideration upfront (1-5% of purchase price, non-refundable). Works when: buyer needs time to qualify for financing, seller wants income + future sale. Tax treatment matters — structure as pure lease + separate option, not combined sale."
            },
            {
              heading: "Seller Carry-Back Second Mortgage",
              body: "Buyer gets a conventional 80% first mortgage; seller carries the remaining 15-20% as a second. Reduces buyer's cash-to-close from 20% to 5%. Example: $200K property, $160K first mortgage, $30K seller second at 7%, $10K cash down. Seller benefits: higher effective sale price, interest income. Buyer benefits: lower cash commitment, access to otherwise unattainable property. Requires lender approval of the structure — many conventional lenders allow, some don't."
            },
            {
              heading: "JV Partnerships and Equity Splits",
              body: "Structure: capital partner puts up 70-100% of the equity, operator (you) brings sweat equity and deal sourcing. Common splits: 50/50 on profits after capital partner gets capital back + preferred return (often 6-8%). Written operating agreement required, filed with state. Use for: scaling beyond personal capital, accessing deals too large for solo execution, filling capital gaps while building credit. Downsides: partner relationships survive disagreements only with clear written terms; lawsuits between partners are common and expensive."
            },
            {
              heading: "The Risk Warning",
              body: "Creative financing is not a shortcut for inexperienced investors. Each technique has legal, tax, and ethical complexity. Retain a real estate attorney for every creative deal — the $500-$2,000 legal fee is dramatically cheaper than a dispute or lawsuit. Document everything in writing. Understand your state's specific laws — some states (CA, TX) have strong consumer protections that affect these structures. When done right, creative financing unlocks deals others can't touch. When done wrong, it lands you in court."
            }
          ]
        },
        "lender-relationships": {
          title: "Your Lender Relationship",
          icon: <Users size={14} />,
          sections: [
            {
              heading: "What Lenders Actually Look At",
              body: "Conventional investment property lending underwrites three things in priority order: (1) Credit score and history — 720+ gets best pricing, 680+ is acceptable, below 660 is subprime; (2) Debt-to-income ratio — total monthly debt payments should be <43% of gross monthly income for most programs, <50% for certain programs; (3) Reserves — 6-12 months of total payments on all financed properties (not just the subject) in liquid accounts. DSCR lenders care less about personal DTI and more about property-level cash flow and borrower credit."
            },
            {
              heading: "Building a Lender Stable",
              body: "Don't rely on one lender. Build a 'stable' of 3-5: one conventional bank for standard financing, one mortgage broker with DSCR access, one local portfolio lender (often credit unions or community banks), one hard money lender for acquisition, one private lender from your network. Each covers different scenarios. Introduce yourself to each before you need them — showing up with an urgent deal and no relationship means worse terms."
            },
            {
              heading: "Documentation That Speeds Approvals",
              body: "Assemble a 'lender package' you can send at 24-hour notice: last 2 years tax returns (all schedules), last 2 years W-2s or 1099s, last 2 months bank statements (all accounts), year-to-date pay stubs if W-2, schedule of real estate owned (with property addresses, values, debt balances, monthly rents, monthly payments, and cash flow), copy of driver's license, voided check for escrow. Having this ready means you can get pre-approved in 48-72 hours rather than 2+ weeks."
            },
            {
              heading: "Tax Return Strategy for Self-Employed Investors",
              body: "Self-employed investors face a challenge: aggressive deductions reduce your taxable income (good for taxes) but hurt your DTI (bad for loans). The fix: plan 2 years ahead. If you're going to buy 3 properties in 2026, back off some deductions on 2024 and 2025 returns to show higher AGI. Add-backs for qualifying income: depreciation, amortization, business use of home, casualty losses, non-recurring expenses. Most lenders allow these, but the guidelines are specific."
            },
            {
              heading: "The Conversation to Have With Your Loan Officer",
              body: "Before your next deal, have a 30-minute call with your primary lender: 'Based on my current profile, what's the maximum I could qualify for today? What would I need to change to qualify for $X more? How many more properties can I finance with you before you'd stop lending to me? What are your non-standard programs I should know about?' Loan officers who know your goals help you structure deals they can approve. Loan officers who don't know your goals say no a lot."
            },
            {
              heading: "Red Flags — Lenders to Avoid",
              body: "Walk away from lenders who: (1) Pressure you to overstate income or hide debts, (2) Don't deliver a Loan Estimate within 3 business days of application (it's federally required), (3) Quote rates without pulling credit (meaningless), (4) Can't explain their fees clearly, (5) Promise pre-approvals without any documentation, (6) Charge high 'application fees' or 'processing fees' upfront. Predatory lending in the investor space is real — stick with established companies with online reviews you can verify."
            }
          ]
        }
      }
    },

    market: {
      title: "Market Analysis",
      icon: <MapPin size={16} />,
      topics: {
        "market-fundamentals": {
          title: "Reading Market Fundamentals",
          icon: <Activity size={14} />,
          sections: [
            {
              heading: "Population Growth",
              body: "The single strongest predictor of long-term real estate performance. Markets growing 1%+ annually see sustained demand for housing. Sources: Census Bureau American Community Survey, state demographer reports. Warning sign: population decline for 3+ consecutive years often signals market decline even if current metrics look good. Best-in-class growth markets (Austin, Nashville, Raleigh, Phoenix, Tampa) have seen 1.5-3% annual growth over the last decade."
            },
            {
              heading: "Job Growth and Diversification",
              body: "Look for: 1.5%+ annual job growth, unemployment below national average, and diversified employer base. Ideal mix: no single employer >20% of jobs, no single industry >30%. Red flags: boom-bust markets tied to one industry (oil towns, old mill towns, government-dependent cities). Source data: BLS local area unemployment statistics, state labor department quarterly reports."
            },
            {
              heading: "Wage Growth and Rental Affordability",
              body: "Healthy markets have wage growth tracking or exceeding rent growth. If rents rise faster than wages for multiple years, you eventually hit an affordability ceiling and rent growth stalls. Check the 'rent-to-income ratio' — median rent as % of median income. Healthy: <30%. Stretched: 30-40%. Unsustainable: >40% (Miami, LA, SF in recent years)."
            },
            {
              heading: "Inventory and Days on Market",
              body: "Months of Supply (MoS) = inventory / monthly sales rate. MoS <3 = strong seller's market, 3-6 = balanced, >6 = buyer's market. Days on market (DOM) is a faster-reacting leading indicator. Rising DOM over 3+ months suggests market softening before prices drop. Find these numbers in local Realtor association monthly reports or through paid tools like Altos Research."
            },
            {
              heading: "Migration Trends",
              body: "Domestic migration data reveals which markets are winning and losing residents. Sources: IRS migration data (tracks tax-return moves), Census migration estimates, U-Haul one-way rental reports. Markets with net in-migration of 5,000+ annually for multiple years tend to have sustained price/rent growth. Markets losing population struggle even if jobs exist."
            },
            {
              heading: "Landlord-Friendliness of Laws",
              body: "State and local regulatory environment has huge impact on rental economics. Factors: eviction timeline (a few days vs 6+ months), rent control (none vs strict caps), security deposit limits, required notice periods, tenant screening restrictions, source-of-income discrimination laws. Highly landlord-friendly: TX, FL, GA, TN, IN, OH. Neutral: NC, SC, AZ, NV. Tough: CA, NY, NJ, WA, OR. Factor eviction costs and timeline into your vacancy assumptions."
            },
            {
              heading: "Property Tax Environment",
              body: "Varies wildly by state. Low-tax: AL (~0.4%), LA (~0.5%), DE (~0.6%), HI (~0.3%). Mid-tax: most southern and western states (0.7-1.2%). High-tax: NJ (~2.5%), IL (~2.1%), TX (~1.8%, but no state income tax), NH (~2.1%). Tax rates matter most at the low end of the market — a $100K rental with 2% taxes pays $2,000/year, a massive cash flow drag."
            }
          ]
        },
        "neighborhood-analysis": {
          title: "Neighborhood-Level Analysis",
          icon: <Globe size={14} />,
          sections: [
            {
              heading: "The A/B/C/D Neighborhood Framework",
              body: "Industry shorthand for neighborhood class: Class A — newest, highest income, lowest crime, premium schools (think new suburban developments). Class B — established middle-class neighborhoods, good schools, low crime, aging but maintained housing stock. Class C — working-class, older housing, some crime, mixed schools. Class D — distressed, high crime, failing schools, derelict properties. BRRRR investors typically target B/C neighborhoods: enough discount to make the math work, stable enough to find tenants."
            },
            {
              heading: "Crime Data Sources",
              body: "CrimeMapping.com, SpotCrime, local police department open-data portals, and FBI Uniform Crime Reports. Trends matter more than absolute numbers — a neighborhood with high-but-falling crime is often a better investment than one with low-but-rising crime. Avoid properties in areas with concentrated violent crime regardless of cap rate; tenants leave, insurance costs climb, capex accelerates."
            },
            {
              heading: "School Quality",
              body: "GreatSchools.org ratings are a decent proxy, but flawed. Combine with: state test score reports, graduation rates, teacher turnover. For single-family rentals targeting families, school rating of 6+ is typically the threshold. Below 6, your tenant pool narrows significantly. For urban multi-families targeting young professionals, schools matter less."
            },
            {
              heading: "Gentrification vs Decline",
              body: "Signs of gentrification (appreciation ahead): new coffee shops, renovated buildings, younger demographic moving in, permit activity rising, crime falling. Signs of decline (depreciation ahead): businesses closing, properties sitting vacant, long-term residents leaving, rising 'for rent' signs, deferred maintenance visible on many houses. Drive the neighborhood personally — don't rely on data alone."
            },
            {
              heading: "Proximity Factors",
              body: "Value drivers within walking/short driving distance: grocery stores, employment centers, public transit, parks, universities, hospitals. Value detractors: busy highways (noise/fumes), industrial areas, airports, high-voltage power lines, landfills, sewage treatment, half-way houses/correctional facilities. These show up in comps — a house next to a freeway sells 10-20% below one a block away."
            },
            {
              heading: "Flood Zones and Natural Hazards",
              body: "Check FEMA flood maps (msc.fema.gov) before every offer. Flood Zone X = minimal risk, no flood insurance required. Zone AE = 1% annual chance, flood insurance required (typical premium $800-$2,500/yr). Zone VE or floodway = avoid entirely. Wildfire zones (western US), tornado alleys, hurricane zones — factor increased insurance costs into analysis. A 'cheap' property in a flood zone often isn't cheap after insurance."
            }
          ]
        },
        "str-considerations": {
          title: "Short-Term Rental (STR) Markets",
          icon: <Home size={14} />,
          sections: [
            {
              heading: "STR vs LTR Economics",
              body: "Short-term rentals (Airbnb, Vrbo) typically gross 1.5-3x what long-term rentals gross, but operating costs are 3-5x higher. Higher: cleaning fees between stays, platform fees (Airbnb 14-16%), dynamic pricing tools, more turnover = more wear, utilities included, furnishings ($15K-$40K upfront), higher vacancy rates (35-45% is normal for STR). Net: STR can produce 1.5-2x LTR profit with dramatically more operational complexity."
            },
            {
              heading: "Regulatory Risk",
              body: "STR regulations change fast. Examples from the last 5 years: NYC banned most STRs under 30 days in 2023; Miami Beach banned STRs in residential zones; Austin restricts Type-2 STR licenses heavily; Phoenix requires registration and inspections. Before buying for STR, research: current regulations, pending legislation, HOA rules, condo association STR bans. A regulatory shift can turn a $5K/mo STR into a $2K/mo LTR overnight."
            },
            {
              heading: "STR Market Validation",
              body: "Before buying, use AirDNA (paid) or Rabbu (free tier) to analyze: average daily rate (ADR), occupancy rate, seasonality, competitive saturation. Key metrics: RevPAR (Revenue per Available Room) — monthly revenue / available nights. Typical high-performing STR markets: $150-$250 ADR, 65-80% occupancy, $3,500-$6,500/month revenue on mid-size properties."
            },
            {
              heading: "Best STR Market Characteristics",
              body: "Tourism anchor (beaches, national parks, major cities, college towns for big events), low STR saturation, permissive regulations, strong year-round demand. Examples: Pensacola, FL (beach + military); Chattanooga, TN (outdoor tourism); Pigeon Forge, TN (tourism economy). Avoid: heavily saturated vacation markets where every third house is an STR, markets with declining tourism numbers."
            },
            {
              heading: "Operational Requirements",
              body: "Running a profitable STR requires: professional photography ($500-$1,500), dynamic pricing software (PriceLabs, Wheelhouse at $20-$100/month), property management software (Guesty, Hostaway), cleaning crew on retainer, replenishment supplies tracked, local handyperson on call, noise-monitoring devices if needed, guest screening process. Budget 15-25% of gross revenue for operational costs beyond the mortgage."
            }
          ]
        }
      }
    },

    tax: {
      title: "Tax Strategy",
      icon: <FileText size={16} />,
      topics: {
        "depreciation": {
          title: "Depreciation: Your Best Tax Weapon",
          icon: <TrendingDown size={14} />,
          sections: [
            {
              heading: "What Depreciation Is",
              body: "The IRS allows you to deduct the cost of the improvements (building, not land) over 27.5 years for residential rental property, 39 years for commercial. This deduction reduces your taxable rental income even though you never actually paid that 'expense' in cash. On a $250K property (of which $200K is building, $50K is land), your annual depreciation deduction is $200K / 27.5 = $7,272/year. This often makes rental properties show a tax LOSS while generating positive cash flow."
            },
            {
              heading: "Why It's So Powerful",
              body: "Consider a property that produces $4,000/year net cash flow. Without depreciation, you'd owe taxes on that $4K. WITH $7,272 of depreciation, you show a $3,272 paper loss. That loss can offset other rental income (or, if you qualify as a Real Estate Professional, any ordinary income). The cash flow is real and in your pocket; the tax loss is a tax-reducing phantom. This is why professional real estate investors often pay little to no income tax despite earning substantial income."
            },
            {
              heading: "Cost Segregation Studies",
              body: "An advanced strategy where a specialized engineer reclassifies portions of the building into shorter depreciation categories: 5-year (appliances, carpet, cabinetry), 7-year (certain fixtures), 15-year (land improvements — driveways, fencing, landscaping). Typical result: 20-35% of the building basis moves to 5/7/15-year categories, which can be depreciated much faster. Combined with bonus depreciation, you can deduct 60-80% of the shifted amount in year one. Costs: $3K-$8K for a study. Pays off on properties worth $400K+."
            },
            {
              heading: "Bonus Depreciation",
              body: "Allows immediate deduction of 100% of qualifying 5/7/15-year property in the year of purchase. Currently phasing down: 80% in 2023, 60% in 2024, 40% in 2025, 20% in 2026, 0% by 2027 (unless Congress extends). Massive benefit for investors who can absorb the depreciation against other income. Combined with cost segregation, bonus depreciation has created major tax savings for active investors."
            },
            {
              heading: "Depreciation Recapture At Sale",
              body: "The catch: when you sell, the IRS 'recaptures' the depreciation you took, taxing it at up to 25%. Cash flow magic during the hold becomes tax due at sale. The workaround: 1031 exchange defers this indefinitely; 'stepped-up basis' at death eliminates it entirely (heirs inherit at current value, wiping out the depreciation tax). 'Die with real estate' is a real tax strategy."
            },
            {
              heading: "Passive Activity Loss Rules",
              body: "Rental losses are generally 'passive' and can only offset 'passive' income. Exception for middle-income investors: up to $25,000 of rental losses can offset W-2 income if your Modified AGI is under $100K (phases out completely at $150K). Larger exception: Real Estate Professional status (750+ hours/year in real estate trades OR 50%+ of total work hours) lets you deduct unlimited rental losses against any income. This is the holy grail of real estate tax strategy — usually achievable only for full-time investors or spouses who can qualify."
            }
          ]
        },
        "entity-structure": {
          title: "LLC, S-Corp, Trust: Entity Structure",
          icon: <Building2 size={14} />,
          sections: [
            {
              heading: "The Default: Sole Proprietorship",
              body: "Owning rental property in your personal name, reporting on Schedule E of your 1040. Advantages: simplest structure, no formation or maintenance costs, passes through income cleanly, still deducts depreciation and expenses. Disadvantages: no liability protection — a tenant lawsuit can reach your personal assets (car, other investments, wages). For investors with few assets outside the properties, this may be acceptable."
            },
            {
              heading: "Single-Member LLC",
              body: "Hold each property (or a small group) in a separate Limited Liability Company. Taxed identically to sole proprietorship (disregarded entity — files on your personal return) but provides asset protection: a lawsuit against one property stops at that LLC's assets. Cost: $50-$500 to form depending on state, $0-$800/year ongoing fees. California: $800/year franchise tax per LLC — can negate the benefit for small-portfolio investors. Best for: investors with substantial personal wealth to protect."
            },
            {
              heading: "Multi-Member LLC (Partnership Taxation)",
              body: "Two or more owners, taxed as a partnership. Use for: joint ventures with other investors, syndications, married couples in community property states. Files a 1065 partnership return and issues K-1s to members. More complex accounting than single-member LLC but allows flexible profit/loss allocations."
            },
            {
              heading: "Series LLC",
              body: "A special LLC type available in some states (DE, TX, NV, IL, among others) that allows multiple 'series' under one parent LLC, each with its own asset protection. Cheaper than forming separate LLCs for each property. Legal protection hasn't been tested in all jurisdictions — some states may not recognize series separation. Consult an asset protection attorney."
            },
            {
              heading: "S-Corporation: Usually Wrong for Rentals",
              body: "S-Corps work well for active businesses where you want to minimize self-employment tax on profits. They're usually a bad fit for rental real estate: can't take advantage of the stepped-up basis at death, losses are more restricted, 1031 exchanges are complicated, and you can't easily add/remove assets without triggering tax. S-Corps are appropriate for flipping businesses, property management companies, and short-term rental operations — not long-term rental holds."
            },
            {
              heading: "Asset Protection Attorney: When to Consult",
              body: "Once your rental portfolio exceeds $1M in equity or you have significant outside assets, invest in a consultation with a real estate asset protection attorney. Fees: $500-$2,500 for a structuring review, then $1K-$5K to implement. Topics: LLC structure, umbrella insurance layering, charging order protection, state-specific nuances. Not a DIY area — mistakes here can be catastrophic and are only discovered after a lawsuit."
            },
            {
              heading: "The Due-on-Sale Clause Risk",
              body: "Transferring a property from personal name to an LLC after a conventional mortgage closes technically triggers the 'due-on-sale' clause, giving the lender the right to call the loan. In practice, lenders rarely exercise this right if payments remain current. Still, consult your lender, or use a trust-first structure to avoid the issue. This is one reason DSCR and portfolio loans (which allow LLC ownership from origination) are popular."
            }
          ]
        },
        "other-tax-strategies": {
          title: "Other Tax-Saving Strategies",
          icon: <Sparkles size={14} />,
          sections: [
            {
              heading: "Section 121 Exclusion (Primary Residence)",
              body: "Live in a property for 2 of the last 5 years and sell, and you exclude up to $250K of capital gain (single) / $500K (married) from tax. Combine with the 'live-in flip' strategy: buy a fixer-upper primary residence, renovate over 2+ years, sell tax-free, repeat. Cycle through 2-3 of these and build substantial tax-free wealth. Current restriction: gain attributable to non-qualified use (periods when it wasn't your primary residence) is NOT excluded."
            },
            {
              heading: "1031 Exchange (Tax-Deferred Swap)",
              body: "Sell an investment property and buy a 'like-kind' replacement (any other US investment real estate counts) within 180 days, and the gain is deferred indefinitely. Rules: must use a qualified intermediary, identify replacement property within 45 days, buy equal or greater value, reinvest 100% of cash proceeds. Can be stacked for decades — buy, sell, 1031 into larger property, repeat. At death, heirs receive stepped-up basis, eliminating accumulated gain. Strategy of choice for building multi-generational real estate wealth."
            },
            {
              heading: "Opportunity Zones",
              body: "Federally designated economically-distressed areas where investors can defer and partially reduce capital gains taxes by reinvesting gains into Qualified Opportunity Zone Funds. Hold 10+ years and the appreciation on the new investment is tax-free. Complex compliance requirements and specific investment windows. Best for investors selling major positions (stocks, businesses) with large capital gains to redirect."
            },
            {
              heading: "Short-Term Rental Tax Loophole",
              body: "STR income, if properly documented, can be classified as 'active' rather than 'passive' for tax purposes. Requirements: average rental period of 7 days or less, AND you provide substantial services OR materially participate (500+ hours/year). Active treatment means STR losses can offset W-2 income without qualifying as Real Estate Professional. Major tax benefit for higher-income investors who don't qualify for REPS but can run 1-2 STRs actively."
            },
            {
              heading: "Augusta Rule (Section 280A)",
              body: "Rent your primary residence to a business (possibly your own) for up to 14 days per year, tax-free. Named for Augusta, GA residents renting to Masters tournament visitors. Business deducts the rent; you receive it tax-free. Requires documentation: rental agreement, comparable market rates, legitimate business use. Useful for LLC/corporation owners hosting quarterly meetings at their home."
            },
            {
              heading: "Qualified Business Income (QBI) Deduction",
              body: "Section 199A deduction for certain rental real estate enterprises — up to 20% of rental income can be deducted, subject to income limits ($191K single / $383K married MFJ in 2024). Requires rental activities to qualify as a 'trade or business' under IRS safe harbor (250+ hours/year, separate books, etc.). Often overlooked but significant for active investors at certain income levels."
            }
          ]
        }
      }
    },

    risk: {
      title: "Risk Management",
      icon: <Shield size={16} />,
      topics: {
        "reserves-and-capex": {
          title: "Reserves, CapEx, and Staying Solvent",
          icon: <Save size={14} />,
          sections: [
            {
              heading: "Required Reserves by Category",
              body: "Three distinct reserve categories: (1) Vacancy reserves — 1-2 months rent per property; (2) Repair & maintenance reserves — $200-$300/month per property accumulated; (3) Capital expenditure (CapEx) reserves — $200-$400/month per property accumulated for major systems. New investors routinely underfund these, then face cash crises when a roof needs replacing and three tenants move out simultaneously."
            },
            {
              heading: "CapEx Planning by System",
              body: "Rough useful life and replacement cost: Roof — 20-30 years, $8K-$15K. HVAC — 12-18 years, $5K-$8K. Water heater — 10-15 years, $1K-$2K. Appliances — 10-15 years, $2K-$4K full set. Flooring — 5-10 years for rental-grade carpet/LVP, $4K-$8K full house. Paint — 5-7 years between tenants, $2K-$4K. Windows — 25-40 years, $8K-$20K. Sum these by expected life and divide by months to get your monthly CapEx reserve per property."
            },
            {
              heading: "Cash Flow vs Cash Available",
              body: "Reported cash flow assumes you're properly reserving for the items above. If you're showing $400/month cash flow but not setting aside anything for CapEx, that 'cash flow' is a lie — it's temporary and you'll have to come up with $10K when the roof fails. Treat reserves as real expenses that come out of cash flow every month, not as 'someday if we need it' money."
            },
            {
              heading: "Liquidity Rules",
              body: "Maintain minimum liquid reserves equal to 6 months of total mortgage payments across your portfolio, plus $10K-$15K emergency reserve per property. Keep these in a high-yield savings account (4-5% APY available in 2024-2025), not invested in equities or tied up in HELOC availability. When a crisis hits (extended vacancy, major systems failure, legal dispute), cash is the only thing that solves the problem."
            },
            {
              heading: "The Multiple-Property Failure Scenario",
              body: "A common end-stage failure mode: investor owns 8 rentals, each marginally cash-flow positive. Three simultaneously go vacant, one has a roof fail, one tenant doesn't pay for 3 months during eviction. Cash reserves get drained. One property goes into foreclosure, which cross-defaults with lender. Portfolio collapses. Prevention: never scale faster than your reserves can support multiple simultaneous negative events."
            }
          ]
        },
        "insurance": {
          title: "Insurance: Coverage You Actually Need",
          icon: <Shield size={14} />,
          sections: [
            {
              heading: "Landlord Insurance (DP-3)",
              body: "Not the same as homeowners — specifically designed for rental property. Typical coverage: dwelling (at replacement cost), other structures, loss of rents (if property becomes uninhabitable), premises liability, often excludes tenant contents (they need renters insurance). Annual cost: 0.5-1.5% of property value. Never let a tenant move in without active landlord coverage — a single claim on a homeowner's policy covering a rental can be denied, leaving you uninsured."
            },
            {
              heading: "Umbrella Liability Insurance",
              body: "Additional $1M-$5M liability coverage on top of your landlord policies, covering catastrophic claims (tenant injury, dog bite, fatal accident on property, discrimination lawsuit). Annual cost: $250-$500 per million of coverage. Absolute essential once your rental portfolio exceeds 2-3 properties. Umbrella is cheap — a single catastrophic claim without it can wipe out decades of wealth-building."
            },
            {
              heading: "Flood Insurance (NFIP or Private)",
              body: "Required by lenders for properties in FEMA-designated flood zones (Zone A, V, AE, etc.). Not automatically included in landlord policies. NFIP max: $250K dwelling / $100K contents. Private flood insurance through Lloyd's of London or similar can cover higher limits. Rule of thumb: if you didn't budget for flood insurance but the property is in a flood zone, the deal is not what you thought."
            },
            {
              heading: "Vacancy Endorsements",
              body: "Most landlord policies have vacancy clauses — if the property is unoccupied for 30-60+ days, coverage drops or is eliminated. Critical during BRRRR rehab period when the property will be vacant for months. Solution: purchase a 'vacant dwelling' policy or an 'unoccupied' endorsement. Standard during rehab, usually 50-100% more expensive than occupied landlord coverage."
            },
            {
              heading: "Workers Comp During Rehab",
              body: "If you hire unlicensed helpers, pay your brother-in-law to help with the rehab, or do any substantial work yourself with others, you may be exposed to workers comp claims even if you didn't have a formal employer-employee relationship. Protect yourself: require contractors to carry WC insurance and provide certificates, avoid paying individuals directly for labor, prefer licensed GCs who carry their own WC."
            },
            {
              heading: "Claims Management",
              body: "Filing too many claims raises rates and can get you non-renewed. Self-insure small claims (under $2K-$5K), file only significant claims. Document everything: photos before/after tenants move in, photos of damage when it occurs, written communications with tenants. A contested claim often turns on whether you can document the property's condition pre-incident."
            }
          ]
        },
        "tenant-management": {
          title: "Tenant Selection and Management",
          icon: <Key size={14} />,
          sections: [
            {
              heading: "The Screening Criteria",
              body: "Professional baseline: credit score 620+, gross income 3x monthly rent, verifiable employment 2+ years, no evictions on record, no violent criminal history. Apply criteria consistently — inconsistency creates discrimination lawsuits. Use a third-party screening service (SmartMove, RentPrep, MyRental) rather than pulling your own reports, which requires FCRA compliance."
            },
            {
              heading: "Fair Housing Law Compliance",
              body: "Federal Fair Housing Act protected classes: race, color, national origin, religion, sex, familial status, disability. Many states/cities add: source of income (including Section 8), sexual orientation, gender identity, age, criminal history (limited). Never advertise 'great for young professionals' or 'perfect for a single person' — these are age/familial status violations. Use neutral language focused on the property, not the tenant."
            },
            {
              heading: "The Lease Agreement",
              body: "Use a state-specific lease from a real estate attorney or a well-reviewed template (biggerpockets.com and various state REI associations offer solid ones). Key clauses: security deposit amount and terms, late fees and grace periods, pet policies, utility responsibility, maintenance responsibilities (tenant vs landlord), quiet enjoyment, prohibited activities, entry notice requirements (typically 24 hours written notice). Sign the lease BEFORE delivering keys."
            },
            {
              heading: "Security Deposits",
              body: "State laws vary: most limit deposits to 1-2 months rent; some (CA, OR, WA) limit to 1 month plus additional for pets. Must be held in compliance (some states require separate interest-bearing accounts). Must be returned within 14-45 days of move-out with itemized deductions. Common mistake: deducting for normal wear-and-tear, which is not permitted. Paint and carpet have limited lifespans that prorate against reasonable use."
            },
            {
              heading: "Eviction Economics",
              body: "Evictions cost $2K-$5K in direct fees (attorney, filing, sheriff) plus 1-6 months lost rent plus potential property damage. Prevention is dramatically cheaper than eviction: good screening prevents most issues. When late rent happens, act quickly with formal notices — the clock starts when you legally notice the tenant, not when they first miss payment. Tenant-friendly states (NY, CA, NJ, WA) can take 4-9 months to complete an eviction."
            },
            {
              heading: "Property Management: DIY vs Pro",
              body: "Self-management typical time: 2-6 hours/month per property once systems are in place; 20+ hours in crisis. Professional management: 8-10% of collected rents, plus leasing fees (one month's rent), plus maintenance markups. Breakeven: when your time is worth more than the management fee. Most investors benefit from professional management starting around property 4-6. Interview 3+ managers, ask for references from current clients, understand the fee structure completely."
            }
          ]
        }
      }
    },

    sourcing: {
      title: "Deal Sourcing",
      icon: <Mail size={16} />,
      topics: {
        "on-market-deals": {
          title: "On-Market Deals (MLS and Agents)",
          icon: <Search size={14} />,
          sections: [
            {
              heading: "Working With Investor-Friendly Agents",
              body: "Most real estate agents focus on primary residence buyers — they don't understand investor criteria. An 'investor-friendly' agent knows: the 1% and 70% rules, can pull sold comps quickly, understands after-repair value estimation, has relationships with other investors and wholesalers, can identify properties by days-on-market or price reduction history. Interview questions: 'How many investor clients have you closed deals with in the last 12 months? Can you set up an automated MLS search by cap rate and days on market? Do you work with deals that need significant rehab?'"
            },
            {
              heading: "Setting Up MLS Search Alerts",
              body: "Your agent can set up instant-alert MLS searches with specific criteria. Useful parameters for BRRRR hunters: price below X, days on market over 30, price reduction in last 14 days, 'as-is' in remarks, 'cash only' in remarks, specific zip codes, property class (3/4+ beds for SFR), ARV estimate filter (often inferred from comps). You'll get 20-100 alerts per week in active markets — the volume matters, most won't be deals but 1-2% will be."
            },
            {
              heading: "Stale Listings and Price Reductions",
              body: "Properties on market 60+ days are candidates for aggressive offers — the seller's expectation has adjusted. Properties with 2+ price reductions are even better. Your opening offer can be 15-25% below current list on stale listings. Agent won't push back hard because they want the commission. Sellers who've 'tested' the market at two prices are psychologically ready to accept realistic offers."
            },
            {
              heading: "Expired and Withdrawn Listings",
              body: "Listings that expired without selling (failed to sell in their contract term) or were withdrawn (seller pulled off market). These owners may still want to sell but are discouraged. Your agent can pull these lists from the MLS. Approach strategies: letter campaign explaining you buy as-is for cash, phone outreach if you can find numbers, door-knocking in hot neighborhoods. Conversion rates are low (1-3%) but deals from this source tend to be the best — motivated but no longer on retail market."
            },
            {
              heading: "Relationship With Listing Agents",
              body: "When you see listing agents appearing on multiple investor-grade properties, build a relationship with them. They'll call you first when a new listing hits that matches your criteria — often before MLS entry. Offer them both sides of commission (they represent seller AND buyer) when possible — many investors find this offensive ethically, but it's legal in most states when disclosed and massively increases agent cooperation."
            },
            {
              heading: "Property Type Gaps in MLS",
              body: "Certain property types are underserved on MLS and tend to yield deals: 2-4 unit properties (agents focused on SFR don't understand them), properties requiring significant rehab (most buyers can't get financing), properties with unusual features (unpermitted additions, large lots, industrial-adjacent), properties in transition neighborhoods (agents don't know how to market them). Focus your search on these gaps."
            }
          ]
        },
        "off-market-marketing": {
          title: "Off-Market Direct Marketing",
          icon: <Mail size={14} />,
          sections: [
            {
              heading: "Why Off-Market Works",
              body: "The best deals are properties not actively listed. The seller's pain point — inherited property, pending foreclosure, tired landlord, divorce, relocation — creates motivation but they haven't committed to a listing agent yet. By reaching them with a direct offer, you remove the listing agent's 6% commission from the equation and capture motivated seller psychology. 5-15% of all residential transactions are off-market; in certain investor-heavy markets, 30%+."
            },
            {
              heading: "Building a Marketing List",
              body: "Quality list building drives results. Target lists: absentee owners (property in different state/zip than owner address), high equity (low mortgage balance relative to value), long-term owners (15+ years, likely tired), vacant properties (USPS vacancy data or visual verification), pre-foreclosure (NOD filings), tax-delinquent, inherited (recent probate), expired listings. Tools: PropStream ($99/mo), DealMachine ($99/mo), List Source, Whitepages for skip tracing. Budget $200-500/month for list-building tools early on."
            },
            {
              heading: "Direct Mail Campaigns",
              body: "Traditional but still effective. Typical response rate: 0.5-2.0% calls, 0.1-0.4% actual deals. Piece types: yellow letter (handwritten look, highest conversion but low volume to execute), postcard (scales better, 20-40% less conversion), letter (middle ground). Cadence: 4-8 touches over 6-12 months to the same list. Cost per piece: $0.55-$1.20. Budget math: to close 2 deals a year from mail, figure $8K-$15K/year in mailing costs on a list of 2,000-5,000 addresses."
            },
            {
              heading: "SMS and Cold Calling",
              body: "Higher conversion rates than mail but also higher regulatory risk. Cold calling requires DNC (Do Not Call) list scrubbing — violations are $1,500+ per call. SMS requires explicit consent in many states — TCPA violations are $500-$1,500 per text. Use professional dialer services (Batch Dialer, Mojo) and texting platforms (LeadSherpa, SmarterContact) that include compliance tools. Expect 3-5% response rates, 0.5-1% conversion to deal."
            },
            {
              heading: "Driving for Dollars",
              body: "Physically driving neighborhoods to identify distressed properties. Indicators of distress: overgrown landscaping, peeling paint, boarded windows, multiple 'for sale' signs in yard, accumulated mail, vehicle junk in driveway. Record the address, then skip-trace to find owner contact info. Apps like DealMachine automate the process — take a photo, the app pulls owner data, queues marketing. Time-intensive but zero marketing spend. Works well in established older neighborhoods."
            },
            {
              heading: "Compliance and Ethics",
              body: "TCPA (Telephone Consumer Protection Act), CAN-SPAM (email), state Do-Not-Call lists, DNC scrubbing requirements, and consumer protection laws around unsolicited mortgage/equity offers all apply. Never: misrepresent yourself, pressure elderly sellers, buy without competent adult consent, offer substantially below fair market value to someone in crisis. Each state has specific 'predatory purchase' laws that can void contracts and create liability."
            }
          ]
        },
        "foreclosures-auctions": {
          title: "Foreclosures, Auctions, Tax Sales",
          icon: <Flag size={14} />,
          sections: [
            {
              heading: "The Foreclosure Timeline",
              body: "Pre-foreclosure: owner has missed 3+ payments, lender has filed notice. Public record (NOD / Lis Pendens). This is the BEST time to engage — owner may still be willing to sell, owner still on title, no court involvement. Auction: property goes to trustee/sheriff sale, sold to highest bidder (often the bank bids back if no outside buyer matches the debt). REO: if auction fails, property becomes bank-owned and is listed with an asset manager. Each phase has different strategies."
            },
            {
              heading: "Pre-Foreclosure Approaches",
              body: "Most profitable phase but requires sensitive outreach. Get NOD lists from county recorder (weekly filings). Mail, call, or door-knock to owners. Typical approach: explain you can pay off their mortgage, give them some cash to move, and save their credit vs the foreclosure that's coming. Conversion rates are low (5-10% of contacts result in serious conversations) but deals are substantial — often 65-75% of market value."
            },
            {
              heading: "Foreclosure Auctions",
              body: "Cash-only, as-is, no inspection, no title insurance until after sale. Auction day: you bid against other investors and the bank. Win = pay within hours (typically same day or next). Risks: (1) junior liens may survive (always run preliminary title report before bidding — $50-$150), (2) property may be occupied and require eviction, (3) interior condition unknown — you're buying based on drive-by and public records only. Rewards: 50-70% of market value typical. Strategy for beginners: attend 3-5 auctions as an observer before ever bidding."
            },
            {
              heading: "Tax Lien vs Tax Deed States",
              body: "States vary in how they sell delinquent tax properties. Tax Lien states (FL, MD, AZ, NJ, IL, others): you buy the tax debt; owner has a redemption period (typically 6-36 months) to repay with interest; if they don't, you can foreclose the tax lien. Tax Deed states (CA, GA, NC, PA, others): you buy the property directly at auction; no redemption period in most. Research your state's specific rules carefully — mistakes at this stage are expensive."
            },
            {
              heading: "REO and Bank-Owned Properties",
              body: "Post-failed-auction, the bank owns the property and lists it with an asset manager through the regular MLS. Easier to close than auctions — you get title insurance, inspection period, financing allowed. Banks move slowly on negotiations (asset manager committees) but prices are typically 80-90% of market. Source: MLS filtering, HUD Home Store (FHA foreclosures), Fannie Mae HomePath, Freddie Mac HomeSteps, REO-specific websites like Auction.com (some properties move through multiple channels)."
            },
            {
              heading: "The Online Auction Trend",
              body: "Post-2020, many foreclosure and REO auctions moved online (Auction.com, Hubzu, Xome, ServiceLink). Advantages: easier to participate, can bid from anywhere, more time to research. Disadvantages: typically 5% buyer premium added to winning bid, more competitive bidding than local in-person auctions, more unsophisticated buyers overbidding. Do your homework — a property you 'won' at an auction price 10% over market is a loss before you take title."
            }
          ]
        },
        "wholesaler-relationships": {
          title: "Working With Wholesalers",
          icon: <Briefcase size={14} />,
          sections: [
            {
              heading: "How Wholesaling Works",
              body: "Wholesaler finds distressed seller, puts property under contract at $X, assigns contract to end buyer (you) at $X + assignment fee. Typical assignment fee: $5K-$25K depending on deal size and equity. You close on the property, wholesaler walks away with the fee. For you: instant access to off-market deals without the marketing spend. For wholesaler: no financing required, fast turnaround (30-60 days from contract to assignment)."
            },
            {
              heading: "Finding Quality Wholesalers",
              body: "Join local real estate investor association (REIA) meetings — wholesalers actively network there. Join local wholesaler-focused Facebook groups and GroupMe chats. Check your local BiggerPockets forums. Sign up for 5-10 wholesaler email lists in your market. Good wholesalers send 1-3 deals per month; bad ones blast 20+ marginal deals per week. Quality over quantity — you want wholesalers who pre-screen deals."
            },
            {
              heading: "Evaluating a Wholesale Deal",
              body: "Run wholesale deals through the same analysis as any other deal — don't trust the wholesaler's ARV or rehab estimate. Typical red flags: (1) ARV provided with no actual comp data, (2) rehab estimate suspiciously low ($15K for what clearly needs $40K+), (3) 'spread' too thin (less than $20K profit after assignment fee doesn't leave much margin), (4) pressure to decide within 24 hours (legitimate deals give 2-3 days for proper analysis), (5) refusal to let you inspect before signing assignment."
            },
            {
              heading: "The Paper Trail",
              body: "A legitimate wholesaler will: (1) sign an assignment agreement with you, (2) provide the original purchase contract with seller, (3) escrow the assignment fee with the title company, (4) NOT require you to pay the fee directly to them outside of closing. Wholesalers asking for 'non-refundable deposits' paid to them directly are often running scams — pay fees through escrow at close only."
            },
            {
              heading: "Building Two-Way Relationships",
              body: "The best deals from wholesalers go to their repeat buyers. To get on the 'A-list,' close deals quickly (no drawn-out negotiations), pay assignment fees without haggling to the penny, give honest feedback on why you pass on deals, and refer other buyers to them for deals you can't do. Wholesalers running 10+ deals a year have a short list of 5-10 preferred buyers — being on that list is worth $50K+ in deal flow annually."
            },
            {
              heading: "Red Flag Wholesalers to Avoid",
              body: "(1) Wholesalers who 'daisy chain' deals (assignment from wholesaler A to wholesaler B to you — each layer adds fees), (2) Wholesalers without a W-9 or EIN (may be operating illegally in states requiring real estate licensing for repeat transactions), (3) Wholesalers whose photos don't match actual property condition, (4) Wholesalers who won't let you talk directly to the seller, (5) Wholesalers who shop the same deal to multiple buyers simultaneously then pick the best offer."
            }
          ]
        }
      }
    },

    negotiation: {
      title: "Negotiation & Offers",
      icon: <Users size={16} />,
      topics: {
        "offer-structure": {
          title: "Structuring Competitive Offers",
          icon: <Edit3 size={14} />,
          sections: [
            {
              heading: "Beyond Price — The Full Offer",
              body: "Sellers respond to much more than the dollar amount. Key terms: earnest money deposit (EMD) size, inspection period length, financing contingency (or waiver), closing timeline, seller concessions requested, post-occupancy rights, personal property included. A $180K offer with 21-day close, $10K EMD, waived financing contingency often beats a $185K offer with 45-day close and full financing contingency. Structure your offer to reduce seller risk."
            },
            {
              heading: "Earnest Money Strategy",
              body: "EMD is a signal of your commitment. Typical: 1-3% of purchase price ($1,500-$5,000 on a $150-$250K property). Aggressive: 5% or $10,000+ for ultra-competitive markets. Protection: make EMD refundable during inspection period (standard), ideally escrowed with title company not seller. Non-refundable EMD = risk for buyer; offer it only when the deal is clearly yours and you won't walk."
            },
            {
              heading: "Inspection Period Length",
              body: "Standard: 7-14 days. Shortened: 3-5 days (more attractive to sellers, riskier for you). Consider your access to inspectors — can you get them out in 3 days? Contingency language matters: 'buyer has right to terminate in sole discretion during inspection period' is strong buyer protection. 'Buyer may terminate only for material defects' is weak. Read your state's standard contract carefully."
            },
            {
              heading: "Financing Contingency Tradeoffs",
              body: "Financing contingency protects your EMD if financing falls through. Typical: 21-30 days to obtain financing. Waiving it is aggressive — you lose EMD if financing fails. Only waive if: (1) you have verified pre-approval with your lender for this specific deal, (2) you have backup cash or alternative financing available, (3) the market makes waiving necessary to win. Never waive financing contingency on a deal where you'd need to scramble for alternative financing."
            },
            {
              heading: "Closing Timeline",
              body: "Standard: 30-45 days. Faster closes (15-21 days) are attractive to sellers but require pre-arranged financing, title company, and inspectors. Hard money deals can close in 7-14 days. Cash closes can be 5-10 days. Use speed as a bargaining chip: 'I can close in 15 days on this purchase price, or 30 days at $X less.' Many sellers prefer speed over small price differences."
            },
            {
              heading: "The Escalation Clause",
              body: "In multiple-offer situations: 'Buyer offers $200,000 OR $5,000 above the highest competing offer, whichever is greater, up to a maximum of $225,000.' Requires listing agent to verify competing offers (not always legal in all states). Protects you from overpaying but wins when other offers are weak. Controversial — some argue it discourages transparency. Research local norms before using."
            },
            {
              heading: "As-Is Offers",
              body: "State you accept property in current condition with no seller repairs. Attractive to sellers because it removes repair negotiations. You still have inspection rights — you can terminate if you discover serious issues, but you can't request repairs or credits. Perfect for BRRRR investors already planning major rehab. Just make sure you've inspected thoroughly enough to know the major issues before going 'as-is.'"
            }
          ]
        },
        "contingencies": {
          title: "Contingencies Explained",
          icon: <Shield size={14} />,
          sections: [
            {
              heading: "What Contingencies Actually Do",
              body: "A contingency is a condition that, if not met, allows you to exit the contract and recover your EMD. Contingencies are NOT outs to find a better deal — they're protections against specific risks. Using them casually destroys your reputation with agents and sellers, and the courts can rule a contingency waiver was made in bad faith."
            },
            {
              heading: "Inspection Contingency",
              body: "Most common and important. Allows you to terminate if inspection reveals issues you're unwilling to accept. Language varies: 'in buyer's sole discretion' is strong protection; 'for material defects' is weaker. Timeline typically 7-14 days from acceptance. Within this period, you conduct inspection and then either: accept as-is, request repairs or credits, or terminate."
            },
            {
              heading: "Financing Contingency",
              body: "Protects if you can't secure financing by a deadline (typically 21-30 days). Lender must provide written denial for you to exercise. Common misconception: you don't have to get to denial — if your lender requires changes that make the deal unworkable (e.g., lower appraisal requires you to bring more cash than planned), you typically have exit rights. Specific language matters — read it carefully."
            },
            {
              heading: "Appraisal Contingency",
              body: "Separate from financing contingency in many states. If appraisal comes in below purchase price, you can: (1) renegotiate price to appraisal value, (2) terminate and recover EMD, or (3) proceed with higher cash down. Without this contingency, a low appraisal forces you to either bring extra cash or lose EMD. Waiving this is aggressive — only do it when you're confident in your own ARV analysis."
            },
            {
              heading: "Title Contingency",
              body: "Standard and almost never waived. Title must be 'marketable' — free of liens, easements, or encumbrances beyond what's disclosed. Title company searches usually discover issues early enough to resolve before closing. If unresolvable (cloud on title, unreleased liens from prior owners, ownership disputes), you terminate. Your EMD is refunded."
            },
            {
              heading: "HOA / Review Contingencies",
              body: "For condos, HOAs, PUDs: contingent on review and acceptance of HOA documents, bylaws, financial statements, minutes of last 12 months meetings. Critical — HOAs with deferred special assessments, pending litigation, or problematic finances can destroy your investment. Budget 5-10 business days to review and consult a CPA or real estate attorney on complex HOAs."
            }
          ]
        },
        "negotiation-tactics": {
          title: "Negotiation Tactics for Investors",
          icon: <TrendingUp size={14} />,
          sections: [
            {
              heading: "Anchoring",
              body: "The first number mentioned sets the reference point for everything after. If listing is $200K and comps support $185K, your opening offer should not be $185K — it should be $170-175K. The seller's counter will likely land $180-185K, which is exactly where you wanted to be. Opening at your target price leaves no room for the dance."
            },
            {
              heading: "Always Have a Reason",
              body: "Offers with justification close more often than offers without. 'I'm offering $165K because comps show $180K ARV, rehab will cost $35K, and standard investor metrics require a $20K margin on this size deal.' Sellers and agents respect logic even when they don't like the conclusion. Arbitrary lowball offers feel like insults; calculated offers feel like business."
            },
            {
              heading: "Silence as a Tool",
              body: "After submitting an offer, stop talking. Don't pile on explanations. Don't follow up every day. Silence creates space for the seller to sit with your number and the listing agent to do the work of defending it. Investors who email/call constantly signal desperation — they always end up paying more."
            },
            {
              heading: "Multiple-Offer Strategy",
              body: "In competitive markets, multiple offers are normal. Your advantages over retail buyers: (1) proof of funds letter (show bank statements for cash or hard money, pre-approval for conventional) — include with every offer, (2) waive appraisal and inspection contingencies if you're confident, (3) faster close timeline, (4) larger EMD. If competing against retail buyers, investor flexibility often wins even at slightly lower prices."
            },
            {
              heading: "The 'Deal Killer' Method",
              body: "After inspection, rather than asking for specific dollar credits, present a list of serious issues and ask 'how do you want to handle this?' The seller's first response usually offers more than you would have asked for. If their offer is less than you need, negotiate from there. This technique works because you're positioning as a problem-solver, not a discount-seeker."
            },
            {
              heading: "Walking Away",
              body: "The most powerful negotiation technique — the credible willingness to walk. Most deals die because buyers couldn't walk from bad terms. If the numbers don't work, they don't work. State clearly and without hostility: 'At this price I'd need X, Y, Z. If those aren't possible, I understand, and I'll pass.' Half the time you get what you need. The other half, you preserved your capital for a better deal."
            },
            {
              heading: "Reading the Seller's Motivation",
              body: "Before making an offer, learn everything you can about why the seller is selling. Inherited from parent (often motivated, price-insensitive, wants problem gone) > facing divorce (time-sensitive) > relocating for job (timeline-sensitive) > tired landlord (wants a clean exit) > testing the market (low motivation, don't waste time). Ask questions of the listing agent, read the description carefully, check property history. Different motivations lead to different offer strategies."
            }
          ]
        }
      }
    },

    team: {
      title: "Building Your Team",
      icon: <Users size={16} />,
      topics: {
        "core-team": {
          title: "The Core Team",
          icon: <Layers size={14} />,
          sections: [
            {
              heading: "Investor-Friendly Real Estate Agent",
              body: "Your first hire. Should: have closed 10+ investor transactions, understand investor analysis (cap rates, 1%/70% rules), pull sold comps without hand-holding, respond within hours during active deal hunting. Ideally, also invests themselves or has investors as their primary client base. Red flags: primarily works with first-time homebuyers, can't explain ARV, quotes rehab costs from the listing description, pushes you toward 'hot' neighborhoods that obviously don't cash flow. Expect to interview 4-8 agents before finding the right one."
            },
            {
              heading: "General Contractor (GC)",
              body: "The most important operational relationship for BRRRR investors. Good GCs: hit budgets within 10%, hit timelines within 20%, manage sub-trades professionally, pull permits when required, stand behind their work 6-12 months. Finding them: get references from other investors, check licenses and insurance, review past project photos, ask for 3 references you can call. Vet them on a small project first — never commit $40K+ to a contractor you haven't worked with before. Expect to cycle through 2-4 GCs before finding a long-term partner."
            },
            {
              heading: "Mortgage Lender",
              body: "You need 2-4 lenders, each with different strengths (covered in the Financing category). Your primary relationship should be a conventional mortgage broker or banker who knows you, has your documents, and can quickly quote scenarios. Secondary: DSCR broker with wholesale access, local portfolio lender for unique situations, hard money lender for acquisitions. Maintain active relationships even when not actively borrowing — send holiday cards, grab coffee annually."
            },
            {
              heading: "Property Manager",
              body: "Essential once you have 4+ rental properties or any property more than 30 minutes from home. Interview 3+ before hiring. Questions to ask: (1) What's your tenant screening criteria? (2) Average days to fill a vacancy? (3) How do you handle maintenance under $X without contacting owner? (4) What's your fee structure — management, leasing, renewals, maintenance markup? (5) Can I talk to three current owner clients? Get audited financials of their trust account — sloppy bookkeeping is a fraud red flag."
            },
            {
              heading: "Title Company / Closing Agent",
              body: "The least-considered but important. A competent title company: communicates clearly, catches title issues early, closes on time, produces clean closing packages. Try 2-3 over your first few deals and stick with the best. Your title company is also a valuable information source — they see every closing in the market and often know about deals before they hit MLS."
            }
          ]
        },
        "professional-services": {
          title: "Professional Services (CPA, Attorney)",
          icon: <Briefcase size={14} />,
          sections: [
            {
              heading: "Real Estate-Specialized CPA",
              body: "Your tax advisor is worth 10x your generalist CPA's fee. Specialized real estate CPAs know: cost segregation analysis, Real Estate Professional Status (REPS) qualification, 1031 exchange planning, depreciation recapture minimization, short-term rental loophole, entity structure optimization. Budget: $1,500-$5,000 annually for tax prep and planning. They'll save you $10K-$50K+ in taxes over 5 years. Find them: ask other investors, check CPA societies, interview 3-5 before committing."
            },
            {
              heading: "Real Estate Attorney",
              body: "Not all states require an attorney at closing — but you want one on your team regardless. Uses: LLC formation and structuring, partnership agreements for JVs, creative financing document review (subject-to, wraparounds), eviction assistance, tenant disputes, lease review. Ongoing retainer not required — most work on $250-$500/hour basis. Good relationships pay off when you need an answer fast — the $300 call that prevents a $30,000 mistake is the best legal spend you'll make."
            },
            {
              heading: "Asset Protection Attorney",
              body: "Once your portfolio exceeds $500K-$1M in equity, invest in an asset protection consultation. Different from a general real estate attorney — specializes in LLC structures, umbrella insurance layering, interstate asset separation, charging order protection. Fees: $500-$2,500 for structure review, $1K-$5K to implement. One structured consultation can protect millions of dollars in assets. Not a DIY area."
            },
            {
              heading: "Insurance Agent Specializing in Investor Properties",
              body: "Most agents don't understand investor needs. You want one who: quotes landlord policies (not homeowners) and vacant/rehab endorsements, carries multiple insurer relationships, helps layer umbrella policies over landlord policies, understands LLC-held properties. Ask for a policy review annually — you're likely either over-insured on some properties and under-insured on others. A good insurance agent audits your coverage to find both."
            },
            {
              heading: "Bookkeeper",
              body: "At 3+ properties, self-bookkeeping becomes inefficient. Hire a bookkeeper familiar with real estate: monthly reconciliations of all property accounts, categorized transactions ready for CPA at tax time, rent roll maintenance, security deposit tracking. Cost: $200-$600/month for 3-10 properties via services like Stessa + a part-time bookkeeper. Pays for itself at tax time when your CPA doesn't need to reconstruct a year of transactions."
            },
            {
              heading: "Mentor or Coach",
              body: "Paid mentorship is controversial — some are legitimate, many are scams. Legitimate: investors with 10+ year track records who charge for their time by the hour or month ($300-$1,500/month). Scams: 'gurus' selling $10K-$30K courses that teach what's freely available on BiggerPockets and YouTube. Better approach: join local REIA meetings (nominal cost), offer to help experienced investors with free work in exchange for mentorship, pay hourly for specific consultations as needed."
            }
          ]
        },
        "vendor-network": {
          title: "Vendor and Trade Network",
          icon: <Wrench size={14} />,
          sections: [
            {
              heading: "The Trades You'll Need Most",
              body: "In roughly this order of frequency: (1) handyman — small repairs, punch lists, turnover work, $35-$75/hour; (2) plumber — water heater replacements, leak repairs, sewer issues, $120-$250/hour; (3) electrician — panel upgrades, rewiring, GFCI, $100-$200/hour; (4) HVAC tech — system replacements, repairs, maintenance, $100-$180/hour; (5) roofer — spot repairs and replacements, $50-$80 per sq or $8K-$15K full replacements; (6) painter — turnover painting, $2-$4/sqft; (7) flooring — LVP install, carpet, hardwood, $2-$8/sqft installed."
            },
            {
              heading: "Finding Quality Trades",
              body: "Your GC knows their subs but also marks them up. Go direct for recurring small work. Sources: your GC's subs (ask for direct referrals after 2-3 projects together), NextDoor neighborhood recommendations, Facebook local contractor groups, REIA member referrals. Always verify: license (state license board website), insurance (ask for certificate), references (call at least 2)."
            },
            {
              heading: "Handyman Is Your Most Important Trade",
              body: "A reliable handyman does 80% of routine property work: leaky faucets, loose fixtures, paint touch-ups, door adjustments, screen replacements, tenant-caused damage. Per hour is usually cheaper than licensed specialists for small jobs. Find one good handyman who can be at a property within 24 hours and you'll save thousands annually vs calling specialists for every issue."
            },
            {
              heading: "Preferred Vendor Relationships",
              body: "Once you have recurring work (5+ properties), negotiate volume discounts. Plumbers and electricians often give 10-15% off labor for investors who provide steady work. Paint suppliers (Sherwin-Williams, Benjamin Moore) offer pro accounts with 20%+ discounts. Home Depot / Lowe's have Pro Xtra programs with volume discounts. These small savings add up — a 10% discount on $20K/year in maintenance is $2K/year straight to cash flow."
            },
            {
              heading: "Backup Trades for Each Role",
              body: "Primary + backup for every trade. Why: primary is unavailable (busy, vacation, sick), primary becomes unreliable, primary overcharges as they get busy. Having a second option tested on small jobs means you're never stuck with emergency pricing when a water heater fails at midnight. Cycle work between them to keep both warm."
            },
            {
              heading: "Building Loyalty Through Payment Terms",
              body: "The simplest loyalty builder: pay invoices within 7 days, every time. Many contractors chase 30-60-90 day invoices from clients. A landlord who pays within 7 days moves to the top of their priority list. You'll get better pricing, faster response, and priority service. This single practice differentiates you from 90% of other investors."
            }
          ]
        }
      }
    },

    commercial: {
      title: "Commercial & Multifamily",
      icon: <Building2 size={16} />,
      topics: {
        "multifamily-economics": {
          title: "5+ Unit Multifamily Economics",
          icon: <Building2 size={14} />,
          sections: [
            {
              heading: "Why Multifamily Is Different",
              body: "5+ unit properties (duplex, triplex, fourplex remain residential — 5+ triggers commercial treatment) are valued based on NOI and cap rates, not residential comps. This changes everything: every $1 you increase NOI raises property value by $12-$25 depending on market cap rate. A small operational improvement — reducing expenses by $12K/year at a 6% cap rate — creates $200K of equity. This is 'forced appreciation' at scale, the core of multifamily value-add investing."
            },
            {
              heading: "The Commercial Valuation Formula",
              body: "Property Value = NOI / Cap Rate. Example: 12-unit property with NOI of $120K in a market with 6% cap rates = $2M value. Raise NOI to $140K and value becomes $2.33M — $333K increase from a $20K NOI improvement. This non-linear relationship is why commercial operators focus obsessively on expense management and rent optimization."
            },
            {
              heading: "Financing Multifamily",
              body: "5+ units require commercial loans, not conventional. Typical terms 2024-2025: 25-30% down, 5-year fixed / 25-year amortization / balloon at 5 years (some 7/30 and 10/30 available), DSCR 1.25 minimum, recourse at smaller sizes / non-recourse above $1M+. Rate premium: +0.5% to +1.5% over residential. Fannie Mae Small Balance Loans ($1-6M), Freddie Mac Small Balance Loans, and local portfolio lenders are primary sources. Commercial closings typically take 60-90 days vs 30-45 for residential."
            },
            {
              heading: "Underwriting a Multifamily Deal",
              body: "Required documents: T12 (trailing 12 months income/expense), current rent roll with lease dates and amounts, property tax history, insurance history, capital improvement history, utility bills, payroll for on-site management, vendor contracts, lease agreements. Your analysis: verify T12 against bank deposits if possible, check rent roll against actual leases, inspect every unit not just model units, verify rent deposits with tenants directly if permitted, research deferred capital needs (roof, parking lot, boilers)."
            },
            {
              heading: "Value-Add Strategies",
              body: "(1) Rent optimization — bring below-market leases to market over 1-3 years as they renew, often 15-30% upside. (2) Expense reduction — renegotiate contracts, separately-meter utilities, add recycling fees, install LED lighting. (3) Physical improvements — exterior updates (landscaping, paint), unit interior renovations to command higher rents ($5-15K per unit typical, $150-300 rent increase). (4) Revenue addition — laundry income, parking fees, storage rentals, pet fees. Each dollar added to NOI compounds at the cap rate when you sell."
            },
            {
              heading: "Operating a Multifamily Property",
              body: "Significantly different from single-family: on-site manager often required at 30+ units, commercial-grade systems (central boilers, large HVAC, commercial-grade laundry), commercial vendor relationships (landscaping contracts, snow removal, trash), tenant turnover management (30%+ annual turnover is normal), compliance with fair housing at scale, professional property management essentially mandatory. Management fees: 4-8% of collected rents for larger properties (vs 8-10% for SFR)."
            }
          ]
        },
        "commercial-types": {
          title: "Commercial Property Types",
          icon: <Home size={14} />,
          sections: [
            {
              heading: "Small Retail (Strip Centers, Single-Tenant)",
              body: "Shopping centers under 50K sqft, single-tenant retail (Dollar Generals, drug stores, quick-serve restaurants). Tenant-quality driven — investment-grade tenant (national chain) vs local tenant creates massive risk differential. Lease structures: NNN (tenant pays taxes, insurance, maintenance) most common for single-tenant, modified gross for multi-tenant strips. Cap rates 2024-2025: 6.5-8.5% for small retail, 5.5-7% for investment-grade single-tenant NNN. Management-lite but exposed to retail apocalypse risk."
            },
            {
              heading: "Office",
              body: "Post-2020 office demand collapsed and hasn't fully recovered. Current dynamics: Class A (high-end, new construction) holding up moderately, Class B/C (older, suburban, secondary markets) deeply distressed with vacancy rates 20%+. Buy opportunities for contrarians: deeply discounted office buildings (30-50% below peak values) where conversion to residential or mixed-use is feasible. Risks: long sales cycles, difficult financing, lease risk concentration. Not a beginner category."
            },
            {
              heading: "Industrial (Warehouse, Flex, Light Manufacturing)",
              body: "Industrial has been the best-performing commercial category for a decade. E-commerce growth drives warehouse demand; reshoring of manufacturing drives light industrial. Typical deal: 10-50K sqft warehouse with 1-3 tenants on 5-10 year NNN leases. Cap rates: 5.5-7.5% depending on location and tenant. Entry point: $1-5M for smaller properties. Advantages: long leases reduce turnover, low management intensity, aligned with economic trends."
            },
            {
              heading: "Self-Storage",
              body: "Recession-resistant, management-light, scalable. Typical deal: 50K-150K sqft facility with 400-800 units. Revenue per square foot: $10-$20 annually. Management: 1-2 on-site staff for smaller facilities, REIT competition intense in major markets. Value-add opportunities: add climate control, expand square footage, add RV/boat storage, raise rents on below-market tenants. Cap rates: 5.5-7.5%. Financing: commercial loans or SBA for owner-operators, REIT-style sponsorship for larger deals. Growing popularity means deal competition is increasing."
            },
            {
              heading: "Mobile Home Parks",
              body: "Niche but economically attractive. Business model: you own the land and infrastructure (water, sewer, roads), residents own their mobile homes and pay lot rent. Operational simplicity: no interior maintenance of homes (it's tenant property), long tenant tenure (moving a mobile home costs $5-10K so tenants stay), recession-resistant (housing of last resort). Cap rates: 7-10% typical. Value-add: raise lot rents to market (often significantly below), add utilities, fix infrastructure, improve curb appeal. Challenges: institutional consolidation (REITs buying up parks), tenant class often low-income, some states highly regulated."
            },
            {
              heading: "Land and Development",
              body: "Not for beginners. Land banking (buying and holding for appreciation), subdivision (buying acreage, splitting into lots, selling retail), ground-up development (building homes or commercial on raw land), entitlement work (getting zoning changes before selling). All require specialized expertise and capital. Ground-up development can return 20-40% IRR in hot markets but also concentrate risk into a single project. Most investors are better served waiting until they have 10+ years of rental experience before exploring development."
            }
          ]
        }
      }
    },

    glossary: {
      title: "Glossary",
      icon: <BookOpen size={16} />,
      topics: {
        "complete-glossary": {
          title: "Complete Real Estate Investing Glossary",
          icon: <FileText size={14} />,
          isGlossary: true,
          terms: [
            { term: "Abstract of Title", definition: "A historical summary of all recorded documents affecting title to a property. Older alternative to modern title insurance searches." },
            { term: "Absorption Rate", definition: "The rate at which available properties sell in a market during a given time period. Used to measure demand and predict time to sell." },
            { term: "Adjustable Rate Mortgage (ARM)", definition: "A mortgage with an interest rate that changes periodically based on an index. Common: 5/1 ARM (fixed 5 years, then adjusts annually)." },
            { term: "Adverse Possession", definition: "The legal doctrine by which someone can claim title to real property through continuous, open, hostile use for a statutory period (usually 7-20 years depending on state)." },
            { term: "Amortization", definition: "The gradual paydown of loan principal over the loan term via scheduled payments. Early payments are mostly interest; later payments are mostly principal." },
            { term: "Appraisal Contingency", definition: "A contract clause allowing buyer to terminate or renegotiate if the property doesn't appraise at or above purchase price." },
            { term: "ARV", definition: "After Repair Value — the estimated market value of a property once renovations are complete." },
            { term: "As-Is", definition: "Property sold in its current condition, with the seller making no repairs or disclosures beyond legal minimums." },
            { term: "Assessment", definition: "The value assigned to a property by the local tax authority for property tax purposes. Often differs substantially from market value." },
            { term: "Assignment", definition: "Transferring contract rights to purchase a property to a third party, typically for a fee. The core wholesaling strategy." },
            { term: "Assumption", definition: "The buyer takes over the seller's existing mortgage, keeping its terms intact. Available on most FHA/VA loans; rare on conventional." },
            { term: "Balloon Payment", definition: "A large lump-sum payment due at the end of a loan term, common in seller financing and commercial loans." },
            { term: "Basis", definition: "The original cost of an asset adjusted for improvements, depreciation, and other factors. Used to calculate gain/loss at sale." },
            { term: "Basis Points (BPS)", definition: "1/100th of a percent. 50 bps = 0.50%. Used to quote rate changes precisely." },
            { term: "Bird Dog", definition: "A person who finds potential investment properties and refers them to investors, often for a finder's fee." },
            { term: "Blanket Mortgage", definition: "A single mortgage that covers multiple properties. Allows owners to release individual properties as they're sold without paying off the entire loan." },
            { term: "Bridge Loan", definition: "Short-term financing (6-24 months) that bridges the gap between the purchase of a new property and the sale of an existing one, or between acquisition and long-term financing." },
            { term: "BRRRR", definition: "Buy, Rehab, Rent, Refinance, Repeat — a capital-recycling rental investment strategy." },
            { term: "Buy Box", definition: "An investor's defined criteria for what properties they'll consider: price range, location, property type, condition, returns required. Reduces analysis paralysis." },
            { term: "Capital Expenditures (CapEx)", definition: "Major expenses that extend the life of a property: roof, HVAC, plumbing, flooring. Typically depreciated rather than expensed." },
            { term: "Capital Gains", definition: "Profit from the sale of an asset. Short-term (held <1 year): taxed as ordinary income. Long-term (>1 year): taxed at preferential rates (0/15/20%)." },
            { term: "Capital Stack", definition: "The layered structure of debt and equity financing a real estate deal. Senior debt, junior debt, preferred equity, common equity in order of repayment priority." },
            { term: "Cap Rate", definition: "Capitalization Rate = NOI / Property Value. Indicator of return independent of financing." },
            { term: "Carrying Costs", definition: "Expenses incurred to hold a property during rehab or vacancy: mortgage, taxes, insurance, utilities, maintenance. Major factor in flip and BRRRR deal analysis." },
            { term: "Cash-on-Cash Return", definition: "Annual pre-tax cash flow / total cash invested. The return metric that accounts for leverage." },
            { term: "Chain of Title", definition: "The historical sequence of ownership transfers for a property, established through recorded deeds." },
            { term: "Chattel", definition: "Personal property that is movable, as opposed to real estate. Relevant in mobile home park investing where homes are chattel but land is real property." },
            { term: "Clear Title", definition: "Title to a property that is free of liens, claims, or other encumbrances. Required for most sales and financing." },
            { term: "Closing", definition: "The final step in a real estate transaction where ownership transfers and funds are disbursed. Typically 2-4 hours with a title company or attorney." },
            { term: "Closing Costs", definition: "Fees paid at closing: title insurance, origination, recording, attorney, survey, taxes. Typically 2-4% of purchase price." },
            { term: "Closing Disclosure (CD)", definition: "The federally-mandated 5-page document disclosing final loan terms and closing costs, delivered at least 3 business days before closing." },
            { term: "Cloud on Title", definition: "Any claim or defect that makes title uncertain or unmarketable. Must be resolved before most sales can close." },
            { term: "CMA", definition: "Comparative Market Analysis — a real estate agent's informal property valuation based on recent comparable sales." },
            { term: "Collateral", definition: "Property pledged to secure a loan. In real estate lending, the property itself is the collateral." },
            { term: "Comp", definition: "Comparable sale. A recently sold property similar to the subject property, used to estimate value." },
            { term: "Condominium (Condo)", definition: "Individual ownership of a unit within a multi-unit building, combined with shared ownership of common elements. Governed by HOA." },
            { term: "Contingency", definition: "A condition in a contract that must be met for the contract to remain binding. Common: inspection, financing, appraisal, title." },
            { term: "Contract for Deed", definition: "A financing arrangement where the seller retains title until the buyer completes scheduled payments. Also called a land contract." },
            { term: "Conventional Loan", definition: "A mortgage conforming to Fannie Mae / Freddie Mac standards, not backed by a government agency." },
            { term: "Conveyance", definition: "The legal transfer of ownership from one party to another, typically via deed." },
            { term: "Cooperative (Co-op)", definition: "Multi-unit housing where residents own shares in a corporation that owns the building, rather than owning real property. Common in NYC." },
            { term: "COO (Certificate of Occupancy)", definition: "A document from local government certifying a building is habitable and code-compliant. Required after substantial rehabs in many jurisdictions." },
            { term: "Cost Approach", definition: "A valuation method based on the cost to reproduce the property minus depreciation plus land value. Used primarily for unique properties without good comps." },
            { term: "Cost Segregation", definition: "An engineering-based analysis that reclassifies portions of a building into shorter depreciation categories to accelerate tax deductions." },
            { term: "Days on Market (DOM)", definition: "The number of days a property has been actively listed for sale. Long DOM indicates motivated sellers or overpricing." },
            { term: "Debt-to-Income (DTI)", definition: "The ratio of monthly debt payments to gross monthly income. Key lender underwriting metric; most loans cap at 43-50%." },
            { term: "Deed", definition: "The legal document transferring ownership of real property. Common types: warranty deed (strongest protection), quitclaim deed (no warranty of title)." },
            { term: "Deed in Lieu of Foreclosure", definition: "An agreement where a borrower voluntarily transfers property to the lender to avoid foreclosure. Spares both parties the foreclosure process." },
            { term: "Default", definition: "Failure to meet contract or loan obligations, typically missed payments. Triggers lender remedies including foreclosure." },
            { term: "Depreciation", definition: "Tax deduction for the wear-and-tear of a rental building over its useful life (27.5 years residential, 39 years commercial)." },
            { term: "Distressed Property", definition: "A property in poor condition, behind on payments, or owned by a motivated seller. Typically sold at a discount to market value." },
            { term: "DSCR", definition: "Debt Service Coverage Ratio = NOI / Annual Debt Service. Measures a property's ability to cover its mortgage payment. Key metric for non-QM rental loans." },
            { term: "Due Diligence", definition: "The investigation period between offer acceptance and closing when a buyer inspects, reviews documents, and confirms the deal's viability." },
            { term: "Due-on-Sale Clause", definition: "A mortgage clause allowing the lender to demand full repayment if the property is transferred without lender consent. Rarely enforced if payments remain current." },
            { term: "Earnest Money Deposit (EMD)", definition: "Buyer's good-faith deposit made when a contract is accepted, typically 1-3% of purchase price." },
            { term: "Easement", definition: "A legal right to use someone else's property for a specific purpose (utility access, driveway, etc.)." },
            { term: "Effective Gross Income", definition: "Gross potential rent minus vacancy and collection losses. The actual income figure used in NOI calculation." },
            { term: "Encroachment", definition: "A structure or improvement that extends onto a neighboring property, creating a title defect that must be resolved." },
            { term: "Encumbrance", definition: "Any claim, lien, or charge on a property's title that may affect its transferability." },
            { term: "Equity", definition: "Property value minus outstanding mortgage balance. Your ownership stake." },
            { term: "Escrow", definition: "A neutral third party holding funds or documents during a real estate transaction until conditions are met." },
            { term: "Estoppel Certificate", definition: "A signed statement from a tenant confirming lease terms, rent paid, and any disputes. Required documentation when buying tenanted property." },
            { term: "Eviction", definition: "The legal process to remove a tenant for lease violations or non-payment. Timeline and procedure vary dramatically by state." },
            { term: "Fair Market Value (FMV)", definition: "The price a property would sell for in an arm's-length transaction between knowledgeable, willing, and unpressured parties." },
            { term: "Fannie Mae / Freddie Mac", definition: "Government-sponsored enterprises that buy conforming mortgages from originating lenders. Set the underwriting standards for 'conventional' loans." },
            { term: "FHA Loan", definition: "Federal Housing Administration-backed mortgage allowing 3.5% down for owner-occupants. Available on 1-4 unit properties." },
            { term: "First Mortgage", definition: "The primary mortgage on a property, taking precedence over later (junior) liens in case of foreclosure." },
            { term: "Fixed Rate Mortgage", definition: "A mortgage with an interest rate that doesn't change over the loan term. Provides payment predictability." },
            { term: "Fixture", definition: "Personal property that has been attached to real estate and is now part of it. Transfers with sale unless specifically excluded." },
            { term: "Flip", definition: "Buying a property, renovating quickly, and selling for profit — typically within 6-12 months. Taxed as short-term gain or dealer income." },
            { term: "Forbearance", definition: "A temporary lender agreement to reduce or suspend payments, usually due to borrower hardship. Repayment typically required later." },
            { term: "Foreclosure", definition: "Legal process by which a lender repossesses property after borrower default. Judicial (court-supervised, longer) or non-judicial (trustee sale, faster) depending on state." },
            { term: "FSBO", definition: "For Sale By Owner — a property sold without a real estate agent representing the seller." },
            { term: "Gentrification", definition: "The process by which a working-class or deteriorated neighborhood transitions to a higher-income demographic, often bringing rising property values and displacement." },
            { term: "Ground Lease", definition: "A long-term (50-99 year) lease of land where the tenant builds and owns improvements on the land. Common in commercial real estate." },
            { term: "GRM", definition: "Gross Rent Multiplier = property price / annual gross rent. Quick screening tool, ignores expenses." },
            { term: "Hard Money", definition: "Short-term, high-rate, asset-based financing from private lenders. Used for acquisition and rehab when conventional loans won't work." },
            { term: "HELOC", definition: "Home Equity Line of Credit — revolving credit secured by equity in primary residence. Flexible but variable rate." },
            { term: "HOA", definition: "Homeowners Association — governing body for planned communities, condos, and townhomes. Collects dues and enforces covenants." },
            { term: "Hold Period", definition: "The length of time an investor keeps a property. Affects tax treatment (short-term vs long-term capital gains) and strategy." },
            { term: "HUD", definition: "Housing and Urban Development — federal agency overseeing housing policy; 'HUD home' refers to a foreclosed property previously FHA-insured." },
            { term: "Impound Account", definition: "An escrow account where the lender collects monthly installments for property taxes and insurance, paying them when due. Also called escrow account." },
            { term: "Income Approach", definition: "A valuation method based on the property's NOI and market cap rate. Primary method for commercial and multifamily." },
            { term: "Interest-Only Loan", definition: "A loan where payments cover only interest for an initial period (typically 5-10 years), then amortize over the remaining term. Common in hard money and certain commercial loans." },
            { term: "IRR", definition: "Internal Rate of Return — the annualized rate of return that accounts for the time value of money across all cash flows of an investment." },
            { term: "Jumbo Loan", definition: "A mortgage exceeding Fannie Mae / Freddie Mac conforming loan limits ($766K+ in most areas for 2024). Higher rates and stricter qualification." },
            { term: "Land Contract", definition: "A financing arrangement where the seller holds title until the buyer completes payments. Also called contract for deed or installment contract." },
            { term: "Landlord", definition: "The owner of rental property who leases it to tenants. Legal duties vary by state but generally include habitability and quiet enjoyment." },
            { term: "Lease Option", definition: "A contract combining a lease agreement with an option to purchase during the lease term. Tenant pays option consideration for the future right to buy." },
            { term: "Leasehold", definition: "The right to use and occupy property under a lease agreement, as opposed to fee simple ownership." },
            { term: "Leverage", definition: "Using borrowed money to increase the potential return (and risk) of an investment. Real estate's low-cost leverage is a key wealth-building advantage." },
            { term: "Lien", definition: "A legal claim against property for unpaid debt. Mortgages are voluntary liens; tax liens, mechanic's liens, and judgment liens are involuntary." },
            { term: "Lien Waiver", definition: "A document signed by a contractor or supplier waiving their right to file a mechanic's lien for the work or materials covered. Required before each payment draw." },
            { term: "Liquidity", definition: "How quickly an asset can be converted to cash at fair value. Real estate is relatively illiquid — weeks to months to sell." },
            { term: "Lis Pendens", definition: "A public notice of pending lawsuit affecting real property. Clouds title, makes the property difficult to sell until resolved." },
            { term: "LTV", definition: "Loan-to-Value = loan amount / property value. Key underwriting metric." },
            { term: "MAO", definition: "Maximum Allowable Offer — the highest price you can pay and still hit your return targets. Formula varies by strategy." },
            { term: "Mechanic's Lien", definition: "A lien filed by a contractor or materials supplier for unpaid work on a property. Can block sale or refinance until resolved." },
            { term: "MLS", definition: "Multiple Listing Service — the database of active and sold real estate listings maintained by local Realtor associations. Access typically requires a licensed agent." },
            { term: "Mortgage", definition: "A loan secured by real property. Also refers to the document creating the lender's security interest." },
            { term: "Mortgage Broker", definition: "An intermediary who shops loans from multiple lenders on behalf of borrowers. Compensated by lender or borrower." },
            { term: "NOI", definition: "Net Operating Income = Gross Income − Operating Expenses. Does NOT include mortgage payments. Foundation of commercial real estate valuation." },
            { term: "Non-Conforming Loan", definition: "A mortgage that doesn't meet Fannie Mae / Freddie Mac guidelines. Includes jumbo loans, non-QM loans, and portfolio loans." },
            { term: "Non-Recourse Loan", definition: "A loan secured only by the collateral property; the lender cannot pursue the borrower's other assets if the property doesn't cover the debt. Common in large commercial loans." },
            { term: "Note", definition: "The promissory note — a written promise to repay a loan. The legal instrument evidencing the debt." },
            { term: "Opportunity Zone", definition: "Federally designated economically-distressed area offering capital gains tax benefits for qualified long-term investments." },
            { term: "Owner Financing", definition: "Seller carries the mortgage for the buyer. Flexible terms, no institutional underwriting. Also called 'seller financing.'" },
            { term: "PITI", definition: "Principal, Interest, Taxes, Insurance — the four components of a typical mortgage payment." },
            { term: "Pocket Listing", definition: "A property marketed privately without MLS entry, typically to a limited network of buyers. Shrinking in prevalence due to MLS rules." },
            { term: "Points", definition: "Prepaid interest, 1 point = 1% of loan amount. Used to buy down rates or paid as origination fees." },
            { term: "PMI", definition: "Private Mortgage Insurance — required on conventional loans with <20% down. Protects the lender, not the borrower. Not applicable to most investment loans." },
            { term: "Pre-Approval", definition: "A lender's preliminary written commitment to provide a mortgage, subject to appraisal and final verification. Stronger than pre-qualification." },
            { term: "Preforeclosure", definition: "The period between a Notice of Default filing and foreclosure auction. Owner may still negotiate with lender or sell to an investor." },
            { term: "Prepayment Penalty", definition: "A fee charged by a lender if you pay off a loan before maturity. Common on DSCR loans (3-5 year declining schedule)." },
            { term: "Principal", definition: "The remaining balance of a loan, separate from interest." },
            { term: "Private Mortgage Lender", definition: "An individual or small company that lends on real estate without institutional backing. Terms are negotiated directly." },
            { term: "Pro Forma", definition: "A projection of a property's future income and expenses. Used in deal analysis; should be stress-tested, not taken at face value." },
            { term: "Property Class (A/B/C/D)", definition: "Informal classification of property/neighborhood quality. A = premium, B = middle-class, C = working-class, D = distressed." },
            { term: "Property Management", definition: "The operation and oversight of rental property, including tenant relations, rent collection, maintenance, and accounting. Usually 8-10% of gross rents." },
            { term: "Purchase Money Mortgage", definition: "A mortgage used to finance the purchase of the property, as opposed to a refinance. Can be from a lender or the seller." },
            { term: "Qualified Intermediary", definition: "A third party who holds proceeds during a 1031 exchange, required to maintain the tax-deferred status of the transaction." },
            { term: "Quiet Title Action", definition: "A lawsuit to resolve title disputes or clear clouds on title. Required after tax deed sales and certain other situations." },
            { term: "Rate Lock", definition: "A lender's commitment to hold an interest rate for a specific period (typically 30-60 days) while the loan is processed." },
            { term: "REIT", definition: "Real Estate Investment Trust — a company that owns or finances income-producing real estate. Can be traded on stock exchanges (publicly traded) or private. Allows small investors exposure to commercial real estate." },
            { term: "Rent Control", definition: "Local or state laws limiting the amount landlords can charge or increase rent. Present in CA, NY, NJ, OR, and some other jurisdictions." },
            { term: "REO", definition: "Real Estate Owned — property repossessed by a lender after a failed foreclosure auction. REO properties are sold as-is through the lender's asset manager." },
            { term: "Refinance", definition: "Replacing an existing mortgage with a new one. Rate-and-term (lower rate/payment) or cash-out (pulling equity out)." },
            { term: "Rent Roll", definition: "A document listing all tenants, unit numbers, lease terms, rent amounts, and payment status. Standard requirement when buying existing rental property." },
            { term: "Reserve Fund", definition: "Cash set aside for major repairs, vacancies, and unexpected expenses. Critical for maintaining property performance." },
            { term: "Right of First Refusal", definition: "A contract clause giving someone the right to match any offer the owner receives before the owner sells to a third party." },
            { term: "Seasoning", definition: "The time a borrower must own a property before a lender will refinance based on current value rather than purchase price. Typically 6-12 months conventional, 3-6 months DSCR." },
            { term: "Section 8", definition: "Federal Housing Choice Voucher program where HUD subsidizes rent for qualifying low-income tenants. Tenants pay 30% of income; HUD pays the rest directly to landlord." },
            { term: "Short Sale", definition: "Sale of a property for less than the mortgage balance, requiring lender approval. Longer timeline than traditional sale, often 3-12 months." },
            { term: "Special Warranty Deed", definition: "A deed that warrants title against defects arising during the grantor's ownership only, not before. Common in commercial transactions and REO sales." },
            { term: "Subject-To", definition: "A purchase where the buyer takes title while the seller's existing mortgage remains in place. Buyer makes payments to the seller's lender." },
            { term: "Subordination", definition: "An agreement making one lien junior to another. Required when adding a HELOC behind a first mortgage refinance, for example." },
            { term: "Survey", definition: "A map showing property boundaries, improvements, and encroachments. Sometimes required by lenders, often waived for standard residential." },
            { term: "Sweat Equity", definition: "Value added to a property through the owner's own labor rather than cash expenditure." },
            { term: "Tax Deed", definition: "A deed issued to the purchaser of a property at a tax sale (for unpaid property taxes). Rights vary by state." },
            { term: "Tax Lien", definition: "A government claim against property for unpaid taxes. Takes priority over most other liens in most states." },
            { term: "Tenancy in Common", definition: "Co-ownership of property where each owner holds an undivided fractional interest that can be sold or inherited independently." },
            { term: "Term Sheet", definition: "A non-binding document outlining the proposed terms of a loan or investment, issued before final loan documents are drawn." },
            { term: "Title Insurance", definition: "Insurance protecting against defects in property title discovered after closing. Owner's policy (one-time premium) and lender's policy. Critical — never close without it." },
            { term: "Title Search", definition: "The process of examining public records to confirm property ownership and identify liens or encumbrances." },
            { term: "Triple Net Lease (NNN)", definition: "A lease where the tenant pays property taxes, insurance, and maintenance in addition to rent. Common in commercial single-tenant properties." },
            { term: "Trust Deed", definition: "An alternative to a mortgage, used in some states. A trustee holds title as security for the loan. Allows faster non-judicial foreclosure." },
            { term: "Trustee Sale", definition: "A foreclosure sale conducted by a trustee in non-judicial foreclosure states. Faster than judicial foreclosure." },
            { term: "Turnkey", definition: "A fully renovated, already-tenanted rental property sold to investors. No rehab work required. Usually priced at retail or above, with little forced-appreciation upside." },
            { term: "Underwriting", definition: "The lender's process of evaluating borrower and property to approve a loan. Reviews credit, income, assets, appraisal, title." },
            { term: "Unlawful Detainer", definition: "The legal term for an eviction lawsuit in many states." },
            { term: "Usury", definition: "Charging interest above the legal maximum rate. Limits vary by state and loan type. Hard money lenders must be careful with rate + points totals." },
            { term: "VA Loan", definition: "Veterans Affairs-backed mortgage for eligible veterans. 0% down, no PMI, available for owner-occupied 1-4 unit properties." },
            { term: "Vacancy Rate", definition: "The percentage of time a rental property sits unoccupied. Used in underwriting — typical 5-10% assumed for SFR, higher for multifamily." },
            { term: "Variance", definition: "A permitted exception to zoning rules, granted by local zoning board. Required when property or intended use doesn't conform to current zoning." },
            { term: "Warranty Deed", definition: "A deed providing the strongest title guarantees, warranting that the grantor holds clear title throughout the entire chain of title." },
            { term: "Wholesale", definition: "Finding a discounted property, putting it under contract, and assigning the contract to an end buyer for a fee. Requires no capital but requires strong marketing and buyer network." },
            { term: "Wraparound Mortgage", definition: "A mortgage that 'wraps around' an existing mortgage, where the seller carries a new note that includes the balance of the existing loan." },
            { term: "Yield", definition: "The annual return on an investment, expressed as a percentage. Can refer to cap rate, cash-on-cash, or total return depending on context." },
            { term: "Zoning", definition: "Local government regulation of land use (residential, commercial, industrial, mixed-use). Zoning violations can prevent intended use and halt investment plans." }
          ]
        }
      }
    }
  };

  const category = curriculum[activeCategory];
  const topic = category.topics[activeTopic] || Object.values(category.topics)[0];

  // When category changes, reset to first topic in that category
  const handleCategoryChange = (catKey) => {
    setActiveCategory(catKey);
    const firstTopic = Object.keys(curriculum[catKey].topics)[0];
    setActiveTopic(firstTopic);
  };

  const filteredGlossaryTerms = useMemo(() => {
    if (!topic.isGlossary) return null;
    if (!glossarySearch.trim()) return topic.terms;
    const q = glossarySearch.toLowerCase();
    return topic.terms.filter(t =>
      t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)
    );
  }, [topic, glossarySearch]);

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile() ? "16px" : "24px 28px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="serif" style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>
          Education Center
        </h1>
        <div style={{ fontSize: 14, color: THEME.textMuted, marginTop: 6, maxWidth: 720 }}>
          A comprehensive curriculum covering strategy, analysis, financing, market research, tax optimization, and risk management for real estate investors. Updated for 2024-2025 market conditions.
        </div>
      </div>

      {/* Category tabs */}
      <div style={{
        display: "flex",
        gap: 6,
        marginBottom: 24,
        flexWrap: "wrap",
        borderBottom: `1px solid ${THEME.border}`,
        paddingBottom: 0
      }}>
        {Object.entries(curriculum).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => handleCategoryChange(key)}
            style={{
              padding: "10px 16px", fontSize: 13, fontWeight: 600,
              background: "transparent",
              color: activeCategory === key ? THEME.accent : THEME.textMuted,
              borderBottom: activeCategory === key ? `2px solid ${THEME.accent}` : "2px solid transparent",
              borderRadius: 0,
              display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
              marginBottom: -1
            }}
          >
            {cat.icon}
            {cat.title}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "260px 1fr", gap: 24 }}>
        {/* Topic nav within category */}
        <div>
          <div className="label-xs" style={{ marginBottom: 10 }}>
            {category.title} Topics
          </div>
          {Object.entries(category.topics).map(([key, t]) => (
            <button
              key={key}
              onClick={() => setActiveTopic(key)}
              style={{
                width: "100%", padding: "10px 12px", fontSize: 13,
                background: activeTopic === key ? THEME.bgRaised : "transparent",
                color: activeTopic === key ? THEME.accent : THEME.text,
                border: `1px solid ${activeTopic === key ? THEME.accent : "transparent"}`,
                borderRadius: 6, textAlign: "left", marginBottom: 4,
                display: "flex", alignItems: "center", gap: 8, fontWeight: 600,
                cursor: "pointer", lineHeight: 1.3
              }}
            >
              <span style={{ flexShrink: 0, color: activeTopic === key ? THEME.accent : THEME.textMuted }}>
                {t.icon}
              </span>
              <span>{t.title}</span>
            </button>
          ))}
        </div>

        {/* Topic content */}
        <div>
          <Panel title={topic.title} icon={topic.icon} accent>
            {topic.isGlossary ? (
              <div>
                <div style={{ marginBottom: 18 }}>
                  <input
                    type="text"
                    value={glossarySearch}
                    onChange={(e) => setGlossarySearch(e.target.value)}
                    placeholder={`Search ${topic.terms.length} terms...`}
                    style={{ width: "100%", padding: "10px 14px", fontSize: 14 }}
                  />
                </div>
                <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12 }}>
                  Showing {filteredGlossaryTerms.length} of {topic.terms.length} terms
                </div>
                <div>
                  {filteredGlossaryTerms.map((t, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "14px 0",
                        borderBottom: idx < filteredGlossaryTerms.length - 1 ? `1px solid ${THEME.borderLight}` : "none"
                      }}
                    >
                      <div style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: THEME.accent,
                        marginBottom: 4
                      }}>
                        {t.term}
                      </div>
                      <div style={{
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: THEME.text
                      }}>
                        {t.definition}
                      </div>
                    </div>
                  ))}
                  {filteredGlossaryTerms.length === 0 && (
                    <div style={{
                      textAlign: "center",
                      padding: "40px 20px",
                      color: THEME.textDim,
                      fontSize: 13
                    }}>
                      No terms match "{glossarySearch}"
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                {topic.sections.map((section, idx) => (
                  <div key={idx} style={{
                    marginBottom: 24,
                    paddingBottom: idx < topic.sections.length - 1 ? 20 : 0,
                    borderBottom: idx < topic.sections.length - 1 ? `1px solid ${THEME.borderLight}` : "none"
                  }}>
                    <h3 style={{
                      fontSize: 16,
                      marginBottom: 10,
                      color: THEME.accent,
                      fontWeight: 700
                    }}>
                      {section.heading}
                    </h3>
                    <p style={{
                      fontSize: 14,
                      lineHeight: 1.7,
                      color: THEME.text,
                      margin: 0
                    }}>
                      {section.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Footer note */}
          <div style={{
            marginTop: 16,
            padding: 12,
            background: THEME.bgPanel,
            border: `1px solid ${THEME.border}`,
            borderRadius: 6,
            fontSize: 11,
            color: THEME.textMuted,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}>
            <Info size={14} color={THEME.textDim} />
            <span>
              Educational content only. Real estate, tax, and legal situations vary by jurisdiction and individual circumstances. Consult licensed professionals before acting on any strategy.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   DASHBOARD
   ============================================================================ */
const Dashboard = ({ deals, onOpenDeal, onNewDeal, onDeleteDeal }) => {
  if (!deals.length) {
    return (
      <div style={{
        maxWidth: 1200, margin: "0 auto", padding: "60px 28px", textAlign: "center"
      }}>
        <div style={{
          width: 72, height: 72, margin: "0 auto 20px",
          borderRadius: "50%", background: THEME.bgRaised,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Building2 size={32} color={THEME.accent} />
        </div>
        <h2 className="serif" style={{ fontSize: 28, marginBottom: 8 }}>
          No Deals Yet
        </h2>
        <p style={{ fontSize: 14, color: THEME.textMuted, maxWidth: 420, margin: "0 auto 24px" }}>
          Start analyzing your first investment opportunity. Use the templates to jumpstart your analysis
          or build a deal from scratch.
        </p>
        <button className="btn-primary" onClick={onNewDeal} style={{ padding: "12px 20px", fontSize: 14 }}>
          <Plus size={16} />
          Analyze Your First Deal
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile() ? "16px" : "24px 28px" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 20, flexWrap: "wrap", gap: 12
      }}>
        <div>
          <h1 className="serif" style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
            Deal Dashboard
          </h1>
          <div style={{ fontSize: 13, color: THEME.textMuted, marginTop: 4 }}>
            {deals.length} {deals.length === 1 ? "deal" : "deals"} tracked
          </div>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile() ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 16
      }}>
        {deals.map(deal => {
          const metrics = calcMetrics(deal);
          return (
            <div
              key={deal.id}
              onClick={() => onOpenDeal(deal.id)}
              style={{
                padding: 18, background: THEME.bgPanel,
                border: `1px solid ${THEME.border}`, borderRadius: 8,
                cursor: "pointer", transition: "all 0.15s ease"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = THEME.accent;
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = THEME.border;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {deal.address || "Untitled Deal"}
                  </div>
                  <div style={{ fontSize: 11, color: THEME.textMuted }}>
                    {deal.city}, {deal.state}
                  </div>
                </div>
                <div style={{
                  padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                  background: metrics.grade === "A" ? THEME.greenDim :
                             metrics.grade.startsWith("B") ? THEME.bgOrange :
                             metrics.grade === "C" ? THEME.bgTeal : THEME.redDim,
                  color: metrics.grade === "A" ? THEME.green :
                         metrics.grade.startsWith("B") ? THEME.orange :
                         metrics.grade === "C" ? THEME.teal : THEME.red
                }}>
                  {metrics.grade}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                <div>
                  <div style={{ color: THEME.textMuted, marginBottom: 2 }}>Cash Flow</div>
                  <div style={{ fontWeight: 700, color: metrics.monthlyCashFlow > 0 ? THEME.green : THEME.red }}>
                    {fmtUSD(metrics.monthlyCashFlow)}
                  </div>
                </div>
                <div>
                  <div style={{ color: THEME.textMuted, marginBottom: 2 }}>Cap Rate</div>
                  <div style={{ fontWeight: 700 }}>{metrics.capRate.toFixed(1)}%</div>
                </div>
                <div>
                  <div style={{ color: THEME.textMuted, marginBottom: 2 }}>CoC Return</div>
                  <div style={{ fontWeight: 700 }}>{metrics.cashOnCash.toFixed(1)}%</div>
                </div>
                <div>
                  <div style={{ color: THEME.textMuted, marginBottom: 2 }}>Invested</div>
                  <div style={{ fontWeight: 700 }}>{fmtUSD(metrics.totalInvested, { short: true })}</div>
                </div>
              </div>

              <div style={{
                marginTop: 12, paddingTop: 12, borderTop: `1px solid ${THEME.borderLight}`,
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <div style={{ fontSize: 11, color: THEME.textMuted }}>
                  {deal.propertyType}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this deal?")) onDeleteDeal(deal.id);
                  }}
                  className="btn-danger"
                  style={{ padding: "4px 8px", fontSize: 11 }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
   TEMPLATE PICKER MODAL
   ============================================================================ */
const TemplatePicker = ({ onSelect, onClose }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 100, padding: 16
  }}
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: THEME.bg, borderRadius: 12, padding: 24,
        maxWidth: 720, width: "100%", maxHeight: "90vh", overflow: "auto"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 className="serif" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
            Choose a Template
          </h2>
          <div style={{ fontSize: 13, color: THEME.textMuted, marginTop: 4 }}>
            Start with pre-filled values for common deal types
          </div>
        </div>
        <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}>
          <X size={18} />
        </button>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile() ? "1fr" : "repeat(2, 1fr)",
        gap: 12
      }}>
        {Object.entries(DEAL_TEMPLATES).map(([key, template]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            style={{
              padding: 16, textAlign: "left",
              border: `1px solid ${THEME.border}`, borderRadius: 8,
              background: THEME.bgPanel, cursor: "pointer"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = THEME.accent;
              e.currentTarget.style.background = THEME.bgRaised;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = THEME.border;
              e.currentTarget.style.background = THEME.bgPanel;
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ color: THEME.accent }}>{template.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{template.name}</div>
            </div>
            <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 8 }}>
              {template.description}
            </div>
            <div style={{ fontSize: 11, color: THEME.textDim, display: "flex", gap: 10 }}>
              <span>{fmtUSD(template.defaults.purchasePrice, { short: true })} purchase</span>
              <span>•</span>
              <span>${template.defaults.rentEstimate}/mo rent</span>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => onSelect(null)}
        className="btn-ghost"
        style={{ marginTop: 16, width: "100%", padding: "10px 16px", fontSize: 13 }}
      >
        Skip — Start from blank
      </button>
    </div>
  </div>
);

/* ============================================================================
   MAIN APP — BRRRRTracker
   ============================================================================ */
const STORAGE_KEY = "dealtrack-deals";

const createBlankDeal = (template = null) => {
  const base = {
    id: `deal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    address: "",
    propertyType: "Single Family",
    bedrooms: 3, bathrooms: 2, sqft: 1500,
    city: "", state: "", neighborhood: "",
    purchasePrice: 0, rehabBudget: 0, arv: 0, rentEstimate: 0, rehabMonths: 3,
    downPayment: 25, interestRate: 7.5, loanTermYears: 30,
    closingCosts: 0, holdingCosts: 0,
    propertyTax: 0, insurance: 0, capex: 0, repairMaintenance: 0,
    vacancy: 8, mgmtFee: 10, hoa: 0,
    notes: ""
  };
  if (template && DEAL_TEMPLATES[template]) {
    return { ...base, ...DEAL_TEMPLATES[template].defaults };
  }
  return base;
};

export default function BRRRRTracker() {
  const [deals, setDeals] = useState([]);
  const [view, setView] = useState("dashboard");
  const [activeDealId, setActiveDealId] = useState(null);
  const [draftDeal, setDraftDeal] = useState(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load deals from localStorage on mount
  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" && window.localStorage
        ? window.localStorage.getItem(STORAGE_KEY)
        : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setDeals(parsed);
      }
    } catch (err) {
      console.warn("Could not load saved deals:", err);
    }
    setLoaded(true);
  }, []);

  // Persist deals to localStorage
  useEffect(() => {
    if (!loaded) return;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
      }
    } catch (err) {
      console.warn("Could not save deals:", err);
    }
  }, [deals, loaded]);

  const activeDeal = useMemo(() => {
    if (draftDeal) return draftDeal;
    return deals.find(d => d.id === activeDealId) || null;
  }, [deals, activeDealId, draftDeal]);

  const handleNewDeal = useCallback(() => {
    setShowTemplatePicker(true);
  }, []);

  const handleTemplateSelect = useCallback((templateKey) => {
    const fresh = createBlankDeal(templateKey);
    setDraftDeal(fresh);
    setActiveDealId(null);
    setShowTemplatePicker(false);
    setView("analyzer");
  }, []);

  const handleOpenDeal = useCallback((dealId) => {
    setActiveDealId(dealId);
    setDraftDeal(null);
    setView("analyzer");
  }, []);

  const handleUpdateDraft = useCallback((updates) => {
    if (draftDeal) {
      setDraftDeal({ ...draftDeal, ...updates, updatedAt: new Date().toISOString() });
    } else if (activeDealId) {
      setDeals(prev => prev.map(d =>
        d.id === activeDealId
          ? { ...d, ...updates, updatedAt: new Date().toISOString() }
          : d
      ));
    }
  }, [draftDeal, activeDealId]);

  const handleSaveDeal = useCallback(() => {
    if (draftDeal) {
      setDeals(prev => [draftDeal, ...prev]);
      setActiveDealId(draftDeal.id);
      setDraftDeal(null);
    }
    alert("Deal saved successfully.");
  }, [draftDeal]);

  const handleDeleteDeal = useCallback((dealId) => {
    setDeals(prev => prev.filter(d => d.id !== dealId));
    if (activeDealId === dealId) {
      setActiveDealId(null);
      setDraftDeal(null);
      setView("dashboard");
    }
  }, [activeDealId]);

  const handleBack = useCallback(() => {
    setDraftDeal(null);
    setActiveDealId(null);
    setView("dashboard");
  }, []);

  const handleChangeView = useCallback((next) => {
    setView(next);
    if (next !== "analyzer") {
      setDraftDeal(null);
      setActiveDealId(null);
    }
  }, []);

  return (
    <div className="brrrr-root">
      <style>{STYLE_TAG}</style>

      <Header
        view={view}
        onChangeView={handleChangeView}
        onNewDeal={handleNewDeal}
      />

      {view === "dashboard" && (
        <Dashboard
          deals={deals}
          onOpenDeal={handleOpenDeal}
          onNewDeal={handleNewDeal}
          onDeleteDeal={handleDeleteDeal}
        />
      )}

      {view === "analyzer" && activeDeal && (
        <Analyzer
          deal={activeDeal}
          onUpdate={handleUpdateDraft}
          onSave={handleSaveDeal}
          onBack={handleBack}
          onDelete={activeDealId ? () => {
            if (confirm("Delete this deal permanently?")) handleDeleteDeal(activeDealId);
          } : null}
        />
      )}

      {view === "analyzer" && !activeDeal && (
        <div style={{ maxWidth: 600, margin: "60px auto", padding: 28, textAlign: "center" }}>
          <p style={{ color: THEME.textMuted, marginBottom: 20 }}>
            No deal selected. Start a new analysis or pick one from the dashboard.
          </p>
          <button className="btn-primary" onClick={handleNewDeal}>
            <Plus size={14} />
            New Deal
          </button>
        </div>
      )}

      {view === "market" && <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile() ? "16px" : "24px 28px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 className="serif" style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
            Market Intelligence
          </h1>
          <div style={{ fontSize: 13, color: THEME.textMuted, marginTop: 4 }}>
            Research investment markets across the US
          </div>
        </div>
        <AdvancedMarketIntel />
      </div>}

      {view === "education" && <EducationCenter />}

      {showTemplatePicker && (
        <TemplatePicker
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}

      <div style={{
        maxWidth: 1400, margin: "0 auto",
        padding: "24px 28px", borderTop: `1px solid ${THEME.border}`,
        marginTop: 60,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 11, color: THEME.textMuted, flexWrap: "wrap", gap: 8
      }}>
        <div>DealTrack v3.0 Professional</div>
        <div>© 2026 DealTrack</div>
      </div>
    </div>
  );
}

