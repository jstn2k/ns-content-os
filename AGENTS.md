<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# NS Content OS — agent guide

Full context is in `README.md`. Quick orientation:

- **What this is:** Instagram content intelligence + publishing app using the
  **official** Meta/Instagram APIs only. No scraping, private endpoints, browser
  automation, password handling, or fake engagement — ever.
- **Stack:** Next.js 16 (App Router) + TS + Tailwind v4, Drizzle ORM + Supabase
  Postgres. AI is provider-abstracted (Anthropic default), added in Phase 5.
- **Done:** Phase 0 (setup) + Phase 1 (admin login, Instagram OAuth connect/
  disconnect, encrypted tokens). **Next:** Phase 2 capability check, Phase 3 import.

## Conventions

- Route gate is `proxy.ts` (Next 16 renamed `middleware`). Add public paths to
  `PUBLIC_PATHS` there.
- All Meta/Instagram calls live in `lib/instagram/*`; version-pin via
  `META_GRAPH_VERSION`. Surface failures as `InstagramApiError`.
- DB access via Drizzle in `lib/db/*`. Schema in `lib/db/schema.ts`; after changing
  it run `npm run db:generate` then `npm run db:migrate`.
- OAuth tokens are encrypted with `lib/crypto/tokens.ts` (AES-256-GCM, Node-only —
  never import into `proxy.ts`/edge). Sessions use `lib/auth/session.ts` (Web Crypto).
- Keep statistics **deterministic** (plain functions). Use AI only for brand voice,
  categorization, caption generation, and recommendations.
- Never commit secrets. `.env*` and `certificates/` are git-ignored. UI is neutral/
  professional now and intended to be themeable per account later.

## Run

- `npm run dev` (or `npm run dev:https` for the live Instagram OAuth round-trip).
- `npm run build` to verify everything compiles before shipping.
- Env vars are documented in `README.md` and `.env.example`.
