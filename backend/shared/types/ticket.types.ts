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
  crew_name: string;
  crew_type?: CrewType | string;
  specialty?: string; // 'WATER_RESCUE' | '4X4_DEBRIS' | 'MEDICAL_TRIAGE' | 'DRONE_RECON' | 'HAM_RADIO'
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
}

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

