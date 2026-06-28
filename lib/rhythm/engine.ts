/**
 * Deterministic posting-rhythm engine. Given the account's historical pillar mix,
 * best posting windows, and recent posting history, it proposes the next 7–14
 * posts (pillar + day/time + confidence + reason) and flags over-concentration.
 * Pure function — no AI, no DB.
 */

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type RhythmPillar = { key: string; label: string; share: number };
export type RhythmWindow = { day: string; window: string; score: number };

export type RhythmInput = {
  pillars: RhythmPillar[]; // historical distribution (target mix), highest share first
  bestWindows: RhythmWindow[]; // per-weekday best windows from analysis
  recentPillars: string[]; // labels of recent posts, newest first
  avgPostsPerWeek: number;
};

export type Recommendation = {
  order: number;
  pillarKey: string;
  pillarLabel: string;
  day: string;
  time: string;
  confidence: number;
  reason: string;
};

export type RhythmResult = { recommendations: Recommendation[]; warnings: string[] };

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const round2 = (n: number) => Math.round(n * 100) / 100;
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

export function generateRhythm(input: RhythmInput, now = new Date()): RhythmResult {
  const totalSlots = clamp(Math.round((input.avgPostsPerWeek || 3) * 2), 7, 14);
  const perWeek = clamp(Math.round(input.avgPostsPerWeek || 3), 1, 7);

  // Choose posting weekdays: highest-scoring windows first.
  const ranked = [...input.bestWindows].filter((w) => w.score > 0).sort((a, b) => b.score - a.score);
  const postingDays = (ranked.length > 0 ? ranked : input.bestWindows).slice(0, perWeek);
  const byWeekday = new Map(postingDays.map((d) => [d.day, d]));

  // Build future slots until we have enough.
  const slots: RhythmWindow[] = [];
  for (let offset = 1; offset <= 28 && slots.length < totalSlots; offset++) {
    const date = addDays(now, offset);
    const wd = WEEKDAYS[date.getDay()];
    const pd = byWeekday.get(wd);
    if (pd) slots.push({ day: wd, window: pd.window, score: pd.score });
  }

  // Target counts per pillar from historical share.
  const remaining = new Map<string, number>();
  for (const p of input.pillars) remaining.set(p.key, Math.round(p.share * slots.length));
  const pillarByKey = new Map(input.pillars.map((p) => [p.key, p]));

  const recommendations: Recommendation[] = [];
  let lastLabel = input.recentPillars[0];

  for (let i = 0; i < slots.length; i++) {
    const pillar = pickPillar(input.pillars, remaining, lastLabel);
    remaining.set(pillar.key, (remaining.get(pillar.key) ?? 1) - 1);
    lastLabel = pillar.label;

    const confidence = round2(clamp(0.5 + slots[i].score * 0.3 + pillar.share * 0.5, 0.5, 0.95));
    recommendations.push({
      order: i + 1,
      pillarKey: pillar.key,
      pillarLabel: pillar.label,
      day: slots[i].day,
      time: slots[i].window,
      confidence,
      reason: buildReason(pillar, slots[i], input.pillars[0]),
    });
  }

  return { recommendations, warnings: buildWarnings(input.recentPillars, recommendations) };
}

function pickPillar(
  pillars: RhythmPillar[],
  remaining: Map<string, number>,
  lastLabel: string | undefined,
): RhythmPillar {
  // Prefer pillars with the most remaining quota, then highest share, avoiding a repeat.
  const ranked = [...pillars].sort((a, b) => {
    const ra = remaining.get(a.key) ?? 0;
    const rb = remaining.get(b.key) ?? 0;
    if (rb !== ra) return rb - ra;
    return b.share - a.share;
  });
  const notRepeat = ranked.find((p) => p.label !== lastLabel);
  return notRepeat ?? ranked[0];
}

function buildReason(pillar: RhythmPillar, slot: RhythmWindow, topPillar: RhythmPillar): string {
  const pct = Math.round(pillar.share * 100);
  if (topPillar && pillar.key === topPillar.key) {
    return `${pillar.label} is your most-used pillar (${pct}%); ${slot.day} ${slot.window} is one of your strongest windows.`;
  }
  return `Keeps your mix balanced — ${pillar.label} (${pct}% historically), scheduled in your ${slot.day} ${slot.window} window.`;
}

function buildWarnings(recentPillars: string[], recs: Recommendation[]): string[] {
  const warnings: string[] = [];

  const recent = recentPillars.slice(0, 10);
  if (recent.length >= 4) {
    const counts = tally(recent);
    const [topLabel, topCount] = topEntry(counts);
    if (topCount / recent.length > 0.5) {
      warnings.push(
        `Your recent posts are heavy on “${topLabel}” (${Math.round((topCount / recent.length) * 100)}% of the last ${recent.length}). Consider varying the mix.`,
      );
    }
  }

  if (recs.length > 0) {
    const planCounts = tally(recs.map((r) => r.pillarLabel));
    const [topLabel, topCount] = topEntry(planCounts);
    if (topCount / recs.length > 0.45) {
      warnings.push(
        `This plan leans on “${topLabel}” (${Math.round((topCount / recs.length) * 100)}% of upcoming posts).`,
      );
    }
  }

  return warnings;
}

function tally(items: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const i of items) m.set(i, (m.get(i) ?? 0) + 1);
  return m;
}

function topEntry(m: Map<string, number>): [string, number] {
  let best: [string, number] = ['', 0];
  for (const [k, v] of m) if (v > best[1]) best = [k, v];
  return best;
}
