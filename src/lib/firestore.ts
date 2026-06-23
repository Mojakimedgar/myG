import { db } from "@/lib/firebase";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/auth";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot, query, where,orderBy,
  limit
} from "firebase/firestore";
import { Kid, CreateKidData, UpdateKidData } from "@/types/kids";
import { Zone, CreateZoneData, UpdateZoneData, ZoneType} from "@/types/zone";
import { Activity, CreateActivityData } from "@/types/activity";
import { User, UserRole } from "@/types/user";
import { calculateKidStatus, getKidZonesCount } from "@/lib/zone-detection";


type FirestoreTimestampLike = { toDate: () => Date };

function toDateSafe(value: unknown): Date {
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in (value as { toDate?: unknown }) &&
    typeof (value as FirestoreTimestampLike).toDate === "function"
  ) {
    return (value as FirestoreTimestampLike).toDate();
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : fallback;
}

function readBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

// ZONE CRUD OPERATIONS

// CREATE ZONE
export const addZone = async (zoneData: CreateZoneData) => {
  const now = new Date();
  const zoneWithDefaults = {
    name: zoneData.name,
    address: zoneData.address,
    latitude: typeof zoneData.latitude === "number" ? zoneData.latitude : null,
    longitude: typeof zoneData.longitude === "number" ? zoneData.longitude : null,
    radius: zoneData.radius,
    type: zoneData.type,
    // persist custom label if provided
    customLabel: typeof zoneData.customLabel === "string" ? zoneData.customLabel : undefined,
    activeKids: 0,
    totalKids: typeof zoneData.totalKids === "number" ? zoneData.totalKids : 0,
    isActive: zoneData.isActive ?? true,
    createdBy: zoneData.createdBy || "",
    groupId: zoneData.groupId ?? undefined,
    activeHours: zoneData.activeHours ?? undefined,
    createdAt: now,
    updatedAt: now,
  };
  // Remove any keys with undefined values to avoid Firestore rejecting the document
  Object.keys(zoneWithDefaults).forEach((k) => {
    // @ts-ignore
    if (zoneWithDefaults[k] === undefined) delete zoneWithDefaults[k];
  });
  const docRef = await addDoc(collection(db, "zones"), zoneWithDefaults);
  try {
    await addActivity({
      type: "zone",
      action: "created",
      message: `Created zone ${zoneData.name}`,
      zoneId: docRef.id,
      severity: "info",
    });
  } catch (e) {
    console.warn("Failed to log activity for zone creation", e);
  }
  return docRef.id;
};

// READ ZONES
export const getZones = async (userIdOrUndefined?: string): Promise<Zone[]> => {
  // If no userId provided, try to get current user
  const userId = userIdOrUndefined || getCurrentUser()?.uid;
  
  if (!userId) return [];
  
  const q = query(collection(db, "zones"), where("createdBy", "==", userId));
  const snapshot = await getDocs(q);
  const zones: Zone[] = [];
  snapshot.docs.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    if (data.name && data.address && typeof data.radius !== "undefined" && data.type) {
      zones.push({
        id: d.id,
        name: readString(data.name),
        address: readString(data.address),
        latitude: typeof data.latitude === "number" ? (data.latitude as number) : undefined,
        longitude: typeof data.longitude === "number" ? (data.longitude as number) : undefined,
        radius: readNumber(data.radius),
        type: (data.type as ZoneType) ?? "custom",
        // include optional custom label
        customLabel: typeof data.customLabel === "string" ? (data.customLabel as string) : undefined,
        activeKids: readNumber(data.activeKids),
        totalKids: readNumber(data.totalKids),
        isActive: readBoolean(data.isActive, true),
        groupId: typeof data.groupId === "string" ? data.groupId : undefined,
        activeHours: data.activeHours as Zone["activeHours"],
        createdBy: readString(data.createdBy),
        createdAt: toDateSafe((data as Record<string, unknown>).createdAt),
        // If createdAt missing, still provide a Date to avoid runtime issues
      } as Zone);
    }
  });
  return zones;
};

// UPDATE ZONE
export const updateZone = async (id: string, data: UpdateZoneData) => {
  const docRef = doc(db, "zones", id);
  
  // Filter out undefined values and other UI-only fields
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  Object.keys(data).forEach((key) => {
    const val = (data as Record<string, unknown>)[key];
    if (val !== undefined && key !== "status") { // status is UI-only, not persisted
      updateData[key] = val;
    }
  });
  
  await updateDoc(docRef, updateData);
  try {
    await addActivity({
      type: "zone",
      action: "updated",
      message: `Updated zone ${data.name ?? id}`,
      zoneId: id,
      severity: "info",
    });
  } catch (e) {
    console.warn("Failed to log activity for zone update", e);
  }
};

