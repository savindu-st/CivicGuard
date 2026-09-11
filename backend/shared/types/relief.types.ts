export type HelpType = 
  | 'SHELTER'
  | 'FOOD'
  | 'WATER'
  | 'MEDICAL'
  | 'EVACUATION'
  | 'OTHER';

export type HelpStatus = 'PENDING' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ResourceType = 'FOOD' | 'WATER' | 'MEDICAL' | 'BEDDING' | 'CLOTHING';

export type ResourceUnit = 'PACK' | 'BOTTLE' | 'BOX' | 'KIT' | 'UNIT';

export type ResourceStatus = 'AVAILABLE' | 'ASSIGNED' | 'DEPLETED';

export interface HelpRequest {
  id: string;
  user_id?: string | null;
  incident_id?: string | null;
  help_type: HelpType;
  description?: string | null;
  people_count: number;
  latitude: number;
  longitude: number;
  urgency: UrgencyLevel;
  status: HelpStatus;
  created_at?: string;
  updated_at?: string;
  // Joined relation fields
  user_name?: string;
  user_phone?: string;
}

export interface Shelter {
  id: string;
  ward_id?: string | null;
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  capacity: number;
  current_occupancy: number;
  is_active: boolean;
  created_at?: string;
  // Virtual calculation
  available_beds?: number;
  ward_name?: string;
}

export interface ReliefResource {
  id: string;
  shelter_id: string;
  help_request_id?: string | null;
  resource_type: ResourceType;
  resource_name: string;
  quantity: number;
  unit: ResourceUnit;
  status: ResourceStatus;
  assigned_by?: string | null;
  created_at?: string;
  updated_at?: string;
  // Joined
  shelter_name?: string;
}

export interface HelpRequestCreateDTO {
  user_id?: string;
  help_type: HelpType;
  description?: string;
  people_count?: number;
  latitude: number;
  longitude: number;
  urgency?: UrgencyLevel;
}

export interface ShelterCreateDTO {
  ward_id?: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  capacity: number;
}

export interface ShelterMatchDTO {
  latitude: number;
  longitude: number;
  people_count: number;
}

export interface ShelterMatchResult {
  shelter: Shelter;
  distanceKm: number;
  availableBeds: number;
  estimatedTravelTimeMinutes: number;
}

export interface ResourceAllocateDTO {
  shelter_id: string;
  resource_type: ResourceType;
  resource_name: string;
  quantity: number;
  unit?: ResourceUnit;
  help_request_id?: string;
}
