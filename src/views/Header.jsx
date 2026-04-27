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
   - Mobile (≤ 768px): the entire right cluster collapses behind a single
     hamburger button. Drawer slides in from the right with everything
     flat-listed so no menus-inside-menus.
   ============================================================================ */
import React, { useEffect, useRef, useState } from "react";
import {
  Building2, Layout, Calculator, Star, GraduationCap, Plus, Lock,
  Users, CreditCard, Crown, ChevronDown, Search, Shield, FileText, Sparkles,
  Menu, X, LogOut
} from "lucide-react";
import {
  Show, SignInButton, SignUpButton, SignOutButton, UserButton, useUser
} from "@clerk/react";
import { THEME } from "../theme.js";
import { isMobile } from "../utils.js";
import { isSaasMode, useSaasUser } from "../lib/saas.js";

const authConfigured = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

/* ── isMobile as reactive state ────────────────────────────────────────
 * The bare `isMobile()` helper just reads `window.innerWidth` at call
 * time — it doesn't re-render on resize. For the hamburger to swap in
 * cleanly when the user rotates their phone or drags a desktop window
 * narrow, we need state that tracks the breakpoint. */
function useIsMobile() {
  const [is, setIs] = useState(() => (typeof window !== "undefined" ? isMobile() : false));
  useEffect(() => {
    const onResize = () => setIs(isMobile());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return is;
}

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
      boxShadow: isActive && darkMode ? `inset 0 -2px 0 ${THEME.accent}` : "none",
      display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
      width: darkMode ? "auto" : "100%",
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

/** Tools dropdown — interactive utilities (Inspections, Team, Calculator). */
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

/* ── Mobile drawer ─────────────────────────────────────────────────────
 * Fixed-position slide-in panel from the right edge. Everything that
 * normally lives in the header (tabs, tools, New Deal, account) shows
 * here as a single flat list — no nested menus, since stacked popovers
 * inside a drawer are confusing on touch. Escape and backdrop tap
 * close it; tapping a nav item also closes it. */
const MobileDrawer = ({
  open, onClose, primary, tools, view, onChangeView, onNewDeal, onToolPick,
  watchlistCount, planLabel
}) => {
  const { user } = useUser?.() || { user: null };
  const drawerRef = useRef(null);

  // Lock body scroll while open + close on Escape.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onEsc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  const pick = (key) => () => { onChangeView(key); onClose(); };

  const SectionLabel = ({ children }) => (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase", color: THEME.textMuted,
      padding: "16px 4px 6px"
    }}>
      {children}
    </div>
  );

  const Row = ({ icon, label, onClick, locked, badgeCount, active }) => (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "12px 12px",
        background: active ? THEME.bgRaised : "transparent",
        color: active ? THEME.accent : THEME.text,
        border: "none", borderRadius: 6,
        fontSize: 14, fontWeight: 600,
        cursor: "pointer", textAlign: "left"
      }}
    >
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
      {locked && <Lock size={12} color={THEME.orange} />}
      {badgeCount > 0 && (
        <span style={{
          padding: "2px 7px", fontSize: 10, fontWeight: 700,
          background: THEME.accent, color: "#FFFFFF", borderRadius: 999
        }}>
          {badgeCount}
        </span>
      )}
    </button>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(15, 23, 42, 0.55)",
          animation: "fadeIn 0.15s ease-out"
        }}
      />
      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog" aria-modal="true" aria-label="Main menu"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 101,
          width: "min(320px, 88vw)",
          background: THEME.bg, color: THEME.text,
          boxShadow: "-12px 0 40px rgba(15,23,42,0.35)",
          display: "flex", flexDirection: "column",
          animation: "slideInRight 0.2s ease-out"
        }}
      >
        {/* Drawer header — brand on left, close on right */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px", borderBottom: `1px solid ${THEME.border}`,
          background: THEME.navy, color: "#FFFFFF"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 7,
              background: "#FFFFFF",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Building2 size={17} color={THEME.navy} />
            </div>
            <div className="serif" style={{ fontSize: 17, fontWeight: 700 }}>
              Deal Docket
            </div>
          </div>
          <button onClick={onClose} aria-label="Close menu" style={{
            background: "transparent", border: "none",
            color: "#FFFFFF", cursor: "pointer", padding: 4
          }}>
            <X size={22} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
          {primary.map(t => (
            <Row
              key={t.key}
              icon={t.icon}
              label={t.label}
              onClick={pick(t.key)}
              locked={t.locked}
              badgeCount={t.key === "watchlist" ? watchlistCount : 0}
              active={view === t.key}
            />
          ))}

          <SectionLabel>Tools</SectionLabel>
          {tools.map(t => (
            <Row
              key={t.key}
              icon={t.icon}
              label={t.label}
              onClick={() => { onToolPick(t.key); onClose(); }}
              locked={t.locked}
              active={view === t.key}
            />
          ))}

          <div style={{ padding: "16px 4px 4px" }}>
            <button
              className="btn-primary"
              onClick={() => { onNewDeal(); onClose(); }}
              style={{ width: "100%", padding: "12px", fontSize: 14, justifyContent: "center" }}
            >
              <Plus size={16} />
              New Deal
            </button>
          </div>

          <SectionLabel>Account</SectionLabel>
          {planLabel && user && (
            <Row
              icon={<CreditCard size={14} />}
              label={planLabel === "Free" ? "Plans · Upgrade" : `Plans (${planLabel})`}
              onClick={pick("plans")}
              active={view === "plans"}
            />
          )}
          {!user && (
            <Row
              icon={<CreditCard size={14} />}
              label="Plans"
              onClick={pick("plans")}
              active={view === "plans"}
            />
          )}
          <Row
            icon={<GraduationCap size={14} />}
            label="Learn"
            onClick={pick("education")}
            active={view === "education"}
          />
          <Row
            icon={<Shield size={14} />}
            label="Terms"
            onClick={pick("terms")}
            active={view === "terms"}
          />
        </div>

        {/* Fixed footer auth — separated so it's always visible */}
        {authConfigured && (
          <div style={{
            padding: 12, borderTop: `1px solid ${THEME.border}`,
            display: "flex", flexDirection: "column", gap: 8
          }}>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="btn-secondary" style={{ width: "100%", padding: "10px", justifyContent: "center" }}>
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn-primary" style={{ width: "100%", padding: "10px", justifyContent: "center" }}>
                  Sign up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              {user && (
                <div style={{
                  fontSize: 12, color: THEME.textMuted, padding: "0 4px 4px"
                }}>
                  Signed in as <strong style={{ color: THEME.text }}>{user.primaryEmailAddress?.emailAddress || user.firstName}</strong>
                </div>
              )}
              <SignOutButton>
                <button className="btn-secondary" style={{ width: "100%", padding: "10px", justifyContent: "center" }}>
                  <LogOut size={14} /> Sign out
                </button>
              </SignOutButton>
            </Show>
          </div>
        )}
      </div>
    </>
  );
};

