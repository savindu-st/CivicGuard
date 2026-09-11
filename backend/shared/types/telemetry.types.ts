export type ReadingType = 'RAINFALL' | 'RIVER_LEVEL';

export interface EnvironmentalReading {
  id: string;
  ward_id?: string | null;
  reading_type: ReadingType;
  value: number;
  unit: string;
  danger_threshold?: number | null;
  recorded_at: string;
  source?: string;
  metadata?: Record<string, any>;
}

export interface TelemetryIngestDTO {
  ward_id: string;
  reading_type: ReadingType;
  value: number;
  unit?: string;
  danger_threshold?: number;
  source?: string;
  recorded_at?: string;
}

export interface TelemetrySimulateDTO {
  storm_intensity?: 'MODERATE' | 'HEAVY' | 'TORRENTIAL';
  target_wards?: string[];
  duration_minutes?: number;
}
