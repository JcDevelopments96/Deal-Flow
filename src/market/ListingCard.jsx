/* ============================================================================
   LISTING CARD — Zillow/Redfin-style card: edge-to-edge 4:3 photo with
   overlays (watchlist star, photo count, demo badge), then price + inline
   stats + address + actions below.
   ============================================================================ */
import React, { useState } from "react";
import { Building2, Camera, ChevronLeft, ChevronRight, ExternalLink, Star, Plus } from "lucide-react";
import { THEME } from "../theme.js";
import { fmtUSD } from "../utils.js";
import { useAppActions } from "../contexts.jsx";

/**
 * ListingImage — Zillow/Redfin-style hero photo with a simple carousel.
 *
 * Accepts either:
 *   - `photos` array (preferred)  → arrows + count indicator when > 1
 *   - `url` single URL (legacy)   → still works for older callers
 *
 * The arrows and count badge only appear when there's more than one photo.
 * Arrow clicks stop propagation so they don't trigger the card's onOpen.
 */
export const ListingImage = ({ photos, url, demo, photoCount }) => {
  const urls = Array.isArray(photos) && photos.length > 0
    ? photos
    : url
      ? [url]
      : [];
  const count = urls.length;
  const [index, setIndex] = useState(0);
  const [errored, setErrored] = useState(false);
  const current = urls[index] || null;
  const showImage = current && !errored;

  const prev = (e) => {
    e.stopPropagation();
    setErrored(false);
    setIndex(i => (i - 1 + count) % count);
  };
  const next = (e) => {
    e.stopPropagation();
    setErrored(false);
    setIndex(i => (i + 1) % count);
  };

  const arrowStyle = {
    position: "absolute", top: "50%",
    transform: "translateY(-50%)",
    width: 32, height: 32, borderRadius: "50%",
    background: "rgba(15, 23, 42, 0.55)", color: "#fff",
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.12s ease"
  };

  return (
    <div style={{
      position: "relative",
      width: "100%",
      aspectRatio: "4 / 3",
      background: THEME.bgPanel,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    }}>
      {showImage ? (
        <img
          src={current}
          alt=""
          onError={() => setErrored(true)}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <Building2 size={40} color={THEME.textDim} />
      )}

      {/* Arrows — only when there's actually something to scroll through */}
      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={prev}
            style={{ ...arrowStyle, left: 8 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(15, 23, 42, 0.82)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(15, 23, 42, 0.55)"; }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={next}
            style={{ ...arrowStyle, right: 8 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(15, 23, 42, 0.82)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(15, 23, 42, 0.55)"; }}
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {demo && (
        <div style={{
          position: "absolute", top: 10, left: 10,
          padding: "3px 9px", fontSize: 9, fontWeight: 700,
          background: "rgba(15, 23, 42, 0.82)", color: "#fff",
          borderRadius: 4, letterSpacing: "0.08em", textTransform: "uppercase"
        }}>
          Demo
        </div>
      )}
      {/* Two cases for the camera badge:
          - We have multiple URLs → show scroll position "i / n"
          - We only have the primary photo but the upstream told us more exist
            (Realtor v3/list returns photo_count but only one photo URL) → show "N photos"
            so the user knows more are available on the full listing page. */}
      {count > 1 ? (
        <div style={{
          position: "absolute", bottom: 10, right: 10,
          padding: "3px 9px 3px 8px", fontSize: 11, fontWeight: 700,
          background: "rgba(15, 23, 42, 0.78)", color: "#fff",
          borderRadius: 12,
          display: "inline-flex", alignItems: "center", gap: 4
        }}>
          <Camera size={11} />
          {index + 1} / {count}
        </div>
      ) : (showImage && typeof photoCount === "number" && photoCount > 1) ? (
        <div style={{
          position: "absolute", bottom: 10, right: 10,
          padding: "3px 9px 3px 8px", fontSize: 11, fontWeight: 700,
          background: "rgba(15, 23, 42, 0.78)", color: "#fff",
          borderRadius: 12,
          display: "inline-flex", alignItems: "center", gap: 4
        }}>
          <Camera size={11} />
          {photoCount} photos
        </div>
      ) : null}
    </div>
  );
};

export const ListingCard = ({ listing, type = "sale", onOpen, showWatchToggle = true }) => {
  const isRental = type === "rental";
  const { isWatched, toggleWatch, useListingAsDeal } = useAppActions();
  const watched = isWatched(listing.id);

  const formatStat = (v, suffix) => (v || v === 0 ? `${typeof v === "number" ? v.toLocaleString() : v}${suffix}` : null);
  const beds = formatStat(listing.bedrooms, " bd");
  const baths = formatStat(listing.bathrooms, " ba");
  const sqft = formatStat(listing.squareFootage, " sqft");
  const inlineStats = [beds, baths, sqft].filter(Boolean).join("  ·  ");

  return (
    <div
      onClick={() => onOpen && onOpen(listing, type)}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => {
        if (onOpen && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpen(listing, type);
        }
      }}
      style={{
        border: `1px solid ${THEME.border}`,
        borderRadius: 10,
        background: THEME.bg,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: onOpen ? "pointer" : "default",
        transition: "border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease"
      }}
      onMouseEnter={e => {
        if (onOpen) {
          e.currentTarget.style.borderColor = THEME.accent;
          e.currentTarget.style.boxShadow = "0 4px 14px rgba(15, 23, 42, 0.08)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = THEME.border;
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Hero photo area — edge-to-edge */}
      <div style={{ position: "relative" }}>
        <ListingImage photos={listing.photos} url={listing.imageUrl} demo={listing.demo} photoCount={listing.photoCount} />
        {showWatchToggle && (
          <button
            type="button"
            aria-label={watched ? "Remove from watchlist" : "Save to watchlist"}
            title={watched ? "Remove from watchlist" : "Save to watchlist"}
            onClick={(e) => { e.stopPropagation(); toggleWatch(listing); }}
            style={{
              position: "absolute", top: 10, right: 10,
              width: 34, height: 34, borderRadius: "50%",
              background: watched ? THEME.accent : "rgba(255,255,255,0.95)",
              color: watched ? "#fff" : THEME.textMuted,
              border: `1px solid ${watched ? THEME.accent : THEME.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(15,23,42,0.15)"
            }}
          >
            <Star size={16} fill={watched ? "#fff" : "none"} />
          </button>
        )}
      </div>

      {/* Info block */}
      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Price — big and bold, Zillow-style */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          <div className="mono" style={{
            fontSize: 22, fontWeight: 700,
            color: isRental ? THEME.teal : THEME.accent,
            lineHeight: 1.1
          }}>
            {fmtUSD(listing.price)}
            {isRental && (
              <span style={{ fontSize: 12, fontWeight: 500, color: THEME.textMuted, marginLeft: 4 }}>
                /mo
              </span>
            )}
          </div>
          {listing.pricePerSqft && (
            <div style={{ fontSize: 10, color: THEME.textDim, whiteSpace: "nowrap" }}>
              {isRental ? `$${listing.pricePerSqft}` : fmtUSD(listing.pricePerSqft)} /sqft
            </div>
          )}
        </div>

        {/* Beds · Baths · Sqft — inline divider */}
        {inlineStats && (
          <div style={{ fontSize: 13, fontWeight: 600, color: THEME.text }}>
            {inlineStats}
          </div>
        )}

        {/* Address (secondary) */}
        <div style={{
          fontSize: 12, color: THEME.textMuted,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
        }}>
          {listing.formattedAddress}
        </div>

        {/* Meta line */}
        <div style={{
          fontSize: 10, color: THEME.textDim,
          paddingTop: 6, borderTop: `1px solid ${THEME.borderLight}`,
          display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap"
        }}>
          <span>{listing.propertyType || "—"}</span>
          <span>
            {listing.yearBuilt ? `Built ${listing.yearBuilt}` : ""}
            {listing.yearBuilt && listing.daysOnMarket != null ? " · " : ""}
            {listing.daysOnMarket != null ? `${listing.daysOnMarket} days on market` : ""}
          </span>
        </div>

        {/* External link + primary action */}
        {listing.externalUrl && (
          <a
            href={listing.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              fontSize: 11, color: THEME.accent,
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4
            }}
          >
            <ExternalLink size={11} /> View full listing
          </a>
        )}
        {!isRental && (
          <button
            onClick={(e) => { e.stopPropagation(); useListingAsDeal(listing); }}
            className="btn-secondary"
            style={{ width: "100%", marginTop: 4, padding: "7px 10px", fontSize: 11, justifyContent: "center" }}
          >
            <Plus size={12} /> Use in Deal Analyzer
          </button>
        )}
      </div>
    </div>
  );
};
