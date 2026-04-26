/* ============================================================================
   INSPECTION PANEL — reusable upload + summary + export UI for an
   inspection report. Tied to either a Deal (analyzer) or a Watchlist
   listing via the `context` + `contextId` props.

   Flow:
     1. User picks a PDF
     2. We mint a signed upload URL → PUT directly to Supabase Storage
     3. POST ?action=summarize → Claude returns structured summary
     4. Display summary; offer PDF/Excel/Word export buttons
   ============================================================================ */
import React, { useEffect, useState, useCallback } from "react";
import {
  Upload, FileText, Trash2, Download, AlertTriangle, Clock, CheckCircle2,
  ChevronDown, AlertCircle, RefreshCw, FileSpreadsheet, FileType
} from "lucide-react";
import { THEME } from "../theme.js";
import { Panel } from "../primitives.jsx";
import { useToast } from "../contexts.jsx";
import { isSaasMode, useSaasUser } from "../lib/saas.js";
import {
  mintInspectionUploadUrl, uploadInspectionFile, summarizeInspection,
  listInspections, deleteInspection
} from "../lib/inspections.js";
// exports.js pulls in jspdf + exceljs + docx (~350KB). Lazy-load it so
// users who never export don't pay for the bundle on initial load.
const lazyExports = () => import("../lib/exports.js");

const SECTION_META = {
  urgent:       { label: "Urgent (safety)",      color: THEME.red,    bg: THEME.redDim },
  immediate:    { label: "Immediate (0-6 mo)",   color: THEME.orange, bg: THEME.bgOrange },
  recommended:  { label: "Recommended (6-24 mo)", color: "#a16207",   bg: "#FEF3C7" },
  deferred:     { label: "Deferred / cosmetic", color: THEME.accent, bg: THEME.bgRaised }
};

function fmtCost(cost) {
  if (!cost || (cost.min == null && cost.max == null)) return null;
  if (cost.min != null && cost.max != null) return `$${cost.min.toLocaleString()} – $${cost.max.toLocaleString()}`;
  if (cost.min != null) return `$${cost.min.toLocaleString()}+`;
  return `up to $${cost.max.toLocaleString()}`;
}

function ExportMenu({ inspection }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  const handle = (fnName) => async (e) => {
    e.stopPropagation();
    setOpen(false);
    try {
      const mod = await lazyExports();
      await mod[fnName](inspection);
    } catch (err) { alert("Export failed: " + (err.message || err)); }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="btn-secondary"
        style={{ padding: "6px 12px", fontSize: 12 }}>
        <Download size={12} /> Export <ChevronDown size={11} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 100,
          background: THEME.bg, border: `1px solid ${THEME.border}`,
          borderRadius: 6, boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
          minWidth: 160, padding: 4
        }}>
          {[
            { label: "PDF",   icon: <FileText size={13} />,        fn: "exportInspectionPDF" },
            { label: "Excel", icon: <FileSpreadsheet size={13} />, fn: "exportInspectionExcel" },
            { label: "Word",  icon: <FileType size={13} />,        fn: "exportInspectionWord" }
          ].map(opt => (
            <button
              key={opt.label}
              onClick={handle(opt.fn)}
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
  );
}

function SummarySection({ sectionKey, items }) {
  if (!items || items.length === 0) return null;
  const meta = SECTION_META[sectionKey];
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        display: "inline-block", padding: "3px 9px",
        fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
        background: meta.bg, color: meta.color, borderRadius: 4, marginBottom: 8
      }}>
        {meta.label} · {items.length}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item, i) => {
          const cost = fmtCost(item.estCost);
          return (
            <div key={i} style={{
              padding: 10, background: THEME.bgPanel,
              border: `1px solid ${THEME.borderLight}`, borderRadius: 6
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: THEME.text }}>{item.issue}</div>
              <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 2, display: "flex", gap: 10, flexWrap: "wrap" }}>
                {item.location && <span>📍 {item.location}</span>}
                {cost && <span style={{ color: meta.color, fontWeight: 600 }}>{cost}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GoodConditionList({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        display: "inline-block", padding: "3px 9px",
        fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
        background: THEME.greenDim, color: THEME.green, borderRadius: 4, marginBottom: 8
      }}>
        ✓ In good condition · {items.length}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: THEME.textMuted, lineHeight: 1.7 }}>
        {items.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  );
}

