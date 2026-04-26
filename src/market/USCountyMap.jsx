/* ============================================================================
   US COUNTY MAP — tile-based interactive map (Leaflet + CARTO Positron tiles).
     • Real water bodies, rivers, roads, place names from OpenStreetMap data.
     • National view: 50 state polygons overlay, colored by aggregate ZHVI.
     • State view:    counties for the selected state with listing pins.
   Click a state in national view to drill in; "← Back to US" returns home.

   Drop-in replacement for the prior react-simple-maps implementation —
   identical component API so AdvancedMarketIntel doesn't change.
   ============================================================================ */
import React, { useEffect, useMemo, useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import * as topojson from "topojson-client";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { THEME } from "../theme.js";
import {
  STATE_FIPS_BY_CODE, STATE_CODE_BY_FIPS, STATE_NAMES, STATE_MAP_VIEW,
  COUNTIES_TOPOJSON, STATES_TOPOJSON, MAJOR_CITY_LABELS,
  scoreToHeatFill, scoreToHeatStroke
} from "./mapUtils.js";

// Supported metrics — kept for AdvancedMarketIntel imports + the legend bar.
// The map itself is colored by Zillow ZHVI from staticCountyStats; the
// other metrics (yield/rent/listings) are vestigial from the older picker.
export const MAP_METRICS = {
  price: {
    key: "price", label: "Median Price",
    extract: s => s?.medianPrice, format: v => v ? `$${Math.round(v / 1000)}k` : "—",
    invert: true, rangeLabel: v => `$${Math.round(v / 1000)}k`
  },
  yield: {
    key: "yield", label: "Gross Rent Yield",
    extract: s => s?.grossYield, format: v => v != null ? `${v}%` : "—",
    invert: false, rangeLabel: v => `${v.toFixed(1)}%`
  },
  rent: {
    key: "rent", label: "Median Rent",
    extract: s => s?.medianRent, format: v => v ? `$${Math.round(v).toLocaleString()}` : "—",
    invert: false, rangeLabel: v => `$${Math.round(v).toLocaleString()}`
  },
  listings: {
    key: "listings", label: "Listing Density",
    extract: s => s?.listingCount, format: v => v ? `${v} listings` : "—",
    invert: false, rangeLabel: v => `${Math.round(v)}`
  }
};

// One-time TopoJSON → GeoJSON conversion. Fetched on demand and cached
// in module scope so subsequent map mounts share the parsed result.
const _geoCache = { states: null, counties: null, statesPromise: null, countiesPromise: null };

async function loadStatesGeo() {
  if (_geoCache.states) return _geoCache.states;
  if (_geoCache.statesPromise) return _geoCache.statesPromise;
  _geoCache.statesPromise = (async () => {
    const res = await fetch(STATES_TOPOJSON);
    const topo = await res.json();
    // us-atlas exports the states under the "states" object key.
    const geo = topojson.feature(topo, topo.objects.states);
    _geoCache.states = geo;
    return geo;
  })();
  return _geoCache.statesPromise;
}

async function loadCountiesGeo() {
  if (_geoCache.counties) return _geoCache.counties;
  if (_geoCache.countiesPromise) return _geoCache.countiesPromise;
  _geoCache.countiesPromise = (async () => {
    const res = await fetch(COUNTIES_TOPOJSON);
    const topo = await res.json();
    const geo = topojson.feature(topo, topo.objects.counties);
    _geoCache.counties = geo;
    return geo;
  })();
  return _geoCache.countiesPromise;
}

// Imperative center/zoom controller — Leaflet doesn't update these from
// React props after first render, so we drive it via a child that calls
// map.flyTo() on selectedState change.
function MapViewController({ selectedState }) {
  const map = useMap();
  useEffect(() => {
    if (selectedState && STATE_MAP_VIEW[selectedState]) {
      const v = STATE_MAP_VIEW[selectedState];
      // STATE_MAP_VIEW center is [lng, lat] (Albers convention); Leaflet
      // wants [lat, lng]. Flip + use a Leaflet-friendly zoom level.
      map.flyTo([v.center[1], v.center[0]], 6, { duration: 0.6 });
    } else {
      // Back to national view
      map.flyTo([39.5, -98.5], 4, { duration: 0.6 });
    }
  }, [selectedState, map]);
  return null;
}

// Build the divIcon for a city label — simple HTML chip with white halo.
function cityLabelIcon(name, isMajor) {
  const fontSize = isMajor ? 11 : 10;
  return L.divIcon({
    className: "dt-city-label",
    html: `<div style="
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: ${fontSize}px;
      font-weight: 700;
      color: #0F172A;
      text-shadow: 0 0 3px #fff, 0 0 3px #fff, 0 0 3px #fff, 0 0 3px #fff;
      white-space: nowrap;
      pointer-events: none;
      transform: translate(8px, -8px);
    ">${name}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
}

export const USCountyMap = ({
  selectedState,
  highlightedMarket,
  onCountyClick,
  liveCountyStats,
  staticCountyStats,  // keyed by 5-char FIPS, from market_indexes (Zillow ZHVI)
  listings = [],
  onListingClick,
  pinnedListingId,
  onResetView,
  // Props kept for API compatibility but unused by the tile map:
  // allMarkets, metric — the picker is gone and the heat is always ZHVI.
}) => {
  const [statesGeo, setStatesGeo] = useState(_geoCache.states);
  const [countiesGeo, setCountiesGeo] = useState(_geoCache.counties);
  const inStateView = !!selectedState;

  // Fetch GeoJSON on mount; cached after first load.
  useEffect(() => {
    if (!statesGeo) loadStatesGeo().then(setStatesGeo).catch(() => {});
  }, [statesGeo]);
  useEffect(() => {
    // Only need counties once a state is picked (state view).
    if (inStateView && !countiesGeo) loadCountiesGeo().then(setCountiesGeo).catch(() => {});
  }, [inStateView, countiesGeo]);

  // Per-state aggregate ZHVI (median across counties) — drives the
  // national-view choropleth.
  const stateHeat = useMemo(() => {
    const out = new Map();
    if (!staticCountyStats) return out;
    const buckets = new Map();
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
    if (medians.length === 0) return out;
    const sMin = Math.min(...medians.map(m => m[1]));
    const sMax = Math.max(...medians.map(m => m[1]));
    const range = sMax - sMin;
    for (const [sf, med] of medians) {
      const raw = range > 0 ? (med - sMin) / range : 0.5;
      out.set(sf, { t: 1 - raw, median: med }); // lower price = greener
    }
    return out;
  }, [staticCountyStats]);

  // Per-county ZHVI heat for the selected state.
  const countyHeat = useMemo(() => {
    const out = new Map();
    if (!staticCountyStats || !selectedState) return out;
    const sf = STATE_FIPS_BY_CODE[selectedState];
    if (!sf) return out;
    const values = [];
    for (const [fips, s] of Object.entries(staticCountyStats)) {
      if (!String(fips).startsWith(sf)) continue;
      const v = Number(s?.zhvi_latest);
      if (Number.isFinite(v) && v > 0) values.push([fips, v]);
    }
    if (values.length === 0) return out;
    const sMin = Math.min(...values.map(v => v[1]));
    const sMax = Math.max(...values.map(v => v[1]));
    const range = sMax - sMin;
    for (const [fips, v] of values) {
      const raw = range > 0 ? (v - sMin) / range : 0.5;
      out.set(fips, { t: 1 - raw, value: v });
    }
    return out;
  }, [staticCountyStats, selectedState]);

  // Restrict counties to the selected state for performance + clarity.
  const stateCountiesGeo = useMemo(() => {
    if (!countiesGeo || !selectedState) return null;
    const sf = STATE_FIPS_BY_CODE[selectedState];
    if (!sf) return null;
    return {
      ...countiesGeo,
      features: countiesGeo.features.filter(f => String(f.id).startsWith(sf))
    };
  }, [countiesGeo, selectedState]);

  /* ── GeoJSON layer styling ─────────────────────────────────────────── */
  const stateStyle = (feature) => {
    const sf = String(feature.id).padStart(2, "0");
    const heat = stateHeat.get(sf);
    if (!heat) {
      // Subtle outline only — let the OSM tiles show through
      return { fillColor: "transparent", fillOpacity: 0, color: "#475569", weight: 1.2 };
    }
    return {
      fillColor: scoreToHeatFill(heat.t),
      fillOpacity: 0.55,
      color: scoreToHeatStroke(heat.t),
      weight: 1
    };
  };

  const countyStyle = (feature) => {
    const fips = String(feature.id);
    const heat = countyHeat.get(fips);
    if (!heat) {
      return { fillColor: "transparent", fillOpacity: 0, color: "#94a3b8", weight: 0.6 };
    }
    return {
      fillColor: scoreToHeatFill(heat.t),
      fillOpacity: 0.55,
      color: scoreToHeatStroke(heat.t),
      weight: 0.8
    };
  };

  /* ── GeoJSON click + hover handlers ────────────────────────────────── */
  const onEachState = (feature, layer) => {
    const sf = String(feature.id).padStart(2, "0");
    const stateCode = STATE_CODE_BY_FIPS[sf];
    if (!stateCode) return;
    const heat = stateHeat.get(sf);
    const label = STATE_NAMES[stateCode] || stateCode;
    const tooltipBits = [`<strong>${label}</strong>`];
    if (heat) tooltipBits.push(`Median ZHVI: $${Math.round(heat.median / 1000)}k`);
    layer.bindTooltip(tooltipBits.join("<br/>"), { sticky: true, direction: "top" });
    layer.on({
      click: () => {
        if (!onCountyClick) return;
        onCountyClick({
          state: stateCode, city: null, county: null,
          synthetic: true, stateFips: sf, countyFips: null,
          __pickState: true
        });
      },
      mouseover: (e) => e.target.setStyle({ weight: 2.5, color: THEME.accent, fillOpacity: heat ? 0.75 : 0.15, fillColor: heat ? scoreToHeatFill(heat.t) : THEME.accent }),
      mouseout:  (e) => e.target.setStyle(stateStyle(feature))
    });
  };

  const onEachCounty = (feature, layer) => {
    const fips = String(feature.id);
    const sf = fips.slice(0, 2);
    const countyName = feature.properties?.name || "County";
    const stateCode = STATE_CODE_BY_FIPS[sf];
    const heat = countyHeat.get(fips);
    const tooltipBits = [`<strong>${countyName}, ${stateCode || ""}</strong>`];
    if (heat) tooltipBits.push(`ZHVI: $${Math.round(heat.value / 1000)}k`);
    layer.bindTooltip(tooltipBits.join("<br/>"), { sticky: true, direction: "top" });
    layer.on({
      click: () => {
        if (!onCountyClick || !stateCode) return;
        onCountyClick({
          state: stateCode, city: countyName, county: countyName,
          synthetic: true, stateFips: sf, countyFips: fips.slice(2)
        });
      },
      mouseover: (e) => e.target.setStyle({ weight: 2, color: THEME.accent, fillOpacity: heat ? 0.75 : 0.18, fillColor: heat ? scoreToHeatFill(heat.t) : THEME.accent }),
      mouseout:  (e) => e.target.setStyle(countyStyle(feature))
    });
  };

  /* ── Listing pins — only in state view ─────────────────────────────── */
  const validListings = useMemo(() => {
    if (!inStateView || !Array.isArray(listings)) return [];
    return listings.filter(l => {
      const lat = Number(l?.latitude);
      const lng = Number(l?.longitude);
      return Number.isFinite(lat) && Number.isFinite(lng)
        && lat >= 18 && lat <= 72 && lng >= -180 && lng <= -65
        && !(lat === 0 && lng === 0);
    });
  }, [inStateView, listings]);

  /* ── City labels — Zillow-style metro names ────────────────────────── */
  const cityLabels = useMemo(() => MAJOR_CITY_LABELS.filter(c => {
    if (inStateView) return c.state === selectedState;
    return c.tier === 1;
  }), [inStateView, selectedState]);

  return (
    <div style={{ position: "relative", height: 480, borderRadius: 6, overflow: "hidden", border: `1px solid ${THEME.border}` }}>
      <MapContainer
        center={[39.5, -98.5]}      // continental US center
        zoom={4}
        minZoom={3}
        maxZoom={15}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", background: "#cfe5f2" }}
        worldCopyJump={false}
      >
        {/* CARTO Positron — clean, low-contrast light tiles. Free + no key. */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        <MapViewController selectedState={selectedState} />

        {/* National view: state polygons + ZHVI heat */}
        {!inStateView && statesGeo && (
          <GeoJSON
            key={`states-${stateHeat.size}`}
            data={statesGeo}
            style={stateStyle}
            onEachFeature={onEachState}
          />
        )}

        {/* State view: county polygons for the selected state */}
        {inStateView && stateCountiesGeo && (
          <GeoJSON
            key={`counties-${selectedState}-${countyHeat.size}`}
            data={stateCountiesGeo}
            style={countyStyle}
            onEachFeature={onEachCounty}
          />
        )}

        {/* Listing pins — circles with hover label */}
        {validListings.map(l => {
          const isPinned = pinnedListingId && pinnedListingId === l.id;
          return (
            <CircleMarker
              key={l.id}
              center={[l.latitude, l.longitude]}
              radius={isPinned ? 9 : 6}
              pathOptions={{
                color: "#FFFFFF",
                weight: 2,
                fillColor: isPinned ? "#F97316" : THEME.accent,
                fillOpacity: 1
              }}
              eventHandlers={{
                click: () => onListingClick && onListingClick(l)
              }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                {l.address || l.formattedAddress || "Listing"}
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* City labels — non-interactive overlay */}
        {cityLabels.map(c => (
          <Marker
            key={`${c.name}-${c.state}`}
            position={[c.lat, c.lng]}
            icon={cityLabelIcon(c.name, !inStateView)}
            interactive={false}
            keyboard={false}
          />
        ))}
      </MapContainer>

      {/* Floating "← Back to US" button — only in state view */}
      {inStateView && onResetView && (
        <button
          type="button"
          onClick={onResetView}
          aria-label="Back to US overview"
          style={{
            position: "absolute", top: 12, left: 60, zIndex: 1000,
            padding: "7px 12px",
            background: "rgba(255,255,255,0.95)",
            color: THEME.accent,
            border: `1px solid ${THEME.border}`,
            borderRadius: 6,
            fontSize: 12, fontWeight: 700,
            display: "inline-flex", alignItems: "center", gap: 5,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(15,23,42,0.18)"
          }}
        >
          <ArrowLeft size={12} />
          Back to US
        </button>
      )}

      {/* Reset highlights — top-right, kept for clearing the active pin */}
      {onResetView && (highlightedMarket || pinnedListingId) && (
        <button
          type="button"
          onClick={onResetView}
          aria-label="Reset map view"
          style={{
            position: "absolute", top: 12, right: 12, zIndex: 1000,
            padding: "7px 10px",
            background: "rgba(255,255,255,0.95)",
            color: THEME.accent,
            border: `1px solid ${THEME.border}`,
            borderRadius: 6,
            fontSize: 11, fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: 6,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(15,23,42,0.18)"
          }}
        >
          <RotateCcw size={12} />
          Reset
        </button>
      )}

      {/* Bottom legend — same heat-bar treatment as the old version */}
      <div style={{
        position: "absolute", bottom: 12, left: 12, right: 12, zIndex: 1000,
        padding: "8px 12px", background: "rgba(255,255,255,0.92)",
        border: `1px solid ${THEME.border}`, borderRadius: 6,
        fontSize: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontWeight: 700, color: THEME.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Median Home Value (Zillow ZHVI)
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="mono" style={{ color: "#15803D", fontWeight: 700 }}>More affordable</span>
          <div style={{ flex: 1, display: "flex", gap: 1, height: 8, borderRadius: 2, overflow: "hidden" }}>
            {[1, 0.8, 0.6, 0.4, 0.2, 0].map(t => (
              <div key={t} style={{ flex: 1, background: scoreToHeatFill(t) }} />
            ))}
          </div>
          <span className="mono" style={{ color: "#B91C1C", fontWeight: 700 }}>Pricier</span>
        </div>
      </div>
    </div>
  );
};
