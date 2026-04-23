/* ============================================================================
   UsageMeter — small badge that shows "X / Y Market Intel clicks" remaining
   this period. Rendered in the Live Listings panel header when the user is
   signed in and SaaS mode is active.
   ============================================================================ */
import React from "react";
import { Activity, AlertTriangle } from "lucide-react";
import { THEME } from "../theme.js";

export const UsageMeter = ({ usage, onUpgradeClick }) => {
  if (!usage) return null;

  const { includedClicks, clicks, remaining, overage, planName } = usage;
  const ratio = includedClicks > 0 ? clicks / includedClicks : 0;

  // Color pressure: green until 50%, orange until 85%, red above.
  const barColor =
    overage ? THEME.red :
    ratio >= 0.85 ? THEME.red :
    ratio >= 0.50 ? THEME.orange :
    THEME.teal;

  const pct = Math.min(100, Math.round(ratio * 100));

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 10,
      padding: "6px 10px",
      background: THEME.bg, border: `1px solid ${THEME.border}`,
      borderRadius: 6, fontSize: 11
    }}>
      <Activity size={12} color={barColor} />
      <div>
        <div style={{ fontWeight: 700, color: THEME.text }}>
          {clicks} / {includedClicks}
          <span style={{ color: THEME.textMuted, fontWeight: 500, marginLeft: 6 }}>
            {planName} clicks
          </span>
        </div>
        <div style={{
          width: 120, height: 4, background: THEME.borderLight,
          borderRadius: 2, marginTop: 3, overflow: "hidden"
        }}>
          <div style={{
            width: `${pct}%`, height: "100%", background: barColor,
            transition: "width 0.2s ease"
          }} />
        </div>
      </div>
      {overage && (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          color: THEME.red, fontWeight: 700
        }}>
          <AlertTriangle size={11} /> Over
        </span>
      )}
      {remaining <= 2 && !overage && onUpgradeClick && (
        <button
          onClick={onUpgradeClick}
          className="btn-accent-orange"
          style={{ padding: "4px 10px", fontSize: 11 }}
        >
          Upgrade
        </button>
      )}
    </div>
  );
};
