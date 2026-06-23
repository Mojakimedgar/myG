/**
 * Route tracking library
 * Handles recording, comparing, and detecting deviations in user routes
 */

import { calculateDistance } from "./zone-detection";
import {
  RoutePoint,
  RecordedRoute,
  RouteDeviation,
  ActiveRoute,
  RouteStatistics,
} from "@/types/route";

const DEVIATION_THRESHOLD_METERS = 200; // Alert if more than 200m off route
const MAJOR_DEVIATION_METERS = 500; // Major deviation threshold
const MINOR_DEVIATION_METERS = 100; // Minor deviation threshold
const ROUTE_POINT_INTERVAL = 30000; // Capture point every 30 seconds
const MIN_POINTS_FOR_ROUTE = 10; // Minimum points to consider a valid route

/**
 * Calculate the great-circle distance between two points using Haversine formula
 * Returns distance in meters
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return calculateDistance(lat1, lon1, lat2, lon2);
}

/**
 * Encode a route into compressed polyline format
 * Reduces storage by ~90%
 */
export function encodePolyline(points: RoutePoint[]): string {
  let encoded = "";
  let prevLat = 0,
    prevLon = 0;

  points.forEach((point) => {
    const lat = point.latitude;
    const lon = point.longitude;

    encoded += encodeValue(lat - prevLat);
    encoded += encodeValue(lon - prevLon);

    prevLat = lat;
    prevLon = lon;
  });

  return encoded;
}

/**
 * Decode polyline string back to coordinates
 */
export function decodePolyline(encoded: string): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  let index = 0,
    lat = 0,
    lon = 0;

  while (index < encoded.length) {
    const result = decodeValue(encoded, index);
    lat += result.value;
    index = result.index;

    const result2 = decodeValue(encoded, index);
    lon += result2.value;
    index = result2.index;

    points.push([lat / 1e5, lon / 1e5]);
  }

  return points;
}

function encodeValue(value: number): string {
  const scaled = Math.round(value * 1e5);
  return encodeVLQ(scaled);
}

function decodeValue(
  encoded: string,
  index: number
): { value: number; index: number } {
  let value = 0;
  let shift = 0;

  while (index < encoded.length) {
    const char = encoded.charCodeAt(index) - 63;
    index++;

    value |= (char & 0x1f) << shift;
    shift += 5;

    if (char < 0x20) break;
  }

  return {
    value: value & 1 ? ~(value >> 1) : value >> 1,
    index,
  };
}

function encodeVLQ(value: number): string {
  value = value << 1;
  if (value < 0) value = ~value;

  let encoded = "";
  while (value >= 0x20) {
    encoded += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
    value >>= 5;
  }
  encoded += String.fromCharCode(value + 63);
  return encoded;
}

/**
 * Calculate total distance of a route
 */
export function calculateRouteTotalDistance(points: RoutePoint[]): number {
  if (points.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalDistance += haversineDistance(
      points[i].latitude,
      points[i].longitude,
      points[i + 1].latitude,
      points[i + 1].longitude
    );
  }

  return totalDistance;
}

/**
 * Calculate total duration of a route
 */
export function calculateRouteDuration(points: RoutePoint[]): number {
  if (points.length < 2) return 0;
  return (
    points[points.length - 1].timestamp.getTime() -
    points[0].timestamp.getTime()
  );
}

/**
 * Find the closest point on the recorded route to the current location
 * Uses a simplified algorithm for performance
 */
export function findClosestPointOnRoute(
  currentLocation: RoutePoint,
  routePoints: RoutePoint[]
): { closestPoint: RoutePoint; index: number; distance: number } {
  let minDistance = Infinity;
  let closestIndex = 0;

  routePoints.forEach((point, index) => {
    const distance = haversineDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      point.latitude,
      point.longitude
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  return {
    closestPoint: routePoints[closestIndex],
    index: closestIndex,
    distance: minDistance,
  };
}

/**
 * Calculate deviation from the recorded route
 * Returns deviation in meters and percentage
 */
export function calculateRouteDeviation(
  currentLocation: RoutePoint,
  recordedRoute: RecordedRoute
): { deviation: number; percentage: number; closestPointIndex: number } {
  const { distance, index } = findClosestPointOnRoute(
    currentLocation,
    recordedRoute.routePoints
  );

  const percentage = (distance / DEVIATION_THRESHOLD_METERS) * 100;

  return {
    deviation: distance,
    percentage: Math.min(percentage, 100),
    closestPointIndex: index,
  };
}

/**
 * Determine severity of route deviation
 */
export function getDeviationSeverity(
  deviationMeters: number
): "minor" | "moderate" | "major" {
  if (deviationMeters < MINOR_DEVIATION_METERS) return "minor";
  if (deviationMeters < MAJOR_DEVIATION_METERS) return "moderate";
  return "major";
}

/**
 * Check if user is still progressing toward destination
 */
export function isMovingTowardDestination(
  currentLocation: RoutePoint,
  previousLocation: RoutePoint,
  destination: { latitude: number; longitude: number }
): boolean {
  const currentDist = haversineDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    destination.latitude,
    destination.longitude
  );

  const previousDist = haversineDistance(
    previousLocation.latitude,
    previousLocation.longitude,
    destination.latitude,
    destination.longitude
  );

  // If current distance is less than previous, user is moving closer
  return currentDist < previousDist;
}

/**
 * Calculate estimated time to destination based on current speed and distance
 */
export function estimateTimeToDestination(
  currentLocation: RoutePoint,
  destination: { latitude: number; longitude: number },
  averageSpeed: number | null = null
): number | null {
  const remaining = haversineDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    destination.latitude,
    destination.longitude
  );

  const speed = averageSpeed || currentLocation.speed || 10; // Default 10 m/s if no speed data

  if (speed <= 0) return null;

  return (remaining / speed) * 1000; // Return in milliseconds
}

