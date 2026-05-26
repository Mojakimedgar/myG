/**
 * Hook for tracking user routes in real-time
 * Monitors location, compares with recorded routes, and alerts on deviations
 */

import { useEffect, useRef, useState } from "react";
import {
  RoutePoint,
  RecordedRoute,
  RouteDeviation,
  ActiveRoute,
  RouteAlert,
} from "@/types/route";
import {
  calculateRouteDeviation,
  getDeviationSeverity,
  isMovingTowardDestination,
  estimateTimeToDestination,
  calculateRouteMatchPercentage,
  createRecordedRoute,
  findClosestPointOnRoute,
  haversineDistance,
} from "@/lib/route-tracking";
import {
  saveRecordedRoute,
  saveRouteDeviation,
  createRouteAlert,
  saveActiveRoute,
  updateActiveRoute,
  getRecordedRoutes,
} from "@/lib/route-firestore";
import { showNotification } from "@/lib/notifications";
import { isKidInZone, calculateDistance } from "@/lib/zone-detection";
import { Zone } from "@/types/zone";

interface UseRouteTrackingOptions {
  kidId: string;
  destinationId: string;
  destinationName: string;
  destinationCoord: { latitude: number; longitude: number };
  trackerId: string; // User ID of the tracker/parent
  zone?: Zone; // Current zone being tracked (for zone exit detection)
  recordingInterval?: number; // ms between location captures
  deviationThreshold?: number; // meters before alert
  autoRecord?: boolean; // Auto-record route after trip completes
  onDeviationDetected?: (deviation: RouteDeviation) => void;
  onRouteMatched?: (percentage: number) => void;
  onDestinationReached?: () => void;
  onZoneExit?: (distance: number) => void; // Callback when user leaves zone
}

interface RouteTrackingState {
  isTracking: boolean;
  currentPoints: RoutePoint[];
  matchedRoute: RecordedRoute | null;
  matchPercentage: number;
  activeRoute: ActiveRoute | null;
  currentDeviation: RouteDeviation | null;
  estTimeRemaining: number | null;
  estDistance: number | null;
  isInZone: boolean; // Track zone status
}

const DEFAULT_RECORDING_INTERVAL = 30000; // 30 seconds
const DEFAULT_DEVIATION_THRESHOLD = 200; // 200 meters
const DESTINATION_ARRIVAL_THRESHOLD = 100; // 100 meters

