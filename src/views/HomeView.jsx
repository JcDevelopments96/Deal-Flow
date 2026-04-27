/* ============================================================================
   HOME — landing page for both new visitors and returning users.
   Hero → feature grid → 3-step quick start → data attribution. Cards
   in the grid double as nav shortcuts so the page is functional, not
   just marketing collateral.
   ============================================================================ */
import React from "react";
import {
  Search, Crown, Calculator, Star, Users, MessageSquare, Layout,
  Building2, MapPin, Sparkles, ArrowRight, Database, FileText,
  Check, Zap, Layers, TrendingUp, GraduationCap
} from "lucide-react";
import { THEME } from "../theme.js";
import { isMobile } from "../utils.js";
import { Panel } from "../primitives.jsx";
import { isSaasMode, useSaasUser } from "../lib/saas.js";

const FeatureCard = ({ icon, title, desc, cta, onClick, accent }) => (
  <div
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={(e) => { if (onClick && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onClick(); } }}
    style={{
      padding: 20,
      background: THEME.bg,
      border: `1px solid ${THEME.border}`,
      borderRadius: 10,
      cursor: onClick ? "pointer" : "default",
      transition: "border-color 0.15s, transform 0.15s, box-shadow 0.15s",
      display: "flex", flexDirection: "column", gap: 10,
      height: "100%"
    }}
    onMouseEnter={(e) => {
      if (!onClick) return;
      e.currentTarget.style.borderColor = accent || THEME.accent;
      e.currentTarget.style.boxShadow = "0 6px 20px rgba(15,23,42,0.10)";
      e.currentTarget.style.transform = "translateY(-2px)";
    }}
    onMouseLeave={(e) => {
      if (!onClick) return;
      e.currentTarget.style.borderColor = THEME.border;
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
    <div style={{
      width: 40, height: 40, borderRadius: 10,
      background: accent || THEME.accent, color: "#FFFFFF",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      {icon}
    </div>
    <div style={{ fontSize: 15, fontWeight: 700, color: THEME.text, marginTop: 4 }}>
      {title}
    </div>
    <div style={{ fontSize: 13, color: THEME.textMuted, lineHeight: 1.55, flex: 1 }}>
      {desc}
    </div>
    {cta && onClick && (
      <div style={{
        fontSize: 12, fontWeight: 700,
        color: accent || THEME.accent,
        display: "inline-flex", alignItems: "center", gap: 4,
        marginTop: 4
      }}>
        {cta} <ArrowRight size={12} />
      </div>
    )}
  </div>
);

const Step = ({ num, title, desc }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
    <div style={{
      width: 28, height: 28, borderRadius: "50%",
      background: THEME.bgRaised, color: THEME.accent,
      fontSize: 13, fontWeight: 700,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      border: `1px solid ${THEME.accent}`
    }}>
      {num}
    </div>
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.55 }}>{desc}</div>
    </div>
  </div>
);

/* Upsell card — only renders for visitors who'd actually convert
 * (signed-out OR signed-in on the free plan). Pro tier is the anchor:
 * unlocks the wholesale finder, inspections AI, and a 100x bump on
 * Market Intel clicks. Hidden entirely for paid users since they
 * already get everything listed. */
const ProUpsell = ({ onChangeView }) => {
  const features = [
    {
      icon: <Layers size={18} />,
      title: "Save unlimited deals",
      desc: "Free plan caps at 1 saved deal — Pro lets you keep every property you analyze, compare them side-by-side, and track them through the pipeline."
    },
    {
      icon: <TrendingUp size={18} />,
      title: "500 Market Intel clicks / mo",
      desc: "Free plan gives you 10 to try things out. Pro lets you research without watching the meter — flat $0.10 per click after that."
    },
    {
      icon: <MessageSquare size={18} />,
      title: "200 Ari AI messages / mo",
      desc: "20× the free plan. Ask Ari about deals, markets, strategy — with live web search built in."
    },
    {
      icon: <Sparkles size={18} />,
      title: "Everything else stays open",
      desc: "Off-Market lead finder, Ari AI inspection summaries, the full deal analyzer, watchlist, and team CRM are all included on free too — Pro just removes the meters and the deal cap."
    }
  ];

  return (
    <div style={{
      marginBottom: 36,
      padding: isMobile() ? 24 : "32px 36px",
      background: `linear-gradient(135deg, ${THEME.navy} 0%, #1A2332 100%)`,
      color: "#FFFFFF",
      borderRadius: 14,
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Subtle teal accent bar on the left edge */}
      <div style={{
        position: "absolute", top: 0, left: 0, bottom: 0,
        width: 4, background: THEME.accent
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Zap size={14} color={THEME.accent} />
        <span style={{
          fontSize: 11, fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase",
          color: THEME.accent
        }}>
          Most popular · Pro · $79/mo
        </span>
      </div>
      <h2 className="serif" style={{
        fontSize: isMobile() ? 24 : 30, fontWeight: 700,
        margin: "0 0 8px", lineHeight: 1.15
      }}>
        Unlock the full investor toolkit
      </h2>
      <p style={{
        fontSize: 14, color: "rgba(255,255,255,0.7)",
        maxWidth: 620, margin: "0 0 24px", lineHeight: 1.55
      }}>
        Free plan gets you the whole toolkit — Off-Market leads, Ari AI inspections, the full analyzer — but caps at <strong style={{ color: "#FFFFFF" }}>1 saved deal</strong> and 10 Market Intel clicks. Upgrade to keep every deal you analyze.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile() ? "1fr" : "repeat(2, 1fr)",
        gap: 14, marginBottom: 24
      }}>
        {features.map(f => (
          <div key={f.title} style={{
            padding: 16,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 10,
            display: "flex", gap: 12, alignItems: "flex-start"
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: THEME.accent, color: "#FFFFFF",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {f.icon}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                {f.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => onChangeView("plans")}
          style={{
            padding: "12px 22px", fontSize: 14, fontWeight: 700,
            background: THEME.accent, color: "#FFFFFF",
            border: "none", borderRadius: 8, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6
          }}
        >
          See plans <ArrowRight size={14} />
        </button>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
          Cancel anytime · Annual saves 17% · Starter from $29/mo
        </span>
      </div>
    </div>
  );
};

export const HomeView = ({ onChangeView, onNewDeal, onOpenCalculator }) => {
  // Show the upgrade pitch to anyone who could plausibly convert: not
  // signed in, OR signed in on the free plan. Paid users don't need to
  // see "upgrade to unlock" copy.
  const saas = useSaasUser();
  const showUpsell = !isSaasMode() || !saas.user || saas.usage?.plan === "free";
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile() ? "16px" : "32px 28px" }}>
      {/* HERO ─────────────────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 12px", marginBottom: 18,
          background: THEME.bgRaised, color: THEME.accent,
          borderRadius: 999, fontSize: 11, fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase"
        }}>
          <Sparkles size={12} /> The Real Estate Investor's end-to-end toolkit
        </div>
        <h1 className="serif" style={{ fontSize: isMobile() ? 30 : 42, fontWeight: 700, margin: 0, lineHeight: 1.1 }}>
          Find, analyze, and close real estate deals
        </h1>
        <p style={{
          fontSize: isMobile() ? 14 : 16, color: THEME.textMuted,
          maxWidth: 640, margin: "16px auto 0", lineHeight: 1.55
        }}>
          Deal Docket pulls together everything an investor needs in one place — live MLS listings, off-market wholesale leads, a county-level market map, deal analysis, and a vetted local-pro directory. No more juggling six tabs.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
          <button
            onClick={() => onChangeView("market")}
            className="btn-primary"
            style={{ padding: "12px 22px", fontSize: 14 }}>
            <Search size={15} /> Find a property
          </button>
          <button
            onClick={onNewDeal}
            className="btn-secondary"
            style={{ padding: "12px 22px", fontSize: 14 }}>
            <Calculator size={15} /> Analyze a deal
          </button>
        </div>
      </div>

      {/* FEATURE GRID ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 18px" }}>
          What you can do
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile() ? "1fr" : "repeat(3, 1fr)",
          gap: 14
        }}>
          <FeatureCard
            icon={<Search size={20} />}
            title="Find Properties"
            desc="Live for-sale listings across all 50 states, with a county-level home-value heat map, real OSM tile basemap, and per-listing detail (flood zone, walk score, schools, satellite + street view)."
            cta="Open the map"
            onClick={() => onChangeView("market")}
          />
          <FeatureCard
            icon={<Crown size={20} />}
            title="Off-Market Lead Finder"
            desc="Find absentee owners, long-time holders, and pre-foreclosure properties by city or ZIP. Owner names + mailing addresses included. Skip-trace for phone/email and email leads in-app."
            cta="Hunt off-market deals"
            onClick={() => onChangeView("wholesale")}
            accent="#9333EA"
          />
          <FeatureCard
            icon={<FileText size={20} />}
            title="Ari AI Inspection Summaries"
            desc="Drop in any home-inspection PDF — Ari AI reads it cover-to-cover and returns urgent issues, immediate repairs, recommended maintenance, and rough cost estimates. Export to PDF / Excel / Word."
            cta="Try the inspector"
            onClick={() => onChangeView("inspections")}
            accent="#DC2626"
          />
          <FeatureCard
            icon={<Calculator size={20} />}
            title="Deal Analyzer"
            desc="Plug in price, rehab, ARV, rents — get cash flow, cap rate, cash-on-cash, IRR, and a 30-year projection. BRRRR, fix-and-flip, and buy-and-hold templates included."
            cta="Run the numbers"
            onClick={() => onChangeView("dashboard")}
          />
          <FeatureCard
            icon={<Star size={20} />}
            title="Watchlist"
            desc="Save any listing or wholesale lead. Synced across devices. One-click jump back into the analyzer with the property pre-loaded."
            cta="See what's saved"
            onClick={() => onChangeView("watchlist")}
            accent={THEME.teal}
          />
          <FeatureCard
            icon={<Users size={20} />}
            title="Team & Local Pros"
            desc="Build your roster of agents, lenders, contractors, PMs, attorneys. Search Google Places + Yelp by category and ZIP — verified-by-both pros get a green badge. NMLS verify links for lenders."
            cta="Build your team"
            onClick={() => onChangeView("team")}
            accent="#0891B2"
          />
          <FeatureCard
            icon={<MessageSquare size={20} />}
            title="Ari AI Assistant"
            desc="Ask Ari AI anything about a market, a strategy, or a specific deal. Live web search built in — gets you current data, not training-set answers from years ago."
            cta=""
            onClick={null}
            accent="#F97316"
          />
          <FeatureCard
            icon={<GraduationCap size={20} />}
            title="Learn"
            desc="BRRRR walkthroughs, financing strategies, market analysis, risk frameworks, and a searchable glossary. Built-in curriculum so you don't have to bounce between YouTube and 12 podcast episodes."
            cta="Start learning"
            onClick={() => onChangeView("education")}
            accent="#16A34A"
          />
        </div>
      </div>

      {/* HOW IT WORKS ─────────────────────────────────────────────────── */}
      <Panel title="3 ways to start" icon={<Layout size={16} />} accent style={{ marginBottom: 36 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile() ? "1fr" : "1fr 1fr 1fr",
          gap: 20
        }}>
          <Step
            num="1"
            title="Browse listings on the map"
            desc="Open Find Properties → pick a state → live MLS listings load. Click any pin to see full details, flood zone, schools, and Airbnb income potential."
          />
          <Step
            num="2"
            title="Hunt off-market leads"
            desc="Open Off-Market → search by city or ZIP → get a sorted list of distressed and absentee-owner properties. Save the best ones, skip-trace, and email."
          />
          <Step
            num="3"
            title="Analyze and close"
            desc="Open the Deal Analyzer → input or pull from a saved listing → review cash flow, ROI, and your 30-year projection. Use the BRRRR template if that's the play."
          />
        </div>
      </Panel>

      {/* PRO UPSELL ──────────────────────────────────────────────────────
          Sits between the "how it works" beat and the data-sources panel,
          right when the user has just learned what's possible and is most
          primed to commit. Hidden for paid users who already get all of
          this. */}
      {showUpsell && <ProUpsell onChangeView={onChangeView} />}

      {/* DATA SOURCES ─────────────────────────────────────────────────── */}
      <Panel title="Powered by trusted data" icon={<Database size={16} />} style={{ marginBottom: 36 }}>
        <p style={{ fontSize: 13, color: THEME.textMuted, lineHeight: 1.6, marginTop: 0 }}>
          Deal Docket stitches together best-in-class data sources so the numbers you see are the real numbers, not estimates from a single API:
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile() ? "1fr 1fr" : "repeat(4, 1fr)",
          gap: 12, marginTop: 8
        }}>
          {[
            { label: "Realtor.com", desc: "Live MLS listings + photos" },
            { label: "RealEstateAPI", desc: "Owner records + foreclosure" },
            { label: "BatchData", desc: "Skip-trace phone + email" },
            { label: "Zillow ZHVI", desc: "Home value indexes" },
            { label: "Google Maps", desc: "Street + aerial + Places" },
            { label: "FEMA NFHL", desc: "Flood zone lookups" },
            { label: "US Census", desc: "Demographics + income" },
            { label: "HUD FMR", desc: "Fair-market rents" }
          ].map(s => (
            <div key={s.label} style={{
              padding: 12, background: THEME.bgPanel,
              border: `1px solid ${THEME.borderLight}`, borderRadius: 8
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: THEME.text }}>{s.label}</div>
              <div style={{ fontSize: 10, color: THEME.textMuted, marginTop: 2 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* CTA FOOTER ───────────────────────────────────────────────────── */}
      <div style={{
        textAlign: "center", padding: "28px 20px",
        background: THEME.bgPanel, borderRadius: 12,
        border: `1px solid ${THEME.border}`
      }}>
        <Building2 size={28} color={THEME.accent} style={{ marginBottom: 8 }} />
        <h3 className="serif" style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>
          Ready to find your next deal?
        </h3>
        <p style={{ fontSize: 13, color: THEME.textMuted, maxWidth: 520, margin: "0 auto 18px", lineHeight: 1.55 }}>
          Free plan includes 5 Market Intel clicks and the full Deal Analyzer, Watchlist, Team CRM, and Ari AI assistant. Upgrade when you outgrow it.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => onChangeView("market")} className="btn-primary" style={{ padding: "10px 18px", fontSize: 13 }}>
            <MapPin size={13} /> Open the map
          </button>
          <button onClick={() => onChangeView("plans")} className="btn-secondary" style={{ padding: "10px 18px", fontSize: 13 }}>
            See plans
          </button>
        </div>
      </div>
    </div>
  );
};
