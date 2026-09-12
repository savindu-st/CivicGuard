-- ==============================================================================
-- Civic Guard — Relief Desk Demo SOS Seed Data (003_seed_relief_sos_requests.sql)
-- Geographic Context: Sri Lanka (Colombo Havelock, Cinnamon Gardens, Grandpass, Kandy)
-- Covers P1, P2, P3, and P4 Urgency Tiers
-- ==============================================================================

INSERT INTO public.help_requests (id, user_id, help_type, description, people_count, latitude, longitude, urgency, status, created_at) VALUES
    (
        'f1111111-1111-1111-1111-111111111111',
        '55555555-5555-5555-5555-555555555555',
        'EVACUATION',
        '🚨 FLASH FLOOD RESCUE: Family trapped on 2nd floor roof near Havelock canal bridge. Water level rising rapidly, 1 infant and 1 elderly grandmother (82 yrs). Boat/dinghy evacuation urgently required.',
        4,
        6.8792000,
        79.8665000,
        'CRITICAL',
        'PENDING',
        NOW() - INTERVAL '25 minutes'
    ),
    (
        'f2222222-2222-2222-2222-222222222222',
        '55555555-5555-5555-5555-555555555555',
        'MEDICAL',
        '🚨 CRITICAL MEDICAL NEED: Diabetic patient stranded in flooded ground-floor house on Bauddhaloka corridor. Power cut off, urgent need for insulin refrigeration and medical transfer.',
        2,
        6.9025000,
        79.8715000,
        'CRITICAL',
        'PENDING',
        NOW() - INTERVAL '40 minutes'
    ),
    (
        'f3333333-3333-3333-3333-333333333333',
        '55555555-5555-5555-5555-555555555555',
        'SHELTER',
        '⚠️ HIGH RISK: Stranded household with 3 young school children. Heavy roof collapse danger near Kelani bridge flyover. Urgent dry emergency shelter and bedding requested.',
        5,
        6.9475000,
        79.8765000,
        'HIGH',
        'PENDING',
        NOW() - INTERVAL '1 hour'
    ),
    (
        'f4444444-4444-4444-4444-444444444444',
        '55555555-5555-5555-5555-555555555555',
        'FOOD',
        '📦 DISPLACED HOUSEHOLD: Small shopkeeper family cut off by Peradeniya Getambe floodwaters. Safe on upper floor but out of drinking water and rations for 18 hours.',
        3,
        7.2725000,
        80.6025000,
        'MEDIUM',
        'PENDING',
        NOW() - INTERVAL '2 hours'
    ),
    (
        'f5555555-5555-5555-5555-555555555555',
        '55555555-5555-5555-5555-555555555555',
        'WATER',
        'ℹ️ INQUIRY: Clean drinking water requested for 1 resident following tap water turbidity/contamination after canal backflow in Havelock sector.',
        1,
        6.8810000,
        79.8670000,
        'LOW',
        'PENDING',
        NOW() - INTERVAL '3 hours'
    )
ON CONFLICT (id) DO NOTHING;
