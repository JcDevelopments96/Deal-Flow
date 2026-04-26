/* ============================================================================
   LISTING DETAIL MODAL — expanded single-listing view with Analyze /
   Save to Watchlist / Full Listing actions.
   ============================================================================ */
import React, { useEffect, useState, useMemo } from "react";
import { X, Star, Calculator, ExternalLink, AlertTriangle, Building2, Droplets, Footprints, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, Camera, GraduationCap, MapPin } from "lucide-react";
import { THEME } from "../theme.js";
import { fmtUSD } from "../utils.js";
import { useAppActions } from "../contexts.jsx";
import { isSaasMode, useSaasUser, fetchFloodZone, fetchWalkScore, fetchListingDetail, fetchPropertyPhotos, fetchNearby, fetchStrEstimate } from "../lib/saas.js";
import { InspectionPanel } from "../inspection/InspectionPanel.jsx";
import { estimateCashflow } from "./cashflow.js";

export const ListingDetailModal = ({ listing, type = "sale", onClose, countyFmr, mortgageRate, countyStats }) => {
  const { isWatched, toggleWatch, useListingAsDeal } = useAppActions();
  const watched = isWatched(listing.id);
  const isRental = type === "rental";

  // Find the county stats row for THIS listing's county (not necessarily
  // the clicked one — e.g. state-wide fetch returns listings from many counties).
  const listingCountyStats = useMemo(() => {
    if (!countyStats || !listing.county || typeof listing.county !== "string") return null;
    const key = listing.county.toLowerCase().replace(/\s+county$/i, "");
    return countyStats[key] || null;
  }, [countyStats, listing.county]);

  const cashflow = useMemo(
    () => (!isRental ? estimateCashflow({
      price: listing.price,
      bedrooms: listing.bedrooms,
      fmr: countyFmr,
      mortgageRate
    }) : null),
    [isRental, listing.price, listing.bedrooms, countyFmr, mortgageRate]
  );

  // Compare this listing to the county median — tells investors at a glance
  // whether they're looking at a discount or premium property.
  const priceComparison = useMemo(() => {
    if (!listingCountyStats || !listing.price) return null;
    const median = listingCountyStats.medianPrice;
    if (!median) return null;
    const priceDeltaPct = +(((listing.price - median) / median) * 100).toFixed(1);
    const ppsqftDelta = (listing.pricePerSqft && listingCountyStats.medianPpsqft)
      ? +(((listing.pricePerSqft - listingCountyStats.medianPpsqft) / listingCountyStats.medianPpsqft) * 100).toFixed(1)
      : null;
    return {
      median,
      priceDeltaPct,
      medianPpsqft: listingCountyStats.medianPpsqft,
      ppsqftDelta,
      sampleSize: listingCountyStats.listingCount
    };
  }, [listingCountyStats, listing.price, listing.pricePerSqft]);

  // On-demand enrichment — fired when the modal opens, per-listing, cached
  // server-side so re-opening the same listing is free.
  const saas = useSaasUser();
  const saasOn = isSaasMode();
  const [flood, setFlood] = useState(null);
  const [floodErr, setFloodErr] = useState(null);
  const [walk, setWalk] = useState(null);
  const [walkErr, setWalkErr] = useState(null);
  const [gmapsPhotos, setGmapsPhotos] = useState(null);  // { streetview_url, satellite_url }
  const [nearby, setNearby] = useState(null);             // { schools: [...], amenityCounts: {...} }
  const [str, setStr] = useState(null);                   // { available, revenue, occupancy, adrLow, adrHigh, monthly }
  const [intelLoading, setIntelLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [heroErrored, setHeroErrored] = useState(false);

  // Fetch the full gallery + description for this listing on open. Unmetered
  // — user already paid a click for the listings fetch that produced this id.
  useEffect(() => {
    if (!saasOn || !saas.user || !listing.id || listing.demo) return;
    let cancelled = false;
    setDetailLoading(true);
    fetchListingDetail(saas.getToken, { id: listing.id })
      .then(d => { if (!cancelled) setDetail(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing.id, saasOn, saas.user]);

  // Unified photo array: prefer detail's full gallery, fall back to the
  // single primary photo from the listings fetch.
  const photos = useMemo(() => {
    const fromDetail = Array.isArray(detail?.photos) ? detail.photos.filter(Boolean) : [];
    if (fromDetail.length > 0) return fromDetail;
    const fromListing = Array.isArray(listing.photos) ? listing.photos.filter(Boolean) : [];
    if (fromListing.length > 0) return fromListing;
    return listing.imageUrl ? [listing.imageUrl] : [];
  }, [detail, listing.photos, listing.imageUrl]);

  // Reset carousel + hero error when a different listing opens.
  useEffect(() => { setPhotoIdx(0); setHeroErrored(false); }, [listing.id]);
  // Also clamp the index if the photo set shrinks.
  useEffect(() => { if (photoIdx >= photos.length) setPhotoIdx(0); }, [photoIdx, photos.length]);
  useEffect(() => {
    if (!saasOn || !saas.user) return;
    const lat = Number(listing.latitude);
    const lng = Number(listing.longitude);
    setFlood(null); setWalk(null); setGmapsPhotos(null); setNearby(null); setStr(null);
    setFloodErr(null); setWalkErr(null);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
      setFloodErr("This listing has no geocode (lat/lng) — Realtor didn't return coordinates for it.");
      setWalkErr("This listing has no geocode.");
      return;
    }
    let cancelled = false;
    setIntelLoading(true);
    Promise.allSettled([
      fetchFloodZone(saas.getToken, { lat, lng }),
      fetchWalkScore(saas.getToken, { lat, lng, address: listing.formattedAddress }),
      fetchPropertyPhotos(saas.getToken, { lat, lng, address: listing.formattedAddress }),
      fetchNearby(saas.getToken, { lat, lng }),
      fetchStrEstimate(saas.getToken, { address: listing.formattedAddress, lat, lng })
    ]).then(([floodRes, walkRes, photosRes, nearbyRes, strRes]) => {
      if (cancelled) return;
      if (floodRes.status === "fulfilled") setFlood(floodRes.value);
      else setFloodErr(floodRes.reason?.message || "Flood lookup failed");
      if (walkRes.status === "fulfilled") setWalk(walkRes.value);
      else setWalkErr(walkRes.reason?.detail || walkRes.reason?.message || null);
      if (photosRes.status === "fulfilled") setGmapsPhotos(photosRes.value);
      if (nearbyRes.status === "fulfilled") setNearby(nearbyRes.value);
      if (strRes.status === "fulfilled") setStr(strRes.value);
    }).finally(() => { if (!cancelled) setIntelLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saasOn, saas.user, listing.id, listing.latitude, listing.longitude]);

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
        {/* Hero carousel — uses the full Realtor gallery when the detail
            fetch returns one, falls back to the listing's primary photo. */}
        <div style={{ position: "relative" }}>
          <div style={{ aspectRatio: "16 / 9", background: THEME.bgPanel, overflow: "hidden", position: "relative" }}>
            {photos.length > 0 && !heroErrored ? (
              <img
                key={photos[photoIdx]}
                src={photos[photoIdx]}
                alt=""
                onError={() => setHeroErrored(true)}
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

            {/* Carousel arrows — only when multiple photos */}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={() => { setHeroErrored(false); setPhotoIdx(i => (i - 1 + photos.length) % photos.length); }}
                  style={{
                    position: "absolute", top: "50%", left: 12, transform: "translateY(-50%)",
                    width: 40, height: 40, borderRadius: "50%",
                    background: "rgba(15, 23, 42, 0.55)", color: "#fff", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                  }}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={() => { setHeroErrored(false); setPhotoIdx(i => (i + 1) % photos.length); }}
                  style={{
                    position: "absolute", top: "50%", right: 12, transform: "translateY(-50%)",
                    width: 40, height: 40, borderRadius: "50%",
                    background: "rgba(15, 23, 42, 0.55)", color: "#fff", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                  }}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Photo count badge bottom-right */}
            {(photos.length > 1 || detailLoading) && (
              <div style={{
                position: "absolute", bottom: 12, right: 12,
                padding: "4px 10px", fontSize: 11, fontWeight: 700,
                background: "rgba(15, 23, 42, 0.78)", color: "#fff",
                borderRadius: 12,
                display: "inline-flex", alignItems: "center", gap: 5
              }}>
                <Camera size={11} />
                {detailLoading && photos.length <= 1
                  ? "Loading photos…"
                  : `${photoIdx + 1} / ${detail?.photoCount || photos.length}`}
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

          {/* Long-form description from Realtor's detail endpoint. Shown
              below the stats grid when present — gives the full listing
              narrative without leaving the app. */}
          {detail?.description && (
            <div style={{
              padding: 14, marginBottom: 20,
              background: THEME.bgPanel, border: `1px solid ${THEME.border}`, borderRadius: 8,
              fontSize: 12, color: THEME.textMuted, lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              maxHeight: 180, overflowY: "auto"
            }}>
              {detail.description}
            </div>
          )}

          {/* County-median comparison — derived from the live listings fetch,
              lets users instantly see if this property is priced above/below
              its county. */}
          {priceComparison && (
            <div style={{
              padding: 14, marginBottom: 20,
              background: THEME.bgPanel, border: `1px solid ${THEME.border}`, borderRadius: 8
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: THEME.textMuted, marginBottom: 10 }}>
                vs. County Median
                <span style={{ marginLeft: 8, fontWeight: 500 }}>
                  ({priceComparison.sampleSize} comparable listing{priceComparison.sampleSize === 1 ? "" : "s"})
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: THEME.textMuted }}>Price</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                    {fmtUSD(listing.price)} vs {fmtUSD(priceComparison.median, { short: true })}
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 700, marginTop: 4,
                    color: priceComparison.priceDeltaPct < 0 ? THEME.green
                         : priceComparison.priceDeltaPct > 5 ? THEME.orange
                         : THEME.textMuted,
                    display: "inline-flex", alignItems: "center", gap: 4
                  }}>
                    {priceComparison.priceDeltaPct < 0 ? <TrendingDown size={12} /> : priceComparison.priceDeltaPct > 0 ? <TrendingUp size={12} /> : <Minus size={12} />}
                    {Math.abs(priceComparison.priceDeltaPct)}% {priceComparison.priceDeltaPct <= 0 ? "below" : "above"} median
                  </div>
                </div>
                {priceComparison.ppsqftDelta != null && (
                  <div>
                    <div style={{ fontSize: 10, color: THEME.textMuted }}>$/sqft</div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                      ${listing.pricePerSqft} vs ${priceComparison.medianPpsqft}
                    </div>
                    <div style={{
                      fontSize: 12, fontWeight: 700, marginTop: 4,
                      color: priceComparison.ppsqftDelta < 0 ? THEME.green
                           : priceComparison.ppsqftDelta > 5 ? THEME.orange
                           : THEME.textMuted,
                      display: "inline-flex", alignItems: "center", gap: 4
                    }}>
                      {priceComparison.ppsqftDelta < 0 ? <TrendingDown size={12} /> : priceComparison.ppsqftDelta > 0 ? <TrendingUp size={12} /> : <Minus size={12} />}
                      {Math.abs(priceComparison.ppsqftDelta)}% {priceComparison.ppsqftDelta <= 0 ? "below" : "above"} median
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick cashflow estimate — only shows when we have FMR for the
              listing's county AND a live mortgage rate. */}
          {cashflow && (
            <div style={{
              padding: 14, marginBottom: 20,
              background: cashflow.monthlyCashflow >= 0 ? THEME.greenDim : THEME.bgOrange,
              border: `1px solid ${cashflow.monthlyCashflow >= 0 ? THEME.green : THEME.orange}`,
              borderRadius: 8
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: cashflow.monthlyCashflow >= 0 ? THEME.green : THEME.orange,
                marginBottom: 10,
                display: "flex", alignItems: "center", gap: 6
              }}>
                {cashflow.monthlyCashflow >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                Quick Cashflow Estimate
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: THEME.textMuted }}>Est. Rent</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtUSD(cashflow.monthlyRent)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: THEME.textMuted }}>Mortgage P&amp;I</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtUSD(cashflow.monthlyPI)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: THEME.textMuted }}>Cashflow/mo</div>
                  <div style={{
                    fontSize: 14, fontWeight: 700,
                    color: cashflow.monthlyCashflow >= 0 ? THEME.green : THEME.orange
                  }}>
                    {cashflow.monthlyCashflow >= 0 ? "+" : ""}{fmtUSD(cashflow.monthlyCashflow)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: THEME.textMuted }}>Cap Rate</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{cashflow.capRate != null ? `${cashflow.capRate}%` : "—"}</div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: THEME.textMuted, marginTop: 8, lineHeight: 1.4 }}>
                25% down · {cashflow.assumptions.mortgageRate.toFixed(2)}% (live FRED rate) · HUD FMR {cashflow.assumptions.fmrYear} · 1.2% tax + 0.5% insurance + 20% reserves. Open in the Deal Analyzer to refine.
              </div>
            </div>
          )}

          {/* Property intelligence — FEMA flood + Walk Score. Always render
              the section so users know what was attempted, even when one or
              both signals are missing (e.g. listing without lat/lng, or
              Walk Score key not configured). */}
          <div style={{
            marginBottom: 20
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: THEME.textMuted, marginBottom: 8 }}>
              Property Intelligence {intelLoading && <span style={{ marginLeft: 6, fontWeight: 500, color: THEME.accent }}>· loading…</span>}
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12
            }}>
              {flood ? (
                <div style={{
                  padding: 14,
                  background: flood.riskLevel === "high" ? THEME.bgOrange
                    : flood.riskLevel === "moderate" ? THEME.bgRaised
                    : THEME.bgPanel,
                  border: `1px solid ${flood.riskLevel === "high" ? THEME.orange : THEME.border}`,
                  borderRadius: 8
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Droplets size={14} color={flood.riskLevel === "high" ? THEME.orange : THEME.accent} />
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: THEME.textMuted }}>
                      FEMA Flood Zone
                    </div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4,
                    color: flood.riskLevel === "high" ? THEME.orange : THEME.text }}>
                    {flood.zone || "Not in mapped zone"}
                    {flood.sfha && <span style={{ fontSize: 11, marginLeft: 8, fontWeight: 600 }}>· SFHA</span>}
                  </div>
                  <div style={{ fontSize: 11, color: THEME.textMuted, lineHeight: 1.4 }}>
                    {flood.insuranceGuidance}
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: 14, background: THEME.bgPanel, border: `1px solid ${THEME.border}`,
                  borderRadius: 8
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Droplets size={14} color={THEME.textMuted} />
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: THEME.textMuted }}>
                      FEMA Flood Zone
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: THEME.textDim, lineHeight: 1.4 }}>
                    {intelLoading ? "Loading…" : floodErr || "Not available"}
                  </div>
                </div>
              )}
              {walk && walk.walkScore != null ? (
                <div style={{
                  padding: 14,
                  background: THEME.bgPanel,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 8
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Footprints size={14} color={THEME.accent} />
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: THEME.textMuted }}>
                      Walk / Bike / Transit
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{walk.walkScore}</div>
                      <div style={{ fontSize: 10, color: THEME.textMuted }}>Walk</div>
                    </div>
                    {walk.bikeScore != null && (
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{walk.bikeScore}</div>
                        <div style={{ fontSize: 10, color: THEME.textMuted }}>Bike</div>
                      </div>
                    )}
                    {walk.transitScore != null && (
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{walk.transitScore}</div>
                        <div style={{ fontSize: 10, color: THEME.textMuted }}>Transit</div>
                      </div>
                    )}
                  </div>
                  {walk.walkDescription && (
                    <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 4 }}>
                      {walk.walkDescription}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  padding: 14, background: THEME.bgPanel, border: `1px solid ${THEME.border}`,
                  borderRadius: 8
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Footprints size={14} color={THEME.textMuted} />
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: THEME.textMuted }}>
                      Walk / Bike / Transit
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: THEME.textDim, lineHeight: 1.4 }}>
                    {intelLoading ? "Loading…" : "Not available for this listing"}
                  </div>
                </div>
              )}
            </div>

            {/* Satellite view (Google Maps Static) + nearby (Places Nearby).
                Render below the flood/walk row so the 2-up pairing stays tight. */}
            {gmapsPhotos?.satellite_url && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: THEME.textMuted, marginBottom: 6 }}>
                  Aerial view
                </div>
                <img
                  src={gmapsPhotos.satellite_url}
                  alt="Aerial view of property"
                  loading="lazy"
                  style={{ width: "100%", aspectRatio: "640 / 400", objectFit: "cover", borderRadius: 8, background: THEME.bgPanel, border: `1px solid ${THEME.border}` }}
                />
              </div>
            )}

            {nearby && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: THEME.textMuted, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <MapPin size={11} /> Within 1 mile
                </div>
                {/* Amenity count strip */}
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8,
                  padding: 10, background: THEME.bgPanel, borderRadius: 8,
                  border: `1px solid ${THEME.border}`, marginBottom: nearby.schools?.length ? 10 : 0
                }}>
                  {[
                    ["Schools", nearby.amenityCounts.schools],
                    ["Groceries", nearby.amenityCounts.groceries],
                    ["Parks", nearby.amenityCounts.parks],
                    ["Restaurants", nearby.amenityCounts.restaurants]
                  ].map(([label, n]) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: THEME.text }}>{n}</div>
                      <div style={{ fontSize: 10, color: THEME.textMuted }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Top 3 schools with ratings */}
                {nearby.schools?.length > 0 && (
                  <div style={{
                    padding: 12, background: THEME.bgPanel, borderRadius: 8,
                    border: `1px solid ${THEME.border}`
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: THEME.textMuted, marginBottom: 8, display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <GraduationCap size={12} /> Top-rated schools
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {nearby.schools.map((s, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, fontSize: 12 }}>
                          <div style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <span style={{ fontWeight: 600 }}>{s.name}</span>
                            {s.vicinity && <span style={{ color: THEME.textMuted }}> · {s.vicinity}</span>}
                          </div>
                          {s.rating != null && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", flexShrink: 0 }}>
                              ★ {s.rating}{s.ratingCount > 0 && <span style={{ color: THEME.textDim, fontWeight: 400 }}> ({s.ratingCount})</span>}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STR (Airbnb / VRBO) potential — renders independent of the
                nearby block. Only appears when Rabbu returned a usable
                estimate. Shows annual revenue, avg occupancy, nightly rate
                range (low → high), and a 12-bar monthly occupancy chart
                so seasonality is visible at a glance. */}
            {str?.available && (
              <div style={{ marginTop: 12, padding: 12, background: THEME.bgPanel, borderRadius: 8, border: `1px solid ${THEME.border}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: THEME.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Short-Term Rental Potential (Airbnb / VRBO)
                  </div>
                  <span style={{ fontSize: 9, color: THEME.textDim }}>Estimates by Rabbu</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: str.monthly?.length ? 12 : 0 }}>
                  <div style={{ padding: "8px 10px", background: THEME.bg, border: `1px solid ${THEME.borderLight}`, borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: THEME.textMuted }}>Annual revenue</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: THEME.green, marginTop: 2 }}>
                      {str.revenue ? fmtUSD(str.revenue) : "—"}
                    </div>
                  </div>
                  <div style={{ padding: "8px 10px", background: THEME.bg, border: `1px solid ${THEME.borderLight}`, borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: THEME.textMuted }}>Avg occupancy</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
                      {str.occupancy != null
                        ? `${Math.round(str.occupancy * (str.occupancy <= 1 ? 100 : 1))}%`
                        : "—"}
                    </div>
                  </div>
                  <div style={{ padding: "8px 10px", background: THEME.bg, border: `1px solid ${THEME.borderLight}`, borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: THEME.textMuted }}>Nightly rate</div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>
                      {str.adrLow && str.adrHigh && str.adrLow !== str.adrHigh
                        ? <>${Math.round(str.adrLow)}<span style={{ color: THEME.textDim }}> – </span>${Math.round(str.adrHigh)}</>
                        : str.adr ? <>${Math.round(str.adr)}</>
                        : "—"}
                    </div>
                  </div>
                </div>

                {str.monthly?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: THEME.textMuted, marginBottom: 6 }}>
                      Occupancy by month (Jan → Dec) — hover for nightly rate
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 60, padding: "0 2px" }}>
                      {str.monthly.map((m) => {
                        const occ = (m.occupancy ?? 0) <= 1 ? (m.occupancy ?? 0) : (m.occupancy / 100);
                        const pct = Math.max(0.05, Math.min(1, occ));
                        const adrLabel = m.adr ? ` · $${Math.round(m.adr)}/night` : "";
                        return (
                          <div key={m.month} title={`${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m.month-1]}: ${Math.round(occ * 100)}%${adrLabel}`}
                            style={{ flex: 1, height: `${pct * 100}%`, background: THEME.accent, opacity: 0.4 + pct * 0.6, borderRadius: "2px 2px 0 0", cursor: "default" }} />
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: THEME.textDim }}>
                      <span>Jan</span><span>Apr</span><span>Jul</span><span>Oct</span><span>Dec</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Inspection report — only after the listing is on the watchlist
              so we have a stable contextId. For non-watched listings the
              user can still upload via Analyzer once they "Analyze this
              Deal" (which also creates a Deal record with a stable id). */}
          {watched && (
            <div style={{ marginBottom: 16 }}>
              <InspectionPanel
                context="watchlist"
                contextId={listing.id}
                propertyAddress={listing.formattedAddress}
              />
            </div>
          )}

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
