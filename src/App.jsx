import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Building2, Calculator, TrendingUp, MapPin, Search, Plus, Trash2,
  Home, Calendar, FileText, X, ChevronRight, AlertTriangle, CheckCircle2,
  Info, Save, Sparkles, Wrench, Key, DoorOpen, Flame, Flag, BarChart3,
  Edit3, Copy, Filter, ArrowRight, Shield, Zap, ExternalLink,
  RefreshCw, Star, Target, Clock, Upload, BookOpen, GraduationCap, 
  DollarSign, TrendingDown, Percent, Download, FileDown, 
  LineChart, Activity, Briefcase, Award, Globe, Phone,
  Mail, MapPin as Location, Calendar as CalendarIcon, Eye, Settings,
  ChevronDown, ChevronUp, MoreHorizontal, Layout, Smartphone, Tablet,
  MonitorSpeaker, Wifi, WifiOff, Timer, Gauge, Layers, Hammer, 
  PiggyBank, RotateCcw as RepeatIcon, TrendingUp as TrendingUpIcon, 
  Home as HomeIcon, Tool as ToolIcon, Trophy
} from "lucide-react";

// Advanced features imports
const jsPDF = window.jsPDF || (() => ({ text: () => {}, save: () => {} }));
const html2canvas = window.html2canvas || (() => Promise.resolve({ toDataURL: () => '' }));

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
const isMobile = () => window.innerWidth <= 768;
const isTablet = () => window.innerWidth <= 1024 && window.innerWidth > 768;

