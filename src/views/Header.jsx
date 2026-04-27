/* ============================================================================
   TOP NAVIGATION — brand + 4 primary tabs + Tools dropdown + New Deal CTA +
   auth slot (with Plans / Learn / Terms tucked into the avatar menu).

   Design intent:
   - Logo always navigates home, so "Home" doesn't need its own tab.
   - Four primary destinations cover the daily flow (find → evaluate → save).
   - "Tools" groups the interactive utilities that *do* something
     (Inspections, Team, Calculator).
   - Account / billing pages (Plans, Learn, Terms) live behind the avatar
     menu when signed in; signed-out users see a "Plans" text link next
     to Sign in / Sign up so the sales page stays one click away.
   - Plan badge folded into the avatar — one less floating element.
   ============================================================================ */
import React, { useEffect, useRef, useState } from "react";
import {
  Building2, Layout, Calculator, Star, GraduationCap, Plus, Lock,
  Users, CreditCard, Crown, ChevronDown, Search, Shield, FileText, Sparkles
} from "lucide-react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { THEME } from "../theme.js";
import { isMobile } from "../utils.js";
import { isSaasMode, useSaasUser } from "../lib/saas.js";

const authConfigured = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

/** Auth slot — signed-out: Plans link + Sign in/Sign up. Signed-in: avatar
 * with custom menu items for Plans, Learn, Terms (+ Clerk's defaults). */
const AuthSlot = ({ planLabel, onChangeView }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 4 }}>
    <Show when="signed-out">
      <button
        onClick={() => onChangeView("plans")}
        style={{
          padding: "7px 10px", fontSize: 12, fontWeight: 600,
          background: "transparent", color: "rgba(255,255,255,0.85)",
          border: "none", borderRadius: 6, cursor: "pointer"
        }}
      >
        Plans
      </button>
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
      {/* Plan label rides next to the avatar — small, muted, but always
          visible so the user knows what tier they're on. */}
      {planLabel && (
        <button
          onClick={() => onChangeView("plans")}
          title={planLabel === "Free" ? "Click to see upgrade options" : "Manage subscription"}
          style={{
            padding: "4px 10px", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.06em", textTransform: "uppercase",
            background: planLabel === "Free" ? THEME.accent : "rgba(255,255,255,0.18)",
            color: "#FFFFFF",
            border: planLabel === "Free" ? "none" : "1px solid rgba(255,255,255,0.32)",
            borderRadius: 999, cursor: "pointer"
          }}
        >
          {planLabel === "Free" ? <>Free · Upgrade</> : planLabel}
        </button>
      )}
      <UserButton appearance={{ elements: { userButtonAvatarBox: { width: 30, height: 30 } } }}>
        <UserButton.MenuItems>
          <UserButton.Action
            label="Plans & billing"
            labelIcon={<CreditCard size={14} />}
            onClick={() => onChangeView("plans")}
          />
          <UserButton.Action
            label="Learn"
            labelIcon={<GraduationCap size={14} />}
            onClick={() => onChangeView("education")}
          />
          <UserButton.Action
            label="Terms"
            labelIcon={<Shield size={14} />}
            onClick={() => onChangeView("terms")}
          />
        </UserButton.MenuItems>
      </UserButton>
    </Show>
  </div>
);

/** A single nav button — same styling for primary tabs + items inside dropdowns. */
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

/** Tools dropdown — interactive utilities (Inspections, Team, Calculator).
 * Distinct from "primary destinations" so users can scan the bar and find
 * tools without hunting through info pages. */
const DropdownMenu = ({ label, icon, items, activeView, onPick, watchlistCount }) => {
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
  const hasLockedItem = items.some(i => i.locked);

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
        {icon}
        {label}
        {hasLockedItem && <Lock size={10} color={THEME.orange} aria-label="Some items require a paid plan" />}
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
  const wholesaleLocked  = isSaasMode() && (!saas.user || usage?.plan === "free");
  const inspectionLocked = isSaasMode() && (!saas.user || usage?.plan === "free");

  // PRIMARY — four destinations that cover the daily investor flow:
  // find a property → look at off-market leads → analyze deals → save what
  // you like. "Home" lives on the logo; account/info pages live behind
  // the avatar.
  const primary = [
    { key: "market",      label: "Find Properties", icon: <Search size={14} />, locked: marketLocked },
    { key: "wholesale",   label: "Wholesale",       icon: <Crown size={14} />,  locked: wholesaleLocked },
    { key: "dashboard",   label: "Deals",           icon: <Layout size={14} /> },
    { key: "watchlist",   label: "Watchlist",       icon: <Star size={14} /> }
  ];

  // TOOLS — interactive features that *do* something (analyze a PDF, look
  // up local pros, run a payment calc).
  const tools = [
    { key: "inspections", label: "Inspections", icon: <FileText size={14} />, locked: inspectionLocked },
    { key: "team",        label: "Team",        icon: <Users size={14} /> },
    ...(onOpenCalculator ? [{
      key: "__calculator", label: "Calculator", icon: <Calculator size={14} />,
      __action: onOpenCalculator
    }] : [])
  ];

  // Tools dropdown picks call onChangeView for nav items — but the
  // calculator entry is a tool, not a route. Intercept it.
  const handleToolPick = (key) => {
    const item = tools.find(s => s.key === key);
    if (item?.__action) item.__action();
    else onChangeView(key);
  };

  // Plan label for the avatar pill — capitalized "Free", "Starter", etc.
  const planLabel = usage?.plan
    ? usage.plan.charAt(0).toUpperCase() + usage.plan.slice(1)
    : null;

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
        {/* Brand — logo doubles as Home link. */}
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

        {/* Primary tabs + Tools dropdown + primary CTA + auth */}
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
          <DropdownMenu
            label="Tools"
            icon={<Sparkles size={13} />}
            items={tools}
            activeView={view}
            onPick={handleToolPick}
            watchlistCount={watchlistCount}
          />

          {/* Divider between nav + actions */}
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.18)", margin: "0 6px" }} aria-hidden="true" />

          {/* Single primary CTA — the most common action lives here, alone,
              so it can't be missed. */}
          <button className="btn-primary" onClick={onNewDeal} aria-label="New deal" style={{ padding: "7px 14px", fontSize: 12 }}>
            <Plus size={14} />
            {!isMobile() && "New Deal"}
          </button>

          {authConfigured && <AuthSlot planLabel={planLabel} onChangeView={onChangeView} />}
        </div>
      </div>
    </div>
  );
};
