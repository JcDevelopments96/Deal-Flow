/* ============================================================================
   WATCHLIST VIEW — saved listings from Market Intel, click to re-open detail.
   ============================================================================ */
import React, { useState, useMemo } from "react";
import { X, Star, Building2, Search, Crown, ArrowRight } from "lucide-react";
import { THEME } from "../theme.js";
import { isMobile } from "../utils.js";
import { useAppActions } from "../contexts.jsx";
import { ListingCard } from "../market/ListingCard.jsx";
import { ListingDetailModal } from "../market/ListingDetailModal.jsx";

export const WatchlistView = ({ onChangeView }) => {
  const { watchlist, removeWatch, useListingAsDeal } = useAppActions();
  const [detail, setDetail] = useState(null);
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    if (!filter.trim()) return watchlist;
    const q = filter.toLowerCase().trim();
    return watchlist.filter(l =>
      (l.formattedAddress || "").toLowerCase().includes(q) ||
      (l.city || "").toLowerCase().includes(q) ||
      (l.state || "").toLowerCase().includes(q)
    );
  }, [watchlist, filter]);

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile() ? "16px" : "24px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <h1 className="serif" style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
            Watchlist
          </h1>
          <div style={{ fontSize: 13, color: THEME.textMuted, marginTop: 4 }}>
            {watchlist.length} {watchlist.length === 1 ? "property" : "properties"} saved from Market Intel
          </div>
        </div>
        {watchlist.length > 0 && (
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by address, city, or state..."
            style={{ width: 280, padding: "9px 12px", fontSize: 13 }}
          />
        )}
      </div>

      {watchlist.length === 0 ? (
        <div style={{ maxWidth: 720, margin: "32px auto 0" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{
              width: 56, height: 56, margin: "0 auto 14px",
              borderRadius: 12, background: THEME.bgRaised,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Star size={26} color={THEME.accent} />
            </div>
            <h3 className="serif" style={{ fontSize: 22, margin: "0 0 6px", fontWeight: 700 }}>
              Nothing saved yet
            </h3>
            <p style={{ fontSize: 13, color: THEME.textMuted, lineHeight: 1.5, maxWidth: 480, margin: "0 auto" }}>
              Tap the star on any listing or off-market lead and it'll land here. Two ways to get started:
            </p>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile() ? "1fr" : "1fr 1fr",
            gap: 12
          }}>
            {[
              {
                key: "market", icon: <Search size={20} />, color: THEME.accent,
                title: "Browse on-market listings",
                desc: "Open Find Properties, click any pin, then star the ones worth tracking.",
                cta: "Open the map"
              },
              {
                key: "wholesale", icon: <Crown size={20} />, color: "#9333EA",
                title: "Hunt off-market leads",
                desc: "Search by ZIP for absentee owners and pre-foreclosures, then star the ones worth pursuing.",
                cta: "Open Off-Market"
              }
            ].map(c => (
              <button
                key={c.key}
                onClick={() => onChangeView?.(c.key)}
                style={{
                  textAlign: "left", padding: 18,
                  background: THEME.bgPanel,
                  border: `1px solid ${THEME.border}`, borderRadius: 10,
                  cursor: "pointer", display: "flex", flexDirection: "column", gap: 8,
                  transition: "border-color 0.15s, transform 0.15s, box-shadow 0.15s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = c.color;
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(15,23,42,0.10)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = THEME.border;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: c.color, color: "#FFFFFF",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {c.icon}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: THEME.text }}>{c.title}</div>
                <div style={{ fontSize: 12, color: THEME.textMuted, lineHeight: 1.5, flex: 1 }}>{c.desc}</div>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: c.color,
                  display: "inline-flex", alignItems: "center", gap: 4
                }}>
                  {c.cta} <ArrowRight size={12} />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: THEME.textMuted, fontSize: 13 }}>
          No saved properties match "{filter}". Clear the filter to see them all.
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile() ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 14
        }}>
          {filtered.map(listing => (
            <div key={listing.id} style={{ position: "relative" }}>
              <ListingCard
                listing={listing}
                type="sale"
                onOpen={(l, t) => setDetail({ listing: l, type: t })}
              />
              <button
                onClick={(e) => { e.stopPropagation(); removeWatch(listing.id); }}
                aria-label="Remove from watchlist"
                title="Remove"
                className="btn-ghost"
                style={{
                  // 44px hits the WCAG 2.1 AAA touch-target spec — fingers
                  // can reliably hit it on a phone without zooming.
                  position: "absolute", top: 12, right: 12,
                  width: 44, height: 44, padding: 0,
                  background: "rgba(255,255,255,0.92)",
                  borderRadius: "50%", border: `1px solid ${THEME.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(15,23,42,0.10)"
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {detail && (
        <ListingDetailModal
          listing={detail.listing}
          type={detail.type}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
};
