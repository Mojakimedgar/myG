/**
 * Firestore integration for route tracking
 * Handles persistence of recorded routes, deviations, and alerts
 */
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, limit, Timestamp, } from "firebase/firestore";
// ============ RECORDED ROUTES ============
/**
 * Save a recorded route to Firestore
 */
export const saveRecordedRoute = async (route) => {
    const routeData = {
        ...route,
        recordedAt: Timestamp.fromDate(route.recordedAt),
        routePoints: route.routePoints.map((p) => ({
            ...p,
            timestamp: Timestamp.fromDate(p.timestamp),
        })),
    };
    const docRef = await addDoc(collection(db, "routes_recorded"), routeData);
    return docRef.id;
};
/**
 * Get recorded routes for a specific kid and destination
 */
export const getRecordedRoutes = async (kidId, destinationId) => {
    let q = query(collection(db, "routes_recorded"), where("kidId", "==", kidId), orderBy("recordedAt", "desc"));
    if (destinationId) {
        q = query(collection(db, "routes_recorded"), where("kidId", "==", kidId), where("destinationId", "==", destinationId), orderBy("recordedAt", "desc"));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            recordedAt: data.recordedAt?.toDate?.() || new Date(),
            routePoints: data.routePoints.map((p) => ({
                ...p,
                timestamp: p.timestamp?.toDate?.() || new Date(),
            })),
        };
    });
};
/**
 * Get routes for a specific day of week
 */
export const getRoutesByDayOfWeek = async (kidId, destinationId, dayOfWeek) => {
    const q = query(collection(db, "routes_recorded"), where("kidId", "==", kidId), where("destinationId", "==", destinationId), where("dayOfWeek", "==", dayOfWeek), orderBy("recordedAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            recordedAt: data.recordedAt?.toDate?.() || new Date(),
            routePoints: data.routePoints.map((p) => ({
                ...p,
                timestamp: p.timestamp?.toDate?.() || new Date(),
            })),
        };
    });
};
/**
 * Get the most recent active route for a kid to a destination
 */
export const getMostConfidentRoute = async (kidId, destinationId) => {
    const q = query(collection(db, "routes_recorded"), where("kidId", "==", kidId), where("destinationId", "==", destinationId), where("isActive", "==", true), orderBy("confidence", "desc"), orderBy("recordedAt", "desc"), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty)
        return null;
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
        ...data,
        id: doc.id,
        recordedAt: data.recordedAt?.toDate?.() || new Date(),
        routePoints: data.routePoints.map((p) => ({
            ...p,
            timestamp: p.timestamp?.toDate?.() || new Date(),
        })),
    };
};
/**
 * Update a recorded route
 */
export const updateRecordedRoute = async (routeId, updates) => {
    const updateData = { ...updates };
    if (updates.recordedAt) {
        updateData.recordedAt = Timestamp.fromDate(updates.recordedAt);
    }
    if (updates.routePoints) {
        updateData.routePoints = updates.routePoints.map((p) => ({
            ...p,
            timestamp: Timestamp.fromDate(p.timestamp),
        }));
    }
    await updateDoc(doc(db, "routes_recorded", routeId), updateData);
};
/**
 * Delete a recorded route
 */
export const deleteRecordedRoute = async (routeId) => {
    await deleteDoc(doc(db, "routes_recorded", routeId));
};
// ============ ROUTE DEVIATIONS ============
/**
 * Save a route deviation alert
 */
export const saveRouteDeviation = async (deviation) => {
    const deviationData = {
        ...deviation,
        timestamp: Timestamp.fromDate(deviation.timestamp),
        currentLocation: {
            ...deviation.currentLocation,
            timestamp: Timestamp.fromDate(deviation.currentLocation.timestamp),
        },
        resolvedAt: deviation.resolvedAt
            ? Timestamp.fromDate(deviation.resolvedAt)
            : null,
    };
    const docRef = await addDoc(collection(db, "routes_deviations"), deviationData);
    return docRef.id;
};
/**
 * Get active deviations for a kid
 */
export const getActiveDeviations = async (kidId) => {
    const q = query(collection(db, "routes_deviations"), where("kidId", "==", kidId), where("isResolved", "==", false), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            timestamp: data.timestamp?.toDate?.() || new Date(),
            currentLocation: {
                ...data.currentLocation,
                timestamp: data.currentLocation?.timestamp?.toDate?.() || new Date(),
            },
            resolvedAt: data.resolvedAt?.toDate?.() || undefined,
        };
    });
};
/**
 * Get deviations for a specific recorded route
 */
export const getDeviationsForRoute = async (recordedRouteId) => {
    const q = query(collection(db, "routes_deviations"), where("recordedRouteId", "==", recordedRouteId), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            timestamp: data.timestamp?.toDate?.() || new Date(),
            currentLocation: {
                ...data.currentLocation,
                timestamp: data.currentLocation?.timestamp?.toDate?.() || new Date(),
            },
            resolvedAt: data.resolvedAt?.toDate?.() || undefined,
        };
    });
};
/**
 * Mark a deviation as resolved
 */
