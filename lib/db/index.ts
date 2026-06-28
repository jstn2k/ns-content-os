import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Single shared postgres.js client + Drizzle instance.
 *
 * We connect through the Supabase "Session pooler" (port 5432), which supports
 * prepared statements. If you later switch DATABASE_URL to the Transaction
 * pooler (port 6543) for serverless, set `prepare: false` below.
 *
 * A global singleton avoids exhausting connections during Next.js hot reload.
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const globalForDb = globalThis as unknown as {
  __pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__pgClient ??
  postgres(connectionString, {
    ssl: 'require',
    max: 10,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__pgClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
