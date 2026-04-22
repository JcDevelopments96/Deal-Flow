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
  PiggyBank, RotateCcw, Trophy
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
   THEME + FONTS (ORANGE PRIMARY + TEAL — clean light)
   ============================================================================ */
const THEME = {
  bg: "#FFFFFF",          // Pure white canvas
  bgPanel: "#FAFAFA",     // Panel surfaces — subtle off-white
  bgInput: "#FFFFFF",     // Inputs match canvas
  bgRaised: "#FFF7ED",    // Hover / raised — warm orange-50
  border: "#E2E8F0",      // Standard border (slate-200)
  borderLight: "#F1F5F9", // Subtle dividers
  text: "#0F172A",        // Primary text (slate-900)
  textMuted: "#475569",   // Secondary text (slate-600) — high-contrast for scanning
  textDim: "#94A3B8",     // Placeholders / tertiary (slate-400)
  accent: "#EA580C",      // Orange-600 — primary CTA & active states
  accentDim: "#C2410C",   // Orange-700 — hover
  secondary: "#0D9488",   // Teal-600 — secondary emphasis
  secondaryDim: "#0F766E",// Teal-700 — hover
  green: "#059669",       // Emerald-600 (positive cash flow)
  greenDim: "#D1FAE5",    // Emerald-100
  red: "#DC2626",         // Red-600 (negative / delete)
  redDim: "#FEE2E2",      // Red-100
  orange: "#EA580C",
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
  border-color: ${THEME.accent}; box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.12);
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

  const totalInvested = purchasePrice * (downPayment / 100) + rehabBudget + closingCosts + holdingCosts;

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
    vacancyLoss, mgmtCost, effectiveIncome, totalROI
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
      [`BRRRR Score: ${metrics.score}/100 (${metrics.grade})`, `ROI: ${metrics.totalROI?.toFixed(1) || '0.0'}%`]
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

const StatRow = ({ label, value, valueColor, bold, mono = true, borderTop, sublabel }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "9px 0",
    borderTop: borderTop ? `1px solid ${THEME.border}` : "none"
  }}>
    <div>
      <div style={{ fontSize: 12, color: THEME.textMuted, fontWeight: bold ? 600 : 400 }}>{label}</div>
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
        <StatRow label="Total Cash Required" value={fmtUSD(metrics.totalInvested)} bold valueColor={THEME.accent} />
        <StatRow label="Loan Amount" value={fmtUSD(deal.purchasePrice * ((100 - deal.downPayment) / 100))} />
        <StatRow label="Monthly P&I Payment" value={fmtUSD(metrics.monthlyPI)} />
        <StatRow
          label="Purchase vs ARV"
          value={`${((deal.purchasePrice / deal.arv) * 100).toFixed(1)}%`}
          valueColor={deal.purchasePrice <= deal.arv * 0.7 ? THEME.green : THEME.orange}
        />
        <StatRow
          label="70% Rule Status"
          value={metrics.seventyPercentRule ? "PASS" : "FAIL"}
          valueColor={metrics.seventyPercentRule ? THEME.green : THEME.red}
          bold
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
              <StatRow label="New Loan Amount" value={fmtUSD(scenarios[selectedScenario]?.newLoanAmount)} bold />
              <StatRow label="Loan-to-Value Ratio" value={`${scenarios[selectedScenario]?.loanToValue}%`} />
              <StatRow label="Interest Rate" value={`${scenarios[selectedScenario]?.interestRate}%`} />
              <StatRow label="New Monthly P&I" value={fmtUSD(scenarios[selectedScenario]?.newMonthlyPI)} valueColor={THEME.secondary} />
            </div>

            <div>
              <h5 style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12, textTransform: "uppercase" }}>
                Cash Out Analysis
              </h5>
              <StatRow label="Gross Cash Out" value={fmtUSD(scenarios[selectedScenario]?.grossCashOut)} />
              <StatRow label="Total Refi Costs" value={fmtUSD(scenarios[selectedScenario]?.totalRefiCosts)} valueColor={THEME.red} />
              <StatRow label="Net Cash Out"
                value={fmtUSD(scenarios[selectedScenario]?.netCashOut)}
                valueColor={scenarios[selectedScenario]?.netCashOut > 0 ? THEME.green : THEME.red}
                bold
              />
              <StatRow label="Capital Recovery %"
                value={`${scenarios[selectedScenario]?.capitalRecovery.toFixed(1)}%`}
                valueColor={scenarios[selectedScenario]?.capitalRecovery >= 75 ? THEME.green :
                           scenarios[selectedScenario]?.capitalRecovery >= 50 ? THEME.orange : THEME.red}
                bold
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
// Low score = red, mid = yellow/amber, high = green. Classic performance heatmap.
const scoreToHeatFill = (t) => {
  const clamped = Math.max(0, Math.min(1, t));
  // Interpolate through three stops:
  //   0.0 = red    (220, 38, 38)
  //   0.5 = amber  (245, 158, 11)
  //   1.0 = green  (5, 150, 105)
  let r, g, b;
  if (clamped < 0.5) {
    const k = clamped / 0.5; // 0..1 within red→amber band
    r = Math.round(220 + (245 - 220) * k);
    g = Math.round(38 + (158 - 38) * k);
    b = Math.round(38 + (11 - 38) * k);
  } else {
    const k = (clamped - 0.5) / 0.5; // 0..1 within amber→green band
    r = Math.round(245 + (5 - 245) * k);
    g = Math.round(158 + (150 - 158) * k);
    b = Math.round(11 + (105 - 11) * k);
  }
  return `rgba(${r}, ${g}, ${b}, 0.80)`;
};

