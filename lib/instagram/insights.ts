import { graphGet } from './client';
import type { NormalizedMediaType } from './media';

export type MediaInsights = {
  reach?: number;
  views?: number;
  saved?: number;
  shares?: number;
  totalInteractions?: number;
  available: string[]; // which metrics actually came back
};

/**
 * Metrics differ by media type and are finicky (e.g. "impressions" was replaced
 * by "views"). We request a conservative set and tolerate failures — insights
 * are best-effort and must never break an import.
 */
function metricsFor(type: NormalizedMediaType): string[] {
  const base = ['reach', 'saved', 'shares', 'total_interactions'];
  if (type === 'VIDEO' || type === 'REEL') base.push('views');
  return base;
}

export async function fetchMediaInsights(
  mediaId: string,
  type: NormalizedMediaType,
  token: string,
): Promise<MediaInsights | null> {
  try {
    const res = await graphGet<{
      data?: Array<{ name: string; values?: Array<{ value: number }>; total_value?: { value: number } }>;
    }>(`${mediaId}/insights`, { metric: metricsFor(type).join(',') }, token);

    const rows = res.data ?? [];
    const get = (name: string): number | undefined => {
      const row = rows.find((r) => r.name === name);
      return row?.total_value?.value ?? row?.values?.[0]?.value;
    };

    const insights: MediaInsights = {
      reach: get('reach'),
      views: get('views'),
      saved: get('saved'),
      shares: get('shares'),
      totalInteractions: get('total_interactions'),
      available: rows.map((r) => r.name),
    };
    return insights;
  } catch {
    return null;
  }
}
