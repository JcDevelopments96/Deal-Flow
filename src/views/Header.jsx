/* ============================================================================
   TOP NAVIGATION — brand + 4 primary tabs + "More" dropdown for secondary
   pages + New Deal action + plan badge + auth slot.

   Design intent:
   - Labels are concrete nouns (Deals, Find Properties, Wholesale, Watchlist),
     not abstract ones (Dashboard, Market Intel) — readable on first glance.
   - Top bar holds 4 primary destinations + a single primary CTA. Everything
     else (Team, Learn, Plans, Calculator) lives in the More menu so the bar
     stays calm.
   - The user's current plan shows as a pill next to the avatar — a one-tap
     path to Plans/billing for paid users, an upgrade nudge for free users.
   ============================================================================ */
import React, { useEffect, useRef, useState } from "react";
import {
  Building2, Layout, Calculator, MapPin, Star, GraduationCap, Plus, Lock,
  Users, CreditCard, Crown, ChevronDown, Search, Shield, Home
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
        ? (darkMode ? "rgba(255, 255, 255, 0.28)" : THEME.bgRaised)
        : "transparent",
      color: isActive
        ? (darkMode ? "#FFFFFF" : THEME.accent)
        : (darkMode ? "rgba(255, 255, 255, 0.75)" : THEME.text),
      border: "none",
      borderRadius: 6,
      // Bottom rule on active tab gives a much stronger visual cue than the
      // muted background fill alone — closes a visibility gap from the audit.
      boxShadow: isActive && darkMode ? `inset 0 -2px 0 ${THEME.accent}` : "none",
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

/** Plan badge — small pill next to the avatar that surfaces the user's
 * current plan and links to /plans. Free users see "Free · Upgrade" in
 * accent so the upsell is obvious without being shouty. */
const PlanBadge = ({ plan, onClick }) => {
  if (!plan) return null;
  const isFree = plan === "free";
  return (
    <button
      onClick={onClick}
      title={isFree ? "Click to see upgrade options" : "Manage subscription"}
      style={{
        padding: "4px 10px", fontSize: 10, fontWeight: 700,
        letterSpacing: "0.06em", textTransform: "uppercase",
        background: isFree ? THEME.accent : "rgba(255,255,255,0.18)",
        color: "#FFFFFF",
        border: isFree ? "none" : "1px solid rgba(255,255,255,0.32)",
        borderRadius: 999, cursor: "pointer",
        display: "inline-flex", alignItems: "center", gap: 4
      }}
    >
      {isFree ? <>Free · Upgrade</> : plan}
    </button>
  );
};

export const Header = ({ view, onChangeView, onNewDeal, onOpenCalculator, watchlistCount = 0 }) => {
  const saas = useSaasUser();
  const usage = saas.usage;
  const marketLocked = isSaasMode() && (
    !saas.user || (usage?.plan === "free" && (usage?.remaining ?? 0) === 0)
  );
  const wholesaleLocked = isSaasMode() && (!saas.user || usage?.plan === "free");

  // Primary destinations — concrete nouns, no jargon. Home is the
  // explanatory landing page that orients new users; Deals (the deal
  // pipeline / analyzer hub) sits second since it's the hands-on
  // workspace returning users want most. Team got promoted from More
  // on the strength of the new Find Local Pros + reviews flow.
  const primary = [
    { key: "home",      label: "Home",            icon: <Home size={14} /> },
    { key: "dashboard", label: "Deals",           icon: <Layout size={14} /> },
    { key: "market",    label: "Find Properties", icon: <Search size={14} />, locked: marketLocked },
    { key: "wholesale", label: "Wholesale",       icon: <Crown size={14} />,  locked: wholesaleLocked },
    { key: "team",      label: "Team",            icon: <Users size={14} /> },
    { key: "watchlist", label: "Watchlist",       icon: <Star size={14} /> }
  ];

  // Secondary — Learn + Plans + the mortgage Calculator (a tool, not a
  // destination, so it doesn't deserve top-bar real estate). Terms sits
  // here too so it's reachable from any view, satisfying the "ToS must
  // be discoverable" baseline without taking footer real estate.
  const secondary = [
    { key: "education", label: "Learn",       icon: <GraduationCap size={14} /> },
    { key: "plans",     label: "Plans",       icon: <CreditCard size={14} /> },
    ...(onOpenCalculator ? [{
      key: "__calculator", label: "Calculator", icon: <Calculator size={14} />,
      __action: onOpenCalculator
    }] : []),
    { key: "terms",     label: "Terms",       icon: <Shield size={14} /> }
  ];

  // MoreMenu picks call onChangeView for nav items — but the calculator
  // entry is a tool, not a route. Intercept it.
  const handleMorePick = (key) => {
    const item = secondary.find(s => s.key === key);
    if (item?.__action) item.__action();
    else onChangeView(key);
  };

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
        {/* Brand — wordmark only, no subtitle. The tagline added clutter
            without adding information for returning users. */}
        <button
          onClick={() => onChangeView("home")}
          style={{ display: "flex", alignItems: "center", gap: 12, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
          aria-label="Deal Docket — home"
        >
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: "#FFFFFF",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Building2 size={19} color={THEME.navy} />
          </div>
          {!isMobile() && (
            <div className="serif" style={{ fontSize: 21, fontWeight: 700, lineHeight: 1, color: "#FFFFFF" }}>
              Deal Docket
            </div>
          )}
        </button>

        {/* Primary tabs + More dropdown + primary CTA + auth */}
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
          <MoreMenu items={secondary} activeView={view} onPick={handleMorePick} watchlistCount={watchlistCount} />

          {/* Divider between nav + actions */}
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.18)", margin: "0 6px" }} aria-hidden="true" />

          {/* Single primary CTA — the most common action lives here, alone,
              so it can't be missed. Calculator moved into More. */}
          <button className="btn-primary" onClick={onNewDeal} aria-label="New deal" style={{ padding: "7px 14px", fontSize: 12 }}>
            <Plus size={14} />
            {!isMobile() && "New Deal"}
          </button>

          {/* Plan badge → quick path to Plans/billing */}
          {usage?.plan && (
            <PlanBadge plan={usage.plan} onClick={() => onChangeView("plans")} />
          )}

          {authConfigured && <AuthSlot />}
        </div>
      </div>
    </div>
  );
};
