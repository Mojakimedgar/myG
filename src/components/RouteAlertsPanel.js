import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Component to display and manage route deviations and alerts
 */
import { useEffect, useState } from "react";
import { getUnreadAlertsForTracker, markAlertAsRead, updateAlertAction, } from "@/lib/route-firestore";
import { AlertCircle, MapPin, AlertTriangle, CheckCircle, Clock, } from "lucide-react";
export function RouteAlertsPanel({ trackerId, onAlertClick, autoRefresh = true, refreshInterval = 5000, }) {
    const [alerts, setAlerts] = useState([]);
    const [deviations, setDeviations] = useState(new Map());
    const [loading, setLoading] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState(null);
    // Load alerts
    useEffect(() => {
        const loadAlerts = async () => {
            setLoading(true);
            try {
                const unreadAlerts = await getUnreadAlertsForTracker(trackerId);
                setAlerts(unreadAlerts);
            }
            catch (error) {
                console.error("Error loading alerts:", error);
            }
            finally {
                setLoading(false);
            }
        };
        loadAlerts();
        // Set up auto-refresh
        let interval = null;
        if (autoRefresh) {
            interval = setInterval(loadAlerts, refreshInterval);
        }
        return () => {
            if (interval)
                clearInterval(interval);
        };
    }, [trackerId, autoRefresh, refreshInterval]);
    // Mark alert as read
    const handleAlertClick = async (alert) => {
        setSelectedAlert(alert);
        try {
            await markAlertAsRead(alert.id);
            setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
        }
        catch (error) {
            console.error("Error marking alert as read:", error);
        }
        onAlertClick?.(alert);
    };
    // Handle action on alert
    const handleAlertAction = async (alert, action) => {
        try {
            await updateAlertAction(alert.id, action);
            const updatedAlert = { ...alert, action, actionedAt: new Date() };
            setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
            setSelectedAlert(updatedAlert);
        }
        catch (error) {
            console.error("Error updating alert action:", error);
        }
    };
    const getSeverityColor = (severity) => {
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
    const getSeverityIcon = (severity) => {
        switch (severity) {
            case "major":
                return _jsx(AlertTriangle, { className: "w-5 h-5 text-red-600" });
            case "moderate":
                return _jsx(AlertCircle, { className: "w-5 h-5 text-orange-600" });
            default:
                return _jsx(AlertCircle, { className: "w-5 h-5 text-yellow-600" });
        }
    };
    if (loading) {
        return (_jsx("div", { className: "p-4 text-center text-gray-500", children: "Loading alerts..." }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Route Alerts" }), _jsxs("span", { className: "px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium", children: [alerts.length, " Active"] })] }), alerts.length === 0 ? (_jsxs("div", { className: "text-center py-8 text-gray-500", children: [_jsx(CheckCircle, { className: "w-12 h-12 mx-auto mb-2 opacity-50" }), _jsx("p", { children: "No active route alerts" })] })) : (_jsx("div", { className: "space-y-3", children: alerts.map((alert) => (_jsxs("div", { className: `p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${getSeverityColor(alert.severity)}`, onClick: () => handleAlertClick(alert), children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "flex-shrink-0 mt-1", children: getSeverityIcon(alert.severity) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-semibold text-gray-900", children: alert.message }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-gray-600 mt-1", children: [_jsx(Clock, { className: "w-3 h-3" }), alert.timestamp.toLocaleString()] })] }), !alert.action && (_jsx("div", { className: "flex-shrink-0", children: _jsx("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800", children: "Action needed" }) }))] }), !alert.action && (_jsxs("div", { className: "flex gap-2 mt-4 ml-8", children: [_jsx("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        handleAlertAction(alert, "continue");
                                    }, className: "px-3 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors", children: "No Action" }), _jsx("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        handleAlertAction(alert, "reroute");
                                    }, className: "px-3 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors", children: "Reroute" }), _jsx("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        handleAlertAction(alert, "investigate");
                                    }, className: "px-3 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors", children: "Investigate" })] })), alert.action && (_jsxs("div", { className: "flex items-center gap-2 mt-3 ml-8 text-xs text-gray-600", children: [_jsx(CheckCircle, { className: "w-3 h-3 text-green-600" }), _jsxs("span", { children: ["Action taken: ", _jsx("strong", { children: alert.action })] })] }))] }, alert.id))) }))] }));
}
export function RouteTrackingView({ activeRoute, matchPercentage, estTimeRemaining, estDistance, }) {
    if (!activeRoute || !activeRoute.isActive) {
        return null;
    }
    const formatTime = (ms) => {
        if (!ms)
            return "—";
        const minutes = Math.round(ms / 60000);
        if (minutes < 1)
            return "< 1 min";
        return `${minutes} min`;
    };
    const formatDistance = (meters) => {
        if (!meters)
            return "—";
        if (meters > 1000)
            return `${(meters / 1000).toFixed(1)} km`;
        return `${Math.round(meters)} m`;
    };
    return (_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(MapPin, { className: "w-5 h-5 text-blue-600" }), _jsxs("h3", { className: "font-semibold text-blue-900", children: ["Tracking route to ", activeRoute.destinationName] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-blue-700", children: "Route Match" }), _jsx("div", { className: "flex items-baseline gap-2", children: _jsxs("span", { className: "text-2xl font-bold text-blue-600", children: [Math.round(matchPercentage), "%"] }) }), _jsx("div", { className: "w-full bg-blue-200 rounded-full h-2 mt-1", children: _jsx("div", { className: "bg-blue-600 h-2 rounded-full transition-all", style: { width: `${matchPercentage}%` } }) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-blue-700", children: "Est. Time to Destination" }), _jsx("p", { className: "text-2xl font-bold text-blue-600", children: formatTime(estTimeRemaining) })] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-blue-700", children: "Distance to Destination" }), _jsx("p", { className: "text-lg font-semibold text-blue-600", children: formatDistance(estDistance) })] }), activeRoute.deviations.length > 0 && (_jsx("div", { className: "bg-yellow-50 border border-yellow-200 rounded p-2 mt-3", children: _jsxs("p", { className: "text-xs font-semibold text-yellow-800", children: [activeRoute.deviations.length, " deviation", activeRoute.deviations.length !== 1 ? "s" : "", " detected"] }) }))] }));
}
export function RouteTrackingControls({ isTracking, destinationName, canStart, onStart, onStop, }) {
    return (_jsxs("div", { className: "p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg", children: [_jsx("h3", { className: "font-semibold mb-3", children: "Route Tracking" }), !isTracking ? (_jsx("button", { onClick: onStart, disabled: !canStart, className: "w-full px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: destinationName
                    ? `Start tracking to ${destinationName}`
                    : "Select a destination to start tracking" })) : (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 bg-green-400 rounded-full animate-pulse" }), _jsxs("span", { className: "text-sm font-medium", children: ["Tracking route to ", destinationName] })] }), _jsx("button", { onClick: onStop, className: "w-full px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors", children: "Stop tracking" })] }))] }));
}