/**
 * Compare current path with recorded route and calculate match percentage
 * Uses dynamic time warping-like algorithm for flexibility
 */
export function calculateRouteMatchPercentage(
  currentPoints: RoutePoint[],
  recordedRoute: RecordedRoute
): number {
  if (currentPoints.length === 0) return 0;
  if (recordedRoute.routePoints.length < MIN_POINTS_FOR_ROUTE) return 0;

  let matchingPoints = 0;
  const threshold = DEVIATION_THRESHOLD_METERS;

  // Check how many current points are close to recorded route
  currentPoints.forEach((currentPoint) => {
    const { distance } = findClosestPointOnRoute(
      currentPoint,
      recordedRoute.routePoints
    );

    if (distance <= threshold) {
      matchingPoints++;
    }
  });

  return (matchingPoints / currentPoints.length) * 100;
}

/**
 * Create a new recorded route from collected points
 */
export function createRecordedRoute(
  kidId: string,
  destinationId: string,
  destinationName: string,
  points: RoutePoint[],
  dayOfWeek: number
): RecordedRoute {
  const distance = calculateRouteTotalDistance(points);
  const duration = calculateRouteDuration(points);
  const avgSpeed = duration > 0 ? distance / (duration / 1000) : 0;

  return {
    id: `route_${kidId}_${destinationId}_${Date.now()}`,
    kidId,
    destinationId,
    destinationName,
    routePoints: points,
    distance,
    duration,
    dayOfWeek,
    recordedAt: new Date(),
    isActive: true,
    avgSpeed,
    polylineEncoded: encodePolyline(points),
    confidence: calculateRouteConfidence(points),
  };
}

/**
 * Calculate confidence score for a route (0-1)
 * Based on consistency and data quality.
 */
export function calculateRouteConfidence(points: RoutePoint[]): number {
  if (points.length < MIN_POINTS_FOR_ROUTE) return 0;

  // Check for consistent intervals
  let intervalConsistency = 0;
  if (points.length > 1) {
    const intervals: number[] = [];
    for (let i = 1; i < points.length; i++) {
      intervals.push(
        points[i].timestamp.getTime() - points[i - 1].timestamp.getTime()
      );
    }

    const avgInterval =
      intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, interval) => {
        return sum + Math.pow(interval - avgInterval, 2);
      }, 0) / intervals.length;

    const stdDev = Math.sqrt(variance);
    intervalConsistency = Math.max(
      0,
      1 - stdDev / avgInterval
    );
  }

  // Check for accuracy (GPS precision)
  const avgAccuracy =
    points.reduce((sum, p) => sum + (p.accuracy || 10), 0) / points.length;
  const accuracyScore = Math.max(0, 1 - avgAccuracy / 50); // 50m = 0 confidence

  // Check for speed consistency
  let speedConsistency = 0.8; // Default good
  const speeds = points
    .filter((p) => p.speed !== undefined)
    .map((p) => p.speed!);
  if (speeds.length > 2) {
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const speedVariance =
      speeds.reduce((sum, speed) => sum + Math.pow(speed - avgSpeed, 2), 0) /
      speeds.length;
    const speedStdDev = Math.sqrt(speedVariance);
    speedConsistency = Math.max(0, 1 - speedStdDev / (avgSpeed + 0.1));
  }

  // Weighted average
  return (
    intervalConsistency * 0.3 +
    accuracyScore * 0.4 +
    speedConsistency * 0.3
  );
}

/**
 * Get statistics for a kid's routes to a destination
 */
export function calculateRouteStatistics(
  routes: RecordedRoute[]
): RouteStatistics | null {
  if (routes.length === 0) return null;

  const kidId = routes[0].kidId;
  const destinationId = routes[0].destinationId;

  const distances = routes.map((r) => r.distance);
  const durations = routes.map((r) => r.duration);
  const daysOfWeek = routes.map((r) => r.dayOfWeek);

  const avgDistance =
    distances.reduce((a, b) => a + b, 0) / distances.length;
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

  // Most common day
  const dayFrequency: Record<number, number> = {};
  daysOfWeek.forEach((day) => {
    dayFrequency[day] = (dayFrequency[day] || 0) + 1;
  });
  const mostCommonDayOfWeek = Object.keys(dayFrequency).reduce((a, b) =>
    dayFrequency[parseInt(b)] > dayFrequency[parseInt(a)] ? b : a
  );

  return {
    kidId,
    destinationId,
    totalRoutes: routes.length,
    avgDistance,
    avgDuration,
    mostCommonDayOfWeek: parseInt(mostCommonDayOfWeek as any),
    deviationRate: 0.2, // This would come from deviation data
    lastRoute: routes[routes.length - 1] || null,
  };
}

/**
 * Check if a point sequence suggests the user took an alternate route
 * but is still moving toward the destination
 */
export function suggestRouteRecalculation(
  multipleDeviations: RouteDeviation[],
  currentLocation: RoutePoint,
  destination: { latitude: number; longitude: number }
): boolean {
  // If > 30% of recent points deviate, suggest reroute
  if (multipleDeviations.length === 0) return false;

  const majorDeviations = multipleDeviations.filter(
    (d) => d.severity === "major"
  ).length;
  const deviationRate = majorDeviations / multipleDeviations.length;

  // Still moving toward destination despite deviations
  const distanceToDestination = haversineDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    destination.latitude,
    destination.longitude
  );

  return deviationRate > 0.3 && distanceToDestination < 10000; // Suggest if within 10km
}
