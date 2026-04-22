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

// Alias for semantic naming
const RepeatIcon = RotateCcw;

// Safe PDF library access (avoids crash if script not loaded)
const getJsPDF = () => (typeof window !== "undefined" && window.jspdf && window.jspdf.jsPDF)
  || (typeof window !== "undefined" && window.jsPDF)
  || null;

/* ============================================================================
   THEME + FONTS
   ============================================================================ */
const THEME = {
  bg: "#FFFFFF", bgPanel: "#F8FAFB", bgInput: "#FFFFFF", bgRaised: "#F5F7F9",
  border: "#E2E8F0", borderLight: "#F1F5F9",
  text: "#1E293B", textMuted: "#64748B", textDim: "#94A3B8",
  accent: "#0D9488", accentDim: "#14B8A6", // Teal primary
  secondary: "#EA580C", secondaryDim: "#FB923C", // Orange secondary
  green: "#16A34A", greenDim: "#BBF7D0",
  red: "#DC2626", redDim: "#FEE2E2",
  orange: "#EA580C", blue: "#2563EB", purple: "#9333EA"
};

const STYLE_TAG = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;700&display=swap');
* { box-sizing: border-box; }
body { margin: 0; background: ${THEME.bg}; }
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
  border: 1px solid ${THEME.border}; outline: none; border-radius: 2px;
}
input:focus, select:focus, textarea:focus {
  border-color: ${THEME.accent}; box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.12);
}
button {
  font-family: inherit; border: none; outline: none; cursor: pointer;
  background: transparent; color: ${THEME.textMuted}; border-radius: 2px;
  transition: all 0.15s ease;
}
.btn-primary {
  background: ${THEME.accent}; color: ${THEME.bg}; font-weight: 600;
  padding: 8px 14px; font-size: 13px; display: inline-flex;
  align-items: center; gap: 6px; transition: all 0.15s ease;
}
.btn-primary:hover { background: ${THEME.accentDim}; }
.btn-secondary {
  border: 1px solid ${THEME.accent};
  color: ${THEME.accent}; padding: 8px 14px; font-size: 13px;
  display: inline-flex; align-items: center; gap: 6px;
}
.btn-secondary:hover {
  background: linear-gradient(135deg, ${THEME.accent} 0%, #14B8A6 100%);
  color: ${THEME.bg};
}
.btn-ghost { color: ${THEME.textMuted}; }
.btn-ghost:hover { color: ${THEME.accent}; background: ${THEME.bgRaised}; }
.btn-danger { color: ${THEME.red}; }
.btn-danger:hover { color: #EA8A85; background: ${THEME.redDim}44; }
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
      color: disabled ? THEME.textMuted : "#FFFFFF"
    },
    secondary: {
      background: disabled ? THEME.bgPanel : THEME.secondary,
      color: disabled ? THEME.textMuted : "#FFFFFF"
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
                    background: item.cost > 0 ? category.color + '08' : THEME.bgPanel
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
                background: THEME.accent, color: "white",
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
                  color: selectedMetric === metric.key ? "white" : THEME.text,
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
              color: section === s.key ? "white" : THEME.text,
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
   EDUCATION CENTER
   ============================================================================ */
const EducationCenter = () => {
  const [activeTopic, setActiveTopic] = useState("brrrr-basics");

  const topics = {
    "brrrr-basics": {
      title: "BRRRR Method Basics",
      icon: <BookOpen size={16} />,
      content: [
        {
          heading: "What is BRRRR?",
          body: "BRRRR stands for Buy, Rehab, Rent, Refinance, Repeat. It's a real estate investment strategy that allows you to recycle your capital by pulling out your initial investment after renovating and stabilizing a property, then using those funds to acquire the next deal."
        },
        {
          heading: "Why BRRRR Works",
          body: "The strategy works because you force appreciation through rehab work, then leverage the new (higher) appraised value to refinance out most or all of your original cash. Done right, you end up with a cash-flowing rental and most of your capital back to deploy again."
        },
        {
          heading: "Risks to Consider",
          body: "Common risks include: underestimating rehab costs, appraisal coming in below expectations, interest rate changes during the hold period, extended vacancy after rehab, and lender seasoning requirements (typically 6-12 months before refinance)."
        }
      ]
    },
    "70-percent-rule": {
      title: "The 70% Rule",
      icon: <Percent size={16} />,
      content: [
        {
          heading: "Definition",
          body: "The 70% Rule is a guideline suggesting investors should pay no more than 70% of the After Repair Value (ARV) minus rehab costs. Formula: Max Offer = (ARV × 0.70) - Rehab Costs."
        },
        {
          heading: "Why 70%?",
          body: "The 30% buffer accounts for: closing costs (~2-3%), holding costs during rehab (~3-5%), refinance costs (~2-3%), selling costs if you exit (~6-8%), and your profit margin. Markets with lower appreciation may require 65% or even 60%."
        },
        {
          heading: "Applying the Rule",
          body: "If ARV is $300,000 and rehab is $50,000: Max Offer = ($300,000 × 0.70) - $50,000 = $160,000. Going above this erodes your margin of safety. It's a guideline, not a law — adjust based on market conditions."
        }
      ]
    },
    "1-percent-rule": {
      title: "The 1% Rule",
      icon: <DollarSign size={16} />,
      content: [
        {
          heading: "Definition",
          body: "Monthly rent should equal at least 1% of the total acquisition cost (purchase + rehab). A $150,000 all-in property should rent for at least $1,500/month to meet the rule."
        },
        {
          heading: "Market Realities",
          body: "In expensive coastal markets, the 1% rule is rarely achievable. Midwest and southern markets often hit 1-1.5%+. Don't use this as your only filter — combine with cash flow, cap rate, and cash-on-cash return analysis."
        }
      ]
    },
    "financing-strategies": {
      title: "Financing Strategies",
      icon: <PiggyBank size={16} />,
      content: [
        {
          heading: "Conventional Loans",
          body: "Fannie Mae / Freddie Mac loans with 20-25% down for investment properties. Best rates but have limits (typically 10 financed properties per borrower). 30-year fixed rates give predictable long-term payments."
        },
        {
          heading: "Hard Money",
          body: "Short-term asset-based loans (6-12 months) from private lenders. Higher rates (10-14%) and points (2-4%), but fast closing and flexibility on property condition. Good for acquisition + rehab phase before refinancing."
        },
        {
          heading: "Portfolio / DSCR Loans",
          body: "Debt-Service Coverage Ratio loans qualify based on rental income, not personal income. Great for BRRRR refinances once property is rented. Rates slightly higher than conventional but no income documentation needed."
        }
      ]
    },
    "market-analysis": {
      title: "Market Analysis",
      icon: <BarChart3 size={16} />,
      content: [
        {
          heading: "Population & Job Growth",
          body: "Look for markets with consistent population growth (1%+ annually) and diverse employment. Single-industry towns carry higher risk. Check BLS data, Census data, and major employer announcements."
        },
        {
          heading: "Rent-to-Price Ratios",
          body: "Compare median rent to median home price across markets. Higher ratios indicate better cash flow potential but often lower appreciation. Lower ratios (expensive markets) favor appreciation plays."
        },
        {
          heading: "Inventory & Days on Market",
          body: "Low inventory and short days-on-market indicate a seller's market — harder to find deals but strong appreciation. High inventory gives buyer leverage but may signal weak demand."
        }
      ]
    },
    "risk-management": {
      title: "Risk Management",
      icon: <Shield size={16} />,
      content: [
        {
          heading: "Reserve Funds",
          body: "Maintain 6 months of expenses per property in liquid reserves. Cover vacancy, major repairs, tenant turnover, and unexpected capital expenses. Under-capitalized investors often fail during downturns."
        },
        {
          heading: "Insurance & Liability",
          body: "Landlord insurance (not homeowners), umbrella policy ($1-2M minimum), and consider LLC ownership for asset protection. Budget 0.5-1% of property value annually for insurance."
        },
        {
          heading: "Exit Planning",
          body: "Have multiple exit strategies before buying: BRRRR refinance, flip to retail buyer, sell to another investor, wholesale. If one exit fails, you need backups. Don't force-fit a strategy on the wrong property."
        }
      ]
    }
  };

  const topic = topics[activeTopic];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile() ? "16px" : "24px 28px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="serif" style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
          Education Center
        </h1>
        <div style={{ fontSize: 13, color: THEME.textMuted, marginTop: 4 }}>
          Core concepts for BRRRR investors
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "240px 1fr", gap: 24 }}>
        <div>
          {Object.entries(topics).map(([key, t]) => (
            <button
              key={key}
              onClick={() => setActiveTopic(key)}
              style={{
                width: "100%", padding: "10px 12px", fontSize: 13,
                background: activeTopic === key ? THEME.bgRaised : "transparent",
                color: activeTopic === key ? THEME.accent : THEME.text,
                border: `1px solid ${activeTopic === key ? THEME.accent : "transparent"}`,
                borderRadius: 6, textAlign: "left", marginBottom: 4,
                display: "flex", alignItems: "center", gap: 8, fontWeight: 600, cursor: "pointer"
              }}
            >
              {t.icon}
              {t.title}
            </button>
          ))}
        </div>

        <Panel title={topic.title} icon={topic.icon} accent>
          {topic.content.map((section, idx) => (
            <div key={idx} style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, marginBottom: 8, color: THEME.accent }}>
                {section.heading}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: THEME.text, margin: 0 }}>
                {section.body}
              </p>
            </div>
          ))}
        </Panel>
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
                             metrics.grade.startsWith("B") ? "#FEF3C7" : THEME.redDim,
                  color: metrics.grade === "A" ? THEME.green :
                         metrics.grade.startsWith("B") ? "#B45309" : THEME.red
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


