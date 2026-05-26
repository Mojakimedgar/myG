import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Route tracking management component
 * Displays recorded routes, statistics, and allows managing active tracking
 */
import { useEffect, useState } from "react";
import { getRecordedRoutes, getMostConfidentRoute, } from "@/lib/route-firestore";
import { calculateRouteStatistics } from "@/lib/route-tracking";
import { MapPin, Calendar, Clock, Gauge, TrendingUp } from "lucide-react";
export function RouteStatsDisplay({ kidId, destinationId, destinationName, }) {
    const [routes, setRoutes] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [mostConfidentRoute, setMostConfidentRoute] = useState(null);
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
            }
            catch (error) {
                console.error("Error loading route data:", error);
            }
            finally {
                setLoading(false);
            }
        };
        loadData();
    }, [kidId, destinationId]);
    const formatDistance = (meters) => {
        if (meters > 1000)
            return `${(meters / 1000).toFixed(2)} km`;
        return `${Math.round(meters)} m`;
    };
    const formatDuration = (ms) => {
        const minutes = Math.round(ms / 60000);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m`;
    };
    if (loading) {
        return _jsx("div", { className: "p-4 text-center text-gray-500", children: "Loading routes..." });
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-2xl font-bold text-gray-900", children: ["Route to ", destinationName] }), _jsxs("p", { className: "text-gray-600 mt-1", children: [routes.length, " recorded route", routes.length !== 1 ? "s" : ""] })] }), statistics && (_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsx("div", { className: "bg-white border border-gray-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-600", children: "Avg Distance" }), _jsx("p", { className: "text-lg font-bold text-gray-900 mt-1", children: formatDistance(statistics.avgDistance) })] }), _jsx(MapPin, { className: "w-8 h-8 text-blue-500 opacity-20" })] }) }), _jsx("div", { className: "bg-white border border-gray-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-600", children: "Avg Duration" }), _jsx("p", { className: "text-lg font-bold text-gray-900 mt-1", children: formatDuration(statistics.avgDuration) })] }), _jsx(Clock, { className: "w-8 h-8 text-green-500 opacity-20" })] }) }), _jsx("div", { className: "bg-white border border-gray-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-600", children: "Typical Day" }), _jsx("p", { className: "text-lg font-bold text-gray-900 mt-1", children: dayOfWeekNames[statistics.mostCommonDayOfWeek] })] }), _jsx(Calendar, { className: "w-8 h-8 text-purple-500 opacity-20" })] }) }), _jsx("div", { className: "bg-white border border-gray-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-600", children: "Deviations" }), _jsxs("p", { className: "text-lg font-bold text-gray-900 mt-1", children: [(statistics.deviationRate * 100).toFixed(0), "%"] })] }), _jsx(TrendingUp, { className: "w-8 h-8 text-orange-500 opacity-20" })] }) })] })), mostConfidentRoute && (_jsx("div", { className: "bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-5", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-blue-900", children: "Most Confident Route" }), _jsxs("p", { className: "text-sm text-blue-700 mt-2", children: [formatDistance(mostConfidentRoute.distance), " \u2022", " ", formatDuration(mostConfidentRoute.duration), " \u2022", " ", (mostConfidentRoute.confidence * 100).toFixed(0), "% confidence"] }), _jsxs("p", { className: "text-xs text-blue-600 mt-1", children: ["Recorded on", " ", mostConfidentRoute.recordedAt.toLocaleDateString()] })] }), _jsx(Gauge, { className: "w-8 h-8 text-blue-500 flex-shrink-0" })] }) })), routes.length > 0 && (_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 mb-3", children: "Recorded Routes" }), _jsx("div", { className: "space-y-2", children: routes.map((route, index) => (_jsx("div", { className: "bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-sm font-medium text-gray-600", children: ["Route ", routes.length - index] }), _jsx("span", { className: "text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded", children: dayOfWeekNames[route.dayOfWeek] }), route.confidence && route.confidence > 0.8 && (_jsx("span", { className: "text-xs px-2 py-1 bg-green-100 text-green-700 rounded", children: "\u2713 Confident" }))] }), _jsxs("div", { className: "flex gap-4 mt-2 text-sm text-gray-600", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(MapPin, { className: "w-4 h-4" }), formatDistance(route.distance)] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "w-4 h-4" }), formatDuration(route.duration)] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Gauge, { className: "w-4 h-4" }), route.routePoints.length, " points"] })] }), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: route.recordedAt.toLocaleString() })] }), route.avgSpeed && (_jsxs("div", { className: "text-right ml-4", children: [_jsx("p", { className: "text-xs text-gray-600", children: "Avg Speed" }), _jsxs("p", { className: "text-lg font-semibold text-gray-900", children: [(route.avgSpeed * 3.6).toFixed(1), " km/h"] })] }))] }) }, route.id))) })] })), routes.length === 0 && !loading && (_jsxs("div", { className: "text-center py-12 bg-gray-50 rounded-lg", children: [_jsx(MapPin, { className: "w-12 h-12 mx-auto text-gray-300 mb-3" }), _jsx("p", { className: "text-gray-600 font-medium", children: "No routes recorded yet" }), _jsxs("p", { className: "text-sm text-gray-500 mt-1", children: ["Start tracking a trip to ", destinationName, " to record route patterns"] })] }))] }));
}
export function RoutesGroupedByDay({ kidId, destinationId, destinationName, }) {
    const [routesByDay, setRoutesByDay] = useState({});
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
                const grouped = {};
                routes.forEach((route) => {
                    if (!grouped[route.dayOfWeek]) {
                        grouped[route.dayOfWeek] = [];
                    }
                    grouped[route.dayOfWeek].push(route);
                });
                setRoutesByDay(grouped);
            }
            catch (error) {
                console.error("Error loading routes:", error);
            }
            finally {
                setLoading(false);
            }
        };
        loadRoutes();
    }, [kidId, destinationId]);
    if (loading) {
        return _jsx("div", { className: "p-4 text-center text-gray-500", children: "Loading..." });
    }
    return (_jsx("div", { className: "space-y-4", children: dayOfWeekNames.map((day, dayIndex) => {
            const dayRoutes = routesByDay[dayIndex] || [];
            return (_jsxs("div", { className: "bg-white border border-gray-200 rounded-lg p-4", children: [_jsxs("h3", { className: "font-semibold text-gray-900 mb-3", children: [day, _jsxs("span", { className: "ml-2 text-sm font-normal text-gray-600", children: ["(", dayRoutes.length, " route", dayRoutes.length !== 1 ? "s" : "", ")"] })] }), dayRoutes.length > 0 ? (_jsx("div", { className: "space-y-2", children: dayRoutes.map((route) => (_jsxs("div", { className: "text-sm bg-gray-50 p-3 rounded flex justify-between items-center", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-medium text-gray-900", children: [(route.distance / 1000).toFixed(2), " km in", " ", Math.round(route.duration / 60000), " min"] }), _jsx("p", { className: "text-xs text-gray-500", children: route.recordedAt.toLocaleDateString() })] }), route.confidence && (_jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-xs text-gray-600", children: "Confidence" }), _jsxs("p", { className: "text-sm font-semibold text-gray-900", children: [(route.confidence * 100).toFixed(0), "%"] })] }))] }, route.id))) })) : (_jsx("p", { className: "text-sm text-gray-500 italic", children: "No routes recorded for this day" }))] }, dayIndex));
        }) }));
}
