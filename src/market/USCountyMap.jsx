/* ============================================================================
   US COUNTY MAP — drill-down choropleth.
     • National view: 50 state polygons, colored by aggregate Zillow ZHVI.
     • State view:    counties for the selected state with listing pins.
   Click a state in national view to drill in; "← Back to US" returns home.
   ============================================================================ */
import React, { useState, useMemo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from "react-simple-maps";
import { RotateCcw, ArrowLeft } from "lucide-react";
import { THEME } from "../theme.js";
import {
  STATE_FIPS_BY_CODE, STATE_CODE_BY_FIPS, STATE_NAMES, STATE_MAP_VIEW,
  COUNTIES_TOPOJSON, STATES_TOPOJSON, NATION_TOPOJSON, MAJOR_CITY_LABELS,
  MAP_PALETTE,
  normalizeCountyName, scoreToHeatFill, scoreToHeatStroke, scoreToT,
  HEAT_SCALE_MIN, HEAT_SCALE_MAX
} from "./mapUtils.js";

// Supported metrics for the heat layer. Each entry knows how to pull its
// value out of a live county stats row and how to format it for the tooltip.
export const MAP_METRICS = {
  price: {
    key: "price",
    label: "Median Price",
    extract: s => s?.medianPrice,
    format: v => v ? `$${Math.round(v / 1000)}k` : "—",
    invert: true, // lower = greener (better for investors)
    rangeLabel: v => `$${Math.round(v / 1000)}k`
  },
  yield: {
    key: "yield",
    label: "Gross Rent Yield",
    extract: s => s?.grossYield,
    format: v => v != null ? `${v}%` : "—",
    invert: false, // higher yield = greener
    rangeLabel: v => `${v.toFixed(1)}%`
  },
  rent: {
    key: "rent",
    label: "Median Rent",
    extract: s => s?.medianRent,
    format: v => v ? `$${Math.round(v).toLocaleString()}` : "—",
    invert: false,
    rangeLabel: v => `$${Math.round(v).toLocaleString()}`
  },
  listings: {
    key: "listings",
    label: "Listing Density",
    extract: s => s?.listingCount,
    format: v => v ? `${v} listings` : "—",
    invert: false, // more listings = greener (more opportunity)
    rangeLabel: v => `${Math.round(v)}`
  }
};

export const USCountyMap = ({
  allMarkets,
  selectedState,
  highlightedMarket,
  onCountyClick,
  liveCountyStats,
  staticCountyStats,  // keyed by 5-char FIPS, from market_indexes (Zillow ZHVI)
  metric = "price",
  listings = [],
  onListingClick,
  pinnedListingId,
  onResetView
}) => {
  const [hoveredCounty, setHoveredCounty] = useState(null);
  const metricDef = MAP_METRICS[metric] || MAP_METRICS.price;

  // Live range across the current fetch for the selected metric — drives the
  // heat scale when live data is available. Falls back to curated BRRRR scores.
  const { minScore, maxScore, usingLiveData } = useMemo(() => {
    if (liveCountyStats && Object.keys(liveCountyStats).length > 0) {
      const values = Object.values(liveCountyStats)
        .map(s => metricDef.extract(s))
        .filter(v => typeof v === "number" && v > 0);
      if (values.length > 0) {
        return {
          minScore: Math.min(...values),
          maxScore: Math.max(...values),
          usingLiveData: true
        };
      }
    }
    const scores = allMarkets
      .map(m => (typeof m.brrrrScore === "number" ? m.brrrrScore : m.score))
      .filter(s => typeof s === "number");
    if (scores.length === 0) return { minScore: 0, maxScore: 100, usingLiveData: false };
    return {
      minScore: Math.min(...scores),
      maxScore: Math.max(...scores),
      usingLiveData: false
    };
  }, [liveCountyStats, allMarkets, metricDef]);

  // Build lookup: stateFips -> Map(normalizedCountyName -> market)
  const marketLookup = useMemo(() => {
    const lookup = new Map();
    allMarkets.forEach(m => {
      const sf = STATE_FIPS_BY_CODE[m.state];
      if (!sf) return;
      if (!lookup.has(sf)) lookup.set(sf, new Map());
      lookup.get(sf).set(normalizeCountyName(m.county), m);
    });
    return lookup;
  }, [allMarkets]);

  // Map each live county's metric value to a 0..1 "t" value for the heat
  // scale. Respects metricDef.invert so "lower is better" metrics (price)
  // use the opposite direction from "higher is better" (yield, listings).
  const liveCountyHeat = useMemo(() => {
    const out = new Map();
    if (!usingLiveData || !liveCountyStats) return out;
    const range = maxScore - minScore;
    for (const [countyKey, stats] of Object.entries(liveCountyStats)) {
      const v = metricDef.extract(stats);
      if (typeof v !== "number") continue;
      const raw = range > 0 ? (v - minScore) / range : 0.5;
      const t = metricDef.invert ? 1 - raw : raw;
      out.set(countyKey, { t, stats, value: v });
    }
    return out;
  }, [usingLiveData, liveCountyStats, minScore, maxScore, metricDef]);

  // Static heat — keyed by 5-char FIPS so we can look up by geo.id directly.
  // Sourced from the Zillow ZHVI snapshot in market_indexes. Covers ~3,000
  // counties nationwide so the map doesn't read as "yellow everywhere"
  // when the user hasn't run a live search yet. Only used for price metric
  // since ZHVI is a home-value index.
  const { staticCountyHeat, staticMin, staticMax } = useMemo(() => {
    const out = new Map();
    if (!staticCountyStats || metric !== "price") return { staticCountyHeat: out, staticMin: 0, staticMax: 0 };
    const values = Object.values(staticCountyStats)
      .map(s => Number(s?.zhvi_latest))
      .filter(v => Number.isFinite(v) && v > 0);
    if (values.length === 0) return { staticCountyHeat: out, staticMin: 0, staticMax: 0 };
    const sMin = Math.min(...values);
    const sMax = Math.max(...values);
    const range = sMax - sMin;
    for (const [fips, s] of Object.entries(staticCountyStats)) {
      const v = Number(s?.zhvi_latest);
      if (!Number.isFinite(v) || v <= 0) continue;
      const raw = range > 0 ? (v - sMin) / range : 0.5;
      const t = 1 - raw; // price inverted: lower = greener
      out.set(fips, { t, value: v, zhvi: v, zori: s?.zori_latest || null });
    }
    return { staticCountyHeat: out, staticMin: sMin, staticMax: sMax };
  }, [staticCountyStats, metric]);

  // Per-state aggregate ZHVI for the national overview. We bucket every
  // county by its 2-char state FIPS, then take the median ZHVI in each
  // bucket — median is more robust than mean against outliers like a
  // county containing one ultra-luxury enclave (e.g., Los Alamos NM).
  const { stateHeat, stateMin, stateMax } = useMemo(() => {
    const out = new Map();
    if (!staticCountyStats) return { stateHeat: out, stateMin: 0, stateMax: 0 };

    const buckets = new Map(); // stateFips -> [zhvi values]
    for (const [fips, s] of Object.entries(staticCountyStats)) {
      const v = Number(s?.zhvi_latest);
      if (!Number.isFinite(v) || v <= 0) continue;
      const sf = String(fips).slice(0, 2);
      if (!buckets.has(sf)) buckets.set(sf, []);
      buckets.get(sf).push(v);
    }

    const medians = [];
    for (const [sf, arr] of buckets.entries()) {
      arr.sort((a, b) => a - b);
      const m = arr.length % 2
        ? arr[(arr.length - 1) / 2]
        : (arr[arr.length / 2 - 1] + arr[arr.length / 2]) / 2;
      medians.push([sf, m]);
    }
    if (medians.length === 0) return { stateHeat: out, stateMin: 0, stateMax: 0 };
    const sMin = Math.min(...medians.map(m => m[1]));
    const sMax = Math.max(...medians.map(m => m[1]));
    const range = sMax - sMin;
    for (const [sf, med] of medians) {
      const raw = range > 0 ? (med - sMin) / range : 0.5;
      const t = 1 - raw; // lower price = greener
      out.set(sf, { t, median: med });
    }
    return { stateHeat: out, stateMin: sMin, stateMax: sMax };
  }, [staticCountyStats]);

  // Map mode: when no state is selected we render 50 state polygons
  // for a clean national overview; when one is selected we drop down
  // to the county-level render with listing pins.
  const inStateView = !!selectedState;

  const view = (selectedState && STATE_MAP_VIEW[selectedState])
    ? STATE_MAP_VIEW[selectedState]
    : { center: [-96, 38], zoom: 1 };

  const highlightedFips = highlightedMarket ? STATE_FIPS_BY_CODE[highlightedMarket.state] : null;
  const highlightedCounty = highlightedMarket ? normalizeCountyName(highlightedMarket.county) : null;
  const selectedFips = selectedState ? STATE_FIPS_BY_CODE[selectedState] : null;

  const getScore = (m) => (typeof m.brrrrScore === "number" ? m.brrrrScore : m.score) || 0;

  return (
    <div>
      <div style={{
        // Water-blue canvas — areas not covered by a land polygon (oceans
        // outside the country, the Great Lakes carved out as holes in the
        // nation polygon) render through to this color, giving the map an
        // atlas-like read instead of a stark white background.
        background: MAP_PALETTE.water,
        border: `1px solid ${THEME.border}`,
        borderRadius: 6,
        padding: 12,
        overflow: "hidden",
        position: "relative"
      }}>
        <ComposableMap
          projection="geoAlbersUsa"
          style={{ width: "100%", height: "auto", maxHeight: 480, display: "block",
                   background: MAP_PALETTE.water }}
        >
          <ZoomableGroup
            center={view.center}
            zoom={view.zoom}
            minZoom={1}
            maxZoom={12}
          >
            {/* Land base layer — single-polygon US outline rendered FIRST so
                anywhere without a heat fill still reads as land, not as
                blank canvas. The Great Lakes are carved out of this
                polygon as holes, so they show through to the water color
                automatically. Country borders get a soft stroke for
                definition. */}
            <Geographies geography={NATION_TOPOJSON}>
              {({ geographies }) =>
                geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={MAP_PALETTE.land}
                    stroke={MAP_PALETTE.landStroke}
                    strokeWidth={0.6}
                    style={{
                      default: { outline: "none" },
                      hover:   { outline: "none", fill: MAP_PALETTE.land },
                      pressed: { outline: "none" }
                    }}
                  />
                ))
              }
            </Geographies>

            {/* National view: 50 state polygons. Cleaner first impression
                than 3,000+ counties, and clicking a state drills in to
                the county-level render below. Only renders when no
                state is selected. */}
            {!inStateView && (
              <Geographies geography={STATES_TOPOJSON}>
                {({ geographies }) => {
                  if (!geographies || geographies.length === 0) return null;
                  return geographies.map(geo => {
                    const sf = String(geo.id || "").padStart(2, "0");
                    const stateCode = STATE_CODE_BY_FIPS[sf];
                    const heat = stateHeat.get(sf);
                    // Transparent fill when no heat data so the underlying
                    // land base shows through (instead of painting over it
                    // with a flat grey rectangle that hides the atlas feel).
                    const fill   = heat ? scoreToHeatFill(heat.t)   : "transparent";
                    const stroke = heat ? scoreToHeatStroke(heat.t) : MAP_PALETTE.landStroke;
                    const opacity = heat ? 0.78 : 1;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={0.6}
                        style={{
                          default: { outline: "none", transition: "fill 0.2s, opacity 0.2s", opacity },
                          hover:   { fill: THEME.accent, stroke: THEME.accent, opacity: 1, outline: "none", cursor: stateCode ? "pointer" : "default" },
                          pressed: { outline: "none" }
                        }}
                        onMouseEnter={() => {
                          if (!stateCode) return;
                          setHoveredCounty({
                            name: STATE_NAMES[stateCode] || stateCode,
                            state: stateCode,
                            isStateLevel: true,
                            staticStats: heat ? { zhvi: heat.median } : null
                          });
                        }}
                        onMouseLeave={() => setHoveredCounty(null)}
                        onClick={() => {
                          if (!onCountyClick || !stateCode) return;
                          // Hand the click up as a "pick this state" signal.
                          // Caller (AdvancedMarketIntel) sets selectedState,
                          // which flips us into county view automatically.
                          onCountyClick({
                            state: stateCode,
                            city: null,
                            county: null,
                            synthetic: true,
                            stateFips: sf,
                            countyFips: null,
                            __pickState: true
                          });
                        }}
                      />
                    );
                  });
                }}
              </Geographies>
            )}

            {/* State view: county-level render, listing pins, the works. */}
            {inStateView && (
            <Geographies geography={COUNTIES_TOPOJSON}>
              {({ geographies }) => {
                if (!geographies || geographies.length === 0) return null;
                return geographies.map(geo => {
                  const fips = String(geo.id || "");
                  const stateFips = fips.slice(0, 2);
                  const countyName = geo.properties.name;
                  const countyNorm = normalizeCountyName(countyName);
                  const stateCode = STATE_CODE_BY_FIPS[stateFips];

                  // Fast path: when a state IS selected, hide every county
                  // that isn't in it. Avoids rendering ~3,000 unnecessary
                  // SVG paths per frame and lets the selected state breathe.
                  if (stateFips !== selectedFips) return null;

                  const stateMarkets = marketLookup.get(stateFips);
                  const market = stateMarkets ? stateMarkets.get(countyNorm) : null;
                  const isMarket = !!market;
                  const isHighlighted = highlightedFips === stateFips && highlightedCounty === countyNorm;
                  const isInSelectedState = selectedFips === stateFips;
                  const liveHeat = liveCountyHeat.get(countyNorm);
                  const staticHeat = staticCountyHeat.get(fips);

                  // Fill priority (first match wins):
                  //   1. Highlighted active pin → accent
                  //   2. Live county data from recent search → metric heat
                  //   3. Static ZHVI snapshot (Zillow home values) → price heat
                  //   4. Selected state tint → teal
                  //   5. Otherwise → neutral gray (no data — quiet, not yellow)
                  // NOTE: we intentionally do NOT color un-searched counties
                  // by the curated BRRRR "deal score". That metric only
                  // covered ~60 cherry-picked markets and produced an
                  // inconsistent, misleading map where a handful of
                  // counties had strong color and everything else was gray.
                  // Nationwide ZHVI coverage replaces it.
                  // Transparent default — the land base layer shows through
                  // for counties without heat/live data, keeping the atlas
                  // feel even in dense state views.
                  let fill = "transparent";
                  let stroke = MAP_PALETTE.landStroke;
                  let strokeWidth = 0.35;
                  let opacity = 1;

                  if (isInSelectedState && !liveHeat && !staticHeat) {
                    fill = THEME.bgTeal;
                    stroke = THEME.teal;
                    strokeWidth = 0.55;
                    opacity = 0.95;
                  }
                  if (staticHeat && !liveHeat) {
                    fill = scoreToHeatFill(staticHeat.t);
                    stroke = scoreToHeatStroke(staticHeat.t);
                    strokeWidth = 0.5;
                    opacity = 0.82;                   // slightly muted vs. live
                  }
                  if (liveHeat) {
                    fill = scoreToHeatFill(liveHeat.t);
                    stroke = scoreToHeatStroke(liveHeat.t);
                    strokeWidth = 0.6;
                    opacity = 1;
                  }
                  if (isHighlighted) {
                    fill = THEME.accent;
                    stroke = THEME.accentDim;
                    strokeWidth = 1.4;
                    opacity = 1;
                  }

                  const hoverFill = isMarket
                    ? THEME.accent
                    : isInSelectedState
                    ? THEME.teal
                    : THEME.navy;
                  const hoverTextColor = "#FFFFFF";

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      style={{
                        default: { outline: "none", transition: "fill 0.2s, opacity 0.2s", opacity },
                        hover: {
                          fill: hoverFill,
                          stroke: hoverFill,
                          opacity: 1,
                          outline: "none",
                          cursor: "pointer"
                        },
                        pressed: { outline: "none" }
                      }}
                      onMouseEnter={() => {
                        if (!stateCode) return;
                        setHoveredCounty({
                          name: countyName,
                          state: stateCode,
                          market: market || null,
                          isMarket,
                          liveStats: liveHeat ? liveHeat.stats : null,
                          staticStats: staticHeat || null
                        });
                      }}
                      onMouseLeave={() => setHoveredCounty(null)}
                      onClick={() => {
                        if (!onCountyClick) return;
                        // Pass FIPS codes alongside so the caller can hit the
                        // Census API without another lookup round-trip.
                        const fipsData = {
                          stateFips: stateFips,
                          countyFips: fips.slice(2) // geo.id = state(2) + county(3)
                        };
                        if (market) {
                          onCountyClick({ ...market, ...fipsData });
                        } else if (stateCode) {
                          onCountyClick({
                            city: countyName,
                            county: countyName,
                            state: stateCode,
                            synthetic: true,
                            ...fipsData
                          });
                        }
                      }}
                    />
                  );
                });
              }}
            </Geographies>
            )}

            {/* City labels — Zillow-style metro names floating above the
                choropleth. Tier 1 (top-25 metros) renders nationwide;
                tier 2 only renders in the selected state to keep the
                national view readable. Each label is a tiny dot + text
                pair so the user can see which point on the map the name
                refers to. */}
            {MAJOR_CITY_LABELS.filter(c => {
              if (inStateView) return c.state === selectedState;
              return c.tier === 1;
            }).map(c => (
              <Marker key={`${c.name}-${c.state}`} coordinates={[c.lng, c.lat]}>
                <circle r={1.6} fill="#FFFFFF" stroke={THEME.navy} strokeWidth={0.5} style={{ pointerEvents: "none" }} />
                <text
                  x={4} y={2.2}
                  style={{
                    fontFamily: "DM Sans, system-ui, sans-serif",
                    fontSize: inStateView ? 5 : 6,
                    fontWeight: 700,
                    fill: THEME.navy,
                    paintOrder: "stroke",
                    stroke: "rgba(255,255,255,0.95)",
                    strokeWidth: 1.2,
                    strokeLinejoin: "round",
                    pointerEvents: "none",
                    userSelect: "none"
                  }}
                >
                  {c.name}
                </text>
              </Marker>
            ))}

            {/* Listing pins — only in state view. National view would be
                visually noisy with thousands of pins coast to coast.
                geoAlbersUsa returns null for points outside its valid
                range (most of the world, plus the sentinel 0,0), and
                react-simple-maps' <Marker> crashes when the projection
                returns null — hence the strict bounds check. */}
            {inStateView && Array.isArray(listings) && listings.map(l => {
              const lat = Number(l?.latitude);
              const lng = Number(l?.longitude);
              // Rough continental US + AK/HI bounds. Anything outside this
              // won't project, so skip it rather than crash the whole map.
              const validUS =
                Number.isFinite(lat) && Number.isFinite(lng) &&
                lat >= 18 && lat <= 72 &&
                lng >= -180 && lng <= -65 &&
                // Exclude the origin sentinel — we see a fair number of
                // listings coming back with (0, 0) when geocode is missing.
                !(lat === 0 && lng === 0);
              if (!validUS) return null;
              const isPinned = pinnedListingId && pinnedListingId === l.id;
              const clickable = !!onListingClick;
              return (
                <Marker key={l.id} coordinates={[lng, lat]}>
                  <circle
                    r={isPinned ? 3.6 : 2.2}
                    fill={isPinned ? THEME.orange : THEME.accent}
                    stroke="#FFFFFF"
                    strokeWidth={isPinned ? 1 : 0.6}
                    onClick={clickable ? (e) => { e.stopPropagation(); onListingClick(l); } : undefined}
                    style={{
                      cursor: clickable ? "pointer" : "default",
                      pointerEvents: clickable ? "auto" : "none"
                    }}
                  >
                    {clickable && <title>{l.address || "listing"} — click to filter</title>}
                  </circle>
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* "← Back to US" — primary way out of state view. Shown top-LEFT
            so it doesn't compete with the existing top-right reset
            button (which also clears live highlights, not just zoom). */}
        {onResetView && inStateView && (
          <button
            type="button"
            onClick={onResetView}
            aria-label="Back to US overview"
            title="Back to US overview"
            style={{
              position: "absolute", top: 16, left: 16,
              padding: "6px 10px",
              background: "rgba(255,255,255,0.95)",
              color: THEME.accent,
              border: `1px solid ${THEME.border}`,
              borderRadius: 6,
              fontSize: 11, fontWeight: 700,
              display: "inline-flex", alignItems: "center", gap: 5,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(15,23,42,0.08)"
            }}
          >
            <ArrowLeft size={12} />
            Back to US
          </button>
        )}

        {/* Reset view — top-right, kept for clearing highlighted markers */}
        {onResetView && (selectedState || highlightedMarket) && (
          <button
            type="button"
            onClick={onResetView}
            aria-label="Reset map view"
            title="Reset view"
            style={{
              position: "absolute", top: 16, right: 16,
              padding: "6px 10px",
              background: "rgba(255,255,255,0.95)",
              color: THEME.accent,
              border: `1px solid ${THEME.border}`,
              borderRadius: 6,
              fontSize: 11, fontWeight: 600,
              display: "inline-flex", alignItems: "center", gap: 6,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(15,23,42,0.08)"
            }}
          >
            <RotateCcw size={12} />
            Reset view
          </button>
        )}

        {/* Listings pin legend */}
        {listings && listings.length > 0 && (
          <div style={{
            position: "absolute", bottom: 16, left: 16,
            padding: "6px 10px",
            background: "rgba(255,255,255,0.95)",
            border: `1px solid ${THEME.border}`,
            borderRadius: 6,
            fontSize: 10, fontWeight: 600,
            color: THEME.textMuted,
            display: "inline-flex", alignItems: "center", gap: 6
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: THEME.accent, border: "1.5px solid #fff",
              display: "inline-block"
            }} />
            {listings.length} listing pin{listings.length === 1 ? "" : "s"}
          </div>
        )}

        {hoveredCounty && (
          <div style={{
            position: "absolute", top: 16, left: 16,
            background: "rgba(15, 23, 42, 0.92)", color: "#fff",
            padding: "8px 12px", borderRadius: 6,
            fontSize: 12, pointerEvents: "none",
            boxShadow: "0 6px 16px rgba(15,23,42,0.2)",
            maxWidth: 260
          }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>
              {hoveredCounty.name} County, {hoveredCounty.state}
            </div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>
              {hoveredCounty.liveStats ? (
                <>
                  {metricDef.label}: {metricDef.format(metricDef.extract(hoveredCounty.liveStats))}
                  {hoveredCounty.liveStats.listingCount ? ` · ${hoveredCounty.liveStats.listingCount} listings` : ""}
                </>
              ) : hoveredCounty.staticStats?.zhvi ? (
                <>
                  Median value (ZHVI): ${Math.round(hoveredCounty.staticStats.zhvi / 1000)}k
                  {hoveredCounty.staticStats.zori ? ` · Rent: $${Math.round(hoveredCounty.staticStats.zori)}` : ""}
                  <div style={{ marginTop: 2, fontSize: 10, opacity: 0.7 }}>Click to load live listings</div>
                </>
              ) : hoveredCounty.isMarket ? (
                `${hoveredCounty.market.city} • Click to drill in`
              ) : (
                "No data yet — click to load live listings"
              )}
            </div>
          </div>
        )}
      </div>

      {/* Gradient legend */}
      <div style={{
        marginTop: 14,
        padding: "10px 14px",
        background: THEME.bgPanel,
        border: `1px solid ${THEME.border}`,
        borderRadius: 6
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6
        }}>
          <span className="label-xs">
            {usingLiveData
              ? `County ${metricDef.label} (Live)`
              : staticCountyHeat.size > 0
                ? "Median Home Value (Zillow ZHVI)"
                : "Median Home Value"}
          </span>
          <span style={{ fontSize: 10, color: THEME.textDim }}>
            {usingLiveData
              ? `${Object.keys(liveCountyStats || {}).length} counties · range ${metricDef.rangeLabel(minScore)} – ${metricDef.rangeLabel(maxScore)}`
              : staticCountyHeat.size > 0
                ? `${staticCountyHeat.size} counties · $${Math.round(staticMin/1000)}k – $${Math.round(staticMax/1000)}k`
                : "Loading nationwide data…"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="mono" style={{ fontSize: 11, color: "#15803D", minWidth: 56, fontWeight: 700 }}>
            {usingLiveData
              ? (metricDef.invert ? metricDef.rangeLabel(minScore) : metricDef.rangeLabel(maxScore))
              : staticCountyHeat.size > 0
                ? `$${Math.round(staticMin/1000)}k`
                : HEAT_SCALE_MIN}
          </span>
          <div style={{
            flex: 1,
            display: "flex", gap: 2,
            border: `1px solid ${THEME.border}`,
            borderRadius: 2,
            overflow: "hidden"
          }}>
            {[1, 0.8, 0.6, 0.4, 0.2, 0].map(t => (
              <div key={t} style={{ flex: 1, height: 12, background: scoreToHeatFill(t) }} />
            ))}
          </div>
          <span className="mono" style={{ fontSize: 11, color: "#B91C1C", minWidth: 56, textAlign: "right", fontWeight: 700 }}>
            {usingLiveData
              ? (metricDef.invert ? metricDef.rangeLabel(maxScore) : metricDef.rangeLabel(minScore))
              : staticCountyHeat.size > 0
                ? `$${Math.round(staticMax/1000)}k`
                : HEAT_SCALE_MAX}
          </span>
        </div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
          fontSize: 10,
          color: THEME.textDim,
          paddingLeft: 58,
          paddingRight: 58
        }}>
          <span>{metricDef.invert ? "More affordable" : "Stronger"}</span>
          <span>Mid-market</span>
          <span>{metricDef.invert ? "Pricier" : "Weaker"}</span>
        </div>
      </div>

      {/* Legend + info readout */}
      <div style={{
        display: "flex",
        gap: 18,
        marginTop: 10,
        fontSize: 11,
        color: THEME.textMuted,
        flexWrap: "wrap",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 14, height: 14, borderRadius: 2,
            background: scoreToHeatFill(0.5),
            border: `1px solid ${scoreToHeatStroke(0.5)}`,
            opacity: 0.35
          }} />
          <span>No data yet (click to load)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 14, height: 14, borderRadius: 2,
            background: THEME.bgTeal,
            border: `1px solid ${THEME.teal}`
          }} />
          <span>Selected State</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 14, height: 14, borderRadius: 2,
            background: THEME.accent
          }} />
          <span>Active Pin</span>
        </div>
        {highlightedMarket && (
          <div style={{ color: THEME.accent, fontWeight: 600 }}>
            {highlightedMarket.city}, {highlightedMarket.state} &mdash; {highlightedMarket.county}
            &nbsp;&bull;&nbsp;
            Score {getScore(highlightedMarket)}
          </div>
        )}
        <div style={{ color: THEME.textDim, marginLeft: "auto", fontSize: 10 }}>
          Click any county &bull; Scroll to zoom &bull; Drag to pan
        </div>
      </div>
    </div>
  );
};
