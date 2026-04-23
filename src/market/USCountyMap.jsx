/* ============================================================================
   US COUNTY MAP — interactive, county-level choropleth.
   ============================================================================ */
import React, { useState, useMemo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { THEME } from "../theme.js";
import {
  STATE_FIPS_BY_CODE, STATE_CODE_BY_FIPS, STATE_MAP_VIEW, COUNTIES_TOPOJSON,
  normalizeCountyName, scoreToHeatFill, scoreToHeatStroke, scoreToT,
  HEAT_SCALE_MIN, HEAT_SCALE_MAX
} from "./mapUtils.js";

export const USCountyMap = ({ allMarkets, selectedState, highlightedMarket, onCountyClick, liveCountyStats }) => {
  const [hoveredCounty, setHoveredCounty] = useState(null);

  // Live median-price range across the current fetch — drives the heat scale
  // when live data is available. Falls back to the curated score range.
  const { minScore, maxScore, usingLiveData } = useMemo(() => {
    if (liveCountyStats && Object.keys(liveCountyStats).length > 0) {
      const prices = Object.values(liveCountyStats)
        .map(s => s.medianPrice)
        .filter(p => typeof p === "number" && p > 0);
      if (prices.length > 0) {
        return {
          minScore: Math.round(Math.min(...prices)),
          maxScore: Math.round(Math.max(...prices)),
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
  }, [liveCountyStats, allMarkets]);

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

  // Map each live county's median price to a 0..1 "t" value for the heat
  // scale. Inverted: LOWER median price = GREENER (better for investors,
  // higher implied yield); HIGHER median price = REDDER.
  const liveCountyHeat = useMemo(() => {
    const out = new Map();
    if (!usingLiveData || !liveCountyStats) return out;
    const range = maxScore - minScore;
    for (const [countyKey, stats] of Object.entries(liveCountyStats)) {
      if (typeof stats.medianPrice !== "number") continue;
      const t = range > 0 ? 1 - ((stats.medianPrice - minScore) / range) : 0.5;
      out.set(countyKey, { t, stats });
    }
    return out;
  }, [usingLiveData, liveCountyStats, minScore, maxScore]);

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
        background: THEME.bgInput,
        border: `1px solid ${THEME.border}`,
        borderRadius: 6,
        padding: 12,
        overflow: "hidden",
        position: "relative"
      }}>
        <ComposableMap
          projection="geoAlbersUsa"
          style={{ width: "100%", height: "auto", maxHeight: 480, display: "block" }}
        >
          <ZoomableGroup
            center={view.center}
            zoom={view.zoom}
            minZoom={1}
            maxZoom={12}
          >
            <Geographies geography={COUNTIES_TOPOJSON}>
              {({ geographies }) => {
                if (!geographies || geographies.length === 0) return null;
                return geographies.map(geo => {
                  const fips = String(geo.id || "");
                  const stateFips = fips.slice(0, 2);
                  const countyName = geo.properties.name;
                  const countyNorm = normalizeCountyName(countyName);
                  const stateCode = STATE_CODE_BY_FIPS[stateFips];

                  const stateMarkets = marketLookup.get(stateFips);
                  const market = stateMarkets ? stateMarkets.get(countyNorm) : null;
                  const isMarket = !!market;
                  const isHighlighted = highlightedFips === stateFips && highlightedCounty === countyNorm;
                  const isInSelectedState = selectedFips === stateFips;
                  const liveHeat = liveCountyHeat.get(countyNorm);

                  // Fill priority:
                  //   1. Highlighted (active pin) → accent
                  //   2. Live county data (real listings in this county) → price-based heat
                  //   3. Selected state → teal tint
                  //   4. Curated market (legacy, only when no live data) → score-based heat
                  //   5. Otherwise → soft mid-scale coverage fill
                  const t_default = 0.5;
                  let fill = scoreToHeatFill(t_default);
                  let stroke = scoreToHeatStroke(t_default);
                  let strokeWidth = 0.45;
                  let opacity = 0.35;

                  if (isInSelectedState && !liveHeat) {
                    fill = THEME.bgTeal;
                    stroke = THEME.teal;
                    strokeWidth = 0.55;
                    opacity = 0.95;
                  }
                  if (liveHeat) {
                    fill = scoreToHeatFill(liveHeat.t);
                    stroke = scoreToHeatStroke(liveHeat.t);
                    strokeWidth = 0.6;
                    opacity = 1;
                  } else if (isMarket && !usingLiveData) {
                    // Only fall back to curated scores when we have no live data at all
                    const score = getScore(market);
                    const t = scoreToT(score);
                    fill = scoreToHeatFill(t);
                    stroke = scoreToHeatStroke(t);
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
                          liveStats: liveHeat ? liveHeat.stats : null
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
          </ZoomableGroup>
        </ComposableMap>

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
                  Median ${(hoveredCounty.liveStats.medianPrice / 1000).toFixed(0)}k
                  {hoveredCounty.liveStats.grossYield ? ` · ${hoveredCounty.liveStats.grossYield}% yield` : ""}
                  {` · ${hoveredCounty.liveStats.listingCount} listings`}
                </>
              ) : hoveredCounty.isMarket ? (
                `${hoveredCounty.market.city} • Click to drill in`
              ) : (
                "Click to load live listings for this area"
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
            {usingLiveData ? "County Median Price (Live)" : "Deal Score Heatmap"}
          </span>
          <span style={{ fontSize: 10, color: THEME.textDim }}>
            {usingLiveData
              ? `${Object.keys(liveCountyStats || {}).length} counties · range $${Math.round(minScore/1000)}k – $${Math.round(maxScore/1000)}k`
              : `${allMarkets.length} markets · your range ${minScore}-${maxScore}`}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="mono" style={{ fontSize: 11, color: "#15803D", minWidth: 44, fontWeight: 700 }}>
            {usingLiveData ? `$${Math.round(minScore/1000)}k` : HEAT_SCALE_MIN}
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
          <span className="mono" style={{ fontSize: 11, color: "#B91C1C", minWidth: 44, textAlign: "right", fontWeight: 700 }}>
            {usingLiveData ? `$${Math.round(maxScore/1000)}k` : HEAT_SCALE_MAX}
          </span>
        </div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
          fontSize: 10,
          color: THEME.textDim,
          paddingLeft: 46,
          paddingRight: 46
        }}>
          <span>{usingLiveData ? "More affordable" : "Strong"}</span>
          <span>{usingLiveData ? "Mid-market" : "Average"}</span>
          <span>{usingLiveData ? "Pricier" : "Weak"}</span>
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
