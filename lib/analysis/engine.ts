import { wordCount } from './caption';

/**
 * Deterministic analysis of an account's posts. Pure functions only — no AI, no
 * DB, no network — so results are reproducible and testable. AI-driven pieces
 * (pillar categorization, brand voice) are layered on in later phases.
 */

export type AnalyzablePost = {
  mediaType: 'IMAGE' | 'VIDEO' | 'REEL' | 'CAROUSEL' | 'STORY';
  caption: string | null;
  postedAt: Date | null;
  likeCount: number | null;
  commentsCount: number | null;
  hashtags: string[] | null;
  permalink: string | null;
  reach?: number | null;
  totalInteractions?: number | null;
};

export type AnalysisResult = {
  postCount: number;
  avgPostsPerWeek: number;
  avgCaptionWords: number;
  formatRatios: { reels: number; carousel: number; image: number; video: number };
  byWeekday: { day: string; count: number }[];
  bestWindows: { day: string; window: string; score: number }[];
  topHashtags: { tag: string; count: number }[];
  topPosts: {
    caption: string;
    type: string;
    engagement: number;
    likes: number;
    comments: number;
    permalink: string | null;
  }[];
  hasInsights: boolean;
  avgEngagementRate: number | null;
  bestWindowLabel: string | null;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun for display

function zonedParts(d: Date, tz: string): { weekday: number; hour: number } {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
      hour: 'numeric',
      hour12: false,
    });
    const parts = fmt.formatToParts(d);
    const wd = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun';
    let hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
    if (Number.isNaN(hour) || hour === 24) hour = 0;
    const weekday = WEEKDAYS.indexOf(wd);
    return { weekday: weekday < 0 ? d.getDay() : weekday, hour };
  } catch {
    return { weekday: d.getUTCDay(), hour: d.getUTCHours() };
  }
}

function engagementOf(p: AnalyzablePost): number {
  if (p.totalInteractions != null) return p.totalInteractions;
  return (p.likeCount ?? 0) + (p.commentsCount ?? 0);
}

function ampm(h: number): { hr: number; period: string } {
  const period = h < 12 ? 'AM' : 'PM';
  let hr = h % 12;
  if (hr === 0) hr = 12;
  return { hr, period };
}

function windowLabel(start: number): string {
  const end = (start + 2) % 24;
  const a = ampm(start);
  const b = ampm(end);
  return a.period === b.period ? `${a.hr}–${b.hr} ${a.period}` : `${a.hr} ${a.period}–${b.hr} ${b.period}`;
}

