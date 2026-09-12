-- ==============================================================================
-- Civic Guard — Supabase Auth Staff Provisioning Seed (004_provision_supabase_auth_users.sql)
-- Provisions official operational staff accounts directly into auth.users schema.
-- Passwords encrypted via pgcrypto blowfish (crypt(password, gen_salt('bf')))
-- Compatible with Supabase GoTrue Auth signInWithPassword
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COUNCIL OFFICER: Kasun Perera (Officer@123)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'kasun.officer@cmc.gov.lk',
    crypt('Officer@123', gen_salt('bf', 10)),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Kasun Perera","role":"COUNCIL_OFFICER","department":"Colombo Municipal Council — Emergency Operations","phone":"+94771234561"}'::jsonb,
    FALSE,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    encrypted_password = crypt('Officer@123', gen_salt('bf', 10)),
    raw_user_meta_data = '{"name":"Kasun Perera","role":"COUNCIL_OFFICER","department":"Colombo Municipal Council — Emergency Operations","phone":"+94771234561"}'::jsonb,
    email_confirmed_at = NOW(),
    updated_at = NOW();

-- 2. FIELD CREW LEAD (Water Rescue): Sunil Shantha (Crew@123)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'sunil.water@cmc.gov.lk',
    crypt('Crew@123', gen_salt('bf', 10)),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Sunil Shantha","role":"FIELD_CREW","squadName":"Colombo Swift Water Rescue Unit #01","specialty":"WATER_RESCUE","district":"Colombo","phone":"+94771234562"}'::jsonb,
    FALSE,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    encrypted_password = crypt('Crew@123', gen_salt('bf', 10)),
    raw_user_meta_data = '{"name":"Sunil Shantha","role":"FIELD_CREW","squadName":"Colombo Swift Water Rescue Unit #01","specialty":"WATER_RESCUE","district":"Colombo","phone":"+94771234562"}'::jsonb,
    email_confirmed_at = NOW(),
    updated_at = NOW();

-- Also support alias sunil.crew@cmc.gov.lk for backward compatibility if used
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333334',
    'authenticated',
    'authenticated',
    'sunil.crew@cmc.gov.lk',
    crypt('Crew@123', gen_salt('bf', 10)),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Sunil Shantha","role":"FIELD_CREW","squadName":"Colombo Swift Water Rescue Unit #01","specialty":"WATER_RESCUE","district":"Colombo","phone":"+94771234562"}'::jsonb,
    FALSE,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    encrypted_password = crypt('Crew@123', gen_salt('bf', 10)),
    raw_user_meta_data = '{"name":"Sunil Shantha","role":"FIELD_CREW","squadName":"Colombo Swift Water Rescue Unit #01","specialty":"WATER_RESCUE","district":"Colombo","phone":"+94771234562"}'::jsonb,
    email_confirmed_at = NOW(),
    updated_at = NOW();

-- 3. FIELD CREW LEAD (4x4 Debris): Bandara Senanayake (Crew@123)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '66666666-6666-6666-6666-666666666666',
    'authenticated',
    'authenticated',
    'bandara.4x4@civicguard.lk',
    crypt('Crew@123', gen_salt('bf', 10)),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Bandara Senanayake","role":"FIELD_CREW","squadName":"Ratnapura 4WD Winch & Chainsaw Unit #02","specialty":"4X4_DEBRIS","district":"Ratnapura","phone":"+94771234565"}'::jsonb,
    FALSE,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    encrypted_password = crypt('Crew@123', gen_salt('bf', 10)),
    raw_user_meta_data = '{"name":"Bandara Senanayake","role":"FIELD_CREW","squadName":"Ratnapura 4WD Winch & Chainsaw Unit #02","specialty":"4X4_DEBRIS","district":"Ratnapura","phone":"+94771234565"}'::jsonb,
    email_confirmed_at = NOW(),
    updated_at = NOW();

-- 4. FIELD CREW LEAD (Medical Triage): Dr. Nimal Gamage (Crew@123)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '77777777-7777-7777-7777-777777777777',
    'authenticated',
    'authenticated',
    'nimal.medical@civicguard.lk',
    crypt('Crew@123', gen_salt('bf', 10)),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Dr. Nimal Gamage","role":"FIELD_CREW","squadName":"Kandy Emergency Medical & Triage Unit #01","specialty":"MEDICAL_TRIAGE","district":"Kandy","phone":"+94771234566"}'::jsonb,
    FALSE,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    encrypted_password = crypt('Crew@123', gen_salt('bf', 10)),
    raw_user_meta_data = '{"name":"Dr. Nimal Gamage","role":"FIELD_CREW","squadName":"Kandy Emergency Medical & Triage Unit #01","specialty":"MEDICAL_TRIAGE","district":"Kandy","phone":"+94771234566"}'::jsonb,
    email_confirmed_at = NOW(),
    updated_at = NOW();

-- 5. RELIEF COORDINATOR: Anoma Wickramasinghe (Relief@123)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-4444-444444444444',
    'authenticated',
    'authenticated',
    'anoma.relief@redcross.lk',
    crypt('Relief@123', gen_salt('bf', 10)),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Anoma Wickramasinghe","role":"RELIEF_COORDINATOR","department":"Sri Lanka Red Cross — Humanitarian Logistics","phone":"+94771234563"}'::jsonb,
    FALSE,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    encrypted_password = crypt('Relief@123', gen_salt('bf', 10)),
    raw_user_meta_data = '{"name":"Anoma Wickramasinghe","role":"RELIEF_COORDINATOR","department":"Sri Lanka Red Cross — Humanitarian Logistics","phone":"+94771234563"}'::jsonb,
    email_confirmed_at = NOW(),
    updated_at = NOW();

-- 6. SYSTEM ADMIN: Admin CivicGuard (Admin@123)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'admin@civicguard.lk',
    crypt('Admin@123', gen_salt('bf', 10)),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Admin CivicGuard","role":"SYSTEM_ADMIN","department":"Disaster Management Centre Platform Administration","phone":"+94771234560"}'::jsonb,
    TRUE,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    encrypted_password = crypt('Admin@123', gen_salt('bf', 10)),
    raw_user_meta_data = '{"name":"Admin CivicGuard","role":"SYSTEM_ADMIN","department":"Disaster Management Centre Platform Administration","phone":"+94771234560"}'::jsonb,
    email_confirmed_at = NOW(),
    updated_at = NOW();
