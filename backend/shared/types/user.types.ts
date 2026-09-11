export interface User {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type RoleName = 
  | 'CITIZEN'
  | 'COUNCIL_OFFICER'
  | 'FIELD_CREW'
  | 'RELIEF_COORDINATOR'
  | 'SYSTEM_ADMIN';

export interface Role {
  id: number;
  name: RoleName;
  description?: string;
}

export interface UserRole {
  user_id: string;
  role_id: number;
  assigned_at?: string;
}

export type RoadType = 'PRIMARY' | 'SECONDARY' | 'RESIDENTIAL' | 'HIGHWAY';

export interface Ward {
  id: string;
  name: string;
  city: string;
  boundary?: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  } | null;
  created_at?: string;
}

export interface Road {
  id: string;
  ward_id?: string | null;
  name: string;
  road_type: RoadType;
  latitude: number;
  longitude: number;
  is_closed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface JwtUserPayload {
  userId: string;
  name?: string;
  email?: string;
  roles: RoleName[];
}
