/* ============================================================================
   BASIC PRIMITIVES — reusable field + layout components.
   ============================================================================ */
import React, { useState, useEffect } from "react";
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
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState("");

  // Format the stored value the way we want to DISPLAY it (blurred view).
  const formatForDisplay = (v) => {
    if (v === "" || v === null || v === undefined) return "";
    const n = Number(v);
    if (!Number.isFinite(n)) return "";
    const rounded = isInteger ? Math.round(n) : n;
    return rounded.toLocaleString("en-US", { maximumFractionDigits: isInteger ? 0 : 10 });
  };

  // Format for the EDITING view — plain digits, no commas so the user can
  // type freely without the caret fighting commas mid-word.
  const formatForEdit = (v) => {
    if (v === "" || v === null || v === undefined) return "";
    const n = Number(v);
    if (!Number.isFinite(n)) return "";
    return String(isInteger ? Math.round(n) : n);
  };

  // Keep local text in sync with parent value when not focused.
  useEffect(() => {
    if (!focused) setText(formatForDisplay(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused, isInteger]);

  const parse = (raw) => {
    // Allow user to type commas / spaces / currency symbols and still parse correctly.
    const allowed = isInteger ? /[^\d-]/g : /[^\d.-]/g;
    const cleaned = String(raw).replace(allowed, "");
    const n = parseFloat(cleaned);
    if (!Number.isFinite(n)) return 0;
    return isInteger ? Math.round(n) : n;
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    setText(raw);           // preserve exactly what the user typed so the caret stays put
    onChange(parse(raw));   // propagate the numeric value to the parent
  };

  const handleFocus = () => {
    setFocused(true);
    setText(formatForEdit(value));
  };

  const handleBlur = () => {
    setFocused(false);
    setText(formatForDisplay(value));
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
          type="text"
          inputMode={isInteger ? "numeric" : "decimal"}
          value={text}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
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

/**
 * PercentDollarField — number input that toggles between $ and % of a base.
 *
 * Investors split into two camps on operating reserves: some think in dollars
 * ("$200 / mo for capex"), some think in percent of rent ("10% of gross").
 * This field lets the user enter in whichever is natural and shows the
 * converted value as helper text so they always see both sides.
 *
 * Storage stays in $ — `value` is always the dollar amount. The toggle is
 * pure UI state, so saved deals don't drift if the user flips modes mid-edit.
 *
 * `base` is the reference amount the % is taken against (typically monthly
 * rent for capex/repairs/mgmt; annual rent for property tax/insurance).
 */
export const PercentDollarField = ({ label, value, base, onChange, helper, baseLabel = "of rent" }) => {
  const [mode, setMode] = useState("$");
  const safeBase = Number(base) || 0;
  const safeValue = Number(value) || 0;

  const pctEquivalent = safeBase > 0 ? (safeValue / safeBase) * 100 : 0;
  const dollarEquivalent = (pct) => safeBase * (pct / 100);

  const handleChange = (entered) => {
    const v = Number(entered) || 0;
    if (mode === "$") {
      onChange(Math.round(v));
    } else {
      onChange(Math.round(dollarEquivalent(v)));
    }
  };

  // What value the inner NumberField shows depends on the active mode.
  const fieldValue = mode === "$"
    ? safeValue
    : Number(pctEquivalent.toFixed(2));

  // Helper line always shows the OTHER unit so both sides are visible.
  const flipHelper = mode === "$"
    ? (safeBase > 0 ? `≈ ${pctEquivalent.toFixed(1)}% ${baseLabel}` : "Set rent first to see % equivalent")
    : (safeBase > 0 ? `≈ $${Math.round(safeValue).toLocaleString()} / mo` : "Set rent first to see $ equivalent");

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 6, gap: 8
      }}>
        <span className="label-xs">{label}</span>
        <div style={{
          display: "inline-flex", borderRadius: 6, overflow: "hidden",
          border: `1px solid ${THEME.border}`
        }}>
          {["$", "%"].map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                padding: "2px 8px", fontSize: 11, fontWeight: 700,
                background: mode === m ? THEME.accent : "transparent",
                color: mode === m ? "#FFFFFF" : THEME.textMuted,
                border: "none", cursor: "pointer"
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <NumberField
        label=""
        value={fieldValue}
        onChange={handleChange}
        prefix={mode}
        helper={helper ? `${helper} · ${flipHelper}` : flipHelper}
      />
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
