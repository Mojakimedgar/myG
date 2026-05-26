/**
 * Component to display and manage route deviations and alerts
 */

import React, { useEffect, useState } from "react";
import {
  RouteAlert,
  RouteDeviation,
  ActiveRoute,
} from "@/types/route";
import {
  getUnreadAlertsForTracker,
  markAlertAsRead,
  updateAlertAction,
  getActiveDeviations,
} from "@/lib/route-firestore";
import {
  AlertCircle,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

interface RouteAlertsPanelProps {
  trackerId: string;
  onAlertClick?: (alert: RouteAlert) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function RouteAlertsPanel({
  trackerId,
  onAlertClick,
  autoRefresh = true,
  refreshInterval = 5000,
}: RouteAlertsPanelProps) {
  const [alerts, setAlerts] = useState<RouteAlert[]>([]);
  const [deviations, setDeviations] = useState<Map<string, RouteDeviation>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<RouteAlert | null>(null);

  // Load alerts
  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true);
      try {
        const unreadAlerts = await getUnreadAlertsForTracker(trackerId);
        setAlerts(unreadAlerts);
      } catch (error) {
        console.error("Error loading alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();

    // Set up auto-refresh
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(loadAlerts, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [trackerId, autoRefresh, refreshInterval]);

  // Mark alert as read
  const handleAlertClick = async (alert: RouteAlert) => {
    setSelectedAlert(alert);
    try {
      await markAlertAsRead(alert.id);
      setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }

    onAlertClick?.(alert);
  };

  // Handle action on alert
  const handleAlertAction = async (
    alert: RouteAlert,
    action: "reroute" | "continue" | "investigate"
  ) => {
    try {
      await updateAlertAction(alert.id, action);

      const updatedAlert = { ...alert, action, actionedAt: new Date() };
      setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
      setSelectedAlert(updatedAlert);
    } catch (error) {
      console.error("Error updating alert action:", error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "minor":
        return "bg-yellow-50 border-yellow-200";
      case "moderate":
        return "bg-orange-50 border-orange-200";
      case "major":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "major":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "moderate":
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">Loading alerts...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Route Alerts</h2>
        <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium">
          {alerts.length} Active
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No active route alerts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${getSeverityColor(
                alert.severity
              )}`}
              onClick={() => handleAlertClick(alert)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getSeverityIcon(alert.severity)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                    <Clock className="w-3 h-3" />
                    {alert.timestamp.toLocaleString()}
                  </div>
                </div>

                {!alert.action && (
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Action needed
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {!alert.action && (
                <div className="flex gap-2 mt-4 ml-8">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAlertAction(alert, "continue");
                    }}
                    className="px-3 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                  >
                    No Action
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAlertAction(alert, "reroute");
                    }}
                    className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                  >
                    Reroute
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAlertAction(alert, "investigate");
                    }}
                    className="px-3 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  >
                    Investigate
                  </button>
                </div>
              )}

              {alert.action && (
                <div className="flex items-center gap-2 mt-3 ml-8 text-xs text-gray-600">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span>
                    Action taken: <strong>{alert.action}</strong>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Component showing active route tracking
 */
interface RouteTrackingViewProps {
  activeRoute: ActiveRoute | null;
  matchPercentage: number;
  estTimeRemaining: number | null;
  estDistance: number | null;
}

export function RouteTrackingView({
  activeRoute,
  matchPercentage,
  estTimeRemaining,
  estDistance,
}: RouteTrackingViewProps) {
  if (!activeRoute || !activeRoute.isActive) {
    return null;
  }

  const formatTime = (ms: number | null) => {
    if (!ms) return "—";
    const minutes = Math.round(ms / 60000);
    if (minutes < 1) return "< 1 min";
    return `${minutes} min`;
  };

  const formatDistance = (meters: number | null) => {
    if (!meters) return "—";
    if (meters > 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">
          Tracking route to {activeRoute.destinationName}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-blue-700">Route Match</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">
              {Math.round(matchPercentage)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${matchPercentage}%` }}
            />
          </div>
        </div>

        <div>
          <p className="text-xs text-blue-700">Est. Time to Destination</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatTime(estTimeRemaining)}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs text-blue-700">Distance to Destination</p>
        <p className="text-lg font-semibold text-blue-600">
          {formatDistance(estDistance)}
        </p>
      </div>

      {activeRoute.deviations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-3">
          <p className="text-xs font-semibold text-yellow-800">
            {activeRoute.deviations.length} deviation{
              activeRoute.deviations.length !== 1 ? "s" : ""
            } detected
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Component for starting/stopping route tracking
 */
interface RouteTrackingControlsProps {
  isTracking: boolean;
  destinationName: string | null;
  canStart: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function RouteTrackingControls({
  isTracking,
  destinationName,
  canStart,
  onStart,
  onStop,
}: RouteTrackingControlsProps) {
  return (
    <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg">
      <h3 className="font-semibold mb-3">Route Tracking</h3>

      {!isTracking ? (
        <button
          onClick={onStart}
          disabled={!canStart}
          className="w-full px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {destinationName
            ? `Start tracking to ${destinationName}`
            : "Select a destination to start tracking"}
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium">
              Tracking route to {destinationName}
            </span>
          </div>

          <button
            onClick={onStop}
            className="w-full px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
          >
            Stop tracking
          </button>
        </div>
      )}
    </div>
  );
}
