/**
 * Civic Guard — Supabase Auth Staff Provisioning Script (TypeScript / Node.js)
 *
 * Uses the Supabase Admin API with SUPABASE_SERVICE_ROLE_KEY to provision
 * official operational staff accounts with confirmed emails and role metadata.
 *
 * Usage:
 *   npm run seed:auth --prefix backend
 *   # or
 *   cd backend && npm run seed:auth
 *   # or directly with tsx
 *   npx tsx database/seed/004_provision_supabase_auth_users.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env or current .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your environment.');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface StaffUserSeed {
  id: string;
  email: string;
  password: string;
  metadata: {
    name: string;
    role: 'COUNCIL_OFFICER' | 'FIELD_CREW' | 'RELIEF_COORDINATOR' | 'SYSTEM_ADMIN';
    department?: string;
    squadName?: string;
    specialty?: string;
    district?: string;
    phone?: string;
  };
}

const STAFF_SEEDS: StaffUserSeed[] = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'kasun.officer@cmc.gov.lk',
    password: 'Officer@123',
    metadata: {
      name: 'Kasun Perera',
      role: 'COUNCIL_OFFICER',
      department: 'Colombo Municipal Council — Emergency Operations',
      phone: '+94771234561',
    },
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'sunil.water@cmc.gov.lk',
    password: 'Crew@123',
    metadata: {
      name: 'Sunil Shantha',
      role: 'FIELD_CREW',
      squadName: 'Colombo Swift Water Rescue Unit #01',
      specialty: 'WATER_RESCUE',
      district: 'Colombo',
      phone: '+94771234562',
    },
  },
  {
    id: '33333333-3333-3333-3333-333333333334',
    email: 'sunil.crew@cmc.gov.lk',
    password: 'Crew@123',
    metadata: {
      name: 'Sunil Shantha',
      role: 'FIELD_CREW',
      squadName: 'Colombo Swift Water Rescue Unit #01',
      specialty: 'WATER_RESCUE',
      district: 'Colombo',
      phone: '+94771234562',
    },
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    email: 'bandara.4x4@civicguard.lk',
    password: 'Crew@123',
    metadata: {
      name: 'Bandara Senanayake',
      role: 'FIELD_CREW',
      squadName: 'Ratnapura 4WD Winch & Chainsaw Unit #02',
      specialty: '4X4_DEBRIS',
      district: 'Ratnapura',
      phone: '+94771234565',
    },
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    email: 'nimal.medical@civicguard.lk',
    password: 'Crew@123',
    metadata: {
      name: 'Dr. Nimal Gamage',
      role: 'FIELD_CREW',
      squadName: 'Kandy Emergency Medical & Triage Unit #01',
      specialty: 'MEDICAL_TRIAGE',
      district: 'Kandy',
      phone: '+94771234566',
    },
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'anoma.relief@redcross.lk',
    password: 'Relief@123',
    metadata: {
      name: 'Anoma Wickramasinghe',
      role: 'RELIEF_COORDINATOR',
      department: 'Sri Lanka Red Cross — Humanitarian Logistics',
      phone: '+94771234563',
    },
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@civicguard.lk',
    password: 'Admin@123',
    metadata: {
      name: 'Admin CivicGuard',
      role: 'SYSTEM_ADMIN',
      department: 'Disaster Management Centre Platform Administration',
      phone: '+94771234560',
    },
  },
];

async function provisionStaffUsers() {
  console.log('🚀 Starting Supabase Auth Staff Provisioning...');

  for (const staff of STAFF_SEEDS) {
    try {
      // Check if user already exists
      const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        console.error('Failed to list users:', listError.message);
        break;
      }

      const existing = userList?.users?.find((u) => u.email?.toLowerCase() === staff.email.toLowerCase());

      if (existing) {
        console.log(`ℹ️ Updating existing user: ${staff.email} (${staff.metadata.role})`);
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
          password: staff.password,
          email_confirm: true,
          user_metadata: staff.metadata,
        });

        if (updateError) {
          console.warn(`⚠️ Could not update ${staff.email}:`, updateError.message);
        } else {
          console.log(`✅ Updated ${staff.email} with confirmed credentials & metadata`);
        }
      } else {
        console.log(`➕ Creating new user: ${staff.email} (${staff.metadata.role})`);
        const { error: createError } = await supabaseAdmin.auth.admin.createUser({
          id: staff.id,
          email: staff.email,
          password: staff.password,
          email_confirm: true,
          user_metadata: staff.metadata,
        });

        if (createError) {
          console.warn(`⚠️ Could not create ${staff.email}:`, createError.message);
        } else {
          console.log(`✅ Created ${staff.email}`);
        }
      }
    } catch (err: any) {
      console.error(`❌ Unexpected error provisioning ${staff.email}:`, err.message);
    }
  }

  console.log('🎉 Supabase Auth Staff Provisioning completed!');
}

provisionStaffUsers();
