-- ==============================================================================
-- Civic Guard — Demo Seed Data (002_seed_sri_lanka_wards.sql)
-- Geographic Context: Sri Lanka (Colombo & Kandy Flood-Prone Zones)
-- All UUIDs formatted with valid hexadecimal characters (0-9, a-f)
-- ==============================================================================

-- 1. SEED USERS
INSERT INTO public.users (id, name, email, phone) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Admin CivicGuard', 'admin@civicguard.lk', '+94771234560'),
    ('22222222-2222-2222-2222-222222222222', 'Kasun Perera (Officer)', 'kasun.officer@cmc.gov.lk', '+94771234561'),
    ('33333333-3333-3333-3333-333333333333', 'Sunil Shantha (Water Rescue Lead)', 'sunil.water@cmc.gov.lk', '+94771234562'),
    ('44444444-4444-4444-4444-444444444444', 'Anoma Wickramasinghe (Relief)', 'anoma.relief@redcross.lk', '+94771234563'),
    ('55555555-5555-5555-5555-555555555555', 'Nimal Silva (Citizen)', 'nimal.citizen@gmail.com', '+94771234564'),
    ('66666666-6666-6666-6666-666666666666', 'Bandara Senanayake (4x4 Debris Lead)', 'bandara.4x4@civicguard.lk', '+94771234565'),
    ('77777777-7777-7777-7777-777777777777', 'Dr. Nimal Gamage (Medical Lead)', 'nimal.medical@civicguard.lk', '+94771234566'),
    ('88888888-8888-8888-8888-888888888888', 'Kasun Mendis (Community Volunteer)', 'kasun.volunteer@gmail.com', '+94771234567')
ON CONFLICT (id) DO NOTHING;

-- 2. ASSIGN USER ROLES
INSERT INTO public.user_roles (user_id, role_id) VALUES
    ('11111111-1111-1111-1111-111111111111', 5), -- SYSTEM_ADMIN
    ('22222222-2222-2222-2222-222222222222', 2), -- COUNCIL_OFFICER
    ('33333333-3333-3333-3333-333333333333', 3), -- FIELD_CREW (Water Rescue)
    ('44444444-4444-4444-4444-444444444444', 4), -- RELIEF_COORDINATOR
    ('55555555-5555-5555-5555-555555555555', 1), -- CITIZEN
    ('66666666-6666-6666-6666-666666666666', 3), -- FIELD_CREW (4x4 Debris)
    ('77777777-7777-7777-7777-777777777777', 3), -- FIELD_CREW (Medical)
    ('88888888-8888-8888-8888-888888888888', 1)  -- CITIZEN / COMMUNITY VOLUNTEER
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 3. SEED WARDS (Colombo, Kandy & Ratnapura) (Prefix 'a' is valid hex)
INSERT INTO public.wards (id, name, city) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'Ward 05 - Havelock Town', 'Colombo'),
    ('a2222222-2222-2222-2222-222222222222', 'Ward 07 - Cinnamon Gardens', 'Colombo'),
    ('a3333333-3333-3333-3333-333333333333', 'Ward 02 - Peradeniya River Basin', 'Kandy'),
    ('a4444444-4444-4444-4444-444444444444', 'Ward 10 - Grandpass & Kelani Bank', 'Colombo'),
    ('a5555555-5555-5555-5555-555555555555', 'Ward 01 - Kalu Ganga Basin', 'Ratnapura')
ON CONFLICT (id) DO NOTHING;

