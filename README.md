# NS Content OS

Instagram Content Intelligence & Publishing app. It connects an Instagram
**Professional** account through the **official Meta / Instagram APIs**, analyzes the
account's historical posting behavior, learns a Brand Voice Profile, recommends a
posting rhythm, generates on-brand captions, and (later) publishes approved content
through the official Content Publishing API with human approval.

> **Compliance-first.** Official OAuth + Graph API only. No scraping, no private
> endpoints, no browser automation, no password handling, no fake engagement.

It is built to be **vertical-agnostic / multi-account** — content pillars are
per-account and template-driven (a Fitness/Meal-Prep template and a Hair/Beauty
template ship by default), so the same codebase serves different brands.

---

## Status

| Phase | Scope | State |
|------|-------|-------|
| 0 | Project setup (Next.js, Tailwind, Drizzle, Supabase) | ✅ Done |
| 1 | Admin login + Instagram OAuth connect/disconnect + token encryption | ✅ Done |
| 2 | API capability check (what the account/permissions allow) | ✅ Done |
| 3 | Historical media import (posts + metrics + caption parsing) | ✅ Done |
| 4 | Deterministic analysis (cadence, lengths, frequencies, ratios) | ✅ Done |
| 5 | AI: categorization + Brand Voice Profile | ✅ Done |
| 6 | Posting rhythm engine | ✅ Done |
| 7 | Caption generator | ✅ Done |
| 8 | Content queue + approval workflow | ✅ Done |
| 9 | Publishing worker (containers, polling, retries) | ✅ Done |
| 10 | Analytics dashboard + logs | ✅ Done |

MVP target: Phases 0–7 ("Insight MVP"), then 8–10.

---

## Tech stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **Drizzle ORM** + **Supabase Postgres**
- **Web Crypto** (HMAC session) + **AES-256-GCM** (token encryption at rest)
- AI layer is provider-abstracted; **Anthropic Claude** is the default (added in Phase 5)
- Deploy target: **Replit** (or Vercel) + Supabase

---

## Environment variables

Copy `.env.example` to `.env.local` (local) or set them as **Secrets** (Replit).

| Var | Required | Notes |
|-----|----------|-------|
| `DATABASE_URL` | yes | Supabase Postgres, **Session pooler** string |
| `TOKEN_ENCRYPTION_KEY` | yes | 32-byte base64. `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `CRON_SECRET` | yes | random hex; protects worker/cron routes |
| `META_APP_ID` | yes | **Instagram** app id (from "API setup with Instagram login") |
| `META_APP_SECRET` | yes | **Instagram** app secret |
| `INSTAGRAM_REDIRECT_URI` | yes | must exactly match a redirect URI in the Meta app |
| `META_GRAPH_VERSION` | no | default `v23.0` |
| `NEXT_PUBLIC_APP_URL` | yes | base URL (e.g. `https://localhost:3000` or your Replit URL) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | yes | single-tenant admin login |
| `NEXT_PUBLIC_SUPABASE_URL` / `..._ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | later | for Supabase Storage (Phase 3) |
| `ANTHROPIC_API_KEY` | later | for AI features (Phase 5) |

---

## Local development (Windows)

> This machine has an EFS-encrypted `AppData`. The npm cache was relocated to
> `C:\dev\npm-cache` (`npm config set cache`). If you clone fresh elsewhere this
> is not needed.

```bash
npm install
npm run db:migrate     # apply Drizzle migrations to Supabase
npm run dev:https      # HTTPS dev (required for Instagram OAuth locally)
```

- Instagram OAuth requires **HTTPS** (secure cookies + https redirect URI), so use
  `npm run dev:https`. It auto-generates a self-signed cert in `certificates/`
  (git-ignored); your browser will warn once — proceed past it.
- Plain `npm run dev` works for everything except the live OAuth round-trip.

Scripts: `dev`, `dev:https`, `build`, `start`, `lint`, `db:generate`, `db:migrate`,
`db:push`, `db:studio`.

---

## Deploying to Replit

1. **Import from GitHub** in Replit.
2. Add **Secrets** for every env var above (copy from your `.env.local`).
3. Set `NEXT_PUBLIC_APP_URL` and `INSTAGRAM_REDIRECT_URI` to your Replit URL, e.g.
   `https://<app>.<user>.replit.dev` and
   `https://<app>.<user>.replit.dev/api/auth/instagram/callback`.
4. **Add that callback URL to the Meta app** (Instagram → Business login settings →
   OAuth redirect URIs). It must match `INSTAGRAM_REDIRECT_URI` exactly.
5. Run it. Replit serves HTTPS automatically, so no cert workaround is needed.
6. The Supabase DB is shared — no re-migration unless the schema changes
   (`npm run db:migrate`).

---

## Architecture

```
app/
  (app)/            # authed area (shares Nav + layout; route group)
    page.tsx        # dashboard
    connect/        # connection screen
  login/            # public login page
  api/
    auth/login, auth/logout
    auth/instagram/ # connect start, callback, deauthorize, data-deletion
    account/disconnect
lib/
  env.ts            # typed env access + Instagram scopes
  auth/session.ts   # HMAC signed-cookie session (Web Crypto; edge-safe)
  crypto/tokens.ts  # AES-256-GCM token encryption (Node only)
  instagram/        # client, oauth, account (profile), signed-request
  categories/       # pillar templates (fitness, hair, custom)
  db/               # drizzle client, schema, accounts + logs helpers
proxy.ts            # route gate (Next 16 renamed "middleware" -> "proxy")
drizzle/            # generated SQL migrations
```

**OAuth flow (Instagram Business Login):**
`/api/auth/instagram` sets a CSRF state cookie and redirects to Instagram →
Instagram redirects to `/api/auth/instagram/callback` → exchange code for a
short-lived token → exchange for a 60-day long-lived token → fetch profile →
store account + **encrypted** token → redirect to `/connect`.

**Auth gate:** `proxy.ts` requires a valid admin session for everything except
`/login`, `/api/auth/login`, and the Meta server-to-server callbacks
(`/api/auth/instagram/deauthorize`, `/api/auth/instagram/data-deletion`).

**Database:** 15 tables (users, ig_accounts, oauth_tokens, media_posts,
post_metrics, content_categories, post_categorizations, brand_voice_profiles,
analyses, generated_captions, queue_items, publishing_jobs, publishing_logs,
error_logs, app_settings). See `lib/db/schema.ts`.

---

## Key API constraints (designed around, not faked)

- Historical **Stories cannot be imported** (they expire; no API). Live-only.
- **Insights** only exist for media posted after the account became Professional;
  some metrics are partial on older posts.
- Media URLs expire → thumbnails will be re-hosted on import (Phase 3).
- **100 API publishes / rolling 24h** per account; Reels publishing is async
  (poll the container until `FINISHED`).
- For the account owner's own account, content-publish + insights work in Meta
  **Development Mode** (account added as a tester) without full App Review.

---

## Notes for the next agent

- Don't commit secrets. `.env*` and `certificates/` are git-ignored.
- This is **Next.js 16** — APIs differ from older versions; check
  `node_modules/next/dist/docs/` before assuming. `middleware` is now `proxy.ts`.
- All Instagram/Meta calls go through `lib/instagram/*`; keep new ones there and
  version-pin via `META_GRAPH_VERSION`.
- Stats should be **deterministic** (plain functions); use AI only for brand voice,
  categorization, caption generation, and recommendations.
