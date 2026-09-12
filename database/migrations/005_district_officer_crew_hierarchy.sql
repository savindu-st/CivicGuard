-- ==============================================================================
-- Civic Guard — Database Migration 005: 25-District Officer & Crew Command Hierarchy
-- Introduces districts lookup, links officers to districts, and assigns 10 field crews per officer.
-- ==============================================================================

-- 1. DISTRICTS LOOKUP TABLE
CREATE TABLE IF NOT EXISTS public.districts (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(50) UNIQUE NOT NULL,
    province VARCHAR(50) NOT NULL,
    hq_lat DECIMAL(10, 7) NOT NULL,
    hq_lon DECIMAL(10, 7) NOT NULL,
    emergency_hotline VARCHAR(25) DEFAULT '117',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ENHANCE USERS WITH DISTRICT
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS district VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_users_district ON public.users(district);

-- 3. ENHANCE FIELD CREWS TABLE
ALTER TABLE public.field_crews ADD COLUMN IF NOT EXISTS officer_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.field_crews ADD COLUMN IF NOT EXISTS crew_code VARCHAR(30) UNIQUE;
ALTER TABLE public.field_crews ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 5;

CREATE INDEX IF NOT EXISTS idx_field_crews_district ON public.field_crews(district);
CREATE INDEX IF NOT EXISTS idx_field_crews_officer_id ON public.field_crews(officer_id);
CREATE INDEX IF NOT EXISTS idx_field_crews_availability ON public.field_crews(availability);

-- 4. AGGREGATED COMMAND VIEW
CREATE OR REPLACE VIEW public.vw_district_command_hierarchy AS
SELECT 
    d.code AS district_code,
    d.name AS district_name,
    d.province,
    d.hq_lat,
    d.hq_lon,
    d.emergency_hotline,
    u.id AS officer_id,
    u.name AS officer_name,
    u.email AS officer_email,
    u.phone AS officer_phone,
    COUNT(c.id) AS assigned_crew_count,
    COUNT(CASE WHEN c.availability = 'AVAILABLE' THEN 1 END) AS available_crews,
    COUNT(CASE WHEN c.availability = 'BUSY' THEN 1 END) AS busy_crews,
    COUNT(CASE WHEN c.availability = 'OFF_DUTY' THEN 1 END) AS off_duty_crews
FROM public.districts d
LEFT JOIN public.users u ON LOWER(TRIM(u.district)) = LOWER(TRIM(d.name))
LEFT JOIN public.field_crews c ON c.officer_id = u.id
GROUP BY d.code, d.name, d.province, d.hq_lat, d.hq_lon, d.emergency_hotline, u.id, u.name, u.email, u.phone;
