import { graphGet, graphPost } from './client';

export type PublishInput = {
  igUserId: string;
  token: string;
  mediaType: string; // IMAGE | VIDEO | REEL | CAROUSEL | STORY
  mediaUrl: string; // single https url, or comma-separated for carousel
  caption?: string;
};

const isVideoUrl = (u: string) => /\.(mp4|mov|m4v)(\?|$)/i.test(u);

/** Create a media container, returning its id. Handles single + carousel. */
async function createContainer(input: PublishInput): Promise<string> {
  const { igUserId, token, mediaType, mediaUrl, caption } = input;
  const urls = mediaUrl.split(',').map((s) => s.trim()).filter(Boolean);

  if (mediaType === 'CAROUSEL') {
    if (urls.length < 2) throw new Error('A carousel needs at least 2 comma-separated media URLs.');
    const childIds: string[] = [];
    for (const u of urls) {
      const body: Record<string, string> = isVideoUrl(u)
        ? { media_type: 'VIDEO', video_url: u, is_carousel_item: 'true' }
        : { image_url: u, is_carousel_item: 'true' };
      const child = await graphPost<{ id: string }>(`${igUserId}/media`, body, token);
      childIds.push(child.id);
    }
    const parent = await graphPost<{ id: string }>(
      `${igUserId}/media`,
      { media_type: 'CAROUSEL', children: childIds.join(','), ...(caption ? { caption } : {}) },
      token,
    );
    return parent.id;
  }

  const url = urls[0];
  if (!url) throw new Error('No media URL provided.');
  const body: Record<string, string> = caption ? { caption } : {};

  if (mediaType === 'REEL' || mediaType === 'VIDEO') {
    body.media_type = 'REELS';
    body.video_url = url;
  } else if (mediaType === 'STORY') {
    body.media_type = 'STORIES';
    if (isVideoUrl(url)) body.video_url = url;
    else body.image_url = url;
  } else {
    body.image_url = url; // IMAGE
  }

  const res = await graphPost<{ id: string }>(`${igUserId}/media`, body, token);
  return res.id;
}

/** Poll a container until it's FINISHED (videos/reels/carousels process async). */
async function waitForContainer(containerId: string, token: string, maxMs = 45000): Promise<void> {
  const start = Date.now();
  let delay = 2000;
  while (Date.now() - start < maxMs) {
    const res = await graphGet<{ status_code?: string }>(containerId, { fields: 'status_code' }, token);
    const s = res.status_code;
    if (s === 'FINISHED') return;
    if (s === 'ERROR' || s === 'EXPIRED') throw new Error(`Media container ${s}`);
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 1.5, 8000);
  }
  throw new Error('Media still processing — try publishing again in a moment.');
}

/** Full publish: create container → (poll if needed) → publish → fetch permalink. */
export async function publishMedia(input: PublishInput): Promise<{ mediaId: string; permalink: string | null }> {
  const containerId = await createContainer(input);

  // Images are typically FINISHED immediately; everything else processes async.
  if (input.mediaType !== 'IMAGE') await waitForContainer(containerId, input.token);

  const pub = await graphPost<{ id: string }>(
    `${input.igUserId}/media_publish`,
    { creation_id: containerId },
    input.token,
  );

  let permalink: string | null = null;
  try {
    const meta = await graphGet<{ permalink?: string }>(pub.id, { fields: 'permalink' }, input.token);
    permalink = meta.permalink ?? null;
  } catch {
    // permalink fetch is non-critical
  }
  return { mediaId: pub.id, permalink };
}