export function useRouteTracking(
  options: UseRouteTrackingOptions
): RouteTrackingState & {
  startTracking: () => void;
  stopTracking: () => Promise<void>;
  recordRoute: () => void;
} {
  const {
    kidId,
    destinationId,
    destinationName,
    destinationCoord,
    trackerId,
    zone,
    recordingInterval = DEFAULT_RECORDING_INTERVAL,
    deviationThreshold = DEFAULT_DEVIATION_THRESHOLD,
    autoRecord = true,
    onDeviationDetected,
    onRouteMatched,
    onDestinationReached,
    onZoneExit,
  } = options;

  const destinationRef = useRef({
    destinationId,
    destinationName,
    destinationCoord,
    zone,
  });

  useEffect(() => {
    destinationRef.current = {
      destinationId,
      destinationName,
      destinationCoord,
      zone,
    };
  }, [destinationId, destinationName, destinationCoord, zone]);

  const [state, setState] = useState<RouteTrackingState>({
    isTracking: false,
    currentPoints: [],
    matchedRoute: null,
    matchPercentage: 0,
    activeRoute: null,
    currentDeviation: null,
    estTimeRemaining: null,
    estDistance: null,
    isInZone: zone ? true : false, // Start assuming in zone
  });

  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<RoutePoint | null>(null);
  const deviationCounterRef = useRef(0);
  const recordedRoutesRef = useRef<RecordedRoute[]>([]);
  const activeRouteIdRef = useRef<string | null>(null);
  const zoneExitAlertedRef = useRef(false); // Track if we've already sent zone exit alert

  /**
   * Process location update
   */
  const handleLocationUpdate = async (location: GeolocationPosition) => {
    const {
      destinationCoord: destCoord,
      destinationId: destId,
      destinationName: destName,
      zone: activeZone,
    } = destinationRef.current;

    const currentPoint: RoutePoint = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: new Date(),
      speed: location.coords.speed || undefined,
      accuracy: location.coords.accuracy || undefined,
    };

    // Update current points
    setState((prev) => ({
      ...prev,
      currentPoints: [...prev.currentPoints, currentPoint],
    }));

    // ============ ZONE EXIT DETECTION ============
    if (activeZone) {
      const isCurrentlyInZone =
        calculateDistance(
          currentPoint.latitude,
          currentPoint.longitude,
          activeZone.latitude,
          activeZone.longitude
        ) <=
        (activeZone.radius || 0);

      // Check if exited zone
      if (state.isInZone && !isCurrentlyInZone && !zoneExitAlertedRef.current) {
        zoneExitAlertedRef.current = true;

        const distanceFromZone = calculateDistance(
          currentPoint.latitude,
          currentPoint.longitude,
          activeZone.latitude,
          activeZone.longitude
        );

        // Create zone exit alert
        const alert: RouteAlert = {
          id: `alert_zone_exit_${kidId}_${Date.now()}`,
          kidId,
          trackerId,
          routeId: "",
          deviationId: "",
          message: `🚨 Zone Exit Alert: User has left ${activeZone.name}. Currently ${Math.round(distanceFromZone)}m away.`,
          severity: "major",
          timestamp: new Date(),
          read: false,
        };

        try {
          await createRouteAlert(alert);

          await showNotification({
            title: `🚨 Zone Exit Alert`,
            body: `User has left ${activeZone.name}`,
            tag: `zone-exit-${kidId}`,
            requireInteraction: true,
          });

          onZoneExit?.(distanceFromZone);
        } catch (error) {
          console.error("Error creating zone exit alert:", error);
        }
      }

      // Reset alert flag when user re-enters zone
      if (!state.isInZone && isCurrentlyInZone) {
        zoneExitAlertedRef.current = false;
      }

      // Update zone status
      setState((prev) => ({
        ...prev,
        isInZone: isCurrentlyInZone,
      }));
    }

    // Check distance to destination
    const distToDestination = haversineDistance(
      currentPoint.latitude,
      currentPoint.longitude,
      destCoord.latitude,
      destCoord.longitude
    );

    const estDistance = distToDestination;
    const estTimeRemaining = estimateTimeToDestination(
      currentPoint,
      destCoord,
      10
    );

    // Check if reached destination
    if (distToDestination < DESTINATION_ARRIVAL_THRESHOLD) {
      await stopTracking();
      if (autoRecord) recordRoute();
      onDestinationReached?.();
      return;
    }

    // Find best matching recorded route
    try {
      const recordedRoutes = await getRecordedRoutes(kidId, destId);
      recordedRoutesRef.current = recordedRoutes;

      if (recordedRoutes.length > 0) {
        // Find the route that best matches current path
        let bestMatch = recordedRoutes[0];
        let bestMatchPercentage = 0;

        recordedRoutes.forEach((route) => {
          const matchPercentage = calculateRouteMatchPercentage(
            state.currentPoints,
            route
          );
          if (matchPercentage > bestMatchPercentage) {
            bestMatchPercentage = matchPercentage;
            bestMatch = route;
          }
        });

        // Update state with match info
        setState((prev) => ({
          ...prev,
          matchedRoute: bestMatch,
          matchPercentage: bestMatchPercentage,
          estTimeRemaining,
          estDistance,
        }));

        onRouteMatched?.(bestMatchPercentage);

        // Check for deviations
        const { deviation, severity } = (() => {
          const dev = calculateRouteDeviation(currentPoint, bestMatch);
          return {
            deviation: dev.deviation,
            severity: getDeviationSeverity(dev.deviation),
          };
        })();

        // If deviation is significant, create alert
        if (deviation > deviationThreshold && severity !== "minor") {
          deviationCounterRef.current++;

          const routeDeviation: RouteDeviation = {
            id: `deviation_${kidId}_${Date.now()}`,
            kidId,
            recordedRouteId: bestMatch.id,
            destinationId: destId,
            currentLocation: currentPoint,
            deviationDistance: deviation,
            deviationPercentage: (deviation / deviationThreshold) * 100,
            timestamp: new Date(),
            severity,
            isResolved: false,
            notificationSent: false,
          };

          // Save deviation
          try {
            const deviationId = await saveRouteDeviation(routeDeviation);
            routeDeviation.id = deviationId;

            // Check if still moving toward destination
            if (
              lastLocationRef.current &&
              isMovingTowardDestination(
                currentPoint,
                lastLocationRef.current,
                destCoord
              )
            ) {
              // Create alert
              const alert: RouteAlert = {
                id: `alert_${kidId}_${Date.now()}`,
                kidId,
                trackerId,
                routeId: "",
                deviationId,
                message: `Route deviation detected: User is ${Math.round(deviation)}m off the usual route to ${destName}, but still moving toward destination.`,
                severity,
                timestamp: new Date(),
                read: false,
              };

              await createRouteAlert(alert);

              // Show notification
              await showNotification({
                title: `Route Deviation - ${destName}`,
                body: `Deviated by ${Math.round(deviation)}m but moving toward destination`,
                tag: `route-deviation-${kidId}`,
              });
            } else if (lastLocationRef.current) {
              // User not moving toward destination - major alert
              const alert: RouteAlert = {
                id: `alert_${kidId}_${Date.now()}`,
                trackerId,
                kidId,
                routeId: "",
                deviationId,
                message: `⚠️ SIGNIFICANT Route Deviation: User is ${Math.round(deviation)}m off route and NOT moving toward ${destName}. Immediate attention required.`,
                severity: "major",
                timestamp: new Date(),
                read: false,
              };

              await createRouteAlert(alert);

              await showNotification({
                title: `⚠️ Major Route Deviation`,
                body: `User off route to ${destName} and not moving toward destination`,
                tag: `route-deviation-major-${kidId}`,
                requireInteraction: true,
              });
            }

            setState((prev) => ({
              ...prev,
              currentDeviation: routeDeviation,
            }));

            onDeviationDetected?.(routeDeviation);
          } catch (error) {
            console.error("Error saving route deviation:", error);
          }
        } else {
          deviationCounterRef.current = 0;
        }
      }
    } catch (error) {
      console.error("Error checking route match:", error);
    }

    lastLocationRef.current = currentPoint;
  };

  /**
   * Handle geolocation errors
   */
  const handleLocationError = (error: GeolocationPositionError) => {
    console.error("Geolocation error:", error);

    if (error.code === 1) {
      // Permission denied
      showNotification({
        title: "Location Permission",
        body: "Location permission is required for route tracking",
      });
    }
  };

  /**
   * Start tracking the route
   */
  const startTracking = async () => {
    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      return;
    }

    const { destinationId: destId, destinationName: destName, destinationCoord: destCoord, zone: activeZone } =
      destinationRef.current;

    // Reset state
    zoneExitAlertedRef.current = false; // Reset zone exit alert
    setState((prev) => ({
      ...prev,
      isTracking: true,
      currentPoints: [],
      isInZone: activeZone ? true : false, // Reset zone status
    }));

    // Load recorded routes
    try {
      const routes = await getRecordedRoutes(kidId, destId);
      recordedRoutesRef.current = routes;
    } catch (error) {
      console.error("Error loading recorded routes:", error);
    }

    // Request current location
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const startPoint: RoutePoint = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date(),
          speed: position.coords.speed || undefined,
          accuracy: position.coords.accuracy || undefined,
        };

        lastLocationRef.current = startPoint;

        // Create active route
        const newActiveRoute: ActiveRoute = {
          id: `active_route_${kidId}_${Date.now()}`,
          kidId,
          destinationId: destId,
          destinationName: destName,
          destinationCoord: destCoord,
          startTime: new Date(),
          startLocation: startPoint,
          currentLocation: startPoint,
          matchPercentage: 0,
          deviations: [],
          isActive: true,
        };

        try {
          const activeRouteId = await saveActiveRoute(newActiveRoute);
          activeRouteIdRef.current = activeRouteId;
          newActiveRoute.id = activeRouteId;

          setState((prev) => ({
            ...prev,
            currentPoints: [startPoint],
            activeRoute: newActiveRoute,
          }));
        } catch (error) {
          console.error("Error creating active route:", error);
        }

        // Start watching location
        watchIdRef.current = navigator.geolocation.watchPosition(
          handleLocationUpdate,
          handleLocationError,
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 30000,
          }
        );
      },
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  /**
   * Stop tracking
   */
  const stopTracking = async (): Promise<void> => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isTracking: false,
    }));

    // Mark active route as completed
    if (activeRouteIdRef.current) {
      try {
        await updateActiveRoute(activeRouteIdRef.current, {
          isActive: false,
          completedAt: new Date(),
        });
      } catch (error) {
        console.error("Error updating active route:", error);
      }
      activeRouteIdRef.current = null;
    }
  };

  /**
   * Record the trip as a new route pattern
   */
  const recordRoute = async () => {
    const { destinationId: destId, destinationName: destName } = destinationRef.current;

    if (state.currentPoints.length < 10) {
      console.warn(
        "Not enough points to create a recorded route (minimum 10)"
      );
      return;
    }

    const now = new Date();
    const dayOfWeek = now.getDay();

    const route = createRecordedRoute(
      kidId,
      destId,
      destName,
      state.currentPoints,
      dayOfWeek
    );

    try {
      const routeId = await saveRecordedRoute(route);
      route.id = routeId;

      await showNotification({
        title: "Route Recorded",
        body: `Successfully recorded route to ${destName}`,
      });

      // Update state with new recorded route
      recordedRoutesRef.current = [...recordedRoutesRef.current, route];
    } catch (error) {
      console.error("Error recording route:", error);

      await showNotification({
        title: "Route Recording Failed",
        body: "Failed to save route pattern",
      });
    }
  };

  return {
    ...state,
    startTracking,
    stopTracking,
    recordRoute,
  };
}