// DELETE ZONE
export const deleteZone = async (id: string) => {
  const docRef = doc(db, "zones", id);
  await deleteDoc(docRef);
  try {
    await addActivity({
      type: "zone",
      action: "deleted",
      message: `Deleted zone ${id}`,
      zoneId: id,
      severity: "danger",
    });
  } catch (e) {
    console.warn("Failed to log activity for zone deletion", e);
  }
};

// KID CRUD OPERATIONS

// CREATE KID
export const addKid = async (kidData: CreateKidData) => {
  const now = new Date();
  const kidWithDefaults = {
    name: kidData.name,
    age: kidData.age,
    location: kidData.location,
    latitude: typeof kidData.latitude === "number" ? kidData.latitude : null,
    longitude: typeof kidData.longitude === "number" ? kidData.longitude : null,
    avatar: kidData.avatar || "",
    phoneNumber: kidData.phoneNumber || "",
    // Ensure the kid is associated with the creating user (parent/owner)
    parentId: kidData.parentId || getCurrentUser()?.uid || "",
    status: "safe" as const,
    lastSeen: "Just now",
    zonesCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  
  const docRef = await addDoc(collection(db, "myG"), kidWithDefaults);
  try {
    await addActivity({
      type: "kid",
      action: "created",
      message: `Added kid ${kidData.name}`,
      kidId: docRef.id,
      severity: "safe",
    });
  } catch (e) {
    console.warn("Failed to log activity for kid creation", e);
  }
  return docRef.id;
};

// READ KIDS
// Helper that builds a query for one or more parent ids while respecting
// Firestore's limit of 10 values in an "in" clause by chunking if necessary.
async function fetchKidsByParents(parentIds: string[]): Promise<Kid[]> {
  if (parentIds.length === 0) {
    return [];
  }

  const chunks: string[][] = [];
  for (let i = 0; i < parentIds.length; i += 10) {
    chunks.push(parentIds.slice(i, i + 10));
  }

  const kids: Kid[] = [];

  for (const chunk of chunks) {
    const q = query(
      collection(db, "myG"),
      where("parentId", "in", chunk)
    );

    const snapshot = await getDocs(q);
    snapshot.docs.forEach((doc) => {
      const data = doc.data() as Record<string, unknown>;
      if (data.name && data.age && data.location) {
        kids.push({
          id: doc.id,
          name: readString(data.name),
          age: readNumber(data.age),
          status: (data.status as "safe" | "warning" | "alert") || "safe",
          location: readString(data.location),
          latitude: typeof data.latitude === "number" ? (data.latitude as number) : undefined,
          longitude: typeof data.longitude === "number" ? (data.longitude as number) : undefined,
          lastSeen: readString(data.lastSeen, "Just now"),
          avatar: readString(data.avatar),
          zonesCount: readNumber(data.zonesCount),
          parentId: readString(data.parentId),
          phoneNumber: readString(data.phoneNumber) || undefined,
          createdAt: toDateSafe((data as Record<string, unknown>).createdAt),
          updatedAt: toDateSafe((data as Record<string, unknown>).updatedAt),
        });
      }
    });
  }

  return kids;
}

// RETURN TRACKING TARGETS FOR THE CURRENT USER.
// For primary users this returns their own "kids" records, for guardians it
// returns the primary user profiles (location fields) of the people they
// monitor.  The returned objects are normalized to the Kid type so that
// UI components can remain unchanged.
export const getKids = async (): Promise<Kid[]> => {
  const currentUserId = getCurrentUser()?.uid;
  if (!currentUserId) return [];

  const profile = await getCurrentUserProfile();

  let kids: Kid[] = [];

  if (profile?.role === "guardian") {
    // guardians track the *users* they monitor rather than the users' children
    const monitored = await getMonitoredKids(currentUserId); // this returns User[]
    kids = monitored.map((u) => {
      const k: Kid = {
        id: u.id,
        name: u.displayName,
        age: 0,
        status: u.status || "alert",
        location: u.location || "",
        latitude: u.latitude,
        longitude: u.longitude,
        lastSeen: u.lastSeen || "Just now",
        avatar: u.avatar || "",
        zonesCount: u.zonesCount || 0,
        parentId: u.id,
        phoneNumber: undefined,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
      return k;
    });
  } else {
    // primary users: load children as before
    const parentIds: string[] = [currentUserId];
    try {
      if (Array.isArray(profile?.monitoredUsers)) {
        // in case a primary user also has monitored users (unlikely) include
        // them as well
        parentIds.push(...profile!.monitoredUsers.filter((id) => !!id));
      }
    } catch (e) {
      console.warn("Failed to read additional monitored users while fetching kids", e);
    }
    kids = await fetchKidsByParents(parentIds);
  }

  // compute zone status on whatever coordinates we have
  try {
    const zones = await getZones();
    kids.forEach((kid) => {
      kid.status = calculateKidStatus(kid, zones);
      kid.zonesCount = getKidZonesCount(kid, zones);
    });
  } catch (e) {
    console.warn("Failed to calculate zone detection for kids", e);
  }

  console.log("Loaded kids:", kids);
  return kids;
};


// UPDATE KID
export const updateKid = async (id: string, data: UpdateKidData) => {
  const docRef = doc(db, "myG", id);
  
  // If location or radius has changed, recalculate zone status
  let updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  
  // Add only defined fields from input
  Object.keys(data).forEach((key) => {
    const val = (data as Record<string, unknown>)[key];
    if (val !== undefined) {
      updateData[key] = val;
    }
  });
  
  // If location or radius changed, recalculate status and zonesCount
  if (data.latitude !== undefined || data.longitude !== undefined || data.radius !== undefined) {
    try {
      // Get the current kid data
      const snapshot = await getDocs(
        query(collection(db, "myG"), where("__name__", "==", id))
      );
      
      if (snapshot.docs.length > 0) {
        const currentData = snapshot.docs[0].data() as Record<string, unknown>;
        const kid: Kid = {
          id: snapshot.docs[0].id,
          name: readString(currentData.name),
          age: readNumber(currentData.age),
          status: (currentData.status as "safe" | "warning" | "alert") || "safe",
          location: readString(currentData.location),
          latitude: data.latitude ?? (typeof currentData.latitude === "number" ? (currentData.latitude as number) : undefined),
          longitude: data.longitude ?? (typeof currentData.longitude === "number" ? (currentData.longitude as number) : undefined),
          lastSeen: readString(currentData.lastSeen, "Just now"),
          avatar: readString(currentData.avatar),
          zonesCount: readNumber(currentData.zonesCount),
          parentId: readString(currentData.parentId),
          phoneNumber: readString(currentData.phoneNumber) || undefined,
          createdAt: toDateSafe(currentData.createdAt),
          updatedAt: toDateSafe(currentData.updatedAt),
        };
        
        // Apply any other updates to the kid object
        if (data.name) kid.name = data.name;
        if (data.age) kid.age = data.age;
        if (data.radius) kid.radius = data.radius;
        
        const zones = await getZones();
        const newStatus = calculateKidStatus(kid, zones);
        const newZonesCount = getKidZonesCount(kid, zones);
        
        // Only override status if not explicitly provided
        if (!data.status) {
          updateData.status = newStatus;
        }
        updateData.zonesCount = newZonesCount;
      }
    } catch (e) {
      console.warn("Failed to recalculate zone detection for kid update", e);
    }
  }
  
  await updateDoc(docRef, updateData);
  try {
    await addActivity({
      type: "kid",
      action: "updated",
      message: `Updated kid ${data.name ?? id}`,
      kidId: id,
      severity: updateData.status === "alert" ? "warning" : "info",
    });
  } catch (e) {
    console.warn("Failed to log activity for kid update", e);
  }
};

// DELETE KID
export const deleteKid = async (id: string) => {
  const docRef = doc(db, "myG", id);
  await deleteDoc(docRef);
  try {
    await addActivity({
      type: "kid",
      action: "deleted",
      message: `Deleted kid ${id}`,
      kidId: id,
      severity: "danger",
    });
  } catch (e) {
    console.warn("Failed to log activity for kid deletion", e);
  }
};

// ACTIVITY LOG
export const addActivity = async (data: CreateActivityData) => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.warn("Cannot log activity: no current user");
    return;
  }
  
  const now = new Date();
  const docRef = await addDoc(collection(db, "activity"), {
    ...data,
    userId: currentUser.uid,
    severity: data.severity || "info",
    createdAt: now,
  });
  return docRef.id;
};

