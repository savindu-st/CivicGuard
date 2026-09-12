-- ==============================================================================
-- Civic Guard — Master Database Schema (001_initial_schema.sql)
-- Target Database: Supabase PostgreSQL
-- Total Tables: 16
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. USERS & ACCESS CONTROL (3 TABLES)
-- ==============================================================================

-- 1.1 `users`
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 `roles`
CREATE TABLE IF NOT EXISTS public.roles (
    id SMALLINT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- Insert Default Standard Roles
INSERT INTO public.roles (id, name, description) VALUES
    (1, 'CITIZEN', 'Citizen user reporting hazards and requesting disaster relief'),
    (2, 'COUNCIL_OFFICER', 'Municipal officer managing triage, ward dispatch, and road closures'),
    (3, 'FIELD_CREW', 'Emergency response crew resolving hazards and uploading proof photos'),
    (4, 'RELIEF_COORDINATOR', 'Logistics coordinator managing shelters, supplies, and SOS requests'),
    (5, 'SYSTEM_ADMIN', 'Platform administrator tuning AI thresholds and managing infrastructure')
ON CONFLICT (id) DO NOTHING;

-- 1.3 `user_roles`
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role_id SMALLINT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- ==============================================================================
-- 2. SPATIAL TOPOLOGY & INFRASTRUCTURE (2 TABLES)
-- ==============================================================================

-- 2.1 `wards`
CREATE TABLE IF NOT EXISTS public.wards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    boundary JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 `roads`
CREATE TABLE IF NOT EXISTS public.roads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    road_type VARCHAR(50) DEFAULT 'SECONDARY', -- PRIMARY, SECONDARY, RESIDENTIAL, HIGHWAY
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. INCIDENT MANAGEMENT & EVIDENCE (2 TABLES)
-- ==============================================================================

-- 3.1 `incidents` (Central Core Table)
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    incident_type VARCHAR(50) NOT NULL, -- FLOOD, BLOCKED_ROAD, FALLEN_TREE, LANDSLIDE, OTHER
    description TEXT,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
    road_id UUID REFERENCES public.roads(id) ON DELETE SET NULL,
    source VARCHAR(30) NOT NULL DEFAULT 'CITIZEN', -- CITIZEN, WEATHER_FEED, RIVER_FEED
    status VARCHAR(40) NOT NULL DEFAULT 'REPORTED', -- REPORTED, ANALYZING, NEEDS_VERIFICATION, CONFIRMED, DISPATCHED, IN_PROGRESS, RESOLVED, REJECTED
    severity VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 `incident_evidence` (Citizen uploads & crew proof photos)
CREATE TABLE IF NOT EXISTS public.incident_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    file_url TEXT NOT NULL,
    evidence_type VARCHAR(30) NOT NULL, -- REPORT_PHOTO, VERIFICATION_PHOTO, COMPLETION_PHOTO
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. ENVIRONMENTAL TELEMETRY (1 TABLE)
-- ==============================================================================

-- 4.1 `environmental_readings` (Mocked/Live Weather & River Feeds)
CREATE TABLE IF NOT EXISTS public.environmental_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
    reading_type VARCHAR(30) NOT NULL, -- RAINFALL, RIVER_LEVEL
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- mm, m
    danger_threshold DECIMAL(10,2),
    recorded_at TIMESTAMPTZ NOT NULL,
    source VARCHAR(50) DEFAULT 'SIMULATED_SENSOR',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ==============================================================================
-- 5. AI & SYSTEM ANALYSIS ENGINE (2 TABLES)
-- ==============================================================================

-- 5.1 `analysis_results` (Stores output of the 5 independent checks)
CREATE TABLE IF NOT EXISTS public.analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    analysis_type VARCHAR(30) NOT NULL, -- WEATHER, CLUSTER, IMAGE, LOCATION, RISK
    method VARCHAR(20) NOT NULL, -- SYSTEM, AI
    result VARCHAR(100),
    score DECIMAL(5,4),
    confidence DECIMAL(5,4),
    reason TEXT,
    input_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.2 `hazard_verdicts` (Aggregator composite decision)
CREATE TABLE IF NOT EXISTS public.hazard_verdicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    verdict VARCHAR(30) NOT NULL, -- CONFIRMED, NEEDS_VERIFICATION, REJECTED
    confidence DECIMAL(5,4) NOT NULL,
    urgency VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    reasons JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. RESPONSE & FIELD OPERATIONS (2 TABLES)
-- ==============================================================================

-- 6.1 `field_crews` (Created before tickets to satisfy foreign key order)
CREATE TABLE IF NOT EXISTS public.field_crews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    crew_name VARCHAR(100) NOT NULL,
    specialty VARCHAR(50) NOT NULL DEFAULT 'WATER_RESCUE', -- WATER_RESCUE, 4X4_DEBRIS, MEDICAL_TRIAGE, DRONE_RECON, HAM_RADIO
    district VARCHAR(50) NOT NULL DEFAULT 'Colombo', -- Colombo, Kandy, Kalutara, Ratnapura, etc.
    phone VARCHAR(20),
    equipment JSONB DEFAULT '[]'::jsonb, -- e.g. ["Inflatable Boat", "4x Life Jackets", "4WD Winch Truck"]
    availability VARCHAR(20) DEFAULT 'AVAILABLE', -- AVAILABLE, BUSY, OFF_DUTY
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.2 `council_tickets` (Council dispatch queue)
CREATE TABLE IF NOT EXISTS public.council_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    assigned_officer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_crew_id UUID REFERENCES public.field_crews(id) ON DELETE SET NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    status VARCHAR(30) DEFAULT 'OPEN', -- OPEN, ASSIGNED, ACCEPTED, IN_PROGRESS, COMPLETED, CLOSED
    required_specialty VARCHAR(50), -- e.g. 'WATER_RESCUE', '4X4_DEBRIS', 'MEDICAL_TRIAGE'
    sitrep_notes TEXT, -- Ground field situation notes
    evacuated_count INTEGER DEFAULT 0, -- Count of civilians rescued/evacuated
    route_directions JSONB DEFAULT '[]'::jsonb, -- Turn-by-turn route steps
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ==============================================================================
-- 7. RELIEF COORDINATION & LOGISTICS (3 TABLES)
-- ==============================================================================

-- 7.1 `help_requests` (Citizen SOS requests)
CREATE TABLE IF NOT EXISTS public.help_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
    help_type VARCHAR(30) NOT NULL, -- SHELTER, FOOD, WATER, MEDICAL, EVACUATION, OTHER
    description TEXT,
    people_count INTEGER DEFAULT 1,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    urgency VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    status VARCHAR(30) DEFAULT 'PENDING', -- PENDING, ASSIGNED, COMPLETED, CANCELLED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7.2 `shelters` (Disaster Relief Centers)
CREATE TABLE IF NOT EXISTS public.shelters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    capacity INTEGER NOT NULL DEFAULT 100,
    current_occupancy INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7.3 `relief_resources` (Supplies & Inventory allocated)
CREATE TABLE IF NOT EXISTS public.relief_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shelter_id UUID REFERENCES public.shelters(id) ON DELETE CASCADE,
    help_request_id UUID REFERENCES public.help_requests(id) ON DELETE SET NULL,
    resource_type VARCHAR(30) NOT NULL, -- FOOD, WATER, MEDICAL, BEDDING, CLOTHING
    resource_name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(30) DEFAULT 'PACK', -- PACK, BOTTLE, BOX, KIT, UNIT
    status VARCHAR(20) DEFAULT 'AVAILABLE', -- AVAILABLE, ASSIGNED, DEPLETED
    assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. REAL-TIME NOTIFICATIONS & ALERTS (1 TABLE)
-- ==============================================================================

-- 8.1 `notifications`
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
    ticket_id UUID REFERENCES public.council_tickets(id) ON DELETE SET NULL,
    notification_type VARCHAR(40) NOT NULL, -- AREA_ALERT, INCIDENT_CONFIRMED, TICKET_ASSIGNED, CREW_DISPATCHED, INCIDENT_RESOLVED, HELP_REQUEST_UPDATED
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 9. PERFORMANCE INDEXES (Optimized for Spatio-temporal checks)
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_ward_id ON public.incidents(ward_id);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_coords ON public.incidents(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_roads_is_closed ON public.roads(is_closed);
CREATE INDEX IF NOT EXISTS idx_roads_ward_id ON public.roads(ward_id);

CREATE INDEX IF NOT EXISTS idx_analysis_incident_id ON public.analysis_results(incident_id);
CREATE INDEX IF NOT EXISTS idx_verdicts_incident_id ON public.hazard_verdicts(incident_id);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.council_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_crew_id ON public.council_tickets(assigned_crew_id);

CREATE INDEX IF NOT EXISTS idx_env_ward_recorded ON public.environmental_readings(ward_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON public.help_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);

-- ==============================================================================
-- 10. AUTOMATIC UPDATED_AT TRIGGER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_users ON public.users;
CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_roads ON public.roads;
CREATE TRIGGER set_updated_at_roads BEFORE UPDATE ON public.roads FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_incidents ON public.incidents;
CREATE TRIGGER set_updated_at_incidents BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_tickets ON public.council_tickets;
CREATE TRIGGER set_updated_at_tickets BEFORE UPDATE ON public.council_tickets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_help_requests ON public.help_requests;
CREATE TRIGGER set_updated_at_help_requests BEFORE UPDATE ON public.help_requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_relief_resources ON public.relief_resources;
CREATE TRIGGER set_updated_at_relief_resources BEFORE UPDATE ON public.relief_resources FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
