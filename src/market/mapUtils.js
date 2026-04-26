/* ============================================================================
   MAP UTILITIES — FIPS lookups, county-name normalization, and the
   red→yellow→green heat scale used on the county map.
   ============================================================================ */

export const STATE_FIPS_BY_CODE = {
  AL: "01", AK: "02", AZ: "04", AR: "05", CA: "06", CO: "08", CT: "09", DE: "10",
  DC: "11", FL: "12", GA: "13", HI: "15", ID: "16", IL: "17", IN: "18", IA: "19",
  KS: "20", KY: "21", LA: "22", ME: "23", MD: "24", MA: "25", MI: "26", MN: "27",
  MS: "28", MO: "29", MT: "30", NE: "31", NV: "32", NH: "33", NJ: "34", NM: "35",
  NY: "36", NC: "37", ND: "38", OH: "39", OK: "40", OR: "41", PA: "42", RI: "44",
  SC: "45", SD: "46", TN: "47", TX: "48", UT: "49", VT: "50", VA: "51", WA: "53",
  WV: "54", WI: "55", WY: "56"
};

// Reverse lookup: FIPS "12" -> "FL"
export const STATE_CODE_BY_FIPS = Object.entries(STATE_FIPS_BY_CODE).reduce((acc, [code, fips]) => {
  acc[fips] = code;
  return acc;
}, {});

export const STATE_NAMES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming"
};

/**
 * Representative city per state — largest/most-active metro for real-estate
 * data. Used as the default when the user picks a state we don't have
 * curated market data for, so the RentCast fetch still has a concrete city
 * to anchor against. Users can still click any county on the map to change
 * the target city.
 */
export const STATE_DEFAULT_CITIES = {
  AL: "Birmingham",   AK: "Anchorage",    AZ: "Phoenix",      AR: "Little Rock",
  CA: "Los Angeles",  CO: "Denver",       CT: "Bridgeport",   DE: "Wilmington",
  DC: "Washington",   FL: "Jacksonville", GA: "Atlanta",      HI: "Honolulu",
  ID: "Boise",        IL: "Chicago",      IN: "Indianapolis", IA: "Des Moines",
  KS: "Wichita",      KY: "Louisville",   LA: "New Orleans",  ME: "Portland",
  MD: "Baltimore",    MA: "Boston",       MI: "Detroit",      MN: "Minneapolis",
  MS: "Jackson",      MO: "Kansas City",  MT: "Billings",     NE: "Omaha",
  NV: "Las Vegas",    NH: "Manchester",   NJ: "Newark",       NM: "Albuquerque",
  NY: "New York",     NC: "Charlotte",    ND: "Fargo",        OH: "Columbus",
  OK: "Oklahoma City",OR: "Portland",     PA: "Philadelphia", RI: "Providence",
  SC: "Charleston",   SD: "Sioux Falls",  TN: "Nashville",    TX: "Houston",
  UT: "Salt Lake City",VT: "Burlington",  VA: "Virginia Beach",WA: "Seattle",
  WV: "Charleston",   WI: "Milwaukee",    WY: "Cheyenne"
};

export const STATE_MAP_VIEW = {
  FL: { center: [-82, 28], zoom: 4 },
  NY: { center: [-75.5, 43], zoom: 3.5 },
  TX: { center: [-99, 31.5], zoom: 2.8 },
  OH: { center: [-82.5, 40.5], zoom: 5 },
  PA: { center: [-77.5, 41], zoom: 4.5 },
  GA: { center: [-83, 32.5], zoom: 4.5 },
  NC: { center: [-79.5, 35.5], zoom: 4 },
  SC: { center: [-81, 34], zoom: 5 },
  TN: { center: [-86, 36], zoom: 4 },
  MI: { center: [-85, 44.5], zoom: 3.5 },
  IN: { center: [-86, 40], zoom: 4.8 },
  IL: { center: [-89, 40], zoom: 3.5 },
  AZ: { center: [-112, 34], zoom: 3.5 },
  CO: { center: [-106, 39], zoom: 3.8 },
  NJ: { center: [-74.5, 40.3], zoom: 7 }
};

export const COUNTIES_TOPOJSON = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
// State polygons for the national overview view — same source/CDN as the
// counties file, ~50 features instead of ~3,144 so it renders nearly
// instantly on mobile.
export const STATES_TOPOJSON   = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
// Single-polygon country outline. Used as a "land" base layer so areas
// without a heat fill still read as land, not blank canvas. Areas
// OUTSIDE this polygon are ocean (rendered as the SVG background); the
// Great Lakes are carved out as holes so they automatically appear in
// the water color too.
export const NATION_TOPOJSON   = "https://cdn.jsdelivr.net/npm/us-atlas@3/nation-10m.json";