function InspectionCard({ inspection, onDelete, onRetrySummarize }) {
  const summary = inspection.summary || {};
  const isComplete = inspection.status === "complete" && summary.overview;

  return (
    <div style={{
      border: `1px solid ${THEME.border}`, borderRadius: 8,
      background: THEME.bg, marginBottom: 14
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 14px", borderBottom: `1px solid ${THEME.borderLight}`,
        display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap"
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <FileText size={14} color={THEME.accent} />
            <span style={{ fontSize: 13, fontWeight: 700, color: THEME.text, wordBreak: "break-all" }}>
              {inspection.filename}
            </span>
          </div>
          <div style={{ fontSize: 11, color: THEME.textMuted }}>
            Uploaded {new Date(inspection.created_at).toLocaleDateString()}
            {inspection.status === "processing" && (
              <span style={{ marginLeft: 8, color: THEME.accent, display: "inline-flex", alignItems: "center", gap: 3 }}>
                <RefreshCw size={10} className="spin" /> processing…
              </span>
            )}
            {inspection.status === "failed" && (
              <span style={{ marginLeft: 8, color: THEME.red, display: "inline-flex", alignItems: "center", gap: 3 }}>
                <AlertCircle size={10} /> failed
              </span>
            )}
            {inspection.status === "complete" && (
              <span style={{ marginLeft: 8, color: THEME.green, display: "inline-flex", alignItems: "center", gap: 3 }}>
                <CheckCircle2 size={10} /> complete
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {inspection.status === "failed" && (
            <button onClick={() => onRetrySummarize(inspection)} className="btn-secondary"
              style={{ padding: "6px 10px", fontSize: 11 }}>
              <RefreshCw size={11} /> Retry
            </button>
          )}
          {isComplete && <ExportMenu inspection={inspection} />}
          <button onClick={() => onDelete(inspection)} className="btn-ghost"
            style={{ padding: "6px 10px", fontSize: 11, color: THEME.red }}
            title="Delete">
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Body */}
      {isComplete && (
        <div style={{ padding: "14px 14px 6px" }}>
          {summary.overview && (
            <div style={{
              padding: 10, marginBottom: 12,
              background: THEME.bgRaised, borderRadius: 6,
              fontSize: 13, color: THEME.text, lineHeight: 1.55
            }}>
              {summary.overview}
            </div>
          )}
          {(summary.totalEstCostMin != null || summary.totalEstCostMax != null) && (
            <div style={{
              padding: "8px 12px", marginBottom: 14,
              background: THEME.redDim, color: THEME.red,
              borderRadius: 6, fontSize: 12, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 8
            }}>
              <AlertTriangle size={13} />
              Est. urgent + immediate cost: {fmtCost({ min: summary.totalEstCostMin, max: summary.totalEstCostMax })}
            </div>
          )}
          <SummarySection sectionKey="urgent"      items={summary.urgent} />
          <SummarySection sectionKey="immediate"   items={summary.immediate} />
          <SummarySection sectionKey="recommended" items={summary.recommended} />
          <SummarySection sectionKey="deferred"    items={summary.deferred} />
          <GoodConditionList items={summary.goodCondition} />
        </div>
      )}

      {inspection.status === "failed" && inspection.error_message && (
        <div style={{ padding: "10px 14px", fontSize: 12, color: THEME.red, background: THEME.redDim }}>
          {inspection.error_message}
        </div>
      )}
    </div>
  );
}

export const InspectionPanel = ({ context, contextId, propertyAddress }) => {
  const saas = useSaasUser();
  const saasOn = isSaasMode();
  const toast = useToast();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(""); // human-readable status

  const load = useCallback(async () => {
    if (!saasOn || !saas.user || !contextId) { setLoading(false); return; }
    try {
      setLoading(true);
      const list = await listInspections(saas.getToken, { context, contextId });
      setInspections(list);
    } catch (e) { console.warn("inspections load failed:", e); }
    finally { setLoading(false); }
  }, [saasOn, saas.user, saas.getToken, context, contextId]);

  useEffect(() => { load(); }, [load]);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.push("Please upload a PDF", "error");
      return;
    }
    if (file.size > 32 * 1024 * 1024) {
      toast.push("PDF must be 32 MB or smaller", "error");
      return;
    }
    setUploading(true);
    setProgress("Preparing upload…");
    try {
      const { signedUploadUrl, inspectionId } = await mintInspectionUploadUrl(saas.getToken, {
        filename: file.name, context, contextId,
        address: propertyAddress, sizeBytes: file.size
      });
      setProgress("Uploading…");
      await uploadInspectionFile(signedUploadUrl, file);
      setProgress("Analyzing with AI… (10-30 seconds)");
      // Optimistically insert a "processing" row so the user sees activity
      setInspections(prev => [{
        id: inspectionId, filename: file.name, status: "processing",
        created_at: new Date().toISOString(), property_address: propertyAddress
      }, ...prev]);
      const { summary } = await summarizeInspection(saas.getToken, inspectionId);
      // Reload to pick up the canonical row + summary
      await load();
      toast.push("Inspection summary ready", "success");
    } catch (e) {
      toast.push(e.message || "Upload failed", "error");
      await load(); // surface whatever state landed
    } finally {
      setUploading(false);
      setProgress("");
    }
  };

  const handleDelete = async (inspection) => {
    if (!confirm(`Delete "${inspection.filename}"?`)) return;
    try {
      await deleteInspection(saas.getToken, inspection.id);
      setInspections(prev => prev.filter(i => i.id !== inspection.id));
      toast.push("Inspection deleted", "info");
    } catch (e) { toast.push(e.message || "Delete failed", "error"); }
  };

  const handleRetry = async (inspection) => {
    try {
      setInspections(prev => prev.map(i => i.id === inspection.id ? { ...i, status: "processing" } : i));
      const { summary } = await summarizeInspection(saas.getToken, inspection.id);
      await load();
    } catch (e) { toast.push(e.message || "Retry failed", "error"); }
  };

  if (!saasOn || !saas.user) {
    return (
      <Panel title="Inspection Reports" icon={<FileText size={16} />}>
        <div style={{ padding: 20, textAlign: "center", color: THEME.textMuted, fontSize: 13 }}>
          Sign in to upload inspection reports.
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Inspection Reports" icon={<FileText size={16} />} accent>
      {/* Upload zone */}
      <label style={{
        display: "block", padding: 20, marginBottom: 18,
        border: `2px dashed ${uploading ? THEME.accent : THEME.border}`,
        borderRadius: 10, background: uploading ? THEME.bgRaised : THEME.bgPanel,
        textAlign: "center", cursor: uploading ? "wait" : "pointer",
        transition: "border-color 0.2s, background 0.2s"
      }}>
        <input type="file" accept="application/pdf,.pdf" disabled={uploading}
          onChange={(e) => handleFile(e.target.files?.[0])}
          style={{ display: "none" }} />
        <Upload size={26} color={THEME.accent} style={{ marginBottom: 8 }} />
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
          {uploading ? progress || "Working…" : "Upload an inspection PDF"}
        </div>
        <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.5 }}>
          {uploading
            ? "Hang tight — the AI summary takes 10-30 seconds."
            : "Drop in a home-inspection PDF (up to 32 MB). We'll generate a summary with urgent issues, recommended repairs, and rough cost estimates."}
        </div>
      </label>

      {loading ? (
        <div style={{ padding: 20, textAlign: "center", color: THEME.textMuted, fontSize: 13 }}>
          Loading…
        </div>
      ) : inspections.length === 0 ? (
        <div style={{ padding: 14, textAlign: "center", color: THEME.textDim, fontSize: 12 }}>
          No inspections uploaded yet for this property.
        </div>
      ) : (
        inspections.map(i => (
          <InspectionCard
            key={i.id}
            inspection={i}
            onDelete={handleDelete}
            onRetrySummarize={handleRetry}
          />
        ))
      )}
    </Panel>
  );
};
