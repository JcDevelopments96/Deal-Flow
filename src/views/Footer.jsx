/* ============================================================================
   FOOTER — thin row at the bottom of every page. Catches the legal/info
   pages (Terms, Learn, Plans) that aren't in the primary header anymore,
   plus the Shepherd Solutions attribution.
   ============================================================================ */
import React from "react";
import { Building2 } from "lucide-react";
import { THEME } from "../theme.js";
import { isMobile } from "../utils.js";

export const Footer = ({ onChangeView }) => {
  const links = [
    { key: "plans",     label: "Plans" },
    { key: "education", label: "Learn" },
    { key: "terms",     label: "Terms" }
  ];

  return (
    <footer style={{
      marginTop: 60,
      padding: isMobile() ? "20px 16px" : "24px 28px",
      borderTop: `1px solid ${THEME.border}`,
      background: THEME.bgPanel
    }}>
      <div style={{
        maxWidth: 1400, margin: "0 auto",
        display: "flex", flexWrap: "wrap",
        alignItems: "center", justifyContent: "space-between",
        gap: 16
      }}>
        {/* Brand + attribution */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6,
            background: THEME.navy, color: "#FFFFFF",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0
          }}>
            <Building2 size={14} />
          </div>
          <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.45 }}>
            <strong style={{ color: THEME.text }}>Deal Docket</strong>{" "}
            <span style={{ color: THEME.textDim }}>by Shepherd Solutions</span>
            <br />
            <span style={{ fontSize: 11, color: THEME.textDim }}>
              © {new Date().getFullYear()} · Real estate investor toolkit
            </span>
          </div>
        </div>

        {/* Info links */}
        <nav style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {links.map(l => (
            <button
              key={l.key}
              onClick={() => onChangeView(l.key)}
              style={{
                padding: "6px 12px",
                background: "transparent",
                border: "none",
                borderRadius: 6,
                fontSize: 12, fontWeight: 600,
                color: THEME.textMuted,
                cursor: "pointer"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = THEME.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = THEME.textMuted; }}
            >
              {l.label}
            </button>
          ))}
        </nav>
      </div>
    </footer>
  );
};