const scoreToHeatStroke = (t) => {
  const clamped = Math.max(0, Math.min(1, t));
  if (clamped < 0.5) return "#DC2626"; // red-600
  if (clamped < 0.75) return "#D97706"; // amber-600
  return "#059669"; // emerald-600
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
                    const range = maxScore - minScore;
                    const t = range > 0 ? (score - minScore) / range : 1;
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
          <span className="label-xs">BRRRR Score Heatmap</span>
          <span style={{ fontSize: 10, color: THEME.textDim }}>
            {allMarkets.length} markets &bull; range {minScore}-{maxScore}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="mono" style={{ fontSize: 11, color: THEME.red, minWidth: 22, fontWeight: 600 }}>
            {minScore}
          </span>
          <div style={{
            flex: 1,
            height: 10,
            borderRadius: 2,
            border: `1px solid ${THEME.border}`,
            background: `linear-gradient(90deg, ${scoreToHeatFill(0)} 0%, ${scoreToHeatFill(0.5)} 50%, ${scoreToHeatFill(1)} 100%)`
          }} />
          <span className="mono" style={{ fontSize: 11, color: THEME.green, minWidth: 22, textAlign: "right", fontWeight: 600 }}>
            {maxScore}
          </span>
        </div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
          fontSize: 10,
          color: THEME.textDim,
          paddingLeft: 32,
          paddingRight: 32
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
            background: scoreToHeatFill(0.75),
            border: `1px solid ${scoreToHeatStroke(0.75)}`
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
          <div style={{ fontSize: 11, color: THEME.textMuted }}>BRRRR Score</div>
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

  return (
    <div>
      <Panel title="Investment Goal & Recommendations" icon={<Target size={16} />} accent style={{ marginBottom: 24 }}>
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

      <Panel title="Market Map — US Counties" icon={<MapPin size={16} />} accent style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 14 }}>
          Every tracked market, color-coded by BRRRR score on a red-yellow-green heatmap. Red indicates weaker markets, yellow is average, and green represents the strongest investment conditions. Click a county to drill in.
        </div>
        <USCountyMap
          allMarkets={allMarkets}
          selectedState={mapFocusState}
          highlightedMarket={mapHighlight}
          onCountyClick={handleMapCountyClick}
        />
      </Panel>

      <Panel title="Market Search" icon={<Search size={16} />} style={{ marginBottom: 24 }}>
        <div style={{ position: "relative", marginBottom: 16 }}>
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

        <div style={{ marginBottom: 16 }}>
          <div className="label-xs" style={{ marginBottom: 8 }}>Try searching:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["FL", "OH", "TX", "Columbus OH", "Tampa FL", "Detroit MI", "Memphis TN"].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => handleSearchChange(suggestion)}
                style={{
                  padding: "4px 10px", fontSize: 11,
                  background: THEME.bgPanel, border: `1px solid ${THEME.border}`,
                  borderRadius: 12, color: THEME.textMuted, cursor: "pointer"
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", margin: "16px 0" }}>
          <div style={{ flex: 1, height: 1, background: THEME.border }} />
          <span style={{ padding: "0 12px", fontSize: 11, color: THEME.textMuted }}>OR</span>
          <div style={{ flex: 1, height: 1, background: THEME.border }} />
        </div>

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

        {showSearchResults && searchResults.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div className="label-xs-accent" style={{ marginBottom: 12 }}>
              Search Results ({searchResults.length})
            </div>
            {searchResults.map(market => renderMarketCard(market))}
          </div>
        )}

        {showSearchResults && searchResults.length === 0 && searchQuery.trim() && (
          <div style={{ marginTop: 20, padding: 20, textAlign: "center", color: THEME.textMuted, fontSize: 13 }}>
            No markets found matching "{searchQuery}". Try a city or state name.
          </div>
        )}

        {showStateResults && stateInfo && (
          <div style={{ marginTop: 20 }}>
            <div className="label-xs-accent" style={{ marginBottom: 12 }}>
              {stateInfo.name} Markets ({stateInfo.cityCount})
            </div>
            {stateMarkets.map(market => renderMarketCard(market))}
          </div>
        )}
      </Panel>

      <Panel title="Top 5 Markets" icon={<Trophy size={16} />}>
        <div style={{ marginBottom: 16 }}>
          <div className="label-xs" style={{ marginBottom: 8 }}>Rank by:</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { key: "capRate", label: "Cap Rate" },
              { key: "rentGrowth", label: "Rent Growth" },
              { key: "score", label: "Overall Score" },
              { key: "brrrrScore", label: "BRRRR Score" }
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
          background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accentDim})`,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Building2 size={20} color="white" />
        </div>
        <div>
          <div className="serif" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
            DealTrack
          </div>
          <div style={{ fontSize: 10, color: THEME.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
            BRRRR Investment Platform
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
            <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 4 }}>MONTHLY CASH FLOW</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: metrics.monthlyCashFlow > 0 ? THEME.green : THEME.red }}>
              {fmtUSD(metrics.monthlyCashFlow)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 4 }}>CAP RATE</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: THEME.accent }}>
              {metrics.capRate.toFixed(1)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 4 }}>CASH ON CASH</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: THEME.secondary }}>
              {metrics.cashOnCash.toFixed(1)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 4 }}>TOTAL INVESTED</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              {fmtUSD(metrics.totalInvested, { short: true })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 4 }}>BRRRR SCORE</div>
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
            <StatRow label="Vacancy Loss" value={`-${fmtUSD(metrics.vacancyLoss)}`} valueColor={THEME.red} />
            <StatRow label="Management Cost" value={`-${fmtUSD(metrics.mgmtCost)}`} valueColor={THEME.red} />
            <StatRow label="Effective Income" value={fmtUSD(metrics.effectiveIncome)} bold valueColor={THEME.green} />
            <StatRow label="Operating Expenses" value={`-${fmtUSD(metrics.monthlyCosts)}`} valueColor={THEME.red} borderTop />
            <StatRow label="Net Monthly Cash Flow"
              value={fmtUSD(metrics.monthlyCashFlow)}
              bold
              valueColor={metrics.monthlyCashFlow > 0 ? THEME.green : THEME.red}
            />
            <StatRow label="1% Rule Status"
              value={metrics.onePercentRule ? "PASS" : "FAIL"}
              valueColor={metrics.onePercentRule ? THEME.green : THEME.red}
              bold
              borderTop
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

    glossary: {
      title: "Glossary",
      icon: <BookOpen size={16} />,
      topics: {
        "complete-glossary": {
          title: "Complete Real Estate Investing Glossary",
          icon: <FileText size={14} />,
          isGlossary: true,
          terms: [
            { term: "ARV", definition: "After Repair Value — the estimated market value of a property once renovations are complete." },
            { term: "As-Is", definition: "Property sold in its current condition, with the seller making no repairs or disclosures beyond legal minimums." },
            { term: "Assignment", definition: "Transferring contract rights to purchase a property to a third party, typically for a fee. The core wholesaling strategy." },
            { term: "Balloon Payment", definition: "A large lump-sum payment due at the end of a loan term, common in seller financing and commercial loans." },
            { term: "Basis Points (BPS)", definition: "1/100th of a percent. 50 bps = 0.50%. Used to quote rate changes precisely." },
            { term: "Bird Dog", definition: "A person who finds potential investment properties and refers them to investors, often for a finder's fee." },
            { term: "BRRRR", definition: "Buy, Rehab, Rent, Refinance, Repeat — a capital-recycling rental investment strategy." },
            { term: "Capital Gains", definition: "Profit from the sale of an asset. Short-term (held <1 year): taxed as ordinary income. Long-term (>1 year): taxed at preferential rates (0/15/20%)." },
            { term: "Capital Stack", definition: "The layered structure of debt and equity financing a real estate deal. Senior debt, junior debt, preferred equity, common equity in order of repayment priority." },
            { term: "Cap Rate", definition: "Capitalization Rate = NOI / Property Value. Indicator of return independent of financing." },
            { term: "Cash-on-Cash Return", definition: "Annual pre-tax cash flow / total cash invested. The return metric that accounts for leverage." },
            { term: "Closing Costs", definition: "Fees paid at closing: title insurance, origination, recording, attorney, survey, taxes. Typically 2-4% of purchase price." },
            { term: "Closing Disclosure (CD)", definition: "The federally-mandated 5-page document disclosing final loan terms and closing costs, delivered at least 3 business days before closing." },
            { term: "CMA", definition: "Comparative Market Analysis — a real estate agent's informal property valuation based on recent comparable sales." },
            { term: "Comp", definition: "Comparable sale. A recently sold property similar to the subject property, used to estimate value." },
            { term: "Conventional Loan", definition: "A mortgage conforming to Fannie Mae / Freddie Mac standards, not backed by a government agency." },
            { term: "COO (Certificate of Occupancy)", definition: "A document from local government certifying a building is habitable and code-compliant. Required after substantial rehabs in many jurisdictions." },
            { term: "Cost Segregation", definition: "An engineering-based analysis that reclassifies portions of a building into shorter depreciation categories to accelerate tax deductions." },
            { term: "DSCR", definition: "Debt Service Coverage Ratio = NOI / Annual Debt Service. Measures a property's ability to cover its mortgage payment. Key metric for non-QM rental loans." },
            { term: "Deed", definition: "The legal document transferring ownership of real property. Common types: warranty deed (strongest protection), quitclaim deed (no warranty of title)." },
            { term: "Depreciation", definition: "Tax deduction for the wear-and-tear of a rental building over its useful life (27.5 years residential, 39 years commercial)." },
            { term: "Due Diligence", definition: "The investigation period between offer acceptance and closing when a buyer inspects, reviews documents, and confirms the deal's viability." },
            { term: "Earnest Money Deposit (EMD)", definition: "Buyer's good-faith deposit made when a contract is accepted, typically 1-3% of purchase price." },
            { term: "Easement", definition: "A legal right to use someone else's property for a specific purpose (utility access, driveway, etc.)." },
            { term: "Encumbrance", definition: "Any claim, lien, or charge on a property's title that may affect its transferability." },
            { term: "Equity", definition: "Property value minus outstanding mortgage balance. Your ownership stake." },
            { term: "Escrow", definition: "A neutral third party holding funds or documents during a real estate transaction until conditions are met." },
            { term: "Fannie Mae / Freddie Mac", definition: "Government-sponsored enterprises that buy conforming mortgages from originating lenders. Set the underwriting standards for 'conventional' loans." },
            { term: "FHA Loan", definition: "Federal Housing Administration-backed mortgage allowing 3.5% down for owner-occupants. Available on 1-4 unit properties." },
            { term: "Foreclosure", definition: "Legal process by which a lender repossesses property after borrower default. Judicial (court-supervised, longer) or non-judicial (trustee sale, faster) depending on state." },
            { term: "FSBO", definition: "For Sale By Owner — a property sold without a real estate agent representing the seller." },
            { term: "GRM", definition: "Gross Rent Multiplier = property price / annual gross rent. Quick screening tool, ignores expenses." },
            { term: "Hard Money", definition: "Short-term, high-rate, asset-based financing from private lenders. Used for acquisition and rehab when conventional loans won't work." },
            { term: "HELOC", definition: "Home Equity Line of Credit — revolving credit secured by equity in primary residence. Flexible but variable rate." },
            { term: "HOA", definition: "Homeowners Association — governing body for planned communities, condos, and townhomes. Collects dues and enforces covenants." },
            { term: "HUD", definition: "Housing and Urban Development — federal agency overseeing housing policy; 'HUD home' refers to a foreclosed property previously FHA-insured." },
            { term: "Interest-Only Loan", definition: "A loan where payments cover only interest for an initial period (typically 5-10 years), then amortize over the remaining term. Common in hard money and certain commercial loans." },
            { term: "IRR", definition: "Internal Rate of Return — the annualized rate of return that accounts for the time value of money across all cash flows of an investment." },
            { term: "Lien", definition: "A legal claim against property for unpaid debt. Mortgages are voluntary liens; tax liens, mechanic's liens, and judgment liens are involuntary." },
            { term: "Lis Pendens", definition: "A public notice of pending lawsuit affecting real property. Clouds title, makes the property difficult to sell until resolved." },
            { term: "LTV", definition: "Loan-to-Value = loan amount / property value. Key underwriting metric." },
            { term: "MAO", definition: "Maximum Allowable Offer — the highest price you can pay and still hit your return targets. Formula varies by strategy." },
            { term: "MLS", definition: "Multiple Listing Service — the database of active and sold real estate listings maintained by local Realtor associations. Access typically requires a licensed agent." },
            { term: "NOI", definition: "Net Operating Income = Gross Income − Operating Expenses. Does NOT include mortgage payments. Foundation of commercial real estate valuation." },
            { term: "Non-Recourse Loan", definition: "A loan secured only by the collateral property; the lender cannot pursue the borrower's other assets if the property doesn't cover the debt. Common in large commercial loans." },
            { term: "Owner Financing", definition: "Seller carries the mortgage for the buyer. Flexible terms, no institutional underwriting. Also called 'seller financing.'" },
            { term: "PITI", definition: "Principal, Interest, Taxes, Insurance — the four components of a typical mortgage payment." },
            { term: "PMI", definition: "Private Mortgage Insurance — required on conventional loans with <20% down. Protects the lender, not the borrower. Not applicable to most investment loans." },
            { term: "Points", definition: "Prepaid interest, 1 point = 1% of loan amount. Used to buy down rates or paid as origination fees." },
            { term: "Pre-Approval", definition: "A lender's preliminary written commitment to provide a mortgage, subject to appraisal and final verification. Stronger than pre-qualification." },
            { term: "Principal", definition: "The remaining balance of a loan, separate from interest." },
            { term: "Pro Forma", definition: "A projection of a property's future income and expenses. Used in deal analysis; should be stress-tested, not taken at face value." },
            { term: "Property Class (A/B/C/D)", definition: "Informal classification of property/neighborhood quality. A = premium, B = middle-class, C = working-class, D = distressed." },
            { term: "Quiet Title Action", definition: "A lawsuit to resolve title disputes or clear clouds on title. Required after tax deed sales and certain other situations." },
            { term: "REIT", definition: "Real Estate Investment Trust — a company that owns or finances income-producing real estate. Can be traded on stock exchanges (publicly traded) or private. Allows small investors exposure to commercial real estate." },
            { term: "REO", definition: "Real Estate Owned — property repossessed by a lender after a failed foreclosure auction. REO properties are sold as-is through the lender's asset manager." },
            { term: "Refinance", definition: "Replacing an existing mortgage with a new one. Rate-and-term (lower rate/payment) or cash-out (pulling equity out)." },
            { term: "Rent Roll", definition: "A document listing all tenants, unit numbers, lease terms, rent amounts, and payment status. Standard requirement when buying existing rental property." },
            { term: "Seasoning", definition: "The time a borrower must own a property before a lender will refinance based on current value rather than purchase price. Typically 6-12 months conventional, 3-6 months DSCR." },
            { term: "Section 8", definition: "Federal Housing Choice Voucher program where HUD subsidizes rent for qualifying low-income tenants. Tenants pay 30% of income; HUD pays the rest directly to landlord." },
            { term: "Short Sale", definition: "Sale of a property for less than the mortgage balance, requiring lender approval. Longer timeline than traditional sale, often 3-12 months." },
            { term: "Sweat Equity", definition: "Value added to a property through the owner's own labor rather than cash expenditure." },
            { term: "Title Insurance", definition: "Insurance protecting against defects in property title discovered after closing. Owner's policy (one-time premium) and lender's policy. Critical — never close without it." },
            { term: "Turnkey", definition: "A fully renovated, already-tenanted rental property sold to investors. No rehab work required. Usually priced at retail or above, with little forced-appreciation upside." },
            { term: "Underwriting", definition: "The lender's process of evaluating borrower and property to approve a loan. Reviews credit, income, assets, appraisal, title." },
            { term: "Unlawful Detainer", definition: "The legal term for an eviction lawsuit in many states." },
            { term: "VA Loan", definition: "Veterans Affairs-backed mortgage for eligible veterans. 0% down, no PMI, available for owner-occupied 1-4 unit properties." },
            { term: "Wholesale", definition: "Finding a discounted property, putting it under contract, and assigning the contract to an end buyer for a fee. Requires no capital but requires strong marketing and buyer network." }
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
          Start analyzing your first BRRRR opportunity. Use the templates to jumpstart your analysis
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
                             metrics.grade.startsWith("B") ? "#FFEDD5" : THEME.redDim,
                  color: metrics.grade === "A" ? THEME.green :
                         metrics.grade.startsWith("B") ? THEME.secondary : THEME.red
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
            Research BRRRR-friendly markets across the US
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
