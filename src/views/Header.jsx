/* ============================================================================
   TOP NAVIGATION — brand + 4 primary tabs + "More" dropdown for secondary
   pages + Calculator / New Deal actions + auth slot.

   Design intent: keep the top bar to ~4 primary destinations so it feels
   calm. Everything else (team, learn, plans) lives under a "More" menu.
   ============================================================================ */
import React, { useEffect, useRef, useState } from "react";
import {
  Building2, Layout, Calculator, MapPin, Star, GraduationCap, Plus, Lock,
  Users, CreditCard, Crown, ChevronDown
} from "lucide-react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { THEME } from "../theme.js";
import { isMobile } from "../utils.js";
import { isSaasMode, useSaasUser } from "../lib/saas.js";

const authConfigured = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

const AuthSlot = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 4 }}>
    <Show when="signed-out">
      <SignInButton mode="modal">
        <button className="btn-secondary" style={{ padding: "7px 12px", fontSize: 12 }}>
          Sign in
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="btn-primary" style={{ padding: "7px 12px", fontSize: 12 }}>
          Sign up
        </button>
      </SignUpButton>
    </Show>
    <Show when="signed-in">
      <UserButton appearance={{ elements: { userButtonAvatarBox: { width: 30, height: 30 } } }} />
    </Show>
  </div>
);

/** A single nav button — same styling for primary tabs + items inside the More menu. */
const NavButton = ({ tab, isActive, onClick, darkMode = true, watchlistCount }) => (
  <button
    onClick={onClick}
    aria-label={tab.label}
    title={tab.locked ? `${tab.label} requires a paid plan` : undefined}
    style={{
      padding: "8px 14px", fontSize: 13, fontWeight: 600,
      background: isActive
        ? (darkMode ? "rgba(255, 255, 255, 0.15)" : THEME.bgRaised)
        : "transparent",
      color: isActive
        ? (darkMode ? "#FFFFFF" : THEME.accent)
        : (darkMode ? "rgba(255, 255, 255, 0.75)" : THEME.text),
      border: "none",
      borderRadius: 6,
      display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
      width: darkMode ? "auto" : "100%",   // full-width inside dropdown
      justifyContent: darkMode ? "center" : "flex-start",
      position: "relative"
    }}
  >
    {tab.icon}
    <span>{tab.label}</span>
    {tab.locked && (
      <Lock size={11} color={THEME.orange} aria-label="Paid plan required" style={{ marginLeft: 2 }} />
    )}
    {tab.key === "watchlist" && watchlistCount > 0 && (
      <span style={{
        minWidth: 18, height: 18, padding: "0 5px",
        background: THEME.accent, color: "#fff",
        borderRadius: 9, fontSize: 10, fontWeight: 700,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        marginLeft: 2
      }}>
        {watchlistCount}
      </span>
    )}
  </button>
);

/** "More" dropdown — secondary destinations tucked away so the bar isn't noisy. */
const MoreMenu = ({ items, activeView, onPick, watchlistCount }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const activeInside = items.some(i => i.key === activeView);

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu" aria-expanded={open}
        style={{
          padding: "8px 12px", fontSize: 13, fontWeight: 600,
          background: (open || activeInside) ? "rgba(255, 255, 255, 0.15)" : "transparent",
          color: activeInside ? "#FFFFFF" : "rgba(255, 255, 255, 0.75)",
          border: "none", borderRadius: 6,
          display: "flex", alignItems: "center", gap: 5, cursor: "pointer"
        }}
      >
        More
        <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div role="menu" style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          minWidth: 180, padding: 6,
          background: THEME.bg, color: THEME.text,
          border: `1px solid ${THEME.border}`,
          borderRadius: 8,
          boxShadow: "0 10px 28px rgba(15,23,42,0.18)",
          display: "flex", flexDirection: "column", gap: 2,
          zIndex: 50
        }}>
          {items.map(item => (
            <NavButton
              key={item.key}
              tab={item}
              isActive={activeView === item.key}
              onClick={() => { onPick(item.key); setOpen(false); }}
              darkMode={false}
              watchlistCount={watchlistCount}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Header = ({ view, onChangeView, onNewDeal, onOpenCalculator, watchlistCount = 0 }) => {
  const saas = useSaasUser();
  const usage = saas.usage;
  const marketLocked = isSaasMode() && (
    !saas.user || (usage?.plan === "free" && (usage?.remaining ?? 0) === 0)
  );
  const wholesaleLocked = isSaasMode() && (!saas.user || usage?.plan === "free");

  // 4 primary tabs live in the bar itself — what most users need most of the time.
  const primary = [
    { key: "dashboard", label: "Dashboard",    icon: <Layout size={14} /> },
    { key: "market",    label: "Market Intel", icon: <MapPin size={14} />, locked: marketLocked },
    { key: "wholesale", label: "Wholesale",    icon: <Crown size={14} />,  locked: wholesaleLocked },
    { key: "watchlist", label: "Watchlist",    icon: <Star size={14} /> }
  ];

  // Secondary destinations — one click deeper, but still one click.
  const secondary = [
    { key: "team",      label: "Team",  icon: <Users size={14} /> },
    { key: "education", label: "Learn", icon: <GraduationCap size={14} /> },
    { key: "plans",     label: "Plans", icon: <CreditCard size={14} /> }
  ];

  return (
    <div style={{
      borderBottom: `1px solid ${THEME.navyDim}`,
      background: THEME.navy,
      boxShadow: "0 2px 10px rgba(15, 23, 42, 0.12)",
      position: "sticky", top: 0, zIndex: 10
    }}>
      <div style={{
        maxWidth: 1400, margin: "0 auto",
        padding: isMobile() ? "12px 16px" : "14px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12
      }}>
        {/* Brand */}
        <button
          onClick={() => onChangeView("dashboard")}
          style={{ display: "flex", alignItems: "center", gap: 14, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
          aria-label="DealTrack — home"
        >
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "#FFFFFF",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Building2 size={20} color={THEME.navy} />
          </div>
          {!isMobile() && (
            <div style={{ textAlign: "left" }}>
              <div className="serif" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1, color: "#FFFFFF" }}>
                DealTrack
              </div>
              <div style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.65)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
                Real Estate Investment Platform
              </div>
            </div>
          )}
        </button>

        {/* Primary tabs + More dropdown + actions */}
        <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
          {primary.map(tab => (
            <NavButton
              key={tab.key}
              tab={tab}
              isActive={view === tab.key}
              onClick={() => onChangeView(tab.key)}
              darkMode={true}
              watchlistCount={watchlistCount}
            />
          ))}
          <MoreMenu items={secondary} activeView={view} onPick={onChangeView} watchlistCount={watchlistCount} />

          {/* Divider between nav + actions */}
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.18)", margin: "0 6px" }} aria-hidden="true" />

          {onOpenCalculator && (
            <button
              className="btn-accent-teal"
              onClick={onOpenCalculator}
              aria-label="Open mortgage and affordability calculator"
              title="Mortgage & Affordability Calculator"
              style={{ padding: "7px 12px", fontSize: 12 }}
            >
              <Calculator size={14} />
              {!isMobile() && "Calculator"}
            </button>
          )}

          <button className="btn-primary" onClick={onNewDeal} aria-label="New deal" style={{ padding: "7px 12px", fontSize: 12 }}>
            <Plus size={14} />
            {!isMobile() && "New Deal"}
          </button>

          {authConfigured && <AuthSlot />}
        </div>
      </div>
    </div>
  );
};