export const Header = ({ view, onChangeView, onNewDeal, onOpenCalculator, watchlistCount = 0 }) => {
  const saas = useSaasUser();
  const usage = saas.usage;
  const mobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer if the viewport grows back to desktop while it's open.
  useEffect(() => {
    if (!mobile && drawerOpen) setDrawerOpen(false);
  }, [mobile, drawerOpen]);

  const marketLocked = isSaasMode() && (
    !saas.user || (usage?.plan === "free" && (usage?.remaining ?? 0) === 0)
  );
  const wholesaleLocked  = isSaasMode() && (!saas.user || usage?.plan === "free");
  const inspectionLocked = isSaasMode() && (!saas.user || usage?.plan === "free");

  const primary = [
    { key: "market",      label: "Find Properties", icon: <Search size={14} />, locked: marketLocked },
    { key: "wholesale",   label: "Wholesale",       icon: <Crown size={14} />,  locked: wholesaleLocked },
    { key: "dashboard",   label: "Deals",           icon: <Layout size={14} /> },
    { key: "watchlist",   label: "Watchlist",       icon: <Star size={14} /> }
  ];

  const tools = [
    { key: "inspections", label: "Inspections", icon: <FileText size={14} />, locked: inspectionLocked },
    { key: "team",        label: "Team",        icon: <Users size={14} /> },
    ...(onOpenCalculator ? [{
      key: "__calculator", label: "Calculator", icon: <Calculator size={14} />,
      __action: onOpenCalculator
    }] : [])
  ];

  const handleToolPick = (key) => {
    const item = tools.find(s => s.key === key);
    if (item?.__action) item.__action();
    else onChangeView(key);
  };

  const planLabel = usage?.plan
    ? usage.plan.charAt(0).toUpperCase() + usage.plan.slice(1)
    : null;

  return (
    <>
      <div style={{
        borderBottom: `1px solid ${THEME.navyDim}`,
        background: THEME.navy,
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.12)",
        position: "sticky", top: 0, zIndex: 10
      }}>
        <div style={{
          maxWidth: 1400, margin: "0 auto",
          padding: mobile ? "12px 16px" : "14px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12
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
            <div className="serif" style={{ fontSize: mobile ? 18 : 21, fontWeight: 700, lineHeight: 1, color: "#FFFFFF" }}>
              Deal Docket
            </div>
          </button>

          {mobile ? (
            // Mobile: single hamburger trigger
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              style={{
                background: "transparent", border: "none",
                color: "#FFFFFF", cursor: "pointer", padding: 6,
                display: "flex", alignItems: "center", gap: 4
              }}
            >
              <Menu size={26} />
            </button>
          ) : (
            // Desktop: full nav
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

              <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.18)", margin: "0 6px" }} aria-hidden="true" />

              <button className="btn-primary" onClick={onNewDeal} aria-label="New deal" style={{ padding: "7px 14px", fontSize: 12 }}>
                <Plus size={14} />
                New Deal
              </button>

              {authConfigured && <AuthSlot planLabel={planLabel} onChangeView={onChangeView} />}
            </div>
          )}
        </div>
      </div>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        primary={primary}
        tools={tools}
        view={view}
        onChangeView={onChangeView}
        onNewDeal={onNewDeal}
        onToolPick={handleToolPick}
        watchlistCount={watchlistCount}
        planLabel={planLabel}
      />
    </>
  );
};
