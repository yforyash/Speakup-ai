import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("⚠️ Warning: DATABASE_URL is not set in the environment variables!");
}

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' || connectionString?.includes('supabase.co')
    ? { rejectUnauthorized: false }
    : false
});

export const query = (text, params) => pool.query(text, params);
