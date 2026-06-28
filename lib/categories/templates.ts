/**
 * Starter content-pillar templates. Pillars are per-account: on connect we seed
 * one template, then the AI refines them from the account's real content and the
 * user can edit them in Settings. Templates keep the engine vertical-agnostic.
 */

export type PillarSeed = { key: string; label: string; description: string };

export type TemplateKey = 'fitness' | 'hair' | 'custom';

export const CATEGORY_TEMPLATES: Record<
  TemplateKey,
  { label: string; pillars: PillarSeed[] }
> = {
  fitness: {
    label: 'Fitness / Meal Prep / Coaching',
    pillars: [
      { key: 'transformation', label: 'Transformation / Client Result', description: 'Before/after, client wins, results' },
      { key: 'meal_product', label: 'Meal / Product Highlight', description: 'Menu items, meals, product features' },
      { key: 'behind_the_scenes', label: 'Behind the Scenes', description: 'Facility, kitchen, day-to-day operations' },
      { key: 'team_culture', label: 'Team Culture', description: 'Staff, team moments, company culture' },
      { key: 'fitness_training', label: 'Fitness / Training', description: 'Workouts, training, gym content' },
      { key: 'recovery', label: 'Recovery / Ice Bath / Sauna', description: 'Cold plunge, sauna, recovery routines' },
      { key: 'motivational', label: 'Motivational / Discipline', description: 'Mindset, discipline, motivation' },
      { key: 'customer_success', label: 'Customer Experience / Success', description: 'Client stories, testimonials' },
      { key: 'offer_cta', label: 'Offer / Sales CTA', description: 'Direct offers, promos, sign-ups' },
      { key: 'partner', label: 'Influencer / Partner Content', description: 'Collabs, partners, features' },
      { key: 'other', label: 'Other', description: 'Anything that does not fit a pillar' },
    ],
  },
  hair: {
    label: 'Hair / Beauty / Salon',
    pillars: [
      { key: 'transformation', label: 'Transformation / Before & After', description: 'Hair makeovers, before/after' },
      { key: 'service_highlight', label: 'Service Highlight', description: 'Color, cut, extensions, treatments' },
      { key: 'behind_the_scenes', label: 'Behind the Scenes / Salon Life', description: 'Salon day-to-day, process shots' },
      { key: 'stylist_culture', label: 'Stylist / Team Culture', description: 'Stylists, team, salon culture' },
      { key: 'client_experience', label: 'Client Experience', description: 'Client stories, reviews, testimonials' },
      { key: 'education', label: 'Education / Tips', description: 'Hair care tips, tutorials, how-tos' },
      { key: 'product_highlight', label: 'Product Highlight', description: 'Retail products, recommendations' },
      { key: 'promo_cta', label: 'Promo / Booking CTA', description: 'Offers, booking prompts, openings' },
      { key: 'trend_inspiration', label: 'Trend / Inspiration', description: 'Trends, style inspiration, lookbooks' },
      { key: 'founder_story', label: 'Founder Story', description: 'Owner/stylist personal brand & story' },
      { key: 'other', label: 'Other', description: 'Anything that does not fit a pillar' },
    ],
  },
  custom: {
    label: 'Custom / Blank',
    pillars: [{ key: 'other', label: 'Other', description: 'Uncategorized' }],
  },
};

export const DEFAULT_TEMPLATE: TemplateKey = 'fitness';
