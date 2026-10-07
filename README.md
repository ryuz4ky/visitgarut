# VisitGarut MVP

Garut discovery directory with articles, search, OpenStreetMap, and a protected content CMS.

## Stack and source of truth

Next.js 15, React 19, TypeScript, PostgreSQL 16, node-postgres, Leaflet. Production host: DomaiNesia Nimbus Go. GitHub `ryuz4ky/visitgarut` is the source of truth. The current public MVP does not depend on Supabase or Vercel. Legacy components remain in git history; their account/booking routes are disabled for this phase.

## Local development

1. Install Node.js 24 LTS and PostgreSQL.
2. `npm ci`.
3. Copy `.env.example` to `.env.local`; fill database and random session/setup secrets.
4. Apply `db/001-mvp.sql`, then optional `db/002-seed.sql` to the database.
5. `npm run dev`.
6. Open `/admin/login?setup=YOUR_SETUP_TOKEN` once and choose an admin password of at least 12 characters. Setup is permanently disabled after the first admin exists.

## Production

Runtime: Node 24.21.0. PostgreSQL: `visitgar_mvp`, user `visitgar_app`. Never commit credentials. Production environment lives outside docroot at `/home/visitgar/visitgarut.env`, permissions 0600. App binds only to 127.0.0.1:3187. Apache/LiteSpeed proxies HTTPS requests through `.htaccess`. A cPanel cron supervises the process every minute. `scripts/deploy.sh` installs, builds, copies assets and restarts this app. Do not use `npm run dev` in production.

A Git Deploy Manager deployment tracks main. Build memory can exceed the host budget; if necessary upload a locally verified standalone build produced from the same GitHub commit, then copy its public/static assets.

## CMS

`/admin`: create/edit places, articles and events; choose draft or published; link articles to place entities. Content is plain text with `## Heading` blocks; HTML is escaped. Admin cookies are HTTP-only, signed, short-lived; changing password invalidates older sessions. Login is rate-limited. Drafts are excluded from public pages and sitemap. Event dates use ISO 8601 with a timezone, e.g. `2026-11-15T09:00:00+07:00`.

Source URLs, website links, WhatsApp and image credits belong to each place. Photos can use external HTTPS URLs or the bundled local image URLs. No made-up ratings or live booking inventory. Initial map points identify approximate areas, not entrances. Photo attribution is on `/kredit-foto`.

## Verification

`npm run build`; `npx tsc --noEmit`; `node scripts/test-schema.cjs`; production `/api/health`; browser QA: search/filter, detail links, maps, admin draft/publish and article/place relationships. The public database is authoritative. `/sitemap.xml` is generated from published records.

## Later

User accounts, favorites, reviews, AI itinerary, merchant claims, payments/booking. GA4/Search Console/Clarity need the owner's properties/IDs before activation.
