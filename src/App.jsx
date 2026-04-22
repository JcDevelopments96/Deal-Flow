import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Building2, Calculator, TrendingUp, MapPin, Search, Plus, Trash2,
  Home, Calendar, FileText, X, ChevronRight, AlertTriangle, CheckCircle2,
  Info, Save, Sparkles, Wrench, Key, DoorOpen, Flame, Flag, BarChart3,
  Edit3, Copy, Filter, ArrowRight, Shield, Zap, Radar, ExternalLink,
  RefreshCw, Star, Target, Clock, Upload, BookOpen, GraduationCap, 
  DollarSign, TrendingDown, Percent, Users, Download, FileDown, 
  PieChart, LineChart, Activity, Briefcase, Award, Globe, Phone,
  Mail, MapPin as Location, Calendar as CalendarIcon, Eye, Settings,
  ChevronDown, ChevronUp, MoreHorizontal, Layout, Smartphone, Tablet,
  MonitorSpeaker, Wifi, WifiOff, Timer, Gauge, Layers
} from "lucide-react";

// Advanced features imports (these would be actual imports in a real app)
const jsPDF = window.jsPDF || (() => ({ text: () => {}, save: () => {} }));
const html2canvas = window.html2canvas || (() => Promise.resolve({ toDataURL: () => '' }));

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
      city: "Fort Lauderdale", neighborhood: "Central",
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
      city: "Hollywood", neighborhood: "East Hollywood",
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
      city: "Pembroke Pines", neighborhood: "Westside",
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
      city: "Boca Raton", neighborhood: "East Boca",
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
      city: "Fort Lauderdale", neighborhood: "Downtown",
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
      city: "Pompano Beach", neighborhood: "Central",
      propertyTax: 3200, insurance: 2200, capex: 185,
      repairMaintenance: 175, vacancy: 8, mgmtFee: 10,
      notes: "Major rehab required - structural, electrical, plumbing, HVAC"
    }
  }
};

/* ============================================================================
   MOBILE OPTIMIZATION UTILITIES
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
    pdf.text(`${deal.city || 'City'}, FL`, margin, 55);
    
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
    
    // Property Details
    pdf.setFontSize(14);
    pdf.setTextColor(13, 148, 136);
    pdf.text("Property Details", margin, y + 15);
    y += 30;
    
    pdf.setFontSize(11);
    pdf.setTextColor(30, 41, 59);
    pdf.text(`Type: ${deal.propertyType || 'N/A'}`, margin, y);
    pdf.text(`Bedrooms: ${deal.bedrooms || 'N/A'}`, pageWidth/2, y);
    y += 12;
    pdf.text(`Bathrooms: ${deal.bathrooms || 'N/A'}`, margin, y);
    pdf.text(`Square Feet: ${deal.sqft?.toLocaleString() || 'N/A'}`, pageWidth/2, y);
    
    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Generated by DealTrack on ${new Date().toLocaleDateString()}`, margin, 280);
    pdf.text("This analysis is for informational purposes only. Verify all numbers independently.", margin, 290);
    
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
   PORTFOLIO ANALYTICS
   ============================================================================ */
const PortfolioDashboard = ({ deals }) => {
  const analytics = useMemo(() => {
    if (!deals.length) return null;
    
    const metrics = deals.map(d => ({ deal: d, metrics: calcMetrics(d) }));
    const active = metrics.filter(m => !["dead", "sold"].includes(m.deal.status));
    
    return {
      totalDeals: deals.length,
      activeDeals: active.length,
      totalInvested: active.reduce((s, m) => s + m.metrics.totalInvested, 0),
      totalARV: active.reduce((s, m) => s + (m.deal.arv || 0), 0),
      totalEquity: active.reduce((s, m) => s + ((m.deal.arv || 0) - m.metrics.totalInvested), 0),
      avgCashFlow: active.length ? active.reduce((s, m) => s + (m.metrics.monthlyCashFlow || 0), 0) / active.length : 0,
      avgCapRate: active.length ? active.reduce((s, m) => s + (m.metrics.capRate || 0), 0) / active.length : 0,
      avgScore: active.length ? active.reduce((s, m) => s + (m.metrics.score || 0), 0) / active.length : 0,
      bestDeal: active.reduce((best, curr) => (curr.metrics.score > (best?.metrics.score || -1)) ? curr : best, null),
      worstDeal: active.reduce((worst, curr) => (curr.metrics.score < (worst?.metrics.score || 101)) ? curr : worst, null),
      statusBreakdown: deals.reduce((acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
      }, {}),
      cityBreakdown: deals.reduce((acc, d) => {
        const city = d.city || 'Unknown';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {}),
      monthlyBreakdown: active.reduce((acc, m) => {
        const cashFlow = m.metrics.monthlyCashFlow || 0;
        acc.totalCashFlow += cashFlow;
        acc.totalRent += m.deal.rentEstimate || 0;
        return acc;
      }, { totalCashFlow: 0, totalRent: 0 })
    };
  }, [deals]);

  if (!analytics) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: THEME.textMuted }}>
        <PieChart size={48} style={{ margin: "0 auto 20px" }} />
        <div style={{ fontSize: 18, marginBottom: 8 }}>No Portfolio Data</div>
        <div style={{ fontSize: 14 }}>Add your first deal to see portfolio analytics</div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
      {/* Portfolio Overview */}
      <Panel title="Portfolio Overview" icon={<PieChart size={16} />} accent>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <StatRow label="Total Deals" value={analytics.totalDeals} bold />
          <StatRow label="Active Deals" value={analytics.activeDeals} bold />
          <StatRow label="Total Invested" value={`$${analytics.totalInvested.toLocaleString()}`} valueColor={THEME.accent} bold />
          <StatRow label="Total ARV" value={`$${analytics.totalARV.toLocaleString()}`} valueColor={THEME.secondary} bold />
          <StatRow label="Total Equity" value={`$${analytics.totalEquity.toLocaleString()}`} valueColor={THEME.green} bold />
          <StatRow label="Avg Score" value={`${analytics.avgScore.toFixed(0)}/100`} bold />
        </div>
      </Panel>

      {/* Monthly Performance */}
      <Panel title="Monthly Performance" icon={<Activity size={16} />}>
        <StatRow label="Total Monthly Rent" value={`$${analytics.monthlyBreakdown.totalRent.toLocaleString()}`} valueColor={THEME.accent} bold />
        <StatRow label="Total Cash Flow" value={`$${analytics.monthlyBreakdown.totalCashFlow.toFixed(0)}`} valueColor={analytics.monthlyBreakdown.totalCashFlow > 0 ? THEME.green : THEME.red} bold />
        <StatRow label="Average Cap Rate" value={`${analytics.avgCapRate.toFixed(1)}%`} />
        <StatRow label="Avg Cash Flow/Deal" value={`$${analytics.avgCashFlow.toFixed(0)}`} />
      </Panel>

      {/* Best & Worst Performers */}
      <Panel title="Performance Leaders" icon={<Award size={16} />}>
        {analytics.bestDeal && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 4 }}>🏆 Best Performer</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: THEME.green }}>
              {analytics.bestDeal.deal.address} ({analytics.bestDeal.metrics.score}/100)
            </div>
          </div>
        )}
        {analytics.worstDeal && (
          <div>
            <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 4 }}>📊 Needs Attention</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: THEME.red }}>
              {analytics.worstDeal.deal.address} ({analytics.worstDeal.metrics.score}/100)
            </div>
          </div>
        )}
      </Panel>

      {/* Geographic Distribution */}
      <Panel title="Geographic Distribution" icon={<MapPin size={16} />}>
        {Object.entries(analytics.cityBreakdown).slice(0, 5).map(([city, count]) => (
          <StatRow key={city} label={city} value={`${count} deal${count > 1 ? 's' : ''}`} />
        ))}
      </Panel>
    </div>
  );
};

/* ============================================================================
   MARKET TRENDS COMPONENT
   ============================================================================ */
const MarketTrendsPanel = () => {
  const [selectedCity, setSelectedCity] = useState("Fort Lauderdale");
  const [timeframe, setTimeframe] = useState("6months");
  
  // Simulated market data (in real app, this would come from APIs)
  const marketData = {
    "Fort Lauderdale": {
      medianPrice: 385000,
      priceChange: 8.2,
      medianRent: 2100,
      rentChange: 12.1,
      inventory: 2.3,
      daysOnMarket: 28,
      rentYield: 6.5,
      appreciation: 9.1
    },
    "Hollywood": {
      medianPrice: 425000,
      priceChange: 7.8,
      medianRent: 2350,
      rentChange: 10.5,
      inventory: 2.1,
      daysOnMarket: 32,
      rentYield: 6.6,
      appreciation: 8.7
    },
    "Pompano Beach": {
      medianPrice: 295000,
      priceChange: 11.2,
      medianRent: 1850,
      rentChange: 15.3,
      inventory: 3.1,
      daysOnMarket: 25,
      rentYield: 7.5,
      appreciation: 12.8
    }
  };

  const currentData = marketData[selectedCity] || marketData["Fort Lauderdale"];

  return (
    <Panel title="Market Trends" icon={<TrendingUp size={16} />} accent>
      <div style={{ marginBottom: 20 }}>
        <SelectField 
          label="Market"
          value={selectedCity}
          onChange={setSelectedCity}
          options={Object.keys(marketData)}
        />
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "1fr 1fr", gap: 12 }}>
        <StatRow 
          label="Median Price" 
          value={`$${currentData.medianPrice.toLocaleString()}`}
          sublabel={`${currentData.priceChange > 0 ? '+' : ''}${currentData.priceChange}% YoY`}
          valueColor={currentData.priceChange > 0 ? THEME.green : THEME.red}
        />
        <StatRow 
          label="Median Rent" 
          value={`$${currentData.medianRent.toLocaleString()}`}
          sublabel={`${currentData.rentChange > 0 ? '+' : ''}${currentData.rentChange}% YoY`}
          valueColor={currentData.rentChange > 0 ? THEME.green : THEME.red}
        />
        <StatRow label="Days on Market" value={`${currentData.daysOnMarket} days`} />
        <StatRow label="Inventory" value={`${currentData.inventory} months`} />
        <StatRow 
          label="Rent Yield" 
          value={`${currentData.rentYield}%`}
          valueColor={THEME.accent}
        />
        <StatRow 
          label="Price Appreciation" 
          value={`${currentData.appreciation}%`}
          valueColor={THEME.secondary}
        />
      </div>
      
      <div style={{ 
        marginTop: 20, 
        padding: 16, 
        background: THEME.bgRaised, 
        borderRadius: 6,
        border: `1px solid ${THEME.border}`
      }}>
        <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 8 }}>
          📈 Market Outlook
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.4 }}>
          {selectedCity} shows {currentData.priceChange > 5 ? "strong" : "moderate"} price growth 
          with {currentData.rentYield > 7 ? "excellent" : "good"} rental yields. 
          Inventory is {currentData.inventory < 3 ? "tight" : "balanced"}, 
          favoring {currentData.inventory < 3 ? "sellers" : "buyers"}.
        </div>
      </div>
    </Panel>
  );
};

/* ============================================================================
   ROI PROJECTIONS COMPONENT  
   ============================================================================ */
