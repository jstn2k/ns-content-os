import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load local secrets (Next.js uses .env.local; drizzle-kit needs it loaded explicitly)
config({ path: '.env.local' });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set (check .env.local)');
}

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: url.includes('sslmode') ? url : `${url}?sslmode=require`,
  },
  verbose: true,
  strict: true,
});
