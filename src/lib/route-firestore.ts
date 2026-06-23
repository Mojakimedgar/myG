/**
 * Firestore integration for route tracking
 * Handles persistence of recorded routes, deviations, and alerts
 */

import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import {
  RecordedRoute,
  RouteDeviation,
  ActiveRoute,
  RouteAlert,
} from "@/types/route";

// ============ RECORDED ROUTES ============

/**
 * Save a recorded route to Firestore
 */
export const saveRecordedRoute = async (route: RecordedRoute): Promise<string> => {
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
export const getRecordedRoutes = async (
  kidId: string,
  destinationId?: string
): Promise<RecordedRoute[]> => {
  let q = query(
    collection(db, "routes_recorded"),
    where("kidId", "==", kidId),
    orderBy("recordedAt", "desc")
  );

  if (destinationId) {
    q = query(
      collection(db, "routes_recorded"),
      where("kidId", "==", kidId),
      where("destinationId", "==", destinationId),
      orderBy("recordedAt", "desc")
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      ...data,
      id: doc.id,
      recordedAt: data.recordedAt?.toDate?.() || new Date(),
      routePoints: data.routePoints.map((p: any) => ({
        ...p,
        timestamp: p.timestamp?.toDate?.() || new Date(),
      })),
    } as RecordedRoute;
  });
};

/**
 * Get routes for a specific day of week
 */
export const getRoutesByDayOfWeek = async (
  kidId: string,
  destinationId: string,
  dayOfWeek: number
): Promise<RecordedRoute[]> => {
  const q = query(
    collection(db, "routes_recorded"),
    where("kidId", "==", kidId),
    where("destinationId", "==", destinationId),
    where("dayOfWeek", "==", dayOfWeek),
    orderBy("recordedAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      ...data,
      id: doc.id,
      recordedAt: data.recordedAt?.toDate?.() || new Date(),
      routePoints: data.routePoints.map((p: any) => ({
        ...p,
        timestamp: p.timestamp?.toDate?.() || new Date(),
      })),
    } as RecordedRoute;
  });
};

/**
 * Get the most recent active route for a kid to a destination
 */
export const getMostConfidentRoute = async (
  kidId: string,
  destinationId: string
): Promise<RecordedRoute | null> => {
  const q = query(
    collection(db, "routes_recorded"),
    where("kidId", "==", kidId),
    where("destinationId", "==", destinationId),
    where("isActive", "==", true),
    orderBy("confidence", "desc"),
    orderBy("recordedAt", "desc"),
    limit(1)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data() as any;
  return {
    ...data,
    id: doc.id,
    recordedAt: data.recordedAt?.toDate?.() || new Date(),
    routePoints: data.routePoints.map((p: any) => ({
      ...p,
      timestamp: p.timestamp?.toDate?.() || new Date(),
    })),
  } as RecordedRoute;
};

/**
 * Update a recorded route
 */
export const updateRecordedRoute = async (
  routeId: string,
  updates: Partial<RecordedRoute>
): Promise<void> => {
  const updateData = { ...updates };
  if (updates.recordedAt) {
    (updateData as any).recordedAt = Timestamp.fromDate(updates.recordedAt);
  }
  if (updates.routePoints) {
    (updateData as any).routePoints = updates.routePoints.map((p) => ({
      ...p,
      timestamp: Timestamp.fromDate(p.timestamp),
    }));
  }

  await updateDoc(doc(db, "routes_recorded", routeId), updateData);
};

/**
 * Delete a recorded route
 */
export const deleteRecordedRoute = async (routeId: string): Promise<void> => {
  await deleteDoc(doc(db, "routes_recorded", routeId));
};

// ============ ROUTE DEVIATIONS ============

/**
 * Save a route deviation alert
 */
export const saveRouteDeviation = async (
  deviation: RouteDeviation
): Promise<string> => {
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

  const docRef = await addDoc(
    collection(db, "routes_deviations"),
    deviationData
  );
  return docRef.id;
};

/**
 * Get active deviations for a kid
 */
export const getActiveDeviations = async (
  kidId: string
): Promise<RouteDeviation[]> => {
  const q = query(
    collection(db, "routes_deviations"),
    where("kidId", "==", kidId),
    where("isResolved", "==", false),
    orderBy("timestamp", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      ...data,
      id: doc.id,
      timestamp: data.timestamp?.toDate?.() || new Date(),
      currentLocation: {
        ...data.currentLocation,
        timestamp: data.currentLocation?.timestamp?.toDate?.() || new Date(),
      },
      resolvedAt: data.resolvedAt?.toDate?.() || undefined,
    } as RouteDeviation;
  });
};

/**
 * Get deviations for a specific recorded route
 */
