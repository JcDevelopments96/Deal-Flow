/* ============================================================================
   INSPECTIONS — standalone page for one-off PDF uploads + a unified history
   of every inspection the user has ever uploaded (across deals, watchlist,
   and standalone). Reuses InspectionPanel for the upload+summary flow with
   context="standalone" so people who aren't analyzing a specific deal can
   still get an Ari-generated summary of any inspection PDF.
   ============================================================================ */
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { FileText, Layout, Star, Sparkles } from "lucide-react";
import { THEME } from "../theme.js";
import { isMobile } from "../utils.js";
import { Panel } from "../primitives.jsx";
import { isSaasMode, useSaasUser } from "../lib/saas.js";
import { listAllInspections } from "../lib/inspections.js";
import { InspectionPanel } from "../inspection/InspectionPanel.jsx";

const CONTEXT_META = {
  standalone: { label: "One-off uploads", icon: <Sparkles size={14} />, color: THEME.accent },
  deal:       { label: "From a Deal",     icon: <Layout size={14} />,    color: THEME.teal },
  watchlist:  { label: "From Watchlist",  icon: <Star size={14} />,      color: THEME.orange }
};

const fmtDate = (s) => new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

function HistoryItem({ inspection, onChangeView }) {
  const meta = CONTEXT_META[inspection.context] || CONTEXT_META.standalone;
  const summary = inspection.summary || {};
  const urgentCount = Array.isArray(summary.urgent) ? summary.urgent.length : 0;
  const totalCost = summary.totalEstCostMin != null && summary.totalEstCostMax != null
    ? `$${summary.totalEstCostMin.toLocaleString()} – $${summary.totalEstCostMax.toLocaleString()}`
    : null;

  // Watchlist + Deal items can deep-link back to where they were uploaded
  // from. Standalone items don't have a target.
  const canJump = inspection.context === "watchlist" || inspection.context === "deal";

  return (
    <div style={{
      padding: 12, marginBottom: 8,
      background: THEME.bg, border: `1px solid ${THEME.borderLight}`, borderRadius: 8,
      display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "1fr auto", gap: 12, alignItems: "center"
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <FileText size={13} color={THEME.accent} />
          <span style={{ fontSize: 13, fontWeight: 700, wordBreak: "break-all" }}>
            {inspection.filename}
          </span>
          {inspection.status === "processing" && (
            <span style={{ fontSize: 10, color: THEME.accent, fontWeight: 700 }}>· processing…</span>
          )}
          {inspection.status === "failed" && (
            <span style={{ fontSize: 10, color: THEME.red, fontWeight: 700 }}>· failed</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: THEME.textMuted, lineHeight: 1.5 }}>
          {inspection.property_address || "—"}
          {" · "}
          {fmtDate(inspection.created_at)}
        </div>
        {inspection.status === "complete" && (
          <div style={{ marginTop: 6, fontSize: 11, color: THEME.textMuted, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {urgentCount > 0 && (
              <span style={{ color: THEME.red, fontWeight: 700 }}>⚠ {urgentCount} urgent</span>
            )}
            {totalCost && (
              <span><strong>Est. cost:</strong> {totalCost}</span>
            )}
          </div>
        )}
      </div>
      <div style={{
        display: "flex", flexDirection: "column", alignItems: isMobile() ? "flex-start" : "flex-end", gap: 6
      }}>
        <span style={{
          padding: "3px 9px", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.06em", textTransform: "uppercase",
          background: THEME.bgPanel, color: meta.color,
          border: `1px solid ${meta.color}`, borderRadius: 999,
          display: "inline-flex", alignItems: "center", gap: 4
        }}>
          {meta.icon} {meta.label}
        </span>
        {canJump && onChangeView && (
          <button
            onClick={() => onChangeView(inspection.context === "deal" ? "dashboard" : "watchlist")}
            className="btn-ghost"
            style={{ padding: "4px 8px", fontSize: 10 }}>
            Open {inspection.context === "deal" ? "deal" : "watchlist"} →
          </button>
        )}
      </div>
    </div>
  );
}

export const InspectionsView = ({ onChangeView }) => {
  const saas = useSaasUser();
  const saasOn = isSaasMode();
  const [allInspections, setAllInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!saasOn || !saas.user) { setLoading(false); return; }
    try {
      setLoading(true);
      const list = await listAllInspections(saas.getToken);
      setAllInspections(list);
    } catch (e) { console.warn("inspections list failed:", e); }
    finally { setLoading(false); }
  }, [saasOn, saas.user, saas.getToken]);

  useEffect(() => { load(); }, [load]);

  // Re-fetch when the InspectionPanel below uploads/deletes — easier than
  // threading callbacks through the panel. Listen for its custom event.
  useEffect(() => {
    const handler = () => load();
    window.addEventListener("inspections:changed", handler);
    return () => window.removeEventListener("inspections:changed", handler);
  }, [load]);

  // Bucket inspections by context so the page reads as a clear timeline
  // grouped by source.
  const grouped = useMemo(() => {
    const buckets = { standalone: [], deal: [], watchlist: [] };
    for (const i of allInspections) {
      const k = buckets[i.context] ? i.context : "standalone";
      buckets[k].push(i);
    }
    return buckets;
  }, [allInspections]);

  if (!saasOn || !saas.user) {
    return (
      <div style={{ maxWidth: 720, margin: "60px auto", padding: 24, textAlign: "center" }}>
        <FileText size={32} color={THEME.textDim} style={{ marginBottom: 12 }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Sign in to upload inspection reports</h2>
        <p style={{ fontSize: 13, color: THEME.textMuted }}>
          Drop a PDF, Ari AI returns a summary with urgent issues, repairs, and cost estimates. Free to try.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile() ? 16 : "24px 28px" }}>
      <div style={{ marginBottom: 22 }}>
        <h1 className="serif" style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
          Inspection Reports
        </h1>
        <p style={{ fontSize: 13, color: THEME.textMuted, margin: "4px 0 0", lineHeight: 1.55 }}>
          Upload any home-inspection PDF and Ari AI summarizes it — urgent issues, immediate repairs,
          recommendations, and rough cost estimates. Use this page for one-off reviews, or
          attach inspections to a specific deal in the Deal Analyzer / saved Watchlist item.
        </p>
      </div>

      {/* Upload + standalone-history panel. The reusable InspectionPanel
          handles upload + summary display + export buttons identically
          whether it's embedded in a deal context or used standalone. */}
      <InspectionPanel
        context="standalone"
        contextId="standalone"
        propertyAddress={null}
      />

      {/* Cross-context history — every inspection the user has uploaded
          anywhere, grouped by where it came from. */}
      {!loading && allInspections.length > 0 && (
        <Panel title="All your inspections" icon={<FileText size={16} />} style={{ marginTop: 24 }}>
          {(["standalone", "deal", "watchlist"]).map(ctx => {
            const items = grouped[ctx];
            if (!items || items.length === 0) return null;
            const meta = CONTEXT_META[ctx];
            return (
              <div key={ctx} style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: meta.color,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  marginBottom: 8, display: "flex", alignItems: "center", gap: 6
                }}>
                  {meta.icon} {meta.label} · {items.length}
                </div>
                {items.map(i => (
                  <HistoryItem key={i.id} inspection={i} onChangeView={onChangeView} />
                ))}
              </div>
            );
          })}
        </Panel>
      )}
    </div>
  );
};
