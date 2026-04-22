/* ============================================================================
   LISTING DETAIL MODAL — expanded single-listing view with Analyze /
   Save to Watchlist / Full Listing actions.
   ============================================================================ */
import React, { useEffect } from "react";
import { X, Star, Calculator, ExternalLink, AlertTriangle, Building2 } from "lucide-react";
import { THEME } from "../theme.js";
import { fmtUSD } from "../utils.js";
import { useAppActions } from "../contexts.jsx";

export const ListingDetailModal = ({ listing, type = "sale", onClose }) => {
  const { isWatched, toggleWatch, useListingAsDeal } = useAppActions();
  const watched = isWatched(listing.id);
  const isRental = type === "rental";

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const listedAgo = listing.listedDate
    ? Math.max(0, Math.round((Date.now() - new Date(listing.listedDate).getTime()) / 86400000))
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-title"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 150, padding: 16,
        overflowY: "auto"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: THEME.bg, borderRadius: 12,
          maxWidth: 720, width: "100%",
          marginTop: 40, marginBottom: 40,
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.22)",
          animation: "modalFadeIn 0.2s ease-out",
          overflow: "hidden"
        }}
      >
        {/* Hero image */}
        <div style={{ position: "relative" }}>
          <div style={{ aspectRatio: "16 / 9", background: THEME.bgPanel, overflow: "hidden" }}>
            {listing.imageUrl ? (
              <img
                src={listing.imageUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{
                width: "100%", height: "100%",
                background: THEME.bgPanel,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <Building2 size={64} color={THEME.textDim} />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close listing details"
            style={{
              position: "absolute", top: 12, right: 12,
              width: 34, height: 34, borderRadius: "50%",
              background: "rgba(15,23,42,0.72)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "none", cursor: "pointer"
            }}
          >
            <X size={16} />
          </button>
          <button
            type="button"
            aria-label={watched ? "Remove from watchlist" : "Save to watchlist"}
            onClick={() => toggleWatch(listing)}
            style={{
              position: "absolute", top: 12, right: 56,
              padding: "6px 12px", fontSize: 12, fontWeight: 700,
              background: watched ? THEME.accent : "rgba(255,255,255,0.92)",
              color: watched ? "#fff" : THEME.text,
              border: `1px solid ${watched ? THEME.accent : THEME.border}`,
              borderRadius: 6,
              display: "inline-flex", alignItems: "center", gap: 6,
              cursor: "pointer"
            }}
          >
            <Star size={13} fill={watched ? "#fff" : "none"} />
            {watched ? "Saved" : "Save"}
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Header */}
          <h2 id="listing-title" className="serif" style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>
            {listing.formattedAddress}
          </h2>
          <div style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 16 }}>
            {listing.propertyType || "—"}
            {listing.yearBuilt && <> &middot; Built {listing.yearBuilt}</>}
            {listedAgo !== null && <> &middot; Listed {listedAgo} day{listedAgo === 1 ? "" : "s"} ago</>}
          </div>

          {/* Price row */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
            <div className="mono" style={{ fontSize: 34, fontWeight: 700, color: isRental ? THEME.teal : THEME.accent }}>
              {fmtUSD(listing.price)}{isRental && <span style={{ fontSize: 16, fontWeight: 500, color: THEME.textMuted }}> /mo</span>}
            </div>
            {listing.pricePerSqft && (
              <div style={{ fontSize: 13, color: THEME.textMuted }}>
                {isRental ? `$${listing.pricePerSqft}` : fmtUSD(listing.pricePerSqft)} / sqft
              </div>
            )}
            {listing.status && (
              <div style={{
                padding: "3px 10px", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.08em", textTransform: "uppercase",
                background: THEME.greenDim, color: THEME.green, borderRadius: 4
              }}>
                {listing.status}
              </div>
            )}
          </div>

          {/* Stats grid */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12, marginBottom: 20,
            padding: 16, background: THEME.bgPanel, borderRadius: 8
          }}>
            <div>
              <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 2 }}>BEDROOMS</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{listing.bedrooms ?? "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 2 }}>BATHROOMS</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{listing.bathrooms ?? "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 2 }}>SQFT</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {listing.squareFootage ? listing.squareFootage.toLocaleString() : "—"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 2 }}>DAYS ON MARKET</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{listing.daysOnMarket ?? "—"}</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {!isRental && (
              <button
                onClick={() => { useListingAsDeal(listing); onClose(); }}
                className="btn-primary"
                style={{ flex: 1, minWidth: 180, padding: "10px 14px", fontSize: 13 }}
              >
                <Calculator size={14} /> Analyze this Deal
              </button>
            )}
            <button
              onClick={() => toggleWatch(listing)}
              className={watched ? "btn-accent-teal" : "btn-secondary"}
              style={{ flex: 1, minWidth: 150, padding: "10px 14px", fontSize: 13 }}
            >
              <Star size={14} fill={watched ? "#fff" : "none"} />
              {watched ? "Saved to Watchlist" : "Save to Watchlist"}
            </button>
            {listing.externalUrl && (
              <a
                href={listing.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{
                  padding: "10px 14px", fontSize: 13,
                  textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6
                }}
              >
                <ExternalLink size={14} /> Full Listing
              </a>
            )}
          </div>

          {listing.demo && (
            <div style={{
              marginTop: 16, padding: "10px 12px",
              background: THEME.bgOrange, color: THEME.orange,
              borderRadius: 6, fontSize: 11, lineHeight: 1.5
            }}>
              <AlertTriangle size={12} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
              This is sample data. Connect a RentCast or Zillow API key in the Live Listings panel to see real properties.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