const MobileOptimizedButton = ({ onClick, children, style = {}, disabled = false, variant = "primary" }) => {
  const baseStyle = {
    minHeight: 44, // Touch-friendly minimum
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
      onTouchStart={() => {}} // iOS touch optimization
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
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    
    // Header
    pdf.setFontSize(24);
    pdf.setTextColor(13, 148, 136); // Teal
    pdf.text("DealTrack Investment Report", margin, 30);
    
    pdf.setFontSize(16);
    pdf.setTextColor(51, 51, 51);
    pdf.text(`${deal.address || 'Property Address'}`, margin, 45);
    pdf.text(`${deal.city || 'City'}, ${deal.state || 'State'}`, margin, 55);
    
    // Deal Summary Box
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(margin, 70, pageWidth - 2 * margin, 40);
    
    pdf.setFontSize(12);
    pdf.setTextColor(30, 41, 59);
    pdf.text(`Purchase Price: $${(deal.purchasePrice || 0).toLocaleString()}`, margin + 5, 85);
    pdf.text(`Rehab Budget: $${(deal.rehabBudget || 0).toLocaleString()}`, margin + 5, 95);
    pdf.text(`ARV: $${(deal.arv || 0).toLocaleString()}`, pageWidth/2, 85);
    pdf.text(`Monthly Rent: $${(deal.rentEstimate || 0).toLocaleString()}`, pageWidth/2, 95);
    
    // Key Metrics
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
    
    // Save the PDF
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
   COMPREHENSIVE ACQUISITION ANALYSIS SECTION
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
        {/* Purchase Details */}
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

        {/* Financing Strategy */}
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

        {/* Due Diligence Checklist */}
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

      {/* Acquisition Summary */}
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
          value={metrics.seventyPercentRule ? "✓ PASS" : "✗ FAIL"}
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
    // Interior
    kitchen: { cost: 0, weeks: 0, priority: "high", contractor: "", notes: "" },
    bathrooms: { cost: 0, weeks: 0, priority: "high", contractor: "", notes: "" },
    flooring: { cost: 0, weeks: 0, priority: "high", contractor: "", notes: "" },
    paintInterior: { cost: 0, weeks: 0, priority: "medium", contractor: "", notes: "" },
    cabinets: { cost: 0, weeks: 0, priority: "medium", contractor: "", notes: "" },
    appliances: { cost: 0, weeks: 0, priority: "medium", contractor: "", notes: "" },
    lighting: { cost: 0, weeks: 0, priority: "low", contractor: "", notes: "" },
    
    // Systems
    electrical: { cost: 0, weeks: 0, priority: "high", contractor: "", notes: "" },
    plumbing: { cost: 0, weeks: 0, priority: "high", contractor: "", notes: "" },
    hvac: { cost: 0, weeks: 0, priority: "high", contractor: "", notes: "" },
    
    // Structural/Exterior
    roofing: { cost: 0, weeks: 0, priority: "critical", contractor: "", notes: "" },
    windows: { cost: 0, weeks: 0, priority: "medium", contractor: "", notes: "" },
    siding: { cost: 0, weeks: 0, priority: "medium", contractor: "", notes: "" },
    landscaping: { cost: 0, weeks: 0, priority: "low", contractor: "", notes: "" },
    driveway: { cost: 0, weeks: 0, priority: "low", contractor: "", notes: "" },
    
    // Permits & Other
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
    const totalWeeks = Math.max(...Object.values(updated).map(item => item.weeks || 0));
    
    onUpdate({ 
      rehabBudget: totalCost, 
      rehabDetails: updated,
      rehabMonths: Math.ceil(totalWeeks / 4.33) // Convert weeks to months
    });
  };

  const getTotalByCategory = (category) => {
    return rehabCategories[category].items.reduce((sum, item) => {
      return sum + (rehabDetails[item]?.cost || 0);
    }, 0);
  };

  const getOverallTotals = () => {
    const totalCost = Object.values(rehabDetails).reduce((sum, item) => sum + (item.cost || 0), 0);
    const totalWeeks = Math.max(...Object.values(rehabDetails).map(item => item.weeks || 0));
    const criticalItems = Object.entries(rehabDetails).filter(([_, item]) => item.priority === "critical" && item.cost > 0).length;
    return { totalCost, totalWeeks, criticalItems };
  };

  const totals = getOverallTotals();

  return (
    <div>
      <Panel title="Comprehensive Rehab Planning" icon={<Hammer size={16} />} accent style={{ marginBottom: 24 }}>
        {/* Rehab Summary Cards */}
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

        {/* Detailed Category Breakdown */}
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

        {/* Quick Budget Templates */}
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
                  const budgetByCategory = {
                    kitchen: template.factor >= 25 ? deal.sqft * 8 : 0,
                    bathrooms: template.factor >= 15 ? deal.sqft * 5 : 0,
                    flooring: template.factor >= 15 ? deal.sqft * 6 : 0,
                    paintInterior: template.factor >= 15 ? deal.sqft * 2 : 0,
                    electrical: template.factor >= 25 ? deal.sqft * 3 : 0,
                    plumbing: template.factor >= 25 ? deal.sqft * 4 : 0,
                    hvac: template.factor >= 40 ? deal.sqft * 6 : 0,
                    contingency: (deal.sqft * template.factor) * 0.1
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

      {/* Timeline & Project Management */}
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
            valueColor={((totals.totalCost / deal.purchasePrice) * 100) < 20 ? THEME.green : THEME.orange}
          />
        </div>
      </Panel>
    </div>
  );
};

/* ============================================================================
   COMPREHENSIVE REFINANCE STRATEGY SECTION
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
    origination: 0, // Will be calculated as percentage
    misc: 500
  });

  const calculateRefiScenario = (scenarioKey) => {
    const scenario = refiScenarios[scenarioKey];
    const arv = deal.arv || 0;
    const currentLoan = deal.loanAmount || ((deal.purchasePrice || 0) * (100 - (deal.downPayment || 25)) / 100);
    
    const newLoanAmount = arv * (scenario.ltv / 100);
    const originationFee = newLoanAmount * 0.01; // 1% origination
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
        {/* ARV & Market Analysis */}
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
              value={deal.conservativeARV || Math.round(deal.arv * 0.95)}
              onChange={(val) => onUpdate({ conservativeARV: val })}
              prefix="$"
              helper="5% below estimate"
            />
          </div>
        </div>

        {/* Refinance Cost Breakdown */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: 14, marginBottom: 16, color: THEME.text }}>Refinance Costs</h4>
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(5, 1fr)", gap: 12 }}>
            <NumberField
              label="Appraisal"
              value={refiCosts.appraisal}
              onChange={(val) => updateRefiCost('appraisal', val)}
              prefix="$"
            />
            <NumberField
              label="Title Insurance"
              value={refiCosts.title}
              onChange={(val) => updateRefiCost('title', val)}
              prefix="$"
            />
            <NumberField
              label="Legal/Attorney"
              value={refiCosts.legal}
              onChange={(val) => updateRefiCost('legal', val)}
              prefix="$"
            />
            <NumberField
              label="Misc Fees"
              value={refiCosts.misc}
              onChange={(val) => updateRefiCost('misc', val)}
              prefix="$"
            />
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

        {/* Refinance Scenarios */}
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

                  {/* Editable scenario parameters */}
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

        {/* Selected Scenario Details */}
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
              />
              <StatRow 
                label="Loan-to-Value Ratio" 
                value={`${scenarios[selectedScenario]?.loanToValue}%`}
              />
              <StatRow 
                label="Interest Rate" 
                value={`${scenarios[selectedScenario]?.interestRate}%`}
              />
              <StatRow 
                label="New Monthly P&I" 
                value={fmtUSD(scenarios[selectedScenario]?.newMonthlyPI)}
                valueColor={THEME.secondary}
              />
            </div>
            
            <div>
              <h5 style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 12, textTransform: "uppercase" }}>
                Cash Out Analysis
              </h5>
              <StatRow 
                label="Gross Cash Out" 
                value={fmtUSD(scenarios[selectedScenario]?.grossCashOut)}
              />
              <StatRow 
                label="Total Refi Costs" 
                value={fmtUSD(scenarios[selectedScenario]?.totalRefiCosts)}
                valueColor={THEME.red}
              />
              <StatRow 
                label="Net Cash Out" 
                value={fmtUSD(scenarios[selectedScenario]?.netCashOut)}
                valueColor={scenarios[selectedScenario]?.netCashOut > 0 ? THEME.green : THEME.red}
                bold
              />
              <StatRow 
                label="Capital Recovery %" 
                value={`${scenarios[selectedScenario]?.capitalRecovery.toFixed(1)}%`}
                valueColor={scenarios[selectedScenario]?.capitalRecovery >= 75 ? THEME.green : 
                           scenarios[selectedScenario]?.capitalRecovery >= 50 ? THEME.orange : THEME.red}
                bold
              />
            </div>
          </div>
        </div>
      </Panel>

      {/* BRRRR Strategy Assessment */}
      <Panel title="BRRRR Strategy Assessment" icon={<RepeatIcon size={16} />}>
        <div style={{ padding: 16, background: THEME.bgRaised, borderRadius: 6, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 8 }}>
            🎯 BRRRR Effectiveness
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

        <StatRow 
          label="Original Investment"
          value={fmtUSD(metrics.totalInvested)}
        />
        <StatRow 
          label="Cash Recovered via Refinance"
          value={fmtUSD(scenarios[selectedScenario]?.netCashOut)}
          valueColor={scenarios[selectedScenario]?.netCashOut > 0 ? THEME.green : THEME.red}
        />
        <StatRow 
          label="Cash Left in Deal"
          value={fmtUSD(Math.max(0, metrics.totalInvested - scenarios[selectedScenario]?.netCashOut))}
          valueColor={THEME.text}
        />
        <StatRow 
          label="Remaining Cash Flow Impact"
          value={fmtUSD((metrics.monthlyCashFlow || 0) - (scenarios[selectedScenario]?.newMonthlyPI - (metrics.monthlyPI || 0)))}
          valueColor={(metrics.monthlyCashFlow || 0) - (scenarios[selectedScenario]?.newMonthlyPI - (metrics.monthlyPI || 0)) > 0 ? THEME.green : THEME.red}
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
        netProceeds: currentARV * 0.94 - (deal.loanAmount || 0), // 6% selling costs
        timeToExit: deal.rehabMonths || 3,
        pros: ["Quick capital recovery", "No landlord responsibilities", "Immediate profit realization"],
        cons: ["No ongoing cash flow", "Loss of appreciation potential", "Capital gains tax"]
      },
      holdShort: {
        name: "Hold & Sell (2-3 years)",
        netProceeds: futureValue * Math.pow(1.04, 2.5) * 0.94 - (deal.loanAmount || 0) + totalCashFlow * (2.5 / timeHorizon),
        timeToExit: 30, // 2.5 years
        pros: ["Moderate appreciation capture", "Some rental income", "Potential tax benefits"],
        cons: ["Property management needed", "Market risk", "Selling costs still apply"]
      },
      holdLong: {
        name: "Hold Long-Term (5+ years)",
        netProceeds: futureValue * 0.94 - (deal.loanAmount || 0) + totalCashFlow,
        timeToExit: 60, // 5 years
        pros: ["Maximum appreciation potential", "Steady cash flow", "Tax depreciation benefits"],
        cons: ["Longest capital tie-up", "Market volatility risk", "Ongoing management"]
      },
      brrrr: {
        name: "BRRRR & Repeat",
        netProceeds: (currentARV * 0.75 - (deal.loanAmount || 0)) + totalCashFlow, // 75% LTV refinance
        timeToExit: 6, // 6 months to complete BRRRR
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
              ✓ {strategy.pros[0]}
            </div>
            <div style={{ fontSize: 11, color: THEME.red }}>
              × {strategy.cons[0]}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, padding: 16, background: THEME.bgRaised, borderRadius: 6 }}>
        <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 8 }}>
          💡 Recommendation
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
  const [selectedRegion, setSelectedRegion] = useState("midwest");
  const [selectedMetric, setSelectedMetric] = useState("capRate");
  const [investmentGoal, setInvestmentGoal] = useState("cashFlow");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const marketData = {
    northeast: {
      name: "Northeast",
      markets: [
        { 
          city: "Buffalo", state: "NY", medianPrice: 165000, medianRent: 1200, capRate: 9.8, rentGrowth: 10, inventory: 4.2, score: 85,
          airbnb: { nightly: 95, occupancy: 65, monthlyRevenue: 1900, competition: "Medium" }
        },
        { 
          city: "Rochester", state: "NY", medianPrice: 145000, medianRent: 1100, capRate: 10.1, rentGrowth: 11, inventory: 3.8, score: 88,
          airbnb: { nightly: 85, occupancy: 62, monthlyRevenue: 1650, competition: "Low" }
        },
        { 
          city: "Syracuse", state: "NY", medianPrice: 135000, medianRent: 1050, capRate: 10.5, rentGrowth: 12, inventory: 4.5, score: 90,
          airbnb: { nightly: 80, occupancy: 58, monthlyRevenue: 1450, competition: "Low" }
        },
        { 
          city: "Philadelphia", state: "PA", medianPrice: 195000, medianRent: 1450, capRate: 8.9, rentGrowth: 9, inventory: 3.2, score: 78,
          airbnb: { nightly: 125, occupancy: 72, monthlyRevenue: 2800, competition: "High" }
        },
        { 
          city: "Pittsburgh", state: "PA", medianPrice: 145000, medianRent: 1150, capRate: 9.7, rentGrowth: 10, inventory: 3.9, score: 82,
          airbnb: { nightly: 110, occupancy: 68, monthlyRevenue: 2350, competition: "Medium" }
        },
        { 
          city: "Newark", state: "NJ", medianPrice: 285000, medianRent: 2100, capRate: 7.2, rentGrowth: 8, inventory: 2.8, score: 75,
          airbnb: { nightly: 135, occupancy: 75, monthlyRevenue: 3200, competition: "High" }
        },
        { 
          city: "Camden", state: "NJ", medianPrice: 125000, medianRent: 1200, capRate: 11.5, rentGrowth: 11, inventory: 4.8, score: 89,
          airbnb: { nightly: 90, occupancy: 55, monthlyRevenue: 1550, competition: "Low" }
        }
      ]
    },
    southeast: {
      name: "Southeast", 
      markets: [
        { 
          city: "Orlando", state: "FL", medianPrice: 320000, medianRent: 1850, capRate: 7.2, rentGrowth: 18, inventory: 2.1, score: 85,
          airbnb: { nightly: 165, occupancy: 78, monthlyRevenue: 4050, competition: "Very High" }
        },
        { 
          city: "Tampa", state: "FL", medianPrice: 365000, medianRent: 2100, capRate: 6.8, rentGrowth: 14, inventory: 1.9, score: 82,
          airbnb: { nightly: 155, occupancy: 74, monthlyRevenue: 3600, competition: "High" }
        },
        { 
          city: "Jacksonville", state: "FL", medianPrice: 285000, medianRent: 1650, capRate: 8.1, rentGrowth: 16, inventory: 2.8, score: 88,
          airbnb: { nightly: 135, occupancy: 71, monthlyRevenue: 3000, competition: "Medium" }
        },
        { 
          city: "Miami", state: "FL", medianPrice: 485000, medianRent: 2650, capRate: 5.9, rentGrowth: 9, inventory: 1.5, score: 72,
          airbnb: { nightly: 195, occupancy: 82, monthlyRevenue: 5000, competition: "Very High" }
        },
        { 
          city: "Fort Lauderdale", state: "FL", medianPrice: 385000, medianRent: 2100, capRate: 6.5, rentGrowth: 12, inventory: 1.8, score: 78,
          airbnb: { nightly: 175, occupancy: 79, monthlyRevenue: 4350, competition: "Very High" }
        },
        { 
          city: "St. Petersburg", state: "FL", medianPrice: 295000, medianRent: 1750, capRate: 7.8, rentGrowth: 17, inventory: 2.4, score: 86,
          airbnb: { nightly: 145, occupancy: 76, monthlyRevenue: 3450, competition: "High" }
        },
        { 
          city: "Deerfield Beach", state: "FL", medianPrice: 365000, medianRent: 2200, capRate: 6.4, rentGrowth: 11, inventory: 1.7, score: 76,
          airbnb: { nightly: 170, occupancy: 77, monthlyRevenue: 4100, competition: "Very High" }
        },
        { 
          city: "Boca Raton", state: "FL", medianPrice: 425000, medianRent: 2400, capRate: 5.8, rentGrowth: 10, inventory: 1.6, score: 74,
          airbnb: { nightly: 185, occupancy: 78, monthlyRevenue: 4550, competition: "Very High" }
        },
        { 
          city: "Delray Beach", state: "FL", medianPrice: 395000, medianRent: 2250, capRate: 6.2, rentGrowth: 11, inventory: 1.7, score: 75,
          airbnb: { nightly: 175, occupancy: 76, monthlyRevenue: 4200, competition: "Very High" }
        },
        { 
          city: "Coral Springs", state: "FL", medianPrice: 345000, medianRent: 2050, capRate: 6.6, rentGrowth: 12, inventory: 1.9, score: 78,
          airbnb: { nightly: 160, occupancy: 74, monthlyRevenue: 3700, competition: "High" }
        },
        { 
          city: "Pompano Beach", state: "FL", medianPrice: 315000, medianRent: 1950, capRate: 7.0, rentGrowth: 13, inventory: 2.0, score: 80,
          airbnb: { nightly: 155, occupancy: 75, monthlyRevenue: 3650, competition: "High" }
        },
        { 
          city: "Boynton Beach", state: "FL", medianPrice: 335000, medianRent: 2000, capRate: 6.8, rentGrowth: 12, inventory: 1.8, score: 77,
          airbnb: { nightly: 165, occupancy: 76, monthlyRevenue: 3950, competition: "High" }
        },
        { 
          city: "Hollywood", state: "FL", medianPrice: 375000, medianRent: 2150, capRate: 6.3, rentGrowth: 11, inventory: 1.7, score: 76,
          airbnb: { nightly: 170, occupancy: 78, monthlyRevenue: 4200, competition: "Very High" }
        },
        { 
          city: "Pembroke Pines", state: "FL", medianPrice: 355000, medianRent: 2100, capRate: 6.5, rentGrowth: 12, inventory: 1.8, score: 77,
          airbnb: { nightly: 160, occupancy: 75, monthlyRevenue: 3800, competition: "High" }
        },
        { 
          city: "Davie", state: "FL", medianPrice: 385000, medianRent: 2200, capRate: 6.2, rentGrowth: 11, inventory: 1.8, score: 75,
          airbnb: { nightly: 165, occupancy: 76, monthlyRevenue: 3950, competition: "High" }
        },
        { 
          city: "Plantation", state: "FL", medianPrice: 395000, medianRent: 2250, capRate: 6.1, rentGrowth: 10, inventory: 1.7, score: 74,
          airbnb: { nightly: 170, occupancy: 77, monthlyRevenue: 4100, competition: "Very High" }
        },
        { 
          city: "Clearwater", state: "FL", medianPrice: 285000, medianRent: 1800, capRate: 7.5, rentGrowth: 15, inventory: 2.2, score: 83,
          airbnb: { nightly: 150, occupancy: 78, monthlyRevenue: 3650, competition: "High" }
        },
        { 
          city: "Lakeland", state: "FL", medianPrice: 235000, medianRent: 1550, capRate: 8.2, rentGrowth: 16, inventory: 2.8, score: 87,
          airbnb: { nightly: 125, occupancy: 72, monthlyRevenue: 2825, competition: "Medium" }
        },
        { 
          city: "Kissimmee", state: "FL", medianPrice: 285000, medianRent: 1750, capRate: 7.6, rentGrowth: 17, inventory: 2.3, score: 86,
          airbnb: { nightly: 145, occupancy: 80, monthlyRevenue: 3650, competition: "Very High" }
        },
        { 
          city: "Cape Coral", state: "FL", medianPrice: 325000, medianRent: 1950, capRate: 7.1, rentGrowth: 14, inventory: 2.1, score: 82,
          airbnb: { nightly: 155, occupancy: 76, monthlyRevenue: 3700, competition: "High" }
        },
        { 
          city: "Port St. Lucie", state: "FL", medianPrice: 295000, medianRent: 1850, capRate: 7.4, rentGrowth: 15, inventory: 2.3, score: 84,
          airbnb: { nightly: 140, occupancy: 74, monthlyRevenue: 3250, competition: "Medium" }
        },
        { 
          city: "Atlanta", state: "GA", medianPrice: 285000, medianRent: 1750, capRate: 7.8, rentGrowth: 13, inventory: 2.4, score: 85,
          airbnb: { nightly: 140, occupancy: 73, monthlyRevenue: 3200, competition: "High" }
        },
        { 
          city: "Savannah", state: "GA", medianPrice: 245000, medianRent: 1450, capRate: 8.5, rentGrowth: 15, inventory: 3.1, score: 87,
          airbnb: { nightly: 150, occupancy: 75, monthlyRevenue: 3500, competition: "High" }
        },
        { 
          city: "Charlotte", state: "NC", medianPrice: 265000, medianRent: 1550, capRate: 8.2, rentGrowth: 12, inventory: 2.6, score: 86,
          airbnb: { nightly: 130, occupancy: 70, monthlyRevenue: 2850, competition: "Medium" }
        },
        { 
          city: "Raleigh", state: "NC", medianPrice: 295000, medianRent: 1650, capRate: 7.9, rentGrowth: 11, inventory: 2.3, score: 83,
          airbnb: { nightly: 125, occupancy: 69, monthlyRevenue: 2700, competition: "Medium" }
        },
        { 
          city: "Charleston", state: "SC", medianPrice: 425000, medianRent: 2250, capRate: 6.8, rentGrowth: 10, inventory: 2.0, score: 79,
          airbnb: { nightly: 185, occupancy: 81, monthlyRevenue: 4700, competition: "Very High" }
        },
        { 
          city: "Columbia", state: "SC", medianPrice: 185000, medianRent: 1250, capRate: 9.1, rentGrowth: 14, inventory: 3.6, score: 88,
          airbnb: { nightly: 105, occupancy: 64, monthlyRevenue: 2100, competition: "Low" }
        },
        { 
          city: "Nashville", state: "TN", medianPrice: 385000, medianRent: 2100, capRate: 7.1, rentGrowth: 11, inventory: 2.2, score: 81,
          airbnb: { nightly: 160, occupancy: 77, monthlyRevenue: 3850, competition: "Very High" }
        },
        { 
          city: "Memphis", state: "TN", medianPrice: 145000, medianRent: 1150, capRate: 10.2, rentGrowth: 13, inventory: 4.2, score: 90,
          airbnb: { nightly: 95, occupancy: 62, monthlyRevenue: 1850, competition: "Medium" }
        }
      ]
    },
    midwest: {
      name: "Midwest",
      markets: [
        { 
          city: "Detroit", state: "MI", medianPrice: 85000, medianRent: 950, capRate: 13.1, rentGrowth: 14, inventory: 6.2, score: 95,
          airbnb: { nightly: 75, occupancy: 55, monthlyRevenue: 1300, competition: "Low" }
        },
        { 
          city: "Toledo", state: "OH", medianPrice: 95000, medianRent: 850, capRate: 11.8, rentGrowth: 13, inventory: 5.8, score: 92,
          airbnb: { nightly: 70, occupancy: 52, monthlyRevenue: 1150, competition: "Low" }
        },
        { 
          city: "Cleveland", state: "OH", medianPrice: 165000, medianRent: 1150, capRate: 10.1, rentGrowth: 12, inventory: 4.5, score: 89,
          airbnb: { nightly: 85, occupancy: 58, monthlyRevenue: 1550, competition: "Medium" }
        },
        { 
          city: "Columbus", state: "OH", medianPrice: 215000, medianRent: 1350, capRate: 9.2, rentGrowth: 11, inventory: 3.8, score: 85,
          airbnb: { nightly: 105, occupancy: 65, monthlyRevenue: 2150, competition: "Medium" }
        },
        { 
          city: "Cincinnati", state: "OH", medianPrice: 185000, medianRent: 1250, capRate: 9.5, rentGrowth: 10, inventory: 4.1, score: 84,
          airbnb: { nightly: 95, occupancy: 63, monthlyRevenue: 1900, competition: "Medium" }
        },
        { 
          city: "Indianapolis", state: "IN", medianPrice: 165000, medianRent: 1200, capRate: 9.8, rentGrowth: 12, inventory: 4.1, score: 87,
          airbnb: { nightly: 100, occupancy: 64, monthlyRevenue: 2000, competition: "Medium" }
        },
        { 
          city: "Fort Wayne", state: "IN", medianPrice: 135000, medianRent: 1050, capRate: 10.4, rentGrowth: 13, inventory: 4.8, score: 89,
          airbnb: { nightly: 80, occupancy: 56, monthlyRevenue: 1400, competition: "Low" }
        },
        { 
          city: "Grand Rapids", state: "MI", medianPrice: 195000, medianRent: 1350, capRate: 9.3, rentGrowth: 11, inventory: 3.9, score: 85,
          airbnb: { nightly: 90, occupancy: 60, monthlyRevenue: 1700, competition: "Low" }
        },
        { 
          city: "Chicago", state: "IL", medianPrice: 285000, medianRent: 1850, capRate: 7.8, rentGrowth: 7, inventory: 3.2, score: 76,
          airbnb: { nightly: 145, occupancy: 74, monthlyRevenue: 3350, competition: "Very High" }
        },
        { 
          city: "Rockford", state: "IL", medianPrice: 125000, medianRent: 950, capRate: 10.7, rentGrowth: 12, inventory: 5.2, score: 88,
          airbnb: { nightly: 75, occupancy: 54, monthlyRevenue: 1275, competition: "Low" }
        }
      ]
    },
    west: {
      name: "West",
      markets: [
        { 
          city: "Houston", state: "TX", medianPrice: 245000, medianRent: 1650, capRate: 8.1, rentGrowth: 10, inventory: 3.5, score: 82,
          airbnb: { nightly: 120, occupancy: 68, monthlyRevenue: 2550, competition: "Medium" }
        },
        { 
          city: "Dallas", state: "TX", medianPrice: 285000, medianRent: 1850, capRate: 7.6, rentGrowth: 9, inventory: 3.1, score: 79,
          airbnb: { nightly: 135, occupancy: 71, monthlyRevenue: 3000, competition: "High" }
        },
        { 
          city: "San Antonio", state: "TX", medianPrice: 195000, medianRent: 1450, capRate: 8.9, rentGrowth: 11, inventory: 3.8, score: 85,
          airbnb: { nightly: 110, occupancy: 66, monthlyRevenue: 2275, competition: "Medium" }
        },
        { 
          city: "Austin", state: "TX", medianPrice: 465000, medianRent: 2350, capRate: 6.2, rentGrowth: 8, inventory: 2.1, score: 73,
          airbnb: { nightly: 175, occupancy: 79, monthlyRevenue: 4350, competition: "Very High" }
        },
        { 
          city: "Fort Worth", state: "TX", medianPrice: 225000, medianRent: 1550, capRate: 8.4, rentGrowth: 10, inventory: 3.4, score: 83,
          airbnb: { nightly: 125, occupancy: 69, monthlyRevenue: 2700, competition: "Medium" }
        },
        { 
          city: "Phoenix", state: "AZ", medianPrice: 385000, medianRent: 2100, capRate: 6.9, rentGrowth: 11, inventory: 2.2, score: 78,
          airbnb: { nightly: 150, occupancy: 73, monthlyRevenue: 3450, competition: "High" }
        },
        { 
          city: "Tucson", state: "AZ", medianPrice: 285000, medianRent: 1550, capRate: 7.8, rentGrowth: 12, inventory: 3.1, score: 82,
          airbnb: { nightly: 125, occupancy: 70, monthlyRevenue: 2750, competition: "Medium" }
        },
        { 
          city: "Denver", state: "CO", medianPrice: 485000, medianRent: 2450, capRate: 6.1, rentGrowth: 9, inventory: 1.9, score: 75,
          airbnb: { nightly: 165, occupancy: 76, monthlyRevenue: 3950, competition: "Very High" }
        },
        { 
          city: "Colorado Springs", state: "CO", medianPrice: 385000, medianRent: 1950, capRate: 6.8, rentGrowth: 10, inventory: 2.5, score: 76,
          airbnb: { nightly: 140, occupancy: 72, monthlyRevenue: 3150, competition: "High" }
        }
      ]
    }
  };

  // Get all markets for search
  const allMarkets = useMemo(() => {
    return Object.values(marketData).flatMap(region => region.markets);
  }, []);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase().trim();
    return allMarkets.filter(market => {
      const cityMatch = market.city.toLowerCase().includes(query);
      const stateMatch = market.state.toLowerCase().includes(query);
      const fullMatch = `${market.city.toLowerCase()}, ${market.state.toLowerCase()}`.includes(query);
      const reverseMatch = `${market.state.toLowerCase()} ${market.city.toLowerCase()}`.includes(query);
      
      return cityMatch || stateMatch || fullMatch || reverseMatch;
    }).slice(0, 8); // Limit to 8 results
  }, [searchQuery, allMarkets]);

  const getDisplayMarkets = () => {
    if (showSearchResults && searchQuery.trim()) {
      return searchResults;
    }
    return Object.values(marketData[selectedRegion].markets || []);
  };

  const getTopMarkets = (metric, count = 5) => {
    return allMarkets.sort((a, b) => b[metric] - a[metric]).slice(0, count);
  };

  const getRecommendedMarkets = (goal) => {
    switch (goal) {
      case "cashFlow":
        return allMarkets.filter(m => m.capRate >= 9.0).sort((a, b) => b.capRate - a.capRate).slice(0, 6);
      case "appreciation":
        return allMarkets.filter(m => m.rentGrowth >= 12).sort((a, b) => b.rentGrowth - a.rentGrowth).slice(0, 6);
      case "balanced":
        return allMarkets.filter(m => m.score >= 85).sort((a, b) => b.score - a.score).slice(0, 6);
      default:
        return allMarkets.slice(0, 6);
    }
  };

  const displayMarkets = getDisplayMarkets();
  const topMarkets = getTopMarkets(selectedMetric);
  const recommendedMarkets = getRecommendedMarkets(investmentGoal);

  const clearSearch = () => {
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setShowSearchResults(value.trim().length > 0);
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 32px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Real Estate Market Intelligence</h1>
      <p style={{ color: THEME.textMuted, marginBottom: 32, fontSize: 16 }}>
        Complete market analysis for both long-term and short-term rental investments across all US markets
      </p>

      {/* Market Search */}
      <div style={{ marginBottom: 32 }}>
        <Panel title="Market Search" icon={<Search size={16} />}>
          <div style={{ position: "relative" }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center",
              position: "relative"
            }}>
              <Search 
                size={18} 
                style={{ 
                  position: "absolute", 
                  left: 12, 
                  color: THEME.textMuted,
                  zIndex: 1
                }} 
              />
              <input
                type="text"
                placeholder="Search for any city... (e.g. 'Columbus OH', 'Tampa', 'Detroit MI')"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 45px",
                  fontSize: 16,
                  border: `2px solid ${searchQuery.trim() ? THEME.accent : THEME.border}`,
                  borderRadius: 8,
                  background: THEME.bgInput,
                  transition: "all 0.2s ease"
                }}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  style={{
                    position: "absolute",
                    right: 12,
                    background: "none",
                    border: "none",
                    color: THEME.textMuted,
                    cursor: "pointer",
                    padding: 4,
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
            {/* Search Results Preview */}
            {showSearchResults && searchResults.length > 0 && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: THEME.bg,
                border: `1px solid ${THEME.border}`,
                borderRadius: 6,
                marginTop: 4,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                zIndex: 10,
                maxHeight: 200,
                overflowY: "auto"
              }}>
                {searchResults.map((market, index) => (
                  <div 
                    key={`${market.city}-${market.state}`}
                    style={{
                      padding: "8px 12px",
                      borderBottom: index < searchResults.length - 1 ? `1px solid ${THEME.borderLight}` : "none",
                      fontSize: 14,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>{market.city}, {market.state}</span>
                      <div style={{ color: THEME.textMuted, fontSize: 12, marginTop: 2 }}>
                        LTR: {market.capRate}% cap • {fmtUSD(market.medianPrice)} | 
                        STR: ${market.airbnb.nightly}/night • {market.airbnb.occupancy}% occ
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: THEME.accent, textAlign: "right" }}>
                      <div>Score: {market.score}/100</div>
                      <div style={{ color: THEME.secondary, fontSize: 11 }}>
                        {fmtUSD(market.airbnb.monthlyRevenue, { short: true })}/mo STR
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {showSearchResults && searchQuery && searchResults.length === 0 && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: THEME.bg,
                border: `1px solid ${THEME.border}`,
                borderRadius: 6,
                marginTop: 4,
                padding: 16,
                textAlign: "center",
                color: THEME.textMuted,
                fontSize: 14
              }}>
                No markets found for "{searchQuery}". Try searching for cities like "Columbus", "Tampa", or "Detroit".
              </div>
            )}
          </div>
          
          {/* Quick Search Suggestions */}
          <div style={{ marginTop: 16 }}>
            <div className="label-xs" style={{ marginBottom: 8 }}>POPULAR SEARCHES</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Columbus OH", "Tampa FL", "Detroit MI", "Memphis TN", "Toledo OH", "Buffalo NY"].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => handleSearchChange(suggestion)}
                  style={{
                    padding: "4px 12px",
                    fontSize: 12,
                    background: THEME.bgRaised,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 16,
                    color: THEME.textMuted,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = THEME.accent;
                    e.target.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = THEME.bgRaised;
                    e.target.style.color = THEME.textMuted;
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Investment Goal Selection */}
      <div style={{ marginBottom: 32 }}>
        <Panel title="Investment Strategy" icon={<Target size={16} />}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
            {[
              { id: "cashFlow", name: "Cash Flow Focus", desc: "High cap rates, immediate income" },
              { id: "appreciation", name: "Growth Markets", desc: "Strong rent growth, appreciation" },
              { id: "balanced", name: "Balanced Approach", desc: "Combination of cash flow and growth" }
            ].map(goal => (
              <button
                key={goal.id}
                onClick={() => setInvestmentGoal(goal.id)}
                style={{
                  padding: 16,
                  border: `2px solid ${investmentGoal === goal.id ? THEME.accent : THEME.border}`,
                  borderRadius: 8,
                  background: investmentGoal === goal.id ? THEME.bgRaised : THEME.bgPanel,
                  textAlign: "left",
                  cursor: "pointer"
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{goal.name}</div>
                <div style={{ fontSize: 12, color: THEME.textMuted }}>{goal.desc}</div>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      {/* Market Recommendations */}
      <div style={{ marginBottom: 32 }}>
        <Panel title={`Recommended Markets - ${investmentGoal === 'cashFlow' ? 'Cash Flow Focus' : investmentGoal === 'appreciation' ? 'Growth Focus' : 'Balanced Strategy'}`} icon={<Star size={16} />} accent>
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
            {recommendedMarkets.map(market => (
              <div key={`${market.city}-${market.state}`} style={{
                padding: 16,
                border: `1px solid ${THEME.border}`,
                borderRadius: 8,
                background: THEME.bg
              }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                  {market.city}, {market.state}
                </div>
                <StatRow label="Median Price" value={fmtUSD(market.medianPrice)} />
                <StatRow label="Cap Rate" value={`${market.capRate}%`} valueColor={market.capRate >= 9 ? THEME.green : THEME.text} />
                <StatRow label="Rent Growth" value={`+${market.rentGrowth}%`} valueColor={market.rentGrowth >= 12 ? THEME.green : THEME.text} />
                <StatRow label="DealTrack Score" value={`${market.score}/100`} valueColor={THEME.accent} bold />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Regional Breakdown / Search Results */}
      {!showSearchResults && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
            <div>
              <div className="label-xs" style={{ marginBottom: 6 }}>REGION</div>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 4,
                  background: THEME.bgInput,
                  fontSize: 14,
                  minWidth: 150
                }}
              >
                {Object.entries(marketData).map(([key, region]) => (
                  <option key={key} value={key}>{region.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="label-xs" style={{ marginBottom: 6 }}>SORT BY</div>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 4,
                  background: THEME.bgInput,
                  fontSize: 14,
                  minWidth: 150
                }}
              >
                <option value="capRate">Cap Rate</option>
                <option value="rentGrowth">Rent Growth</option>
                <option value="score">DealTrack Score</option>
                <option value="medianPrice">Median Price</option>
              </select>
            </div>
          </div>

          <Panel title={`${marketData[selectedRegion].name} Markets`} icon={<MapPin size={16} />}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              {marketData[selectedRegion].markets.map(market => (
                <div key={`${market.city}-${market.state}`} style={{
                  padding: 16,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 8,
                  background: THEME.bgPanel
                }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                    {market.city}, {market.state}
                  </h3>
                  
                  {/* Long-Term Rental Stats */}
                  <div style={{ marginBottom: 12 }}>
                    <div className="label-xs" style={{ marginBottom: 8, color: THEME.blue }}>LONG-TERM RENTAL</div>
                    <StatRow label="Median Price" value={fmtUSD(market.medianPrice)} />
                    <StatRow label="Median Rent" value={fmtUSD(market.medianRent)} />
                    <StatRow label="Cap Rate" value={`${market.capRate}%`} valueColor={market.capRate >= 9 ? THEME.green : THEME.text} />
                    <StatRow label="Rent Growth" value={`+${market.rentGrowth}%`} valueColor={market.rentGrowth >= 12 ? THEME.green : THEME.text} />
                  </div>

                  {/* Short-Term Rental Stats */}
                  <div style={{ marginBottom: 12, paddingTop: 12, borderTop: `1px solid ${THEME.borderLight}` }}>
                    <div className="label-xs" style={{ marginBottom: 8, color: THEME.secondary }}>SHORT-TERM RENTAL (AIRBNB)</div>
                    <StatRow label="Avg Nightly Rate" value={`$${market.airbnb.nightly}`} valueColor={THEME.secondary} />
                    <StatRow label="Occupancy Rate" value={`${market.airbnb.occupancy}%`} valueColor={market.airbnb.occupancy >= 70 ? THEME.green : THEME.text} />
                    <StatRow label="Monthly Revenue" value={fmtUSD(market.airbnb.monthlyRevenue)} valueColor={THEME.secondary} bold />
                    <StatRow 
                      label="Competition Level" 
                      value={market.airbnb.competition} 
                      valueColor={
                        market.airbnb.competition === "Low" ? THEME.green :
                        market.airbnb.competition === "Medium" ? THEME.orange :
                        market.airbnb.competition === "High" ? THEME.red :
                        THEME.purple
                      }
                    />
                  </div>

                  {/* Comparison & Score */}
                  <div style={{ paddingTop: 12, borderTop: `1px solid ${THEME.borderLight}` }}>
                    <StatRow 
                      label="STR vs LTR Revenue" 
                      value={`${((market.airbnb.monthlyRevenue / market.medianRent) * 100).toFixed(0)}%`}
                      valueColor={market.airbnb.monthlyRevenue > market.medianRent * 1.5 ? THEME.green : 
                                 market.airbnb.monthlyRevenue > market.medianRent ? THEME.orange : THEME.red}
                      bold
                    />
                    <StatRow label="Inventory (Months)" value={market.inventory} />
                    <StatRow label="DealTrack Score" value={`${market.score}/100`} valueColor={THEME.accent} bold />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* Search Results Section */}
      {showSearchResults && searchQuery && (
        <div style={{ marginBottom: 32 }}>
          <Panel 
            title={`Search Results for "${searchQuery}" (${searchResults.length} markets found)`} 
            icon={<Search size={16} />}
            accent
          >
            {searchResults.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
                {searchResults.map(market => (
                  <div key={`${market.city}-${market.state}`} style={{
                    padding: 16,
                    border: `2px solid ${THEME.accent}40`,
                    borderRadius: 8,
                    background: THEME.bgRaised
                  }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: THEME.accent }}>
                      {market.city}, {market.state}
                    </h3>
                    
                    {/* Long-Term Rental Stats */}
                    <div style={{ marginBottom: 12 }}>
                      <div className="label-xs" style={{ marginBottom: 8, color: THEME.blue }}>LONG-TERM RENTAL</div>
                      <StatRow label="Median Price" value={fmtUSD(market.medianPrice)} />
                      <StatRow label="Median Rent" value={fmtUSD(market.medianRent)} />
                      <StatRow label="Cap Rate" value={`${market.capRate}%`} valueColor={market.capRate >= 9 ? THEME.green : THEME.text} bold />
                      <StatRow label="Rent Growth" value={`+${market.rentGrowth}%`} valueColor={market.rentGrowth >= 12 ? THEME.green : THEME.text} bold />
                    </div>

                    {/* Short-Term Rental Stats */}
                    <div style={{ marginBottom: 12, paddingTop: 12, borderTop: `1px solid ${THEME.borderLight}` }}>
                      <div className="label-xs" style={{ marginBottom: 8, color: THEME.secondary }}>SHORT-TERM RENTAL (AIRBNB)</div>
                      <StatRow label="Avg Nightly Rate" value={`$${market.airbnb.nightly}`} valueColor={THEME.secondary} bold />
                      <StatRow label="Occupancy Rate" value={`${market.airbnb.occupancy}%`} valueColor={market.airbnb.occupancy >= 70 ? THEME.green : THEME.text} bold />
                      <StatRow label="Monthly Revenue" value={fmtUSD(market.airbnb.monthlyRevenue)} valueColor={THEME.secondary} bold />
                      <StatRow 
                        label="Competition Level" 
                        value={market.airbnb.competition} 
                        valueColor={
                          market.airbnb.competition === "Low" ? THEME.green :
                          market.airbnb.competition === "Medium" ? THEME.orange :
                          market.airbnb.competition === "High" ? THEME.red :
                          THEME.purple
                        }
                      />
                    </div>

                    {/* Comparison & Score */}
                    <div style={{ paddingTop: 12, borderTop: `1px solid ${THEME.borderLight}` }}>
                      <StatRow 
                        label="STR vs LTR Revenue" 
                        value={`${((market.airbnb.monthlyRevenue / market.medianRent) * 100).toFixed(0)}%`}
                        valueColor={market.airbnb.monthlyRevenue > market.medianRent * 1.5 ? THEME.green : 
                                   market.airbnb.monthlyRevenue > market.medianRent ? THEME.orange : THEME.red}
                        bold
                      />
                      <StatRow label="Inventory (Months)" value={market.inventory} />
                      <StatRow label="DealTrack Score" value={`${market.score}/100`} valueColor={THEME.accent} bold />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 40 }}>
                <Search size={48} style={{ color: THEME.textMuted, marginBottom: 16 }} />
                <h3 style={{ fontSize: 18, marginBottom: 8, color: THEME.textMuted }}>
                  No markets found for "{searchQuery}"
                </h3>
                <p style={{ color: THEME.textDim, marginBottom: 20 }}>
                  Try searching for cities like "Columbus", "Tampa", "Detroit", or "Memphis"
                </p>
                <button
                  onClick={clearSearch}
                  className="btn-primary"
                  style={{ background: THEME.accent, color: "white" }}
                >
                  Clear Search
                </button>
              </div>
            )}
          </Panel>
        </div>
      )}

      {/* Top Markets Summary */}
      <Panel title={`Top 5 Markets by ${selectedMetric === 'capRate' ? 'Cap Rate' : selectedMetric === 'rentGrowth' ? 'Rent Growth' : selectedMetric === 'score' ? 'DealTrack Score' : 'Median Price'}`} icon={<Trophy size={16} />}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(5, 1fr)", gap: 16 }}>
          {topMarkets.map((market, index) => (
            <div key={`${market.city}-${market.state}`} style={{
              textAlign: "center",
              padding: 16,
              background: index === 0 ? THEME.bgRaised : THEME.bgPanel,
              border: `1px solid ${index === 0 ? THEME.accent : THEME.border}`,
              borderRadius: 8
            }}>
              <div style={{ fontSize: 20, color: index === 0 ? THEME.accent : THEME.text }}>
                {index === 0 ? "🏆" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                {market.city}, {market.state}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: THEME.accent }}>
                {selectedMetric === 'medianPrice' ? fmtUSD(market[selectedMetric]) : 
                 selectedMetric === 'capRate' || selectedMetric === 'rentGrowth' ? `${market[selectedMetric]}%` :
                 `${market[selectedMetric]}/100`}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
};

/* ============================================================================
   ENHANCED HEADER
   ============================================================================ */
const Header = ({ view, setView, dealCount }) => {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={14} /> },
    { id: "analyzer", label: "Deal Analyzer", icon: <Calculator size={14} /> },
    { id: "market", label: "Market Intel", icon: <TrendingUp size={14} /> },
    { id: "education", label: "Education", icon: <BookOpen size={14} /> }
  ];
  
  return (
    <header style={{
      borderBottom: `1px solid ${THEME.border}`,
      background: THEME.bg,
      position: "sticky", top: 0, zIndex: 10
    }}>
      <div style={{
        maxWidth: 1400, margin: "0 auto",
        padding: "18px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 24
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <div className="serif" style={{
            fontSize: 26, fontWeight: 500, letterSpacing: "-0.035em",
            color: THEME.text, lineHeight: 1
          }}>
            DealTrack
          </div>
          <div style={{
            width: 1, height: 16, background: THEME.border
          }} />
          <div className="label-xs" style={{ color: THEME.accent }}>
            BRRRR // NATIONWIDE
          </div>
        </div>
        <nav style={{ 
          display: "flex", 
          gap: isMobile() ? 2 : 4,
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none"
        }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              style={{
                padding: isMobile() ? "8px 10px" : "8px 14px",
                fontSize: isMobile() ? 12 : 13,
                color: view === t.id ? THEME.accent : THEME.textMuted,
                borderBottom: `2px solid ${view === t.id ? THEME.accent : "transparent"}`,
                marginBottom: -1, borderRadius: 0,
                display: "flex", alignItems: "center", gap: isMobile() ? 4 : 7,
                fontWeight: view === t.id ? 600 : 400,
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                minHeight: 44 // Touch-friendly
              }}
            >
              {t.icon} 
              {!isMobile() && t.label}
              {t.id === "dashboard" && dealCount > 0 && (
                <span className="mono" style={{
                  fontSize: 10, padding: "1px 6px",
                  background: view === t.id ? THEME.accent : THEME.border,
                  color: view === t.id ? THEME.bg : THEME.textMuted,
                  borderRadius: 2, fontWeight: 700
                }}>{dealCount}</span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

/* ============================================================================
   ENHANCED ANALYZER WITH BRRRR WORKFLOW
   ============================================================================ */
const Analyzer = ({ deal, onUpdate, onSave, onBack, onDelete, isDirty }) => {
  const [activeSection, setActiveSection] = useState("acquisition");
  const metrics = useMemo(() => calcMetrics(deal), [deal]);

  const sections = [
    { id: "acquisition", label: "Acquisition", icon: <Search size={16} /> },
    { id: "rehab", label: "Rehab", icon: <Hammer size={16} /> },
    { id: "rent", label: "Rent", icon: <Home size={16} /> },
    { id: "refinance", label: "Refinance", icon: <PiggyBank size={16} /> },
    { id: "exit", label: "Exit Strategy", icon: <Target size={16} /> }
  ];

  const handleExportPDF = async () => {
    const result = await generatePDFReport(deal, metrics, 'investor');
    
    if (result.success) {
      alert(`PDF report generated: ${result.filename}`);
    } else {
      alert(`Error generating PDF: ${result.error}`);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 32px" }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 32,
        flexWrap: "wrap",
        gap: 16
      }}>
        <button onClick={onBack} className="btn-ghost">
          <ArrowRight size={16} style={{ transform: "rotate(180deg)" }} /> Back to Dashboard
        </button>
        
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <MobileOptimizedButton onClick={handleExportPDF} variant="secondary">
            <FileDown size={16} /> Export PDF
          </MobileOptimizedButton>
          <MobileOptimizedButton onClick={onDelete} variant="outline" style={{ color: THEME.red, borderColor: THEME.red }}>
            <Trash2 size={16} /> Delete
          </MobileOptimizedButton>
          <MobileOptimizedButton onClick={onSave} variant="primary" disabled={!isDirty}>
            <Save size={16} /> {isDirty ? "Save Changes" : "Saved"}
          </MobileOptimizedButton>
        </div>
      </div>

      {/* BRRRR Section Navigation */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto" }}>
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={{
                padding: "12px 16px",
                border: `2px solid ${activeSection === section.id ? THEME.accent : THEME.border}`,
                borderRadius: 8,
                background: activeSection === section.id ? THEME.bgRaised : THEME.bgPanel,
                color: activeSection === section.id ? THEME.accent : THEME.textMuted,
                fontSize: 14,
                fontWeight: activeSection === section.id ? 600 : 400,
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap"
              }}
            >
              {section.icon} {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Section Content */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "2fr 1fr", gap: 32 }}>
        <div>
          {/* Basic Property Info (always shown) */}
          <Panel title="Property Details" icon={<Home size={16} />} style={{ marginBottom: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "2fr 1fr", gap: 12, marginBottom: 14 }}>
              <TextField
                label="Property Address"
                value={deal.address}
                onChange={(val) => onUpdate({address: val})}
                placeholder="123 Main St"
              />
              <SelectField
                label="Property Type"
                value={deal.propertyType}
                onChange={(val) => onUpdate({propertyType: val})}
                options={["Single Family", "Duplex", "Triplex", "Fourplex", "Condo", "Townhouse", "Commercial"]}
              />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 14 }}>
              <TextField
                label="City"
                value={deal.city}
                onChange={(val) => onUpdate({city: val})}
                placeholder="Columbus"
              />
              <SelectField
                label="State"
                value={deal.state || "OH"}
                onChange={(val) => onUpdate({state: val})}
                options={["AL", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"]}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <NumberField
                label="Bedrooms"
                value={deal.bedrooms}
                onChange={(val) => onUpdate({bedrooms: val})}
              />
              <NumberField
                label="Bathrooms"
                value={deal.bathrooms}
                onChange={(val) => onUpdate({bathrooms: val})}
              />
              <NumberField
                label="Square Feet"
                value={deal.sqft}
                onChange={(val) => onUpdate({sqft: val})}
              />
            </div>
          </Panel>

          {/* Section-Specific Content */}
          {activeSection === "acquisition" && (
            <AcquisitionSection deal={deal} onUpdate={onUpdate} metrics={metrics} />
          )}
          
          {activeSection === "rehab" && (
            <RehabSection deal={deal} onUpdate={onUpdate} />
          )}
          
          {activeSection === "rent" && (
            <Panel title="Rental Analysis" icon={<Home size={16} />} accent>
              <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "1fr 1fr", gap: 16 }}>
                <NumberField
                  label="Monthly Rent Estimate"
                  value={deal.rentEstimate}
                  onChange={(val) => onUpdate({rentEstimate: val})}
                  prefix="$"
                  helper="Market rent for similar properties"
                />
                <NumberField
                  label="Security Deposit"
                  value={deal.securityDeposit || deal.rentEstimate || 0}
                  onChange={(val) => onUpdate({securityDeposit: val})}
                  prefix="$"
                  helper="Typically 1 month rent"
                />
                <NumberField
                  label="Vacancy Rate %"
                  value={deal.vacancy}
                  onChange={(val) => onUpdate({vacancy: val})}
                  prefix="%"
                  helper="Expected vacancy percentage"
                />
                <NumberField
                  label="Management Fee %"
                  value={deal.mgmtFee}
                  onChange={(val) => onUpdate({mgmtFee: val})}
                  prefix="%"
                  helper="Property management cost"
                />
                <NumberField
                  label="Annual Property Tax"
                  value={deal.propertyTax}
                  onChange={(val) => onUpdate({propertyTax: val})}
                  prefix="$"
                />
                <NumberField
                  label="Annual Insurance"
                  value={deal.insurance}
                  onChange={(val) => onUpdate({insurance: val})}
                  prefix="$"
                />
              </div>

              <div style={{ marginTop: 20 }}>
                <StatRow label="Effective Monthly Income" value={fmtUSD(metrics.effectiveIncome)} valueColor={THEME.accent} bold />
                <StatRow label="Monthly Expenses" value={fmtUSD(metrics.monthlyCosts)} />
                <StatRow 
                  label="Net Cash Flow" 
                  value={fmtUSD(metrics.monthlyCashFlow)} 
                  valueColor={metrics.monthlyCashFlow > 0 ? THEME.green : THEME.red} 
                  bold 
                />
              </div>
            </Panel>
          )}
          
          {activeSection === "refinance" && (
            <RefinanceSection deal={deal} onUpdate={onUpdate} metrics={metrics} />
          )}
          
          {activeSection === "exit" && (
            <ExitStrategyComparisons deal={deal} metrics={metrics} />
          )}
        </div>

        {/* Right Side - Analysis Summary */}
        <div>
          <Panel title="Investment Summary" icon={<Calculator size={16} />} accent>
            <div style={{ 
              textAlign: "center",
              padding: 20,
              background: THEME.bgRaised,
              borderRadius: 8,
              marginBottom: 20
            }}>
              <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 4 }}>
                BRRRR SCORE
              </div>
              <div style={{ 
                fontSize: 48, 
                fontWeight: 700, 
                color: metrics.score >= 70 ? THEME.green : metrics.score >= 50 ? THEME.orange : THEME.red,
                lineHeight: 1
              }}>
                {metrics.score}
              </div>
              <div style={{ fontSize: 16, color: THEME.textMuted, fontWeight: 600 }}>
                Grade: {metrics.grade}
              </div>
            </div>

            <StatRow 
              label="Total Investment" 
              value={fmtUSD(metrics.totalInvested)} 
              bold 
            />
            <StatRow 
              label="Monthly Cash Flow" 
              value={fmtUSD(metrics.monthlyCashFlow)}
              valueColor={metrics.monthlyCashFlow > 0 ? THEME.green : THEME.red}
              bold
            />
            <StatRow 
              label="Cash on Cash ROI" 
              value={`${metrics.cashOnCash.toFixed(1)}%`}
              valueColor={metrics.cashOnCash > 8 ? THEME.green : THEME.textMuted}
            />
            <StatRow 
              label="Cap Rate" 
              value={`${metrics.capRate.toFixed(1)}%`}
              valueColor={metrics.capRate > 6 ? THEME.green : THEME.textMuted}
            />
            <StatRow 
              label="Total ROI Potential" 
              value={`${metrics.totalROI.toFixed(1)}%`}
              valueColor={THEME.secondary}
            />

            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {metrics.seventyPercentRule ? 
                  <CheckCircle2 size={16} color={THEME.green} /> : 
                  <X size={16} color={THEME.red} />
                }
                <span style={{ fontSize: 13 }}>70% Rule</span>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {metrics.onePercentRule ? 
                  <CheckCircle2 size={16} color={THEME.green} /> : 
                  <X size={16} color={THEME.red} />
                }
                <span style={{ fontSize: 13 }}>1% Rule</span>
              </div>
            </div>
          </Panel>

          {/* Quick Actions */}
          <Panel title="Quick Actions" icon={<Zap size={16} />} style={{ marginTop: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <MobileOptimizedButton onClick={handleExportPDF} variant="outline">
                <FileDown size={16} /> Export PDF Report
              </MobileOptimizedButton>
              <MobileOptimizedButton onClick={() => navigator.clipboard?.writeText(window.location.href)} variant="outline">
                <Copy size={16} /> Copy Deal Link
              </MobileOptimizedButton>
              <MobileOptimizedButton onClick={() => setActiveSection("exit")} variant="outline">
                <Target size={16} /> View Exit Strategies
              </MobileOptimizedButton>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   COMPREHENSIVE EDUCATION CENTER
   ============================================================================ */
const EducationCenter = () => {
  const [selectedTopic, setSelectedTopic] = useState("brrrr-basics");

  const educationContent = {
    "brrrr-basics": {
      title: "BRRRR Strategy Fundamentals",
      icon: <BookOpen size={20} />,
      sections: [
        {
          title: "What is BRRRR?",
          content: "BRRRR stands for Buy, Rehab, Rent, Refinance, Repeat. It's a real estate investment strategy that allows investors to recycle their capital and rapidly scale their portfolio while building long-term wealth through cash flow and appreciation."
        },
        {
          title: "The 5 Steps Explained",
          content: "**Buy** distressed properties below market value. **Rehab** to increase value and rent potential. **Rent** to generate monthly cash flow. **Refinance** to pull out invested capital. **Repeat** the process to scale your portfolio."
        },
        {
          title: "Key Benefits",
          content: "Capital recycling allows unlimited scaling. Forced appreciation through rehab. Monthly cash flow from rentals. Long-term appreciation. Tax advantages through depreciation."
        }
      ]
    },
    "70-percent-rule": {
      title: "The 70% Rule",
      icon: <Calculator size={20} />,
      sections: [
        {
          title: "Formula & Application",
          content: "Purchase Price + Rehab Budget ≤ 70% × After Repair Value (ARV). This ensures you have enough equity after renovation to refinance and recover most of your invested capital."
        },
        {
          title: "Why 70%?",
          content: "The 70% threshold accounts for: Refinance LTV limits (75-80%), closing costs, holding costs, market fluctuations, and profit margin. It's a conservative approach that protects your investment."
        },
        {
          title: "Example Calculation",
          content: "ARV: $200,000 → Maximum All-in Cost: $140,000. If Purchase = $110,000 and Rehab = $25,000, Total = $135,000. Since $135,000 < $140,000, this passes the 70% rule."
        }
      ]
    },
    "1-percent-rule": {
      title: "The 1% Rule",
      icon: <Percent size={20} />,
      sections: [
        {
          title: "Quick Cash Flow Screen",
          content: "Monthly rent should equal at least 1% of purchase price. A $150,000 property should rent for $1,500/month. This is a quick screening tool for positive cash flow potential."
        },
        {
          title: "Market Variations",
          content: "The 1% rule is harder to achieve in expensive markets but common in affordable areas. In high-appreciation markets, investors may accept 0.7-0.8% for appreciation potential."
        },
        {
          title: "Beyond the 1% Rule",
          content: "Use the 1% rule as an initial filter, then analyze actual expenses: taxes, insurance, vacancy, management, maintenance, and capital expenditures for accurate cash flow projections."
        }
      ]
    },
    "financing-strategies": {
      title: "Financing Strategies",
      icon: <PiggyBank size={20} />,
      sections: [
        {
          title: "Hard Money Loans",
          content: "Short-term (6-12 months) asset-based loans for acquisition and rehab. Typically 10-15% interest, 20-25% down. Fast approval but expensive - plan your exit strategy."
        },
        {
          title: "Conventional Investment Loans",
          content: "Traditional bank loans for rental properties. 25% down minimum, 30-year amortization, 7-9% rates. Requires good credit and income verification."
        },
        {
          title: "Portfolio Lenders",
          content: "Local banks that keep loans in-house. More flexible terms, can often do rehab loans. Build relationships for better rates and terms on multiple properties."
        }
      ]
    },
    "market-analysis": {
      title: "Market Analysis",
      icon: <TrendingUp size={20} />,
      sections: [
        {
          title: "Identifying Good Markets",
          content: "Look for: Population and job growth, diverse economy, reasonable price-to-rent ratios, landlord-friendly laws, and growing rental demand from young professionals or families."
        },
        {
          title: "Neighborhood Research",
          content: "Study: Crime rates, school ratings, proximity to employment centers, public transportation, future development plans, and comparable rental rates."
        },
        {
          title: "Economic Indicators",
          content: "Monitor: Unemployment rates, median income growth, new construction permits, business openings, and infrastructure investments as leading indicators of market strength."
        }
      ]
    },
    "risk-management": {
      title: "Risk Management",
      icon: <Shield size={20} />,
      sections: [
        {
          title: "Common BRRRR Risks",
          content: "Rehab cost overruns, longer renovation timelines, lower-than-expected ARV, difficulty finding tenants, and market downturns affecting refinance values."
        },
        {
          title: "Mitigation Strategies",
          content: "Build 15-20% contingency into budgets, get multiple contractor bids, order appraisals early, maintain 6 months reserves, and diversify across multiple markets."
        },
        {
          title: "Exit Strategies",
          content: "Always have a Plan B: wholesale assignment, live-in for house hacking, long-term rental without refinance, or sale if market conditions change."
        }
      ]
    }
  };

  const topics = [
    { id: "brrrr-basics", label: "BRRRR Basics", icon: <BookOpen size={16} /> },
    { id: "70-percent-rule", label: "70% Rule", icon: <Calculator size={16} /> },
    { id: "1-percent-rule", label: "1% Rule", icon: <Percent size={16} /> },
    { id: "financing-strategies", label: "Financing", icon: <PiggyBank size={16} /> },
    { id: "market-analysis", label: "Market Analysis", icon: <TrendingUp size={16} /> },
    { id: "risk-management", label: "Risk Management", icon: <Shield size={16} /> }
  ];

  const currentContent = educationContent[selectedTopic];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 32px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>BRRRR Education Center</h1>
      <p style={{ color: THEME.textMuted, marginBottom: 32, fontSize: 16 }}>
        Master the BRRRR strategy with comprehensive guides and real-world insights
      </p>

      <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "300px 1fr", gap: 32 }}>
        {/* Topic Navigation */}
        <div>
          <h3 style={{ fontSize: 16, marginBottom: 16, color: THEME.text }}>Topics</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topics.map(topic => (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic.id)}
                style={{
                  padding: "12px 16px",
                  border: `2px solid ${selectedTopic === topic.id ? THEME.accent : THEME.border}`,
                  borderRadius: 8,
                  background: selectedTopic === topic.id ? THEME.bgRaised : THEME.bgPanel,
                  color: selectedTopic === topic.id ? THEME.accent : THEME.text,
                  fontSize: 14,
                  fontWeight: selectedTopic === topic.id ? 600 : 400,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease"
                }}
              >
                {topic.icon} {topic.label}
              </button>
            ))}
          </div>

          {/* Quick Reference Card */}
          <div style={{ 
            marginTop: 24, 
            padding: 16, 
            background: THEME.bgRaised, 
            borderRadius: 8,
            border: `1px solid ${THEME.border}`
          }}>
            <h4 style={{ fontSize: 14, marginBottom: 12, color: THEME.accent }}>
              Quick Reference
            </h4>
            <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.6 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>70% Rule:</strong> Buy + Rehab ≤ 70% × ARV
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>1% Rule:</strong> Rent ≥ 1% × Purchase Price
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Cash-on-Cash:</strong> Annual Cash Flow ÷ Cash Invested
              </div>
              <div>
                <strong>Cap Rate:</strong> Annual NOI ÷ Purchase Price
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 12, 
            marginBottom: 24,
            padding: "16px 0",
            borderBottom: `2px solid ${THEME.border}`
          }}>
            {currentContent.icon}
            <h2 style={{ fontSize: 24, margin: 0, color: THEME.text }}>
              {currentContent.title}
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {currentContent.sections.map((section, index) => (
              <div key={index} style={{
                padding: 20,
                background: THEME.bgPanel,
                borderRadius: 8,
                border: `1px solid ${THEME.border}`
              }}>
                <h3 style={{ 
                  fontSize: 18, 
                  marginBottom: 12, 
                  color: THEME.accent,
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}>
                  <span style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: THEME.accent,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700
                  }}>
                    {index + 1}
                  </span>
                  {section.title}
                </h3>
                <div style={{ 
                  fontSize: 14, 
                  lineHeight: 1.6, 
                  color: THEME.text,
                  whiteSpace: "pre-line"
                }}>
                  {section.content.split('**').map((part, i) => 
                    i % 2 === 0 ? part : <strong key={i} style={{ color: THEME.accent }}>{part}</strong>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Cards */}
          <div style={{ 
            marginTop: 32,
            display: "grid", 
            gridTemplateColumns: isMobile() ? "1fr" : "repeat(3, 1fr)", 
            gap: 16 
          }}>
            <div style={{
              padding: 16,
              background: THEME.bgRaised,
              borderRadius: 8,
              border: `1px solid ${THEME.accent}40`,
              textAlign: "center"
            }}>
              <Calculator size={24} style={{ color: THEME.accent, marginBottom: 8 }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                Try the Analyzer
              </div>
              <div style={{ fontSize: 12, color: THEME.textMuted }}>
                Run the numbers on your first BRRRR deal
              </div>
            </div>

            <div style={{
              padding: 16,
              background: THEME.bgRaised,
              borderRadius: 8,
              border: `1px solid ${THEME.secondary}40`,
              textAlign: "center"
            }}>
              <MapPin size={24} style={{ color: THEME.secondary, marginBottom: 8 }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                Explore Markets
              </div>
              <div style={{ fontSize: 12, color: THEME.textMuted }}>
                Find profitable markets nationwide
              </div>
            </div>

            <div style={{
              padding: 16,
              background: THEME.bgRaised,
              borderRadius: 8,
              border: `1px solid ${THEME.green}40`,
              textAlign: "center"
            }}>
              <Target size={24} style={{ color: THEME.green, marginBottom: 8 }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                Set Goals
              </div>
              <div style={{ fontSize: 12, color: THEME.textMuted }}>
                Plan your portfolio growth strategy
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   SIMPLE DASHBOARD (PLACEHOLDER)
   ============================================================================ */
const Dashboard = ({ deals, onNewDeal, onOpenDeal, onDeleteDeal }) => {
  if (!deals.length) {
    return (
      <div style={{
        maxWidth: 1400,
        margin: "0 auto",
        padding: "80px 32px",
        textAlign: "center"
      }}>
        <div style={{
          display: "inline-block",
          padding: "48px 56px",
          border: `2px solid ${THEME.border}`,
          borderRadius: 8,
          background: THEME.bgPanel
        }}>
          <Building2 size={64} style={{ color: THEME.accent, marginBottom: 24 }} />
          <h2 style={{
            fontSize: 32,
            fontWeight: 400,
            marginBottom: 16,
            color: THEME.text,
            fontFamily: "Fraunces, serif"
          }}>
            Welcome to DealTrack
          </h2>
          <p style={{
            fontSize: 16,
            color: THEME.textMuted,
            marginBottom: 32,
            maxWidth: 400
          }}>
            Professional BRRRR investment analysis for nationwide markets. Track deals, analyze markets across all 50 states, and build your portfolio.
          </p>
          
          <MobileOptimizedButton onClick={onNewDeal} variant="primary">
            <Plus size={16} /> Add First Deal
          </MobileOptimizedButton>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 32px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 32
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>Your Deals</h1>
        <MobileOptimizedButton onClick={onNewDeal} variant="primary">
          <Plus size={16} /> New Deal
        </MobileOptimizedButton>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 20
      }}>
        {deals.map(deal => {
          const metrics = calcMetrics(deal);
          return (
            <div
              key={deal.id}
              onClick={() => onOpenDeal(deal.id)}
              style={{
                background: THEME.bgPanel,
                border: `1px solid ${THEME.border}`,
                borderRadius: 8,
                padding: 20,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>{deal.address || "New Deal"}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDeal(deal.id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: THEME.red,
                    cursor: "pointer",
                    padding: 4
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 16 }}>
                {deal.city}, {deal.state} • {deal.propertyType}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <StatRow label="Purchase" value={fmtUSD(deal.purchasePrice)} />
                <StatRow label="ARV" value={fmtUSD(deal.arv)} />
                <StatRow 
                  label="Cash Flow" 
                  value={`${fmtUSD(Math.round(metrics.monthlyCashFlow))}/mo`}
                  valueColor={metrics.monthlyCashFlow > 0 ? THEME.green : THEME.red}
                />
                <StatRow 
                  label="Score" 
                  value={`${metrics.score}/100`}
                  valueColor={THEME.accent}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ... [Continue with the rest of the components]

export default function BRRRRTracker() {
  const [deals, setDeals] = useState([]);
  const [view, setView] = useState("dashboard");
  const [activeDealId, setActiveDealId] = useState(null);
  const [draftDeal, setDraftDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  // Performance optimizations
  const calcMetricsOptimized = useCallback((deal) => calcMetrics(deal), []);

  // Load deals from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dealtrack-deals");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setDeals(parsed);
        }
      }
    } catch (error) {
      console.error("Error loading deals:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save deals to localStorage
  useEffect(() => {
    if (!loading && deals.length > 0) {
      try {
        localStorage.setItem("dealtrack-deals", JSON.stringify(deals));
      } catch (error) {
        console.error("Error saving deals:", error);
      }
    }
  }, [deals, loading]);

  // Deal operations with useCallback for performance
  const onNewDeal = useCallback((template = null) => {
    const newDeal = template || {
      id: `deal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      address: "", city: "Columbus", state: "OH", propertyType: "Single Family",
      bedrooms: 3, bathrooms: 2, sqft: 1500, yearBuilt: 2000,
      purchasePrice: 165000, rehabBudget: 30000, arv: 215000, rentEstimate: 1350,
      downPayment: 25, loanAmount: 123750, interestRate: 7.5, loanTermYears: 30,
      closingCosts: 3300, holdingCosts: 2000, propertyTax: 3200, insurance: 1500,
      capex: 135, repairMaintenance: 135, vacancy: 8, mgmtFee: 10, hoa: 0,
      status: "analyzing", rehabMonths: 3, neighborhood: "Central",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: ""
    };
    
    setDraftDeal(newDeal);
    setActiveDealId(newDeal.id);
    setView("analyzer");
    setIsDirty(false);
  }, []);

  const onOpenDeal = useCallback((id) => {
    const deal = deals.find(d => d.id === id);
    if (deal) {
      setDraftDeal({ ...deal });
      setActiveDealId(id);
      setView("analyzer");
      setIsDirty(false);
    }
  }, [deals]);

  const onUpdateDraft = useCallback((updates) => {
    setDraftDeal(prev => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }));
    setIsDirty(true);
  }, []);

  const onSaveDeal = useCallback(() => {
    if (!draftDeal) return;
    
    const isNew = !deals.find(d => d.id === draftDeal.id);
    if (isNew) {
      setDeals(prev => [...prev, draftDeal]);
    } else {
      setDeals(prev => prev.map(d => d.id === draftDeal.id ? draftDeal : d));
    }
    setIsDirty(false);
  }, [draftDeal, deals]);

  const onDeleteDeal = useCallback((dealId) => {
    if (!confirm("Delete this deal? This cannot be undone.")) return;
    setDeals(prev => prev.filter(d => d.id !== dealId));
    if (activeDealId === dealId) {
      setView("dashboard");
      setActiveDealId(null);
      setDraftDeal(null);
      setIsDirty(false);
    }
  }, [activeDealId]);

  const onBack = useCallback(() => {
    if (isDirty && !confirm("Discard unsaved changes?")) return;
    setView("dashboard");
    setActiveDealId(null);
    setDraftDeal(null);
    setIsDirty(false);
  }, [isDirty]);

  if (loading) {
    return (
      <div className="brrrr-root" style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100vh"
      }}>
        <style>{STYLE_TAG}</style>
        <div style={{ color: THEME.textMuted, fontSize: 13 }} className="label-xs">
          Loading DealTrack...
        </div>
      </div>
    );
  }

  return (
    <div className="brrrr-root">
      <style>{STYLE_TAG}</style>
      <Header view={view} setView={(v) => {
        if (v !== "analyzer" && isDirty) {
          if (!confirm("Discard unsaved changes?")) return;
          setIsDirty(false);
        }
        if (v === "analyzer" && !activeDealId) {
          onNewDeal();
          return;
        }
        setView(v);
      }} dealCount={deals.length} />

      {/* Note: I'll need to create simplified versions of Dashboard, Portfolio, etc. due to length constraints */}
      {view === "analyzer" && draftDeal && (
        <Analyzer
          deal={draftDeal}
          onUpdate={onUpdateDraft}
          onSave={onSaveDeal}
          onBack={onBack}
          onDelete={() => onDeleteDeal(draftDeal.id)}
          isDirty={isDirty}
        />
      )}

      {view === "dashboard" && (
        <Dashboard
          deals={deals}
          onNewDeal={onNewDeal}
          onOpenDeal={onOpenDeal}
          onDeleteDeal={onDeleteDeal}
        />
      )}

      {view === "market" && <AdvancedMarketIntel />}
      
      {view === "education" && <EducationCenter />}

      {/* Simplified placeholder views for other sections */}



      <footer style={{
        marginTop: 60, padding: "20px 32px",
        borderTop: `1px solid ${THEME.border}`,
        maxWidth: 1400, margin: "60px auto 0",
        display: "flex", 
        flexDirection: isMobile() ? "column" : "row",
        justifyContent: "space-between", 
        gap: 20, textAlign: isMobile() ? "center" : "left"
      }}>
        <div style={{ fontSize: 11, color: THEME.textDim, lineHeight: 1.6, maxWidth: 700 }}>
          DealTrack is a comprehensive nationwide BRRRR real estate investment platform. 
          Advanced analytics, market intelligence, and workflow automation for professional investors.
          All calculations are estimates. Not financial advice.
        </div>
        <div style={{ display: "flex", flexDirection: isMobile() ? "column" : "row", alignItems: "center", gap: 16 }}>
          <div className="label-xs" style={{ color: THEME.accent }}>
            v3.0 Professional
          </div>
          <div className="label-xs" style={{ color: THEME.textDim }}>
            DealTrack © 2026
          </div>
        </div>
      </footer>
    </div>
  );
}
