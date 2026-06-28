/**
 * Typed, validated access to environment variables.
 * Server-only values throw if read without being set, so failures are loud
 * and early instead of surfacing as confusing runtime errors later.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

export const env = {
  appUrl: optional('NEXT_PUBLIC_APP_URL', 'https://localhost:3000'),

  // Database
  databaseUrl: () => required('DATABASE_URL'),

  // Crypto / sessions
  tokenEncryptionKey: () => required('TOKEN_ENCRYPTION_KEY'),
  cronSecret: () => required('CRON_SECRET'),

  // Admin login (single-tenant MVP)
  adminEmail: () => required('ADMIN_EMAIL'),
  adminPassword: () => required('ADMIN_PASSWORD'),

  // Meta / Instagram
  metaAppId: () => required('META_APP_ID'),
  metaAppSecret: () => required('META_APP_SECRET'),
  instagramRedirectUri: () =>
    optional('INSTAGRAM_REDIRECT_URI', 'https://localhost:3000/api/auth/instagram/callback'),
  graphVersion: () => optional('META_GRAPH_VERSION', 'v23.0'),

  // AI
  aiProvider: () => optional('AI_PROVIDER', 'anthropic'),
  anthropicApiKey: () => optional('ANTHROPIC_API_KEY'),
} as const;

/** Instagram scopes requested during OAuth (Instagram API with Instagram Login). */
export const INSTAGRAM_SCOPES = [
  'instagram_business_basic',
  'instagram_business_content_publish',
  'instagram_business_manage_insights',
  'instagram_business_manage_comments',
] as const;
