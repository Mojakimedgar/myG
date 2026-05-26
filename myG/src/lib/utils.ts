import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// GEO/LOCATION UTILITIES
export function haversineDistanceMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
): number {
  const earthRadiusMeters = 6371000;
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const deltaLat = toRadians(latitudeB - latitudeA);
  const deltaLng = toRadians(longitudeB - longitudeA);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

export type GeofenceStatus = "inside" | "near" | "outside";

export function computeGeofenceStatus(
  kidLat?: number,
  kidLng?: number,
  zoneLat?: number,
  zoneLng?: number,
  radiusMeters?: number
): { status: GeofenceStatus; distance?: number } {
  if (
    typeof kidLat !== "number" ||
    typeof kidLng !== "number" ||
    typeof zoneLat !== "number" ||
    typeof zoneLng !== "number" ||
    typeof radiusMeters !== "number"
  ) {
    return { status: "outside" };
  }
  const distance = haversineDistanceMeters(kidLat, kidLng, zoneLat, zoneLng);
  if (distance <= radiusMeters) return { status: "inside", distance };
  if (distance <= radiusMeters * 1.15) return { status: "near", distance };
  return { status: "outside", distance };
}

export function statusFromGeofence(status: GeofenceStatus): "safe" | "warning" | "alert" {
  if (status === "inside") return "safe";
  if (status === "near") return "warning";
  return "alert";
}
