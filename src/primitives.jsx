/* ============================================================================
   BASIC PRIMITIVES — reusable field + layout components.
   ============================================================================ */
import React from "react";
import { Info } from "lucide-react";
import { THEME } from "./theme.js";

export const TextField = ({ label, value, onChange, placeholder, helper }) => (
  <div style={{ marginBottom: 14 }}>
    <div className="label-xs" style={{ marginBottom: 6 }}>{label}</div>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: "100%", padding: "9px 10px", fontSize: 13 }}
    />
    {helper && <div style={{ fontSize: 11, color: THEME.textDim, marginTop: 4 }}>{helper}</div>}
  </div>
);

/**
 * NumberField
 *
 * Integer vs. decimal handling:
 * - Dollar fields (`prefix="$"`) are rounded to whole numbers — no cents.
 * - Percent/rate fields (`prefix="%"`) or unprefixed fields keep decimals
 *   (interest rate 7.25%, bathrooms 2.5, etc.).
 * - Callers can force a mode with the `integer` prop (true/false) when the
 *   prefix-based auto-detection would be wrong.
 */
export const NumberField = ({ label, value, onChange, placeholder, helper, prefix, integer }) => {
  const isInteger = integer !== undefined ? integer : prefix === "$";
  const step = isInteger ? 1 : "any";
  const parse = (raw) => {
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) return 0;
    return isInteger ? Math.round(n) : n;
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="label-xs" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ position: "relative" }}>
        {prefix && (
          <span style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: THEME.textMuted,
            fontSize: 13,
            zIndex: 1
          }}>
            {prefix}
          </span>
        )}
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(parse(e.target.value))}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: prefix ? "9px 10px 9px 25px" : "9px 10px",
            fontSize: 13
          }}
        />
      </div>
      {helper && <div style={{ fontSize: 11, color: THEME.textDim, marginTop: 4 }}>{helper}</div>}
    </div>
  );
};

export const SelectField = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 14 }}>
    <div className="label-xs" style={{ marginBottom: 6 }}>{label}</div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", padding: "9px 10px", fontSize: 13 }}
    >
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>
);

export const StatRow = ({ label, value, valueColor, bold, mono = true, borderTop, sublabel, tooltip }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "9px 0",
    borderTop: borderTop ? `1px solid ${THEME.border}` : "none"
  }}>
    <div>
      <div style={{ fontSize: 12, color: THEME.textMuted, fontWeight: bold ? 600 : 400, display: "inline-flex", alignItems: "center" }}>
        {label}
        {tooltip && <CalcTooltip size={12} {...tooltip} />}
      </div>
      {sublabel && <div style={{ fontSize: 10, color: THEME.textDim, marginTop: 2 }}>{sublabel}</div>}
    </div>
    <div
      className={mono ? "mono" : ""}
      style={{
        fontSize: bold ? 15 : 13,
        color: valueColor || THEME.text,
        fontWeight: bold ? 700 : 500
      }}
    >
      {value}
    </div>
  </div>
);

export const Panel = ({ title, icon, children, accent, action, style = {} }) => (
  <div style={{
    background: THEME.bgPanel,
    border: `1px solid ${THEME.border}`,
    borderRadius: 8,
    ...style
  }}>
    {title && (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px",
        borderBottom: `1px solid ${THEME.border}`,
        background: accent ? THEME.bgRaised : "transparent"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {icon}
          <span className="label-xs" style={{ color: accent ? THEME.accent : THEME.textMuted, fontSize: 11 }}>{title}</span>
        </div>
        {action}
      </div>
    )}
    <div style={{ padding: 18 }}>{children}</div>
  </div>
);

/**
 * CalcTooltip — hover an info icon to reveal the formula behind a calculated value.
 * Keyboard-accessible (tabIndex=0 on wrapper, body revealed on :focus-within).
 */
export const CalcTooltip = ({ title, description, formula, size = 13, inline = true }) => (
  <span
    className="calc-tip"
    style={{ marginLeft: 6, verticalAlign: inline ? "middle" : "baseline" }}
    tabIndex={0}
    aria-label={title ? `How ${title} is calculated` : "Calculation details"}
  >
    <span className="calc-tip__icon">
      <Info size={size} />
    </span>
    <span className="calc-tip__body">
      {title && <div className="calc-tip__title">{title}</div>}
      {description && <div>{description}</div>}
      {formula && <div className="calc-tip__formula">{formula}</div>}
    </span>
  </span>
);
