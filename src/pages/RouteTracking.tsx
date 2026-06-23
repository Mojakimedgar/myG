/**
 * Route tracking page — daily commute tracking with user-chosen destination
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRouteTracking } from "@/hooks/use-route-tracking";
import {
  RouteAlertsPanel,
  RouteTrackingView,
  RouteTrackingControls,
} from "@/components/RouteAlertsPanel";
import {
  RouteStatsDisplay,
  RoutesGroupedByDay,
} from "@/components/RouteStatsDisplay";
import {
  AddressAutocomplete,
  SelectedDestination,
} from "@/components/AddressAutocomplete";
import { RouteDeviation, RouteAlert } from "@/types/route";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zone } from "@/types/zone";
import { AppSidebar } from "@/components/AppSidebar";
import { Navbar } from "@/components/NavBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { getCurrentUserProfile } from "@/lib/auth";
import { subscribeActivity } from "@/lib/firestore";
import { Activity } from "@/types/activity";
import { User } from "@/types/user";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_DESTINATION_RADIUS = 500;

function buildDestinationZone(
  destination: SelectedDestination,
  createdBy: string
): Zone {
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
  const [activity, setActivity] = useState<Activity[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("tracking");
  const [addressInput, setAddressInput] = useState("");
  const [selectedDestination, setSelectedDestination] =
    useState<SelectedDestination | null>(null);
  const [selectedDeviation, setSelectedDeviation] =
    useState<RouteDeviation | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<RouteAlert | null>(null);

  useEffect(() => {
    getCurrentUserProfile().then(setCurrentUser);
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = subscribeActivity((items) => setActivity(items));
    return () => unsub();
  }, [currentUser?.id]);

  const trackerId = currentUser?.id ?? "";
  const kidId = currentUser?.id ?? "";

  const destinationZone = useMemo(() => {
    if (!selectedDestination || !trackerId) return undefined;
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

  const {
    isTracking,
    currentPoints,
    matchPercentage,
    activeRoute,
    currentDeviation,
    estTimeRemaining,
    estDistance,
    isInZone,
    startTracking,
    stopTracking,
  } = useRouteTracking({
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
    } catch (error) {
      console.error("Error starting tracking:", error);
      toast({
        title: "Could not start tracking",
        description: "Enable location permissions and try again.",
        variant: "destructive",
      });
    }
  };

  const destinationLabel = selectedDestination?.name ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex">
      <AppSidebar
        activity={activity}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        className={isMobile ? undefined : ""}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          showSidebarButton={isMobile}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-auto">
          <div className="border-b border-border bg-card/80 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/" aria-label="Back to dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Route Tracking
                </h1>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  Track your daily route and get alerts when you deviate
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="tracking">Live Tracking</TabsTrigger>
                <TabsTrigger value="alerts">Alerts</TabsTrigger>
                <TabsTrigger value="statistics">Statistics</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="tracking" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-card border border-border rounded-lg p-4">
                      <AddressAutocomplete
                        value={addressInput}
                        onChange={(v) => {
                          setAddressInput(v);
                          if (
                            selectedDestination &&
                            v.trim() !== selectedDestination.address
                          ) {
                            setSelectedDestination(null);
                          }
                        }}
                        onSelect={(dest) => {
                          setSelectedDestination(dest);
                          setAddressInput(dest.address);
                        }}
                        selectedDestination={selectedDestination}
                        disabled={isTracking}
                      />
                    </div>

                    <RouteTrackingControls
                      isTracking={isTracking}
                      destinationName={destinationLabel}
                      canStart={!!selectedDestination && !isTracking}
                      onStart={handleStartTracking}
                      onStop={stopTracking}
                    />

                    {isTracking && (
                      <RouteTrackingView
                        activeRoute={activeRoute}
                        matchPercentage={matchPercentage}
                        estTimeRemaining={estTimeRemaining}
                        estDistance={estDistance}
                      />
                    )}

                    {currentDeviation && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-950/30 dark:border-yellow-800">
                        <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                          Current Route Deviation
                        </h3>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-2">
                          Off route by{" "}
                          {Math.round(currentDeviation.deviationDistance)}m (
                          {currentDeviation.severity} severity)
                        </p>
                      </div>
                    )}

                    <div className="bg-card border border-border rounded-lg p-4">
                      <h3 className="font-semibold text-foreground mb-2">
                        Data Collection
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {currentPoints.length} location points collected
                      </p>
                      {isTracking && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Collecting new points every 30 seconds
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-card border border-border rounded-lg p-4">
                      <h3 className="font-semibold text-foreground mb-3">
                        Destination
                      </h3>
                      {selectedDestination ? (
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Location
                            </p>
                            <p className="font-medium text-foreground">
                              {selectedDestination.name}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Address
                            </p>
                            <p className="text-sm text-foreground/90">
                              {selectedDestination.address}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Arrival zone
                            </p>
                            <p className="font-medium text-foreground">
                              {DEFAULT_DESTINATION_RADIUS}m radius
                            </p>
                          </div>
                          {isTracking && (
                            <div className="pt-2 border-t border-border mt-2">
                              <p className="text-xs text-muted-foreground">
                                Zone status
                              </p>
                              <div
                                className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                  isInZone
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
                                }`}
                              >
                                {isInZone ? "Near destination" : "Away from destination"}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Enter and select your destination address to see
                          details here.
                        </p>
                      )}
                    </div>

                    {activeRoute && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950/30 dark:border-blue-800">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                          Trip Stats
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-blue-700 dark:text-blue-300">
                              Trip duration
                            </span>
                            <span className="font-medium text-blue-900 dark:text-blue-100">
                              {Math.round(
                                (Date.now() -
                                  activeRoute.startTime.getTime()) /
                                  60000
                              )}{" "}
                              min
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700 dark:text-blue-300">
                              Points collected
                            </span>
                            <span className="font-medium text-blue-900 dark:text-blue-100">
                              {currentPoints.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="alerts">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
                    {trackerId ? (
                      <RouteAlertsPanel
                        trackerId={trackerId}
                        autoRefresh
                        refreshInterval={5000}
                        onAlertClick={setSelectedAlert}
                      />
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Sign in to view alerts.
                      </p>
                    )}
                  </div>

                  {selectedAlert && (
                    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                      <h3 className="font-semibold text-foreground">
                        Alert Details
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Message
                          </p>
                          <p className="text-sm text-foreground mt-1">
                            {selectedAlert.message}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Severity
                          </p>
                          <p className="text-sm font-medium text-foreground mt-1">
                            {selectedAlert.severity.toUpperCase()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Time</p>
                          <p className="text-sm text-foreground mt-1">
                            {selectedAlert.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="statistics">
                <div className="bg-card border border-border rounded-lg p-6">
                  {kidId && destination.id ? (
                    <RouteStatsDisplay
                      kidId={kidId}
                      destinationId={destination.id}
                      destinationName={destination.name}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Select a destination on Live Tracking to view statistics
                      for that route.
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history">
                <div className="bg-card border border-border rounded-lg p-6">
                  {kidId && destination.id ? (
                    <RoutesGroupedByDay
                      kidId={kidId}
                      destinationId={destination.id}
                      destinationName={destination.name}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Select a destination on Live Tracking to view route
                      history.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

export function SimpleRouteTrackingExample() {
  const [selectedDestination, setSelectedDestination] =
    useState<SelectedDestination | null>(null);
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

  const { isTracking, matchPercentage, startTracking, stopTracking } =
    useRouteTracking({
      kidId: "child123",
      destinationId: destination.id,
      destinationName: destination.name,
      destinationCoord: destination.coord,
      trackerId: "parent123",
    });

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 space-y-4">
      <h2 className="text-xl font-bold mb-4">Quick Start</h2>
      <AddressAutocomplete
        value={addressInput}
        onChange={setAddressInput}
        onSelect={(d) => {
          setSelectedDestination(d);
          setAddressInput(d.address);
        }}
        selectedDestination={selectedDestination}
        disabled={isTracking}
      />

      {!isTracking ? (
        <button
          onClick={startTracking}
          disabled={!selectedDestination}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {selectedDestination
            ? `Start tracking to ${selectedDestination.name}`
            : "Select a destination first"}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="text-lg font-semibold text-green-600">
            Tracking active → {selectedDestination?.name}
          </div>
          <p className="text-sm text-gray-600">
            Route match: {Math.round(matchPercentage)}%
          </p>
          <button
            onClick={stopTracking}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Stop tracking
          </button>
        </div>
      )}
    </div>
  );
}