export const getRecentActivity = async (
  userId: string,
  limitCount: number
): Promise<Activity[]> => {
  const q = query(
    collection(db, "activity"),
    where("userId", "==", userId), // 🔥 REQUIRED
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Activity, "id">)
  }));
};

// REAL-TIME SUBSCRIPTIONS
// subscription helper mirroring `fetchKidsByParents`; supports up to 10 parent ids per
// query by creating multiple snapshot listeners and merging results.  It does **not**
// automatically update if the monitored list changes during the session – the caller
// would need to tear down and re‑subscribe in that case.
export const subscribeKids = (onChange: (kids: Kid[]) => void) => {
  const userId = getCurrentUser()?.uid;
  if (!userId) {
    onChange([]);
    return () => {};
  }

  const startListening = async () => {
    const profile = await getCurrentUserProfile();

    if (profile?.role === "guardian") {
      // For guardians we listen to the user documents of monitored users.
      const monitored = Array.isArray(profile.monitoredUsers)
        ? profile.monitoredUsers.filter((id) => !!id)
        : [];

      const unsubList: Array<() => void> = [];
      const kidMap: Map<string, Kid> = new Map();

      const handleSnapshot = (docSnap: import("firebase/firestore").DocumentSnapshot) => {
        if (!docSnap.exists()) {
          // docSnap typing is overly strict; cast to any to access id
          kidMap.delete((docSnap as any).id);
        } else {
          const data = docSnap.data() as Record<string, unknown>;
          const u: User = {
            id: docSnap.id,
            email: readString(data.email),
            displayName: readString(data.displayName),
            role: (data.role as UserRole) || "primary",
            subscriptionTier: (data.subscriptionTier as "free" | "premium") || "free",
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
          const kid: Kid = {
            id: u.id,
            name: u.displayName,
            age: 0,
            status: u.status || "alert",
            location: u.location || "",
            latitude: u.latitude,
            longitude: u.longitude,
            lastSeen: u.lastSeen || "Just now",
            avatar: u.avatar || "",
            zonesCount: u.zonesCount || 0,
            parentId: u.id,
            phoneNumber: undefined,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
          };
          kidMap.set(u.id, kid);
        }
        onChange(Array.from(kidMap.values()));
      };

      monitored.forEach((uid) => {
        const unsub = onSnapshot(doc(db, "users", uid), handleSnapshot);
        unsubList.push(unsub);
      });

      return () => {
        unsubList.forEach((u) => u());
      };
    } else {
      // fallback to original behaviour for primary users or others
      const buildQueries = async (): Promise<import("firebase/firestore").Query[]> => {
        const parentIds: string[] = [userId];
        try {
          if (profile && Array.isArray(profile.monitoredUsers)) {
            parentIds.push(...profile.monitoredUsers.filter((id) => !!id));
          }
        } catch (e) {
          console.warn("Failed to load user profile when subscribing to kids", e);
        }

        const queries: import("firebase/firestore").Query[] = [];
        for (let i = 0; i < parentIds.length; i += 10) {
          const chunk = parentIds.slice(i, i + 10);
          queries.push(query(collection(db, "myG"), where("parentId", "in", chunk)));
        }
        return queries;
      };

      let unsubscribers: Array<() => void> = [];
      const kidMap: Map<string, Kid> = new Map();

      const startPrimaryListening = async () => {
        const queries = await buildQueries();
        unsubscribers = queries.map((q) =>
          onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              const docSnap = change.doc;
              const data = docSnap.data() as Record<string, unknown>;
              if (change.type === "removed") {
                kidMap.delete(docSnap.id);
                return;
              }
              if (data.name && data.age && data.location) {
                const kid: Kid = {
                  id: docSnap.id,
                  name: (data.name as string) || "",
                  age: (data.age as number) || 0,
                  status: (data.status as "safe" | "warning" | "alert") || "safe",
                  location: (data.location as string) || "",
                  latitude: typeof data.latitude === "number" ? (data.latitude as number) : undefined,
                  longitude: typeof data.longitude === "number" ? (data.longitude as number) : undefined,
                  lastSeen: (data.lastSeen as string) || "Just now",
                  avatar: (data.avatar as string) || "",
                  zonesCount: (data.zonesCount as number) || 0,
                  parentId: (data.parentId as string) || "",
                  phoneNumber: (data.phoneNumber as string) || undefined,
                  createdAt: toDateSafe((data as Record<string, unknown>).createdAt),
                  updatedAt: toDateSafe((data as Record<string, unknown>).updatedAt),
                };
                kidMap.set(docSnap.id, kid);
              }
            });

            onChange(Array.from(kidMap.values()));
          })
        );
      };

      return startPrimaryListening();
    }
  };

  // start listener and return unsubscribe
  let unsubscribeFn: () => void = () => {};
  startListening().then((u) => {
    if (typeof u === "function") unsubscribeFn = u;
  });

  return () => {
    unsubscribeFn();
  };
};

