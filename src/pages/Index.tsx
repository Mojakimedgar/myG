import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/NavBar";
import { QuickStats } from "@/components/QuickStats";
import { KidCard } from "@/components/KidCard";
import { ZoneCard } from "@/components/ZoneCard";
import { AddKidModal } from "@/components/AddKidModal";
import { AddZoneModal } from "@/components/AddZoneModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Shield, Trash } from "lucide-react";
import { getKids, getZones, getRecentActivity, subscribeKids, subscribeZones, subscribeActivity, updateKid, updateZone, addActivity, updateUserLocation } from "@/lib/firestore";
import { startLocationTracking, collectAndUpdateLocation } from "@/lib/location";
import { Kid } from "@/types/kids";
import { Zone } from "@/types/zone";
import { Activity } from "@/types/activity";
import { Toaster } from "@/components/ui/toaster";
import { computeGeofenceStatus, statusFromGeofence } from "@/lib/utils";
import { loadSettings, onSettingsUpdated } from "@/lib/settings";
import { getCurrentUserProfile } from "@/lib/auth";
import { User } from "@/types/user";
import { SafetyCheck } from "@/types/safety-check";
import { SafetyCheckPopup } from "@/components/safety/SafetyCheckPopup";
import { subscribePendingSafetyChecks } from "@/lib/safety-check";
import { InvitationList } from "@/components/myg/InvitationList";
import { InviteGuardianModal } from "@/components/myg/InviteGuardianModal";
import { InvitePrimaryUserModal } from "@/components/myg/InvitePrimaryUserModal";
import { InitiateSafetyCheck } from "@/components/guards/InitiateSafetyCheck";
import { getUserProfile, updateUserProfile } from "@/lib/users";
import { ZoneGroupManager } from "@/components/zones/ZoneGroupManager";
import { getMonitoredKids } from "@/lib/firestore";
import { AppSidebar } from "@/components/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { LiveMapModal } from "@/components/LiveMapModal";


// Zones will be loaded from Firestore