const ROIProjections = ({ deal }) => {
  const [projectionYears, setProjectionYears] = useState(5);
  const [appreciationRate, setAppreciationRate] = useState(4);
  const [rentGrowthRate, setRentGrowthRate] = useState(3);
  
  const projections = useMemo(() => {
    if (!deal) return [];
    
    const metrics = calcMetrics(deal);
    const initialValue = deal.arv || 0;
    const initialRent = deal.rentEstimate || 0;
    const initialCashFlow = metrics.monthlyCashFlow || 0;
    
    return Array.from({ length: projectionYears }, (_, i) => {
      const year = i + 1;
      const propertyValue = initialValue * Math.pow(1 + appreciationRate / 100, year);
      const monthlyRent = initialRent * Math.pow(1 + rentGrowthRate / 100, year);
      const monthlyCashFlow = initialCashFlow * Math.pow(1 + rentGrowthRate / 100, year); // Simplified
      const equity = propertyValue - (metrics.totalInvested || 0);
      const totalReturn = (monthlyCashFlow * 12 * year) + (propertyValue - initialValue);
      const annualizedReturn = Math.pow(1 + totalReturn / metrics.totalInvested, 1/year) - 1;
      
      return {
        year,
        propertyValue,
        monthlyRent,
        monthlyCashFlow,
        equity,
        totalReturn,
        annualizedReturn: annualizedReturn * 100
      };
    });
  }, [deal, projectionYears, appreciationRate, rentGrowthRate]);

  if (!deal) {
    return (
      <Panel title="ROI Projections" icon={<LineChart size={16} />}>
        <div style={{ textAlign: "center", color: THEME.textMuted, padding: 20 }}>
          Select a deal to view ROI projections
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="ROI Projections" icon={<LineChart size={16} />} accent>
      <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        <div>
          <div className="label-xs" style={{ marginBottom: 6 }}>Projection Years</div>
          <input
            type="range"
            min="1"
            max="10"
            value={projectionYears}
            onChange={(e) => setProjectionYears(parseInt(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ textAlign: "center", fontSize: 12, color: THEME.textMuted }}>{projectionYears} years</div>
        </div>
        
        <div>
          <div className="label-xs" style={{ marginBottom: 6 }}>Appreciation Rate</div>
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
        
        <div>
          <div className="label-xs" style={{ marginBottom: 6 }}>Rent Growth Rate</div>
          <input
            type="range"
            min="0"
            max="8"
            step="0.5"
            value={rentGrowthRate}
            onChange={(e) => setRentGrowthRate(parseFloat(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={{ textAlign: "center", fontSize: 12, color: THEME.textMuted }}>{rentGrowthRate}% annually</div>
        </div>
      </div>
      
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
              <th style={{ padding: "8px 4px", textAlign: "left", fontSize: 11, color: THEME.textMuted }}>Year</th>
              <th style={{ padding: "8px 4px", textAlign: "right", fontSize: 11, color: THEME.textMuted }}>Value</th>
              <th style={{ padding: "8px 4px", textAlign: "right", fontSize: 11, color: THEME.textMuted }}>Rent</th>
              <th style={{ padding: "8px 4px", textAlign: "right", fontSize: 11, color: THEME.textMuted }}>Cash Flow</th>
              <th style={{ padding: "8px 4px", textAlign: "right", fontSize: 11, color: THEME.textMuted }}>Equity</th>
              <th style={{ padding: "8px 4px", textAlign: "right", fontSize: 11, color: THEME.textMuted }}>Return</th>
            </tr>
          </thead>
          <tbody>
            {projections.map(p => (
              <tr key={p.year} style={{ borderBottom: `1px solid ${THEME.borderLight}` }}>
                <td style={{ padding: "8px 4px", fontSize: 13, fontWeight: 600 }}>{p.year}</td>
                <td style={{ padding: "8px 4px", fontSize: 12, textAlign: "right", fontFamily: "monospace" }}>
                  ${p.propertyValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td style={{ padding: "8px 4px", fontSize: 12, textAlign: "right", fontFamily: "monospace" }}>
                  ${p.monthlyRent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td style={{ padding: "8px 4px", fontSize: 12, textAlign: "right", fontFamily: "monospace", color: p.monthlyCashFlow > 0 ? THEME.green : THEME.red }}>
                  ${p.monthlyCashFlow.toFixed(0)}
                </td>
                <td style={{ padding: "8px 4px", fontSize: 12, textAlign: "right", fontFamily: "monospace", color: THEME.accent }}>
                  ${p.equity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
                <td style={{ padding: "8px 4px", fontSize: 12, textAlign: "right", fontFamily: "monospace", color: THEME.secondary }}>
                  {p.annualizedReturn.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
};

const EXISTING_CONSTANTS = `/* ============================================================================
   THEME + FONTS
   ============================================================================ */`;
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
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
input:focus, select:focus, textarea:focus {
  border-color: ${THEME.accent}; box-shadow: 0 0 0 3px rgba(201, 169, 97, 0.12);
}
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
input[type="number"] { -moz-appearance: textfield; }
button { font-family: inherit; cursor: pointer; border: none; background: none; color: inherit; }
.scroll-thin::-webkit-scrollbar { width: 8px; height: 8px; }
.scroll-thin::-webkit-scrollbar-track { background: ${THEME.bgPanel}; }
.scroll-thin::-webkit-scrollbar-thumb { background: ${THEME.border}; border-radius: 4px; }
.scroll-thin::-webkit-scrollbar-thumb:hover { background: ${THEME.borderLight}; }
.fade-in { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.grid-bg {
  background-image:
    linear-gradient(to right, ${THEME.border}22 1px, transparent 1px),
    linear-gradient(to bottom, ${THEME.border}22 1px, transparent 1px);
  background-size: 32px 32px;
}
.noise-bg { position: relative; }
.noise-bg::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
  opacity: 0.03; mix-blend-mode: overlay;
}
.btn-primary {
  background: ${THEME.accent}; color: ${THEME.bg}; font-weight: 600;
  padding: 10px 18px; border-radius: 2px; font-size: 13px;
  letter-spacing: 0.02em; transition: background 0.15s ease;
  display: inline-flex; align-items: center; gap: 8px;
}
.btn-primary:hover { background: #D4B77A; }
.btn-secondary {
  background: ${THEME.bgRaised}; color: ${THEME.text}; border: 1px solid ${THEME.border};
  padding: 9px 16px; border-radius: 2px; font-size: 13px; font-weight: 500;
  transition: all 0.15s ease;
  display: inline-flex; align-items: center; gap: 6px;
}
.btn-secondary:hover { border-color: ${THEME.borderLight}; background: ${THEME.bgPanel}; }
.btn-ghost { padding: 7px 12px; font-size: 13px; color: ${THEME.textMuted}; transition: color 0.15s ease; border-radius: 2px; display: inline-flex; align-items: center; gap: 6px; }
.btn-ghost:hover { color: ${THEME.text}; }
.btn-danger { color: ${THEME.red}; }
.btn-danger:hover { color: #EA8A85; background: ${THEME.redDim}44; }
.accent-corners {
  position: relative;
}
.accent-corners::before, .accent-corners::after {
  content: ""; position: absolute; width: 10px; height: 10px;
  border: 1px solid ${THEME.accent};
}
.accent-corners::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.accent-corners::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }
.pulse { animation: pulse 2.5s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.gradient-text {
  background: linear-gradient(135deg, ${THEME.accent} 0%, #E5C783 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
`;

/* ============================================================================
   CITY DATA — SE FLORIDA (all 3 counties)
   ============================================================================ */
const CITIES = [
  // MIAMI-DADE
  { name: "Miami", county: "Miami-Dade", strStatus: "restricted", strNote: "T3 residential zones prohibit STR; allowed only in commercial/mixed-use. Strict enforcement with heavy fines.", adrLow: 180, adrHigh: 340, occupancy: 62, brrrrScore: 3 },
  { name: "Miami Beach", county: "Miami-Dade", strStatus: "prohibited", strNote: "Banned in most single-family/multi-family residential. Allowed in specific overlay districts. Fines up to $20K per violation.", adrLow: 320, adrHigh: 550, occupancy: 72, brrrrScore: 2 },
  { name: "North Miami Beach", county: "Miami-Dade", strStatus: "allowed", strNote: "Allowed with Business Tax Receipt. Verify zoning for specific address.", adrLow: 165, adrHigh: 250, occupancy: 63, brrrrScore: 4 },
  { name: "North Miami", county: "Miami-Dade", strStatus: "allowed", strNote: "Generally allowed with BTR. Emerging market with renovation upside.", adrLow: 150, adrHigh: 225, occupancy: 60, brrrrScore: 4 },
  { name: "Aventura", county: "Miami-Dade", strStatus: "restricted", strNote: "Most condos enforce 6-month minimum rentals. Verify HOA rules before offer.", adrLow: 195, adrHigh: 300, occupancy: 65, brrrrScore: 2 },
  { name: "Sunny Isles Beach", county: "Miami-Dade", strStatus: "varies", strNote: "Highly condo-dependent. Some buildings allow 30-day min, some weekly. HOA is the gatekeeper.", adrLow: 240, adrHigh: 425, occupancy: 68, brrrrScore: 3 },
  { name: "Miami Gardens", county: "Miami-Dade", strStatus: "allowed", strNote: "Allowed with registration. Strong distressed inventory. Working-class LTR market.", adrLow: 120, adrHigh: 180, occupancy: 55, brrrrScore: 4 },
  { name: "Hialeah", county: "Miami-Dade", strStatus: "restricted", strNote: "30-day minimum rentals enforced. Strong LTR market though — consider LTR strategy.", adrLow: 135, adrHigh: 200, occupancy: 60, brrrrScore: 3 },
  { name: "Homestead", county: "Miami-Dade", strStatus: "allowed", strNote: "Allowed with BTR. Low entry, strong ARV appreciation. Good BRRRR market.", adrLow: 125, adrHigh: 195, occupancy: 58, brrrrScore: 5 },
  { name: "Cutler Bay", county: "Miami-Dade", strStatus: "allowed", strNote: "Allowed with registration. Solid value BRRRR territory.", adrLow: 135, adrHigh: 210, occupancy: 58, brrrrScore: 4 },
  { name: "Coral Gables", county: "Miami-Dade", strStatus: "prohibited", strNote: "STRs prohibited in residential zones. Strict enforcement.", adrLow: 300, adrHigh: 475, occupancy: 65, brrrrScore: 1 },
  { name: "Doral", county: "Miami-Dade", strStatus: "restricted", strNote: "Most HOAs restrict STR. Better positioned for LTR.", adrLow: 175, adrHigh: 265, occupancy: 55, brrrrScore: 2 },

  // BROWARD
  { name: "Fort Lauderdale", county: "Broward", strStatus: "allowed", strNote: "Allowed with vacation rental certificate + safety inspection + BTR. Prime tourist market.", adrLow: 215, adrHigh: 385, occupancy: 72, brrrrScore: 5 },
  { name: "Hollywood", county: "Broward", strStatus: "allowed", strNote: "Allowed with registration + BTR. Beach boardwalk area is premium. Strong year-round demand.", adrLow: 195, adrHigh: 340, occupancy: 70, brrrrScore: 5 },
  { name: "Pompano Beach", county: "Broward", strStatus: "allowed", strNote: "Allowed with BTR + registration. Beach-side zones perform strongest.", adrLow: 170, adrHigh: 290, occupancy: 67, brrrrScore: 5 },
  { name: "Deerfield Beach", county: "Broward", strStatus: "allowed", strNote: "Allowed with proper registration. Cove/pier area premium for STR.", adrLow: 160, adrHigh: 275, occupancy: 65, brrrrScore: 5 },
  { name: "Dania Beach", county: "Broward", strStatus: "allowed", strNote: "Generally allowed. Airport + beach proximity = steady demand.", adrLow: 165, adrHigh: 240, occupancy: 65, brrrrScore: 4 },
  { name: "Hallandale Beach", county: "Broward", strStatus: "allowed", strNote: "Allowed with registration. Beach-adjacent east side premium.", adrLow: 175, adrHigh: 280, occupancy: 68, brrrrScore: 4 },
  { name: "Wilton Manors", county: "Broward", strStatus: "allowed", strNote: "Allowed. LGBTQ+ tourist destination — strong year-round STR demand.", adrLow: 175, adrHigh: 265, occupancy: 68, brrrrScore: 4 },
  { name: "Oakland Park", county: "Broward", strStatus: "allowed", strNote: "Allowed with registration. Emerging value play, gentrifying fast.", adrLow: 150, adrHigh: 220, occupancy: 60, brrrrScore: 5 },
  { name: "Pembroke Pines", county: "Broward", strStatus: "restricted", strNote: "Most zones enforce 30+ day minimums. LTR market is solid.", adrLow: 155, adrHigh: 225, occupancy: 55, brrrrScore: 3 },
  { name: "Miramar", county: "Broward", strStatus: "restricted", strNote: "Restricted in residential. Go LTR strategy.", adrLow: 140, adrHigh: 205, occupancy: 52, brrrrScore: 3 },
  { name: "Plantation", county: "Broward", strStatus: "restricted", strNote: "Heavy HOA restrictions. LTR-friendly.", adrLow: 150, adrHigh: 225, occupancy: 55, brrrrScore: 3 },
  { name: "Sunrise", county: "Broward", strStatus: "restricted", strNote: "Mostly restricted residentially. Strong LTR near Sawgrass/corporate corridor.", adrLow: 140, adrHigh: 205, occupancy: 55, brrrrScore: 3 },
  { name: "Lauderhill", county: "Broward", strStatus: "allowed", strNote: "Allowed with BTR. Value BRRRR with rising ARVs.", adrLow: 125, adrHigh: 185, occupancy: 55, brrrrScore: 4 },
  { name: "Tamarac", county: "Broward", strStatus: "varies", strNote: "Many 55+ communities restrict entirely. Non-age-restricted zones more flexible.", adrLow: 130, adrHigh: 195, occupancy: 55, brrrrScore: 3 },
  { name: "Davie", county: "Broward", strStatus: "restricted", strNote: "Restricted in residential. LTR-strong area (Nova SE + equestrian pockets).", adrLow: 160, adrHigh: 230, occupancy: 55, brrrrScore: 3 },
  { name: "Coral Springs", county: "Broward", strStatus: "restricted", strNote: "Heavy HOA restrictions. LTR-only in most areas.", adrLow: 155, adrHigh: 225, occupancy: 52, brrrrScore: 2 },
  { name: "Lighthouse Point", county: "Broward", strStatus: "restricted", strNote: "Limited STR allowance. Higher-end coastal market.", adrLow: 200, adrHigh: 320, occupancy: 60, brrrrScore: 2 },

  // PALM BEACH
  { name: "West Palm Beach", county: "Palm Beach", strStatus: "allowed", strNote: "Allowed with registration + BTR. Downtown/Flagler corridor growing fast.", adrLow: 175, adrHigh: 290, occupancy: 65, brrrrScore: 5 },
  { name: "Lake Worth Beach", county: "Palm Beach", strStatus: "allowed", strNote: "Allowed. Emerging beach-adjacent market with strong STR upside.", adrLow: 155, adrHigh: 245, occupancy: 63, brrrrScore: 5 },
  { name: "Boynton Beach", county: "Palm Beach", strStatus: "allowed", strNote: "Allowed with registration. Value market, strong ARV growth, STR + LTR both viable.", adrLow: 150, adrHigh: 240, occupancy: 60, brrrrScore: 5 },
  { name: "Lantana", county: "Palm Beach", strStatus: "allowed", strNote: "Allowed. Low entry prices, emerging area between LWB and Boynton.", adrLow: 140, adrHigh: 215, occupancy: 58, brrrrScore: 4 },
  { name: "Riviera Beach", county: "Palm Beach", strStatus: "allowed", strNote: "Allowed with registration. Distressed opportunity zone, waterfront potential.", adrLow: 135, adrHigh: 220, occupancy: 58, brrrrScore: 4 },
  { name: "Greenacres", county: "Palm Beach", strStatus: "allowed", strNote: "Allowed. Value BRRRR market.", adrLow: 130, adrHigh: 195, occupancy: 55, brrrrScore: 4 },
  { name: "Delray Beach", county: "Palm Beach", strStatus: "restricted", strNote: "6-month minimum enforced in most residential. Allowed in specific downtown/beach overlays.", adrLow: 225, adrHigh: 395, occupancy: 68, brrrrScore: 3 },
  { name: "Boca Raton", county: "Palm Beach", strStatus: "restricted", strNote: "Most residential enforces 6-month minimums. HOA restrictions common.", adrLow: 240, adrHigh: 410, occupancy: 62, brrrrScore: 2 },
  { name: "Jupiter", county: "Palm Beach", strStatus: "restricted", strNote: "Limited STR in residential zones. 30-day minimums common.", adrLow: 210, adrHigh: 340, occupancy: 60, brrrrScore: 2 },
  { name: "Palm Beach Gardens", county: "Palm Beach", strStatus: "restricted", strNote: "HOA-heavy, most restrict STR. LTR-only in most areas.", adrLow: 195, adrHigh: 310, occupancy: 58, brrrrScore: 2 },
  { name: "Wellington", county: "Palm Beach", strStatus: "restricted", strNote: "Mostly LTR. Seasonal equestrian rentals (Dec–Apr) are the exception.", adrLow: 185, adrHigh: 290, occupancy: 55, brrrrScore: 2 }
];

const STATUSES = [
  { id: "prospecting", label: "Prospecting", color: THEME.blue },
  { id: "analyzing",   label: "Analyzing",   color: THEME.accent },
  { id: "offer",       label: "Offer Made",  color: THEME.orange },
  { id: "contract",    label: "Under Contract", color: THEME.purple },
  { id: "closed",      label: "Closed",      color: THEME.green },
  { id: "rehab",       label: "In Rehab",    color: THEME.orange },
  { id: "refi",        label: "Refinancing", color: THEME.blue },
  { id: "rented",      label: "Operating",   color: THEME.green },
  { id: "sold",        label: "Sold/Exited", color: THEME.textMuted },
  { id: "dead",        label: "Dead Deal",   color: THEME.red }
];

const ACQ_METHODS = [
  { id: "cash",      label: "All Cash" },
  { id: "hardmoney", label: "Hard Money" },
  { id: "private",   label: "Private Lender" },
  { id: "convmix",   label: "Conventional/Mix" }
];

/* ============================================================================
   DEFAULT DEAL
   ============================================================================ */
const makeNewDeal = () => ({
  id: `deal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  address: "",
  city: "Fort Lauderdale",
  county: "Broward",
  status: "prospecting",
  beds: 3, baths: 2, sqft: 1400, yearBuilt: 1975, lotSize: 7000,

  acqMethod: "hardmoney",
  purchasePrice: 250000,
  closingCosts: 7500,
  acqLoanLTV: 80,
  acqLoanRate: 11,
  acqLoanPoints: 2,

  rehabBudget: 50000,
  rehabMonths: 4,
  acqHoldingCostPerMonth: 2500,

  arv: 400000,

  refiLTV: 75,
  refiRate: 7.5,
  refiTerm: 30,
  refiClosingCosts: 6000,

  strategy: "STR",
  monthlyRent: 2800,
  vacancyPct: 5,
  propMgmtPct: 10,
  maintenancePct: 5,
  capexPct: 5,

  strADR: 225,
  strOccupancy: 65,
  strPropMgmtPct: 20,
  strUtilitiesMonthly: 250,
  strInternetMonthly: 80,
  strSuppliesMonthly: 150,

  annualTaxes: 4800,
  annualInsurance: 3600,
  hoaMonthly: 0,

  notes: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

/* ============================================================================
   CALCULATIONS
   ============================================================================ */
const n = (v) => Number(v) || 0;

const mortgagePmt = (principal, annualRatePct, years) => {
  const p = n(principal), rate = n(annualRatePct), t = n(years);
  if (!p || !rate || !t) return 0;
  const r = rate / 100 / 12;
  const nm = t * 12;
  return (p * (r * Math.pow(1 + r, nm))) / (Math.pow(1 + r, nm) - 1);
};

const calcMetrics = (d) => {
  const totalAcqCost = n(d.purchasePrice) + n(d.closingCosts);
  const holdingTotal = n(d.acqHoldingCostPerMonth) * n(d.rehabMonths);
  const totalInvested = totalAcqCost + n(d.rehabBudget) + holdingTotal + n(d.refiClosingCosts);

  // 70% Rule MAO
  const mao = n(d.arv) * 0.70 - n(d.rehabBudget);
  const overUnderMAO = mao - n(d.purchasePrice);
  const allInPct = n(d.arv) > 0 ? (totalInvested / n(d.arv)) * 100 : 0;

  // Refinance
  const refiAmount = n(d.arv) * n(d.refiLTV) / 100;
  const refiMonthlyPI = mortgagePmt(refiAmount, d.refiRate, d.refiTerm);
  const cashLeftIn = totalInvested - refiAmount;

  // LTR cash flow
  const ltrEffectiveRent = n(d.monthlyRent) * (1 - n(d.vacancyPct) / 100);
  const ltrMgmt = n(d.monthlyRent) * n(d.propMgmtPct) / 100;
  const ltrMaint = n(d.monthlyRent) * n(d.maintenancePct) / 100;
  const ltrCapex = n(d.monthlyRent) * n(d.capexPct) / 100;
  const taxesMo = n(d.annualTaxes) / 12;
  const insMo = n(d.annualInsurance) / 12;
  const hoaMo = n(d.hoaMonthly);
  const ltrExpenses = refiMonthlyPI + taxesMo + insMo + hoaMo + ltrMgmt + ltrMaint + ltrCapex;
  const ltrCashFlow = ltrEffectiveRent - ltrExpenses;
  const ltrAnnualCF = ltrCashFlow * 12;
  const ltrCoC = cashLeftIn > 0 ? (ltrAnnualCF / cashLeftIn) * 100 : ltrAnnualCF > 0 ? Infinity : 0;

  // STR cash flow
  const nightsPerMonth = 30.4;
  const occupiedNights = nightsPerMonth * n(d.strOccupancy) / 100;
  const strGrossRev = n(d.strADR) * occupiedNights;
  const strPlatformFee = strGrossRev * 0.03;
  const strMgmt = strGrossRev * n(d.strPropMgmtPct) / 100;
  const strMaint = strGrossRev * n(d.maintenancePct) / 100;
  const strInsMo = (n(d.annualInsurance) * 1.25) / 12; // STR insurance premium ~25% higher
  const strExpenses = refiMonthlyPI + strPlatformFee + strMgmt + strMaint +
    n(d.strUtilitiesMonthly) + n(d.strInternetMonthly) + n(d.strSuppliesMonthly) +
    taxesMo + strInsMo + hoaMo;
  const strCashFlow = strGrossRev - strExpenses;
  const strAnnualCF = strCashFlow * 12;
  const strCoC = cashLeftIn > 0 ? (strAnnualCF / cashLeftIn) * 100 : strAnnualCF > 0 ? Infinity : 0;

  // Flip
  const flipSellCosts = n(d.arv) * 0.08; // 6% commission + 2% closing
  const flipProfit = n(d.arv) - totalAcqCost - n(d.rehabBudget) - holdingTotal - flipSellCosts;
  const flipCashInvested = totalAcqCost + n(d.rehabBudget) + holdingTotal;
  const flipROI = flipCashInvested > 0 ? (flipProfit / flipCashInvested) * 100 : 0;

  // Deal grade scoring
  let score = 0;
  if (overUnderMAO >= 0) score += 28;
  else if (overUnderMAO > -10000) score += 18;
  else if (overUnderMAO > -25000) score += 10;

  if (allInPct < 70) score += 18;
  else if (allInPct < 75) score += 13;
  else if (allInPct < 80) score += 8;
  else if (allInPct < 85) score += 3;

  const bestCF = Math.max(ltrCashFlow, strCashFlow);
  if (bestCF > 1000) score += 20;
  else if (bestCF > 500) score += 14;
  else if (bestCF > 200) score += 8;
  else if (bestCF > 0) score += 3;

  if (cashLeftIn <= 0) score += 22;
  else if (cashLeftIn < 10000) score += 16;
  else if (cashLeftIn < 25000) score += 10;
  else if (cashLeftIn < 50000) score += 4;

  const city = CITIES.find(c => c.name === d.city);
  if (city) {
    if (d.strategy === "STR") {
      if (city.strStatus === "allowed") score += 10;
      else if (city.strStatus === "varies" || city.strStatus === "allowed") score += 5;
    } else {
      score += 7;
    }
  }

  let grade, gradeColor;
  if (score >= 85)      { grade = "A+"; gradeColor = THEME.green; }
  else if (score >= 75) { grade = "A";  gradeColor = THEME.green; }
  else if (score >= 62) { grade = "B";  gradeColor = THEME.accent; }
  else if (score >= 48) { grade = "C";  gradeColor = THEME.orange; }
  else if (score >= 32) { grade = "D";  gradeColor = "#D9706B"; }
  else                  { grade = "F";  gradeColor = THEME.red; }

  return {
    totalAcqCost, holdingTotal, totalInvested,
    mao, overUnderMAO, allInPct,
    refiAmount, refiMonthlyPI, cashLeftIn,
    ltrEffectiveRent, ltrExpenses, ltrCashFlow, ltrAnnualCF, ltrCoC,
    strGrossRev, strExpenses, strCashFlow, strAnnualCF, strCoC,
    flipProfit, flipROI, flipCashInvested, flipSellCosts,
    score, grade, gradeColor
  };
};

/* ============================================================================
   FORMATTERS
   ============================================================================ */
const fmtUSD = (v, opts = {}) => {
  const num = n(v);
  if (opts.short && Math.abs(num) >= 1000) {
    return `$${(num / 1000).toFixed(opts.decimals ?? 1)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    maximumFractionDigits: opts.decimals ?? 0,
    minimumFractionDigits: opts.decimals ?? 0
  }).format(num);
};
const fmtPct = (v, d = 1) => `${n(v).toFixed(d)}%`;
const fmtPctSpecial = (v, d = 1) => !isFinite(v) ? "∞" : fmtPct(v, d);
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/* ============================================================================
   REUSABLE COMPONENTS
   ============================================================================ */
const NumField = ({ label, value, onChange, prefix, suffix, helper, small, step = 1 }) => (
  <div style={{ marginBottom: small ? 12 : 14 }}>
    <div className="label-xs" style={{ marginBottom: 6 }}>{label}</div>
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      {prefix && (
        <span className="mono" style={{
          position: "absolute", left: 10, color: THEME.textDim, fontSize: 12,
          pointerEvents: "none", zIndex: 1
        }}>{prefix}</span>
      )}
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
        className="mono"
        style={{
          width: "100%", padding: prefix ? "9px 10px 9px 22px" : "9px 10px",
          fontSize: 13, paddingRight: suffix ? 32 : 10
        }}
      />
      {suffix && (
        <span className="mono" style={{
          position: "absolute", right: 10, color: THEME.textDim, fontSize: 12,
          pointerEvents: "none"
        }}>{suffix}</span>
      )}
    </div>
    {helper && <div style={{ fontSize: 11, color: THEME.textDim, marginTop: 4 }}>{helper}</div>}
  </div>
);

const TextField = ({ label, value, onChange, placeholder }) => (
  <div style={{ marginBottom: 14 }}>
    <div className="label-xs" style={{ marginBottom: 6 }}>{label}</div>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: "100%", padding: "9px 10px", fontSize: 13 }}
    />
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

const StrStatusBadge = ({ status, size = "sm" }) => {
  const config = {
    allowed:    { label: "STR Allowed",    bg: THEME.greenDim,   fg: THEME.green,   icon: <CheckCircle2 size={11} /> },
    varies:     { label: "Varies",         bg: "#3A3520",        fg: THEME.accent,  icon: <AlertTriangle size={11} /> },
    restricted: { label: "Restricted",     bg: "#3A2E1F",        fg: THEME.orange,  icon: <AlertTriangle size={11} /> },
    prohibited: { label: "Prohibited",     bg: THEME.redDim,     fg: THEME.red,     icon: <X size={11} /> }
  };
  const c = config[status] || config.varies;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: c.bg, color: c.fg,
      padding: size === "sm" ? "3px 8px" : "5px 10px",
      fontSize: size === "sm" ? 10 : 11,
      fontFamily: "JetBrains Mono, monospace",
      letterSpacing: "0.1em", textTransform: "uppercase",
      fontWeight: 600, borderRadius: 2
    }}>
      {c.icon} {c.label}
    </span>
  );
};

/* ============================================================================
   COMPETITION ANALYSIS
   ============================================================================ */
const CompetitionTracker = () => {
  const [competitors, setCompetitors] = useState([
    {
      id: 1,
      name: "ABC Investments",
      focus: "Single Family",
      avgDealSize: 180000,
      dealCount: 23,
      markets: ["Fort Lauderdale", "Hollywood"],
      lastActivity: "2 days ago",
      strategy: "BRRRR + Wholesale",
      avgDaysToClose: 18,
      notes: "Aggressive on MLS, strong lender relationships"
    },
    {
      id: 2, 
      name: "Sunshine Properties",
      focus: "Multi-Family",
      avgDealSize: 350000,
      dealCount: 12,
      markets: ["Boca Raton", "Delray Beach"],
      lastActivity: "1 week ago",
      strategy: "Value-Add + Hold",
      avgDaysToClose: 45,
      notes: "Premium market focus, excellent renovation team"
    }
  ]);

  const [newCompetitor, setNewCompetitor] = useState({
    name: "", focus: "", avgDealSize: "", dealCount: "", markets: [], strategy: "", notes: ""
  });

  const addCompetitor = () => {
    if (!newCompetitor.name) return;
    
    setCompetitors([...competitors, {
      ...newCompetitor,
      id: Date.now(),
      lastActivity: "Just added",
      avgDaysToClose: 30
    }]);
    
    setNewCompetitor({
      name: "", focus: "", avgDealSize: "", dealCount: "", markets: [], strategy: "", notes: ""
    });
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 32px" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: THEME.text }}>
          Competition Analysis
        </h2>
        <p style={{ color: THEME.textMuted, fontSize: 14 }}>
          Track competing investors and their strategies in your market
        </p>
      </div>

      {/* Add New Competitor */}
      <Panel title="Add Competitor" icon={<Plus size={16} />} style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
          <TextField 
            label="Company Name"
            value={newCompetitor.name}
            onChange={(v) => setNewCompetitor({...newCompetitor, name: v})}
            placeholder="ABC Investments"
          />
          <TextField 
            label="Focus Area"
            value={newCompetitor.focus}
            onChange={(v) => setNewCompetitor({...newCompetitor, focus: v})}
            placeholder="Single Family, Multi-Family, etc."
          />
          <TextField 
            label="Strategy"
            value={newCompetitor.strategy}
            onChange={(v) => setNewCompetitor({...newCompetitor, strategy: v})}
            placeholder="BRRRR, Flip, Wholesale, etc."
          />
        </div>
        
        <div style={{ marginTop: 16 }}>
          <TextField 
            label="Notes"
            value={newCompetitor.notes}
            onChange={(v) => setNewCompetitor({...newCompetitor, notes: v})}
            placeholder="Their strengths, weaknesses, typical approach..."
          />
        </div>
        
        <MobileOptimizedButton 
          onClick={addCompetitor}
          style={{ marginTop: 16 }}
          variant="secondary"
        >
          <Plus size={16} /> Add Competitor
        </MobileOptimizedButton>
      </Panel>

      {/* Competitor List */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "repeat(auto-fit, minmax(400px, 1fr))", gap: 20 }}>
        {competitors.map(comp => (
          <Panel key={comp.id} title={comp.name} icon={<Users size={16} />}>
            <div style={{ display: "grid", gap: 8 }}>
              <StatRow label="Focus" value={comp.focus} />
              <StatRow label="Deal Count" value={`${comp.dealCount} deals`} />
              <StatRow label="Avg Deal Size" value={`$${comp.avgDealSize?.toLocaleString()}`} />
              <StatRow label="Strategy" value={comp.strategy} />
              <StatRow label="Avg Close Time" value={`${comp.avgDaysToClose} days`} />
              <StatRow label="Last Activity" value={comp.lastActivity} />
            </div>
            
            {comp.markets.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div className="label-xs" style={{ marginBottom: 6, color: THEME.textMuted }}>MARKETS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {comp.markets.map(market => (
                    <span key={market} style={{
                      padding: "2px 8px",
                      background: THEME.bgRaised,
                      color: THEME.accent,
                      fontSize: 11,
                      borderRadius: 12,
                      border: `1px solid ${THEME.border}`
                    }}>
                      {market}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {comp.notes && (
              <div style={{ 
                marginTop: 12, 
                padding: 12, 
                background: THEME.bgRaised,
                borderRadius: 4,
                fontSize: 13,
                lineHeight: 1.4,
                color: THEME.textMuted,
                fontStyle: "italic"
              }}>
                "{comp.notes}"
              </div>
            )}
          </Panel>
        ))}
      </div>
    </div>
  );
};

/* ============================================================================
   ENHANCED HEADER WITH NEW FEATURES
   ============================================================================ */
const Header = ({ view, setView, dealCount }) => {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={14} /> },
    { id: "portfolio", label: "Portfolio", icon: <PieChart size={14} /> },
    { id: "analyzer", label: "Deal Analyzer", icon: <Calculator size={14} /> },
    { id: "sourcing", label: "Deal Sourcing", icon: <Radar size={14} /> },
    { id: "market", label: "Market Intel", icon: <TrendingUp size={14} /> },
    { id: "competition", label: "Competition", icon: <Users size={14} /> },
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
            BRRRR // SE Florida
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
   ENHANCED DASHBOARD WITH TEMPLATES
   ============================================================================ */
const Dashboard = ({ deals, onNewDeal, onOpenDeal, onDeleteDeal, onDuplicateDeal, exportDeals, importDeals }) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  const filtered = useMemo(() => {
    return deals.filter(d => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (search && !(`${d.address} ${d.city}`.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [deals, statusFilter, search]);

  const summary = useMemo(() => {
    if (!deals.length) return null;
    const metrics = deals.map(d => ({ deal: d, m: calcMetrics(d) }));
    const totalInvested = metrics.reduce((s, x) => s + x.m.totalInvested, 0);
    const totalARV = metrics.reduce((s, x) => s + n(x.deal.arv), 0);
    const totalEquity = metrics.reduce((s, x) => s + (n(x.deal.arv) - x.m.totalInvested), 0);
    const activeCount = deals.filter(d => !["dead", "sold"].includes(d.status)).length;
    const bestDeal = metrics.reduce((best, curr) => curr.m.score > (best?.m.score ?? -1) ? curr : best, null);
    return { totalInvested, totalARV, totalEquity, activeCount, bestDeal };
  }, [deals]);

  const handleTemplateSelect = (templateKey) => {
    const template = DEAL_TEMPLATES[templateKey];
    const newDeal = {
      id: `template_${Date.now()}`,
      ...template.defaults,
      status: "analyzing",
      dateAdded: new Date().toISOString(),
      notes: template.defaults.notes
    };
    onNewDeal(newDeal);
    setShowTemplates(false);
  };

  const handleExportPDF = async (deal) => {
    const metrics = calcMetrics(deal);
    const result = await generatePDFReport(deal, metrics, 'investor');
    
    if (result.success) {
      // Show success message
      alert(`PDF report generated: ${result.filename}`);
    } else {
      alert(`Error generating PDF: ${result.error}`);
    }
  };

  if (!deals.length) {
    return (
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "80px 32px", textAlign: "center" }}>
        <div className="accent-corners" style={{
          display: "inline-block", padding: "48px 56px",
          border: `2px solid ${THEME.border}`, borderRadius: 8
        }}>
          <Building2 size={64} style={{ color: THEME.accent, marginBottom: 24 }} />
          <h2 className="serif" style={{ fontSize: 32, fontWeight: 400, marginBottom: 16, color: THEME.text }}>
            Welcome to DealTrack
          </h2>
          <p style={{ fontSize: 16, color: THEME.textMuted, marginBottom: 32, maxWidth: 400 }}>
            Professional BRRRR investment analysis for SE Florida. Track deals, analyze markets, and build your portfolio.
          </p>
          
          <div style={{ display: "flex", flexDirection: isMobile() ? "column" : "row", gap: 16, justifyContent: "center" }}>
            <MobileOptimizedButton onClick={() => setShowTemplates(true)} variant="primary">
              <Sparkles size={16} /> Start with Template
            </MobileOptimizedButton>
            
            <MobileOptimizedButton onClick={onNewDeal} variant="outline">
              <Plus size={16} /> Blank Deal
            </MobileOptimizedButton>
          </div>
        </div>

        {/* Deal Templates Modal */}
        {showTemplates && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.5)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20
          }}>
            <div style={{
              background: THEME.bg, borderRadius: 8, padding: 32,
              maxWidth: 800, width: "100%", maxHeight: "90vh", overflowY: "auto",
              border: `1px solid ${THEME.border}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 style={{ fontSize: 24, fontWeight: 600 }}>Choose Deal Template</h3>
                <button onClick={() => setShowTemplates(false)} style={{ padding: 8 }}>
                  <X size={20} />
                </button>
              </div>
              
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: isMobile() ? "1fr" : "repeat(auto-fit, minmax(250px, 1fr))", 
                gap: 16 
              }}>
                {Object.entries(DEAL_TEMPLATES).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => handleTemplateSelect(key)}
                    style={{
                      padding: 20,
                      border: `2px solid ${THEME.border}`,
                      borderRadius: 8,
                      background: THEME.bgPanel,
                      textAlign: "left",
                      transition: "all 0.2s ease",
                      minHeight: 120
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = THEME.accent;
                      e.target.style.background = THEME.bgRaised;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = THEME.border;
                      e.target.style.background = THEME.bgPanel;
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      {template.icon}
                      <span style={{ fontWeight: 600, fontSize: 16 }}>{template.name}</span>
                    </div>
                    <div style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 12, lineHeight: 1.4 }}>
                      {template.description}
                    </div>
                    <div style={{ fontSize: 12, color: THEME.accent, fontFamily: "monospace" }}>
                      ${template.defaults.purchasePrice?.toLocaleString()} → ${template.defaults.arv?.toLocaleString()} ARV
                    </div>
                  </button>
                ))}
              </div>
              
              <div style={{ marginTop: 24, textAlign: "center" }}>
                <MobileOptimizedButton onClick={onNewDeal} variant="outline">
                  <Plus size={16} /> Start Blank Deal Instead
                </MobileOptimizedButton>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 32px" }}>
      {/* Summary Cards */}
      {summary && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile() ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: 20, 
          marginBottom: 32 
        }}>
          <div style={{ background: THEME.bgPanel, padding: 20, border: `1px solid ${THEME.border}`, borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 4 }}>Total Invested</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: THEME.accent }}>
              ${summary.totalInvested.toLocaleString()}
            </div>
          </div>
          
          <div style={{ background: THEME.bgPanel, padding: 20, border: `1px solid ${THEME.border}`, borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 4 }}>Total ARV</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: THEME.secondary }}>
              ${summary.totalARV.toLocaleString()}
            </div>
          </div>
          
          <div style={{ background: THEME.bgPanel, padding: 20, border: `1px solid ${THEME.border}`, borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 4 }}>Total Equity</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: THEME.green }}>
              ${summary.totalEquity.toLocaleString()}
            </div>
          </div>
          
          <div style={{ background: THEME.bgPanel, padding: 20, border: `1px solid ${THEME.border}`, borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 4 }}>Active Deals</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: THEME.text }}>
              {summary.activeCount}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ 
        display: "flex", 
        flexDirection: isMobile() ? "column" : "row",
        justifyContent: "space-between", 
        alignItems: isMobile() ? "stretch" : "center", 
        gap: 16, 
        marginBottom: 24 
      }}>
        <div style={{ display: "flex", flexDirection: isMobile() ? "column" : "row", gap: 12, flex: 1 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: isMobile() ? "100%" : 300 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: THEME.textMuted }} />
            <input
              type="text"
              placeholder="Search deals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 10px 10px 40px",
                border: `1px solid ${THEME.border}`,
                borderRadius: 6,
                background: THEME.bgInput,
                fontSize: 14
              }}
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "10px 12px",
              border: `1px solid ${THEME.border}`,
              borderRadius: 6,
              background: THEME.bgInput,
              fontSize: 14,
              minWidth: 120
            }}
          >
            <option value="all">All Status</option>
            {DEAL_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <MobileOptimizedButton onClick={() => setShowTemplates(true)} variant="secondary">
            <Sparkles size={16} /> Templates
          </MobileOptimizedButton>
          
          <MobileOptimizedButton onClick={onNewDeal} variant="primary">
            <Plus size={16} /> New Deal
          </MobileOptimizedButton>
        </div>
      </div>

      {/* Deals Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: isMobile() ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))", 
        gap: 20 
      }}>
        {filtered.map(deal => {
          const metrics = calcMetrics(deal);
          return (
            <div
              key={deal.id}
              style={{
                background: THEME.bgPanel,
                border: `1px solid ${THEME.border}`,
                borderRadius: 8,
                padding: 20,
                transition: "all 0.2s ease",
                cursor: "pointer"
              }}
              onClick={() => onOpenDeal(deal.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = THEME.accent;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = THEME.border;
                e.currentTarget.style.transform = "translateY(0px)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                    {deal.address || "New Deal"}
                  </h3>
                  <div style={{ fontSize: 13, color: THEME.textMuted }}>
                    {deal.city || "City"} • {deal.propertyType || "Property Type"}
                  </div>
                </div>
                
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportPDF(deal);
                    }}
                    style={{
                      padding: "6px 8px",
                      background: THEME.secondary,
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      fontSize: 12
                    }}
                  >
                    <FileDown size={12} />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDeal(deal.id);
                    }}
                    style={{ padding: "6px 8px", color: THEME.red }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <DealStatusBadge status={deal.status} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
                <StatRow label="Purchase" value={`$${(deal.purchasePrice || 0).toLocaleString()}`} />
                <StatRow label="ARV" value={`$${(deal.arv || 0).toLocaleString()}`} />
                <StatRow label="Cash Flow" value={`$${(metrics.monthlyCashFlow || 0).toFixed(0)}`} 
                         valueColor={metrics.monthlyCashFlow > 0 ? THEME.green : THEME.red} />
                <StatRow label="Score" value={`${metrics.score}/100`} valueColor={THEME.accent} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Deal Templates Modal */}
      {showTemplates && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20
        }}>
          <div style={{
            background: THEME.bg, borderRadius: 8, padding: 32,
            maxWidth: 800, width: "100%", maxHeight: "90vh", overflowY: "auto",
            border: `1px solid ${THEME.border}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontSize: 24, fontWeight: 600 }}>Choose Deal Template</h3>
              <button onClick={() => setShowTemplates(false)} style={{ padding: 8 }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: isMobile() ? "1fr" : "repeat(auto-fit, minmax(250px, 1fr))", 
              gap: 16 
            }}>
              {Object.entries(DEAL_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => handleTemplateSelect(key)}
                  style={{
                    padding: 20,
                    border: `2px solid ${THEME.border}`,
                    borderRadius: 8,
                    background: THEME.bgPanel,
                    textAlign: "left",
                    transition: "all 0.2s ease",
                    minHeight: 120
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = THEME.accent;
                    e.target.style.background = THEME.bgRaised;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = THEME.border;
                    e.target.style.background = THEME.bgPanel;
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    {template.icon}
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{template.name}</span>
                  </div>
                  <div style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 12, lineHeight: 1.4 }}>
                    {template.description}
                  </div>
                  <div style={{ fontSize: 12, color: THEME.accent, fontFamily: "monospace" }}>
                    ${template.defaults.purchasePrice?.toLocaleString()} → ${template.defaults.arv?.toLocaleString()} ARV
                  </div>
                </button>
              ))}
            </div>
            
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <MobileOptimizedButton onClick={onNewDeal} variant="outline">
                <Plus size={16} /> Start Blank Deal Instead
              </MobileOptimizedButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
          background: THEME.bgPanel, border: `1px solid ${THEME.border}`,
          maxWidth: 560,
        }}>
          <Sparkles size={36} color={THEME.accent} style={{ marginBottom: 20 }} />
          <div className="serif" style={{ fontSize: 34, marginBottom: 12, fontWeight: 400 }}>
            Welcome to DealTrack
          </div>
          <div style={{ color: THEME.textMuted, marginBottom: 28, lineHeight: 1.6, fontSize: 14 }}>
            Start tracking your BRRRR deals. The tool runs the 70% rule, refi math, exit strategy comparison, and flags city-level STR regulations across Miami-Dade, Broward, and Palm Beach counties.
          </div>
          <button onClick={onNewDeal} className="btn-primary">
            <Plus size={15} /> Add First Deal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 32px" }} className="fade-in">
      {/* Portfolio summary */}
      {summary && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: 1, marginBottom: 24,
          background: THEME.border,
          border: `1px solid ${THEME.border}`
        }}>
          <SummaryTile label="Active Deals" value={summary.activeCount} isCount />
          <SummaryTile label="Total Invested" value={fmtUSD(summary.totalInvested, { short: true })} />
          <SummaryTile label="Projected ARV" value={fmtUSD(summary.totalARV, { short: true })} />
          <SummaryTile
            label="Forced Equity"
            value={fmtUSD(summary.totalEquity, { short: true })}
            valueColor={summary.totalEquity > 0 ? THEME.green : THEME.red}
          />
        </div>
      )}

      {/* Controls */}
      <div style={{
        display: "flex", gap: 12, marginBottom: 20,
        alignItems: "center", flexWrap: "wrap"
      }}>
        <div style={{ position: "relative", flex: "1 1 280px" }}>
          <Search size={14} style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: THEME.textDim
          }} />
          <input
            type="text"
            placeholder="Search address or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 12px 10px 34px", fontSize: 13 }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "10px 12px", fontSize: 13 }}
        >
          <option value="all">All statuses</option>
          {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={exportDeals} className="btn-secondary">
            <Save size={15} /> Export Deals
          </button>
          <label className="btn-secondary" style={{ cursor: "pointer" }}>
            <Upload size={15} /> Import Deals
            <input
              type="file"
              accept=".json"
              onChange={importDeals}
              style={{ display: "none" }}
            />
          </label>
          <button onClick={onNewDeal} className="btn-primary">
            <Plus size={15} /> New Deal
          </button>
        </div>
      </div>

      {/* Deal cards grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
        gap: 16
      }}>
        {filtered.map(deal => (
          <DealCard
            key={deal.id}
            deal={deal}
            onOpen={() => onOpenDeal(deal.id)}
            onDelete={() => onDeleteDeal(deal.id)}
            onDuplicate={() => onDuplicateDeal(deal.id)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{
          padding: "60px 20px", textAlign: "center",
          color: THEME.textMuted, fontSize: 13
        }}>
          No deals match your filters.
        </div>
      )}
    </div>
  );
};

const SummaryTile = ({ label, value, valueColor, isCount }) => (
  <div style={{ background: THEME.bgPanel, padding: "18px 22px" }}>
    <div className="label-xs" style={{ marginBottom: 8 }}>{label}</div>
    <div
      className={isCount ? "serif" : "mono"}
      style={{
        fontSize: isCount ? 32 : 24,
        fontWeight: isCount ? 500 : 600,
        color: valueColor || THEME.text,
        letterSpacing: isCount ? "-0.03em" : "-0.02em",
        lineHeight: 1
      }}
    >
      {value}
    </div>
  </div>
);

const DealCard = ({ deal, onOpen, onDelete, onDuplicate }) => {
  const m = calcMetrics(deal);
  const status = STATUSES.find(s => s.id === deal.status) || STATUSES[0];
  const city = CITIES.find(c => c.name === deal.city);
  const bestCF = Math.max(m.ltrCashFlow, m.strCashFlow);
  const cfColor = bestCF > 0 ? THEME.green : THEME.red;

  return (
    <div
      onClick={onOpen}
      style={{
        background: THEME.bgPanel,
        border: `1px solid ${THEME.border}`,
        padding: 0,
        cursor: "pointer",
        transition: "all 0.2s ease",
        position: "relative",
        overflow: "hidden"
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = THEME.accentDim; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = THEME.border; }}
    >
      {/* Grade stripe */}
      <div style={{ height: 3, background: m.gradeColor }} />

      <div style={{ padding: 18 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="serif" style={{
              fontSize: 17, fontWeight: 500, letterSpacing: "-0.02em",
              marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
            }}>
              {deal.address || "Untitled deal"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: THEME.textMuted }}>
              <MapPin size={11} />
              <span>{deal.city}, FL</span>
              <span style={{ color: THEME.textDim }}>·</span>
              <span className="mono">{deal.beds}b/{deal.baths}ba · {deal.sqft?.toLocaleString()} sqft</span>
            </div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 42, height: 42,
            border: `1.5px solid ${m.gradeColor}`,
            color: m.gradeColor,
            fontFamily: "Fraunces, serif",
            fontSize: 20, fontWeight: 600,
            flexShrink: 0
          }}>
            {m.grade}
          </div>
        </div>

        {/* Financials row */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12,
          padding: "14px 0",
          borderTop: `1px solid ${THEME.border}`,
          borderBottom: `1px solid ${THEME.border}`
        }}>
          <MiniStat label="Purchase" value={fmtUSD(deal.purchasePrice, { short: true })} />
          <MiniStat label="ARV" value={fmtUSD(deal.arv, { short: true })} valueColor={THEME.accent} />
          <MiniStat label={deal.strategy === "STR" ? "STR CF/mo" : "LTR CF/mo"}
                    value={fmtUSD(deal.strategy === "STR" ? m.strCashFlow : m.ltrCashFlow)}
                    valueColor={cfColor} />
        </div>

        {/* MAO check + cash left */}
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: THEME.textMuted }}>70% MAO</span>
            <span className="mono" style={{ color: m.overUnderMAO >= 0 ? THEME.green : THEME.red }}>
              {fmtUSD(m.mao)} {m.overUnderMAO >= 0 ? "✓" : `(over by ${fmtUSD(Math.abs(m.overUnderMAO), { short: true })})`}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: THEME.textMuted }}>Cash left in</span>
            <span className="mono" style={{ color: m.cashLeftIn <= 0 ? THEME.green : m.cashLeftIn < 25000 ? THEME.accent : THEME.red }}>
              {fmtUSD(m.cashLeftIn)}
            </span>
          </div>
        </div>

        {/* Status + STR badge + actions */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: 14, paddingTop: 14,
          borderTop: `1px solid ${THEME.border}`, gap: 8, flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 11, color: status.color,
              fontFamily: "JetBrains Mono, monospace",
              letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: status.color }} />
              {status.label}
            </span>
            {deal.strategy === "STR" && city && <StrStatusBadge status={city.strStatus} />}
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
              className="btn-ghost"
              title="Duplicate"
              style={{ padding: "5px 7px" }}
            >
              <Copy size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${deal.address || 'this deal'}"?`)) onDelete(); }}
              className="btn-ghost btn-danger"
              title="Delete"
              style={{ padding: "5px 7px" }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MiniStat = ({ label, value, valueColor }) => (
  <div>
    <div className="label-xs" style={{ fontSize: 9, marginBottom: 4 }}>{label}</div>
    <div className="mono" style={{ fontSize: 14, color: valueColor || THEME.text, fontWeight: 600 }}>{value}</div>
  </div>
);

/* ============================================================================
   DEAL ANALYZER
   ============================================================================ */
const Analyzer = ({ deal, onUpdate, onSave, onBack, onDelete, isDirty }) => {
  const m = useMemo(() => calcMetrics(deal), [deal]);
  const city = CITIES.find(c => c.name === deal.city);
  const [section, setSection] = useState("property");

  const update = (patch) => onUpdate({ ...deal, ...patch, updatedAt: new Date().toISOString() });

  // Auto-update county when city changes
  useEffect(() => {
    const c = CITIES.find(x => x.name === deal.city);
    if (c && c.county !== deal.county) update({ county: c.county });
    // eslint-disable-next-line
  }, [deal.city]);

  const sections = [
    { id: "property", label: "Property" },
    { id: "acquisition", label: "Acquisition" },
    { id: "rehab", label: "Rehab" },
    { id: "refi", label: "Refinance" },
    { id: "rental", label: "Rental Income" },
    { id: "expenses", label: "Operating Exp" }
  ];

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 32px" }} className="fade-in">
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 24, flexWrap: "wrap", gap: 12
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={onBack} className="btn-ghost">
            ← Back to Dashboard
          </button>
          <div style={{ width: 1, height: 20, background: THEME.border }} />
          <div>
            <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
              {deal.address || "New Deal"}
            </div>
            <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 2 }}>
              {deal.city}, {deal.county} County · Updated {fmtDate(deal.updatedAt)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {isDirty && (
            <span className="label-xs pulse" style={{ color: THEME.orange }}>
              Unsaved changes
            </span>
          )}
          <button onClick={onDelete} className="btn-ghost btn-danger">
            <Trash2 size={13} /> Delete
          </button>
          <button onClick={onSave} className="btn-primary">
            <Save size={14} /> Save Deal
          </button>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 1fr)", gap: 20 }}>
        {/* LEFT: Inputs */}
        <div>
          {/* Section tabs */}
          <div style={{
            display: "flex", gap: 1, marginBottom: 0,
            background: THEME.border, padding: 1,
            overflowX: "auto", whiteSpace: "nowrap"
          }} className="scroll-thin">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                style={{
                  padding: "8px 14px",
                  fontSize: 11.5,
                  fontFamily: "JetBrains Mono, monospace",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  background: section === s.id ? THEME.bgPanel : THEME.bgInput,
                  color: section === s.id ? THEME.accent : THEME.textMuted,
                  borderRadius: 0, flexShrink: 0
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div style={{
            background: THEME.bgPanel,
            border: `1px solid ${THEME.border}`,
            borderTop: "none",
            padding: 20
          }}>
            {section === "property" && (
              <div>
                <TextField label="Property Address"
                  value={deal.address} onChange={(v) => update({ address: v })}
                  placeholder="1234 Ocean Dr" />
                <SelectField
                  label="City"
                  value={deal.city}
                  onChange={(v) => update({ city: v })}
                  options={CITIES.map(c => ({ value: c.name, label: `${c.name} — ${c.county}` }))}
                />
                <SelectField
                  label="Status"
                  value={deal.status}
                  onChange={(v) => update({ status: v })}
                  options={STATUSES.map(s => ({ value: s.id, label: s.label }))}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <NumField label="Beds" value={deal.beds} onChange={(v) => update({ beds: v })} small />
                  <NumField label="Baths" value={deal.baths} onChange={(v) => update({ baths: v })} small step={0.5} />
                  <NumField label="Sqft" value={deal.sqft} onChange={(v) => update({ sqft: v })} small />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <NumField label="Year Built" value={deal.yearBuilt} onChange={(v) => update({ yearBuilt: v })} small />
                  <NumField label="Lot Size (sqft)" value={deal.lotSize} onChange={(v) => update({ lotSize: v })} small />
                </div>
                <div style={{ marginTop: 10 }}>
                  <div className="label-xs" style={{ marginBottom: 6 }}>Notes</div>
                  <textarea
                    value={deal.notes}
                    onChange={(e) => update({ notes: e.target.value })}
                    rows={3}
                    placeholder="Comps, rehab scope, seller situation, exit plan..."
                    style={{ width: "100%", padding: 10, fontSize: 13, resize: "vertical", fontFamily: "inherit" }}
                  />
                </div>
              </div>
            )}

            {section === "acquisition" && (
              <div>
                <SelectField
                  label="Acquisition Method"
                  value={deal.acqMethod}
                  onChange={(v) => update({ acqMethod: v })}
                  options={ACQ_METHODS.map(m => ({ value: m.id, label: m.label }))}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <NumField label="Purchase Price" value={deal.purchasePrice} onChange={(v) => update({ purchasePrice: v })} prefix="$" />
                  <NumField label="Closing Costs" value={deal.closingCosts} onChange={(v) => update({ closingCosts: v })} prefix="$"
                    helper="Title, inspections, doc stamps" />
                </div>
                {deal.acqMethod !== "cash" && (
                  <>
                    <div style={{
                      marginTop: 4, marginBottom: 14, padding: "10px 12px",
                      background: THEME.bgInput, borderLeft: `2px solid ${THEME.accent}`, fontSize: 12, color: THEME.textMuted
                    }}>
                      Carry costs below cover loan interest + holding during rehab months.
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <NumField label="Loan LTV" value={deal.acqLoanLTV} onChange={(v) => update({ acqLoanLTV: v })} suffix="%" />
                      <NumField label="Rate" value={deal.acqLoanRate} onChange={(v) => update({ acqLoanRate: v })} suffix="%" step={0.25} />
                    </div>
                    <NumField label="Points" value={deal.acqLoanPoints} onChange={(v) => update({ acqLoanPoints: v })} suffix="pts" step={0.5} />
                  </>
                )}
              </div>
            )}

            {section === "rehab" && (
              <div>
                <NumField label="Rehab Budget" value={deal.rehabBudget} onChange={(v) => update({ rehabBudget: v })} prefix="$"
                  helper="Include 10–15% contingency" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <NumField label="Timeline" value={deal.rehabMonths} onChange={(v) => update({ rehabMonths: v })} suffix="mo" step={0.5} />
                  <NumField label="Holding Cost/mo" value={deal.acqHoldingCostPerMonth} onChange={(v) => update({ acqHoldingCostPerMonth: v })} prefix="$"
                    helper="Insurance, taxes, loan interest" />
                </div>
                <NumField label="ARV (After Repair Value)" value={deal.arv} onChange={(v) => update({ arv: v })} prefix="$"
                  helper="Based on comparable sales after renovation" />
                <div style={{
                  marginTop: 12, padding: 12,
                  background: THEME.bgInput, borderLeft: `2px solid ${THEME.accent}`
                }}>
                  <div className="label-xs-accent" style={{ marginBottom: 6 }}>The 70% Rule Check</div>
                  <div className="mono" style={{ fontSize: 13, marginBottom: 4 }}>
                    MAO = (ARV × 0.70) − Rehab = <span style={{ color: THEME.accent, fontWeight: 600 }}>{fmtUSD(m.mao)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: THEME.textMuted }}>
                    {m.overUnderMAO >= 0
                      ? `Your offer is ${fmtUSD(m.overUnderMAO)} UNDER MAO. ✓`
                      : `Your offer is ${fmtUSD(Math.abs(m.overUnderMAO))} OVER MAO. Negotiate down or walk.`}
                  </div>
                </div>
              </div>
            )}

            {section === "refi" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <NumField label="Refi LTV" value={deal.refiLTV} onChange={(v) => update({ refiLTV: v })} suffix="%"
                    helper="Most DSCR/investor loans: 70–80%" />
                  <NumField label="Interest Rate" value={deal.refiRate} onChange={(v) => update({ refiRate: v })} suffix="%" step={0.125} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <NumField label="Term" value={deal.refiTerm} onChange={(v) => update({ refiTerm: v })} suffix="yr" />
                  <NumField label="Closing Costs" value={deal.refiClosingCosts} onChange={(v) => update({ refiClosingCosts: v })} prefix="$" />
                </div>
                <div style={{
                  marginTop: 4, padding: 12,
                  background: THEME.bgInput, borderLeft: `2px solid ${THEME.accent}`
                }}>
                  <div className="label-xs-accent" style={{ marginBottom: 8 }}>Refi Outcome</div>
                  <StatRow label="Loan Amount" value={fmtUSD(m.refiAmount)} />
                  <StatRow label="Monthly P&I" value={fmtUSD(m.refiMonthlyPI)} borderTop />
                  <StatRow label="Cash Left in Deal"
                    value={fmtUSD(m.cashLeftIn)}
                    valueColor={m.cashLeftIn <= 0 ? THEME.green : m.cashLeftIn < 25000 ? THEME.accent : THEME.red}
                    borderTop bold />
                  {m.cashLeftIn <= 0 && (
                    <div style={{ fontSize: 11, color: THEME.green, marginTop: 8 }}>
                      ✓ You pulled all cash out. Infinite cash-on-cash return.
                    </div>
                  )}
                </div>
              </div>
            )}

            {section === "rental" && (
              <div>
                <div style={{ display: "flex", gap: 1, background: THEME.border, marginBottom: 16 }}>
                  {["STR", "LTR"].map(s => (
                    <button
                      key={s}
                      onClick={() => update({ strategy: s })}
                      style={{
                        flex: 1, padding: "10px 14px",
                        fontSize: 12, fontWeight: 600,
                        fontFamily: "JetBrains Mono, monospace",
                        letterSpacing: "0.1em",
                        background: deal.strategy === s ? THEME.bgPanel : THEME.bgInput,
                        color: deal.strategy === s ? THEME.accent : THEME.textMuted,
                        borderRadius: 0
                      }}
                    >
                      {s === "STR" ? "SHORT-TERM (AIRBNB)" : "LONG-TERM RENTAL"}
                    </button>
                  ))}
                </div>

                {deal.strategy === "STR" ? (
                  <div>
                    {city && (
                      <div style={{
                        padding: 12, marginBottom: 16,
                        background: THEME.bgInput,
                        borderLeft: `2px solid ${
                          city.strStatus === "allowed" ? THEME.green :
                          city.strStatus === "varies" ? THEME.accent :
                          THEME.red}`
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div className="label-xs">{city.name} STR Status</div>
                          <StrStatusBadge status={city.strStatus} />
                        </div>
                        <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 6 }}>{city.strNote}</div>
                        <div className="mono" style={{ fontSize: 11, color: THEME.textDim }}>
                          Area ADR benchmark: ${city.adrLow}–${city.adrHigh} · Avg occupancy: {city.occupancy}%
                        </div>
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <NumField label="Avg Daily Rate (ADR)" value={deal.strADR} onChange={(v) => update({ strADR: v })} prefix="$" />
                      <NumField label="Occupancy" value={deal.strOccupancy} onChange={(v) => update({ strOccupancy: v })} suffix="%" />
                    </div>
                    <NumField label="Mgmt Fee" value={deal.strPropMgmtPct} onChange={(v) => update({ strPropMgmtPct: v })} suffix="%"
                      helper="Typical: 18–25% of gross for full-service STR" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      <NumField label="Utilities" value={deal.strUtilitiesMonthly} onChange={(v) => update({ strUtilitiesMonthly: v })} prefix="$" small />
                      <NumField label="Internet" value={deal.strInternetMonthly} onChange={(v) => update({ strInternetMonthly: v })} prefix="$" small />
                      <NumField label="Supplies" value={deal.strSuppliesMonthly} onChange={(v) => update({ strSuppliesMonthly: v })} prefix="$" small />
                    </div>
                  </div>
                ) : (
                  <div>
                    <NumField label="Monthly Rent" value={deal.monthlyRent} onChange={(v) => update({ monthlyRent: v })} prefix="$" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <NumField label="Vacancy" value={deal.vacancyPct} onChange={(v) => update({ vacancyPct: v })} suffix="%" />
                      <NumField label="Mgmt Fee" value={deal.propMgmtPct} onChange={(v) => update({ propMgmtPct: v })} suffix="%" />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <NumField label="Maintenance" value={deal.maintenancePct} onChange={(v) => update({ maintenancePct: v })} suffix="%" />
                      <NumField label="CapEx Reserve" value={deal.capexPct} onChange={(v) => update({ capexPct: v })} suffix="%" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {section === "expenses" && (
              <div>
                <NumField label="Annual Property Taxes" value={deal.annualTaxes} onChange={(v) => update({ annualTaxes: v })} prefix="$"
                  helper="FL reassesses at sale — use expected post-sale amount" />
                <NumField label="Annual Insurance" value={deal.annualInsurance} onChange={(v) => update({ annualInsurance: v })} prefix="$"
                  helper="FL coastal = high. Get quotes; STR pays ~25% premium" />
                <NumField label="HOA / Condo Fee (monthly)" value={deal.hoaMonthly} onChange={(v) => update({ hoaMonthly: v })} prefix="$" />

                <div style={{
                  marginTop: 8, padding: 12,
                  background: THEME.bgInput, borderLeft: `2px solid ${THEME.orange}`
                }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <AlertTriangle size={14} color={THEME.orange} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ fontSize: 11.5, color: THEME.textMuted, lineHeight: 1.5 }}>
                      <strong style={{ color: THEME.text }}>Florida reality check:</strong> Post-Ian, insurance is volatile.
                      Older roofs (20+ yrs), non-hurricane-rated windows, and properties below flood elevation can push premiums 3–5x the listed amount. Always get a 4-point + wind mit before closing.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Live calculations */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Grade card */}
          <div className="accent-corners" style={{
            background: THEME.bgPanel,
            border: `1px solid ${THEME.border}`,
            padding: 20,
            display: "flex", alignItems: "center", gap: 18
          }}>
            <div style={{
              width: 72, height: 72,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `2px solid ${m.gradeColor}`,
              color: m.gradeColor,
              fontFamily: "Fraunces, serif",
              fontSize: 38, fontWeight: 500,
              flexShrink: 0
            }}>
              {m.grade}
            </div>
            <div style={{ flex: 1 }}>
              <div className="label-xs">Deal Score</div>
              <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.025em", marginTop: 2, marginBottom: 2 }}>
                {m.score}/100
              </div>
              <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.5 }}>
                {m.grade === "A+" || m.grade === "A" ? "Strong BRRRR fundamentals. Prioritize this deal." :
                 m.grade === "B" ? "Workable. Push on price or rehab to tighten." :
                 m.grade === "C" ? "Marginal. Needs a lever (price cut, higher ARV, better exit)." :
                 "Pass or renegotiate hard. Numbers don't work as structured."}
              </div>
            </div>
          </div>

          {/* Exit strategy comparison */}
          <Panel title="Exit Strategy Comparison" icon={<DoorOpen size={14} color={THEME.accent} />} accent>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: THEME.border }}>
              {/* FLIP */}
              <ExitColumn
                label="FLIP"
                icon={<Flame size={12} />}
                primary={fmtUSD(m.flipProfit)}
                primaryLabel="Net Profit"
                primaryColor={m.flipProfit > 15000 ? THEME.green : m.flipProfit > 0 ? THEME.accent : THEME.red}
                sub={`${fmtPct(m.flipROI)} ROI`}
                details={[
                  { label: "Sell at ARV", value: fmtUSD(deal.arv, { short: true }) },
                  { label: "Selling costs (8%)", value: `-${fmtUSD(m.flipSellCosts, { short: true })}` },
                  { label: "Total cost in", value: `-${fmtUSD(m.flipCashInvested, { short: true })}` }
                ]}
                isActive={false}
              />
              {/* BRRRR-LTR */}
              <ExitColumn
                label="BRRRR · LTR"
                icon={<Home size={12} />}
                primary={fmtUSD(m.ltrCashFlow)}
                primaryLabel="Cash Flow/mo"
                primaryColor={m.ltrCashFlow > 200 ? THEME.green : m.ltrCashFlow > 0 ? THEME.accent : THEME.red}
                sub={isFinite(m.ltrCoC) ? `${fmtPct(m.ltrCoC)} CoC` : "∞ CoC"}
                details={[
                  { label: "Annual CF", value: fmtUSD(m.ltrAnnualCF, { short: true }) },
                  { label: "Cash left in", value: fmtUSD(m.cashLeftIn, { short: true }),
                    valueColor: m.cashLeftIn <= 0 ? THEME.green : THEME.text },
                  { label: "Equity capture", value: fmtUSD(n(deal.arv) - m.totalInvested, { short: true }) }
                ]}
                isActive={deal.strategy === "LTR"}
              />
              {/* BRRRR-STR */}
              <ExitColumn
                label="BRRRR · STR"
                icon={<Key size={12} />}
                primary={fmtUSD(m.strCashFlow)}
                primaryLabel="Cash Flow/mo"
                primaryColor={m.strCashFlow > 200 ? THEME.green : m.strCashFlow > 0 ? THEME.accent : THEME.red}
                sub={isFinite(m.strCoC) ? `${fmtPct(m.strCoC)} CoC` : "∞ CoC"}
                details={[
                  { label: "Gross/mo", value: fmtUSD(m.strGrossRev, { short: true }) },
                  { label: "Annual CF", value: fmtUSD(m.strAnnualCF, { short: true }) },
                  { label: "Cash left in", value: fmtUSD(m.cashLeftIn, { short: true }),
                    valueColor: m.cashLeftIn <= 0 ? THEME.green : THEME.text }
                ]}
                isActive={deal.strategy === "STR"}
              />
            </div>

            <div style={{
              marginTop: 14, padding: 10,
              background: THEME.bgInput, fontSize: 11.5, color: THEME.textMuted, lineHeight: 1.5
            }}>
              <strong style={{ color: THEME.text }}>Recommended: </strong>
              {(() => {
                const flipWin = m.flipProfit > (m.strAnnualCF > m.ltrAnnualCF ? m.strAnnualCF : m.ltrAnnualCF) * 3;
                const strBest = m.strCashFlow > m.ltrCashFlow && city && ["allowed", "varies"].includes(city.strStatus);
                if (flipWin && m.flipROI > 15) return `Flip for quick ${fmtUSD(m.flipProfit, { short: true })} profit if you can exit cleanly.`;
                if (strBest) return `STR — ${fmtUSD(m.strCashFlow - m.ltrCashFlow)}/mo extra over LTR in an ${city.strStatus === "allowed" ? "STR-allowed" : "STR-varies"} market.`;
                if (city && ["restricted", "prohibited"].includes(city.strStatus)) return `City is ${city.strStatus} for STR. Go LTR unless you've verified the specific zone/HOA allows STR.`;
                if (m.ltrCashFlow > m.strCashFlow) return "LTR — produces better risk-adjusted cash flow given your inputs.";
                return "Run tighter numbers. No exit stands out clearly.";
              })()}
            </div>
          </Panel>

          {/* Cost breakdown */}
          <Panel title="Cost Breakdown" icon={<Calculator size={14} color={THEME.accent} />}>
            <StatRow label="Purchase Price" value={fmtUSD(deal.purchasePrice)} />
            <StatRow label="Closing Costs" value={fmtUSD(deal.closingCosts)} borderTop />
            <StatRow label="Rehab Budget" value={fmtUSD(deal.rehabBudget)} borderTop />
            <StatRow label="Holding Costs" value={fmtUSD(m.holdingTotal)} borderTop
              sublabel={`${deal.rehabMonths} mo × ${fmtUSD(deal.acqHoldingCostPerMonth)}/mo`} />
            <StatRow label="Refi Closing Costs" value={fmtUSD(deal.refiClosingCosts)} borderTop />
            <StatRow label="Total All-In" value={fmtUSD(m.totalInvested)} borderTop bold valueColor={THEME.accent} />
            <StatRow label="All-in / ARV" value={fmtPct(m.allInPct)} borderTop
              valueColor={m.allInPct < 75 ? THEME.green : m.allInPct < 85 ? THEME.accent : THEME.red}
              sublabel="Target: under 75%" />
          </Panel>
        </div>
      </div>
    </div>
  );
};

