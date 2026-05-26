// Offline support with local caching and sync
import { db } from "./firebase";
import { enableIndexedDbPersistence } from "firebase/firestore";

// Enable offline persistence
let persistenceEnabled = false;

export const enableOfflinePersistence = async () => {
  if (persistenceEnabled) return;
  
  try {
    await enableIndexedDbPersistence(db);
    persistenceEnabled = true;
    console.log("Offline persistence enabled");
  } catch (error: any) {
    if (error.code === "failed-precondition") {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn("Offline persistence already enabled in another tab");
    } else if (error.code === "unimplemented") {
      // Browser doesn't support offline persistence
      console.warn("Browser doesn't support offline persistence");
    } else {
      console.error("Failed to enable offline persistence:", error);
    }
  }
};

// Cache location data locally
const LOCATION_CACHE_KEY = "myg_location_cache";

export interface CachedLocation {
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

export const cacheLocation = (userId: string, latitude: number, longitude: number) => {
  try {
    const cached = localStorage.getItem(LOCATION_CACHE_KEY);
    const locations: CachedLocation[] = cached ? JSON.parse(cached) : [];
    
    // Remove old entries for this user
    const filtered = locations.filter((loc) => loc.userId !== userId);
    
    // Add new location
    filtered.push({
      userId,
      latitude,
      longitude,
      timestamp: Date.now(),
    });
    
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to cache location:", error);
  }
};

export const getCachedLocations = (): CachedLocation[] => {
  try {
    const cached = localStorage.getItem(LOCATION_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error("Failed to get cached locations:", error);
    return [];
  }
};

export const clearLocationCache = (userId?: string) => {
  try {
    if (userId) {
      const cached = localStorage.getItem(LOCATION_CACHE_KEY);
      const locations: CachedLocation[] = cached ? JSON.parse(cached) : [];
      const filtered = locations.filter((loc) => loc.userId !== userId);
      localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(filtered));
    } else {
      localStorage.removeItem(LOCATION_CACHE_KEY);
    }
  } catch (error) {
    console.error("Failed to clear location cache:", error);
  }
};

// Queue alerts for when online
const ALERT_QUEUE_KEY = "myg_alert_queue";

export interface QueuedAlert {
  type: string;
  message: string;
  timestamp: number;
  data?: any;
}

export const queueAlert = (type: string, message: string, data?: any) => {
  try {
    const queue = localStorage.getItem(ALERT_QUEUE_KEY);
    const alerts: QueuedAlert[] = queue ? JSON.parse(queue) : [];
    
    alerts.push({
      type,
      message,
      timestamp: Date.now(),
      data,
    });
    
    localStorage.setItem(ALERT_QUEUE_KEY, JSON.stringify(alerts));
  } catch (error) {
    console.error("Failed to queue alert:", error);
  }
};

export const getQueuedAlerts = (): QueuedAlert[] => {
  try {
    const queue = localStorage.getItem(ALERT_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error("Failed to get queued alerts:", error);
    return [];
  }
};

export const clearQueuedAlerts = () => {
  try {
    localStorage.removeItem(ALERT_QUEUE_KEY);
  } catch (error) {
    console.error("Failed to clear queued alerts:", error);
  }
};

// Network status monitoring
export const isOnline = (): boolean => {
  return navigator.onLine;
};

export const onOnlineStatusChange = (callback: (isOnline: boolean) => void) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
};