const Index = () => {
  const { toast } = useToast();
  const [kids, setKids] = useState<Kid[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [settings, setSettings] = useState(loadSettings());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingSafetyChecks, setPendingSafetyChecks] = useState<SafetyCheck[]>([]);
  const [monitoredUsers, setMonitoredUsers] = useState<User[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [liveMapOpen, setLiveMapOpen] = useState(false);
  const [liveMapFocusKidId, setLiveMapFocusKidId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const openLiveMap = (focusKidId: string | null) => {
    setLiveMapFocusKidId(focusKidId);
    setLiveMapOpen(true);
  };

  const loadKids = async () => {
    try {
      setLoading(true);
      console.log("Loading G's...");
      const kidsData = await getKids();
      console.log("G's data received:", kidsData);
      setKids(kidsData);
    } catch (error) {
      console.error("Error loading G's:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadZones = async () => {
    try {
      setZonesLoading(true);
      const zonesData = await getZones();
      setZones(zonesData);
    } catch (error) {
      console.error("Error loading zones:", error);
    } finally {
      setZonesLoading(false);
    }
  };

  const loadActivity = async () => {
    try {
      setActivityLoading(true);
      const userId = currentUser?.id;
      if (!userId) {
        setActivity([]);
        return;
      }
      const items = await getRecentActivity(userId, 10);
      setActivity(items);
    } catch (error) {
      console.error("Error loading activity:", error);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUserProfile();
      setCurrentUser(user);

      if (user) {
        // Load monitored users for guardians
        if (user.role === "guardian") {
          const monitored = await getMonitoredKids(user.id);
          setMonitoredUsers(monitored);
        }

        // Safety check subscription
        if (user.role === "primary") {
          const unsubSafetyChecks = subscribePendingSafetyChecks(user.id, (checks) => {
            setPendingSafetyChecks(checks);
          });
          return () => unsubSafetyChecks();
        }
      }
    };

    loadUser();
  }, []);

  // when logged in as a primary user, keep their location field up to date
  useEffect(() => {
    if (currentUser?.role !== "primary") return;

    const stopTracking = startLocationTracking(
      currentUser.id,
      (lat, lon, addr) => {
        console.log(`Location updated: ${addr}`);
      },
      (error) => {
        console.warn(`Location tracking error: ${error}`);
      }
    );

    return () => {
      stopTracking();
    };
  }, [currentUser]);

  useEffect(() => {
    // whenever the user or their monitored list changes we need to reload
    // the children and rebuild the real-time listener
    loadKids();
    loadZones();
    loadActivity();

    // Real-time subscriptions
    let unsubKids: (() => void) | undefined;
    if (currentUser) {
      unsubKids = subscribeKids((kidsLive) => {
        setKids(kidsLive);
      });
    }

    const unsubZones = subscribeZones((zonesLive) => {
      setZones(zonesLive);
    });
    const unsubActivity = subscribeActivity((activityLive) => {
      setActivity(activityLive.slice(0, 10));
    });
    const off = onSettingsUpdated((s) => setSettings(s));

    // Fallback: refresh zones/activity when a global zone:refresh is dispatched
    const onZoneRefresh = () => {
      loadZones();
      loadActivity();
    };
    window.addEventListener("zone:refresh", onZoneRefresh as EventListener);

    const onAllRefresh = () => {
      loadKids();
      loadZones();
      loadActivity();
    };
    window.addEventListener("all:refresh", onAllRefresh as EventListener);

    return () => {
      unsubKids?.();
      unsubZones?.();
      unsubActivity?.();
      off?.();
      window.removeEventListener("zone:refresh", onZoneRefresh as EventListener);
      window.removeEventListener("all:refresh", onAllRefresh as EventListener);
    };
  }, [currentUser?.id, JSON.stringify(currentUser?.monitoredUsers)]);

  // Geofencing orchestration: recompute statuses whenever kids or zones change
  useEffect(() => {
    if (!settings.geofencingEnabled) return;
    if (kids.length === 0 || zones.length === 0) return;
    if (!currentUser) return;

    const nowLabel = "Just now";

    // For each kid, find best zone status (inside beats near beats outside)
    kids.forEach(async (kid) => {
      // Skip kids without coordinates
      if (typeof kid.latitude !== "number" || typeof kid.longitude !== "number") {
        return;
      }

      let bestStatus: "safe" | "warning" | "alert" = "alert";
      let inAnyZone = false;

      zones.forEach((zone) => {
        if (!zone.isActive) return;
        const { status } = computeGeofenceStatus(
          kid.latitude,
          kid.longitude,
          zone.latitude,
          zone.longitude,
          zone.radius
        );
        const mapped = statusFromGeofence(status);
        if (mapped === "safe") {
          bestStatus = "safe";
          inAnyZone = true;
        } else if (mapped === "warning" && bestStatus !== "safe") {
          bestStatus = "warning";
        }
      });

      // Only update if status changed
      if (kid.status !== bestStatus) {
        // For guardians, kids are actually monitored users in the "users" collection
        // For primary users, kids are in the "myG" collection
        if (currentUser?.role === "guardian") {
          await updateUserLocation(kid.id, kid.latitude, kid.longitude, kid.location, bestStatus, nowLabel);
        } else {
          await updateKid(kid.id, { status: bestStatus, lastSeen: nowLabel });
        }
        try {
          const statusText: Record<"safe" | "warning" | "alert", string> = {
            safe: "inside",
            warning: "near",
            alert: "outside",
          };
          const severityMap: Record<"safe" | "warning" | "alert", "warning" | "safe" | "info"> = {
            safe: "safe",
            warning: "info",
            alert: "warning",
          };
          await addActivity({
            type: "kid",
            action: "geofence",
            message: `${kid.name} is ${statusText[bestStatus]} zones`,
            kidId: kid.id,
            severity: severityMap[bestStatus],
          });
        } catch (e) {
          console.warn("Failed to log geofence activity", e);
        }
      }
    });

    // For each zone, update activeKids count
    zones.forEach(async (zone) => {
      if (!zone.isActive) return;
      const countInside = kids.filter((kid) => {
        const { status } = computeGeofenceStatus(
          kid.latitude,
          kid.longitude,
          zone.latitude,
          zone.longitude,
          zone.radius
        );
        return status === "inside";
      }).length;
      if ((zone.activeKids ?? 0) !== countInside) {
        await updateZone(zone.id, { activeKids: countInside });
      }
    });
  }, [kids, zones, currentUser]);

  const handleKidUpdated = () => {
    console.log("handleKidUpdated called - refreshing kids list");
    loadKids();
  };

  const handleZoneUpdated = () => {
    loadZones();
    loadActivity();
  };

  // remove a monitored user relationship
  const handleRemoveMonitored = async (user: User) => {
    if (!currentUser) return;
    const confirmed = window.confirm(
      `Stop monitoring ${user.displayName}?`
    );
    if (!confirmed) return;

    try {
      // update primary user's guardians list
      const primaryGuardians = user.guardians || [];
      const updatedPrimaryGuardians = primaryGuardians.filter(
        (id) => id !== currentUser.id
      );
      await updateUserProfile(user.id, {
        guardians: updatedPrimaryGuardians,
      });

      // update guardian's monitoredUsers list
      const guardianMonitored = currentUser.monitoredUsers || [];
      const updatedGuardianMonitored = guardianMonitored.filter(
        (id) => id !== user.id
      );
      await updateUserProfile(currentUser.id, {
        monitoredUsers: updatedGuardianMonitored,
      });

      // refresh the profile and monitored list
      const refreshed = await getCurrentUserProfile();
      setCurrentUser(refreshed);
      if (refreshed && refreshed.role === "guardian") {
        const monitored = await getMonitoredKids(refreshed.id);
        setMonitoredUsers(monitored);
      }

      toast({
        title: "Stopped monitoring",
        description: `${user.displayName} is no longer on your list.`,
      });
    } catch (err) {
      console.error("Failed to remove monitored user", err);
      toast({
        title: "Error",
        description: "Unable to remove monitored user. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex">
      <AppSidebar
        activity={activity}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          showSidebarButton={isMobile}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        {/* Safety Check Popups for Primary Users */}
        {currentUser?.role === "primary" && pendingSafetyChecks.length > 0 && (
          <SafetyCheckPopup
            check={pendingSafetyChecks[0]}
            onResponded={() => {
              setPendingSafetyChecks((prev) => prev.slice(1));
            }}
          />
        )}

        {/* MYG Invitations */}
        {currentUser && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <InvitationList onRelationChanged={() => {
              // refresh profile so that monitoredUsers updates and triggers
              // the kids subscription reload in the other effect
              getCurrentUserProfile().then(setCurrentUser);
            }} />
          </section>
        )}

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary-glow/5 pointer-events-none"></div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="space-y-4">
                  <Badge className="bg-gradient-to-r from-safe-zone to-safe-zone/80 text-white border-0">
                    <Shield className="h-3 w-3 mr-1" />
                    All G's Safe
                  </Badge>
                  <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                    Keep Your Family{" "}
                    <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                      Safe & Connected
                    </span>
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    Monitor your G's location with smart zone notifications
                    and real-time safety updates.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="zone" size="lg" className="text-base px-8" onClick={() => openLiveMap(null)}>
                    <MapPin className="h-5 w-5" />
                    View Live Map
                  </Button>
                  {currentUser?.role === "primary" && (
                    <>
                      <InviteGuardianModal
                        currentUserId={currentUser.id}
                        currentUserEmail={currentUser.email}
                        onInvitationSent={() => {
                          // Refresh user profile
                          getCurrentUserProfile().then(setCurrentUser);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={async () => {
                          const result = await collectAndUpdateLocation(currentUser.id);
                          if (result) {
                            toast({
                              title: "Location updated",
                              description: result.address,
                            });
                          } else {
                            toast({
                              title: "Location Error",
                              description: "Could not get your location. Check browser permissions.",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="text-base px-8"
                      >
                        <MapPin className="h-5 w-5" />
                        Update My Location
                      </Button>
                    </>
                  )}
                  {currentUser?.role === "guardian" && (
                    <>
                      <InvitePrimaryUserModal
                        currentUserId={currentUser.id}
                        currentUserEmail={currentUser.email}
                        onInvitationSent={() => {
                          // Refresh user profile
                          getCurrentUserProfile().then(setCurrentUser);
                        }}
                      />
                      <AddZoneModal buttonLabel="Add Zone" onZoneAdded={() => {
                        handleZoneUpdated();
                        window.dispatchEvent(new Event("zone:refresh"));
                      }} />
                    </>
                  )}
                </div>
              </div>

              <div className="relative">

                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent rounded-2xl pointer-events-none"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <QuickStats kids={kids} zones={zones} />
        </section>

        {/* Main Content Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Kids Overview / Monitored Users */}
            <div className="space-y-6">

              {/* HEADER + ACTION AREA */}
              <div className="flex flex-col gap-4">

                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {currentUser?.role === "guardian" ? "Monitored Users" : "Your G's"}
                  </h2>
                  <p className="text-muted-foreground">
                    {currentUser?.role === "guardian"
                      ? "Users you're monitoring and protecting"
                      : "Real-time location and safety status"}
                  </p>
                </div>

                {/* GUARDIAN VIEW */}
                {currentUser?.role === "guardian" ? (
                  monitoredUsers.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {monitoredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 p-3 border rounded-xl bg-card"
                        >
                          {/* User Info */}
                          <div className="flex-1">
                            <p className="font-medium">{user.displayName}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>

                          {/* ACTION BUTTONS */}
                          <div className="flex items-center gap-2 flex-wrap">

                            {/* VIEW MAP */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openLiveMap(user.id)}
                              className="gap-1"
                            >
                              <MapPin className="h-4 w-4" />
                              Map
                            </Button>

                            {/* SAFETY CHECK */}
                            <InitiateSafetyCheck monitoredUser={user} />

                            {/* DELETE BUTTON */}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveMonitored(user)}
                              className="gap-1"
                            >
                              <Trash className="h-4 w-4" />
                              Delete
                            </Button>

                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  /* PRIMARY USER VIEW */
                  <div>
                    <AddKidModal onKidAdded={handleKidUpdated} />
                  </div>
                )}

              </div>

              {/* KID CARDS LIST */}
              <div className="space-y-4">
                {loading ? ( 
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading G's...</p>
                  </div>
                ) : kids.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No G's added yet. Add your first G's!
                    </p>
                  </div>
                ) : (
                  kids.map((kid) => (
                    <KidCard
                      key={kid.id}
                      kid={kid}
                      onKidUpdated={handleKidUpdated}
                      onViewLiveMap={openLiveMap}
                    />
                  ))
                )}
              </div>

            </div>
            {/* Zones Management */}
            <div className="flex flex-col space-y-6 h-full">
              {/* Header Section */}
              <div className="flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Safety Zones</h2>
                  <p className="text-muted-foreground">
                    Manage location boundaries and notifications
                  </p>
                </div>
                {currentUser?.role === "guardian" && (
                  <AddZoneModal onZoneAdded={handleZoneUpdated} />
                )}
              </div>

              {/* Optional Management Section */}
              {currentUser?.role === "guardian" && zones.length > 0 && (
                <div className="shrink-0">
                  <ZoneGroupManager zones={zones} onGroupUpdated={handleZoneUpdated} />
                </div>
              )}

              {/* Main Content Area (Scrollable if needed) */}
              <div className="flex flex-col space-y-4 flex-1 overflow-y-auto">
                {zonesLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <p className="text-muted-foreground">Loading zones...</p>
                  </div>
                ) : zones.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <p className="text-muted-foreground">
                      No zones created yet. Create your first zone!
                    </p>
                  </div>
                ) : (
                  zones.map((zone) => (
                    <ZoneCard key={zone.id} {...zone} onZoneUpdated={handleZoneUpdated} />
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <LiveMapModal
          open={liveMapOpen}
          onOpenChange={setLiveMapOpen}
          kids={kids}
          zones={zones}
          focusKidId={liveMapFocusKidId}
        />
        <Toaster />
      </div>
    </div>
  );
};

export default Index;
