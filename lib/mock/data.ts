/**
 * Placeholder data for the UI skeleton. NONE of this is real — it exists so the
 * screens render meaningfully before the analysis/import features are wired.
 * Every screen using this also shows a "Preview — sample data" banner.
 *
 * Replace these with real queries (Drizzle / Instagram API) as each phase lands.
 */

export type MockMediaType = 'REEL' | 'CAROUSEL' | 'IMAGE';

export type MockPost = {
  id: string;
  type: MockMediaType;
  pillar: string;
  caption: string;
  date: string; // ISO
  likes: number;
  comments: number;
  reach: number;
};

export const mockPillars = [
  { key: 'transformation', label: 'Transformation / Client Result', count: 41, share: 0.27, avgEngagement: 0.084 },
  { key: 'meal_product', label: 'Meal / Product Highlight', count: 28, share: 0.18, avgEngagement: 0.052 },
  { key: 'motivational', label: 'Motivational / Discipline', count: 23, share: 0.15, avgEngagement: 0.061 },
  { key: 'behind_the_scenes', label: 'Behind the Scenes', count: 18, share: 0.12, avgEngagement: 0.047 },
  { key: 'customer_success', label: 'Customer Experience / Success', count: 16, share: 0.1, avgEngagement: 0.073 },
  { key: 'recovery', label: 'Recovery / Ice Bath / Sauna', count: 12, share: 0.08, avgEngagement: 0.055 },
  { key: 'offer_cta', label: 'Offer / Sales CTA', count: 9, share: 0.06, avgEngagement: 0.038 },
  { key: 'team_culture', label: 'Team Culture', count: 6, share: 0.04, avgEngagement: 0.044 },
];

export const mockKpis = {
  postsAnalyzed: 153,
  avgPostsPerWeek: 5.2,
  topPillar: 'Transformation / Client Result',
  bestWindow: 'Tue 7–9 AM',
  avgEngagementRate: 0.061,
};

export const mockFormatRatios = { reels: 0.46, carousel: 0.33, image: 0.21 };

export const mockPosts: MockPost[] = [
  { id: 'p1', type: 'REEL', pillar: 'Transformation / Client Result', caption: "90 days. Same person, different operating system. 🔥 This is what happens when you stop negotiating with yourself.", date: '2026-06-24T07:30:00Z', likes: 2140, comments: 187, reach: 41200 },
  { id: 'p2', type: 'CAROUSEL', pillar: 'Meal / Product Highlight', caption: "This week's menu drop. Swipe to see what discipline tastes like. 🍽️", date: '2026-06-22T11:00:00Z', likes: 980, comments: 54, reach: 18700 },
  { id: 'p3', type: 'IMAGE', pillar: 'Motivational / Discipline', caption: "Motivation is a guest. Discipline is a resident. Which one runs your house?", date: '2026-06-21T18:15:00Z', likes: 1520, comments: 96, reach: 22300 },
  { id: 'p4', type: 'REEL', pillar: 'Behind the Scenes', caption: "5 AM. The kitchen never sleeps. Behind every transformation is a team that shows up.", date: '2026-06-19T06:00:00Z', likes: 870, comments: 41, reach: 15900 },
  { id: 'p5', type: 'REEL', pillar: 'Recovery / Ice Bath / Sauna', caption: "Cold plunge → clarity. The body adapts to what you demand of it. 🧊", date: '2026-06-18T16:45:00Z', likes: 1310, comments: 73, reach: 20100 },
  { id: 'p6', type: 'CAROUSEL', pillar: 'Customer Experience / Success', caption: "From 'I can't' to 'I did.' Real client. Real story. Swipe. →", date: '2026-06-16T08:00:00Z', likes: 1740, comments: 142, reach: 28800 },
  { id: 'p7', type: 'IMAGE', pillar: 'Offer / Sales CTA', caption: "Doors close Friday. If you've been waiting for a sign, this is it. Link in bio.", date: '2026-06-14T12:30:00Z', likes: 610, comments: 33, reach: 12400 },
  { id: 'p8', type: 'REEL', pillar: 'Transformation / Client Result', caption: "He thought he was too far gone. 6 months later, his kids can't keep up with him.", date: '2026-06-12T07:15:00Z', likes: 2560, comments: 211, reach: 47600 },
];

export type MockBrandProfile = {
  summary: string;
  tone: string[];
  hooks: string[];
  ctaStyles: string[];
  hashtags: string[];
  emojiStyle: string;
  avgCaptionWords: number;
  recurringPhrases: string[];
  avoidedTopics: string[];
  sequencing: string[];
};

export const mockBrandProfile: MockBrandProfile = {
  summary:
    "Direct, disciplined, and premium. The voice speaks to people who are done making excuses — confident without being arrogant, motivational without being corny. Short punchy lines, second-person address, and a relentless focus on transformation and accountability.",
  tone: ['Direct', 'Disciplined', 'Premium', 'Motivational', 'No-nonsense'],
  hooks: [
    '90 days. Same person, different operating system.',
    'He thought he was too far gone.',
    'Motivation is a guest. Discipline is a resident.',
    'Stop negotiating with yourself.',
  ],
  ctaStyles: [
    'Link in bio.',
    'Doors close Friday.',
    'DM us "READY" to start.',
    'Swipe to see the proof. →',
  ],
  hashtags: ['#discipline', '#mealprep', '#transformation', '#fitness', '#accountability', '#nutritionsolutions'],
  emojiStyle: 'Sparing and intentional — 🔥 🧊 🍽️ used to punctuate, never to decorate.',
  avgCaptionWords: 34,
  recurringPhrases: ['stop negotiating with yourself', 'discipline over motivation', 'show up', 'different operating system'],
  avoidedTopics: ['Politics', 'Crash diets / quick fixes', 'Shaming language', 'Generic "Monday motivation" clichés'],
  sequencing: ['Transformation', 'Behind the Scenes', 'Meal / Product', 'Motivational', 'Customer Success', 'Offer / CTA'],
};

