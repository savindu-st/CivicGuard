import { Road } from '../types';

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Calculates distance in meters.
 */
export function calculateDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return calculateHaversineDistance(lat1, lon1, lat2, lon2) * 1000;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Generates an indexed bounding box around a coordinate for O(1) database queries.
 */
export function getBoundingBox(
  lat: number,
  lon: number,
  distanceMeters: number
): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
  const deltaLat = distanceMeters / 111320;
  const deltaLon = distanceMeters / (111320 * Math.cos(toRadians(lat)));

  return {
    minLat: lat - deltaLat,
    maxLat: lat + deltaLat,
    minLon: lon - deltaLon,
    maxLon: lon + deltaLon,
  };
}

/**
 * Ray-casting algorithm to test if point is inside a GeoJSON Polygon.
 * Point: [lon, lat] or [lat, lon]. Here coordinates are [lon, lat] per GeoJSON spec.
 */
export function isPointInPolygon(
  point: [number, number],
  polygonCoordinates: number[][][]
): boolean {
  const [x, y] = point; // longitude, latitude
  let inside = false;

  // Exterior ring is polygonCoordinates[0]
  const ring = polygonCoordinates[0];
  if (!ring || ring.length < 3) return false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0],
      yi = ring[i][1];
    const xj = ring[j][0],
      yj = ring[j][1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Finds nearest road from a list using Haversine distance.
 */
export function findNearestRoad(
  lat: number,
  lon: number,
  roads: Road[]
): { road: Road; distanceMeters: number } | null {
  if (!roads || roads.length === 0) return null;

  let nearestRoad = roads[0];
  let minDistance = calculateDistanceInMeters(
    lat,
    lon,
    roads[0].latitude,
    roads[0].longitude
  );

  for (let i = 1; i < roads.length; i++) {
    const dist = calculateDistanceInMeters(
      lat,
      lon,
      roads[i].latitude,
      roads[i].longitude
    );
    if (dist < minDistance) {
      minDistance = dist;
      nearestRoad = roads[i];
    }
  }

  return { road: nearestRoad, distanceMeters: minDistance };
}
