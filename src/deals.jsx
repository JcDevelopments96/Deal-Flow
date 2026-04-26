/* ============================================================================
   DEAL DATA — templates, pipeline statuses, blank-deal factory, storage keys.
   ============================================================================ */
import React from "react";
import { Home, Building2, Award, Briefcase, Wrench } from "lucide-react";
import { THEME } from "./theme.js";

/* ── Storage keys (localStorage) ─────────────────────────────────────── */
export const STORAGE_KEY = "dealtrack-deals";
export const WATCHLIST_STORAGE_KEY = "dealtrack-watchlist";
export const RECENT_STORAGE_KEY = "dealtrack-recent-deals";
export const RECENT_MAX = 5;

/* ── Deal templates used by the TemplatePicker ───────────────────────── */
export const DEAL_TEMPLATES = {
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

/* ── Blank-deal factory ──────────────────────────────────────────────── */
export const createBlankDeal = (template = null) => {
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
    // Short-term rental (Airbnb / VRBO) inputs — feed the STR strategy
    // card on the Summary tab. Default 65% occupancy is the national
    // average for active STR markets; nightly rate left blank so the
    // user has to opt in.
    airbnbNightlyRate: 0, airbnbOccupancy: 65,
    notes: "",
    status: "lead"
  };
  if (template && DEAL_TEMPLATES[template]) {
    return { ...base, ...DEAL_TEMPLATES[template].defaults };
  }
  return base;
};

/* ── Pipeline statuses — workflow states a saved deal passes through ── */
export const DEAL_STATUSES = {
  lead:          { label: "Lead",            color: THEME.textMuted, bg: THEME.borderLight },
  analyzing:     { label: "Analyzing",       color: THEME.navy,      bg: THEME.bgRaised },
  offer:         { label: "Offer Made",      color: THEME.orange,    bg: THEME.bgOrange },
  underContract: { label: "Under Contract",  color: THEME.teal,      bg: THEME.bgTeal },
  closed:        { label: "Closed",          color: THEME.green,     bg: THEME.greenDim },
  rehab:         { label: "Rehab",           color: THEME.orange,    bg: THEME.bgOrange },
  rented:        { label: "Rented",          color: THEME.green,     bg: THEME.greenDim },
  exited:        { label: "Exited",          color: THEME.textDim,   bg: THEME.borderLight }
};
export const DEAL_STATUS_ORDER = ["lead", "analyzing", "offer", "underContract", "closed", "rehab", "rented", "exited"];

export const getDealStatus = (deal) => {
  const s = deal && deal.status;
  return DEAL_STATUSES[s] ? s : "analyzing";
};

export const StatusChip = ({ status, size = "sm", onClick }) => {
  const s = DEAL_STATUSES[status] || DEAL_STATUSES.analyzing;
  const padding = size === "sm" ? "3px 8px" : "5px 12px";
  const fontSize = size === "sm" ? 10 : 11;
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center",
        padding, fontSize, fontWeight: 700,
        letterSpacing: "0.06em", textTransform: "uppercase",
        background: s.bg, color: s.color,
        borderRadius: 4,
        cursor: onClick ? "pointer" : "default"
      }}
    >
      {s.label}
    </span>
  );
};
