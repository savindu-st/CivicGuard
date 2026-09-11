export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketStatus = 
  | 'OPEN'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CLOSED';

export type CrewAvailability = 'AVAILABLE' | 'BUSY' | 'OFF_DUTY';

export interface FieldCrew {
  id: string;
  user_id?: string | null;
  crew_name: string;
  availability: CrewAvailability;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string;
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
}

export interface TicketCompleteDTO {
  photo_url?: string;
  notes?: string;
}

export interface CrewLocationUpdateDTO {
  latitude: number;
  longitude: number;
}
