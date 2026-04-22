/* ============================================================================
   CONTEXTS — ToastHost + AppActions (watchlist + "use listing as deal").
   ============================================================================ */
import React, { useState, useCallback, useMemo } from "react";
import { Info, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { THEME } from "./theme.js";

/* ── App-level actions exposed to deeply-nested components ───────────── */
export const AppActionsContext = React.createContext({
  useListingAsDeal: () => {},
  isWatched: () => false,
  toggleWatch: () => {},
  removeWatch: () => {},
  watchlist: [],
  openListingDetail: () => {}
});
export const useAppActions = () => React.useContext(AppActionsContext);

/* ── Toast system — non-blocking notifications ───────────────────────── */
export const ToastContext = React.createContext({ push: () => {}, dismiss: () => {} });
export const useToast = () => React.useContext(ToastContext);

const TOAST_STYLES = {
  success: { bg: THEME.greenDim, color: THEME.green, icon: <CheckCircle2 size={14} /> },
  info:    { bg: THEME.bgRaised, color: THEME.accent, icon: <Info size={14} /> },
  warn:    { bg: THEME.bgOrange, color: THEME.orange, icon: <AlertTriangle size={14} /> },
  error:   { bg: THEME.redDim,  color: THEME.red,   icon: <AlertTriangle size={14} /> }
};

export const ToastHost = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((msg, type = "info", durationMs = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev, { id, msg, type }]);
    if (durationMs > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, durationMs);
    }
    return id;
  }, []);

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        style={{
          position: "fixed",
          top: 16, right: 16,
          display: "flex", flexDirection: "column", gap: 8,
          zIndex: 2000,
          pointerEvents: "none"
        }}
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map(t => {
          const s = TOAST_STYLES[t.type] || TOAST_STYLES.info;
          return (
            <div
              key={t.id}
              role="status"
              onClick={() => dismiss(t.id)}
              style={{
                pointerEvents: "auto",
                minWidth: 260, maxWidth: 380,
                padding: "10px 14px",
                background: s.bg, color: s.color,
                border: `1px solid ${s.color}`,
                borderRadius: 8,
                boxShadow: "0 6px 20px rgba(15, 23, 42, 0.08)",
                fontSize: 13, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 10,
                cursor: "pointer",
                animation: "toastSlideIn 0.18s ease-out"
              }}
            >
              <span style={{ display: "inline-flex" }}>{s.icon}</span>
              <span style={{ flex: 1 }}>{t.msg}</span>
              <span aria-label="Dismiss" style={{ opacity: 0.55, display: "inline-flex" }}>
                <X size={12} />
              </span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