const ExitColumn = ({ label, icon, primary, primaryLabel, primaryColor, sub, details, isActive }) => (
  <div style={{
    background: THEME.bgPanel,
    padding: "14px 14px 12px",
    position: "relative"
  }}>
    {isActive && (
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 2, background: THEME.accent
      }} />
    )}
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
      <span style={{ color: isActive ? THEME.accent : THEME.textMuted, display: "inline-flex" }}>{icon}</span>
      <span className="label-xs" style={{ color: isActive ? THEME.accent : THEME.textMuted, fontSize: 9 }}>
        {label}
      </span>
    </div>
    <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: primaryColor, letterSpacing: "-0.01em" }}>
      {primary}
    </div>
    <div style={{ fontSize: 10, color: THEME.textDim, marginBottom: 10 }}>{primaryLabel} · {sub}</div>
    <div style={{ borderTop: `1px solid ${THEME.border}`, paddingTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
      {details.map((d, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
          <span style={{ color: THEME.textMuted }}>{d.label}</span>
          <span className="mono" style={{ color: d.valueColor || THEME.text, fontWeight: 500 }}>{d.value}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ============================================================================
   DEAL SOURCING
   ============================================================================ */
const DealSourcing = ({ onAddProperty }) => {
  const [searchParams, setSearchParams] = useState({
    city: "Fort Lauderdale",
    priceMin: 100000,
    priceMax: 500000,
    beds: "",
    baths: "",
    propertyType: "house",
    listingStatus: "for_sale",
    keywords: "fixer,tlc,handyman,cash,motivated"
  });
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState("");

  const DISTRESSED_KEYWORDS = [
    "fixer", "tlc", "handyman", "cash only", "motivated seller", "as is",
    "investor special", "needs work", "diamond in the rough", "sweat equity",
    "foreclosure", "short sale", "auction", "estate sale", "probate",
    "priced to sell", "reduced", "price drop", "bring offers"
  ];

  const searchProperties = async () => {
    if (!apiKey.trim()) {
      setError("Please enter your RapidAPI key first. Get one free at rapidapi.com");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      // Using RapidAPI Realtor API
      const city = CITIES.find(c => c.name === searchParams.city);
      const zipCode = getZipCodeForCity(searchParams.city);
      
      const payload = {
        query: {
          status: [searchParams.listingStatus],
          postal_code: zipCode,
          price: {
            min: searchParams.priceMin,
            max: searchParams.priceMax
          }
        },
        limit: 50,
        offset: 0,
        sort: { direction: "desc", field: "list_date" }
      };

      if (searchParams.beds) payload.query.beds_min = parseInt(searchParams.beds);
      if (searchParams.baths) payload.query.baths_min = parseInt(searchParams.baths);

      const response = await fetch("https://realtor-data1.p.rapidapi.com/property_list/", {
        method: "POST",
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "realtor-data1.p.rapidapi.com",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const properties = data.data || [];
      
      // Score properties for distressed indicators
      const scoredProperties = properties.map(p => ({
        ...p,
        distressedScore: calculateDistressedScore(p)
      })).sort((a, b) => b.distressedScore - a.distressedScore);

      setResults(scoredProperties);
    } catch (err) {
      setError(err.message || "Failed to fetch properties. Check your API key and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get ZIP code for city (simplified)
  const getZipCodeForCity = (cityName) => {
    const zipMap = {
      "Fort Lauderdale": "33301",
      "Hollywood": "33019",
      "Pompano Beach": "33060",
      "Miami": "33101",
      "Miami Beach": "33139",
      "West Palm Beach": "33401",
      "Boca Raton": "33431",
      // Add more as needed
    };
    return zipMap[cityName] || "33301";
  };

  const calculateDistressedScore = (property) => {
    let score = 0;
    const description = (property.description || "").toLowerCase();
    const remarks = (property.remarks || "").toLowerCase();
    const text = `${description} ${remarks}`;
    
    // Check for distressed keywords
    DISTRESSED_KEYWORDS.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        score += keyword === "foreclosure" || keyword === "short sale" ? 25 : 
                keyword === "cash only" || keyword === "auction" ? 20 : 
                keyword === "fixer" || keyword === "tlc" ? 15 : 10;
      }
    });

    // Price indicators
    const daysOnMarket = property.days_on_market || 0;
    if (daysOnMarket > 90) score += 15;
    else if (daysOnMarket > 60) score += 10;
    else if (daysOnMarket > 30) score += 5;

    // Multiple price reductions
    if (property.price_history && property.price_history.length > 1) {
      const reductions = property.price_history.filter(h => h.event_type === "price_change").length;
      score += Math.min(reductions * 10, 30);
    }

    // Below market indicators
    const pricePerSqft = property.list_price / (property.sqft || 1);
    const city = CITIES.find(c => c.name === searchParams.city);
    if (city && pricePerSqft < 150) score += 20; // Adjust threshold by market

    return Math.min(score, 100);
  };

  const addToDeals = (property) => {
    const newDeal = {
      ...makeNewDeal(),
      address: property.address?.line || "Unknown Address",
      city: searchParams.city,
      beds: property.beds || 3,
      baths: property.baths || 2,
      sqft: property.sqft || 1400,
      yearBuilt: property.year_built || 1980,
      purchasePrice: property.list_price || 250000,
      notes: `Found via Deal Sourcing. Distressed score: ${property.distressedScore}/100\n\nListing: ${property.rdc_web_url || ""}\n\nDescription: ${(property.description || "").slice(0, 200)}...`
    };
    onAddProperty(newDeal);
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 32px" }} className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <div className="serif" style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.03em", marginBottom: 6 }}>
          Deal Sourcing Engine
        </div>
        <div style={{ fontSize: 13, color: THEME.textMuted, maxWidth: 860, lineHeight: 1.6 }}>
          Find distressed properties across SE Florida with AI-powered distressed scoring. Filters for fixer-uppers, motivated sellers, price cuts, and BRRRR opportunities.
          Requires a free RapidAPI key (100 requests/month free).
        </div>
      </div>

      {/* API Key Setup */}
      <Panel title="API Configuration" icon={<Key size={14} color={THEME.accent} />} accent style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "end" }}>
          <div style={{ flex: 1 }}>
            <TextField 
              label="RapidAPI Key" 
              value={apiKey} 
              onChange={setApiKey}
              placeholder="Get free key at rapidapi.com → Realtor Data API"
            />
          </div>
          <button 
            onClick={() => window.open("https://rapidapi.com/s.mahmoud97/api/realtor16", "_blank")}
            className="btn-ghost"
            style={{ padding: "9px 12px", marginBottom: 14 }}
          >
            <ExternalLink size={13} /> Get API Key
          </button>
        </div>
        <div style={{ fontSize: 11, color: THEME.textDim, lineHeight: 1.5 }}>
          The Realtor Data API provides access to MLS listings. Free tier includes 100 requests/month. 
          Your key stays local in your browser and isn't stored anywhere.
        </div>
      </Panel>

      {/* Search Filters */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 20 }}>
        <Panel title="Location & Price" icon={<MapPin size={14} color={THEME.accent} />}>
          <SelectField
            label="City"
            value={searchParams.city}
            onChange={(v) => setSearchParams(p => ({ ...p, city: v }))}
            options={CITIES.filter(c => c.brrrrScore >= 3).map(c => c.name)}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <NumField label="Price Min" value={searchParams.priceMin} onChange={(v) => setSearchParams(p => ({ ...p, priceMin: v }))} prefix="$" small />
            <NumField label="Price Max" value={searchParams.priceMax} onChange={(v) => setSearchParams(p => ({ ...p, priceMax: v }))} prefix="$" small />
          </div>
        </Panel>

        <Panel title="Property Details" icon={<Home size={14} color={THEME.accent} />}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <NumField label="Min Beds" value={searchParams.beds} onChange={(v) => setSearchParams(p => ({ ...p, beds: v }))} small />
            <NumField label="Min Baths" value={searchParams.baths} onChange={(v) => setSearchParams(p => ({ ...p, baths: v }))} small step={0.5} />
          </div>
          <SelectField
            label="Listing Status"
            value={searchParams.listingStatus}
            onChange={(v) => setSearchParams(p => ({ ...p, listingStatus: v }))}
            options={[
              { value: "for_sale", label: "For Sale" },
              { value: "sold", label: "Recently Sold (comps)" },
              { value: "off_market", label: "Off Market" }
            ]}
          />
        </Panel>

        <Panel title="Distressed Indicators" icon={<Target size={14} color={THEME.accent} />}>
          <div style={{ marginBottom: 12 }}>
            <div className="label-xs" style={{ marginBottom: 6 }}>Auto-searches for</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {DISTRESSED_KEYWORDS.slice(0, 8).map(k => (
                <span key={k} style={{
                  fontSize: 10, padding: "2px 6px", background: THEME.bgInput,
                  color: THEME.textMuted, borderRadius: 2, fontFamily: "monospace"
                }}>{k}</span>
              ))}
              <span style={{ fontSize: 10, color: THEME.textDim }}>+{DISTRESSED_KEYWORDS.length - 8} more</span>
            </div>
          </div>
          <button onClick={searchProperties} disabled={loading} className="btn-primary" style={{ width: "100%" }}>
            {loading ? <><RefreshCw size={13} className="pulse" /> Searching...</> : <><Search size={13} /> Find Distressed Properties</>}
          </button>
        </Panel>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: "14px 16px", marginBottom: 20,
          background: THEME.redDim, border: `1px solid ${THEME.red}`,
          borderRadius: 2, display: "flex", alignItems: "center", gap: 10
        }}>
          <AlertTriangle size={16} color={THEME.red} />
          <span style={{ fontSize: 13, color: THEME.text }}>{error}</span>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 16, padding: "0 4px"
          }}>
            <div>
              <div className="serif" style={{ fontSize: 20, fontWeight: 500 }}>
                Found {results.length} Properties
              </div>
              <div style={{ fontSize: 12, color: THEME.textMuted }}>
                Sorted by distressed score • Higher scores = better BRRRR potential
              </div>
            </div>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
            gap: 16
          }}>
            {results.map((property, i) => (
              <PropertyCard key={i} property={property} onAdd={() => addToDeals(property)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PropertyCard = ({ property, onAdd }) => {
  const distressColor = 
    property.distressedScore >= 70 ? THEME.green :
    property.distressedScore >= 50 ? THEME.accent :
    property.distressedScore >= 30 ? THEME.orange : THEME.red;

  const daysOnMarket = property.days_on_market || 0;
  const pricePerSqft = property.list_price && property.sqft ? Math.round(property.list_price / property.sqft) : null;

  return (
    <div style={{
      background: THEME.bgPanel,
      border: `1px solid ${THEME.border}`,
      overflow: "hidden",
      transition: "border-color 0.2s ease"
    }}
    onMouseEnter={(e) => e.currentTarget.style.borderColor = THEME.accentDim}
    onMouseLeave={(e) => e.currentTarget.style.borderColor = THEME.border}
    >
      {/* Distressed score stripe */}
      <div style={{ height: 3, background: distressColor }} />

      <div style={{ padding: 16 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="serif" style={{
              fontSize: 16, fontWeight: 500, letterSpacing: "-0.02em",
              marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>
              {property.address?.line || "Address not available"}
            </div>
            <div style={{ fontSize: 12, color: THEME.textMuted, display: "flex", alignItems: "center", gap: 8 }}>
              <span>{property.address?.city}, {property.address?.state_code} {property.address?.postal_code}</span>
              <span style={{ color: THEME.textDim }}>·</span>
              <span className="mono">{property.beds || 0}b/{property.baths || 0}ba</span>
              {property.sqft && <><span style={{ color: THEME.textDim }}>·</span><span className="mono">{property.sqft.toLocaleString()} sqft</span></>}
            </div>
          </div>
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            padding: "8px 12px", background: THEME.bgInput,
            border: `1px solid ${distressColor}`, minWidth: 70
          }}>
            <div className="label-xs" style={{ color: distressColor }}>DISTRESSED</div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: distressColor }}>
              {property.distressedScore}
            </div>
            <div style={{ fontSize: 9, color: THEME.textDim }}>/ 100</div>
          </div>
        </div>

        {/* Price and details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          <MiniStat label="List Price" value={fmtUSD(property.list_price || 0, { short: true })} valueColor={THEME.text} />
          {pricePerSqft && <MiniStat label="$/sqft" value={`$${pricePerSqft}`} />}
          <MiniStat label="Days on Market" value={daysOnMarket} valueColor={daysOnMarket > 60 ? THEME.green : THEME.textMuted} />
        </div>

        {/* Distressed indicators */}
        {property.distressedScore > 0 && (
          <div style={{
            padding: "8px 10px", background: THEME.bgInput,
            borderLeft: `2px solid ${distressColor}`, marginBottom: 12
          }}>
            <div className="label-xs" style={{ color: distressColor, marginBottom: 4 }}>Distressed Signals</div>
            <div style={{ fontSize: 11, color: THEME.textMuted, lineHeight: 1.4 }}>
              {property.distressedScore >= 70 ? "High: Multiple strong indicators (foreclosure, major price cuts, or extended listing)" :
               property.distressedScore >= 50 ? "Moderate: Several indicators (needs work, motivated seller, price reduction)" :
               property.distressedScore >= 30 ? "Some: Basic indicators (longer days on market, minor price adjustments)" :
               "Low: Few distressed signals detected"}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingTop: 12, borderTop: `1px solid ${THEME.border}`
        }}>
          <div style={{ display: "flex", gap: 8 }}>
            {property.rdc_web_url && (
              <button 
                onClick={() => window.open(property.rdc_web_url, "_blank")}
                className="btn-ghost"
                style={{ padding: "5px 8px", fontSize: 11 }}
              >
                <ExternalLink size={11} /> View Listing
              </button>
            )}
          </div>
          <button onClick={onAdd} className="btn-primary" style={{ padding: "6px 12px", fontSize: 12 }}>
            <Plus size={12} /> Add to Deals
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   EDUCATION CENTER
   ============================================================================ */
const EducationCenter = () => {
  const [activeSection, setActiveSection] = useState("brrrr-basics");

  const sections = [
    { id: "brrrr-basics", label: "BRRRR Basics", icon: <GraduationCap size={14} /> },
    { id: "mao-formulas", label: "70% Rule & MAO", icon: <Calculator size={14} /> },
    { id: "cash-flow", label: "Cash Flow Analysis", icon: <DollarSign size={14} /> },
    { id: "refinance", label: "Refinance Math", icon: <TrendingUp size={14} /> },
    { id: "returns", label: "ROI & Returns", icon: <Percent size={14} /> },
    { id: "deal-grading", label: "Deal Scoring", icon: <Star size={14} /> }
  ];

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 32px" }} className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <div className="serif" style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.03em", marginBottom: 6 }}>
          BRRRR Education Center
        </div>
        <div style={{ fontSize: 13, color: THEME.textMuted, maxWidth: 860, lineHeight: 1.6 }}>
          Master the formulas and methodology behind successful BRRRR investing. Understand every calculation in your deal analyzer.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}>
        {/* Navigation */}
        <div style={{ position: "sticky", top: 100 }}>
          <div style={{
            background: THEME.bgPanel,
            border: `1px solid ${THEME.border}`,
            padding: "16px 0"
          }}>
            <div className="label-xs" style={{ padding: "0 16px", marginBottom: 12, color: THEME.accent }}>
              Learning Modules
            </div>
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  width: "100%", padding: "12px 16px", textAlign: "left",
                  background: activeSection === s.id ? THEME.bgRaised : "transparent",
                  color: activeSection === s.id ? THEME.accent : THEME.textMuted,
                  borderLeft: `3px solid ${activeSection === s.id ? THEME.accent : "transparent"}`,
                  display: "flex", alignItems: "center", gap: 10,
                  fontSize: 13, fontWeight: activeSection === s.id ? 600 : 400,
                  transition: "all 0.15s ease"
                }}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{
          background: THEME.bgPanel,
          border: `1px solid ${THEME.border}`,
          padding: 24
        }}>
          {activeSection === "brrrr-basics" && <BRRRRBasics />}
          {activeSection === "mao-formulas" && <MAOFormulas />}
          {activeSection === "cash-flow" && <CashFlowFormulas />}
          {activeSection === "refinance" && <RefinanceFormulas />}
          {activeSection === "returns" && <ReturnsFormulas />}
          {activeSection === "deal-grading" && <DealGradingFormulas />}
        </div>
      </div>
    </div>
  );
};

