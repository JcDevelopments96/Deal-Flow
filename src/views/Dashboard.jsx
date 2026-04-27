/* ============================================================================
   DASHBOARD — grid of saved deals with search / sort / status filters,
   Recently Viewed strip, Compare mode, and compare modal.
   ============================================================================ */
import React, { useState, useMemo, useCallback } from "react";
import {
  Building2, Search, Plus, Trash2, Clock, Layers, ArrowRight, CheckCircle2,
  Crown, Calculator
} from "lucide-react";
import { THEME } from "../theme.js";
import { calcMetrics, fmtUSD, isMobile } from "../utils.js";
import { DEAL_STATUSES, DEAL_STATUS_ORDER, getDealStatus, StatusChip } from "../deals.jsx";
import { CompareModal } from "../modals/CompareModal.jsx";

export const DASHBOARD_SORT_OPTIONS = [
  { key: "updated", label: "Last Updated" },
  { key: "created", label: "Newest Created" },
  { key: "grade", label: "Deal Grade" },
  { key: "cashflow", label: "Monthly Cash Flow" },
  { key: "coc", label: "Cash-on-Cash %" }
];

export const Dashboard = ({ deals, onOpenDeal, onNewDeal, onDeleteDeal, onChangeView, recentIds = [] }) => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("updated");
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelected, setCompareSelected] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const toggleCompare = useCallback((dealId) => {
    setCompareSelected(prev => {
      if (prev.includes(dealId)) return prev.filter(id => id !== dealId);
      if (prev.length >= 3) return prev; // cap at 3
      return [...prev, dealId];
    });
  }, []);

  const recentDeals = useMemo(
    () => recentIds.map(id => deals.find(d => d.id === id)).filter(Boolean),
    [recentIds, deals]
  );

  // Status counts for the filter chip labels
  const statusCounts = useMemo(() => {
    const counts = { all: deals.length };
    DEAL_STATUS_ORDER.forEach(k => { counts[k] = 0; });
    deals.forEach(d => {
      const s = getDealStatus(d);
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [deals]);

  const filteredSorted = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = deals.filter(d => {
      if (statusFilter !== "all" && getDealStatus(d) !== statusFilter) return false;
      if (!q) return true;
      return (d.address || "").toLowerCase().includes(q) ||
             (d.city || "").toLowerCase().includes(q) ||
             (d.state || "").toLowerCase().includes(q);
    });
    const withMetrics = list.map(d => ({ d, m: calcMetrics(d) }));
    const gradeOrder = { A: 4, "B+": 3, B: 2, C: 1, D: 0 };
    withMetrics.sort((a, b) => {
      switch (sortKey) {
        case "created":   return new Date(b.d.createdAt || 0) - new Date(a.d.createdAt || 0);
        case "grade":     return (gradeOrder[b.m.grade] || 0) - (gradeOrder[a.m.grade] || 0);
        case "cashflow":  return (b.m.monthlyCashFlow || 0) - (a.m.monthlyCashFlow || 0);
        case "coc":       return (b.m.cashOnCash || 0) - (a.m.cashOnCash || 0);
        case "updated":
        default:          return new Date(b.d.updatedAt || 0) - new Date(a.d.updatedAt || 0);
      }
    });
    return withMetrics;
  }, [deals, query, statusFilter, sortKey]);

  if (!deals.length) {
    // Three-card start prompt — gives a brand-new user something to do.
    // The single "Analyze Your First Deal" CTA was a dead-end if the
    // user didn't have a property in mind yet. These three cards map
    // to the actual entry points for sourcing a deal.
    const startCards = [
      {
        key: "find",
        icon: <Search size={22} />,
        title: "Find a property",
        desc: "Browse live MLS listings on the county-level map. Click any pin for full details, flood zone, schools, and rent estimates.",
        cta: "Open the map",
        color: THEME.accent,
        action: () => onChangeView?.("market")
      },
      {
        key: "wholesale",
        icon: <Crown size={22} />,
        title: "Hunt off-market leads",
        desc: "Search by city or ZIP for absentee owners, long-time holders, and pre-foreclosure properties. Skip-trace built in.",
        cta: "Open Off-Market",
        color: "#9333EA",
        action: () => onChangeView?.("wholesale")
      },
      {
        key: "analyze",
        icon: <Calculator size={22} />,
        title: "Analyze a property",
        desc: "Already have a property in mind? Plug in the numbers and get cash flow, ROI, IRR, and a strategy recommendation.",
        cta: "New deal",
        color: THEME.teal,
        action: onNewDeal
      }
    ];

    return (
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        padding: isMobile() ? "32px 16px" : "56px 28px"
      }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, margin: "0 auto 18px",
            borderRadius: 14, background: THEME.bgRaised,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Building2 size={28} color={THEME.accent} />
          </div>
          <h2 className="serif" style={{ fontSize: isMobile() ? 24 : 30, fontWeight: 700, margin: "0 0 8px" }}>
            Welcome to Deal Docket
          </h2>
          <p style={{
            fontSize: 14, color: THEME.textMuted,
            maxWidth: 540, margin: "0 auto", lineHeight: 1.55
          }}>
            You haven't saved any deals yet. Pick one of the three ways most investors get started below — or jump straight into the analyzer if you already have a property in mind.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile() ? "1fr" : "repeat(3, 1fr)",
          gap: 14
        }}>
          {startCards.map(card => (
            <button
              key={card.key}
              onClick={card.action}
              style={{
                textAlign: "left",
                padding: 20,
                background: THEME.bg,
                border: `1px solid ${THEME.border}`,
                borderRadius: 10,
                cursor: "pointer",
                display: "flex", flexDirection: "column", gap: 10,
                height: "100%",
                transition: "border-color 0.15s, transform 0.15s, box-shadow 0.15s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = card.color;
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(15,23,42,0.10)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = THEME.border;
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: card.color, color: "#FFFFFF",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {card.icon}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: THEME.text, marginTop: 4 }}>
                {card.title}
              </div>
              <div style={{ fontSize: 13, color: THEME.textMuted, lineHeight: 1.55, flex: 1 }}>
                {card.desc}
              </div>
              <div style={{
                fontSize: 12, fontWeight: 700,
                color: card.color,
                display: "inline-flex", alignItems: "center", gap: 4,
                marginTop: 4
              }}>
                {card.cta} <ArrowRight size={12} />
              </div>
            </button>
          ))}
        </div>
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
            {filteredSorted.length !== deals.length && (
              <> &middot; showing {filteredSorted.length}</>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={() => {
              setCompareMode(m => !m);
              if (compareMode) setCompareSelected([]);
            }}
            className={compareMode ? "btn-accent-teal" : "btn-secondary"}
            style={{ padding: "8px 14px", fontSize: 12 }}
          >
            <Layers size={13} /> {compareMode ? `Compare (${compareSelected.length})` : "Compare Deals"}
          </button>
          {compareMode && compareSelected.length >= 2 && (
            <button
              onClick={() => setCompareOpen(true)}
              className="btn-primary"
              style={{ padding: "8px 14px", fontSize: 12 }}
            >
              <ArrowRight size={13} /> Open Comparison
            </button>
          )}
        </div>
      </div>

      {/* Recently Viewed strip */}
      {recentDeals.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="label-xs" style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={12} /> Recently Viewed
          </div>
          <div style={{
            display: "flex", gap: 10, overflowX: "auto",
            paddingBottom: 4, WebkitOverflowScrolling: "touch"
          }}>
            {recentDeals.map(deal => {
              const m = calcMetrics(deal);
              return (
                <div
                  key={deal.id}
                  onClick={() => onOpenDeal(deal.id)}
                  style={{
                    flex: "0 0 auto", minWidth: 220, maxWidth: 240,
                    padding: 12,
                    background: THEME.bgPanel,
                    border: `1px solid ${THEME.border}`, borderRadius: 8,
                    cursor: "pointer", transition: "border-color 0.15s ease"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = THEME.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = THEME.border; }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {deal.address || "Untitled"}
                  </div>
                  <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 8 }}>
                    {deal.city}, {deal.state}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <StatusChip status={getDealStatus(deal)} size="sm" />
                    <span className="mono" style={{
                      fontSize: 12, fontWeight: 700,
                      color: m.monthlyCashFlow > 0 ? THEME.green : THEME.red
                    }}>
                      {fmtUSD(m.monthlyCashFlow)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Toolbar — search + sort + status filter chips */}
      <div style={{
        marginBottom: 18, padding: 14,
        background: THEME.bgPanel, border: `1px solid ${THEME.border}`,
        borderRadius: 8,
        display: "grid",
        gridTemplateColumns: isMobile() ? "1fr" : "2fr 1fr",
        gap: 12, alignItems: "end"
      }}>
        <div>
          <div className="label-xs" style={{ marginBottom: 6 }}>Search</div>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{
              position: "absolute", left: 10, top: "50%",
              transform: "translateY(-50%)", color: THEME.textDim
            }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by address, city, or state..."
              style={{ width: "100%", padding: "9px 12px 9px 32px", fontSize: 13 }}
            />
          </div>
        </div>
        <div>
          <div className="label-xs" style={{ marginBottom: 6 }}>Sort by</div>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            style={{ width: "100%", padding: "9px 10px", fontSize: 13 }}
          >
            {DASHBOARD_SORT_OPTIONS.map(o => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Status filter chips */}
      <div style={{
        display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20
      }}>
        {[{ key: "all", label: "All" }, ...DEAL_STATUS_ORDER.map(k => ({ key: k, label: DEAL_STATUSES[k].label }))]
          .filter(opt => opt.key === "all" || statusCounts[opt.key] > 0)
          .map(opt => {
            const active = statusFilter === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setStatusFilter(opt.key)}
                style={{
                  padding: "5px 12px", fontSize: 12, fontWeight: 600,
                  background: active ? THEME.accent : THEME.bg,
                  color: active ? "#fff" : THEME.textMuted,
                  border: `1px solid ${active ? THEME.accent : THEME.border}`,
                  borderRadius: 14, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 6
                }}
              >
                {opt.label}
                <span style={{
                  minWidth: 18, padding: "0 5px", fontSize: 10, fontWeight: 700,
                  background: active ? "rgba(255,255,255,0.25)" : THEME.borderLight,
                  color: active ? "#fff" : THEME.textDim,
                  borderRadius: 9, textAlign: "center"
                }}>
                  {statusCounts[opt.key] ?? 0}
                </span>
              </button>
            );
          })}
      </div>

      {filteredSorted.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: THEME.textMuted, fontSize: 13 }}>
          No deals match the current filters.
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile() ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16
        }}>
          {filteredSorted.map(({ d: deal, m: metrics }) => {
            const isSelected = compareSelected.includes(deal.id);
            return (
            <div
              key={deal.id}
              onClick={() => {
                if (compareMode) toggleCompare(deal.id);
                else onOpenDeal(deal.id);
              }}
              style={{
                padding: 18, background: THEME.bgPanel,
                border: `1px solid ${isSelected ? THEME.teal : THEME.border}`,
                borderRadius: 8,
                cursor: "pointer", transition: "all 0.15s ease",
                position: "relative",
                boxShadow: isSelected ? `0 0 0 2px ${THEME.bgTeal}` : "none"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = isSelected ? THEME.teal : THEME.accent;
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = isSelected ? THEME.teal : THEME.border;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {compareMode && (
                <div
                  aria-label={isSelected ? "Selected for compare" : "Add to compare"}
                  style={{
                    position: "absolute", top: 12, right: 12,
                    width: 22, height: 22, borderRadius: 4,
                    border: `2px solid ${isSelected ? THEME.teal : THEME.border}`,
                    background: isSelected ? THEME.teal : THEME.bg,
                    color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                >
                  {isSelected && <CheckCircle2 size={14} />}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
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
                         metrics.grade === "C" ? THEME.teal : THEME.red,
                  marginRight: compareMode ? 32 : 0
                }}>
                  {metrics.grade}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <StatusChip status={getDealStatus(deal)} size="sm" />
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
                  aria-label="Delete deal"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {compareOpen && (
        <CompareModal
          deals={compareSelected.map(id => deals.find(d => d.id === id)).filter(Boolean)}
          onClose={() => setCompareOpen(false)}
          onOpenDeal={(id) => { setCompareOpen(false); onOpenDeal(id); }}
        />
      )}
    </div>
  );
};
