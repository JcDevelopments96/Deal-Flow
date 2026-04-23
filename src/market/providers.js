/* ============================================================================
   DATA PROVIDERS — Zillow (via RapidAPI zillow-com1) BYOK for standalone mode.
   SaaS mode goes through /api/market/listings (Realtor.com, server-side key).

   RentCast was removed: rental baselines now come from the free stack
   (HUD Fair Market Rents + Zillow ZORI + Census median gross rent), all
   surfaced in the "Free Data Sources" panel on the Market Intel view.
   ============================================================================ */

export const PROVIDER_STORAGE_KEY = "dealtrack-data-provider";
export const RAPIDAPI_STORAGE_KEY = "dealtrack-rapidapi-zillow-key";

// eslint-disable-next-line no-undef
export const ENV_RAPIDAPI_KEY = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_RAPIDAPI_ZILLOW_KEY) || "";

export const PROVIDERS = {
  zillow: {
    id: "zillow",
    name: "Zillow (via RapidAPI)",
    subtitle: "Zillow for-sale listings & home details",
    signupUrl: "https://rapidapi.com/apimaker/api/zillow-com1",
    docsUrl: "https://rapidapi.com/apimaker/api/zillow-com1",
    freeTier: "Free tier available on RapidAPI",
    storageKey: RAPIDAPI_STORAGE_KEY,
    envKey: ENV_RAPIDAPI_KEY
  }
};

// Demo images — use Lorem Picsum's deterministic seed endpoint (no auth, no API key,
// CORS-unrestricted for <img> tags, reliable). The seed guarantees each demo card gets
// the same image across re-renders. Picsum photos rotate across many styles; they won't
// always look like a house, but they render 100% of the time — which is the goal for demo.
export const PICSUM_BASE = "https://picsum.photos/seed";
export const DEMO_HOUSE_IMAGES = [
  `${PICSUM_BASE}/dealtrack-house-1/640/400`,
  `${PICSUM_BASE}/dealtrack-house-2/640/400`,
  `${PICSUM_BASE}/dealtrack-house-3/640/400`,
  `${PICSUM_BASE}/dealtrack-house-4/640/400`,
  `${PICSUM_BASE}/dealtrack-house-5/640/400`,
  `${PICSUM_BASE}/dealtrack-house-6/640/400`,
  `${PICSUM_BASE}/dealtrack-house-7/640/400`,
  `${PICSUM_BASE}/dealtrack-house-8/640/400`
];

export const buildDemoListings = (state, city, marketRef) => {
  if (!marketRef) return [];
  const base = marketRef.medianPrice || 275000;
  const streets = ["Oak Ave", "Maple St", "Sunset Blvd", "Palm Dr", "Magnolia Ln", "Pine Ct", "Harbor Rd", "Laurel Way"];
  return Array.from({ length: 6 }).map((_, i) => {
    const variation = 0.78 + (i * 0.08);
    const price = Math.round(base * variation / 1000) * 1000;
    const sqft = 1000 + i * 220;
    return {
      id: `demo-${state}-${city}-${i}`,
      formattedAddress: `${1200 + i * 37} ${streets[i % streets.length]}, ${city}, ${state}`,
      addressLine1: `${1200 + i * 37} ${streets[i % streets.length]}`,
      city,
      state,
      price,
      bedrooms: 2 + (i % 3),
      bathrooms: 1.5 + (i % 3) * 0.5,
      squareFootage: sqft,
      propertyType: i % 4 === 3 ? "Multi-Family" : "Single Family",
      yearBuilt: 1960 + ((i * 7) % 55),
      listedDate: new Date(Date.now() - i * 86400000 * 9).toISOString(),
      pricePerSqft: Math.round(price / sqft),
      daysOnMarket: 7 + i * 9,
      status: "Active",
      photos: [DEMO_HOUSE_IMAGES[i % DEMO_HOUSE_IMAGES.length]],
      imageUrl: DEMO_HOUSE_IMAGES[i % DEMO_HOUSE_IMAGES.length],
      demo: true
    };
  });
};

export const formatZillowListing = (raw) => {
  const address = raw.address && typeof raw.address === "object"
    ? `${raw.address.streetAddress || ""}, ${raw.address.city || ""}, ${raw.address.state || ""}`.trim()
    : (raw.address || raw.streetAddress || "");

  // Photo array: prefer carouselPhotos if the wrapper provides it, else single imgSrc.
  const photos = [];
  const seen = new Set();
  const push = (v) => { if (typeof v === "string" && v && !seen.has(v)) { seen.add(v); photos.push(v); } };
  if (Array.isArray(raw.carouselPhotos)) {
    for (const p of raw.carouselPhotos) push(typeof p === "string" ? p : (p && (p.url || p.src)));
  }
  push(raw.imgSrc);
  push(raw.hiResImageLink);
  const image = photos[0] || null;
  return {
    id: raw.zpid || raw.id || `${address}`,
    formattedAddress: address,
    addressLine1: raw.streetAddress || raw.address?.streetAddress,
    city: raw.city || raw.address?.city,
    state: raw.state || raw.address?.state,
    price: raw.price || raw.listPrice,
    bedrooms: raw.bedrooms,
    bathrooms: raw.bathrooms,
    squareFootage: raw.livingArea || raw.livingAreaValue,
    propertyType: raw.propertyType || raw.homeType,
    yearBuilt: raw.yearBuilt,
    listedDate: raw.datePosted,
    pricePerSqft: raw.price && raw.livingArea ? Math.round(raw.price / raw.livingArea) : null,
    daysOnMarket: raw.daysOnZillow,
    status: raw.listingStatus || "Active",
    latitude: raw.latitude,
    longitude: raw.longitude,
    photos,
    imageUrl: image,
    externalUrl: raw.detailUrl
      ? (raw.detailUrl.startsWith("http") ? raw.detailUrl : `https://www.zillow.com${raw.detailUrl}`)
      : null
  };
};

export const loadProviderPrefs = () => {
  try {
    const provider = window.localStorage.getItem(PROVIDER_STORAGE_KEY) || "rentcast";
    const keys = {};
    Object.values(PROVIDERS).forEach(p => {
      keys[p.id] = window.localStorage.getItem(p.storageKey) || p.envKey || "";
    });
    return { provider, keys };
  } catch {
    return { provider: "rentcast", keys: {} };
  }
};

// Parse "any" | "3" | "5+" | "1.5" into { min, max }.
export const parseFilterRange = (raw) => {
  if (!raw || raw === "any") return { min: null, max: null };
  if (typeof raw === "string" && raw.endsWith("+")) {
    const n = parseFloat(raw.slice(0, -1));
    return { min: n, max: null };
  }
  const n = parseFloat(raw);
  return Number.isFinite(n) ? { min: n, max: n } : { min: null, max: null };
};

export const matchesRange = (value, range) => {
  if (range.min === null && range.max === null) return true;
  if (value === null || value === undefined || Number.isNaN(value)) return false;
  if (range.min !== null && value < range.min) return false;
  if (range.max !== null && value > range.max) return false;
  return true;
};
