import { Kid } from "@/types/kids";
import { Zone } from "@/types/zone";

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

/**
 * Check if a kid's location is within a zone
 * Takes into account both the kid's radius and the zone's radius
 */
export function isKidInZone(kid: Kid, zone: Zone): boolean {
  // If either kid or zone doesn't have coordinates, can't determine
  if (
    typeof kid.latitude !== "number" ||
    typeof kid.longitude !== "number" ||
    typeof zone.latitude !== "number" ||
    typeof zone.longitude !== "number"
  ) {
    return false;
  }

  // Calculate distance between kid's location and zone's center
  const distance = calculateDistance(
    kid.latitude,
    kid.longitude,
    zone.latitude,
    zone.longitude
  );

  // Kid is in zone if the distance is less than the sum of both radii
  // (considering the kid's safe radius and the zone's radius)
  const kidRadius = kid.radius ?? 0;
  const zoneRadius = zone.radius ?? 0;
  const combinedRadius = kidRadius + zoneRadius;

  return distance <= combinedRadius;
}

/**
 * Get all zones a kid is currently in
 */
export function getKidZones(kid: Kid, zones: Zone[]): Zone[] {
  return zones.filter((zone) => isKidInZone(kid, zone));
}

/**
 * Calculate the status based on distance to zones
 * Returns: "safe" (in zone), "warning" (near zone), or "alert" (outside all zones)
 */
export function calculateKidStatus(kid: Kid, zones: Zone[]): "safe" | "warning" | "alert" {
  // Check if kid is in any zone
  const zoneCount = zones.filter((zone) => isKidInZone(kid, zone)).length;

  if (zoneCount > 0) {
    return "safe";
  }

  // If no coordinates, we can't determine proximity
  if (
    typeof kid.latitude !== "number" ||
    typeof kid.longitude !== "number"
  ) {
    return "alert";
  }

  // Check if kid is near any zone (within warning distance)
  const WARNING_DISTANCE_BUFFER = 500; // 500 meters warning buffer

  const isNearZone = zones.some((zone) => {
    if (
      typeof zone.latitude !== "number" ||
      typeof zone.longitude !== "number"
    ) {
      return false;
    }

    const distance = calculateDistance(
      kid.latitude,
      kid.longitude,
      zone.latitude,
      zone.longitude
    );

    const kidRadius = kid.radius ?? 0;
    const zoneRadius = zone.radius ?? 0;
    const combinedRadius = kidRadius + zoneRadius + WARNING_DISTANCE_BUFFER;

    return distance <= combinedRadius;
  });

  return isNearZone ? "warning" : "alert";
}

/**
 * Get zones count for a kid
 */
export function getKidZonesCount(kid: Kid, zones: Zone[]): number {
  return getKidZones(kid, zones).length;
}

/**
 * Get detailed zone detection info for a kid
 */
export interface ZoneDetectionInfo {
  status: "safe" | "warning" | "alert";
  zonesIn: Zone[];
  nearbyZones: Zone[];
  closestZone: Zone | null;
  closestDistance: number | null;
}

export function getZoneDetectionInfo(
  kid: Kid,
  zones: Zone[]
): ZoneDetectionInfo {
  // Get zones the kid is in
  const zonesIn = getKidZones(kid, zones);

  // Get nearby zones (within warning distance but not in zone)
  const WARNING_DISTANCE_BUFFER = 500; // 500 meters warning buffer
  const nearbyZones: Zone[] = [];
  let closestZone: Zone | null = null;
  let closestDistance: number | null = null;

  if (
    typeof kid.latitude === "number" &&
    typeof kid.longitude === "number"
  ) {
    zones.forEach((zone) => {
      if (
        typeof zone.latitude === "number" &&
        typeof zone.longitude === "number" &&
        !isKidInZone(kid, zone)
      ) {
        const distance = calculateDistance(
          kid.latitude,
          kid.longitude,
          zone.latitude,
          zone.longitude
        );

        const kidRadius = kid.radius ?? 0;
        const zoneRadius = zone.radius ?? 0;
        const combinedRadius = kidRadius + zoneRadius;

        if (distance > combinedRadius) {
          // Check if in warning range
          if (distance <= combinedRadius + WARNING_DISTANCE_BUFFER) {
            nearbyZones.push(zone);
          }

          // Track closest zone
          if (closestDistance === null || distance < closestDistance) {
            closestDistance = distance;
            closestZone = zone;
          }
        }
      }
    });
  }

  const status = calculateKidStatus(kid, zones);

  return {
    status,
    zonesIn,
    nearbyZones,
    closestZone,
    closestDistance,
  };
}
