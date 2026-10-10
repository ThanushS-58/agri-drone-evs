/**
 * Geospatial utilities for agricultural field mapping, polygon boundary area calculations,
 * and damage representation.
 */

export interface LatLngPoint {
  lat: number;
  lng: number;
}

/**
 * Calculates geodesic area of a polygon in acres.
 * Coordinates are array of [latitude, longitude].
 */
export function calculatePolygonAreaAcres(coords: [number, number][]): number {
  if (!coords || coords.length < 3) return 0;

  const EARTH_RADIUS = 6378137; // meters
  let area = 0;

  // Convert to radians
  const radCoords = coords.map(([lat, lng]) => ({
    lat: (lat * Math.PI) / 180,
    lng: (lng * Math.PI) / 180,
  }));

  const len = radCoords.length;
  for (let i = 0; i < len; i++) {
    const p1 = radCoords[i];
    const p2 = radCoords[(i + 1) % len];
    area += (p2.lng - p1.lng) * (2 + Math.sin(p1.lat) + Math.sin(p2.lat));
  }

  area = (Math.abs(area) * EARTH_RADIUS * EARTH_RADIUS) / 2.0;

  // Convert square meters to acres (1 acre = 4046.8564224 square meters)
  const acres = area / 4046.8564224;
  return Math.round(acres * 100) / 100;
}

/**
 * Computes polygon centroid [lat, lng]
 */
export function getPolygonCentroid(coords: [number, number][]): [number, number] {
  if (!coords || coords.length === 0) return [0, 0];
  let sumLat = 0;
  let sumLng = 0;
  for (const [lat, lng] of coords) {
    sumLat += lat;
    sumLng += lng;
  }
  return [sumLat / coords.length, sumLng / coords.length];
}

/**
 * Generates sample grid sample points within a bounding box for visual damage scatter representation
 */
export function generateDamageGridInsidePolygon(
  coords: [number, number][],
  damagePercentage: number,
  gridCols = 5,
  gridRows = 4
): { lat: number; lng: number; status: 'healthy' | 'moderate' | 'severe' }[] {
  if (!coords || coords.length < 3) return [];

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const [lat, lng] of coords) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }

  const points: { lat: number; lng: number; status: 'healthy' | 'moderate' | 'severe' }[] = [];
  const latStep = (maxLat - minLat) / (gridRows + 1);
  const lngStep = (maxLng - minLng) / (gridCols + 1);

  let pointIndex = 0;
  const totalSlots = gridRows * gridCols;
  const severeSlots = Math.round((totalSlots * Math.min(damagePercentage, 100)) / 100);
  const moderateSlots = Math.round((totalSlots * Math.max(0, 100 - damagePercentage) * 0.25) / 100);

  for (let r = 1; r <= gridRows; r++) {
    for (let c = 1; c <= gridCols; c++) {
      const pLat = minLat + r * latStep;
      const pLng = minLng + c * lngStep;

      // Classify based on damage distribution
      let status: 'healthy' | 'moderate' | 'severe' = 'healthy';
      if (pointIndex < severeSlots) {
        status = 'severe';
      } else if (pointIndex < severeSlots + moderateSlots) {
        status = 'moderate';
      }

      points.push({ lat: pLat, lng: pLng, status });
      pointIndex++;
    }
  }

  return points;
}
