/* ============================================================================
   TOP NAVIGATION — brand + tab buttons + "Calculator" + "New Deal" actions.
   ============================================================================ */
import React from "react";
import {
  Building2, Layout, Calculator, MapPin, Star, GraduationCap, Plus
} from "lucide-react";
import { THEME } from "../theme.js";
import { isMobile } from "../utils.js";

export const Header = ({ view, onChangeView, onNewDeal, onOpenCalculator, watchlistCount = 0 }) => (
  <div style={{
    borderBottom: `1px solid ${THEME.border}`,
    background: THEME.bg,
    position: "sticky", top: 0, zIndex: 10
  }}>
    <div style={{
      maxWidth: 1400, margin: "0 auto",
      padding: isMobile() ? "12px 16px" : "14px 28px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 12
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: THEME.navy,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Building2 size={20} color="white" />
        </div>
        <div>
          <div className="serif" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
            DealTrack
          </div>
          <div style={{ fontSize: 10, color: THEME.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
            Real Estate Investment Platform
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        {[
          { key: "dashboard", label: "Dashboard", icon: <Layout size={14} /> },
          { key: "analyzer", label: "Analyzer", icon: <Calculator size={14} /> },
          { key: "market", label: "Market Intel", icon: <MapPin size={14} /> },
          { key: "watchlist", label: "Watchlist", icon: <Star size={14} />, badge: watchlistCount || null },
          { key: "education", label: "Learn", icon: <GraduationCap size={14} /> }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => onChangeView(tab.key)}
            aria-label={tab.label}
            style={{
              padding: "8px 14px", fontSize: 13, fontWeight: 600,
              background: view === tab.key ? THEME.bgRaised : "transparent",
              color: view === tab.key ? THEME.accent : THEME.textMuted,
              borderRadius: 6,
              display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
              position: "relative"
            }}
          >
            {tab.icon}
            {!isMobile() && tab.label}
            {tab.badge ? (
              <span style={{
                minWidth: 18, height: 18, padding: "0 5px",
                background: THEME.accent, color: "#fff",
                borderRadius: 9, fontSize: 10, fontWeight: 700,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginLeft: 2
              }}>
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}

        {onOpenCalculator && (
          <button
            className="btn-accent-teal"
            onClick={onOpenCalculator}
            style={{ marginLeft: 4 }}
            aria-label="Open mortgage and affordability calculator"
            title="Mortgage & Affordability Calculator"
          >
            <Calculator size={14} />
            {!isMobile() && "Calculator"}
          </button>
        )}

        <button className="btn-primary" onClick={onNewDeal} style={{ marginLeft: 4 }} aria-label="New deal">
          <Plus size={14} />
          {!isMobile() && "New Deal"}
        </button>
      </div>
    </div>
  </div>
);
