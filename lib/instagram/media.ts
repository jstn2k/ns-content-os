import { graphGet } from './client';

export type RawMedia = {
  id: string;
  caption?: string;
  media_type?: string; // IMAGE | VIDEO | CAROUSEL_ALBUM
  media_product_type?: string; // FEED | REELS | STORY | AD
  permalink?: string;
  media_url?: string;
  thumbnail_url?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
};

export type NormalizedMediaType = 'IMAGE' | 'VIDEO' | 'REEL' | 'CAROUSEL' | 'STORY';

const FIELDS = [
  'id',
  'caption',
  'media_type',
  'media_product_type',
  'permalink',
  'media_url',
  'thumbnail_url',
  'timestamp',
  'like_count',
  'comments_count',
].join(',');

/** Map Instagram's media_type/media_product_type to our enum. */
export function normalizeMediaType(m: RawMedia): NormalizedMediaType {
  if (m.media_product_type === 'REELS') return 'REEL';
  if (m.media_product_type === 'STORY') return 'STORY';
  if (m.media_type === 'CAROUSEL_ALBUM') return 'CAROUSEL';
  if (m.media_type === 'VIDEO') return 'VIDEO';
  return 'IMAGE';
}

/**
 * Fetch all of the account's own media with cursor pagination.
 * `maxPosts` caps the import so we never loop unbounded.
 */
export async function fetchAllMedia(
  token: string,
  maxPosts = 500,
): Promise<RawMedia[]> {
  const out: RawMedia[] = [];
  let after: string | undefined;

  while (out.length < maxPosts) {
    const params: Record<string, string> = { fields: FIELDS, limit: '50' };
    if (after) params.after = after;

    const res = await graphGet<{
      data?: RawMedia[];
      paging?: { cursors?: { after?: string }; next?: string };
    }>('me/media', params, token);

    const batch = res.data ?? [];
    out.push(...batch);

    const next = res.paging?.next;
    after = res.paging?.cursors?.after;
    if (!next || !after || batch.length === 0) break;
  }

  return out.slice(0, maxPosts);
}
