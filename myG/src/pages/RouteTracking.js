import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Route tracking page — daily commute tracking with user-chosen destination
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRouteTracking } from "@/hooks/use-route-tracking";
import { RouteAlertsPanel, RouteTrackingView, RouteTrackingControls, } from "@/components/RouteAlertsPanel";
import { RouteStatsDisplay, RoutesGroupedByDay, } from "@/components/RouteStatsDisplay";
import { AddressAutocomplete, } from "@/components/AddressAutocomplete";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppSidebar } from "@/components/AppSidebar";
import { Navbar } from "@/components/NavBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { getCurrentUserProfile } from "@/lib/auth";
import { subscribeActivity } from "@/lib/firestore";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
const DEFAULT_DESTINATION_RADIUS = 500;
function buildDestinationZone(destination, createdBy) {
    return {
        id: `dest_${destination.placeId}`,
        name: destination.name,
        address: destination.address,
        latitude: destination.latitude,
        longitude: destination.longitude,
        radius: DEFAULT_DESTINATION_RADIUS,
        type: "custom",
        activeKids: 0,
        totalKids: 0,
        createdAt: new Date(),
        isActive: true,
        createdBy,
    };
}
const EMPTY_DESTINATION = {
    id: "",
    name: "",
    address: "",
    coord: { latitude: 0, longitude: 0 },
};
export function RouteTrackingPage() {
    const { toast } = useToast();
    const isMobile = useIsMobile();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activity, setActivity] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [activeTab, setActiveTab] = useState("tracking");
    const [addressInput, setAddressInput] = useState("");
    const [selectedDestination, setSelectedDestination] = useState(null);
    const [selectedDeviation, setSelectedDeviation] = useState(null);
    const [selectedAlert, setSelectedAlert] = useState(null);
    useEffect(() => {
        getCurrentUserProfile().then(setCurrentUser);
    }, []);
    useEffect(() => {
        if (!currentUser?.id)
            return;
        const unsub = subscribeActivity((items) => setActivity(items));
        return () => unsub();
    }, [currentUser?.id]);
    const trackerId = currentUser?.id ?? "";
    const kidId = currentUser?.id ?? "";
    const destinationZone = useMemo(() => {
        if (!selectedDestination || !trackerId)
            return undefined;
        return buildDestinationZone(selectedDestination, trackerId);
    }, [selectedDestination, trackerId]);
    const destination = selectedDestination
        ? {
            id: `dest_${selectedDestination.placeId}`,
            name: selectedDestination.name,
            address: selectedDestination.address,
            coord: {
                latitude: selectedDestination.latitude,
                longitude: selectedDestination.longitude,
            },
        }
        : EMPTY_DESTINATION;
    const { isTracking, currentPoints, matchPercentage, activeRoute, currentDeviation, estTimeRemaining, estDistance, isInZone, startTracking, stopTracking, } = useRouteTracking({
        kidId,
        destinationId: destination.id,
        destinationName: destination.name,
        destinationCoord: destination.coord,
        trackerId,
        zone: destinationZone,
        recordingInterval: 30000,
        deviationThreshold: 200,
        autoRecord: true,
        onDeviationDetected: (deviation) => {
            setSelectedDeviation(deviation);
        },
        onDestinationReached: () => {
            toast({
                title: "Destination reached",
                description: `Arrived at ${destination.name}. Route saved.`,
            });
        },
        onZoneExit: (distance) => {
            toast({
                title: "Left destination area",
                description: `Now about ${Math.round(distance)}m from ${destination.name}.`,
                variant: "destructive",
            });
        },
    });
    const handleStartTracking = async () => {
        if (!selectedDestination) {
            toast({
                title: "Choose a destination",
                description: "Type an address and pick a suggestion before starting.",
                variant: "destructive",
            });
            return;
        }
        try {
            await startTracking();
        }
        catch (error) {
            console.error("Error starting tracking:", error);
            toast({
                title: "Could not start tracking",
                description: "Enable location permissions and try again.",
                variant: "destructive",
            });
        }
    };
    const destinationLabel = selectedDestination?.name ?? null;
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-background via-background to-muted flex", children: [_jsx(AppSidebar, { activity: activity, open: sidebarOpen, onOpenChange: setSidebarOpen, className: isMobile ? undefined : "" }), _jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [_jsx(Navbar, { showSidebarButton: isMobile, onOpenSidebar: () => setSidebarOpen(true) }), _jsxs("main", { className: "flex-1 overflow-auto", children: [_jsx("div", { className: "border-b border-border bg-card/80 sticky top-0 z-10", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 py-4 flex items-center gap-3", children: [_jsx(Button, { variant: "ghost", size: "icon", asChild: true, children: _jsx(Link, { to: "/", "aria-label": "Back to dashboard", children: _jsx(ArrowLeft, { className: "h-5 w-5" }) }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-foreground", children: "Route Tracking" }), _jsx("p", { className: "text-muted-foreground mt-0.5 text-sm", children: "Track your daily route and get alerts when you deviate" })] })] }) }), _jsx("div", { className: "max-w-7xl mx-auto px-4 py-6", children: _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, children: [_jsxs(TabsList, { className: "grid w-full grid-cols-4 mb-6", children: [_jsx(TabsTrigger, { value: "tracking", children: "Live Tracking" }), _jsx(TabsTrigger, { value: "alerts", children: "Alerts" }), _jsx(TabsTrigger, { value: "statistics", children: "Statistics" }), _jsx(TabsTrigger, { value: "history", children: "History" })] }), _jsx(TabsContent, { value: "tracking", className: "space-y-6", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-4", children: [_jsx("div", { className: "bg-card border border-border rounded-lg p-4", children: _jsx(AddressAutocomplete, { value: addressInput, onChange: (v) => {
                                                                        setAddressInput(v);
                                                                        if (selectedDestination &&
                                                                            v.trim() !== selectedDestination.address) {
                                                                            setSelectedDestination(null);
                                                                        }
                                                                    }, onSelect: (dest) => {
                                                                        setSelectedDestination(dest);
                                                                        setAddressInput(dest.address);
                                                                    }, selectedDestination: selectedDestination, disabled: isTracking }) }), _jsx(RouteTrackingControls, { isTracking: isTracking, destinationName: destinationLabel, canStart: !!selectedDestination && !isTracking, onStart: handleStartTracking, onStop: stopTracking }), isTracking && (_jsx(RouteTrackingView, { activeRoute: activeRoute, matchPercentage: matchPercentage, estTimeRemaining: estTimeRemaining, estDistance: estDistance })), currentDeviation && (_jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-950/30 dark:border-yellow-800", children: [_jsx("h3", { className: "font-semibold text-yellow-900 dark:text-yellow-100", children: "Current Route Deviation" }), _jsxs("p", { className: "text-sm text-yellow-800 dark:text-yellow-200 mt-2", children: ["Off route by", " ", Math.round(currentDeviation.deviationDistance), "m (", currentDeviation.severity, " severity)"] })] })), _jsxs("div", { className: "bg-card border border-border rounded-lg p-4", children: [_jsx("h3", { className: "font-semibold text-foreground mb-2", children: "Data Collection" }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [currentPoints.length, " location points collected"] }), isTracking && (_jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Collecting new points every 30 seconds" }))] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-card border border-border rounded-lg p-4", children: [_jsx("h3", { className: "font-semibold text-foreground mb-3", children: "Destination" }), selectedDestination ? (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Location" }), _jsx("p", { className: "font-medium text-foreground", children: selectedDestination.name })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Address" }), _jsx("p", { className: "text-sm text-foreground/90", children: selectedDestination.address })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Arrival zone" }), _jsxs("p", { className: "font-medium text-foreground", children: [DEFAULT_DESTINATION_RADIUS, "m radius"] })] }), isTracking && (_jsxs("div", { className: "pt-2 border-t border-border mt-2", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Zone status" }), _jsx("div", { className: `mt-1 inline-block px-3 py-1 rounded-full text-xs font-medium ${isInZone
                                                                                            ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                                                                                            : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"}`, children: isInZone ? "Near destination" : "Away from destination" })] }))] })) : (_jsx("p", { className: "text-sm text-muted-foreground", children: "Enter and select your destination address to see details here." }))] }), activeRoute && (_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950/30 dark:border-blue-800", children: [_jsx("h3", { className: "font-semibold text-blue-900 dark:text-blue-100 mb-3", children: "Trip Stats" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-blue-700 dark:text-blue-300", children: "Trip duration" }), _jsxs("span", { className: "font-medium text-blue-900 dark:text-blue-100", children: [Math.round((Date.now() -
                                                                                                activeRoute.startTime.getTime()) /
                                                                                                60000), " ", "min"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-blue-700 dark:text-blue-300", children: "Points collected" }), _jsx("span", { className: "font-medium text-blue-900 dark:text-blue-100", children: currentPoints.length })] })] })] }))] })] }) }), _jsx(TabsContent, { value: "alerts", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-2 bg-card border border-border rounded-lg p-6", children: trackerId ? (_jsx(RouteAlertsPanel, { trackerId: trackerId, autoRefresh: true, refreshInterval: 5000, onAlertClick: setSelectedAlert })) : (_jsx("p", { className: "text-muted-foreground text-sm", children: "Sign in to view alerts." })) }), selectedAlert && (_jsxs("div", { className: "bg-card border border-border rounded-lg p-6 space-y-4", children: [_jsx("h3", { className: "font-semibold text-foreground", children: "Alert Details" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Message" }), _jsx("p", { className: "text-sm text-foreground mt-1", children: selectedAlert.message })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Severity" }), _jsx("p", { className: "text-sm font-medium text-foreground mt-1", children: selectedAlert.severity.toUpperCase() })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Time" }), _jsx("p", { className: "text-sm text-foreground mt-1", children: selectedAlert.timestamp.toLocaleString() })] })] })] }))] }) }), _jsx(TabsContent, { value: "statistics", children: _jsx("div", { className: "bg-card border border-border rounded-lg p-6", children: kidId && destination.id ? (_jsx(RouteStatsDisplay, { kidId: kidId, destinationId: destination.id, destinationName: destination.name })) : (_jsx("p", { className: "text-sm text-muted-foreground", children: "Select a destination on Live Tracking to view statistics for that route." })) }) }), _jsx(TabsContent, { value: "history", children: _jsx("div", { className: "bg-card border border-border rounded-lg p-6", children: kidId && destination.id ? (_jsx(RoutesGroupedByDay, { kidId: kidId, destinationId: destination.id, destinationName: destination.name })) : (_jsx("p", { className: "text-sm text-muted-foreground", children: "Select a destination on Live Tracking to view route history." })) }) })] }) })] })] })] }));
}
export function SimpleRouteTrackingExample() {
    const [selectedDestination, setSelectedDestination] = useState(null);
    const [addressInput, setAddressInput] = useState("");
    const destination = selectedDestination
        ? {
            id: `dest_${selectedDestination.placeId}`,
            name: selectedDestination.name,
            coord: {
                latitude: selectedDestination.latitude,
                longitude: selectedDestination.longitude,
            },
        }
        : {
            id: "",
            name: "",
            coord: { latitude: 0, longitude: 0 },
        };
    const { isTracking, matchPercentage, startTracking, stopTracking } = useRouteTracking({
        kidId: "child123",
        destinationId: destination.id,
        destinationName: destination.name,
        destinationCoord: destination.coord,
        trackerId: "parent123",
    });
    return (_jsxs("div", { className: "p-6 bg-white rounded-lg border border-gray-200 space-y-4", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Quick Start" }), _jsx(AddressAutocomplete, { value: addressInput, onChange: setAddressInput, onSelect: (d) => {
                    setSelectedDestination(d);
                    setAddressInput(d.address);
                }, selectedDestination: selectedDestination, disabled: isTracking }), !isTracking ? (_jsx("button", { onClick: startTracking, disabled: !selectedDestination, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50", children: selectedDestination
                    ? `Start tracking to ${selectedDestination.name}`
                    : "Select a destination first" })) : (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "text-lg font-semibold text-green-600", children: ["Tracking active \u2192 ", selectedDestination?.name] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Route match: ", Math.round(matchPercentage), "%"] }), _jsx("button", { onClick: stopTracking, className: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700", children: "Stop tracking" })] }))] }));
}
