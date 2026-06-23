/**
 * Location collection utilities for primary users.
 * Collects accurate GPS coordinates, reverses geocode to address,
 * handles offline caching, and writes to Firestore.
 */
import { cacheLocation } from "./offline";
import { updateUserLocation } from "./firestore";
const NOMINATIM_HEADERS = {
    "User-Agent": "MyG-App",
    "Accept-Language": "en",
};
/** Re-export comprehensive SA address search */
export { searchAddressSuggestions, geocodeTypedAddress, resolveGooglePlace, needsPlaceResolution, isGooglePlacesConfigured, } from "@/lib/address-search";
/**
 * Reverse geocode coordinates using OpenStreetMap Nominatim API (free, no key required).
 * Falls back to a simple coordinate display if the request fails.
 */
export async function reverseGeocode(latitude, longitude) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, { headers: NOMINATIM_HEADERS });
        if (!response.ok) {
            throw new Error(`Nominatim responded with ${response.status}`);
        }
        const data = await response.json();
        const address = data.address || {};
        const displayName = data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        return {
            address: displayName,
            city: address.city || address.town || address.village,
            country: address.country,
        };
    }
    catch (error) {
        console.warn("Reverse geocoding failed, using coordinates only", error);
        return {
            address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        };
    }
}
/**
 * Collect current position with high accuracy, reverse geocode it,
 * cache locally for offline sync, and write to Firestore.
 */
export async function collectAndUpdateLocation(userId) {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.warn("Geolocation not available");
            resolve(null);
            return;
        }
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const { latitude, longitude, accuracy } = pos.coords;
                console.log(`Location collected: ${latitude}, ${longitude} (±${accuracy}m)`);
                // Cache locally for offline sync
                cacheLocation(userId, latitude, longitude);
                // Get address via reverse geocoding
                const { address } = await reverseGeocode(latitude, longitude);
                // Write to Firestore
                await updateUserLocation(userId, latitude, longitude, address, undefined, "Just now");
                resolve({ latitude, longitude, address });
            }
            catch (e) {
                console.error("Failed to process location update", e);
                resolve(null);
            }
        }, (err) => {
            console.warn("Geolocation error", err.message);
            resolve(null);
        }, {
            enableHighAccuracy: true, // use GPS/cell triangulation for best accuracy
            maximumAge: 0, // get fresh location every time
            timeout: 30000, // 30 second timeout
        });
    });
}
/**
 * Start continuous location tracking for a primary user.
 * Updates location every 30 seconds or when accuracy improves.
 * Handles offline caching and background updates gracefully.
 */
export function startLocationTracking(userId, onUpdate, onError) {
    if (!navigator.geolocation) {
        onError?.("Geolocation not available in this browser");
        return () => { };
    }
    let watchId = null;
    let lastUpdate = 0;
    const MIN_UPDATE_INTERVAL = 30000; // 30 seconds minimum between updates
    const handlePosition = async (pos) => {
        const now = Date.now();
        // Rate limit updates to avoid excessive Firestore writes
        if (now - lastUpdate < MIN_UPDATE_INTERVAL) {
            return;
        }
        lastUpdate = now;
        const { latitude, longitude, accuracy } = pos.coords;
        console.log(`[Location] ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${accuracy.toFixed(0)}m)`);
        try {
            // Cache for offline
            cacheLocation(userId, latitude, longitude);
            // Reverse geocode
            const { address } = await reverseGeocode(latitude, longitude);
            // Update Firestore
            await updateUserLocation(userId, latitude, longitude, address, undefined, new Date().toLocaleTimeString());
            onUpdate?.(latitude, longitude, address);
        }
        catch (e) {
            console.error("Failed to update location", e);
            onError?.(e instanceof Error ? e.message : "Unknown error");
        }
    };
    const handleError = (err) => {
        const messages = {
            1: "Location permission denied. Please enable location access in settings.",
            2: "Location is unavailable. Check GPS/network.",
            3: "Location request timed out.",
        };
        const msg = messages[err.code] || `Geolocation error: ${err.message}`;
        console.warn(msg);
        onError?.(msg);
    };
    // Use watchPosition with high accuracy for continuous updates
    watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
        enableHighAccuracy: true,
        maximumAge: 5000, // reuse position if less than 5 seconds old
        timeout: 30000,
    });
    // Return cleanup function
    return () => {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            console.log("Location tracking stopped");
        }
    };
}
