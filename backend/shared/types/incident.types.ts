export type IncidentType = 
  | 'FLOOD'
  | 'BLOCKED_ROAD'
  | 'FALLEN_TREE'
  | 'LANDSLIDE'
  | 'OTHER';

export type IncidentStatus = 
  | 'REPORTED'
  | 'ANALYZING'
  | 'NEEDS_VERIFICATION'
  | 'CONFIRMED'
  | 'DISPATCHED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentSource = 'CITIZEN' | 'WEATHER_FEED' | 'RIVER_FEED';

export type EvidenceType = 'REPORT_PHOTO' | 'VERIFICATION_PHOTO' | 'COMPLETION_PHOTO';

export type AnalysisType = 'WEATHER' | 'CLUSTER' | 'IMAGE' | 'LOCATION' | 'RISK';

export type AnalysisMethod = 'SYSTEM' | 'AI' | 'HEURISTIC_FALLBACK';

export type VerdictDecision = 'CONFIRMED' | 'NEEDS_VERIFICATION' | 'REJECTED';

export interface Incident {
  id: string;
  reported_by?: string | null;
  incident_type: IncidentType;
  description?: string | null;
  latitude: number;
  longitude: number;
  ward_id?: string | null;
  road_id?: string | null;
  source: IncidentSource;
  status: IncidentStatus;
  severity: IncidentSeverity;
  created_at?: string;
  updated_at?: string;
  // Joined relation fields
  ward_name?: string;
  road_name?: string;
  evidence?: IncidentEvidence[];
  verdict?: HazardVerdict | null;
}

export interface IncidentEvidence {
  id: string;
  incident_id: string;
  uploaded_by?: string | null;
  file_url: string;
  evidence_type: EvidenceType;
  created_at?: string;
}

export interface AnalysisResult {
  id: string;
  incident_id: string;
  analysis_type: AnalysisType;
  method: AnalysisMethod;
  result?: string | null;
  score?: number | null;
  confidence?: number | null;
  reason?: string | null;
  input_data?: Record<string, any>;
  created_at?: string;
  fallback_used?: boolean;
}

export interface HazardVerdict {
  id: string;
  incident_id: string;
  verdict: VerdictDecision;
  confidence: number;
  urgency: IncidentSeverity;
  reasons?: string[];
  created_at?: string;
}

export interface IncidentCreateDTO {
  incident_type: IncidentType;
  description?: string;
  latitude: number;
  longitude: number;
  photo_url?: string;
  reported_by?: string;
  severity?: IncidentSeverity;
}

export interface CorroborateDTO {
  vote: 'CONFIRM' | 'REFUTE';
  notes?: string;
  photo_url?: string;
}

export interface SafePathRequestDTO {
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
}

export interface SafePathResponseDTO {
  path: Array<{ latitude: number; longitude: number; name?: string }>;
  distanceKm: number;
  avoidedClosedRoads: Array<{ id: string; name: string; latitude: number; longitude: number }>;
  isDirect: boolean;
}

export interface HazardMapItem {
  id: string;
  incident_type: IncidentType;
  latitude: number;
  longitude: number;
  status: IncidentStatus;
  severity: IncidentSeverity;
  ward_id?: string | null;
  ward_name?: string | null;
  road_id?: string | null;
  road_name?: string | null;
  is_road_closed: boolean;
  evidence_url?: string | null;
  urgency?: string;
  created_at?: string;
}