const BRRRRBasics = () => (
  <div>
    <div className="serif" style={{ fontSize: 24, fontWeight: 500, marginBottom: 16 }}>
      What is BRRRR?
    </div>
    
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1, marginBottom: 24, background: THEME.border }}>
      {[
        { letter: "B", word: "BUY", desc: "Purchase below-market distressed property", color: THEME.accent },
        { letter: "R", word: "REHAB", desc: "Renovate to force appreciation", color: THEME.blue },
        { letter: "R", word: "RENT", desc: "Tenant covers mortgage + cash flows", color: THEME.green },
        { letter: "R", word: "REFINANCE", desc: "Pull cash out at new appraised value", color: THEME.orange },
        { letter: "R", word: "REPEAT", desc: "Use cash for next deal", color: THEME.purple }
      ].map((step, i) => (
        <div key={i} style={{ background: THEME.bgPanel, padding: "18px 16px", textAlign: "center" }}>
          <div className="serif" style={{ 
            fontSize: 32, fontWeight: 700, color: step.color, marginBottom: 8 
          }}>{step.letter}</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{step.word}</div>
          <div style={{ fontSize: 11, color: THEME.textMuted, lineHeight: 1.4 }}>{step.desc}</div>
        </div>
      ))}
    </div>

    <FormulaCard
      title="The BRRRR Promise"
      formula="Infinite ROI through recycled capital"
      explanation={
        <div>
          <p>The goal of BRRRR is to <strong>pull out 100% of your invested capital</strong> through the refinance, creating an "infinite return" scenario where you own a cash-flowing asset with none of your original money left in the deal.</p>
          
          <div style={{ marginTop: 16 }}>
            <div className="label-xs" style={{ marginBottom: 8 }}>Example Timeline:</div>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 12, fontSize: 12 }}>
              <div className="mono" style={{ color: THEME.textMuted }}>Month 1</div>
              <div>Buy distressed property for $200k cash</div>
              <div className="mono" style={{ color: THEME.textMuted }}>Month 2-5</div>
              <div>Rehab for $50k (total invested: $250k)</div>
              <div className="mono" style={{ color: THEME.textMuted }}>Month 6</div>
              <div>Appraises at $400k ARV</div>
              <div className="mono" style={{ color: THEME.textMuted }}>Month 7</div>
              <div>Refinance at 75% LTV = $300k loan</div>
              <div className="mono" style={{ color: THEME.textMuted }}>Month 8</div>
              <div><strong>$50k cash out + $150k forced equity</strong></div>
            </div>
          </div>
        </div>
      }
    />

    <div style={{ marginTop: 24 }}>
      <div className="label-xs-accent" style={{ marginBottom: 12 }}>Key Success Factors</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {[
          { icon: <Target size={16} />, title: "Buy Right", desc: "Purchase 20-30% below ARV" },
          { icon: <Wrench size={16} />, title: "Rehab Smart", desc: "Focus on value-add improvements" },
          { icon: <Home size={16} />, title: "Rent Strong", desc: "Cash flow from day 1" },
          { icon: <TrendingUp size={16} />, title: "Refinance Max", desc: "Pull out 75-80% of ARV" }
        ].map((factor, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ color: THEME.accent, marginTop: 2 }}>{factor.icon}</div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{factor.title}</div>
              <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.4 }}>{factor.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MAOFormulas = () => (
  <div>
    <div className="serif" style={{ fontSize: 24, fontWeight: 500, marginBottom: 16 }}>
      The 70% Rule & Maximum Allowable Offer
    </div>

    <FormulaCard
      title="Maximum Allowable Offer (MAO)"
      formula="MAO = (ARV × 70%) - Rehab Costs"
      explanation={
        <div>
          <p>The MAO formula ensures you buy at a price that leaves room for profit, holding costs, and unexpected expenses.</p>
          
          <div style={{ marginTop: 16 }}>
            <div className="label-xs" style={{ marginBottom: 8 }}>Where that 30% goes:</div>
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px", gap: 8, fontSize: 12 }}>
              <div className="mono">6%</div><div>Selling costs (if you flip)</div><div className="mono">$24,000</div>
              <div className="mono">4%</div><div>Buying costs (closing, inspections)</div><div className="mono">$16,000</div>
              <div className="mono">5%</div><div>Holding costs during rehab</div><div className="mono">$20,000</div>
              <div className="mono">5%</div><div>Contingency (stuff goes wrong)</div><div className="mono">$20,000</div>
              <div className="mono">10%</div><div>Minimum profit margin</div><div className="mono">$40,000</div>
              <div style={{ borderTop: `1px solid ${THEME.border}`, gridColumn: "1 / -1", margin: "8px 0" }} />
              <div className="mono" style={{ fontWeight: 700 }}>30%</div><div style={{ fontWeight: 700 }}>Total cushion</div><div className="mono" style={{ fontWeight: 700 }}>$120,000</div>
            </div>
            <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 8 }}>
              *Example based on $400k ARV
            </div>
          </div>
        </div>
      }
    />

    <FormulaCard
      title="ARV Determination"
      formula="ARV = Average of 3-5 comparable sales after renovation"
      explanation={
        <div>
          <p>After Repair Value (ARV) is the estimated market value of the property after renovations are complete.</p>
          
          <div style={{ marginTop: 16 }}>
            <div className="label-xs" style={{ marginBottom: 8 }}>How to find comps:</div>
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              • <strong>Similar properties:</strong> Same neighborhood, bed/bath count, square footage<br/>
              • <strong>Recent sales:</strong> Sold within last 3-6 months<br/>
              • <strong>Similar condition:</strong> Recently renovated or move-in ready<br/>
              • <strong>Adjustments:</strong> +/- $10-20/sqft for upgrades, views, lot size
            </div>
          </div>
        </div>
      }
    />

    <div style={{ 
      marginTop: 24, padding: 16, 
      background: THEME.bgInput, 
      borderLeft: `3px solid ${THEME.accent}` 
    }}>
      <div className="label-xs-accent" style={{ marginBottom: 8 }}>MAO Example Calculation</div>
      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, lineHeight: 1.8 }}>
        <div>Property: 3br/2ba, 1,400 sqft in Pompano Beach</div>
        <div>Comparable sales: $385k, $395k, $405k, $390k</div>
        <div>ARV = $394k average</div>
        <div>Rehab estimate = $45k (kitchen, baths, flooring)</div>
        <div style={{ margin: "8px 0", borderTop: `1px solid ${THEME.border}`, paddingTop: 8 }}>
          MAO = ($394,000 × 0.70) - $45,000<br/>
          MAO = $275,800 - $45,000<br/>
          <strong style={{ color: THEME.accent }}>MAO = $230,800</strong>
        </div>
        <div style={{ color: THEME.textMuted }}>
          Don't pay more than $230k for this property
        </div>
      </div>
    </div>
  </div>
);

