import { graphGet } from './client';

export type PublishingLimit = { quotaUsage: number; quotaTotal: number } | null;

/**
 * Read the account's content-publishing quota (the 100-posts / rolling-24h cap).
 * Returns null if the endpoint isn't available for this account/permission set.
 */
export async function getContentPublishingLimit(
  igUserId: string,
  token: string,
): Promise<PublishingLimit> {
  try {
    const res = await graphGet<{
      data?: Array<{ quota_usage?: number; config?: { quota_total?: number } }>;
    }>(`${igUserId}/content_publishing_limit`, { fields: 'config,quota_usage' }, token);
    const row = res.data?.[0];
    if (!row) return null;
    return { quotaUsage: row.quota_usage ?? 0, quotaTotal: row.config?.quota_total ?? 100 };
  } catch {
    return null;
  }
}

export type Features = {
  readMedia: boolean;
  publish: boolean;
  insights: boolean;
  comments: boolean;
};

/** Derive which features are available from the scopes actually granted. */
export function deriveFeatures(scopes: string[]): Features {
  const has = (s: string) => scopes.includes(s);
  return {
    readMedia: has('instagram_business_basic'),
    publish: has('instagram_business_content_publish'),
    insights: has('instagram_business_manage_insights'),
    comments: has('instagram_business_manage_comments'),
  };
}
