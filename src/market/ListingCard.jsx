/* ============================================================================
   LISTING CARD — card used by LiveListingsPanel, WatchlistView, and the
   Market Intel search results. ListingImage hero + metrics + actions.
   ============================================================================ */
import React, { useState } from "react";
import { Building2, ExternalLink, Star, Plus } from "lucide-react";
import { THEME } from "../theme.js";
import { fmtUSD } from "../utils.js";
import { useAppActions } from "../contexts.jsx";

export const ListingImage = ({ url, demo }) => {
  const [errored, setErrored] = useState(false);
  const showImage = url && !errored;
  return (
    <div style={{
      position: "relative",
      width: "100%",
      aspectRatio: "16 / 10",
      borderRadius: 6,
      overflow: "hidden",
      background: THEME.bgPanel,
      marginBottom: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      {showImage ? (
        <img
          src={url}
          alt=""
          onError={() => setErrored(true)}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <Building2 size={32} color={THEME.textDim} />
      )}
      {demo && (
        <div style={{
          position: "absolute", top: 8, right: 8,
          padding: "2px 7px", fontSize: 9, fontWeight: 700,
          background: "rgba(15, 23, 42, 0.72)", color: "#fff",
          borderRadius: 4, letterSpacing: "0.06em", textTransform: "uppercase"
        }}>
          Demo
        </div>
      )}
    </div>
  );
};

export const ListingCard = ({ listing, type = "sale", onOpen, showWatchToggle = true }) => {
  const isRental = type === "rental";
  const { isWatched, toggleWatch, useListingAsDeal } = useAppActions();
  const watched = isWatched(listing.id);

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
        padding: 12,
        border: `1px solid ${THEME.border}`,
        borderRadius: 8,
        background: THEME.bg,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        cursor: onOpen ? "pointer" : "default",
        transition: "border-color 0.15s ease, transform 0.15s ease"
      }}
      onMouseEnter={e => {
        if (onOpen) e.currentTarget.style.borderColor = THEME.accent;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = THEME.border;
      }}
    >
      <div style={{ position: "relative" }}>
        <ListingImage url={listing.imageUrl} demo={listing.demo} />
        {showWatchToggle && (
          <button
            type="button"
            aria-label={watched ? "Remove from watchlist" : "Save to watchlist"}
            title={watched ? "Remove from watchlist" : "Save to watchlist"}
            onClick={(e) => { e.stopPropagation(); toggleWatch(listing); }}
            style={{
              position: "absolute", top: 8, left: 8,
              width: 30, height: 30, borderRadius: "50%",
              background: watched ? THEME.accent : "rgba(255,255,255,0.92)",
              color: watched ? "#fff" : THEME.textMuted,
              border: `1px solid ${watched ? THEME.accent : THEME.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(15,23,42,0.12)"
            }}
          >
            <Star size={14} fill={watched ? "#fff" : "none"} />
          </button>
        )}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: THEME.text, marginBottom: 4 }}>
        {listing.formattedAddress}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: isRental ? THEME.teal : THEME.orange }}>
          {fmtUSD(listing.price)}{isRental ? <span style={{ fontSize: 11, fontWeight: 500, color: THEME.textMuted }}> /mo</span> : null}
        </div>
        {listing.pricePerSqft && (
          <div style={{ fontSize: 11, color: THEME.textMuted }}>
            {isRental ? `$${listing.pricePerSqft}/sqft` : `${fmtUSD(listing.pricePerSqft)}/sqft`}
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, fontSize: 11, marginBottom: 10 }}>
        <div>
          <div style={{ color: THEME.textDim }}>BEDS</div>
          <div style={{ fontWeight: 600 }}>{listing.bedrooms || "—"}</div>
        </div>
        <div>
          <div style={{ color: THEME.textDim }}>BATHS</div>
          <div style={{ fontWeight: 600 }}>{listing.bathrooms || "—"}</div>
        </div>
        <div>
          <div style={{ color: THEME.textDim }}>SQFT</div>
          <div style={{ fontWeight: 600 }}>{listing.squareFootage ? listing.squareFootage.toLocaleString() : "—"}</div>
        </div>
        <div>
          <div style={{ color: THEME.textDim }}>DOM</div>
          <div style={{ fontWeight: 600 }}>{listing.daysOnMarket ?? "—"}</div>
        </div>
      </div>
      <div style={{
        fontSize: 10, color: THEME.textMuted,
        paddingTop: 8, borderTop: `1px solid ${THEME.borderLight}`,
        display: "flex", justifyContent: "space-between"
      }}>
        <span>{listing.propertyType || "—"}</span>
        {listing.yearBuilt && <span>Built {listing.yearBuilt}</span>}
      </div>
      {listing.externalUrl && (
        <a
          href={listing.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            marginTop: 8, fontSize: 11, color: THEME.accent,
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
          style={{ width: "100%", marginTop: 10, padding: "6px 10px", fontSize: 11 }}
        >
          <Plus size={12} /> Use in Deal Analyzer
        </button>
      )}
    </div>
  );
};
