import { env } from '@/lib/env';

const GRAPH_HOST = 'https://graph.instagram.com';

/** Normalized error for any Instagram/Meta API failure. */
export class InstagramApiError extends Error {
  status: number;
  code?: number;
  subcode?: number;
  fbtraceId?: string;
  raw?: unknown;

  constructor(message: string, opts: {
    status: number;
    code?: number;
    subcode?: number;
    fbtraceId?: string;
    raw?: unknown;
  }) {
    super(message);
    this.name = 'InstagramApiError';
    this.status = opts.status;
    this.code = opts.code;
    this.subcode = opts.subcode;
    this.fbtraceId = opts.fbtraceId;
    this.raw = opts.raw;
  }
}

async function parseError(res: Response): Promise<InstagramApiError> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = await res.text().catch(() => '');
  }
  const err = (body as { error?: Record<string, unknown> })?.error ?? {};
  return new InstagramApiError(String(err.message ?? `Instagram API error (${res.status})`), {
    status: res.status,
    code: typeof err.code === 'number' ? err.code : undefined,
    subcode: typeof err.error_subcode === 'number' ? err.error_subcode : undefined,
    fbtraceId: typeof err.fbtrace_id === 'string' ? err.fbtrace_id : undefined,
    raw: body,
  });
}

/** GET a versioned graph.instagram.com data endpoint (e.g. "me", "<id>/media"). */
export async function graphGet<T = unknown>(
  path: string,
  params: Record<string, string>,
  accessToken: string,
): Promise<T> {
  const url = new URL(`${GRAPH_HOST}/${env.graphVersion()}/${path.replace(/^\//, '')}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', accessToken);

  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

/** POST a versioned graph.instagram.com endpoint (used later for publishing). */
export async function graphPost<T = unknown>(
  path: string,
  body: Record<string, string>,
  accessToken: string,
): Promise<T> {
  const url = new URL(`${GRAPH_HOST}/${env.graphVersion()}/${path.replace(/^\//, '')}`);
  const form = new URLSearchParams({ ...body, access_token: accessToken });
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

export { GRAPH_HOST, parseError };
