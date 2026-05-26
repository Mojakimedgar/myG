import { db } from "./firebase";
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  limit, // Added limit for efficiency
} from "firebase/firestore";
import { MYGInvitation, CreateInvitationData, InvitationStatus, CreateGuardianInvitationData } from "@/types/user";
import { getUserProfile } from "./users";
import { addActivity } from "./firestore";

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

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

// CREATE INVITATION (Optimized with Query)
export const createInvitation = async (invitationData: CreateInvitationData): Promise<string> => {
  try {
    const usersRef = collection(db, "users");
    
    // Log what we are looking for
    console.log("Attempting to find user with email:", invitationData.toUserEmail);

    const userQuery = query(
      usersRef, 
      where("email", "==", invitationData.toUserEmail),
      limit(1)
    );
    
    const usersSnapshot = await getDocs(userQuery);
    
    if (usersSnapshot.empty) {
      // Logic for why it might be empty
      console.error(`No document found in 'users' collection where email == '${invitationData.toUserEmail}'`);
      throw new Error(`User '${invitationData.toUserEmail}' not found. Ensure they have a profile created.`);
    }

    const guardianDoc = usersSnapshot.docs[0];
    const guardianId = guardianDoc.id;
    console.log("Guardian found! ID:", guardianId);

    const now = new Date();
    const invitation = {
      fromUserId: invitationData.fromUserId,
      toUserId: guardianId,
      fromUserEmail: invitationData.fromUserEmail,
      toUserEmail: invitationData.toUserEmail,
      status: "pending" as InvitationStatus,
      invitationType: "primary_to_guardian" as const,
      createdAt: now,
    };

    const docRef = await addDoc(collection(db, "mygInvitations"), invitation);
    
    // ... activity logging code ...
    return docRef.id;
  } catch (error) {
    console.error("Detailed Error in createInvitation:", error);
    throw error;
  }
};

// CREATE GUARDIAN INVITATION (Guardian invites Primary User)
export const createGuardianInvitation = async (invitationData: CreateGuardianInvitationData): Promise<string> => {
  try {
    const usersRef = collection(db, "users");
    
    console.log("Attempting to find primary user with email:", invitationData.toUserEmail);

    const userQuery = query(
      usersRef, 
      where("email", "==", invitationData.toUserEmail),
      limit(1)
    );
    
    const usersSnapshot = await getDocs(userQuery);
    
    if (usersSnapshot.empty) {
      console.error(`No document found in 'users' collection where email == '${invitationData.toUserEmail}'`);
      throw new Error(`User '${invitationData.toUserEmail}' not found. Ensure they have a profile created.`);
    }

    const primaryUserDoc = usersSnapshot.docs[0];
    const primaryUserId = primaryUserDoc.id;
    console.log("Primary user found! ID:", primaryUserId);

    const now = new Date();
    const invitation = {
      fromUserId: invitationData.fromUserId,
      toUserId: primaryUserId,
      fromUserEmail: invitationData.fromUserEmail,
      toUserEmail: invitationData.toUserEmail,
      status: "pending" as InvitationStatus,
      invitationType: "guardian_to_primary" as const,
      createdAt: now,
    };

    const docRef = await addDoc(collection(db, "mygInvitations"), invitation);
    
    // ... activity logging code ...
    return docRef.id;
  } catch (error) {
    console.error("Detailed Error in createGuardianInvitation:", error);
    throw error;
  }
};

// GET INVITATIONS FOR USER
export const getInvitationsForUser = async (userId: string): Promise<MYGInvitation[]> => {
  const q = query(
    collection(db, "mygInvitations"),
    where("toUserId", "==", userId),
    where("status", "==", "pending")
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as Record<string, unknown>;
    return {
      id: docSnap.id,
      fromUserId: readString(data.fromUserId),
      toUserId: readString(data.toUserId),
      fromUserEmail: readString(data.fromUserEmail),
      toUserEmail: readString(data.toUserEmail),
      status: (data.status as InvitationStatus) || "pending",
      invitationType: (data.invitationType as any) || "primary_to_guardian",
      createdAt: toDateSafe(data.createdAt),
      respondedAt: data.respondedAt ? toDateSafe(data.respondedAt) : undefined,
    };
  });
};

