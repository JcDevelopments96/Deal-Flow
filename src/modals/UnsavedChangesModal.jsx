/* ============================================================================
   UNSAVED CHANGES MODAL — shown when the user tries to leave an analyzer
   draft with unsaved edits.
   ============================================================================ */
import React, { useEffect } from "react";
import { AlertTriangle, Save, Trash2 } from "lucide-react";
import { THEME } from "../theme.js";

export const UnsavedChangesModal = ({ onSave, onDiscard, onCancel }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-title"
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15, 23, 42, 0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 200, padding: 16
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: THEME.bg, borderRadius: 12, padding: 24,
          maxWidth: 440, width: "100%",
          animation: "modalFadeIn 0.18s ease-out",
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.22)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: THEME.bgOrange, color: THEME.orange,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 id="unsaved-title" className="serif" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              Unsaved changes
            </h3>
            <div style={{ fontSize: 12, color: THEME.textMuted, marginTop: 2 }}>
              You have edits on this deal that haven't been saved.
            </div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: THEME.textMuted, lineHeight: 1.5, margin: "16px 0 20px" }}>
          Save the draft before leaving, or discard and continue. You can always undo by
          editing the deal later.
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
          <button onClick={onCancel} className="btn-ghost" style={{ padding: "8px 14px", fontSize: 13 }}>
            Keep Editing
          </button>
          <button onClick={onDiscard} className="btn-danger" style={{ padding: "8px 14px", fontSize: 13 }}>
            <Trash2 size={13} /> Discard
          </button>
          <button onClick={onSave} className="btn-primary" style={{ padding: "8px 14px", fontSize: 13 }}>
            <Save size={13} /> Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
