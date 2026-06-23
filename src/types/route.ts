/**
 * Route tracking types for daily commute tracking
 * Tracks user routes to specific destinations and alerts on deviations
 */

export interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed?: number; // meters per second
  accuracy?: number; // GPS accuracy in meters
}

export interface RecordedRoute {
  id: string;
  kidId: string;
  destinationId: string; // Zone ID (e.g., school, work)
  destinationName: string;
  routePoints: RoutePoint[];
  distance: number; // Total distance in meters
  duration: number; // Total duration in milliseconds
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  recordedAt: Date;
  isActive: boolean;
  avgSpeed?: number; // Average speed in m/s
  // Metadata for improved tracking
  polylineEncoded?: string; // Compressed polyline for efficient storage
  confidence?: number; // 0-1, how confident this is a regular route
}

export interface RouteDeviation {
  id: string;
  kidId: string;
  recordedRouteId: string;
  destinationId: string;
  currentLocation: RoutePoint;
  deviationDistance: number; // Distance from expected route in meters
  deviationPercentage: number; // Percentage deviation (0-100)
  timestamp: Date;
  severity: "minor" | "moderate" | "major"; // Based on deviation distance
  isResolved: boolean;
  resolvedAt?: Date;
  notificationSent: boolean;
}

export interface ActiveRoute {
  id: string;
  kidId: string;
  destinationId: string;
  destinationName: string;
  destinationCoord: { latitude: number; longitude: number };
  startTime: Date;
  startLocation: RoutePoint;
  currentLocation: RoutePoint;
  recordedRouteId?: string; // Which recorded route this matches
  matchPercentage: number; // How closely it matches recorded route (0-100)
  estTimeRemaining?: number; // Estimated time in milliseconds
  estDistance?: number; // Estimated distance to destination in meters
  deviations: RouteDeviation[];
  isActive: boolean;
  completedAt?: Date;
}

export interface RouteStatistics {
  kidId: string;
  destinationId: string;
  totalRoutes: number;
  avgDistance: number;
  avgDuration: number;
  mostCommonDayOfWeek: number;
  deviationRate: number; // Percentage of trips with deviations
  lastRoute: RecordedRoute | null;
}

export interface RouteAlert {
  id: string;
  kidId: string;
  trackerId: string; // User ID of the tracker/parent
  routeId: string;
  deviationId: string;
  message: string;
  severity: "minor" | "moderate" | "major";
  timestamp: Date;
  read: boolean;
  action?: "reroute" | "continue" | "investigate";
  actionedAt?: Date;
}
