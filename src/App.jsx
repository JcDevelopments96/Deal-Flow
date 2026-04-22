import React, { useState, useEffect, useCallback } from "react";
import {
  Building2, Calculator, TrendingUp, MapPin, Search, Plus, Trash2,
  Home, DollarSign, ArrowRight, Save, BookOpen, BarChart3,
  CheckCircle2, X, Percent
} from "lucide-react";

const THEME = {
  bg: "#FFFFFF", bgPanel: "#F8FAFB", bgInput: "#FFFFFF", bgRaised: "#F5F7F9",
  border: "#E2E8F0", borderLight: "#F1F5F9",
  text: "#1E293B", textMuted: "#64748B", textDim: "#94A3B8",
  accent: "#0D9488", accentDim: "#14B8A6",
  secondary: "#EA580C", secondaryDim: "#FB923C",
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
.serif { font-family: 'Fraunces', serif; letter-spacing: -0.025em; }
.mono { font-family: 'JetBrains Mono', monospace; }
.label-xs {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: 0.18em;
  text-transform: uppercase; color: ${THEME.textMuted}; font-weight: 500;
}
.btn-primary {
  background: ${THEME.accent}; color: white; font-weight: 600;
  padding: 8px 14px; border: none; border-radius: 4px;
  display: inline-flex; align-items: center; gap: 6px;
  cursor: pointer; transition: all 0.15s ease;
}
.btn-primary:hover { background: ${THEME.accentDim}; }
.btn-ghost { 
  color: ${THEME.textMuted}; background: transparent; border: none;
  padding: 8px 14px; cursor: pointer; display: inline-flex;
  align-items: center; gap: 6px; transition: all 0.15s ease;
}
.btn-ghost:hover { color: ${THEME.accent}; background: ${THEME.bgRaised}; }
.btn-danger { 
  color: ${THEME.red}; background: transparent; border: none;
  padding: 4px; cursor: pointer;
}
`;

const fmtUSD = (value) => {
  if (typeof value !== 'number') value = parseFloat(value) || 0;
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    maximumFractionDigits: 0 
  }).format(value);
};

const calcMetrics = (deal) => {
  const purchasePrice = Number(deal.purchasePrice) || 0;
  const rehabBudget = Number(deal.rehabBudget) || 0;
  const arv = Number(deal.arv) || 0;
  const rentEstimate = Number(deal.rentEstimate) || 0;
  const downPayment = Number(deal.downPayment) || 25;
  
  const totalInvested = purchasePrice * (downPayment / 100) + rehabBudget + 5000; // rough estimate
  const monthlyCashFlow = rentEstimate - (rentEstimate * 0.5); // rough estimate
  const cashOnCash = totalInvested > 0 ? (monthlyCashFlow * 12 / totalInvested) * 100 : 0;
  
  const seventyPercentRule = purchasePrice + rehabBudget <= arv * 0.7;
  const onePercentRule = rentEstimate >= purchasePrice * 0.01;
  
  let score = 0;
  if (seventyPercentRule) score += 30;
  if (onePercentRule) score += 25;
  if (monthlyCashFlow > 0) score += 25;
  if (cashOnCash > 10) score += 20;
  
  const grade = score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D";

  return {
    totalInvested,
    monthlyCashFlow,
    cashOnCash,
    seventyPercentRule,
    onePercentRule,
    score,
    grade
  };
};

const makeNewDeal = () => ({
  id: `deal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  address: "",
  city: "Columbus", // Default to a high-cap rate market
  state: "OH",
  propertyType: "Single Family",
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1500,
  purchasePrice: 165000, // Adjusted for national average
  rehabBudget: 30000,
  arv: 215000,
  rentEstimate: 1350,
  downPayment: 25,
  status: "analyzing",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  notes: ""
});

