import { create } from 'zustand';
import { api } from '../services/api';
import { supabase } from '../services/supabaseClient';

export type RoleName = 'CITIZEN' | 'COUNCIL_OFFICER' | 'FIELD_CREW' | 'RELIEF_COORDINATOR' | 'SYSTEM_ADMIN';

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: RoleName;
  department?: string;
  squadName?: string;
  specialty?: string;
  district?: string;
  phone?: string;
}

export const DEMO_CREDENTIALS: Record<RoleName, { email: string; password: string; name: string; defaultDestination: string }> = {
  COUNCIL_OFFICER: {
    email: 'kasun.officer@cmc.gov.lk',
    password: 'Officer@123',
    name: 'Kasun Perera (Officer)',
    defaultDestination: '/officer',
  },
  FIELD_CREW: {
    email: 'sunil.water@cmc.gov.lk',
    password: 'Crew@123',
    name: 'Sunil Shantha (Crew Lead)',
    defaultDestination: '/crew',
  },
  RELIEF_COORDINATOR: {
    email: 'anoma.relief@redcross.lk',
    password: 'Relief@123',
    name: 'Anoma Wickramasinghe (Relief)',
    defaultDestination: '/relief',
  },
  SYSTEM_ADMIN: {
    email: 'admin@civicguard.lk',
    password: 'Admin@123',
    name: 'Admin CivicGuard',
    defaultDestination: '/officer',
  },
  CITIZEN: {
    email: 'nimal.citizen@gmail.com',
    password: 'Citizen@123',
    name: 'Nimal Silva (Citizen)',
    defaultDestination: '/map',
  },
};

export const DEMO_PERSONAS: Record<RoleName, AuthUser> = {
  FIELD_CREW: {
    userId: '33333333-3333-3333-3333-333333333333',
    name: 'Sunil Shantha (Crew Lead)',
    email: 'sunil.water@cmc.gov.lk',
    role: 'FIELD_CREW',
    squadName: 'Colombo Swift Water Rescue Unit #01',
    specialty: 'WATER_RESCUE',
    district: 'Colombo',
  },
  COUNCIL_OFFICER: {
    userId: '22222222-2222-2222-2222-222222222222',
    name: 'Kasun Perera (Officer)',
    email: 'kasun.officer@cmc.gov.lk',
    role: 'COUNCIL_OFFICER',
    department: 'Colombo Municipal Council — Emergency Operations',
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
    department: 'Sri Lanka Red Cross — Humanitarian Logistics',
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
  loginWithPassword: (email: string, password: string) => Promise<AuthUser>;
  loginWithDemo: (role: RoleName) => Promise<AuthUser>;
  switchPersona: (role: RoleName) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

function parseUserFromSession(sessionUser: any): AuthUser {
  const meta = sessionUser?.user_metadata || {};
  const email = sessionUser?.email || '';

  // Determine role from metadata or fallback by email pattern
  let role: RoleName = meta.role;
  if (!role) {
    if (email.includes('officer')) role = 'COUNCIL_OFFICER';
    else if (email.includes('crew') || email.includes('water') || email.includes('4x4') || email.includes('medical')) role = 'FIELD_CREW';
    else if (email.includes('relief')) role = 'RELIEF_COORDINATOR';
    else if (email.includes('admin')) role = 'SYSTEM_ADMIN';
    else role = 'CITIZEN';
  }

  return {
    userId: sessionUser.id,
    email: sessionUser.email || '',
    name: meta.name || email.split('@')[0] || 'Operational User',
    role,
    department: meta.department,
    squadName: meta.squadName,
    specialty: meta.specialty,
    district: meta.district,
    phone: meta.phone,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('civicguard_token'),
  isLoading: true,
  error: null,

  loginWithPassword: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.session || !data.user) {
        throw new Error('Authentication succeeded but no active session was returned.');
      }

      const authUser = parseUserFromSession(data.user);
      const token = data.session.access_token;

      localStorage.setItem('civicguard_token', token);
      localStorage.setItem('civicguard_role', authUser.role);

      set({
        user: authUser,
        token,
        isLoading: false,
        error: null,
      });

      return authUser;
    } catch (err: any) {
      console.warn('Supabase Auth error:', err.message);
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  loginWithDemo: async (role: RoleName) => {
    set({ isLoading: true, error: null });
    const creds = DEMO_CREDENTIALS[role];

    try {
      // Try real Supabase login with demo credentials first
      const user = await get().loginWithPassword(creds.email, creds.password);
      return user;
    } catch (err: any) {
      console.info(`Supabase Auth sign-in failed (${err.message}). Using local demo credentials fallback.`);

      // Fallback to demo persona and generate backend demo token
      const persona = DEMO_PERSONAS[role];
      try {
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
            error: null,
          });
          return persona;
        }
      } catch (backendErr) {
        console.warn('Backend demo token fallback warning:', backendErr);
      }

      // Local state fallback
      localStorage.setItem('civicguard_role', role);
      set({
        user: persona,
        token: 'demo-local-token-' + role,
        isLoading: false,
        error: null,
      });
      return persona;
    }
  },

  switchPersona: async (role: RoleName) => {
    await get().loginWithDemo(role);
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut warning:', err);
    }
    localStorage.removeItem('civicguard_token');
    localStorage.removeItem('civicguard_role');
    set({ user: null, token: null, isLoading: false, error: null });
  },

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      // 1. Check if an active Supabase session exists
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const authUser = parseUserFromSession(session.user);
        const token = session.access_token;
        localStorage.setItem('civicguard_token', token);
        localStorage.setItem('civicguard_role', authUser.role);
        set({
          user: authUser,
          token,
          isLoading: false,
        });
      } else {
        // No active Supabase session
        // Check if there was a previous demo role/token stored
        const savedToken = localStorage.getItem('civicguard_token');
        const savedRole = localStorage.getItem('civicguard_role') as RoleName | null;

        if (savedToken && savedRole && DEMO_PERSONAS[savedRole]) {
          set({
            user: DEMO_PERSONAS[savedRole],
            token: savedToken,
            isLoading: false,
          });
        } else {
          // Zero-friction visitor: remain unauthenticated citizen guest!
          set({
            user: null,
            token: null,
            isLoading: false,
          });
        }
      }

      // 2. Listen to Supabase auth state changes (e.g. token refresh, sign-in, sign-out)
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const authUser = parseUserFromSession(session.user);
          set({
            user: authUser,
            token: session.access_token,
            isLoading: false,
          });
          localStorage.setItem('civicguard_token', session.access_token);
          localStorage.setItem('civicguard_role', authUser.role);
        } else if (_event === 'SIGNED_OUT') {
          set({ user: null, token: null, isLoading: false });
          localStorage.removeItem('civicguard_token');
          localStorage.removeItem('civicguard_role');
        }
      });
    } catch (err: any) {
      console.warn('Auth initialization error:', err.message);
      set({ user: null, token: null, isLoading: false });
    }
  },
}));