// ACCEPT INVITATION
export const acceptInvitation = async (invitationId: string): Promise<void> => {
  const invitationRef = doc(db, "mygInvitations", invitationId);
  const invitationSnap = await getDoc(invitationRef);
  
  if (!invitationSnap.exists()) {
    throw new Error("Invitation not found");
  }
  
  const invitationData = invitationSnap.data() as Record<string, unknown>;
  const fromUserId = readString(invitationData.fromUserId);
  const toUserId = readString(invitationData.toUserId);
  const invitationType = (invitationData.invitationType as any) || "primary_to_guardian";
  
  // Update invitation status
  await updateDoc(invitationRef, {
    status: "accepted" as InvitationStatus,
    respondedAt: new Date(),
  });
  
  if (invitationType === "primary_to_guardian") {
    // Primary user invited guardian - Guardian accepts
    // Update primary user's guardians list
    const primaryUser = await getUserProfile(fromUserId);
    if (primaryUser) {
      const updatedGuardians = [...(primaryUser.guardians || []), toUserId];
      await updateDoc(doc(db, "users", fromUserId), {
        guardians: updatedGuardians,
        updatedAt: new Date(),
      });
    }
    
    // Update guardian's monitored users list
    const guardianUser = await getUserProfile(toUserId);
    if (guardianUser) {
      const updatedMonitoredUsers = [...(guardianUser.monitoredUsers || []), fromUserId];
      await updateDoc(doc(db, "users", toUserId), {
        monitoredUsers: updatedMonitoredUsers,
        updatedAt: new Date(),
      });
    }
  } else if (invitationType === "guardian_to_primary") {
    // Guardian invited primary user - Primary user accepts
    // Update guardian's monitored users list
    const guardianUser = await getUserProfile(fromUserId);
    if (guardianUser) {
      const updatedMonitoredUsers = [...(guardianUser.monitoredUsers || []), toUserId];
      await updateDoc(doc(db, "users", fromUserId), {
        monitoredUsers: updatedMonitoredUsers,
        updatedAt: new Date(),
      });
    }
    
    // Update primary user's guardians list
    const primaryUser = await getUserProfile(toUserId);
    if (primaryUser) {
      const updatedGuardians = [...(primaryUser.guardians || []), fromUserId];
      await updateDoc(doc(db, "users", toUserId), {
        guardians: updatedGuardians,
        updatedAt: new Date(),
      });
    }
  }
  
  try {
    await addActivity({
      type: "kid",
      action: "invitation_accepted",
      message: `MYG relationship established`,
      severity: "safe",
    });
  } catch (e) {
    console.warn("Failed to log acceptance activity", e);
  }
};

// REJECT INVITATION
export const rejectInvitation = async (invitationId: string): Promise<void> => {
  const invitationRef = doc(db, "mygInvitations", invitationId);
  await updateDoc(invitationRef, {
    status: "rejected" as InvitationStatus,
    respondedAt: new Date(),
  });
};

// SUBSCRIBE TO INVITATIONS
export const subscribeInvitations = (userId: string, onChange: (invitations: MYGInvitation[]) => void) => {
  const q = query(
    collection(db, "mygInvitations"),
    where("toUserId", "==", userId),
    where("status", "==", "pending")
  );
  
  return onSnapshot(q, (snapshot) => {
    const invitations: MYGInvitation[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      return {
        id: docSnap.id,
        fromUserId: readString(data.fromUserId),
        toUserId: readString(data.toUserId),
        fromUserEmail: readString(data.fromUserEmail),
        toUserEmail: readString(data.toUserEmail),
        status: (data.status as InvitationStatus) || "pending",
        invitationType: (data.invitationType as any) || "primary_to_guardian",
        createdAt: toDateSafe(data.createdAt),
        respondedAt: data.respondedAt ? toDateSafe(data.respondedAt) : undefined,
      };
    });
    onChange(invitations);
  });
};