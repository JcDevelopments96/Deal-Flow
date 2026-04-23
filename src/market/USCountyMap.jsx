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

export const USCountyMap = ({ allMarkets, selectedState, highlightedMarket, onCountyClick }) => {
  const [hoveredCounty, setHoveredCounty] = useState(null);

  // Score range across the dataset — drives the gradient scale
  const { minScore, maxScore } = useMemo(() => {
    const scores = allMarkets
      .map(m => (typeof m.brrrrScore === "number" ? m.brrrrScore : m.score))
      .filter(s => typeof s === "number");
    if (scores.length === 0) return { minScore: 0, maxScore: 100 };
    return {
      minScore: Math.min(...scores),
      maxScore: Math.max(...scores)
    };
  }, [allMarkets]);

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

                  // Every US county is covered by our listings data (Realtor.com is
                  // nationwide), so every county gets a visible colored fill — the
                  // map reads as "you can click anywhere" not "only 7 markets".
                  //
                  // Priority:
                  //   1. Highlighted (active pin)  → accent
                  //   2. Curated "tracked market"  → full heat-scale based on score
                  //   3. Selected state            → teal tint
                  //   4. Every other county        → soft mid-scale heat fill (coverage signal)
                  const t_default = 0.5; // mid-scale neutral for untracked counties
                  let fill = scoreToHeatFill(t_default);
                  let stroke = scoreToHeatStroke(t_default);
                  let strokeWidth = 0.45;
                  // Dim non-tracked counties slightly so the tracked-market ones pop
                  let opacity = 0.55;

                  if (isInSelectedState) {
                    fill = THEME.bgTeal;
                    stroke = THEME.teal;
                    strokeWidth = 0.55;
                    opacity = 0.95;
                  }
                  if (isMarket) {
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
                          isMarket
                        });
                      }}
                      onMouseLeave={() => setHoveredCounty(null)}
                      onClick={() => {
                        if (!onCountyClick) return;
                        if (market) {
                          onCountyClick(market);
                        } else if (stateCode) {
                          onCountyClick({
                            city: countyName,
                            county: countyName,
                            state: stateCode,
                            synthetic: true
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
              {hoveredCounty.isMarket
                ? `${hoveredCounty.market.city} • Score ${getScore(hoveredCounty.market)} • Click to drill in`
                : "Click to load live listings for this area"}
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
          <span className="label-xs">Deal Score Heatmap</span>
          <span style={{ fontSize: 10, color: THEME.textDim }}>
            {allMarkets.length} markets &bull; your range {minScore}-{maxScore}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="mono" style={{ fontSize: 11, color: "#B91C1C", minWidth: 28, fontWeight: 700 }}>
            {HEAT_SCALE_MIN}
          </span>
          <div style={{
            flex: 1,
            display: "flex", gap: 2,
            border: `1px solid ${THEME.border}`,
            borderRadius: 2,
            overflow: "hidden"
          }}>
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map(t => (
              <div key={t} style={{ flex: 1, height: 12, background: scoreToHeatFill(t) }} />
            ))}
          </div>
          <span className="mono" style={{ fontSize: 11, color: "#15803D", minWidth: 28, textAlign: "right", fontWeight: 700 }}>
            {HEAT_SCALE_MAX}
          </span>
        </div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
          fontSize: 10,
          color: THEME.textDim,
          paddingLeft: 38,
          paddingRight: 38
        }}>
          <span>Weak</span>
          <span>Average</span>
          <span>Strong</span>
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
            border: `1px solid ${scoreToHeatStroke(0.5)}`
          }} />
          <span>Tracked Market</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 14, height: 14, borderRadius: 2,
            background: scoreToHeatFill(0.5),
            border: `1px solid ${scoreToHeatStroke(0.5)}`,
            opacity: 0.55
          }} />
          <span>Coverage (click any county)</span>
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