export type MockRecommendation = {
  order: number;
  pillar: string;
  day: string;
  time: string;
  confidence: number;
  reason: string;
};

export const mockRecommendations: MockRecommendation[] = [
  { order: 1, pillar: 'Transformation / Client Result', day: 'Tue', time: '7:30 AM', confidence: 0.92, reason: 'Transformations on Tuesday mornings are your highest-engagement pattern (8.4% avg).' },
  { order: 2, pillar: 'Behind the Scenes', day: 'Wed', time: '6:00 AM', confidence: 0.78, reason: 'Midweek BTS typically follows a transformation post and keeps the week varied.' },
  { order: 3, pillar: 'Meal / Product Highlight', day: 'Thu', time: '11:00 AM', confidence: 0.81, reason: 'Aligns with your usual menu-release cadence near end of week.' },
  { order: 4, pillar: 'Motivational / Discipline', day: 'Sat', time: '8:00 AM', confidence: 0.74, reason: 'Weekend motivational posts perform above average and fit your rhythm.' },
  { order: 5, pillar: 'Customer Experience / Success', day: 'Sun', time: '5:00 PM', confidence: 0.69, reason: 'Client stories close the week strong; Sunday evenings show solid reach.' },
  { order: 6, pillar: 'Recovery / Ice Bath / Sauna', day: 'Mon', time: '4:45 PM', confidence: 0.66, reason: 'Recovery content balances the mix and you have not posted it in 9 days.' },
  { order: 7, pillar: 'Offer / Sales CTA', day: 'Fri', time: '12:30 PM', confidence: 0.71, reason: 'Friday midday is your strongest window for offer posts.' },
];

export type MockQueueStatus = 'draft' | 'needs_review' | 'approved' | 'scheduled' | 'published' | 'failed';

export type MockQueueItem = {
  id: string;
  pillar: string;
  type: MockMediaType;
  caption: string;
  scheduledAt: string;
  status: MockQueueStatus;
  fit: number; // rhythm-fit score 0..1
};

export const mockQueue: MockQueueItem[] = [
  { id: 'q1', pillar: 'Transformation / Client Result', type: 'REEL', caption: '90-day client reveal — "different operating system" hook.', scheduledAt: '2026-06-30T07:30:00Z', status: 'scheduled', fit: 0.92 },
  { id: 'q2', pillar: 'Behind the Scenes', type: 'REEL', caption: '5 AM kitchen prep, team showing up.', scheduledAt: '2026-07-01T06:00:00Z', status: 'approved', fit: 0.78 },
  { id: 'q3', pillar: 'Meal / Product Highlight', type: 'CAROUSEL', caption: 'Weekly menu drop carousel.', scheduledAt: '2026-07-02T11:00:00Z', status: 'needs_review', fit: 0.81 },
  { id: 'q4', pillar: 'Motivational / Discipline', type: 'IMAGE', caption: '"Discipline is a resident" quote card.', scheduledAt: '2026-07-04T08:00:00Z', status: 'draft', fit: 0.74 },
  { id: 'q5', pillar: 'Offer / Sales CTA', type: 'IMAGE', caption: 'Doors-close-Friday enrollment push.', scheduledAt: '2026-07-03T12:30:00Z', status: 'draft', fit: 0.58 },
];

export const mockPublishLogs = [
  { id: 'l1', action: 'publish', status: 'success', at: '2026-06-24T07:30:11Z', detail: 'Reel published · permalink saved' },
  { id: 'l2', action: 'publish', status: 'success', at: '2026-06-22T11:00:09Z', detail: 'Carousel (4 items) published' },
  { id: 'l3', action: 'container.create', status: 'success', at: '2026-06-22T10:59:40Z', detail: 'Media container FINISHED in 28s' },
  { id: 'l4', action: 'publish', status: 'failed', at: '2026-06-20T09:14:02Z', detail: 'Rate limit: 100/24h reached — retry scheduled' },
];

export const mockErrorLogs = [
  { id: 'e1', scope: 'instagram.insights', message: 'Metric "impressions" unavailable for media older than account conversion', at: '2026-06-23T03:10:00Z' },
  { id: 'e2', scope: 'publishing.worker', message: 'Container not FINISHED after 60s — backoff retry queued', at: '2026-06-20T09:13:55Z' },
];

export const mockBestTimes = [
  { day: 'Mon', window: '4–6 PM', score: 0.62 },
  { day: 'Tue', window: '7–9 AM', score: 0.94 },
  { day: 'Wed', window: '6–8 AM', score: 0.71 },
  { day: 'Thu', window: '11 AM–1 PM', score: 0.79 },
  { day: 'Fri', window: '12–2 PM', score: 0.68 },
  { day: 'Sat', window: '8–10 AM', score: 0.73 },
  { day: 'Sun', window: '5–7 PM', score: 0.66 },
];

export const STATUS_LABELS: Record<MockQueueStatus, string> = {
  draft: 'Draft',
  needs_review: 'Needs review',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published',
  failed: 'Failed',
};
