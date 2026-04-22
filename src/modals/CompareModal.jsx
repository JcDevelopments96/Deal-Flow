/* ============================================================================
   COMPARE DEALS MODAL — up to 3 deals side-by-side. Best-per-row highlighted;
   overall winner is the highest deal-score.
   ============================================================================ */
import React, { useEffect, useMemo } from "react";
import { X, Trophy, ChevronRight } from "lucide-react";
import { THEME } from "../theme.js";
import { calcMetrics, fmtUSD } from "../utils.js";
import { DEAL_STATUSES, getDealStatus } from "../deals.jsx";

export const COMPARE_ROWS = [
  { label: "Status", get: (d) => DEAL_STATUSES[getDealStatus(d)]?.label || "—", higherIsBetter: null, fmt: null },
  { label: "Purchase Price", get: (d) => d.purchasePrice, higherIsBetter: false, fmt: fmtUSD },
  { label: "Rehab Budget",   get: (d) => d.rehabBudget,   higherIsBetter: false, fmt: fmtUSD },
  { label: "ARV",            get: (d, m) => d.arv,        higherIsBetter: true,  fmt: fmtUSD },
  { label: "Total All-In",   get: (d, m) => m.totalAllIn, higherIsBetter: false, fmt: fmtUSD },
  { label: "All-In / ARV %", get: (d, m) => m.allInToArv, higherIsBetter: false, fmt: (v) => `${(v || 0).toFixed(1)}%` },
  { label: "Monthly Rent",   get: (d) => d.rentEstimate,  higherIsBetter: true,  fmt: fmtUSD },
  { label: "Monthly Cash Flow", get: (d, m) => m.monthlyCashFlow, higherIsBetter: true, fmt: fmtUSD },
  { label: "Annual Cash Flow",  get: (d, m) => m.annualCashFlow,  higherIsBetter: true, fmt: fmtUSD },
  { label: "Cap Rate",       get: (d, m) => m.capRate,     higherIsBetter: true, fmt: (v) => `${(v || 0).toFixed(1)}%` },
  { label: "Cash-on-Cash",   get: (d, m) => m.cashOnCash,  higherIsBetter: true, fmt: (v) => `${(v || 0).toFixed(1)}%` },
  { label: "Deal Score",     get: (d, m) => m.score,       higherIsBetter: true, fmt: (v) => `${v}/100` },
  { label: "Grade",          get: (d, m) => m.grade,       higherIsBetter: null, fmt: null },
  { label: "70% Rule",       get: (d, m) => m.seventyPercentRule ? "PASS" : "FAIL", higherIsBetter: null, fmt: null },
  { label: "1% Rule",        get: (d, m) => m.onePercentRule ? "PASS" : "FAIL",     higherIsBetter: null, fmt: null }
];

export const CompareModal = ({ deals, onClose, onOpenDeal }) => {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const metrics = useMemo(() => deals.map(d => ({ d, m: calcMetrics(d) })), [deals]);

  // Overall winner: highest deal-score
  const overallWinnerId = useMemo(() => {
    if (metrics.length === 0) return null;
    return metrics.reduce((best, cur) => (cur.m.score > best.m.score ? cur : best)).d.id;
  }, [metrics]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-title"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 150, padding: 16, overflowY: "auto"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: THEME.bg, borderRadius: 12,
          maxWidth: 1100, width: "100%",
          marginTop: 40, marginBottom: 40,
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.22)",
          animation: "modalFadeIn 0.2s ease-out",
          overflow: "hidden"
        }}
      >
        <div style={{
          padding: "16px 24px", borderBottom: `1px solid ${THEME.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10
        }}>
          <div>
            <h2 id="compare-title" className="serif" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              Compare Deals ({deals.length})
            </h2>
            <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 2 }}>
              Best value in each row is highlighted. Overall winner: best deal score.
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close compare"
            style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "transparent", border: `1px solid ${THEME.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: THEME.textMuted, cursor: "pointer"
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 16, overflowX: "auto" }}>
          <table style={{
            width: "100%", borderCollapse: "collapse",
            fontSize: 13, minWidth: 700
          }}>
            <thead>
              <tr>
                <th style={{
                  textAlign: "left", padding: "10px 12px",
                  color: THEME.textMuted, fontSize: 10,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  borderBottom: `1px solid ${THEME.border}`,
                  width: 180, verticalAlign: "bottom"
                }}>
                  Metric
                </th>
                {metrics.map(({ d }) => {
                  const isWinner = d.id === overallWinnerId;
                  return (
                    <th key={d.id} style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      borderBottom: `2px solid ${isWinner ? THEME.green : THEME.border}`,
                      background: isWinner ? THEME.greenDim : "transparent",
                      verticalAlign: "bottom"
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>
                        {d.address || "Untitled"}
                      </div>
                      <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 2 }}>
                        {d.city}, {d.state}
                      </div>
                      {isWinner && (
                        <div style={{
                          marginTop: 6,
                          fontSize: 10, fontWeight: 700,
                          color: THEME.green,
                          textTransform: "uppercase", letterSpacing: "0.1em"
                        }}>
                          <Trophy size={11} style={{ verticalAlign: "middle" }} /> Best Overall
                        </div>
                      )}
                      <button
                        onClick={() => onOpenDeal(d.id)}
                        className="btn-ghost"
                        style={{ marginTop: 8, padding: "4px 10px", fontSize: 11 }}
                      >
                        Open <ChevronRight size={11} />
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map(row => {
                // Determine the winning deal for this row when applicable
                const rawValues = metrics.map(({ d, m }) => row.get(d, m));
                let winnerIdx = -1;
                if (row.higherIsBetter !== null) {
                  const numeric = rawValues.map(v => (typeof v === "number" ? v : Number.NaN));
                  const valid = numeric
                    .map((v, i) => ({ v, i }))
                    .filter(x => Number.isFinite(x.v));
                  if (valid.length > 0) {
                    const target = row.higherIsBetter
                      ? valid.reduce((a, b) => (a.v >= b.v ? a : b))
                      : valid.reduce((a, b) => (a.v <= b.v ? a : b));
                    winnerIdx = target.i;
                  }
                }
                return (
                  <tr key={row.label}>
                    <td style={{
                      padding: "10px 12px",
                      borderBottom: `1px solid ${THEME.borderLight}`,
                      color: THEME.textMuted, fontWeight: 500
                    }}>
                      {row.label}
                    </td>
                    {rawValues.map((v, idx) => {
                      const isWin = idx === winnerIdx;
                      const display = row.fmt ? row.fmt(v) : v;
                      return (
                        <td
                          key={idx}
                          style={{
                            padding: "10px 12px",
                            borderBottom: `1px solid ${THEME.borderLight}`,
                            fontWeight: isWin ? 700 : 500,
                            color: isWin ? THEME.green : THEME.text,
                            background: isWin ? THEME.greenDim : "transparent"
                          }}
                        >
                          {display ?? "—"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
