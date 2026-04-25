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

export const normalizeCountyName = (name) =>
  (name || "").toLowerCase().replace(/\s+county$/i, "").trim();

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