export const resolveDeviation = async (deviationId) => {
    await updateDoc(doc(db, "routes_deviations", deviationId), {
        isResolved: true,
        resolvedAt: Timestamp.now(),
    });
};
// ============ ROUTE ALERTS ============
/**
 * Create a route alert to notify trackers
 */
export const createRouteAlert = async (alert) => {
    const alertData = {
        ...alert,
        timestamp: Timestamp.fromDate(alert.timestamp),
        actionedAt: alert.actionedAt
            ? Timestamp.fromDate(alert.actionedAt)
            : null,
    };
    const docRef = await addDoc(collection(db, "routes_alerts"), alertData);
    return docRef.id;
};
/**
 * Get unread alerts for a tracker
 */
export const getUnreadAlertsForTracker = async (trackerId) => {
    const q = query(collection(db, "routes_alerts"), where("trackerId", "==", trackerId), where("read", "==", false), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            timestamp: data.timestamp?.toDate?.() || new Date(),
            actionedAt: data.actionedAt?.toDate?.() || undefined,
        };
    });
};
/**
 * Get all alerts for a tracker (read and unread)
 */
export const getAlertsForTracker = async (trackerId, limitCount = 50) => {
    const q = query(collection(db, "routes_alerts"), where("trackerId", "==", trackerId), orderBy("timestamp", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            timestamp: data.timestamp?.toDate?.() || new Date(),
            actionedAt: data.actionedAt?.toDate?.() || undefined,
        };
    });
};
/**
 * Mark an alert as read
 */
export const markAlertAsRead = async (alertId) => {
    await updateDoc(doc(db, "routes_alerts", alertId), {
        read: true,
    });
};
/**
 * Update alert action
 */
export const updateAlertAction = async (alertId, action) => {
    await updateDoc(doc(db, "routes_alerts", alertId), {
        action,
        actionedAt: Timestamp.now(),
    });
};
// ============ ACTIVE ROUTES ============
/**
 * Save an active route being tracked in real-time
 */
export const saveActiveRoute = async (route) => {
    const routeData = {
        ...route,
        startTime: Timestamp.fromDate(route.startTime),
        startLocation: {
            ...route.startLocation,
            timestamp: Timestamp.fromDate(route.startLocation.timestamp),
        },
        currentLocation: {
            ...route.currentLocation,
            timestamp: Timestamp.fromDate(route.currentLocation.timestamp),
        },
        deviations: route.deviations.map((d) => ({
            ...d,
            timestamp: Timestamp.fromDate(d.timestamp),
            currentLocation: {
                ...d.currentLocation,
                timestamp: Timestamp.fromDate(d.currentLocation.timestamp),
            },
            resolvedAt: d.resolvedAt ? Timestamp.fromDate(d.resolvedAt) : null,
        })),
        completedAt: route.completedAt
            ? Timestamp.fromDate(route.completedAt)
            : null,
    };
    const docRef = await addDoc(collection(db, "routes_active"), routeData);
    return docRef.id;
};
/**
 * Get active (ongoing) routes for a kid
 */
export const getActiveRoutesForKid = async (kidId) => {
    const q = query(collection(db, "routes_active"), where("kidId", "==", kidId), where("isActive", "==", true), orderBy("startTime", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            startTime: data.startTime?.toDate?.() || new Date(),
            startLocation: {
                ...data.startLocation,
                timestamp: data.startLocation?.timestamp?.toDate?.() || new Date(),
            },
            currentLocation: {
                ...data.currentLocation,
                timestamp: data.currentLocation?.timestamp?.toDate?.() || new Date(),
            },
            deviations: (data.deviations || []).map((d) => ({
                ...d,
                timestamp: d.timestamp?.toDate?.() || new Date(),
                currentLocation: {
                    ...d.currentLocation,
                    timestamp: d.currentLocation?.timestamp?.toDate?.() || new Date(),
                },
                resolvedAt: d.resolvedAt?.toDate?.() || undefined,
            })),
            completedAt: data.completedAt?.toDate?.() || undefined,
        };
    });
};
/**
 * Update an active route
 */
export const updateActiveRoute = async (routeId, updates) => {
    const updateData = { ...updates };
    if (updates.startTime) {
        updateData.startTime = Timestamp.fromDate(updates.startTime);
    }
    if (updates.currentLocation) {
        updateData.currentLocation = {
            ...updates.currentLocation,
            timestamp: Timestamp.fromDate(updates.currentLocation.timestamp),
        };
    }
    if (updates.completedAt) {
        updateData.completedAt = Timestamp.fromDate(updates.completedAt);
    }
    await updateDoc(doc(db, "routes_active", routeId), updateData);
};
