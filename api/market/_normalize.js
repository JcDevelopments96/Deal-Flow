/* ============================================================================
   Listing normalizers — turn upstream API responses into one canonical
   shape that the frontend ListingCard can render without caring about
   which provider served the data.
   ============================================================================ */

// Realtor's `primary_photo.href` is a low-res thumbnail (~640x480) which
// looks blurry in a 4:3 card. Their CDN (rdcpix.com) supports on-the-fly
// resizing via path suffixes — we rewrite "xxxs.jpg" → "xxxod-w1024_h768.jpg"
// to get a crisp image at card size without wasting bandwidth on 4K originals.
// Safe to call on non-Realtor URLs (no-op if the pattern doesn't match).
const upgradeRealtorPhoto = (url) => {
  if (typeof url !== "string" || !url) return url;
  if (!url.includes("rdcpix.com")) return url;
  // Common suffixes: s.jpg (small), c.jpg (cropped), m.jpg (medium), t.jpg (tiny).
  // Replace any of them with the resize directive. Also handle URLs that
  // already have a dimension suffix — upgrade width to 1024.
  return url
    .replace(/-w\d+_h\d+(_q\d+)?(\.jpg)/i, "-w1024_h768_q80$2")
    .replace(/([a-z])s(\.jpg)(\?|$)/i, "$1od-w1024_h768_q80$2$3")
    .replace(/([a-z])c(\.jpg)(\?|$)/i, "$1od-w1024_h768_q80$2$3")
    .replace(/([a-z])m(\.jpg)(\?|$)/i, "$1od-w1024_h768_q80$2$3")
    .replace(/([a-z])t(\.jpg)(\?|$)/i, "$1od-w1024_h768_q80$2$3");
};

const pushUnique = (arr, url) => {
  const up = upgradeRealtorPhoto(url);
  if (typeof up === "string" && up && !arr.includes(up)) arr.push(up);
};

/**
 * Realtor.com via realty-in-us (apidojo wrapper).
 * Response shape (for a single home in data.home_search.results):
 *   {
 *     listing_id, property_id, status, list_price, list_date, days_on_market,
 *     description: { beds, baths, sqft, year_built, type },
 *     location: { address: { line, city, state_code, postal_code, coordinate } },
 *     primary_photo: { href },
 *     photos: [{ href }, ...],
 *     permalink
 *   }
 */
export function normalizeRealtor(r) {
  if (!r) return null;

  // The v3/list endpoint only returns `primary_photo`. Full multi-photo
  // arrays require a separate /v3/detail call per property (expensive).
  // We surface the single primary + `photoCount` so the UI can show
  // "1 / 23" even when we've only actually loaded one.
  const photos = [];
  pushUnique(photos, r.primary_photo?.href);
  if (Array.isArray(r.photos)) for (const p of r.photos) pushUnique(photos, p?.href);
  const photoCount = typeof r.photo_count === "number" ? r.photo_count : photos.length;

  const addr = r.location?.address || {};
  const city = addr.city || null;
  const state = addr.state_code || addr.state || null;
  const street = addr.line || null;
  const zip = addr.postal_code || null;
  // County name is inconsistently populated in v3/list responses — take it
  // when present so the client can color the map by county-level medians.
  const county = r.location?.county?.name || r.location?.county || null;
  const countyFips = r.location?.county?.fips_code || null;

  const price = r.list_price ?? null;
  const sqft = r.description?.sqft ?? null;

  const formattedAddress = [street, city, state].filter(Boolean).join(", ");
  // `r.href` is the full realtor.com URL ("https://www.realtor.com/realestateandhomes-detail/...").
  // `r.permalink` is inconsistently populated by v3/list; `r.href` is reliable.
  const externalUrl = r.href
    || (r.permalink ? `https://www.realtor.com/realestateandhomes-detail/${r.permalink}` : null);

  return {
    id: r.listing_id || r.property_id || `realtor-${street}-${zip}`,
    formattedAddress,
    addressLine1: street,
    city, state, zipCode: zip,
    county, countyFips,
    price,
    bedrooms: r.description?.beds ?? null,
    bathrooms: r.description?.baths ?? null,
    squareFootage: sqft,
    propertyType: r.description?.type || null,
    yearBuilt: r.description?.year_built ?? null,
    listedDate: r.list_date || null,
    daysOnMarket: r.days_on_market ?? null,
    status: r.status === "for_sale" ? "Active" : (r.status || "Active"),
    latitude: addr.coordinate?.lat ?? null,
    longitude: addr.coordinate?.lon ?? null,
    pricePerSqft: price && sqft ? Math.round(price / sqft) : null,
    photos,
    photoCount,
    imageUrl: photos[0] || null,
    externalUrl,
    virtualTour: Array.isArray(r.virtual_tours) && r.virtual_tours.length > 0 ? r.virtual_tours[0]?.href : null,
    sourceProvider: "realtor"
  };
}

/**
 * RentCast sale + rental listings.
 * Their response already has flat-ish fields; we just collect any photo URLs
 * and compute pricePerSqft so the shape matches Realtor's.
 */
export function normalizeRentCast(r) {
  if (!r) return null;

  const photos = [];
  const pushFrom = (arr) => {
    if (!Array.isArray(arr)) return;
    for (const p of arr) {
      if (typeof p === "string") pushUnique(photos, p);
      else if (p && typeof p === "object") pushUnique(photos, p.url || p.href || p.src);
    }
  };
  pushFrom(r.photos);
  pushFrom(r.images);
  pushUnique(photos, r.primaryPhoto);
  pushUnique(photos, r.photoUrl);
  pushUnique(photos, r.imageUrl);

  const price = r.price ?? null;
  const sqft = r.squareFootage ?? null;
  const formattedAddress = r.formattedAddress
    || [r.addressLine1, r.city, r.state].filter(Boolean).join(", ");

  return {
    id: r.id || `${r.addressLine1}-${r.zipCode}`,
    formattedAddress,
    addressLine1: r.addressLine1 || null,
    city: r.city || null,
    state: r.state || null,
    zipCode: r.zipCode || null,
    price,
    bedrooms: r.bedrooms ?? null,
    bathrooms: r.bathrooms ?? null,
    squareFootage: sqft,
    propertyType: r.propertyType || null,
    yearBuilt: r.yearBuilt ?? null,
    listedDate: r.listedDate || null,
    daysOnMarket: r.daysOnMarket ?? null,
    status: r.status || "Active",
    latitude: r.latitude ?? null,
    longitude: r.longitude ?? null,
    pricePerSqft: price && sqft ? Math.round(price / sqft) : null,
    photos,
    photoCount: photos.length,
    imageUrl: photos[0] || null,
    externalUrl: null,
    virtualTour: null,
    sourceProvider: "rentcast"
  };
}
