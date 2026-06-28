import { eq } from 'drizzle-orm';
import { db } from './index';
import {
  users,
  igAccounts,
  oauthTokens,
  appSettings,
  contentCategories,
} from './schema';
import { encryptToken } from '@/lib/crypto/tokens';
import { env } from '@/lib/env';
import { CATEGORY_TEMPLATES, DEFAULT_TEMPLATE, type TemplateKey } from '@/lib/categories/templates';

/** Ensure the single admin user row exists; returns its id. */
export async function ensureAdminUser(): Promise<string> {
  const email = env.adminEmail();
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) return existing.id;
  const [row] = await db.insert(users).values({ email, role: 'admin' }).returning({ id: users.id });
  return row.id;
}

/** The single connected account (most recent) plus whether it has a token. */
export async function getPrimaryAccount() {
  const account = await db.query.igAccounts.findFirst({
    orderBy: (a, { desc }) => desc(a.connectedAt),
  });
  if (!account) return null;
  const token = await db.query.oauthTokens.findFirst({
    where: eq(oauthTokens.igAccountId, account.id),
  });
  return { account, hasToken: Boolean(token), tokenExpiresAt: token?.expiresAt ?? null };
}

type UpsertInput = {
  igUserId: string;
  username?: string;
  accountType?: string;
  permissions: string[];
  profile: unknown;
  accessToken: string;
  expiresInSeconds: number;
};

/**
 * Insert/update the connected account, store its encrypted long-lived token,
 * and ensure settings + default pillars exist. Returns the ig_account id.
 */
export async function upsertAccountWithToken(input: UpsertInput): Promise<string> {
  const userId = await ensureAdminUser();
  const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000);

  const [account] = await db
    .insert(igAccounts)
    .values({
      userId,
      igUserId: input.igUserId,
      username: input.username,
      accountType: input.accountType,
      status: 'connected',
      scopes: input.permissions,
      profile: input.profile as object,
      connectedAt: new Date(),
      lastSyncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: igAccounts.igUserId,
      set: {
        username: input.username,
        accountType: input.accountType,
        status: 'connected',
        scopes: input.permissions,
        profile: input.profile as object,
        connectedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning({ id: igAccounts.id });

  // Replace any existing token for this account with the fresh encrypted one.
  await db.delete(oauthTokens).where(eq(oauthTokens.igAccountId, account.id));
  await db.insert(oauthTokens).values({
    igAccountId: account.id,
    accessTokenEncrypted: encryptToken(input.accessToken),
    tokenType: 'long_lived',
    expiresAt,
    lastRefreshedAt: new Date(),
  });

  await ensureAppSettings(account.id);
  await seedCategoriesForAccount(account.id, DEFAULT_TEMPLATE);

  return account.id;
}

export async function ensureAppSettings(igAccountId: string): Promise<void> {
  const existing = await db.query.appSettings.findFirst({
    where: eq(appSettings.igAccountId, igAccountId),
  });
  if (existing) return;
  await db.insert(appSettings).values({ igAccountId });
}

/** Seed default pillars for an account from a template, if none exist yet. */
export async function seedCategoriesForAccount(
  igAccountId: string,
  templateKey: TemplateKey,
): Promise<void> {
  const existing = await db.query.contentCategories.findFirst({
    where: eq(contentCategories.igAccountId, igAccountId),
  });
  if (existing) return;

  const template = CATEGORY_TEMPLATES[templateKey];
  await db.insert(contentCategories).values(
    template.pillars.map((p, i) => ({
      igAccountId,
      key: p.key,
      label: p.label,
      description: p.description,
      isDefault: true,
      sortOrder: i,
    })),
  );
}

/** Disconnect: remove stored token and mark the account disconnected. */
export async function disconnectAccount(igAccountId: string): Promise<void> {
  await db.delete(oauthTokens).where(eq(oauthTokens.igAccountId, igAccountId));
  await db
    .update(igAccounts)
    .set({ status: 'disconnected', updatedAt: new Date() })
    .where(eq(igAccounts.id, igAccountId));
}
