// ─────────────────────────────────────────────────────────────────────────────
// Geo Utilities — @kshuri/api-client
// Pure functions — no external dependencies.
// ─────────────────────────────────────────────────────────────────────────────

/** Build a Google Maps directions URL for a destination, with optional origin. */
export function directionsUrl(
  dest: { lat: number; lng: number },
  origin?: { lat: number; lng: number },
): string {
  const o = origin ? `&origin=${origin.lat},${origin.lng}` : '';
  return `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}${o}`;
}

/** Haversine great-circle distance between two lat/lng points, in kilometres. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
