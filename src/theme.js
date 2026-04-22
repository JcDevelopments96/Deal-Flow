/* ============================================================================
   THEME + STYLE_TAG
   Palette: white primary canvas, navy for brand/CTA, teal for supporting
   emphasis, orange for highlights. No gradients used in UI components.

   Role summary:
     accent / navy   — primary brand color, main CTAs, hero stats
     teal            — secondary emphasis, supporting data highlights
     orange          — warm highlights, tertiary actions, callouts
     green / red     — positive / negative semantics (cash flow, delete)
   ============================================================================ */

const NAVY = "#172554";      // Blue-950 — deep primary (darker)
const NAVY_DIM = "#1E3A8A";  // Blue-900 — hover (one shade lighter)
const TEAL = "#0D9488";      // Teal-600 — secondary emphasis
const TEAL_DIM = "#0F766E";  // Teal-700 — teal hover
const ORANGE = "#EA580C";    // Orange-600 — tertiary highlight
const ORANGE_DIM = "#C2410C";

export const THEME = {
  bg: "#FFFFFF",          // Pure white canvas
  bgPanel: "#F8FAFC",     // Panel surfaces — slate-50
  bgInput: "#FFFFFF",     // Inputs match canvas
  bgRaised: "#EFF6FF",    // Hover / raised — blue-50 (harmonizes with navy)
  bgTeal: "#F0FDFA",      // Teal-50 — soft teal surface
  bgOrange: "#FFF7ED",    // Orange-50 — soft orange surface for highlights
  border: "#E2E8F0",      // Standard border (slate-200)
  borderLight: "#F1F5F9", // Subtle dividers
  text: "#0F172A",        // Primary text (slate-900)
  textMuted: "#475569",   // Secondary text (slate-600)
  textDim: "#94A3B8",     // Placeholders / tertiary (slate-400)
  accent: NAVY,
  accentDim: NAVY_DIM,
  navy: NAVY,
  navyDim: NAVY_DIM,
  // Legacy "secondary" kept as teal for code that differentiated primary/secondary.
  secondary: TEAL,
  secondaryDim: TEAL_DIM,
  teal: TEAL,
  tealDim: TEAL_DIM,
  green: "#059669",
  greenDim: "#D1FAE5",
  red: "#DC2626",
  redDim: "#FEE2E2",
  orange: ORANGE,
  orangeDim: ORANGE_DIM,
  blue: "#2563EB",
  purple: "#7C3AED"
};

export const STYLE_TAG = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;700&display=swap');
* { box-sizing: border-box; }
html, body { background: ${THEME.bg}; }
body { margin: 0; }
.brrrr-root {
  font-family: 'DM Sans', sans-serif;
  color: ${THEME.text};
  background: ${THEME.bg};
  min-height: 100vh;
  letter-spacing: -0.005em;
  font-size: 14px;
}
.serif { font-family: 'Fraunces', serif; letter-spacing: -0.025em; font-feature-settings: "ss01"; }
.mono { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
.label-xs {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: 0.18em;
  text-transform: uppercase; color: ${THEME.textMuted}; font-weight: 500;
}
.label-xs-accent {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px; letter-spacing: 0.18em;
  text-transform: uppercase; color: ${THEME.accent}; font-weight: 500;
}
input, select, textarea {
  font-family: inherit; background: ${THEME.bgInput}; color: ${THEME.text};
  border: 1px solid ${THEME.border}; outline: none; border-radius: 6px;
}
input::placeholder, textarea::placeholder { color: ${THEME.textDim}; }
input:focus, select:focus, textarea:focus {
  border-color: ${THEME.accent}; box-shadow: 0 0 0 3px rgba(23, 37, 84, 0.18);
}
input[type="checkbox"] { accent-color: ${THEME.accent}; }
input[type="range"] { accent-color: ${THEME.accent}; }
button {
  font-family: inherit; border: none; outline: none; cursor: pointer;
  background: transparent; color: ${THEME.textMuted}; border-radius: 6px;
  transition: all 0.15s ease;
}
.btn-primary {
  background: ${THEME.accent}; color: #FFFFFF; font-weight: 600;
  padding: 8px 14px; font-size: 13px; display: inline-flex;
  align-items: center; gap: 6px; transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}
.btn-primary:hover { background: ${THEME.accentDim}; }
.btn-secondary {
  border: 1px solid ${THEME.border};
  color: ${THEME.text}; padding: 8px 14px; font-size: 13px;
  display: inline-flex; align-items: center; gap: 6px;
  background: ${THEME.bg};
}
.btn-secondary:hover {
  border-color: ${THEME.accent};
  color: ${THEME.accent};
  background: ${THEME.bgRaised};
}
.btn-accent-teal {
  background: ${THEME.secondary}; color: #FFFFFF; font-weight: 600;
  padding: 8px 14px; font-size: 13px; display: inline-flex;
  align-items: center; gap: 6px; transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}
.btn-accent-teal:hover { background: ${THEME.secondaryDim}; }
.btn-ghost { color: ${THEME.textMuted}; }
.btn-ghost:hover { color: ${THEME.accent}; background: ${THEME.bgRaised}; }
.btn-danger { color: ${THEME.red}; }
.btn-danger:hover { color: #B91C1C; background: ${THEME.redDim}; }
.btn-accent-orange {
  background: ${THEME.orange}; color: #FFFFFF; font-weight: 600;
  padding: 8px 14px; font-size: 13px; display: inline-flex;
  align-items: center; gap: 6px; transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}
.btn-accent-orange:hover { background: ${THEME.orangeDim}; }

.calc-tip { position: relative; display: inline-flex; align-items: center; }
.calc-tip__icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 14px; height: 14px; border-radius: 50%;
  color: ${THEME.textMuted}; cursor: help;
  transition: color 0.15s ease;
}
.calc-tip__icon:hover { color: ${THEME.accent}; }
.calc-tip__body {
  position: absolute; z-index: 1000; top: 100%; left: 50%;
  transform: translate(-50%, 6px);
  background: ${THEME.text}; color: #fff;
  padding: 10px 12px; border-radius: 6px;
  font-size: 11px; line-height: 1.5; font-weight: 400;
  width: max-content; max-width: 280px;
  opacity: 0; pointer-events: none;
  transition: opacity 0.15s ease;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.18);
  text-align: left;
}
.calc-tip__body::before {
  content: ""; position: absolute; top: -4px; left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 8px; height: 8px; background: ${THEME.text};
}
.calc-tip:hover .calc-tip__body,
.calc-tip:focus-within .calc-tip__body { opacity: 1; }
.calc-tip__title { font-weight: 700; color: ${THEME.orange}; margin-bottom: 4px; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; }
.calc-tip__formula { font-family: 'JetBrains Mono', monospace; color: #fbbf24; margin-top: 4px; font-size: 10.5px; }

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes toastSlideIn {
  from { transform: translateX(12px); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
@keyframes modalFadeIn {
  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
}
`;