export const subscribeZones = (userIdOrOnChange: string | null | undefined | ((zones: Zone[]) => void), maybeOnChange?: (zones: Zone[]) => void) => {
  // Handle both old API subscribeZones(callback) and new API subscribeZones(userId, callback)
  let userId: string | undefined;
  let onChange: (zones: Zone[]) => void;
  
  if (typeof userIdOrOnChange === "function") {
    // Old API: subscribeZones(onChange)
    userId = getCurrentUser()?.uid;
    onChange = userIdOrOnChange;
  } else {
    // New API: subscribeZones(userId, onChange)
    userId = userIdOrOnChange?.valueOf() as string | undefined;
    onChange = maybeOnChange || (() => {});
  }
  
  if (!userId) {
    onChange([]);
    return () => {};
  }
  
  const q = query(collection(db, "zones"), where("createdBy", "==", userId));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const zones: Zone[] = [];
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      if (data.name && data.address && typeof data.radius !== "undefined" && data.type) {
        zones.push({
          id: docSnap.id,
          name: data.name as string,
          address: data.address as string,
          latitude: typeof data.latitude === "number" ? (data.latitude as number) : undefined,
          longitude: typeof data.longitude === "number" ? (data.longitude as number) : undefined,
          radius: data.radius as number,
          type: readString(data.type as string) as ZoneType,
          activeKids: (data.activeKids as number) ?? 0,
          totalKids: (data.totalKids as number) ?? 0,
          isActive: (data.isActive as boolean) ?? true,
          groupId: typeof data.groupId === "string" ? data.groupId : undefined,
          activeHours: data.activeHours as Zone["activeHours"],
          createdBy: readString(data.createdBy),
          createdAt: toDateSafe((data as Record<string, unknown>).createdAt),
        } as Zone);
      }
    });
    onChange(zones);
  });
  return unsubscribe;
};