export function analyzeAccount(posts: AnalyzablePost[], tz = 'America/New_York'): AnalysisResult {
  const dated = posts.filter((p) => p.postedAt instanceof Date);

  // Cadence
  let avgPostsPerWeek = 0;
  if (dated.length > 1) {
    const times = dated.map((p) => (p.postedAt as Date).getTime());
    const spanWeeks = Math.max(1, (Math.max(...times) - Math.min(...times)) / (7 * 86400000));
    avgPostsPerWeek = dated.length / spanWeeks;
  } else {
    avgPostsPerWeek = dated.length;
  }

  // Format ratios (feed formats only)
  const counts = { reels: 0, carousel: 0, image: 0, video: 0 };
  for (const p of posts) {
    if (p.mediaType === 'REEL') counts.reels++;
    else if (p.mediaType === 'CAROUSEL') counts.carousel++;
    else if (p.mediaType === 'VIDEO') counts.video++;
    else if (p.mediaType === 'IMAGE') counts.image++;
  }
  const formatTotal = counts.reels + counts.carousel + counts.image + counts.video || 1;
  const formatRatios = {
    reels: counts.reels / formatTotal,
    carousel: counts.carousel / formatTotal,
    image: counts.image / formatTotal,
    video: counts.video / formatTotal,
  };

  // Caption length
  const withCaption = posts.filter((p) => p.caption && p.caption.trim().length > 0);
  const avgCaptionWords =
    withCaption.length > 0
      ? withCaption.reduce((s, p) => s + wordCount(p.caption), 0) / withCaption.length
      : 0;

  // Weekday + hour buckets
  const byWeekdayCount = new Array(7).fill(0) as number[];
  // bucketEng[weekday][bucketStart/2] = { sum, n }
  const buckets: Record<number, Record<number, { sum: number; n: number }>> = {};
  for (const p of dated) {
    const { weekday, hour } = zonedParts(p.postedAt as Date, tz);
    byWeekdayCount[weekday]++;
    const bStart = Math.floor(hour / 2) * 2;
    buckets[weekday] ??= {};
    buckets[weekday][bStart] ??= { sum: 0, n: 0 };
    buckets[weekday][bStart].sum += engagementOf(p);
    buckets[weekday][bStart].n += 1;
  }

  const byWeekday = WEEK_ORDER.map((wd) => ({ day: WEEKDAYS[wd], count: byWeekdayCount[wd] }));

  // Best window per weekday (by avg engagement), normalized to a 0..1 score
  const perDayBest: { day: string; weekday: number; bucket: number; avg: number }[] = [];
  for (const wd of WEEK_ORDER) {
    const dayBuckets = buckets[wd];
    if (!dayBuckets) {
      perDayBest.push({ day: WEEKDAYS[wd], weekday: wd, bucket: -1, avg: 0 });
      continue;
    }
    let best = { bucket: -1, avg: 0 };
    for (const [bStr, { sum, n }] of Object.entries(dayBuckets)) {
      const avg = sum / n;
      if (avg > best.avg) best = { bucket: Number(bStr), avg };
    }
    perDayBest.push({ day: WEEKDAYS[wd], weekday: wd, bucket: best.bucket, avg: best.avg });
  }
  const maxAvg = Math.max(1, ...perDayBest.map((d) => d.avg));
  const bestWindows = perDayBest.map((d) => ({
    day: d.day,
    window: d.bucket >= 0 ? windowLabel(d.bucket) : '—',
    score: d.avg / maxAvg,
  }));
  const overallBest = [...perDayBest].sort((a, b) => b.avg - a.avg)[0];
  const bestWindowLabel =
    overallBest && overallBest.bucket >= 0 ? `${overallBest.day} ${windowLabel(overallBest.bucket)}` : null;

  // Hashtags
  const tagCounts = new Map<string, number>();
  for (const p of posts) {
    for (const t of p.hashtags ?? []) {
      const key = t.toLowerCase();
      tagCounts.set(key, (tagCounts.get(key) ?? 0) + 1);
    }
  }
  const topHashtags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, count]) => ({ tag, count }));

  // Top posts by engagement
  const topPosts = [...posts]
    .sort((a, b) => engagementOf(b) - engagementOf(a))
    .slice(0, 5)
    .map((p) => ({
      caption: (p.caption ?? '').trim().slice(0, 120) || '(no caption)',
      type: p.mediaType,
      engagement: engagementOf(p),
      likes: p.likeCount ?? 0,
      comments: p.commentsCount ?? 0,
      permalink: p.permalink,
    }));

  // Engagement rate (needs reach)
  const withReach = posts.filter((p) => p.reach != null && p.reach > 0);
  const avgEngagementRate =
    withReach.length > 0
      ? withReach.reduce((s, p) => s + engagementOf(p) / (p.reach as number), 0) / withReach.length
      : null;

  return {
    postCount: posts.length,
    avgPostsPerWeek: Math.round(avgPostsPerWeek * 10) / 10,
    avgCaptionWords: Math.round(avgCaptionWords),
    formatRatios,
    byWeekday,
    bestWindows,
    topHashtags,
    topPosts,
    hasInsights: posts.some((p) => p.reach != null),
    avgEngagementRate,
    bestWindowLabel,
  };
}
