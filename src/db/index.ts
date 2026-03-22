import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Drizzle instance with schema
export const db = drizzle(pool, { schema });

// Export pool for raw queries if needed
export { pool };

// Export schema
export * from "./schema";