const CashFlowFormulas = () => (
  <div>
    <div className="serif" style={{ fontSize: 24, fontWeight: 500, marginBottom: 16 }}>
      Cash Flow Analysis
    </div>

    <FormulaCard
      title="Long-Term Rental (LTR) Cash Flow"
      formula="Monthly Cash Flow = Effective Rent - Total Expenses"
      explanation={
        <div>
          <div style={{ marginTop: 12 }}>
            <div className="label-xs" style={{ marginBottom: 8 }}>Income calculation:</div>
            <div className="mono" style={{ fontSize: 12, background: THEME.bgInput, padding: 12, marginBottom: 12 }}>
              Effective Rent = Monthly Rent × (1 - Vacancy Rate)
            </div>
            
            <div className="label-xs" style={{ marginBottom: 8 }}>Monthly expenses include:</div>
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              • <strong>Mortgage Payment:</strong> Principal & Interest (P&I)<br/>
              • <strong>Property Taxes:</strong> Annual taxes ÷ 12<br/>
              • <strong>Insurance:</strong> Annual premium ÷ 12<br/>
              • <strong>Property Management:</strong> 8-12% of gross rent<br/>
              • <strong>Maintenance:</strong> 5-10% of gross rent<br/>
              • <strong>CapEx Reserve:</strong> 5% of gross rent<br/>
              • <strong>HOA/Condo Fees:</strong> If applicable
            </div>
          </div>
        </div>
      }
    />

    <FormulaCard
      title="Short-Term Rental (STR) Cash Flow"
      formula="Monthly Cash Flow = (ADR × Occupied Nights × 30.4) - All Expenses"
      explanation={
        <div>
          <div style={{ marginTop: 12 }}>
            <div className="label-xs" style={{ marginBottom: 8 }}>STR Revenue calculation:</div>
            <div className="mono" style={{ fontSize: 12, background: THEME.bgInput, padding: 12, marginBottom: 12 }}>
              Occupied Nights = 30.4 days × (Occupancy Rate ÷ 100)<br/>
              Gross Revenue = ADR × Occupied Nights<br/>
              Net Revenue = Gross Revenue × (1 - Platform Fee 3%)
            </div>
            
            <div className="label-xs" style={{ marginBottom: 8 }}>Additional STR expenses:</div>
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              • <strong>All LTR expenses</strong> (mortgage, taxes, insurance)<br/>
              • <strong>STR Management:</strong> 18-25% of gross revenue<br/>
              • <strong>Utilities:</strong> Electric, gas, water, trash<br/>
              • <strong>Internet/Cable:</strong> High-speed for guests<br/>
              • <strong>Supplies:</strong> Toiletries, linens, cleaning supplies<br/>
              • <strong>Higher Insurance:</strong> STR premium ~25% more
            </div>
          </div>
        </div>
      }
    />

    <div style={{ 
      marginTop: 24, padding: 16, 
      background: THEME.bgInput, 
      borderLeft: `3px solid ${THEME.green}` 
    }}>
      <div className="label-xs" style={{ marginBottom: 8, color: THEME.green }}>Cash Flow Comparison Example</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 12 }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>LTR Strategy</div>
          <div className="mono" style={{ lineHeight: 1.6 }}>
            Rent: $2,800/month<br/>
            Vacancy (5%): -$140<br/>
            <strong>Effective Income: $2,660</strong><br/><br/>
            
            Mortgage: $1,680<br/>
            Taxes: $400<br/>
            Insurance: $300<br/>
            Management: $280<br/>
            Maintenance: $140<br/>
            CapEx: $140<br/>
            <strong>Total Expenses: $2,940</strong><br/><br/>
            
            <span style={{ color: THEME.red }}>Cash Flow: -$280/mo</span>
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>STR Strategy</div>
          <div className="mono" style={{ lineHeight: 1.6 }}>
            ADR: $225/night<br/>
            Occupancy: 65%<br/>
            Nights: 19.8/month<br/>
            Gross: $4,455<br/>
            Platform Fee: -$134<br/>
            <strong>Net Revenue: $4,321</strong><br/><br/>
            
            Mortgage: $1,680<br/>
            Taxes: $400<br/>
            STR Insurance: $375<br/>
            Management: $891<br/>
            Utilities: $280<br/>
            Supplies: $150<br/>
            <strong>Total Expenses: $3,776</strong><br/><br/>
            
            <span style={{ color: THEME.green }}>Cash Flow: +$545/mo</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const RefinanceFormulas = () => (
  <div>
    <div className="serif" style={{ fontSize: 24, fontWeight: 500, marginBottom: 16 }}>
      Refinance Mathematics
    </div>

    <FormulaCard
      title="Loan Amount Calculation"
      formula="Loan Amount = ARV × LTV Ratio"
      explanation={
        <div>
          <p>Most investment property loans offer 75-80% LTV (Loan-to-Value) based on the appraised value after renovation.</p>
          
          <div style={{ marginTop: 16 }}>
            <div className="label-xs" style={{ marginBottom: 8 }}>Typical LTV ratios:</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 12 }}>
              <div>
                <strong>DSCR Loans (No-Income-Verification)</strong><br/>
                • 75% LTV standard<br/>
                • 80% LTV with higher rates<br/>
                • Based on rental income only
              </div>
              <div>
                <strong>Bank Statement Loans</strong><br/>
                • 75-80% LTV possible<br/>
                • Requires income documentation<br/>
                • Slightly better rates
              </div>
            </div>
          </div>
        </div>
      }
    />

    <FormulaCard
      title="Cash Out Calculation"
      formula="Cash Out = Loan Amount - Total Invested"
      explanation={
        <div>
          <div style={{ marginTop: 12 }}>
            <div className="label-xs" style={{ marginBottom: 8 }}>Where Total Invested includes:</div>
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              • <strong>Purchase Price:</strong> What you paid for property<br/>
              • <strong>Closing Costs:</strong> Title, inspection, attorney fees<br/>
              • <strong>Rehab Budget:</strong> All renovation costs<br/>
              • <strong>Holding Costs:</strong> Taxes, insurance, utilities during rehab<br/>
              • <strong>Refi Closing Costs:</strong> Appraisal, title, loan fees
            </div>
          </div>

          <div style={{ marginTop: 16, padding: 12, background: THEME.bgRaised }}>
            <div className="label-xs" style={{ marginBottom: 8 }}>Cash Out Scenarios:</div>
            <div style={{ fontSize: 12 }}>
              • <strong style={{ color: THEME.green }}>Positive Cash Out:</strong> You pull money out (good!)<br/>
              • <strong style={{ color: THEME.accent }}>Break Even:</strong> You get all money back<br/>
              • <strong style={{ color: THEME.red }}>Cash Left In:</strong> Some money remains in deal
            </div>
          </div>
        </div>
      }
    />

    <FormulaCard
      title="Monthly Payment Calculation"
      formula="P&I = L × [r(1+r)^n] / [(1+r)^n - 1]"
      explanation={
        <div>
          <div style={{ fontSize: 12, marginTop: 12 }}>
            <strong>Where:</strong><br/>
            • L = Loan amount<br/>
            • r = Monthly interest rate (annual rate ÷ 12)<br/>
            • n = Total number of payments (years × 12)
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="label-xs" style={{ marginBottom: 8 }}>Current Investment Loan Rates (2026):</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px", gap: 8, fontSize: 12 }}>
              <div style={{ fontWeight: 600 }}>Loan Type</div>
              <div style={{ fontWeight: 600 }}>Rate</div>
              <div style={{ fontWeight: 600 }}>Payment*</div>
              <div>DSCR (75% LTV)</div><div className="mono">7.5%</div><div className="mono">$2,098</div>
              <div>DSCR (80% LTV)</div><div className="mono">8.0%</div><div className="mono">$2,330</div>
              <div>Bank Statement</div><div className="mono">7.25%</div><div className="mono">$2,049</div>
              <div style={{ fontSize: 10, color: THEME.textDim, gridColumn: "1 / -1", marginTop: 4 }}>
                *Based on $300k loan, 30-year amortization
              </div>
            </div>
          </div>
        </div>
      }
    />

    <div style={{ 
      marginTop: 24, padding: 16, 
      background: THEME.bgInput, 
      borderLeft: `3px solid ${THEME.blue}` 
    }}>
      <div className="label-xs" style={{ marginBottom: 8, color: THEME.blue }}>Complete Refinance Example</div>
      <div className="mono" style={{ fontSize: 12, lineHeight: 1.8 }}>
        <div>Purchase Price: $200,000</div>
        <div>Closing Costs: $6,000</div>
        <div>Rehab Budget: $50,000</div>
        <div>Holding Costs: $8,000 (4 months)</div>
        <div>Refi Closing: $5,000</div>
        <div><strong>Total Invested: $269,000</strong></div>
        <div style={{ margin: "8px 0", borderTop: `1px solid ${THEME.border}`, paddingTop: 8 }}>
          ARV: $400,000<br/>
          Loan Amount (75% LTV): $300,000<br/>
          Monthly Payment (7.5%): $2,098<br/>
        </div>
        <div style={{ color: THEME.green, fontWeight: 700 }}>
          Cash Out: $300,000 - $269,000 = $31,000
        </div>
        <div style={{ color: THEME.textMuted, marginTop: 4 }}>
          Plus $131k in forced equity!
        </div>
      </div>
    </div>
  </div>
);

