/**
 * Signed Google Maps Static URLs — Street View + Satellite (aerial).
 *
 * Shared by /api/wholesale and /api/market/listings so the same photo-pill
 * treatment can appear on every property card in the app. The Google API
 * key MUST be referrer-restricted in Google Cloud Console.
 */

function resolveLocation({ address, city, state, zip, latitude, longitude, formattedAddress }) {
  if (Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))) {
    return `${latitude},${longitude}`;
  }
  const loc = [formattedAddress || address, city, state, zip].filter(Boolean).join(", ");
  return loc || null;
}

export function streetViewUrl(obj, { size = "480x320" } = {}) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const loc = resolveLocation(obj);
  if (!loc) return null;
  const qs = new URLSearchParams({ size, key, fov: "80", pitch: "0", location: loc });
  return `https://maps.googleapis.com/maps/api/streetview?${qs.toString()}`;
}

export function satelliteUrl(obj, { size = "480x320", zoom = "19" } = {}) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const loc = resolveLocation(obj);
  if (!loc) return null;
  const qs = new URLSearchParams({
    size, key, zoom, maptype: "satellite",
    center: loc, markers: `color:red|${loc}`
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${qs.toString()}`;
}
