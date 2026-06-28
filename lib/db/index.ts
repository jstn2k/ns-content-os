import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Single shared postgres.js client + Drizzle instance.
 *
 * `prepare: false` + a small pool make this safe behind either Supabase pooler.
 * For serverless (Vercel) use the **Transaction pooler** URL (port 6543); for
 * local dev / long-lived servers the Session pooler (5432) is fine. A global
 * singleton avoids exhausting connections during hot reload and warm invocations.
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
    prepare: false,
    max: 3,
    idle_timeout: 20,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__pgClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