// Backward compatible version - automatically uses current user
export const subscribeUserZones = (onChange: (zones: Zone[]) => void) => {
  return subscribeZones(onChange);
};

export const subscribeActivity = (onChange: (items: Activity[]) => void) => {
  const userId = getCurrentUser()?.uid;
  if (!userId) {
    onChange([]);
    return () => {};
  }

  const unsubscribe = onSnapshot(
    query(
      collection(db, "activity"), 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    ), 
    (snapshot) => {
      const items: Activity[] = snapshot.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          userId: readString(data.userId),
          type: readString(data.type as string) as "kid" | "zone",
          action: readString(data.action),
          message: readString(data.message),
          kidId: typeof data.kidId === "string" ? (data.kidId as string) : undefined,
          zoneId: typeof data.zoneId === "string" ? (data.zoneId as string) : undefined,
          severity: (data.severity as Activity["severity"]) || "info",
          createdAt: toDateSafe((data as Record<string, unknown>).createdAt),
        } as Activity;
      });
      onChange(items);
    }
  );
  return unsubscribe;
};



export const getMonitoredKids = async (
  currentUserId: string
): Promise<User[]> => {
  // returns the User profiles of primary users that list the given guardian
  const usersRef = collection(db, "users");

  const q = query(
    usersRef,
    where("guardians", "array-contains", currentUserId)
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<User, "id">),
  }));
};

// Update a user's current location/time/status. This can be called by the
// primary-user client whenever its position changes.
export const updateUserLocation = async (
  userId: string,
  latitude: number,
  longitude: number,
  location?: string,
  status?: "safe" | "warning" | "alert",
  lastSeen?: string
): Promise<void> => {
  const docRef = doc(db, "users", userId);
  const data: Record<string, unknown> = {
    latitude,
    longitude,
    updatedAt: new Date(),
  };
  if (location !== undefined) data.location = location;
  if (status !== undefined) data.status = status;
  if (lastSeen !== undefined) data.lastSeen = lastSeen;
  try {
    await updateDoc(docRef, data);
  } catch (e) {
    console.warn("Failed to update user location", e);
  }
};
// ZONE DETECTION HELPERS
export async function checkKidZoneStatus(kidId: string): Promise<"safe" | "warning" | "alert"> {
  try {
    const kids = await getKids();
    const kid = kids.find((k) => k.id === kidId);
    if (!kid) return "alert";
    return kid.status;
  } catch (e) {
    console.error("Failed to check kid zone status", e);
    return "alert";
  }
}

export async function getKidZoneInfo(kidId: string) {
  try {
    const kids = await getKids();
    const kid = kids.find((k) => k.id === kidId);
    if (!kid) return null;

    const zones = await getZones();
    const { getZoneDetectionInfo } = await import("@/lib/zone-detection");
    return getZoneDetectionInfo(kid, zones);
  } catch (e) {
    console.error("Failed to get kid zone info", e);
    return null;
  }
}