// Map palette tuned for legibility on the choropleth. Water is a soft
// sky blue (matches a typical print atlas), land is a warm beige, and
// borders are a desaturated navy so heat fills pop on top.
export const MAP_PALETTE = {
  water: "#CFE5F2",    // ocean + Great Lakes
  land:  "#F4EEE2",    // base land color where no heat fill applies
  landStroke: "#C7BFB1"
};

export const normalizeCountyName = (name) =>
  (name || "").toLowerCase().replace(/\s+county$/i, "").trim();

// Curated metro labels for the map — drawn similarly to how Zillow shows
// city names floating above the choropleth. `tier` controls visibility:
//   1 = top-25 nationwide metros, always visible (national + state view)
//   2 = mid-tier metros, only shown when zoomed into a state
// `state` is the 2-letter code; lat/lng are best-known city center.
export const MAJOR_CITY_LABELS = [
  // Tier 1 — biggest metros, always visible
  { name: "New York",      state: "NY", lat: 40.713, lng: -74.006, tier: 1 },
  { name: "Los Angeles",   state: "CA", lat: 34.052, lng: -118.244, tier: 1 },
  { name: "Chicago",       state: "IL", lat: 41.878, lng: -87.630, tier: 1 },
  { name: "Houston",       state: "TX", lat: 29.760, lng: -95.369, tier: 1 },
  { name: "Phoenix",       state: "AZ", lat: 33.448, lng: -112.074, tier: 1 },
  { name: "Philadelphia",  state: "PA", lat: 39.953, lng: -75.165, tier: 1 },
  { name: "San Antonio",   state: "TX", lat: 29.424, lng: -98.495, tier: 1 },
  { name: "San Diego",     state: "CA", lat: 32.716, lng: -117.161, tier: 1 },
  { name: "Dallas",        state: "TX", lat: 32.776, lng: -96.797, tier: 1 },
  { name: "Austin",        state: "TX", lat: 30.267, lng: -97.743, tier: 1 },
  { name: "Jacksonville",  state: "FL", lat: 30.332, lng: -81.656, tier: 1 },
  { name: "Fort Worth",    state: "TX", lat: 32.756, lng: -97.331, tier: 1 },
  { name: "Columbus",      state: "OH", lat: 39.961, lng: -82.999, tier: 1 },
  { name: "Charlotte",     state: "NC", lat: 35.227, lng: -80.843, tier: 1 },
  { name: "Indianapolis",  state: "IN", lat: 39.768, lng: -86.158, tier: 1 },
  { name: "San Francisco", state: "CA", lat: 37.775, lng: -122.419, tier: 1 },
  { name: "Seattle",       state: "WA", lat: 47.606, lng: -122.332, tier: 1 },
  { name: "Denver",        state: "CO", lat: 39.739, lng: -104.990, tier: 1 },
  { name: "Washington",    state: "DC", lat: 38.907, lng: -77.037, tier: 1 },
  { name: "Boston",        state: "MA", lat: 42.360, lng: -71.058, tier: 1 },
  { name: "Nashville",     state: "TN", lat: 36.163, lng: -86.781, tier: 1 },
  { name: "Atlanta",       state: "GA", lat: 33.749, lng: -84.388, tier: 1 },
  { name: "Miami",         state: "FL", lat: 25.762, lng: -80.192, tier: 1 },
  { name: "Las Vegas",     state: "NV", lat: 36.170, lng: -115.140, tier: 1 },
  { name: "Portland",      state: "OR", lat: 45.515, lng: -122.679, tier: 1 },
  // Tier 2 — visible only inside a selected state
  { name: "Tampa",         state: "FL", lat: 27.951, lng: -82.458, tier: 2 },
  { name: "Orlando",       state: "FL", lat: 28.538, lng: -81.379, tier: 2 },
  { name: "Sarasota",      state: "FL", lat: 27.336, lng: -82.531, tier: 2 },
  { name: "Fort Myers",    state: "FL", lat: 26.640, lng: -81.872, tier: 2 },
  { name: "Naples",        state: "FL", lat: 26.142, lng: -81.795, tier: 2 },
  { name: "Tallahassee",   state: "FL", lat: 30.438, lng: -84.281, tier: 2 },
  { name: "El Paso",       state: "TX", lat: 31.762, lng: -106.485, tier: 2 },
  { name: "Sacramento",    state: "CA", lat: 38.582, lng: -121.494, tier: 2 },
  { name: "San Jose",      state: "CA", lat: 37.339, lng: -121.895, tier: 2 },
  { name: "Oakland",       state: "CA", lat: 37.804, lng: -122.271, tier: 2 },
  { name: "Long Beach",    state: "CA", lat: 33.770, lng: -118.193, tier: 2 },
  { name: "Albuquerque",   state: "NM", lat: 35.085, lng: -106.651, tier: 2 },
  { name: "Tucson",        state: "AZ", lat: 32.222, lng: -110.926, tier: 2 },
  { name: "Mesa",          state: "AZ", lat: 33.415, lng: -111.831, tier: 2 },
  { name: "Kansas City",   state: "MO", lat: 39.099, lng: -94.578, tier: 2 },
  { name: "Memphis",       state: "TN", lat: 35.149, lng: -90.049, tier: 2 },
  { name: "Knoxville",     state: "TN", lat: 35.961, lng: -83.921, tier: 2 },
  { name: "Louisville",    state: "KY", lat: 38.253, lng: -85.759, tier: 2 },
  { name: "Milwaukee",     state: "WI", lat: 43.039, lng: -87.906, tier: 2 },
  { name: "Detroit",       state: "MI", lat: 42.331, lng: -83.046, tier: 2 },
  { name: "Cleveland",     state: "OH", lat: 41.499, lng: -81.694, tier: 2 },
  { name: "Cincinnati",    state: "OH", lat: 39.103, lng: -84.512, tier: 2 },
  { name: "Pittsburgh",    state: "PA", lat: 40.441, lng: -79.996, tier: 2 },
  { name: "Buffalo",       state: "NY", lat: 42.886, lng: -78.879, tier: 2 },
  { name: "Raleigh",       state: "NC", lat: 35.779, lng: -78.638, tier: 2 },
  { name: "Greensboro",    state: "NC", lat: 36.073, lng: -79.792, tier: 2 },
  { name: "Asheville",     state: "NC", lat: 35.595, lng: -82.551, tier: 2 },
  { name: "Wilmington",    state: "NC", lat: 34.226, lng: -77.945, tier: 2 },
  { name: "Charleston",    state: "SC", lat: 32.776, lng: -79.931, tier: 2 },
  { name: "Savannah",      state: "GA", lat: 32.081, lng: -81.091, tier: 2 },
  { name: "Birmingham",    state: "AL", lat: 33.521, lng: -86.802, tier: 2 },
  { name: "New Orleans",   state: "LA", lat: 29.951, lng: -90.072, tier: 2 },
  { name: "Oklahoma City", state: "OK", lat: 35.467, lng: -97.516, tier: 2 },
  { name: "Tulsa",         state: "OK", lat: 36.154, lng: -95.993, tier: 2 },
  { name: "Salt Lake City", state: "UT", lat: 40.760, lng: -111.891, tier: 2 },
  { name: "Boise",         state: "ID", lat: 43.615, lng: -116.202, tier: 2 },
  { name: "Reno",          state: "NV", lat: 39.530, lng: -119.815, tier: 2 },
  { name: "Spokane",       state: "WA", lat: 47.659, lng: -117.426, tier: 2 },
  { name: "Anchorage",     state: "AK", lat: 61.218, lng: -149.900, tier: 2 },
  { name: "Honolulu",      state: "HI", lat: 21.307, lng: -157.858, tier: 2 }
];

