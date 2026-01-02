import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Always use Supabase Postgres for both local and production
const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  throw new Error('POSTGRES_URL or POSTGRES_URL_NON_POOLING environment variable is required');
}

// Create postgres client with optimized settings
const client = postgres(connectionString, { 
  prepare: false,
  max: 10, // Connection pool size
});

// Create and export drizzle instance
export const db = drizzle(client);
