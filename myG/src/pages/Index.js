import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
import { Toaster } from "@/components/ui/toaster";
import { computeGeofenceStatus, statusFromGeofence } from "@/lib/utils";
import { loadSettings, onSettingsUpdated } from "@/lib/settings";
import { getCurrentUserProfile } from "@/lib/auth";
import { SafetyCheckPopup } from "@/components/safety/SafetyCheckPopup";
import { subscribePendingSafetyChecks } from "@/lib/safety-check";
import { InvitationList } from "@/components/myg/InvitationList";
import { InviteGuardianModal } from "@/components/myg/InviteGuardianModal";
import { InvitePrimaryUserModal } from "@/components/myg/InvitePrimaryUserModal";
import { InitiateSafetyCheck } from "@/components/guards/InitiateSafetyCheck";
import { updateUserProfile } from "@/lib/users";
import { ZoneGroupManager } from "@/components/zones/ZoneGroupManager";
import { getMonitoredKids } from "@/lib/firestore";
import { AppSidebar } from "@/components/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { LiveMapModal } from "@/components/LiveMapModal";
// Zones will be loaded from Firestore
const Index = () => {
    const { toast } = useToast();
    const [kids, setKids] = useState([]);
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [zonesLoading, setZonesLoading] = useState(true);
    const [activity, setActivity] = useState([]);
    const [activityLoading, setActivityLoading] = useState(true);
    const [settings, setSettings] = useState(loadSettings());
    const [currentUser, setCurrentUser] = useState(null);
    const [pendingSafetyChecks, setPendingSafetyChecks] = useState([]);
    const [monitoredUsers, setMonitoredUsers] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [liveMapOpen, setLiveMapOpen] = useState(false);
    const [liveMapFocusKidId, setLiveMapFocusKidId] = useState(null);
    const isMobile = useIsMobile();
    const openLiveMap = (focusKidId) => {
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
        }
        catch (error) {
            console.error("Error loading G's:", error);
        }
        finally {
            setLoading(false);
        }
    };
    const loadZones = async () => {
        try {
            setZonesLoading(true);
            const zonesData = await getZones();
            setZones(zonesData);
        }
        catch (error) {
            console.error("Error loading zones:", error);
        }
        finally {
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
        }
        catch (error) {
            console.error("Error loading activity:", error);
        }
        finally {
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
        if (currentUser?.role !== "primary")
            return;
        const stopTracking = startLocationTracking(currentUser.id, (lat, lon, addr) => {
            console.log(`Location updated: ${addr}`);
        }, (error) => {
            console.warn(`Location tracking error: ${error}`);
        });
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
        let unsubKids;
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
        window.addEventListener("zone:refresh", onZoneRefresh);
        const onAllRefresh = () => {
            loadKids();
            loadZones();
            loadActivity();
        };
        window.addEventListener("all:refresh", onAllRefresh);
        return () => {
            unsubKids?.();
            unsubZones?.();
            unsubActivity?.();
            off?.();
            window.removeEventListener("zone:refresh", onZoneRefresh);
            window.removeEventListener("all:refresh", onAllRefresh);
        };
    }, [currentUser?.id, JSON.stringify(currentUser?.monitoredUsers)]);
    // Geofencing orchestration: recompute statuses whenever kids or zones change
    useEffect(() => {
        if (!settings.geofencingEnabled)
            return;
        if (kids.length === 0 || zones.length === 0)
            return;
        if (!currentUser)
            return;
        const nowLabel = "Just now";
        // For each kid, find best zone status (inside beats near beats outside)
        kids.forEach(async (kid) => {
            // Skip kids without coordinates
            if (typeof kid.latitude !== "number" || typeof kid.longitude !== "number") {
                return;
            }
            let bestStatus = "alert";
            let inAnyZone = false;
            zones.forEach((zone) => {
                if (!zone.isActive)
                    return;
                const { status } = computeGeofenceStatus(kid.latitude, kid.longitude, zone.latitude, zone.longitude, zone.radius);
                const mapped = statusFromGeofence(status);
                if (mapped === "safe") {
                    bestStatus = "safe";
                    inAnyZone = true;
                }
                else if (mapped === "warning" && bestStatus !== "safe") {
                    bestStatus = "warning";
                }
            });
            // Only update if status changed
            if (kid.status !== bestStatus) {
                // For guardians, kids are actually monitored users in the "users" collection
                // For primary users, kids are in the "myG" collection
                if (currentUser?.role === "guardian") {
                    await updateUserLocation(kid.id, kid.latitude, kid.longitude, kid.location, bestStatus, nowLabel);
                }
                else {
                    await updateKid(kid.id, { status: bestStatus, lastSeen: nowLabel });
                }
                try {
                    const statusText = {
                        safe: "inside",
                        warning: "near",
                        alert: "outside",
                    };
                    const severityMap = {
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
                }
                catch (e) {
                    console.warn("Failed to log geofence activity", e);
                }
            }
        });
        // For each zone, update activeKids count
        zones.forEach(async (zone) => {
            if (!zone.isActive)
                return;
            const countInside = kids.filter((kid) => {
                const { status } = computeGeofenceStatus(kid.latitude, kid.longitude, zone.latitude, zone.longitude, zone.radius);
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
    const handleRemoveMonitored = async (user) => {
        if (!currentUser)
            return;
        const confirmed = window.confirm(`Stop monitoring ${user.displayName}?`);
        if (!confirmed)
            return;
        try {
            // update primary user's guardians list
            const primaryGuardians = user.guardians || [];
            const updatedPrimaryGuardians = primaryGuardians.filter((id) => id !== currentUser.id);
            await updateUserProfile(user.id, {
                guardians: updatedPrimaryGuardians,
            });
            // update guardian's monitoredUsers list
            const guardianMonitored = currentUser.monitoredUsers || [];
            const updatedGuardianMonitored = guardianMonitored.filter((id) => id !== user.id);
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
        }
        catch (err) {
            console.error("Failed to remove monitored user", err);
            toast({
                title: "Error",
                description: "Unable to remove monitored user. Please try again.",
                variant: "destructive",
            });
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-background via-background to-muted flex", children: [_jsx(AppSidebar, { activity: activity, open: sidebarOpen, onOpenChange: setSidebarOpen }), _jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [_jsx(Navbar, { showSidebarButton: isMobile, onOpenSidebar: () => setSidebarOpen(true) }), currentUser?.role === "primary" && pendingSafetyChecks.length > 0 && (_jsx(SafetyCheckPopup, { check: pendingSafetyChecks[0], onResponded: () => {
                            setPendingSafetyChecks((prev) => prev.slice(1));
                        } })), currentUser && (_jsx("section", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4", children: _jsx(InvitationList, { onRelationChanged: () => {
                                // refresh profile so that monitoredUsers updates and triggers
                                // the kids subscription reload in the other effect
                                getCurrentUserProfile().then(setCurrentUser);
                            } }) })), _jsxs("section", { className: "relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-primary/5 to-primary-glow/5 pointer-events-none" }), _jsx("div", { className: "relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12", children: _jsxs("div", { className: "grid lg:grid-cols-2 gap-12 items-center", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs(Badge, { className: "bg-gradient-to-r from-safe-zone to-safe-zone/80 text-white border-0", children: [_jsx(Shield, { className: "h-3 w-3 mr-1" }), "All G's Safe"] }), _jsxs("h1", { className: "text-4xl lg:text-5xl font-bold text-foreground leading-tight", children: ["Keep Your Family", " ", _jsx("span", { className: "bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent", children: "Safe & Connected" })] }), _jsx("p", { className: "text-xl text-muted-foreground", children: "Monitor your G's location with smart zone notifications and real-time safety updates." })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [_jsxs(Button, { variant: "zone", size: "lg", className: "text-base px-8", onClick: () => openLiveMap(null), children: [_jsx(MapPin, { className: "h-5 w-5" }), "View Live Map"] }), currentUser?.role === "primary" && (_jsxs(_Fragment, { children: [_jsx(InviteGuardianModal, { currentUserId: currentUser.id, currentUserEmail: currentUser.email, onInvitationSent: () => {
                                                                        // Refresh user profile
                                                                        getCurrentUserProfile().then(setCurrentUser);
                                                                    } }), _jsxs(Button, { variant: "outline", size: "lg", onClick: async () => {
                                                                        const result = await collectAndUpdateLocation(currentUser.id);
                                                                        if (result) {
                                                                            toast({
                                                                                title: "Location updated",
                                                                                description: result.address,
                                                                            });
                                                                        }
                                                                        else {
                                                                            toast({
                                                                                title: "Location Error",
                                                                                description: "Could not get your location. Check browser permissions.",
                                                                                variant: "destructive",
                                                                            });
                                                                        }
                                                                    }, className: "text-base px-8", children: [_jsx(MapPin, { className: "h-5 w-5" }), "Update My Location"] })] })), currentUser?.role === "guardian" && (_jsxs(_Fragment, { children: [_jsx(InvitePrimaryUserModal, { currentUserId: currentUser.id, currentUserEmail: currentUser.email, onInvitationSent: () => {
                                                                        // Refresh user profile
                                                                        getCurrentUserProfile().then(setCurrentUser);
                                                                    } }), _jsx(AddZoneModal, { buttonLabel: "Add Zone", onZoneAdded: () => {
                                                                        handleZoneUpdated();
                                                                        window.dispatchEvent(new Event("zone:refresh"));
                                                                    } })] }))] })] }), _jsx("div", { className: "relative", children: _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-background/20 to-transparent rounded-2xl pointer-events-none" }) })] }) })] }), _jsx("section", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: _jsx(QuickStats, { kids: kids, zones: zones }) }), _jsx("section", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12", children: _jsxs("div", { className: "grid lg:grid-cols-2 gap-8", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-foreground", children: currentUser?.role === "guardian" ? "Monitored Users" : "Your G's" }), _jsx("p", { className: "text-muted-foreground", children: currentUser?.role === "guardian"
                                                                ? "Users you're monitoring and protecting"
                                                                : "Real-time location and safety status" })] }), currentUser?.role === "guardian" ? (monitoredUsers.length > 0 && (_jsx("div", { className: "flex flex-col gap-3", children: monitoredUsers.map((user) => (_jsxs("div", { className: "flex items-center gap-3 p-3 border rounded-xl bg-card", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium", children: user.displayName }), _jsx("p", { className: "text-sm text-muted-foreground", children: user.email })] }), _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsxs(Button, { size: "sm", variant: "outline", onClick: () => openLiveMap(user.id), className: "gap-1", children: [_jsx(MapPin, { className: "h-4 w-4" }), "Map"] }), _jsx(InitiateSafetyCheck, { monitoredUser: user }), _jsxs(Button, { size: "sm", variant: "destructive", onClick: () => handleRemoveMonitored(user), className: "gap-1", children: [_jsx(Trash, { className: "h-4 w-4" }), "Delete"] })] })] }, user.id))) }))) : (
                                                /* PRIMARY USER VIEW */
                                                _jsx("div", { children: _jsx(AddKidModal, { onKidAdded: handleKidUpdated }) }))] }), _jsx("div", { className: "space-y-4", children: loading ? (_jsx("div", { className: "text-center py-8", children: _jsx("p", { className: "text-muted-foreground", children: "Loading G's..." }) })) : kids.length === 0 ? (_jsx("div", { className: "text-center py-8", children: _jsx("p", { className: "text-muted-foreground", children: "No G's added yet. Add your first G's!" }) })) : (kids.map((kid) => (_jsx(KidCard, { kid: kid, onKidUpdated: handleKidUpdated, onViewLiveMap: openLiveMap }, kid.id)))) })] }), _jsxs("div", { className: "flex flex-col space-y-6 h-full", children: [_jsxs("div", { className: "flex items-center justify-between shrink-0", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-foreground", children: "Safety Zones" }), _jsx("p", { className: "text-muted-foreground", children: "Manage location boundaries and notifications" })] }), currentUser?.role === "guardian" && (_jsx(AddZoneModal, { onZoneAdded: handleZoneUpdated }))] }), currentUser?.role === "guardian" && zones.length > 0 && (_jsx("div", { className: "shrink-0", children: _jsx(ZoneGroupManager, { zones: zones, onGroupUpdated: handleZoneUpdated }) })), _jsx("div", { className: "flex flex-col space-y-4 flex-1 overflow-y-auto", children: zonesLoading ? (_jsx("div", { className: "flex flex-col items-center justify-center py-8", children: _jsx("p", { className: "text-muted-foreground", children: "Loading zones..." }) })) : zones.length === 0 ? (_jsx("div", { className: "flex flex-col items-center justify-center py-8", children: _jsx("p", { className: "text-muted-foreground", children: "No zones created yet. Create your first zone!" }) })) : (zones.map((zone) => (_jsx(ZoneCard, { ...zone, onZoneUpdated: handleZoneUpdated }, zone.id)))) })] })] }) }), _jsx(LiveMapModal, { open: liveMapOpen, onOpenChange: setLiveMapOpen, kids: kids, zones: zones, focusKidId: liveMapFocusKidId }), _jsx(Toaster, {})] })] }));
};
export default Index;
