/* ============================================================================
   Listing normalizers — turn upstream API responses into one canonical
   shape that the frontend ListingCard can render without caring about
   which provider served the data.
   ============================================================================ */

// Realtor's primary_photo.href is a low-res thumbnail (~480x360) which
// looks blurry in a 4:3 card. Their CDN (rdcpix.com) supports on-the-fly
// resizing via path suffixes — we rewrite "xxxs.jpg" → "xxxod-w1536_h1024_q90.jpg"
// to get a crisp image at card size + 2x retina without wasting bandwidth
// on 4K originals. Safe to call on non-Realtor URLs (no-op if the pattern
// doesn't match).
const REALTOR_TARGET = "od-w1536_h1024_q90"; // 1536x1024 @ q90 — 2x retina headroom

const upgradeRealtorPhoto = (url) => {
  if (typeof url !== "string" || !url) return url;
  if (!url.includes("rdcpix.com")) return url;

  // Case 1: URL already has dimension hints baked in (newer Realtor format).
  // Just bump the dimensions + quality to our target.
  if (/-w\d+_h\d+/i.test(url)) {
    return url.replace(/-w\d+_h\d+(_q\d+)?(\.(?:jpe?g|png|webp))/i, `-${REALTOR_TARGET}$2`);
  }

  // Case 2: URL ends in a single-letter size suffix before the extension.
  // s = small, c = cropped, m = medium, t = tiny, o = original.
  // The character immediately before the suffix is part of Realtor's photo
  // hash and can be a letter OR a digit — the old regex only allowed
  // letters, so any URL ending in <digit><suffix>.jpg (about a third of
  // Realtor's IDs) was silently left at thumbnail size. Allowing
  // alphanumeric closes that gap.
  return url.replace(
    /([a-zA-Z0-9])([smcto])(\.(?:jpe?g|png|webp))(\?|$)/i,
    `$1${REALTOR_TARGET}$3$4`
  );
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
  // County name is inconsistently populated in v3/list responses. Realtor
  // sometimes returns an object ({name, fips_code}) and sometimes a bare
  // string — we coerce to a string (or null) to keep downstream `.toLowerCase()`
  // calls safe.
  const rawCounty = r.location?.county;
  const county = typeof rawCounty === "string"
    ? rawCounty
    : (rawCounty && typeof rawCounty.name === "string" ? rawCounty.name : null);
  const countyFips = rawCounty && typeof rawCounty.fips_code === "string"
    ? rawCounty.fips_code
    : null;

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