-- 4. SEED ROADS (Key Arterial & Secondary Roads) (Prefix 'b' is valid hex)
INSERT INTO public.roads (id, ward_id, name, road_type, latitude, longitude, is_closed) VALUES
    ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Havelock Road (Near Canal Bridge)', 'PRIMARY', 6.8785000, 79.8655000, FALSE),
    ('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Dickmans Road (Lester James Peiris Mawatha)', 'SECONDARY', 6.8830000, 79.8610000, FALSE),
    ('b3333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', 'Bauddhaloka Mawatha', 'PRIMARY', 6.9010000, 79.8730000, FALSE),
    ('b4444444-4444-4444-4444-444444444444', 'a3333333-3333-3333-3333-333333333333', 'Peradeniya Road (Getambe Sector)', 'PRIMARY', 7.2721000, 80.6022000, FALSE),
    ('b5555555-5555-5555-5555-555555555555', 'a4444444-4444-4444-4444-444444444444', 'Baseline Road (Kelani Bridge Flyover Sector)', 'HIGHWAY', 6.9480000, 79.8780000, FALSE),
    ('b6666666-6666-6666-6666-666666666666', 'a5555555-5555-5555-5555-555555555555', 'A4 Highway (Ratnapura - Pelmadulla Sector)', 'PRIMARY', 6.6820000, 80.4040000, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 5. SEED FIELD CREWS (Prefix 'c' is valid hex)
INSERT INTO public.field_crews (id, user_id, crew_name, specialty, district, phone, equipment, availability, latitude, longitude) VALUES
    ('c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Colombo Swift Water Rescue Unit #01', 'WATER_RESCUE', 'Colombo', '+94771234562', '["Inflatable Boat (15HP)", "4x Life Jackets", "Water Extraction Pump", "Tow Ropes"]'::jsonb, 'AVAILABLE', 6.8790000, 79.8660000),
    ('c2222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'Ratnapura 4WD Winch & Chainsaw Unit #02', '4X4_DEBRIS', 'Ratnapura', '+94771234565', '["4WD Winch Truck", "2x Stihl Chainsaws", "Hydraulic Spreader", "Tow Straps"]'::jsonb, 'AVAILABLE', 6.6828000, 80.4036000),
    ('c3333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 'Kandy Emergency Medical & Triage Unit #01', 'MEDICAL_TRIAGE', 'Kandy', '+94771234566', '["Mobile Trauma Kit", "Portable Oxygen Concentrator", "Foldable Stretchers", "Emergency Antibiotics"]'::jsonb, 'AVAILABLE', 7.2710000, 80.6010000)
ON CONFLICT (id) DO NOTHING;

-- 6. SEED EMERGENCY SHELTERS (Prefix 'd' is valid hex)
INSERT INTO public.shelters (id, ward_id, name, address, latitude, longitude, capacity, current_occupancy, is_active) VALUES
    ('d1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Havelock Community Center Shelter', 'No 45, Mayura Place, Colombo 05', 6.8795000, 79.8680000, 150, 42, TRUE),
    ('d2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Royal College Sports Complex Pavilion', 'Rajakeeya Mawatha, Colombo 07', 6.9040000, 79.8620000, 300, 75, TRUE),
    ('d3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'Getambe Cultural Hall Relief Center', 'Peradeniya Rd, Kandy', 7.2735000, 80.6040000, 200, 15, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 7. SEED RELIEF RESOURCES (Prefix 'e' is valid hex)
INSERT INTO public.relief_resources (id, shelter_id, resource_type, resource_name, quantity, unit, status) VALUES
    ('e1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'FOOD', 'Dry Ration Relief Packs', 350, 'PACK', 'AVAILABLE'),
    ('e2222222-2222-2222-2222-222222222222', 'd1111111-1111-1111-1111-111111111111', 'WATER', '5L Purified Water Bottles', 800, 'BOTTLE', 'AVAILABLE'),
    ('e3333333-3333-3333-3333-333333333333', 'd1111111-1111-1111-1111-111111111111', 'MEDICAL', 'Emergency First Aid Kits', 50, 'KIT', 'AVAILABLE'),
    ('e4444444-4444-4444-4444-444444444444', 'd2222222-2222-2222-2222-222222222222', 'BEDDING', 'Emergency Foldable Cots & Blankets', 200, 'UNIT', 'AVAILABLE'),
    ('e5555555-5555-5555-5555-555555555555', 'd3333333-3333-3333-3333-333333333333', 'FOOD', 'Cooked Meal Packages (Hot Food)', 120, 'PACK', 'AVAILABLE')
ON CONFLICT (id) DO NOTHING;

-- 8. SEED BASELINE ENVIRONMENTAL READINGS (Rainfall & River Levels)
INSERT INTO public.environmental_readings (id, ward_id, reading_type, value, unit, danger_threshold, recorded_at, source) VALUES
    (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', 'RAINFALL', 91.50, 'mm', 50.00, NOW() - INTERVAL '15 minutes', 'MET_DEPT_COLOMBO'),
    (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', 'RIVER_LEVEL', 3.60, 'm', 3.00, NOW() - INTERVAL '15 minutes', 'CANAL_GAUGE_05'),
    (gen_random_uuid(), 'a3333333-3333-3333-3333-333333333333', 'RAINFALL', 110.00, 'mm', 60.00, NOW() - INTERVAL '10 minutes', 'MET_DEPT_KANDY'),
    (gen_random_uuid(), 'a3333333-3333-3333-3333-333333333333', 'RIVER_LEVEL', 5.80, 'm', 4.50, NOW() - INTERVAL '10 minutes', 'MAHAWELI_GAUGE_02')
ON CONFLICT DO NOTHING;
