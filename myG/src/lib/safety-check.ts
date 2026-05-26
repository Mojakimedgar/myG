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
  orderBy,
} from "firebase/firestore";
import { SafetyCheck, CreateSafetyCheckData, SafetyCheckStatus } from "@/types/safety-check";
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

const DEFAULT_TIMEOUT_MINUTES = 5;

// CREATE SAFETY CHECK
export const createSafetyCheck = async (checkData: CreateSafetyCheckData): Promise<string> => {
  const now = new Date();
  const safetyCheck = {
    userId: checkData.userId,
    initiatedBy: checkData.initiatedBy,
    status: "pending" as SafetyCheckStatus,
    message: checkData.message || "Are you safe?",
    timeoutMinutes: checkData.timeoutMinutes || DEFAULT_TIMEOUT_MINUTES,
    createdAt: now,
  };
  
  const docRef = await addDoc(collection(db, "safetyChecks"), safetyCheck);
  
  // Set up timeout for escalation
  setTimeout(async () => {
    const checkRef = doc(db, "safetyChecks", docRef.id);
    const checkSnap = await getDoc(checkRef);
    
    if (checkSnap.exists()) {
      const currentCheck = checkSnap.data() as Record<string, unknown>;
      if (currentCheck.status === "pending") {
        await updateDoc(checkRef, {
          status: "no_response" as SafetyCheckStatus,
          escalatedAt: new Date(),
        });
        
        // Trigger escalation
        await escalateSafetyCheck(docRef.id, checkData.userId);
      }
    }
  }, (checkData.timeoutMinutes || DEFAULT_TIMEOUT_MINUTES) * 60 * 1000);
  
  try {
    await addActivity({
      type: "kid",
      action: "safety_check_initiated",
      message: `Safety check initiated for user`,
      kidId: checkData.userId,
      severity: "warning",
    });
  } catch (e) {
    console.warn("Failed to log safety check activity", e);
  }
  
  return docRef.id;
};

// RESPOND TO SAFETY CHECK
export const respondToSafetyCheck = async (
  checkId: string,
  response: "safe" | "help_needed"
): Promise<void> => {
  const checkRef = doc(db, "safetyChecks", checkId);
  const status: SafetyCheckStatus = response === "safe" ? "safe" : "help_needed";
  
  await updateDoc(checkRef, {
    status,
    response,
    respondedAt: new Date(),
  });
  
  // Get check details
  const checkSnap = await getDoc(doc(db, "safetyChecks", checkId));
  let userId = "";
  
  if (checkSnap.exists()) {
    const checkData = checkSnap.data() as Record<string, unknown>;
    userId = readString(checkData.userId);
    
    if (response === "help_needed") {
      await escalateSafetyCheck(checkId, userId);
    }
  }
  
  try {
    await addActivity({
      type: "kid",
      action: "safety_check_responded",
      message: `User responded: ${response === "safe" ? "I am safe" : "I need help"}`,
      kidId: userId,
      severity: response === "safe" ? "safe" : "danger",
    });
  } catch (e) {
    console.warn("Failed to log response activity", e);
  }
};

// ESCALATE SAFETY CHECK
export const escalateSafetyCheck = async (checkId: string, userId: string): Promise<void> => {
  const checkRef = doc(db, "safetyChecks", checkId);
  await updateDoc(checkRef, {
    status: "escalated" as SafetyCheckStatus,
    escalatedAt: new Date(),
  });
  
  // Notify guardians (this would trigger notifications/alerts)
  try {
    await addActivity({
      type: "kid",
      action: "safety_check_escalated",
      message: `Safety check escalated - guardians notified`,
      kidId: userId,
      severity: "danger",
    });
  } catch (e) {
    console.warn("Failed to log escalation activity", e);
  }
};

// GET PENDING SAFETY CHECKS FOR USER
export const getPendingSafetyChecks = async (userId: string): Promise<SafetyCheck[]> => {
  const q = query(
    collection(db, "safetyChecks"),
    where("userId", "==", userId),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as Record<string, unknown>;
    return {
      id: docSnap.id,
      userId: readString(data.userId),
      initiatedBy: readString(data.initiatedBy),
      status: (data.status as SafetyCheckStatus) || "pending",
      message: readString(data.message),
      response: data.response as "safe" | "help_needed" | undefined,
      timeoutMinutes: typeof data.timeoutMinutes === "number" ? data.timeoutMinutes : DEFAULT_TIMEOUT_MINUTES,
      createdAt: toDateSafe(data.createdAt),
      respondedAt: data.respondedAt ? toDateSafe(data.respondedAt) : undefined,
      escalatedAt: data.escalatedAt ? toDateSafe(data.escalatedAt) : undefined,
    };
  });
};

// SUBSCRIBE TO PENDING SAFETY CHECKS
export const subscribePendingSafetyChecks = (
  userId: string,
  onChange: (checks: SafetyCheck[]) => void
) => {
  const q = query(
    collection(db, "safetyChecks"),
    where("userId", "==", userId),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const checks: SafetyCheck[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      return {
        id: docSnap.id,
        userId: readString(data.userId),
        initiatedBy: readString(data.initiatedBy),
        status: (data.status as SafetyCheckStatus) || "pending",
        message: readString(data.message),
        response: data.response as "safe" | "help_needed" | undefined,
        timeoutMinutes: typeof data.timeoutMinutes === "number" ? data.timeoutMinutes : DEFAULT_TIMEOUT_MINUTES,
        createdAt: toDateSafe(data.createdAt),
        respondedAt: data.respondedAt ? toDateSafe(data.respondedAt) : undefined,
        escalatedAt: data.escalatedAt ? toDateSafe(data.escalatedAt) : undefined,
      };
    });
    onChange(checks);
  });
};
