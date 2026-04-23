/* ============================================================================
   ErrorBoundary — wraps the market/analyzer views so a render-time crash
   doesn't black out the entire app. Shows the error + stack so we can
   actually debug, plus a "reset" button that re-mounts the tree.
   ============================================================================ */
import React from "react";
import { THEME } from "./theme.js";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
    this.setState({ info });
  }
  reset = () => this.setState({ error: null, info: null });

  render() {
    if (!this.state.error) return this.props.children;
    const msg = this.state.error.message || String(this.state.error);
    const stack = this.state.error.stack || "";
    return (
      <div style={{
        maxWidth: 720, margin: "40px auto", padding: 24,
        background: THEME.bg,
        border: `1px solid ${THEME.red}`,
        borderRadius: 8,
        fontSize: 13,
        color: THEME.text
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: THEME.red, marginBottom: 10 }}>
          Something broke while rendering this view
        </div>
        <div style={{
          padding: 12, background: THEME.redDim, color: THEME.red,
          borderRadius: 6, marginBottom: 12, fontFamily: "monospace", fontSize: 12,
          wordBreak: "break-word"
        }}>
          {msg}
        </div>
        {stack && (
          <details style={{ marginBottom: 12 }}>
            <summary style={{ cursor: "pointer", color: THEME.textMuted, fontSize: 12 }}>Stack trace</summary>
            <pre style={{
              marginTop: 8, padding: 10,
              background: THEME.bgPanel, color: THEME.textMuted,
              borderRadius: 4, fontSize: 11,
              overflow: "auto", maxHeight: 300
            }}>{stack}</pre>
          </details>
        )}
        <button
          onClick={this.reset}
          className="btn-primary"
          style={{ padding: "8px 14px", fontSize: 13 }}
        >
          Try again
        </button>
      </div>
    );
  }
}
