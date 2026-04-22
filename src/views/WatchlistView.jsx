/* ============================================================================
   WATCHLIST VIEW — saved listings from Market Intel, click to re-open detail.
   ============================================================================ */
import React, { useState, useMemo } from "react";
import { X, Star, Building2 } from "lucide-react";
import { THEME } from "../theme.js";
import { isMobile } from "../utils.js";
import { useAppActions } from "../contexts.jsx";
import { ListingCard } from "../market/ListingCard.jsx";
import { ListingDetailModal } from "../market/ListingDetailModal.jsx";

export const WatchlistView = () => {
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
        <div style={{
          maxWidth: 520, margin: "60px auto 0", padding: 40, textAlign: "center",
          background: THEME.bgPanel, border: `1px solid ${THEME.border}`, borderRadius: 12
        }}>
          <div style={{
            width: 64, height: 64, margin: "0 auto 16px",
            borderRadius: "50%", background: THEME.bgRaised,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Star size={28} color={THEME.accent} />
          </div>
          <h3 className="serif" style={{ fontSize: 20, margin: "0 0 8px" }}>
            No saved properties yet
          </h3>
          <p style={{ fontSize: 13, color: THEME.textMuted, lineHeight: 1.5, marginBottom: 0 }}>
            Head to <strong>Market Intel</strong>, click the star on any listing, and it'll land here.
            Your watchlist is stored locally in this browser.
          </p>
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
                  position: "absolute", top: 18, right: 18,
                  width: 30, height: 30, padding: 0,
                  background: "rgba(255,255,255,0.92)",
                  borderRadius: "50%", border: `1px solid ${THEME.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}
              >
                <X size={13} />
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
