import { create } from 'zustand';
import { api } from '../services/api';

export type RoleName = 'CITIZEN' | 'COUNCIL_OFFICER' | 'FIELD_CREW' | 'RELIEF_COORDINATOR' | 'SYSTEM_ADMIN';

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: RoleName;
}

export const DEMO_PERSONAS: Record<RoleName, AuthUser> = {
  FIELD_CREW: {
    userId: '33333333-3333-3333-3333-333333333333',
    name: 'Sunil Shantha (Crew Lead)',
    email: 'sunil.crew@cmc.gov.lk',
    role: 'FIELD_CREW',
  },
  COUNCIL_OFFICER: {
    userId: '22222222-2222-2222-2222-222222222222',
    name: 'Kasun Perera (Officer)',
    email: 'kasun.officer@cmc.gov.lk',
    role: 'COUNCIL_OFFICER',
  },
  CITIZEN: {
    userId: '55555555-5555-5555-5555-555555555555',
    name: 'Nimal Silva (Citizen)',
    email: 'nimal.citizen@gmail.com',
    role: 'CITIZEN',
  },
  RELIEF_COORDINATOR: {
    userId: '44444444-4444-4444-4444-444444444444',
    name: 'Anoma Wickramasinghe (Relief)',
    email: 'anoma.relief@redcross.lk',
    role: 'RELIEF_COORDINATOR',
  },
  SYSTEM_ADMIN: {
    userId: '11111111-1111-1111-1111-111111111111',
    name: 'Admin CivicGuard',
    email: 'admin@civicguard.lk',
    role: 'SYSTEM_ADMIN',
  },
};

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  switchPersona: (role: RoleName) => Promise<void>;
  logout: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('civicguard_token'),
  isLoading: false,
  error: null,

  switchPersona: async (role: RoleName) => {
    set({ isLoading: true, error: null });
    try {
      const persona = DEMO_PERSONAS[role];
      // Request signed JWT demo token from backend
      const res = await api.post('/api/incidents/auth/demo-token', {
        role,
        userId: persona.userId,
        name: persona.name,
      });

      const token = res.data?.data?.token;
      if (token) {
        localStorage.setItem('civicguard_token', token);
        localStorage.setItem('civicguard_role', role);
        set({
          user: persona,
          token,
          isLoading: false,
        });
      }
    } catch (err: any) {
      console.error('Failed to generate demo token:', err);
      // Fallback: still set user locally
      const persona = DEMO_PERSONAS[role];
      set({
        user: persona,
        isLoading: false,
        error: err.message,
      });
    }
  },

  logout: () => {
    localStorage.removeItem('civicguard_token');
    localStorage.removeItem('civicguard_role');
    set({ user: null, token: null });
  },

  initializeAuth: async () => {
    const savedRole = (localStorage.getItem('civicguard_role') as RoleName) || 'FIELD_CREW';
    const savedToken = localStorage.getItem('civicguard_token');
    if (savedToken && DEMO_PERSONAS[savedRole]) {
      set({
        user: DEMO_PERSONAS[savedRole],
        token: savedToken,
      });
    } else {
      // Default to FIELD_CREW demo token
      await get().switchPersona('FIELD_CREW');
    }
  },
}));
