export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketStatus = 
  | 'OPEN'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CLOSED';

export type CrewAvailability = 'AVAILABLE' | 'BUSY' | 'OFF_DUTY';

export type CrewType = 
  | 'ARMY_RESCUE'
  | 'MUNICIPAL_WORKS'
  | 'NAVY_BOAT_UNIT'
  | 'POLICE_TRIAGE'
  | 'DMC_DISASTER_TEAM';

export interface FieldCrew {
  id: string;
  user_id?: string | null;
  officer_id?: string | null;
  crew_code?: string | null;
  crew_name: string;
  crew_type?: CrewType | string;
  specialty?: string; // 'WATER_RESCUE' | '4X4_DEBRIS' | 'MEDICAL_TRIAGE' | 'DRONE_RECON' | 'HAM_RADIO' | 'HAZMAT_EVAC'
  district?: string;
  phone?: string | null;
  equipment?: string[];
  availability: CrewAvailability;
  latitude?: number | null;
  longitude?: number | null;
  vehicle_type?: string | null;
  contact_phone?: string | null;
  assigned_ward_id?: string | null;
  created_at?: string;
  updated_at?: string;
  // Joined relation fields
  user_name?: string;
  user_phone?: string;
  officer_name?: string;
  officer_phone?: string;
}

export interface DistrictInfo {
  code: string;
  name: string;
  province: string;
  lat: number;
  lon: number;
  hotline: string;
}

export const SRI_LANKA_DISTRICTS: DistrictInfo[] = [
  { code: 'COL', name: 'Colombo', province: 'Western', lat: 6.9271, lon: 79.8612, hotline: '+94112433333' },
  { code: 'GAM', name: 'Gampaha', province: 'Western', lat: 7.0840, lon: 79.9939, hotline: '+94332222222' },
  { code: 'KAL', name: 'Kalutara', province: 'Western', lat: 6.5854, lon: 79.9607, hotline: '+94342222222' },
  { code: 'KAN', name: 'Kandy', province: 'Central', lat: 7.2906, lon: 80.6337, hotline: '+94812222222' },
  { code: 'MTL', name: 'Matale', province: 'Central', lat: 7.4675, lon: 80.6234, hotline: '+94662222222' },
  { code: 'NUE', name: 'Nuwara Eliya', province: 'Central', lat: 6.9497, lon: 80.7891, hotline: '+94522222222' },
  { code: 'GAL', name: 'Galle', province: 'Southern', lat: 6.0535, lon: 80.2210, hotline: '+94912222222' },
  { code: 'MAT', name: 'Matara', province: 'Southern', lat: 5.9549, lon: 80.5550, hotline: '+94412222222' },
  { code: 'HAM', name: 'Hambantota', province: 'Southern', lat: 6.1429, lon: 81.1212, hotline: '+94472222222' },
  { code: 'JAF', name: 'Jaffna', province: 'Northern', lat: 9.6615, lon: 80.0255, hotline: '+94212222222' },
  { code: 'KIL', name: 'Kilinochchi', province: 'Northern', lat: 9.3803, lon: 80.3770, hotline: '+94212285222' },
  { code: 'MAN', name: 'Mannar', province: 'Northern', lat: 8.9810, lon: 79.9044, hotline: '+94232222222' },
  { code: 'VAV', name: 'Vavuniya', province: 'Northern', lat: 8.7542, lon: 80.4982, hotline: '+94242222222' },
  { code: 'MUL', name: 'Mullaitivu', province: 'Northern', lat: 9.2671, lon: 80.8143, hotline: '+94212290222' },
  { code: 'BAT', name: 'Batticaloa', province: 'Eastern', lat: 7.7310, lon: 81.6747, hotline: '+94652222222' },
  { code: 'AMP', name: 'Ampara', province: 'Eastern', lat: 7.2912, lon: 81.6724, hotline: '+94632222222' },
  { code: 'TRI', name: 'Trincomalee', province: 'Eastern', lat: 8.5874, lon: 81.2152, hotline: '+94262222222' },
  { code: 'KUR', name: 'Kurunegala', province: 'North Western', lat: 7.4863, lon: 80.3623, hotline: '+94372222222' },
  { code: 'PUT', name: 'Puttalam', province: 'North Western', lat: 8.0408, lon: 79.8394, hotline: '+94322222222' },
  { code: 'ANU', name: 'Anuradhapura', province: 'North Central', lat: 8.3114, lon: 80.4037, hotline: '+94252222222' },
  { code: 'POL', name: 'Polonnaruwa', province: 'North Central', lat: 7.9403, lon: 81.0188, hotline: '+94272222222' },
  { code: 'BAD', name: 'Badulla', province: 'Uva', lat: 6.9934, lon: 81.0550, hotline: '+94552222222' },
  { code: 'MON', name: 'Monaragala', province: 'Uva', lat: 6.8728, lon: 81.3507, hotline: '+94552276222' },
  { code: 'RAT', name: 'Ratnapura', province: 'Sabaragamuwa', lat: 6.6828, lon: 80.4036, hotline: '+94452222222' },
  { code: 'KEG', name: 'Kegalle', province: 'Sabaragamuwa', lat: 7.2513, lon: 80.3464, hotline: '+94352222222' }
];

export interface CouncilTicket {
  id: string;
  incident_id: string;
  assigned_officer_id?: string | null;
  assigned_crew_id?: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  required_specialty?: string | null;
  sitrep_notes?: string | null;
  evacuated_count?: number;
  route_directions?: string[];
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
  // Joined relation fields
  incident?: any;
  assigned_crew?: FieldCrew | null;
}

export interface TicketCreateDTO {
  incident_id: string;
  priority?: TicketPriority;
  description?: string;
  assigned_officer_id?: string;
  assigned_crew_id?: string;
}

export interface TicketAssignDTO {
  crew_id: string;
  emergency_override?: boolean;
  justification?: string;
}

export interface TicketCompleteDTO {
  photo_url?: string;
  notes?: string;
}

export interface TicketReturnDTO {
  reason: string;
}

export interface CrewLocationUpdateDTO {
  latitude: number;
  longitude: number;
}

export interface CrewLocationBroadcastPayload {
  crew_id: string;
  crew_name: string;
  latitude: number;
  longitude: number;
  availability: CrewAvailability;
  timestamp: string;
}

export interface CrewSosPayload {
  crew_id: string;
  crew_name: string;
  latitude: number;
  longitude: number;
  message: string;
  timestamp: string;
}
