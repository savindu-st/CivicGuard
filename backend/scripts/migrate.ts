import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set in .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL database.');

    const sql = `
      ALTER TABLE public.council_tickets ADD COLUMN IF NOT EXISTS required_specialty VARCHAR(50);
      ALTER TABLE public.council_tickets ADD COLUMN IF NOT EXISTS sitrep_notes TEXT;
      ALTER TABLE public.council_tickets ADD COLUMN IF NOT EXISTS evacuated_count INTEGER DEFAULT 0;
      ALTER TABLE public.council_tickets ADD COLUMN IF NOT EXISTS route_directions JSONB DEFAULT '[]'::jsonb;

      ALTER TABLE public.field_crews ADD COLUMN IF NOT EXISTS specialty VARCHAR(50) DEFAULT 'WATER_RESCUE';
      ALTER TABLE public.field_crews ADD COLUMN IF NOT EXISTS district VARCHAR(50) DEFAULT 'Colombo';
      ALTER TABLE public.field_crews ADD COLUMN IF NOT EXISTS equipment JSONB DEFAULT '[]'::jsonb;

      NOTIFY pgrst, 'reload schema';
    `;

    await client.query(sql);
    console.log('Schema migration applied successfully and PostgREST cache reloaded!');
  } catch (err: any) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