export const getDeviationsForRoute = async (
  recordedRouteId: string
): Promise<RouteDeviation[]> => {
  const q = query(
    collection(db, "routes_deviations"),
    where("recordedRouteId", "==", recordedRouteId),
    orderBy("timestamp", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      ...data,
      id: doc.id,
      timestamp: data.timestamp?.toDate?.() || new Date(),
      currentLocation: {
        ...data.currentLocation,
        timestamp: data.currentLocation?.timestamp?.toDate?.() || new Date(),
      },
      resolvedAt: data.resolvedAt?.toDate?.() || undefined,
    } as RouteDeviation;
  });
};

/**
 * Mark a deviation as resolved
 */
export const resolveDeviation = async (
  deviationId: string
): Promise<void> => {
  await updateDoc(doc(db, "routes_deviations", deviationId), {
    isResolved: true,
    resolvedAt: Timestamp.now(),
  });
};

// ============ ROUTE ALERTS ============

/**
 * Create a route alert to notify trackers
 */
export const createRouteAlert = async (
  alert: RouteAlert
): Promise<string> => {
  const alertData = {
    ...alert,
    timestamp: Timestamp.fromDate(alert.timestamp),
    actionedAt: alert.actionedAt
      ? Timestamp.fromDate(alert.actionedAt)
      : null,
  };

  const docRef = await addDoc(
    collection(db, "routes_alerts"),
    alertData
  );
  return docRef.id;
};

/**
 * Get unread alerts for a tracker
 */
export const getUnreadAlertsForTracker = async (
  trackerId: string
): Promise<RouteAlert[]> => {
  const q = query(
    collection(db, "routes_alerts"),
    where("trackerId", "==", trackerId),
    where("read", "==", false),
    orderBy("timestamp", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      ...data,
      id: doc.id,
      timestamp: data.timestamp?.toDate?.() || new Date(),
      actionedAt: data.actionedAt?.toDate?.() || undefined,
    } as RouteAlert;
  });
};

/**
 * Get all alerts for a tracker (read and unread)
 */
export const getAlertsForTracker = async (
  trackerId: string,
  limitCount: number = 50
): Promise<RouteAlert[]> => {
  const q = query(
    collection(db, "routes_alerts"),
    where("trackerId", "==", trackerId),
    orderBy("timestamp", "desc"),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      ...data,
      id: doc.id,
      timestamp: data.timestamp?.toDate?.() || new Date(),
      actionedAt: data.actionedAt?.toDate?.() || undefined,
    } as RouteAlert;
  });
};

/**
 * Mark an alert as read
 */
export const markAlertAsRead = async (alertId: string): Promise<void> => {
  await updateDoc(doc(db, "routes_alerts", alertId), {
    read: true,
  });
};

/**
 * Update alert action
 */
export const updateAlertAction = async (
  alertId: string,
  action: "reroute" | "continue" | "investigate"
): Promise<void> => {
  await updateDoc(doc(db, "routes_alerts", alertId), {
    action,
    actionedAt: Timestamp.now(),
  });
};

// ============ ACTIVE ROUTES ============

/**
 * Save an active route being tracked in real-time
 */
export const saveActiveRoute = async (
  route: ActiveRoute
): Promise<string> => {
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

  const docRef = await addDoc(
    collection(db, "routes_active"),
    routeData
  );
  return docRef.id;
};

/**
 * Get active (ongoing) routes for a kid
 */
export const getActiveRoutesForKid = async (
  kidId: string
): Promise<ActiveRoute[]> => {
  const q = query(
    collection(db, "routes_active"),
    where("kidId", "==", kidId),
    where("isActive", "==", true),
    orderBy("startTime", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as any;
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
      deviations: (data.deviations || []).map((d: any) => ({
        ...d,
        timestamp: d.timestamp?.toDate?.() || new Date(),
        currentLocation: {
          ...d.currentLocation,
          timestamp: d.currentLocation?.timestamp?.toDate?.() || new Date(),
        },
        resolvedAt: d.resolvedAt?.toDate?.() || undefined,
      })),
      completedAt: data.completedAt?.toDate?.() || undefined,
    } as ActiveRoute;
  });
};

/**
 * Update an active route
 */
export const updateActiveRoute = async (
  routeId: string,
  updates: Partial<ActiveRoute>
): Promise<void> => {
  const updateData = { ...updates };
  if (updates.startTime) {
    (updateData as any).startTime = Timestamp.fromDate(updates.startTime);
  }
  if (updates.currentLocation) {
    (updateData as any).currentLocation = {
      ...updates.currentLocation,
      timestamp: Timestamp.fromDate(updates.currentLocation.timestamp),
    };
  }
  if (updates.completedAt) {
    (updateData as any).completedAt = Timestamp.fromDate(updates.completedAt);
  }

  await updateDoc(doc(db, "routes_active", routeId), updateData);
};
