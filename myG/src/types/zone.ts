export type ZoneType = "home" | "school" | "work" | "custom";

export interface ZoneGroup {
  id: string;
  name: string;
  description?: string;
  zoneIds: string[];
  createdAt: Date;
}

export interface ActiveHours {
  enabled: boolean;
  startHour: number; // 0-23
  endHour: number; // 0-23
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
}

export interface Zone {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  radius: number;
  type: ZoneType;
  // Optional free-form label when type is `custom`
  customLabel?: string;
  activeKids: number;
  totalKids: number;
  createdAt: Date;
  isActive: boolean;
  groupId?: string; // Reference to ZoneGroup
  activeHours?: ActiveHours;
  createdBy: string; // User ID who created the zone
}

export interface CreateZoneData {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  radius: number;
  type: ZoneType;
  customLabel?: string;
  totalKids?: number;
  isActive?: boolean;
  groupId?: string;
  activeHours?: ActiveHours;
  createdBy: string;
}

export interface UpdateZoneData {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  type?: ZoneType;
  customLabel?: string;
  activeKids?: number;
  totalKids?: number;
  isActive?: boolean;
  groupId?: string;
  activeHours?: ActiveHours;
}
