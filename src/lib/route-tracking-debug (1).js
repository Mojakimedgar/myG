/**
 * Development utilities and helpers for route tracking
 * Use these for testing, debugging, and development purposes
 */
import { calculateRouteTotalDistance, calculateRouteDuration, calculateRouteConfidence, } from "./route-tracking";
/**
 * Generate mock route points for testing
 * Creates a realistic path between two coordinates
 */
export function generateMockRoutePath(startLat, startLon, endLat, endLon, pointCount = 30, intervalMs = 30000) {
    const points = [];
    const latDiff = endLat - startLat;
    const lonDiff = endLon - startLon;
    for (let i = 0; i < pointCount; i++) {
        const progress = i / (pointCount - 1);
        const lat = startLat + latDiff * progress;
        const lon = startLon + lonDiff * progress;
        // Add some realistic variation
        const variation = 0.0001 * Math.sin(i);
        points.push({
            latitude: lat + variation,
            longitude: lon + variation,
            timestamp: new Date(Date.now() + i * intervalMs),
            speed: 10 + Math.random() * 5, // 10-15 m/s
            accuracy: 8 + Math.random() * 4, // 8-12 meters
        });
    }
    return points;
}
/**
 * Create a mock recorded route for testing
 */
export function createMockRecordedRoute(kidId, destinationId, destinationName, startLat, startLon, endLat, endLon) {
    const routePoints = generateMockRoutePath(startLat, startLon, endLat, endLon, 25);
    const distance = calculateRouteTotalDistance(routePoints);
    const duration = calculateRouteDuration(routePoints);
    const avgSpeed = duration > 0 ? distance / (duration / 1000) : 0;
    const confidence = calculateRouteConfidence(routePoints);
    const now = new Date();
    return {
        id: `mock_route_${kidId}_${duration}`,
        kidId,
        destinationId,
        destinationName,
        routePoints,
        distance,
        duration,
        dayOfWeek: now.getDay(),
        recordedAt: now,
        isActive: true,
        avgSpeed,
        confidence,
        polylineEncoded: "",
    };
}
/**
 * Create a deviated path - useful for testing deviation detection
 */
export function generateDeviatedRoutePath(normalRoutePath, deviationPercentage = 50, maxDeviationMeters = 300) {
    if (normalRoutePath.length === 0)
        return [];
    const deviatedPoints = normalRoutePath.map((point, index) => {
        // Apply deviation to 50% of points
        if (Math.random() > deviationPercentage / 100) {
            return point;
        }
        // Add random offset to make it deviate
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * maxDeviationMeters;
        // Rough conversion: 1 degree lat/lon ≈ 111 km
        const latOffset = (distance / 111000) * Math.cos(angle);
        const lonOffset = (distance / 111000) * Math.sin(angle);
        return {
            ...point,
            latitude: point.latitude + latOffset,
            longitude: point.longitude + lonOffset,
        };
    });
    return deviatedPoints;
}
/**
 * Helper to test route matching
 */
export function testRouteMatching(currentPath, recordedRoute) {
    const { calculateRouteMatchPercentage } = require("./route-tracking");
    const { findClosestPointOnRoute } = require("./route-tracking");
    let totalDistance = 0;
    let matchingPoints = 0;
    currentPath.forEach((point) => {
        const { distance } = findClosestPointOnRoute(point, recordedRoute.routePoints);
        totalDistance += distance;
        if (distance < 200) {
            matchingPoints++;
        }
    });
    const avgDistance = totalDistance / currentPath.length;
    const matchPercentage = calculateRouteMatchPercentage(currentPath, recordedRoute);
    return {
        matchPercentage,
        closestDistance: avgDistance,
    };
}
/**
 * Log route information for debugging
 */
export function logRouteInfo(route) {
    console.group(`📍 Route: ${route.destinationName}`);
    console.log("ID:", route.id);
    console.log("Kid ID:", route.kidId);
    console.log("Points:", route.routePoints.length);
    console.log("Distance:", (route.distance / 1000).toFixed(2), "km");
    console.log("Duration:", Math.round(route.duration / 60000), "minutes");
    console.log("Avg Speed:", route.avgSpeed ? (route.avgSpeed * 3.6).toFixed(1) : "N/A", "km/h");
    console.log("Confidence:", route.confidence ? (route.confidence * 100).toFixed(1) : "N/A", "%");
    console.log("Day:", ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][route.dayOfWeek]);
    console.groupEnd();
}
/**
 * Log deviation information
 */
export function logDeviationInfo(deviation) {
    console.group(`⚠️ Deviation: ${deviation.severity}`);
    console.log("ID:", deviation.id);
    console.log("Distance Off Route:", Math.round(deviation.deviationDistance), "m");
    console.log("Percentage:", deviation.deviationPercentage.toFixed(1), "%");
    console.log("Severity:", deviation.severity);
    console.log("Timestamp:", deviation.timestamp.toLocaleString());
    console.log("Resolved:", deviation.isResolved);
    console.groupEnd();
}
/**
 * Compare two routes statistically
 */
