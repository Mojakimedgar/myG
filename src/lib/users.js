import { db } from "./firebase";
import { collection, doc, getDoc, setDoc, updateDoc, getDocs, query, where, onSnapshot, } from "firebase/firestore";
function toDateSafe(value) {
    if (typeof value === "object" &&
        value !== null &&
        "toDate" in value &&
        typeof value.toDate === "function") {
        return value.toDate();
    }
    if (typeof value === "string" || typeof value === "number") {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime()))
            return parsed;
    }
    return new Date();
}
function readNumber(value, fallback = 0) {
    return typeof value === "number" ? value : fallback;
}
function readString(value, fallback = "") {
    return typeof value === "string" ? value : fallback;
}
// CREATE USER PROFILE
export const createUserProfile = async (userId, userData) => {
    const now = new Date();
    const userProfile = {
        id: userId,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        subscriptionTier: userData.subscriptionTier || "free",
        hasChosenPlan: userData.hasChosenPlan ?? false,
        avatar: userData.avatar || "",
        // Always store arrays so we never write undefined (which Firestore rejects)
        guardians: [],
        monitoredUsers: [],
        createdAt: now,
        updatedAt: now,
    };
    await setDoc(doc(db, "users", userId), userProfile);
};
// GET USER PROFILE
export const getUserProfile = async (userId) => {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        return null;
    }
    const data = docSnap.data();
    return {
        id: docSnap.id,
        email: readString(data.email),
        displayName: readString(data.displayName),
        role: data.role || "primary",
        subscriptionTier: data.subscriptionTier || "free",
        hasChosenPlan: typeof data.hasChosenPlan === "boolean" ? data.hasChosenPlan : false,
        avatar: readString(data.avatar),
        guardians: Array.isArray(data.guardians) ? data.guardians : [],
        monitoredUsers: Array.isArray(data.monitoredUsers) ? data.monitoredUsers : [],
        latitude: typeof data.latitude === "number" ? data.latitude : undefined,
        longitude: typeof data.longitude === "number" ? data.longitude : undefined,
        location: readString(data.location),
        status: data.status || undefined,
        lastSeen: readString(data.lastSeen),
        zonesCount: readNumber(data.zonesCount),
        createdAt: toDateSafe(data.createdAt),
        updatedAt: toDateSafe(data.updatedAt),
    };
};
// UPDATE USER PROFILE
export const updateUserProfile = async (userId, data) => {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, {
        ...data,
        updatedAt: new Date(),
    });
};
// GET USERS BY ROLE
export const getUsersByRole = async (role) => {
    const q = query(collection(db, "users"), where("role", "==", role));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            email: readString(data.email),
            displayName: readString(data.displayName),
            role: data.role || "primary",
            subscriptionTier: data.subscriptionTier || "free",
            hasChosenPlan: typeof data.hasChosenPlan === "boolean" ? data.hasChosenPlan : false,
            avatar: readString(data.avatar),
            guardians: Array.isArray(data.guardians) ? data.guardians : [],
            monitoredUsers: Array.isArray(data.monitoredUsers) ? data.monitoredUsers : [],
            createdAt: toDateSafe(data.createdAt),
            updatedAt: toDateSafe(data.updatedAt),
        };
    });
};
// SUBSCRIBE TO USER PROFILE
export const subscribeUserProfile = (userId, onChange) => {
    const docRef = doc(db, "users", userId);
    return onSnapshot(docRef, (docSnap) => {
        if (!docSnap.exists()) {
            onChange(null);
            return;
        }
        const data = docSnap.data();
        onChange({
            id: docSnap.id,
            email: readString(data.email),
            displayName: readString(data.displayName),
            role: data.role || "primary",
            subscriptionTier: data.subscriptionTier || "free",
            hasChosenPlan: typeof data.hasChosenPlan === "boolean" ? data.hasChosenPlan : false,
            avatar: readString(data.avatar),
            guardians: Array.isArray(data.guardians) ? data.guardians : [],
            monitoredUsers: Array.isArray(data.monitoredUsers) ? data.monitoredUsers : [],
            createdAt: toDateSafe(data.createdAt),
            updatedAt: toDateSafe(data.updatedAt),
        });
    });
};
