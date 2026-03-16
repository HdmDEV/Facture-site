import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_SSL,
} = process.env;

export const pool = new pg.Pool({
  host: DB_HOST,
  port: DB_PORT ? Number(DB_PORT) : 5432,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  ssl: DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
