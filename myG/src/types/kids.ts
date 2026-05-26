export interface Kid {
  id: string;
  name: string;
  age: number;
  status: "safe" | "warning" | "alert";
  location: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  lastSeen: string;
  avatar?: string;
  zonesCount: number;
  parentId?: string;
  /** Phone number for calling / messaging this person */
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateKidData {
  name: string;
  age: number;
  location: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  avatar?: string;
  radius?: number;
  parentId?: string;
  phoneNumber?: string;
}

export interface UpdateKidData {
  name?: string;
  age?: number;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  avatar?: string;
  radius?: number;
  status?: "safe" | "warning" | "alert";
  lastSeen?: string;
  zonesCount?: number;
  phoneNumber?: string;
}