const ReturnsFormulas = () => (
  <div>
    <div className="serif" style={{ fontSize: 24, fontWeight: 500, marginBottom: 16 }}>
      ROI & Return Calculations
    </div>

    <FormulaCard
      title="Cash-on-Cash Return"
      formula="CoC Return = (Annual Cash Flow ÷ Cash Left in Deal) × 100"
      explanation={
        <div>
          <p>Cash-on-Cash measures the annual return on the actual cash you have invested in the property.</p>
          
          <div style={{ marginTop: 16 }}>
            <div className="label-xs" style={{ marginBottom: 8 }}>CoC Return Benchmarks:</div>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 60px", gap: 8, fontSize: 12 }}>
              <div style={{ color: THEME.red }}>0-8%</div><div>Poor - Consider other investments</div><div>😞</div>
              <div style={{ color: THEME.orange }}>8-12%</div><div>Acceptable - Beats most alternatives</div><div>😐</div>
              <div style={{ color: THEME.accent }}>12-18%</div><div>Good - Solid real estate returns</div><div>😊</div>
              <div style={{ color: THEME.green }}>18%+</div><div>Excellent - Outstanding performance</div><div>🤑</div>
              <div style={{ color: THEME.green }}>∞</div><div>Infinite - No money left in deal</div><div>🚀</div>
            </div>
          </div>
        </div>
      }
    />

    <FormulaCard
      title="Total Return on Investment"
      formula="Total ROI = (Annual Cash Flow + Principal Paydown + Appreciation) ÷ Cash Left in Deal"
      explanation={
        <div>
          <p>Total ROI includes all wealth-building aspects of real estate: cash flow, mortgage paydown, and appreciation.</p>
          
          <div style={{ marginTop: 16 }}>
            <div className="label-xs" style={{ marginBottom: 8 }}>The 4 ways real estate builds wealth:</div>
            <div style={{ fontSize: 12, lineHeight: 1.8 }}>
              • <strong>Cash Flow:</strong> Monthly rent minus expenses<br/>
              • <strong>Principal Paydown:</strong> Tenants pay down your mortgage<br/>
              • <strong>Appreciation:</strong> Property value increases over time<br/>
              • <strong>Tax Benefits:</strong> Depreciation, deductions, 1031 exchanges
            </div>
          </div>

          <div style={{ marginTop: 16, padding: 12, background: THEME.bgRaised }}>
            <div className="label-xs" style={{ marginBottom: 8 }}>Conservative Annual Assumptions:</div>
            <div style={{ fontSize: 12 }}>
              • <strong>Appreciation:</strong> 3-5% per year<br/>
              • <strong>Principal Paydown:</strong> ~$2,000-4,000 annually<br/>
              • <strong>Rent Increases:</strong> 3% per year
            </div>
          </div>
        </div>
      }
    />

    <FormulaCard
      title="Internal Rate of Return (IRR)"
      formula="Complex calculation considering time value of money"
      explanation={
        <div>
          <p>IRR accounts for the timing of cash flows and is the "true" annual return considering when money goes in and comes out.</p>
          
          <div style={{ marginTop: 16 }}>
            <div className="label-xs" style={{ marginBottom: 8 }}>When to use IRR vs CoC:</div>
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              • <strong>Cash-on-Cash:</strong> Simple, annual return on remaining investment<br/>
              • <strong>IRR:</strong> Complex, accounts for timing and refinancing<br/>
              • <strong>For BRRRR:</strong> CoC often more relevant since goal is infinite return
            </div>
          </div>
        </div>
      }
    />

    <div style={{ 
      marginTop: 24, padding: 16, 
      background: THEME.bgInput, 
      borderLeft: `3px solid ${THEME.accent}` 
    }}>
      <div className="label-xs-accent" style={{ marginBottom: 8 }}>Returns Calculation Example</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 12 }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Deal Summary</div>
          <div className="mono" style={{ lineHeight: 1.6 }}>
            Total Invested: $250,000<br/>
            Refinance Amount: $300,000<br/>
            <strong>Cash Out: $50,000</strong><br/>
            Monthly Cash Flow: $400<br/>
            Annual Cash Flow: $4,800
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Return Analysis</div>
          <div className="mono" style={{ lineHeight: 1.6 }}>
            Cash-on-Cash: N/A (no cash left)<br/>
            <strong>Infinite Return!</strong><br/><br/>
            Plus Benefits:<br/>
            • $50k cash for next deal<br/>
            • $100k+ forced equity<br/>
            • ~$2,500/year principal paydown
          </div>
        </div>
      </div>
    </div>
  </div>
);

