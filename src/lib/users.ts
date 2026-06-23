import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { User, CreateUserData, UpdateUserData, UserRole } from "@/types/user";

function toDateSafe(value: unknown): Date {
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in (value as { toDate?: unknown }) &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : fallback;
}

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

// CREATE USER PROFILE
export const createUserProfile = async (userId: string, userData: CreateUserData): Promise<void> => {
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
export const getUserProfile = async (userId: string): Promise<User | null> => {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  const data = docSnap.data() as Record<string, unknown>;
  return {
    id: docSnap.id,
    email: readString(data.email),
    displayName: readString(data.displayName),
    role: (data.role as UserRole) || "primary",
    subscriptionTier: (data.subscriptionTier as "free" | "premium") || "free",
    hasChosenPlan: typeof data.hasChosenPlan === "boolean" ? (data.hasChosenPlan as boolean) : false,
    avatar: readString(data.avatar),
    guardians: Array.isArray(data.guardians) ? (data.guardians as string[]) : [],
    monitoredUsers: Array.isArray(data.monitoredUsers) ? (data.monitoredUsers as string[]) : [],
    latitude: typeof data.latitude === "number" ? (data.latitude as number) : undefined,
    longitude: typeof data.longitude === "number" ? (data.longitude as number) : undefined,
    location: readString(data.location),
    status: (data.status as "safe" | "warning" | "alert") || undefined,
    lastSeen: readString(data.lastSeen),
    zonesCount: readNumber(data.zonesCount),
    createdAt: toDateSafe(data.createdAt),
    updatedAt: toDateSafe(data.updatedAt),
  };
};

// UPDATE USER PROFILE
export const updateUserProfile = async (userId: string, data: UpdateUserData): Promise<void> => {
  const docRef = doc(db, "users", userId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date(),
  });
};

// GET USERS BY ROLE
export const getUsersByRole = async (role: UserRole): Promise<User[]> => {
  const q = query(collection(db, "users"), where("role", "==", role));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as Record<string, unknown>;
    return {
      id: docSnap.id,
      email: readString(data.email),
      displayName: readString(data.displayName),
      role: (data.role as UserRole) || "primary",
      subscriptionTier: (data.subscriptionTier as "free" | "premium") || "free",
      hasChosenPlan: typeof data.hasChosenPlan === "boolean" ? (data.hasChosenPlan as boolean) : false,
      avatar: readString(data.avatar),
      guardians: Array.isArray(data.guardians) ? (data.guardians as string[]) : [],
      monitoredUsers: Array.isArray(data.monitoredUsers) ? (data.monitoredUsers as string[]) : [],
      createdAt: toDateSafe(data.createdAt),
      updatedAt: toDateSafe(data.updatedAt),
    };
  });
};

// SUBSCRIBE TO USER PROFILE
export const subscribeUserProfile = (userId: string, onChange: (user: User | null) => void) => {
  const docRef = doc(db, "users", userId);
  return onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists()) {
      onChange(null);
      return;
    }
    
    const data = docSnap.data() as Record<string, unknown>;
    onChange({
      id: docSnap.id,
      email: readString(data.email),
      displayName: readString(data.displayName),
      role: (data.role as UserRole) || "primary",
      subscriptionTier: (data.subscriptionTier as "free" | "premium") || "free",
      hasChosenPlan: typeof data.hasChosenPlan === "boolean" ? (data.hasChosenPlan as boolean) : false,
      avatar: readString(data.avatar),
      guardians: Array.isArray(data.guardians) ? (data.guardians as string[]) : [],
      monitoredUsers: Array.isArray(data.monitoredUsers) ? (data.monitoredUsers as string[]) : [],
      createdAt: toDateSafe(data.createdAt),
      updatedAt: toDateSafe(data.updatedAt),
    });
  });
};