export function compareRoutes(route1, route2) {
    const distDiff = Math.abs(route1.distance - route2.distance);
    const durationDiff = Math.abs(route1.duration - route2.duration);
    console.group("📊 Route Comparison");
    console.log(route1.destinationName);
    console.group("Distance");
    console.log("Route 1:", (route1.distance / 1000).toFixed(2), "km");
    console.log("Route 2:", (route2.distance / 1000).toFixed(2), "km");
    console.log("Difference:", (distDiff / 1000).toFixed(2), "km");
    console.groupEnd();
    console.group("Duration");
    console.log("Route 1:", Math.round(route1.duration / 60000), "min");
    console.log("Route 2:", Math.round(route2.duration / 60000), "min");
    console.log("Difference:", Math.round(durationDiff / 60000), "min");
    console.groupEnd();
    console.group("Speed");
    console.log("Route 1:", route1.avgSpeed ? (route1.avgSpeed * 3.6).toFixed(1) : "N/A", "km/h");
    console.log("Route 2:", route2.avgSpeed ? (route2.avgSpeed * 3.6).toFixed(1) : "N/A", "km/h");
    console.groupEnd();
    console.groupEnd();
}
/**
 * Calculate statistics for a set of routes
 */
export function analyzeRoutes(routes) {
    if (routes.length === 0) {
        return {
            count: 0,
            avgDistance: 0,
            avgDuration: 0,
            minDistance: 0,
            maxDistance: 0,
            minDuration: 0,
            maxDuration: 0,
            avgConfidence: 0,
        };
    }
    const distances = routes.map((r) => r.distance);
    const durations = routes.map((r) => r.duration);
    const confidences = routes.map((r) => r.confidence || 0);
    return {
        count: routes.length,
        avgDistance: distances.reduce((a, b) => a + b, 0) / distances.length,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDistance: Math.min(...distances),
        maxDistance: Math.max(...distances),
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        avgConfidence: confidences.reduce((a, b) => a + b, 0) / confidences.length,
    };
}
/**
 * Export route to JSON for sharing/backup
 */
export function exportRouteAsJSON(route) {
    return JSON.stringify({
        ...route,
        recordedAt: route.recordedAt.toISOString(),
        routePoints: route.routePoints.map((p) => ({
            ...p,
            timestamp: p.timestamp.toISOString(),
        })),
    }, null, 2);
}
/**
 * Generate a simple text report of a route
 */
export function generateRouteReport(route) {
    const lines = [
        "═".repeat(50),
        `ROUTE REPORT: ${route.destinationName}`,
        "═".repeat(50),
        "",
        `Route ID: ${route.id}`,
        `Recorded: ${route.recordedAt.toLocaleString()}`,
        `Day: ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][route.dayOfWeek]}`,
        "",
        "─ Distance & Time ─",
        `Distance: ${(route.distance / 1000).toFixed(2)} km`,
        `Duration: ${Math.round(route.duration / 60000)} minutes`,
        `Average Speed: ${route.avgSpeed ? (route.avgSpeed * 3.6).toFixed(1) : "N/A"} km/h`,
        "",
        "─ Quality Metrics ─",
        `Points Collected: ${route.routePoints.length}`,
        `Confidence: ${route.confidence ? (route.confidence * 100).toFixed(1) : "N/A"}%`,
        `GPS Accuracy: ${route.routePoints[0]?.accuracy?.toFixed(1) || "N/A"} m`,
        "",
        "─ Start & End ─",
        `Start: (${route.routePoints[0]?.latitude.toFixed(5)}, ${route.routePoints[0]?.longitude.toFixed(5)})`,
        `End: (${route.routePoints[route.routePoints.length - 1]?.latitude.toFixed(5)}, ${route.routePoints[route.routePoints.length - 1]?.longitude.toFixed(5)})`,
        "",
        "═".repeat(50),
    ];
    return lines.join("\n");
}
/**
 * Console helper for development
 * Call this in the browser console to enable debugging
 */
export function enableRouteTrackingDebug() {
    console.log("%c🚀 Route Tracking Debug Mode Enabled", "font-size: 16px; font-weight: bold; color: #4CAF50;");
    console.log("Available utilities: generateMockRoutePath, createMockRecordedRoute, logRouteInfo, etc.");
    // Make utilities globally available in dev
    if (typeof window !== "undefined") {
        window.__routeTrackingDebug = {
            generateMockRoutePath,
            createMockRecordedRoute,
            generateDeviatedRoutePath,
            testRouteMatching,
            logRouteInfo,
            logDeviationInfo,
            compareRoutes,
            analyzeRoutes,
            exportRouteAsJSON,
            generateRouteReport,
        };
        console.log("Access via window.__routeTrackingDebug");
    }
}
/**
 * Quick test: Create sample routes and run analysis
 */
export function runQuickTest() {
    console.log("%c Running Route Tracking Tests...", "color: blue; font-weight: bold;");
    try {
        // Create 2 sample routes
        const route1 = createMockRecordedRoute("test_kid_1", "test_zone_1", "Test School", 40.7128, -74.006, 40.758, -73.9855);
        const route2 = createMockRecordedRoute("test_kid_1", "test_zone_1", "Test School", 40.7128, -74.006, 40.758, -73.9855);
        console.log("✓ Created mock routes");
        logRouteInfo(route1);
        logRouteInfo(route2);
        compareRoutes(route1, route2);
        const analysis = analyzeRoutes([route1, route2]);
        console.table(analysis);
        // Test deviation detection
        const deviatedPath = generateDeviatedRoutePath(route1.routePoints, 30, 200);
        console.log("%c Tests Completed ✓", "color: green; font-weight: bold;");
    }
    catch (error) {
        console.error("Test failed:", error);
    }
}
// Export all for use in console
export const RouteTrackingDebugUtils = {
    generateMockRoutePath,
    createMockRecordedRoute,
    generateDeviatedRoutePath,
    testRouteMatching,
    logRouteInfo,
    logDeviationInfo,
    compareRoutes,
    analyzeRoutes,
    exportRouteAsJSON,
    generateRouteReport,
    enableRouteTrackingDebug,
    runQuickTest,
};
