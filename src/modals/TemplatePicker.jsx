/* ============================================================================
   TEMPLATE PICKER MODAL — opens when the user clicks "New Deal".
   ============================================================================ */
import React from "react";
import { X } from "lucide-react";
import { THEME } from "../theme.js";
import { fmtUSD, isMobile } from "../utils.js";
import { DEAL_TEMPLATES } from "../deals.jsx";

export const TemplatePicker = ({ onSelect, onClose }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 100, padding: 16
  }}
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: THEME.bg, borderRadius: 12, padding: 24,
        maxWidth: 720, width: "100%", maxHeight: "90vh", overflow: "auto"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 className="serif" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
            Choose a Template
          </h2>
          <div style={{ fontSize: 13, color: THEME.textMuted, marginTop: 4 }}>
            Start with pre-filled values for common deal types
          </div>
        </div>
        <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}>
          <X size={18} />
        </button>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile() ? "1fr" : "repeat(2, 1fr)",
        gap: 12
      }}>
        {Object.entries(DEAL_TEMPLATES).map(([key, template]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            style={{
              padding: 16, textAlign: "left",
              border: `1px solid ${THEME.border}`, borderRadius: 8,
              background: THEME.bgPanel, cursor: "pointer"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = THEME.accent;
              e.currentTarget.style.background = THEME.bgRaised;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = THEME.border;
              e.currentTarget.style.background = THEME.bgPanel;
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ color: THEME.accent }}>{template.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{template.name}</div>
            </div>
            <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 8 }}>
              {template.description}
            </div>
            <div style={{ fontSize: 11, color: THEME.textDim, display: "flex", gap: 10 }}>
              <span>{fmtUSD(template.defaults.purchasePrice, { short: true })} purchase</span>
              <span>•</span>
              <span>${template.defaults.rentEstimate}/mo rent</span>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => onSelect(null)}
        className="btn-ghost"
        style={{ marginTop: 16, width: "100%", padding: "10px 16px", fontSize: 13 }}
      >
        Skip — Start from blank
      </button>
    </div>
  </div>
);
