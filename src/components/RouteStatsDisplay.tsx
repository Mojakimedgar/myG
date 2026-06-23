/**
 * Route tracking management component
 * Displays recorded routes, statistics, and allows managing active tracking
 */

import React, { useEffect, useState } from "react";
import { RecordedRoute, RouteStatistics } from "@/types/route";
import {
  getRecordedRoutes,
  getRoutesByDayOfWeek,
  getMostConfidentRoute,
} from "@/lib/route-firestore";
import { calculateRouteStatistics } from "@/lib/route-tracking";
import { MapPin, Calendar, Clock, Gauge, TrendingUp } from "lucide-react";

interface RouteStatsDisplayProps {
  kidId: string;
  destinationId: string;
  destinationName: string;
}

export function RouteStatsDisplay({
  kidId,
  destinationId,
  destinationName,
}: RouteStatsDisplayProps) {
  const [routes, setRoutes] = useState<RecordedRoute[]>([]);
  const [statistics, setStatistics] = useState<RouteStatistics | null>(null);
  const [mostConfidentRoute, setMostConfidentRoute] =
    useState<RecordedRoute | null>(null);
  const [loading, setLoading] = useState(false);

  const dayOfWeekNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const recordedRoutes = await getRecordedRoutes(kidId, destinationId);
        setRoutes(recordedRoutes);

        if (recordedRoutes.length > 0) {
          const stats = calculateRouteStatistics(recordedRoutes);
          setStatistics(stats);
        }

        const confident = await getMostConfidentRoute(kidId, destinationId);
        setMostConfidentRoute(confident);
      } catch (error) {
        console.error("Error loading route data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [kidId, destinationId]);

  const formatDistance = (meters: number) => {
    if (meters > 1000) return `${(meters / 1000).toFixed(2)} km`;
    return `${Math.round(meters)} m`;
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.round(ms / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading routes...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Route to {destinationName}
        </h2>
        <p className="text-gray-600 mt-1">
          {routes.length} recorded route{routes.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Avg Distance
                </p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {formatDistance(statistics.avgDistance)}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Avg Duration
                </p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {formatDuration(statistics.avgDuration)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Typical Day
                </p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {dayOfWeekNames[statistics.mostCommonDayOfWeek]}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Deviations
                </p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {(statistics.deviationRate * 100).toFixed(0)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500 opacity-20" />
            </div>
          </div>
        </div>
      )}

      {/* Most Confident Route */}
      {mostConfidentRoute && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">
                Most Confident Route
              </h3>
              <p className="text-sm text-blue-700 mt-2">
                {formatDistance(mostConfidentRoute.distance)} •{" "}
                {formatDuration(mostConfidentRoute.duration)} •{" "}
                {(mostConfidentRoute.confidence! * 100).toFixed(0)}% confidence
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Recorded on{" "}
                {mostConfidentRoute.recordedAt.toLocaleDateString()}
              </p>
            </div>
            <Gauge className="w-8 h-8 text-blue-500 flex-shrink-0" />
          </div>
        </div>
      )}

      {/* All Routes List */}
      {routes.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            Recorded Routes
          </h3>
          <div className="space-y-2">
            {routes.map((route, index) => (
              <div
                key={route.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">
                        Route {routes.length - index}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {dayOfWeekNames[route.dayOfWeek]}
                      </span>
                      {route.confidence && route.confidence > 0.8 && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                          ✓ Confident
                        </span>
                      )}
                    </div>

                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {formatDistance(route.distance)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(route.duration)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Gauge className="w-4 h-4" />
                        {route.routePoints.length} points
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      {route.recordedAt.toLocaleString()}
                    </p>
                  </div>

                  {route.avgSpeed && (
                    <div className="text-right ml-4">
                      <p className="text-xs text-gray-600">Avg Speed</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {(route.avgSpeed * 3.6).toFixed(1)} km/h
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {routes.length === 0 && !loading && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">No routes recorded yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Start tracking a trip to {destinationName} to record route patterns
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Component to show routes by day of week
 */
interface RoutesGroupedByDayProps {
  kidId: string;
  destinationId: string;
  destinationName: string;
}

export function RoutesGroupedByDay({
  kidId,
  destinationId,
  destinationName,
}: RoutesGroupedByDayProps) {
  const [routesByDay, setRoutesByDay] = useState<
    Record<number, RecordedRoute[]>
  >({});
  const [loading, setLoading] = useState(false);

  const dayOfWeekNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  useEffect(() => {
    const loadRoutes = async () => {
      setLoading(true);
      try {
        const routes = await getRecordedRoutes(kidId, destinationId);

        // Group by day of week
        const grouped: Record<number, RecordedRoute[]> = {};
        routes.forEach((route) => {
          if (!grouped[route.dayOfWeek]) {
            grouped[route.dayOfWeek] = [];
          }
          grouped[route.dayOfWeek].push(route);
        });

        setRoutesByDay(grouped);
      } catch (error) {
        console.error("Error loading routes:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRoutes();
  }, [kidId, destinationId]);

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {dayOfWeekNames.map((day, dayIndex) => {
        const dayRoutes = routesByDay[dayIndex] || [];

        return (
          <div key={dayIndex} className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              {day}
              <span className="ml-2 text-sm font-normal text-gray-600">
                ({dayRoutes.length} route{dayRoutes.length !== 1 ? "s" : ""})
              </span>
            </h3>

            {dayRoutes.length > 0 ? (
              <div className="space-y-2">
                {dayRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="text-sm bg-gray-50 p-3 rounded flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {(route.distance / 1000).toFixed(2)} km in{" "}
                        {Math.round(route.duration / 60000)} min
                      </p>
                      <p className="text-xs text-gray-500">
                        {route.recordedAt.toLocaleDateString()}
                      </p>
                    </div>
                    {route.confidence && (
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Confidence</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {(route.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No routes recorded for this day
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
