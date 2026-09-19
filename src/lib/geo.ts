/** مساعدات الموقع والمسافات (GPS). */

export type Coords = { lat: number; lng: number };

/** الرياض — تُستخدم كموقع افتراضي عند رفض صلاحية الموقع. */
export const DEFAULT_CENTER: Coords & { label: string } = {
  lat: 24.7136,
  lng: 46.6753,
  label: "الرياض",
};

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** المسافة بالكيلومترات (معادلة هافرساين). */
export function distanceKm(a: Coords, b: Coords): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** «٤٠٠ م» / «١٫٢ كم» */
export function formatDistance(km: number | null): string {
  if (km === null || !Number.isFinite(km)) return "—";
  if (km < 1) return `${Math.round(km * 1000)} م`;
  if (km < 10) return `${km.toFixed(1)} كم`;
  return `${Math.round(km)} كم`;
}

/** رابط المتجر على خرائط جوجل. */
export function mapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
