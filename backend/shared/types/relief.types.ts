export type HelpType = 
  | 'SHELTER'
  | 'FOOD'
  | 'WATER'
  | 'MEDICAL'
  | 'EVACUATION'
  | 'OTHER';

export type HelpStatus = 'PENDING' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type UrgencyTier = 'P1' | 'P2' | 'P3' | 'P4';

export const urgencyToTier = (urgency: UrgencyLevel | string): UrgencyTier => {
  switch (urgency?.toUpperCase()) {
    case 'CRITICAL':
    case 'P1':
      return 'P1';
    case 'HIGH':
    case 'P2':
      return 'P2';
    case 'MEDIUM':
    case 'P3':
      return 'P3';
    default:
      return 'P4';
  }
};

export const tierToUrgency = (tier: UrgencyTier | string): UrgencyLevel => {
  switch (tier?.toUpperCase()) {
    case 'P1':
    case 'CRITICAL':
      return 'CRITICAL';
    case 'P2':
    case 'HIGH':
      return 'HIGH';
    case 'P3':
    case 'MEDIUM':
      return 'MEDIUM';
    default:
      return 'LOW';
  }
};

export const getUrgencyPriorityWeight = (urgency: UrgencyLevel | UrgencyTier | string): number => {
  const tier = urgencyToTier(urgency);
  switch (tier) {
    case 'P1': return 1;
    case 'P2': return 2;
    case 'P3': return 3;
    case 'P4': return 4;
    default: return 5;
  }
};

export type ResourceType = 'FOOD' | 'WATER' | 'MEDICAL' | 'BEDDING' | 'CLOTHING';

export type ResourceUnit = 'PACK' | 'BOTTLE' | 'BOX' | 'KIT' | 'UNIT';

export type ResourceStatus = 'AVAILABLE' | 'ASSIGNED' | 'DEPLETED';

export interface HelpRequest {
  id: string;
  user_id?: string | null;
  incident_id?: string | null;
  matched_shelter_id?: string | null;
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
  matched_shelter?: Shelter;
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
  incident_id?: string;
  help_type: HelpType;
  description?: string;
  people_count?: number;
  latitude: number;
  longitude: number;
  urgency?: UrgencyLevel;
  matched_shelter_id?: string;
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
  help_request_id?: string;
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

export interface MultiResourceAllocateItem {
  resource_id: string;
  quantity: number;
}

export interface MultiResourceAllocateDTO {
  help_request_id: string;
  allocations: MultiResourceAllocateItem[];
}

export interface SimulateSosDTO {
  help_type?: HelpType;
  urgency?: UrgencyLevel;
  people_count?: number;
  description?: string;
  latitude?: number;
  longitude?: number;
  area_name?: string;
}

