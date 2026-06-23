export type SafetyCheckStatus = "pending" | "safe" | "help_needed" | "no_response" | "escalated";

export interface SafetyCheck {
  id: string;
  userId: string; // Primary User being checked
  initiatedBy: string; // Guardian user ID who initiated
  status: SafetyCheckStatus;
  message?: string;
  response?: "safe" | "help_needed";
  createdAt: Date;
  respondedAt?: Date;
  escalatedAt?: Date;
  timeoutMinutes: number; // Default 5 minutes
}

export interface CreateSafetyCheckData {
  userId: string;
  initiatedBy: string;
  message?: string;
  timeoutMinutes?: number;
}
