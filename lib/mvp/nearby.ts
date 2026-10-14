export type Coordinates = { latitude: number | null; longitude: number | null }
export function hasCoordinates(point: Coordinates): point is { latitude: number; longitude: number } {
  return point.latitude !== null && point.longitude !== null && Number.isFinite(point.latitude) && Number.isFinite(point.longitude) && Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180
}
export function straightLineKm(a: Coordinates, b: Coordinates) {
  if (!hasCoordinates(a) || !hasCoordinates(b)) return null
  const rad = (n: number) => n * Math.PI / 180
  const v = Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(rad(b.longitude - a.longitude) / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(v), Math.sqrt(Math.max(0, 1 - v)))
}
export function nearestPlaces<T extends Coordinates & { id: number }>(items: T[], origin: Coordinates, radiusKm: number) {
  if (!hasCoordinates(origin) || !Number.isFinite(radiusKm) || radiusKm <= 0) return []
  return items.flatMap(item => {
    const km = straightLineKm(origin, item)
    return km !== null && km <= radiusKm ? [{ ...item, distanceKm: km }] : []
  }).sort((a, b) => a.distanceKm - b.distanceKm || a.id - b.id)
}