// Return a red→yellow→green heatmap fill based on normalized score (0..1).
// Low score = vibrant red, mid = true yellow, high = vibrant green.
export const scoreToHeatFill = (t) => {
  const clamped = Math.max(0, Math.min(1, t));
  // Three color stops (Tailwind-style vibrant palette):
  //   0.0 = red-500    (239, 68, 68)
  //   0.5 = yellow-400 (250, 204, 21)
  //   1.0 = green-500  (34, 197, 94)
  let r, g, b;
  if (clamped < 0.5) {
    const k = clamped / 0.5; // 0..1 within red→yellow band
    r = Math.round(239 + (250 - 239) * k);
    g = Math.round(68 + (204 - 68) * k);
    b = Math.round(68 + (21 - 68) * k);
  } else {
    const k = (clamped - 0.5) / 0.5; // 0..1 within yellow→green band
    r = Math.round(250 + (34 - 250) * k);
    g = Math.round(204 + (197 - 204) * k);
    b = Math.round(21 + (94 - 21) * k);
  }
  return `rgba(${r}, ${g}, ${b}, 0.90)`;
};

export const scoreToHeatStroke = (t) => {
  const clamped = Math.max(0, Math.min(1, t));
  if (clamped < 0.33) return "#B91C1C"; // red-700
  if (clamped < 0.67) return "#A16207"; // yellow-700
  return "#15803D"; // green-700
};

// BRRRR scores typically land in the 50–100 range. Using a fixed scale (rather
// than min/max of the dataset) means the colors carry absolute meaning: a score
// of 65 always looks the same shade whether the dataset ranges 60–90 or 50–100.
export const HEAT_SCALE_MIN = 55;
export const HEAT_SCALE_MAX = 95;
export const scoreToT = (score) => {
  const range = HEAT_SCALE_MAX - HEAT_SCALE_MIN;
  return Math.max(0, Math.min(1, (score - HEAT_SCALE_MIN) / range));
};