const StatRow = ({ label, value, valueColor, mono = true }) => (
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0"
  }}>
    <div style={{ fontSize: 12, color: THEME.textMuted }}>{label}</div>
    <div style={{
      fontSize: 13,
      color: valueColor || THEME.text,
      fontFamily: mono ? "monospace" : "inherit",
      fontWeight: 500
    }}>
      {value}
    </div>
  </div>
);

const Panel = ({ title, icon, children }) => (
  <div style={{
    background: THEME.bgPanel,
    border: `1px solid ${THEME.border}`,
    borderRadius: 8
  }}>
    {title && (
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "14px 18px",
        borderBottom: `1px solid ${THEME.border}`
      }}>
        {icon}
        <span className="label-xs">{title}</span>
      </div>
    )}
    <div style={{ padding: 18 }}>{children}</div>
  </div>
);

const Header = ({ view, setView, dealCount }) => {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={14} /> },
    { id: "analyzer", label: "Deal Analyzer", icon: <Calculator size={14} /> },
    { id: "education", label: "Education", icon: <BookOpen size={14} /> },
    { id: "market", label: "Market Intel", icon: <MapPin size={14} /> }
  ];
  
  return (
    <header style={{
      borderBottom: `1px solid ${THEME.border}`,
      background: THEME.bg,
      position: "sticky",
      top: 0,
      zIndex: 10
    }}>
      <div style={{
        maxWidth: 1400,
        margin: "0 auto",
        padding: "18px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24
      }}>
        <div style={{
          display: "flex",
          alignItems: "baseline",
          gap: 14
        }}>
          <div style={{
            fontSize: 26,
            fontWeight: 500,
            color: THEME.text,
            fontFamily: "Fraunces, serif"
          }}>
            DealTrack
          </div>
          <div style={{
            width: 1, 
            height: 16, 
            background: THEME.border
          }} />
          <div className="label-xs" style={{ color: THEME.accent }}>
            BRRRR // NATIONWIDE
          </div>
        </div>
        
        <nav style={{ display: "flex", gap: 4 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              style={{
                padding: "8px 14px",
                fontSize: 13,
                color: view === t.id ? THEME.accent : THEME.textMuted,
                borderBottom: `2px solid ${view === t.id ? THEME.accent : "transparent"}`,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontWeight: view === t.id ? 600 : 400
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

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
          
          <button onClick={onNewDeal} className="btn-primary">
            <Plus size={16} /> Add First Deal
          </button>
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
        <button onClick={onNewDeal} className="btn-primary">
          <Plus size={16} /> New Deal
        </button>
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
                  className="btn-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 16 }}>
                {deal.city} • {deal.propertyType}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <StatRow label="Purchase" value={fmtUSD(deal.purchasePrice)} />
                <StatRow label="ARV" value={fmtUSD(deal.arv)} />
                <StatRow 
                  label="Cash Flow" 
                  value={`$${Math.round(metrics.monthlyCashFlow)}/mo`}
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

const Analyzer = ({ deal, onUpdate, onSave, onBack, onDelete, isDirty }) => {
  const metrics = calcMetrics(deal);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 32
      }}>
        <button onClick={onBack} className="btn-ghost">
          <ArrowRight size={16} style={{ transform: "rotate(180deg)" }} /> Back
        </button>
        
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onDelete} className="btn-danger">
            <Trash2 size={16} /> Delete
          </button>
          <button onClick={onSave} className="btn-primary" disabled={!isDirty}>
            <Save size={16} /> {isDirty ? "Save" : "Saved"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        <div>
          <Panel title="Property Details" icon={<Home size={16} />}>
            <div style={{ marginBottom: 14 }}>
              <div className="label-xs" style={{ marginBottom: 6 }}>Address</div>
              <input
                type="text"
                value={deal.address}
                onChange={(e) => onUpdate({address: e.target.value})}
                placeholder="123 Main St"
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  fontSize: 13,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 4
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <div className="label-xs" style={{ marginBottom: 6 }}>City</div>
                <input
                  type="text"
                  value={deal.city}
                  onChange={(e) => onUpdate({city: e.target.value})}
                  placeholder="Columbus"
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
                <div className="label-xs" style={{ marginBottom: 6 }}>State</div>
                <select
                  value={deal.state || "OH"}
                  onChange={(e) => onUpdate({state: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "9px 10px",
                    fontSize: 13,
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 4
                  }}
                >
                  <option value="AL">AL</option>
                  <option value="AZ">AZ</option>
                  <option value="AR">AR</option>
                  <option value="CA">CA</option>
                  <option value="CO">CO</option>
                  <option value="CT">CT</option>
                  <option value="DE">DE</option>
                  <option value="FL">FL</option>
                  <option value="GA">GA</option>
                  <option value="ID">ID</option>
                  <option value="IL">IL</option>
                  <option value="IN">IN</option>
                  <option value="IA">IA</option>
                  <option value="KS">KS</option>
                  <option value="KY">KY</option>
                  <option value="LA">LA</option>
                  <option value="ME">ME</option>
                  <option value="MD">MD</option>
                  <option value="MA">MA</option>
                  <option value="MI">MI</option>
                  <option value="MN">MN</option>
                  <option value="MS">MS</option>
                  <option value="MO">MO</option>
                  <option value="MT">MT</option>
                  <option value="NE">NE</option>
                  <option value="NV">NV</option>
                  <option value="NH">NH</option>
                  <option value="NJ">NJ</option>
                  <option value="NM">NM</option>
                  <option value="NY">NY</option>
                  <option value="NC">NC</option>
                  <option value="ND">ND</option>
                  <option value="OH">OH</option>
                  <option value="OK">OK</option>
                  <option value="OR">OR</option>
                  <option value="PA">PA</option>
                  <option value="RI">RI</option>
                  <option value="SC">SC</option>
                  <option value="SD">SD</option>
                  <option value="TN">TN</option>
                  <option value="TX">TX</option>
                  <option value="UT">UT</option>
                  <option value="VT">VT</option>
                  <option value="VA">VA</option>
                  <option value="WA">WA</option>
                  <option value="WV">WV</option>
                  <option value="WI">WI</option>
                  <option value="WY">WY</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div className="label-xs" style={{ marginBottom: 6 }}>Purchase Price</div>
                <input
                  type="number"
                  value={deal.purchasePrice}
                  onChange={(e) => onUpdate({purchasePrice: parseInt(e.target.value) || 0})}
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
                <div className="label-xs" style={{ marginBottom: 6 }}>Rehab Budget</div>
                <input
                  type="number"
                  value={deal.rehabBudget}
                  onChange={(e) => onUpdate({rehabBudget: parseInt(e.target.value) || 0})}
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
                <div className="label-xs" style={{ marginBottom: 6 }}>ARV</div>
                <input
                  type="number"
                  value={deal.arv}
                  onChange={(e) => onUpdate({arv: parseInt(e.target.value) || 0})}
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
                <div className="label-xs" style={{ marginBottom: 6 }}>Rent Estimate</div>
                <input
                  type="number"
                  value={deal.rentEstimate}
                  onChange={(e) => onUpdate({rentEstimate: parseInt(e.target.value) || 0})}
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
          </Panel>
        </div>

        <div>
          <Panel title="Investment Analysis" icon={<Calculator size={16} />}>
            <StatRow 
              label="Total Investment" 
              value={fmtUSD(metrics.totalInvested)} 
            />
            <StatRow 
              label="Monthly Cash Flow" 
              value={`$${Math.round(metrics.monthlyCashFlow)}`}
              valueColor={metrics.monthlyCashFlow > 0 ? THEME.green : THEME.red}
            />
            <StatRow 
              label="Cash on Cash ROI" 
              value={`${metrics.cashOnCash.toFixed(1)}%`}
              valueColor={metrics.cashOnCash > 8 ? THEME.green : THEME.textMuted}
            />
            
            <div style={{
              marginTop: 20,
              padding: 16,
              background: THEME.bgRaised,
              borderRadius: 6,
              textAlign: "center"
            }}>
              <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 4 }}>
                BRRRR SCORE
              </div>
              <div style={{
                fontSize: 32,
                fontWeight: 700,
                color: metrics.score >= 70 ? THEME.green : metrics.score >= 50 ? THEME.orange : THEME.red
              }}>
                {metrics.score}
              </div>
              <div style={{ fontSize: 13, color: THEME.textMuted }}>
                Grade: {metrics.grade}
              </div>
            </div>

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
        </div>
      </div>
    </div>
  );
};

const EducationCenter = () => (
  <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 32px" }}>
    <h1 style={{ fontSize: 28, marginBottom: 32 }}>BRRRR Education Center</h1>
    
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
      <Panel title="What is BRRRR?" icon={<BookOpen size={16} />}>
        <p style={{ lineHeight: 1.6, fontSize: 14 }}>
          <strong>Buy</strong> distressed properties below market value.<br/>
          <strong>Rehab</strong> to increase value and rent potential.<br/>
          <strong>Rent</strong> to generate monthly cash flow.<br/>
          <strong>Refinance</strong> to pull out invested capital.<br/>
          <strong>Repeat</strong> the process to scale your portfolio.
        </p>
      </Panel>

      <Panel title="70% Rule" icon={<Calculator size={16} />}>
        <p style={{ lineHeight: 1.6, fontSize: 14 }}>
          Purchase Price + Rehab ≤ 70% × ARV<br/><br/>
          This ensures you have enough equity after rehab to refinance 
          and recover most of your invested capital.
        </p>
      </Panel>

      <Panel title="1% Rule" icon={<Percent size={16} />}>
        <p style={{ lineHeight: 1.6, fontSize: 14 }}>
          Monthly Rent ≥ 1% × Purchase Price<br/><br/>
          A quick screening tool to identify properties that 
          are likely to generate positive cash flow after expenses.
        </p>
      </Panel>
    </div>
  </div>
);

const MarketIntel = () => {
  const [selectedRegion, setSelectedRegion] = useState("southeast");
  const [selectedState, setSelectedState] = useState("all");

  const nationalMarkets = {
    southeast: {
      name: "Southeast",
      states: {
        florida: [
          { city: "Orlando", state: "FL", medianPrice: "$320K", medianRent: "$1,850", priceGrowth: "+12.5%", rentGrowth: "+18%", capRate: "7.2%" },
          { city: "Tampa", state: "FL", medianPrice: "$365K", medianRent: "$2,100", priceGrowth: "+9.8%", rentGrowth: "+14%", capRate: "6.8%" },
          { city: "Jacksonville", state: "FL", medianPrice: "$285K", medianRent: "$1,650", priceGrowth: "+11.2%", rentGrowth: "+16%", capRate: "8.1%" },
          { city: "Miami", state: "FL", medianPrice: "$485K", medianRent: "$2,650", priceGrowth: "+6.1%", rentGrowth: "+9%", capRate: "5.9%" }
        ],
        georgia: [
          { city: "Atlanta", state: "GA", medianPrice: "$285K", medianRent: "$1,750", priceGrowth: "+10.3%", rentGrowth: "+13%", capRate: "7.8%" },
          { city: "Savannah", state: "GA", medianPrice: "$245K", medianRent: "$1,450", priceGrowth: "+12.1%", rentGrowth: "+15%", capRate: "8.5%" }
        ],
        northCarolina: [
          { city: "Charlotte", state: "NC", medianPrice: "$265K", medianRent: "$1,550", priceGrowth: "+9.7%", rentGrowth: "+12%", capRate: "8.2%" },
          { city: "Raleigh", state: "NC", medianPrice: "$295K", medianRent: "$1,650", priceGrowth: "+8.9%", rentGrowth: "+11%", capRate: "7.9%" }
        ],
        southCarolina: [
          { city: "Charleston", state: "SC", medianPrice: "$425K", medianRent: "$2,250", priceGrowth: "+7.5%", rentGrowth: "+10%", capRate: "6.8%" },
          { city: "Columbia", state: "SC", medianPrice: "$185K", medianRent: "$1,250", priceGrowth: "+11.4%", rentGrowth: "+14%", capRate: "9.1%" }
        ],
        tennessee: [
          { city: "Nashville", state: "TN", medianPrice: "$385K", medianRent: "$2,100", priceGrowth: "+8.2%", rentGrowth: "+11%", capRate: "7.1%" },
          { city: "Memphis", state: "TN", medianPrice: "$145K", medianRent: "$1,150", priceGrowth: "+9.8%", rentGrowth: "+13%", capRate: "10.2%" }
        ]
      }
    },
    northeast: {
      name: "Northeast", 
      states: {
        newYork: [
          { city: "Buffalo", state: "NY", medianPrice: "$165K", medianRent: "$1,200", priceGrowth: "+7.8%", rentGrowth: "+10%", capRate: "9.8%" },
          { city: "Rochester", state: "NY", medianPrice: "$145K", medianRent: "$1,100", priceGrowth: "+8.5%", rentGrowth: "+11%", capRate: "10.1%" },
          { city: "Syracuse", state: "NY", medianPrice: "$135K", medianRent: "$1,050", priceGrowth: "+9.2%", rentGrowth: "+12%", capRate: "10.5%" }
        ],
        newJersey: [
          { city: "Newark", state: "NJ", medianPrice: "$285K", medianRent: "$2,100", priceGrowth: "+5.8%", rentGrowth: "+8%", capRate: "7.2%" },
          { city: "Camden", state: "NJ", medianPrice: "$125K", medianRent: "$1,200", priceGrowth: "+8.9%", rentGrowth: "+11%", capRate: "11.5%" }
        ],
        pennsylvania: [
          { city: "Philadelphia", state: "PA", medianPrice: "$195K", medianRent: "$1,450", priceGrowth: "+6.8%", rentGrowth: "+9%", capRate: "8.9%" },
          { city: "Pittsburgh", state: "PA", medianPrice: "$145K", medianRent: "$1,150", priceGrowth: "+7.5%", rentGrowth: "+10%", capRate: "9.7%" }
        ]
      }
    },
    midwest: {
      name: "Midwest",
      states: {
        ohio: [
          { city: "Columbus", state: "OH", medianPrice: "$215K", medianRent: "$1,350", priceGrowth: "+8.9%", rentGrowth: "+11%", capRate: "9.2%" },
          { city: "Cleveland", state: "OH", medianPrice: "$165K", medianRent: "$1,150", priceGrowth: "+9.5%", rentGrowth: "+12%", capRate: "10.1%" },
          { city: "Cincinnati", state: "OH", medianPrice: "$185K", medianRent: "$1,250", priceGrowth: "+8.2%", rentGrowth: "+10%", capRate: "9.5%" },
          { city: "Toledo", state: "OH", medianPrice: "$95K", medianRent: "$850", priceGrowth: "+10.1%", rentGrowth: "+13%", capRate: "11.8%" }
        ],
        michigan: [
          { city: "Detroit", state: "MI", medianPrice: "$85K", medianRent: "$950", priceGrowth: "+11.2%", rentGrowth: "+14%", capRate: "13.1%" },
          { city: "Grand Rapids", state: "MI", medianPrice: "$195K", medianRent: "$1,350", priceGrowth: "+8.7%", rentGrowth: "+11%", capRate: "9.3%" }
        ],
        illinois: [
          { city: "Chicago", state: "IL", medianPrice: "$285K", medianRent: "$1,850", priceGrowth: "+4.2%", rentGrowth: "+7%", capRate: "7.8%" },
          { city: "Rockford", state: "IL", medianPrice: "$125K", medianRent: "$950", priceGrowth: "+9.8%", rentGrowth: "+12%", capRate: "10.7%" }
        ],
        indiana: [
          { city: "Indianapolis", state: "IN", medianPrice: "$165K", medianRent: "$1,200", priceGrowth: "+9.1%", rentGrowth: "+12%", capRate: "9.8%" },
          { city: "Fort Wayne", state: "IN", medianPrice: "$135K", medianRent: "$1,050", priceGrowth: "+10.3%", rentGrowth: "+13%", capRate: "10.4%" }
        ]
      }
    },
    west: {
      name: "West",
      states: {
        texas: [
          { city: "Houston", state: "TX", medianPrice: "$245K", medianRent: "$1,650", priceGrowth: "+7.8%", rentGrowth: "+10%", capRate: "8.1%" },
          { city: "Dallas", state: "TX", medianPrice: "$285K", medianRent: "$1,850", priceGrowth: "+6.9%", rentGrowth: "+9%", capRate: "7.6%" },
          { city: "San Antonio", state: "TX", medianPrice: "$195K", medianRent: "$1,450", priceGrowth: "+8.5%", rentGrowth: "+11%", capRate: "8.9%" },
          { city: "Austin", state: "TX", medianPrice: "$465K", medianRent: "$2,350", priceGrowth: "+5.2%", rentGrowth: "+8%", capRate: "6.2%" }
        ],
        arizona: [
          { city: "Phoenix", state: "AZ", medianPrice: "$385K", medianRent: "$2,100", priceGrowth: "+8.7%", rentGrowth: "+11%", capRate: "6.9%" },
          { city: "Tucson", state: "AZ", medianPrice: "$285K", medianRent: "$1,550", priceGrowth: "+9.8%", rentGrowth: "+12%", capRate: "7.8%" }
        ],
        colorado: [
          { city: "Denver", state: "CO", medianPrice: "$485K", medianRent: "$2,450", priceGrowth: "+6.1%", rentGrowth: "+9%", capRate: "6.1%" },
          { city: "Colorado Springs", state: "CO", medianPrice: "$385K", medianRent: "$1,950", priceGrowth: "+7.8%", rentGrowth: "+10%", capRate: "6.8%" }
        ]
      }
    }
  };

  const getDisplayMarkets = () => {
    if (selectedState === "all") {
      return Object.values(nationalMarkets[selectedRegion].states).flat();
    } else {
      return nationalMarkets[selectedRegion].states[selectedState] || [];
    }
  };

  const displayMarkets = getDisplayMarkets();

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 32px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>National Market Intelligence</h1>
      <p style={{ color: THEME.textMuted, marginBottom: 32, fontSize: 16 }}>
        BRRRR investment opportunities across all major US markets
      </p>
      
      {/* Region & State Filters */}
      <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
        <div>
          <div className="label-xs" style={{ marginBottom: 6 }}>REGION</div>
          <select
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setSelectedState("all");
            }}
            style={{
              padding: "8px 12px",
              border: `1px solid ${THEME.border}`,
              borderRadius: 4,
              background: THEME.bgInput,
              fontSize: 14,
              minWidth: 150
            }}
          >
            <option value="southeast">Southeast</option>
            <option value="northeast">Northeast</option>
            <option value="midwest">Midwest</option>
            <option value="west">West</option>
          </select>
        </div>
        
        <div>
          <div className="label-xs" style={{ marginBottom: 6 }}>STATE</div>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            style={{
              padding: "8px 12px",
              border: `1px solid ${THEME.border}`,
              borderRadius: 4,
              background: THEME.bgInput,
              fontSize: 14,
              minWidth: 150
            }}
          >
            <option value="all">All States</option>
            {Object.keys(nationalMarkets[selectedRegion].states).map(state => (
              <option key={state} value={state}>
                {state.charAt(0).toUpperCase() + state.slice(1).replace(/([A-Z])/g, ' $1')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Market Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
        gap: 20 
      }}>
        {displayMarkets.map((market, index) => (
          <Panel 
            key={`${market.city}-${market.state}`}
            title={`${market.city}, ${market.state}`} 
            icon={<MapPin size={16} />}
          >
            <StatRow 
              label="Median Price" 
              value={market.medianPrice} 
              valueColor={THEME.text}
            />
            <StatRow 
              label="Median Rent" 
              value={market.medianRent} 
              valueColor={THEME.text}
            />
            <StatRow 
              label="Price Growth" 
              value={market.priceGrowth} 
              valueColor={market.priceGrowth.startsWith('+') ? THEME.green : THEME.red} 
            />
            <StatRow 
              label="Rent Growth" 
              value={market.rentGrowth} 
              valueColor={market.rentGrowth.startsWith('+') ? THEME.green : THEME.red} 
            />
            <StatRow 
              label="Cap Rate" 
              value={market.capRate} 
              valueColor={THEME.accent} 
            />
          </Panel>
        ))}
      </div>

      {/* Market Summary */}
      <div style={{ marginTop: 40 }}>
        <Panel title="Market Summary" icon={<TrendingUp size={16} />}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: THEME.accent }}>
                {displayMarkets.length}
              </div>
              <div style={{ fontSize: 12, color: THEME.textMuted }}>
                Markets Tracked
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: THEME.secondary }}>
                {nationalMarkets[selectedRegion].name}
              </div>
              <div style={{ fontSize: 12, color: THEME.textMuted }}>
                Current Region
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: THEME.green }}>
                50+
              </div>
              <div style={{ fontSize: 12, color: THEME.textMuted }}>
                US Markets Available
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default function BRRRRTracker() {
  const [deals, setDeals] = useState([]);
  const [view, setView] = useState("dashboard");
  const [activeDealId, setActiveDealId] = useState(null);
  const [draftDeal, setDraftDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

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

  useEffect(() => {
    if (!loading) {
      localStorage.setItem("dealtrack-deals", JSON.stringify(deals));
    }
  }, [deals, loading]);

  const onNewDeal = useCallback(() => {
    const newDeal = makeNewDeal();
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
    setDraftDeal(prev => ({ ...prev, ...updates }));
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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh"
      }}>
        <style>{STYLE_TAG}</style>
        <div style={{ color: THEME.textMuted, fontSize: 13 }}>
          Loading DealTrack...
        </div>
      </div>
    );
  }

  return (
    <div className="brrrr-root">
      <style>{STYLE_TAG}</style>
      <Header 
        view={view} 
        setView={(v) => {
          if (v !== "analyzer" && isDirty) {
            if (!confirm("Discard unsaved changes?")) return;
            setIsDirty(false);
          }
          if (v === "analyzer" && !activeDealId) {
            onNewDeal();
            return;
          }
          setView(v);
        }} 
        dealCount={deals.length} 
      />

      {view === "dashboard" && (
        <Dashboard
          deals={deals}
          onNewDeal={onNewDeal}
          onOpenDeal={onOpenDeal}
          onDeleteDeal={onDeleteDeal}
        />
      )}

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

      {view === "education" && <EducationCenter />}

      {view === "market" && <MarketIntel />}

      <footer style={{
        marginTop: 60,
        padding: "20px 32px",
        borderTop: `1px solid ${THEME.border}`,
        maxWidth: 1400,
        margin: "60px auto 0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 20,
        fontSize: 11,
        color: THEME.textDim
      }}>
        <div>
          DealTrack is a professional nationwide real estate analysis tool for BRRRR investment strategy. 
          Covering all major US markets with real-time data. All calculations are estimates for decision support. Not financial or legal advice.
        </div>
        <div>
          DealTrack © 2026
        </div>
      </footer>
    </div>
  );
}
