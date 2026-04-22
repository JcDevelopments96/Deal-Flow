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
  city: "Fort Lauderdale",
  propertyType: "Single Family",
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1500,
  purchasePrice: 180000,
  rehabBudget: 35000,
  arv: 245000,
  rentEstimate: 1950,
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
          fontSize: 26,
          fontWeight: 500,
          color: THEME.text,
          fontFamily: "Fraunces, serif"
        }}>
          DealTrack
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
            Professional BRRRR investment analysis for SE Florida. Track deals, analyze markets, and build your portfolio.
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

const MarketIntel = () => (
  <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 32px" }}>
    <h1 style={{ fontSize: 28, marginBottom: 32 }}>SE Florida Market Intel</h1>
    
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
      <Panel title="Fort Lauderdale" icon={<MapPin size={16} />}>
        <StatRow label="Median Price" value="$385K" />
        <StatRow label="Median Rent" value="$2,100" />
        <StatRow label="Price Growth" value="+8.2%" valueColor={THEME.green} />
        <StatRow label="Rent Growth" value="+12%" valueColor={THEME.green} />
      </Panel>

      <Panel title="Hollywood" icon={<MapPin size={16} />}>
        <StatRow label="Median Price" value="$425K" />
        <StatRow label="Median Rent" value="$2,350" />
        <StatRow label="Price Growth" value="+7.8%" valueColor={THEME.green} />
        <StatRow label="Rent Growth" value="+10%" valueColor={THEME.green} />
      </Panel>

      <Panel title="Pompano Beach" icon={<MapPin size={16} />}>
        <StatRow label="Median Price" value="$295K" />
        <StatRow label="Median Rent" value="$1,850" />
        <StatRow label="Price Growth" value="+11%" valueColor={THEME.green} />
        <StatRow label="Rent Growth" value="+15%" valueColor={THEME.green} />
      </Panel>
    </div>
  </div>
);

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
          DealTrack is a professional real estate analysis tool for BRRRR investment strategy. 
          All calculations are estimates for decision support. Not financial or legal advice.
        </div>
        <div>
          DealTrack © 2026
        </div>
      </footer>
    </div>
  );
}
