/* ============================================================================
   ANALYZER — the deep-dive deal view with six tabbed sections.
   ============================================================================ */
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search, Hammer, DollarSign, Home, PiggyBank, Target,
  BarChart3, ChevronRight, FileDown, Save, Trash2, FileText,
  ChevronDown, FileSpreadsheet, FileType, Sparkles, Check, X
} from "lucide-react";
import { THEME } from "../theme.js";
import { calcMetrics, fmtUSD, isMobile } from "../utils.js";
import { NumberField, StatRow, Panel, CalcTooltip, PercentDollarField } from "../primitives.jsx";
import { DEAL_STATUSES, DEAL_STATUS_ORDER, getDealStatus, StatusChip } from "../deals.jsx";
import { AcquisitionSection } from "./AcquisitionSection.jsx";
import { RehabSection } from "./RehabSection.jsx";
import { RefinanceSection } from "./RefinanceSection.jsx";
import { ExitStrategyComparisons } from "./ExitStrategyComparisons.jsx";
import { CostBreakdown } from "./CostBreakdown.jsx";
import { StrategyRecommendation } from "./StrategyRecommendation.jsx";
import { InspectionPanel } from "../inspection/InspectionPanel.jsx";

export const Analyzer = ({ deal, onUpdate, onSave, onBack, onDelete, onPdfError, onPdfSuccess, isDirty }) => {
  // Workflow follows the actual investor process: enter terms → plan rehab
  // → reconcile costs → set rents → refinance → choose an exit. Inspection
  // and Summary live at the end — Inspection is reference-only, Summary is
  // the recap once all the inputs are in. Defaulting to Acquisition keeps
  // a fresh deal pointing at the first thing you actually fill in.
  const [section, setSection] = useState("acquisition");
  const metrics = useMemo(() => calcMetrics(deal), [deal]);

  const sections = [
    { key: "acquisition", label: "Acquisition", icon: <Search size={14} /> },
    { key: "rehab",       label: "Rehab",       icon: <Hammer size={14} /> },
    { key: "costs",       label: "Costs",       icon: <DollarSign size={14} /> },
    { key: "rent",        label: "Rent",        icon: <Home size={14} /> },
    { key: "refinance",   label: "Refinance",   icon: <PiggyBank size={14} /> },
    { key: "exit",        label: "Exit",        icon: <Target size={14} /> },
    { key: "inspection",  label: "Inspection",  icon: <FileText size={14} /> },
    { key: "summary",     label: "Summary",     icon: <Sparkles size={14} /> }
  ];

  // Comprehensive deal exports — PDF/Excel/Word, lazy-loaded so the
  // exceljs+docx libs (~350KB) don't ship in the main bundle.
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);
  useEffect(() => {
    if (!exportOpen) return;
    const close = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [exportOpen]);

  const runExport = (fnName) => async () => {
    setExportOpen(false);
    try {
      const mod = await import("../lib/exports.js");
      await mod[fnName](deal, metrics);
      onPdfSuccess?.(`Exported as ${fnName.endsWith("PDF") ? "PDF" : fnName.endsWith("Excel") ? "Excel" : "Word"}`);
    } catch (err) {
      console.error("Deal export failed:", err);
      onPdfError?.(err?.message || "Export failed — try again or check the console.");
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 className="serif" style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
              {deal.address || "New Deal Analysis"}
            </h1>
            <StatusChip status={getDealStatus(deal)} size="md" />
            {isDirty && (
              <span style={{
                padding: "3px 8px", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.08em", textTransform: "uppercase",
                background: THEME.bgOrange, color: THEME.orange, borderRadius: 4
              }}>
                Unsaved
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: THEME.textMuted, marginTop: 4 }}>
            {deal.city}, {deal.state} • {deal.propertyType}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: THEME.textMuted }}>Status</span>
            <select
              value={getDealStatus(deal)}
              onChange={(e) => onUpdate({ status: e.target.value })}
              style={{ padding: "7px 10px", fontSize: 12, borderRadius: 6 }}
            >
              {DEAL_STATUS_ORDER.map(key => (
                <option key={key} value={key}>{DEAL_STATUSES[key].label}</option>
              ))}
            </select>
          </label>
          <div ref={exportRef} style={{ position: "relative", display: "inline-block" }}>
            <button className="btn-accent-orange" onClick={() => setExportOpen(o => !o)}>
              <FileDown size={14} />
              Export <ChevronDown size={12} />
            </button>
            {exportOpen && (
              <div role="menu" style={{
                position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 100,
                background: THEME.bg, border: `1px solid ${THEME.border}`,
                borderRadius: 6, boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                minWidth: 170, padding: 4
              }}>
                {[
                  { label: "PDF",   icon: <FileDown size={13} />,        fn: "exportDealPDF"   },
                  { label: "Excel", icon: <FileSpreadsheet size={13} />, fn: "exportDealExcel" },
                  { label: "Word",  icon: <FileType size={13} />,        fn: "exportDealWord"  }
                ].map(opt => (
                  <button key={opt.label}
                    onClick={runExport(opt.fn)}
                    style={{
                      width: "100%", textAlign: "left",
                      padding: "7px 10px", fontSize: 12,
                      background: "transparent", border: "none", borderRadius: 4,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                      color: THEME.text
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = THEME.bgPanel; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="btn-primary" onClick={onSave}>
            <Save size={14} />
            Save Deal
          </button>
          {onDelete && (
            <button className="btn-danger" onClick={onDelete} style={{ padding: "8px 12px" }} aria-label="Delete deal">
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
            <div style={{ fontSize: 22, fontWeight: 700, color: THEME.teal }}>
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
            <div style={{
              fontSize: 22, fontWeight: 700,
              color: metrics.score >= 80 ? THEME.green
                   : metrics.score >= 70 ? THEME.teal
                   : metrics.score >= 60 ? THEME.accent
                   : metrics.score >= 50 ? THEME.orange
                                         : THEME.red
            }}>
              {metrics.score}/100 <span style={{ fontSize: 14 }}>({metrics.grade})</span>
            </div>
          </div>
        </div>
      </Panel>

      {/* Workflow strip — chevrons between tabs make the sequence obvious
          ("do these in order"). Tabs still wrap on small screens; chevrons
          wrap with them, which is fine — they're muted and small. */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {sections.map((s, i) => (
          <React.Fragment key={s.key}>
            <button
              onClick={() => setSection(s.key)}
              style={{
                padding: "10px 14px", fontSize: 13, fontWeight: 600,
                background: section === s.key ? THEME.accent : THEME.bgPanel,
                color: section === s.key ? THEME.bg : THEME.text,
                border: `1px solid ${section === s.key ? THEME.accent : THEME.border}`,
                borderRadius: 6,
                display: "flex", alignItems: "center", gap: 6, cursor: "pointer"
              }}
            >
              <span style={{
                fontSize: 10, fontWeight: 700, opacity: 0.7,
                color: section === s.key ? THEME.bg : THEME.textMuted
              }}>
                {i + 1}
              </span>
              {s.icon}
              {s.label}
            </button>
            {i < sections.length - 1 && (
              <ChevronRight size={14} color={THEME.textDim} aria-hidden="true" style={{ flexShrink: 0 }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {section === "summary" && (
        <StrategyRecommendation deal={deal} metrics={metrics} onUpdate={onUpdate} />
      )}
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
            <PercentDollarField
              label="Property Tax (Annual)"
              value={deal.propertyTax}
              base={(deal.rentEstimate || 0) * 12}
              baseLabel="of annual rent"
              onChange={(val) => onUpdate({ propertyTax: val })}
            />
            <PercentDollarField
              label="Insurance (Annual)"
              value={deal.insurance}
              base={(deal.rentEstimate || 0) * 12}
              baseLabel="of annual rent"
              onChange={(val) => onUpdate({ insurance: val })}
            />
            <PercentDollarField
              label="CapEx Reserve (Monthly)"
              value={deal.capex}
              base={deal.rentEstimate || 0}
              onChange={(val) => onUpdate({ capex: val })}
              helper="Long-term replacement reserves"
            />
            <PercentDollarField
              label="Repairs & Maintenance (Monthly)"
              value={deal.repairMaintenance}
              base={deal.rentEstimate || 0}
              onChange={(val) => onUpdate({ repairMaintenance: val })}
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
            <PercentDollarField
              label="HOA (Monthly)"
              value={deal.hoa}
              base={deal.rentEstimate || 0}
              onChange={(val) => onUpdate({ hoa: val })}
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
            <StatRow label="1% Rule"
              value={metrics.onePercentRule
                ? <Check size={18} color={THEME.green} aria-label="Pass" />
                : <X size={18} color={THEME.red} aria-label="Fail" />}
              mono={false}
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
      {section === "inspection" && (
        <InspectionPanel
          context="deal"
          contextId={deal.id}
          propertyAddress={deal.address || deal.title || null}
        />
      )}
    </div>
  );
};