const DealGradingFormulas = () => (
  <div>
    <div className="serif" style={{ fontSize: 24, fontWeight: 500, marginBottom: 16 }}>
      Deal Scoring Methodology
    </div>

    <FormulaCard
      title="DealTrack Deal Score (0-100 Points)"
      formula="Weighted scoring across 5 key categories"
      explanation={
        <div>
          <div style={{ marginTop: 16 }}>
            <div className="label-xs" style={{ marginBottom: 12 }}>Scoring Categories:</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 1fr", gap: 12, fontSize: 12 }}>
              <div><strong>70% Rule Compliance</strong></div>
              <div className="mono">30 pts</div>
              <div>Are you buying right?</div>
              
              <div><strong>All-in to ARV Ratio</strong></div>
              <div className="mono">20 pts</div>
              <div>Efficient capital deployment</div>
              
              <div><strong>Cash Flow Potential</strong></div>
              <div className="mono">20 pts</div>
              <div>Monthly income generation</div>
              
              <div><strong>Cash Left in Deal</strong></div>
              <div className="mono">20 pts</div>
              <div>How close to infinite return</div>
              
              <div><strong>Location/Strategy Fit</strong></div>
              <div className="mono">10 pts</div>
              <div>STR-friendly? Good rental area?</div>
            </div>
          </div>
        </div>
      }
    />

    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginTop: 24 }}>
      <div style={{ background: THEME.bgInput, padding: 16, border: `1px solid ${THEME.border}` }}>
        <div className="label-xs" style={{ marginBottom: 12, color: THEME.green }}>A+ Grade (85-100 points)</div>
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          • Well under MAO<br/>
          • All-in cost &lt; 70% of ARV<br/>
          • Cash flow $1,000+ per month<br/>
          • Little to no cash left in deal<br/>
          • Perfect location for strategy
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: THEME.green }}>
          <strong>Action:</strong> Make aggressive offers on these deals
        </div>
      </div>

      <div style={{ background: THEME.bgInput, padding: 16, border: `1px solid ${THEME.border}` }}>
        <div className="label-xs" style={{ marginBottom: 12, color: THEME.accent }}>B Grade (62-75 points)</div>
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          • Close to MAO<br/>
          • All-in cost 70-80% of ARV<br/>
          • Cash flow $200-500 per month<br/>
          • Some cash left in deal<br/>
          • Good location for strategy
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: THEME.accent }}>
          <strong>Action:</strong> Negotiate harder or find ways to improve
        </div>
      </div>

      <div style={{ background: THEME.bgInput, padding: 16, border: `1px solid ${THEME.border}` }}>
        <div className="label-xs" style={{ marginBottom: 12, color: THEME.orange }}>C Grade (48-62 points)</div>
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          • Over MAO but workable<br/>
          • All-in cost 80-85% of ARV<br/>
          • Cash flow $0-200 per month<br/>
          • Significant cash left in<br/>
          • Location has some issues
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: THEME.orange }}>
          <strong>Action:</strong> Find a lever to improve the deal
        </div>
      </div>

      <div style={{ background: THEME.bgInput, padding: 16, border: `1px solid ${THEME.border}` }}>
        <div className="label-xs" style={{ marginBottom: 12, color: THEME.red }}>F Grade (&lt;48 points)</div>
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          • Well over MAO<br/>
          • All-in cost &gt;85% of ARV<br/>
          • Negative cash flow<br/>
          • Too much cash left in deal<br/>
          • Poor location for strategy
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: THEME.red }}>
          <strong>Action:</strong> Pass and find better deals
        </div>
      </div>
    </div>

    <div style={{ 
      marginTop: 24, padding: 16, 
      background: THEME.bgInput, 
      borderLeft: `3px solid ${THEME.purple}` 
    }}>
      <div className="label-xs" style={{ marginBottom: 8, color: THEME.purple }}>Pro Tip: Focus on A & B Grade Deals</div>
      <div style={{ fontSize: 12, lineHeight: 1.6 }}>
        In competitive markets, don't waste time on C and F grade deals. Instead:<br/><br/>
        • <strong>Increase deal flow</strong> — analyze more properties to find better ones<br/>
        • <strong>Expand your area</strong> — look in adjacent markets with better fundamentals<br/>
        • <strong>Build relationships</strong> — wholesalers, agents, contractors who bring you deals first<br/>
        • <strong>Be ready to move fast</strong> — have financing, contractors, and team lined up
      </div>
    </div>
  </div>
);

