export type ActivitySeverity = "info" | "warning" | "safe" | "danger";

export interface Activity {
  id: string;
  userId: string; // User who created the activity
  type: "kid" | "zone";
  action: string;
  message: string;
  kidId?: string;
  zoneId?: string;
  createdAt: Date;
  severity: ActivitySeverity;
}

export interface CreateActivityData {
  type: "kid" | "zone";
  action: string;
  message: string;
  kidId?: string;
  zoneId?: string;
  severity?: ActivitySeverity;
}

// ADD THIS PART BELOW: This fixes the "No matching export" error
// This is a placeholder function so your NavBar doesn't crash.
export const subscribeActivity = (callback: (activity: Activity) => void) => {
  console.log("Subscribed to activities");
  // This is where your real-time socket or API logic would eventually go
  return () => console.log("Unsubscribed");
};

