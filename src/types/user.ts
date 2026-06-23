export type UserRole = "primary" | "guardian";

export type SubscriptionTier = "free" | "premium";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  hasChosenPlan?: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  // Primary User specific fields
  guardians?: string[]; // Array of guardian user IDs
  // Guardian specific fields
  monitoredUsers?: string[]; // Array of primary user IDs this guardian monitors
  // Location tracking (optional for primary users)
  latitude?: number;
  longitude?: number;
  location?: string;
  status?: "safe" | "warning" | "alert";
  lastSeen?: string;
  zonesCount?: number; // convenience field for counting active zones
}

export interface CreateUserData {
  email: string;
  displayName: string;
  role: UserRole;
  subscriptionTier?: SubscriptionTier;
  hasChosenPlan?: boolean;
  avatar?: string;
}

export interface UpdateUserData {
  displayName?: string;
  avatar?: string;
  subscriptionTier?: SubscriptionTier;
  hasChosenPlan?: boolean;
  // modifications to relationships
  guardians?: string[];
  monitoredUsers?: string[];
}

// MYG Linking (Trust Relationships)
export type InvitationStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type InvitationType = "primary_to_guardian" | "guardian_to_primary";

export interface MYGInvitation {
  id: string;
  fromUserId: string; // User who sent invitation
  toUserId: string; // User who receives invitation
  fromUserEmail: string;
  toUserEmail: string;
  status: InvitationStatus;
  invitationType: InvitationType; // Type of invitation
  createdAt: Date;
  respondedAt?: Date;
}

export interface CreateInvitationData {
  fromUserId: string;
  toUserEmail: string;
  fromUserEmail: string;
}

export interface CreateGuardianInvitationData {
  fromUserId: string;
  toUserEmail: string;
  fromUserEmail: string;
}
