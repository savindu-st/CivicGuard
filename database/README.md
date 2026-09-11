# Database Schema & Seed Setup

This directory contains the finalized **16-table PostgreSQL schema** and realistic Sri Lankan demo seed data.

## Execution in Supabase SQL Editor

To set up your database in Supabase:

1. Open your **Supabase Project Dashboard**.
2. Navigate to **SQL Editor** (left sidebar).
3. Open and run:
   - [`migrations/001_initial_schema.sql`](file:///e:/semester%204/Projects/compititions/codearena/codes/webapp%20and%20backend/CivicGuard/database/migrations/001_initial_schema.sql) — *Creates 16 tables, foreign keys, performance indices, and updated_at triggers.*
4. Next, open and run:
   - [`seed/002_seed_sri_lanka_wards.sql`](file:///e:/semester%204/Projects/compititions/codearena/codes/webapp%20and%20backend/CivicGuard/database/seed/002_seed_sri_lanka_wards.sql) — *Seeds users, roles, Colombo & Kandy wards, roads, shelters, relief supplies, and gauges.*

## Storage Buckets Setup
In Supabase Dashboard ➔ **Storage**:
Create 2 Public Buckets:
- `incident-photos`
- `resolution-photos`