const FormulaCard = ({ title, formula, explanation }) => (
  <div style={{
    background: THEME.bgInput,
    border: `1px solid ${THEME.border}`,
    padding: 20,
    marginBottom: 20
  }}>
    <div style={{ marginBottom: 16 }}>
      <div className="label-xs-accent" style={{ marginBottom: 8 }}>{title}</div>
      <div className="mono" style={{
        fontSize: 16, fontWeight: 600, color: THEME.accent,
        padding: "12px 16px", background: THEME.bgPanel,
        border: `1px solid ${THEME.border}`
      }}>
        {formula}
      </div>
    </div>
    <div style={{ fontSize: 13, lineHeight: 1.6, color: THEME.textMuted }}>
      {explanation}
    </div>
  </div>
);

/* ============================================================================
   MARKET INTEL
   ============================================================================ */
const MarketIntel = () => {
  const [countyFilter, setCountyFilter] = useState("All");
  const [strFilter, setStrFilter] = useState("all");
  const [sortBy, setSortBy] = useState("brrrrScore");

  const filtered = useMemo(() => {
    let list = [...CITIES];
    if (countyFilter !== "All") list = list.filter(c => c.county === countyFilter);
    if (strFilter !== "all") list = list.filter(c => c.strStatus === strFilter);
    list.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "adr") return b.adrHigh - a.adrHigh;
      if (sortBy === "occupancy") return b.occupancy - a.occupancy;
      return b.brrrrScore - a.brrrrScore;
    });
    return list;
  }, [countyFilter, strFilter, sortBy]);

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 32px" }} className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <div className="serif" style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.03em", marginBottom: 6 }}>
          SE Florida Market Intelligence
        </div>
        <div style={{ fontSize: 13, color: THEME.textMuted, maxWidth: 760, lineHeight: 1.6 }}>
          STR legality, ADR benchmarks, and BRRRR suitability across Miami-Dade, Broward, and Palm Beach counties. Data is general guidance — always verify the specific zoning + HOA for your target property.
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 1, marginBottom: 24, background: THEME.border,
        border: `1px solid ${THEME.border}`
      }}>
        <LegendTile color={THEME.green} label="STR Allowed" desc="Registration needed; verify zoning" />
        <LegendTile color={THEME.accent} label="Varies" desc="HOA/condo rules are the gate" />
        <LegendTile color={THEME.orange} label="Restricted" desc="30-day or 6-month minimums" />
        <LegendTile color={THEME.red} label="Prohibited" desc="Banned in residential" />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <Filter size={14} color={THEME.textMuted} />
        <select value={countyFilter} onChange={(e) => setCountyFilter(e.target.value)}
          style={{ padding: "8px 10px", fontSize: 12 }}>
          <option>All</option>
          <option>Miami-Dade</option>
          <option>Broward</option>
          <option>Palm Beach</option>
        </select>
        <select value={strFilter} onChange={(e) => setStrFilter(e.target.value)}
          style={{ padding: "8px 10px", fontSize: 12 }}>
          <option value="all">All STR status</option>
          <option value="allowed">Allowed only</option>
          <option value="varies">Varies</option>
          <option value="restricted">Restricted</option>
          <option value="prohibited">Prohibited</option>
        </select>
        <span style={{ marginLeft: "auto", fontSize: 11, color: THEME.textMuted }}>Sort by</span>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: "8px 10px", fontSize: 12 }}>
          <option value="brrrrScore">BRRRR suitability</option>
          <option value="adr">Highest ADR</option>
          <option value="occupancy">Occupancy</option>
          <option value="name">Name (A–Z)</option>
        </select>
      </div>

      {/* Cities table */}
      <div style={{ background: THEME.bgPanel, border: `1px solid ${THEME.border}` }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(160px, 1.2fr) 1fr 1.2fr 0.9fr 0.7fr 1fr",
          gap: 12, padding: "12px 20px",
          borderBottom: `1px solid ${THEME.border}`,
          background: THEME.bgRaised
        }}>
          <div className="label-xs">City</div>
          <div className="label-xs">County</div>
          <div className="label-xs">STR Status</div>
          <div className="label-xs">ADR Range</div>
          <div className="label-xs">Occupancy</div>
          <div className="label-xs">BRRRR Score</div>
        </div>

        {filtered.map((c, i) => (
          <div
            key={c.name}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(160px, 1.2fr) 1fr 1.2fr 0.9fr 0.7fr 1fr",
              gap: 12, padding: "14px 20px", alignItems: "center",
              borderBottom: i < filtered.length - 1 ? `1px solid ${THEME.border}` : "none",
              fontSize: 13
            }}
          >
            <div>
              <div style={{ fontWeight: 500 }}>{c.name}</div>
              <div style={{ fontSize: 10.5, color: THEME.textDim, marginTop: 2, lineHeight: 1.4 }}>{c.strNote}</div>
            </div>
            <div style={{ color: THEME.textMuted, fontSize: 12 }}>{c.county}</div>
            <div><StrStatusBadge status={c.strStatus} /></div>
            <div className="mono" style={{ fontSize: 12 }}>${c.adrLow}–${c.adrHigh}</div>
            <div className="mono" style={{ fontSize: 12 }}>{c.occupancy}%</div>
            <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} style={{
                  width: 16, height: 7,
                  background: n <= c.brrrrScore ? THEME.accent : THEME.border
                }} />
              ))}
              <span className="mono" style={{ fontSize: 11, color: THEME.textMuted, marginLeft: 6 }}>
                {c.brrrrScore}/5
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimers + guidance */}
      <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <InfoCard
          icon={<Shield size={14} color={THEME.accent} />}
          title="Where to Find Distressed Inventory"
          items={[
            "Broward / Miami-Dade / Palm Beach foreclosure auctions (county .realforeclose.com)",
            "Pre-foreclosure notices (Lis Pendens) via county clerk of court",
            "MLS keywords: 'cash only', 'as-is', 'fixer', 'TLC', 'handyman', 'investor special'",
            "Auction.com, Hubzu, Xome for REO/bank-owned",
            "Wholesaler networks (FL real estate FB groups)",
            "Driving for dollars in target ZIPs + direct mail to absentee owners"
          ]}
        />
        <InfoCard
          icon={<Zap size={14} color={THEME.accent} />}
          title="FL-Specific Due Diligence"
          items={[
            "4-point inspection + wind mitigation report BEFORE insurance quotes",
            "Roof age, electrical, plumbing, HVAC — underwriters care most about these",
            "Chinese drywall (homes built 2001–2008) — walk if present",
            "Flood zone (AE, VE) dramatically increases insurance cost",
            "Permit history via county Building Dept. — unpermitted work = buyer problem",
            "HOA estoppel: special assessments, pending litigation, STR rules"
          ]}
        />
        <InfoCard
          icon={<Info size={14} color={THEME.accent} />}
          title="STR Regulation Notes"
          items={[
            "FL §509.032(7) preempts most local STR bans — BUT cities with pre-2011 ordinances are grandfathered",
            "Miami Beach, Coral Gables, Surfside, and parts of Miami have grandfathered bans",
            "Always pull city-specific STR code + HOA docs before closing",
            "Condos and HOAs can override permissive city rules",
            "Most cities now require BTR (Business Tax Receipt) + vacation rental license + state DBPR license",
            "Tourist tax (Tourist Development Tax + state sales tax) = typically 12–13% on all STR stays"
          ]}
        />
      </div>
    </div>
  );
};

const LegendTile = ({ color, label, desc }) => (
  <div style={{ background: THEME.bgPanel, padding: "12px 16px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <div style={{ width: 8, height: 8, background: color, borderRadius: "50%" }} />
      <div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div>
    </div>
    <div style={{ fontSize: 11, color: THEME.textMuted }}>{desc}</div>
  </div>
);

const InfoCard = ({ icon, title, items }) => (
  <div style={{ background: THEME.bgPanel, border: `1px solid ${THEME.border}`, padding: 18 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      {icon}
      <span className="label-xs-accent">{title}</span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {items.map((item, i) => (
        <div key={i} style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.55, display: "flex", gap: 8 }}>
          <ChevronRight size={12} color={THEME.accentDim} style={{ flexShrink: 0, marginTop: 3 }} />
          <span>{item}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ============================================================================
   MAIN APP
   ============================================================================ */
export default function BRRRRTracker() {
  const [deals, setDeals] = useState([]);
  const [view, setView] = useState("dashboard");
  const [activeDealId, setActiveDealId] = useState(null);
  const [draftDeal, setDraftDeal] = useState(null); // editable copy of active deal
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  // Performance optimization with useCallback for expensive calculations
  const calcMetricsOptimized = useCallback((deal) => calcMetrics(deal), []);

  // Load deals from localStorage on mount (fallback from persistent storage)
  useEffect(() => {
    (async () => {
      try {
        // Try new persistent storage first
        if (window.storage) {
          const result = await window.storage.list("deals:");
          if (result?.keys?.length) {
            const loaded = [];
            for (const key of result.keys) {
              try {
                const item = await window.storage.get(key);
                if (item?.value) {
                  loaded.push(JSON.parse(item.value));
                }
              } catch (e) {
                console.error("Failed to load deal:", key, e);
              }
            }
            loaded.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
            setDeals(loaded);
            setLoading(false);
            return;
          }
        }
        
        // Fallback to localStorage for backwards compatibility  
        const saved = localStorage.getItem("dealtrack-deals");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setDeals(parsed);
          }
        }
      } catch (error) {
        console.error("Error loading deals:", error);
        
        // Try localStorage fallback
        try {
          const saved = localStorage.getItem("dealtrack-deals");
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setDeals(parsed);
            }
          }
        } catch (fallbackError) {
          console.error("Fallback load failed:", fallbackError);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Save deals to localStorage when deals change (performance backup)
  useEffect(() => {
    if (!loading && deals.length > 0) {
      try {
        localStorage.setItem("dealtrack-deals", JSON.stringify(deals));
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    }
  }, [deals, loading]);
              if (item?.value) loaded.push(JSON.parse(item.value));
            } catch (e) { /* skip bad key */ }
          }
          loaded.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          setDeals(loaded);
        }
      } catch (e) {
        console.error("Load deals failed:", e);
      }
      setLoading(false);
    })();
  }, []);

  const activeDeal = deals.find(d => d.id === activeDealId);

  // When switching to a new active deal, make a draft copy
  useEffect(() => {
    if (activeDealId && !draftDeal) {
      const d = deals.find(x => x.id === activeDealId);
      if (d) setDraftDeal({ ...d });
    }
  }, [activeDealId, deals, draftDeal]);

  const onNewDeal = () => {
    const fresh = makeNewDeal();
    setDraftDeal(fresh);
    setActiveDealId(fresh.id);
    setIsDirty(true);
    setView("analyzer");
  };

  const onOpenDeal = (id) => {
    const d = deals.find(x => x.id === id);
    if (d) {
      setDraftDeal({ ...d });
      setActiveDealId(id);
      setIsDirty(false);
      setView("analyzer");
    }
  };

  const onUpdateDraft = (updated) => {
    setDraftDeal(updated);
    setIsDirty(true);
  };

  const exportDeals = () => {
    const data = {
      deals: deals,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brrrr-deals-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDeals = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.deals && Array.isArray(data.deals)) {
          // Save imported deals to storage
          for (const deal of data.deals) {
            try {
              await window.storage.set(`deals:${deal.id}`, JSON.stringify(deal));
            } catch (err) {
              console.error("Failed to save deal:", deal.id, err);
            }
          }
          setDeals(data.deals);
          alert(`Successfully imported ${data.deals.length} deals!`);
        } else {
          alert("Invalid file format");
        }
      } catch (err) {
        alert("Failed to import deals: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const onSaveDeal = async () => {
    if (!draftDeal) return;
    try {
      await window.storage.set(`deals:${draftDeal.id}`, JSON.stringify(draftDeal));
      const newList = deals.some(d => d.id === draftDeal.id)
        ? deals.map(d => d.id === draftDeal.id ? draftDeal : d)
        : [draftDeal, ...deals];
      newList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setDeals(newList);
      setIsDirty(false);
    } catch (e) {
      console.error("Save failed:", e);
      alert("Save failed — storage error.");
    }
  };

  const onDeleteDeal = async (id) => {
    try { await window.storage.delete(`deals:${id}`); } catch (e) {}
    setDeals(deals.filter(d => d.id !== id));
    if (activeDealId === id) {
      setActiveDealId(null);
      setDraftDeal(null);
      setView("dashboard");
    }
  };

  const onDuplicateDeal = async (id) => {
    const original = deals.find(d => d.id === id);
    if (!original) return;
    const copy = {
      ...original,
      id: `deal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      address: original.address ? `${original.address} (copy)` : "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    try {
      await window.storage.set(`deals:${copy.id}`, JSON.stringify(copy));
      setDeals([copy, ...deals]);
    } catch (e) { console.error(e); }
  };

  const onAddPropertyFromSourcing = async (property) => {
    try {
      await window.storage.set(`deals:${property.id}`, JSON.stringify(property));
      setDeals([property, ...deals]);
      // Switch to analyzer view to review the new property
      setDraftDeal({ ...property });
      setActiveDealId(property.id);
      setIsDirty(false);
      setView("analyzer");
    } catch (e) {
      console.error("Failed to add property:", e);
      alert("Failed to add property to deals");
    }
  };

  const onBack = () => {
    if (isDirty && !confirm("Discard unsaved changes?")) return;
    setActiveDealId(null);
    setDraftDeal(null);
    setIsDirty(false);
    setView("dashboard");
  };

  const onDeleteFromAnalyzer = () => {
    if (!draftDeal) return;
    if (!confirm(`Delete "${draftDeal.address || 'this deal'}"? This cannot be undone.`)) return;
    onDeleteDeal(draftDeal.id);
  };

  if (loading) {
    return (
      <div className="brrrr-root" style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100vh"
      }}>
        <style>{STYLE_TAG}</style>
        <div style={{ color: THEME.textMuted, fontSize: 13 }} className="label-xs pulse">
          Loading your deals...
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

      {view === "dashboard" && (
        <Dashboard
          deals={deals}
          onNewDeal={onNewDeal}
          onOpenDeal={onOpenDeal}
          onDeleteDeal={onDeleteDeal}
          onDuplicateDeal={onDuplicateDeal}
          exportDeals={exportDeals}
          importDeals={importDeals}
        />
      )}

      {view === "portfolio" && (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 32px" }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8, color: THEME.text }}>
              Portfolio Analytics
            </h2>
            <p style={{ color: THEME.textMuted, fontSize: 16 }}>
              Comprehensive view of your investment performance
            </p>
          </div>
          <PortfolioDashboard deals={deals} />
          
          {deals.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <ROIProjections deal={draftDeal || deals[0]} />
            </div>
          )}
        </div>
      )}

      {view === "analyzer" && draftDeal && (
        <Analyzer
          deal={draftDeal}
          onUpdate={onUpdateDraft}
          onSave={onSaveDeal}
          onBack={onBack}
          onDelete={onDeleteFromAnalyzer}
          isDirty={isDirty}
        />
      )}

      {view === "sourcing" && (
        <DealSourcing onAddProperty={onAddPropertyFromSourcing} />
      )}

      {view === "market" && (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 32px" }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8, color: THEME.text }}>
              Market Intelligence
            </h2>
            <p style={{ color: THEME.textMuted, fontSize: 16 }}>
              Real-time market data and trends for SE Florida
            </p>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "2fr 1fr", gap: 24, marginBottom: 32 }}>
            <MarketIntel />
            <MarketTrendsPanel />
          </div>
        </div>
      )}

      {view === "competition" && <CompetitionTracker />}

      {view === "education" && <EducationCenter />}

      {/* Footer */}
      <footer style={{
        marginTop: 60, padding: "20px 32px",
        borderTop: `1px solid ${THEME.border}`,
        maxWidth: 1400, margin: "60px auto 0",
        display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12
      }}>
        <div style={{ fontSize: 11, color: THEME.textDim, lineHeight: 1.6, maxWidth: 700 }}>
          This tool is for underwriting + decision-support. ADR and occupancy benchmarks are directional estimates — verify with AirDNA, Rabbu, or direct scraping of comparable listings. STR regulations change; always confirm with the city code enforcement office and HOA before closing. Not financial or legal advice.
        </div>
        <div className="label-xs" style={{ color: THEME.textDim }}>
          DealTrack © 2026
        </div>
      </footer>
    </div>
  );
}
