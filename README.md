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

Runtime: Node 24.21.0. PostgreSQL: `visitgar_mvp`, user `visitgar_app`. Never commit credentials. Production environment lives outside docroot at `/home/visitgar/visitgarut.env`, permissions 0600. App binds only to 127.0.0.1:3187. Apache/LiteSpeed proxies HTTPS requests through `.htaccess`. A cPanel cron supervises the process every 7 minutes (the hosting minimum). `scripts/deploy.sh` installs, builds, copies assets and restarts this app. Do not use `npm run dev` in production.

A Git Deploy Manager deployment tracks main. The cron compares HEAD to `/home/visitgar/.visitgarut-deployed-sha`; it builds a changed revision and supervises an unchanged revision. Trigger Git Deploy Manager after pushing main; the next cron run applies the build. Build memory can exceed the host budget; if necessary upload a locally verified standalone build produced from the same GitHub commit, then copy its public/static assets.

## CMS

`/admin`: create/edit places, articles and events; choose draft or published; link articles to place entities. Content is plain text with `## Heading` blocks; HTML is escaped. Admin cookies are HTTP-only, signed, short-lived; changing password invalidates older sessions. Login is rate-limited. Drafts are excluded from public pages and sitemap. Event dates use ISO 8601 with a timezone, e.g. `2026-11-15T09:00:00+07:00`.

Source URLs, website links, WhatsApp and image credits belong to each place. Photos can use external HTTPS URLs or the bundled local image URLs. No made-up ratings or live booking inventory. Initial map points identify approximate areas, not entrances. Photo attribution is on `/kredit-foto`.

## Verification

`npm run build`; `npx tsc --noEmit`; `node scripts/test-schema.cjs`; production `/api/health`; browser QA: search/filter, detail links, maps, admin draft/publish and article/place relationships. The public database is authoritative. `/sitemap.xml` is generated from published records.

## Later

User accounts, favorites, reviews, AI itinerary, merchant claims, payments/booking. GA4/Search Console/Clarity need the owner's properties/IDs before activation.


### Community Pulse activation

Public Community Pulse has a place browser at `/community-pulse`, source cards on each place, and a separate methodology at `/community-pulse/metode`. The original YouTube comment reader is `/api/community/youtube`; only reviewed, unexpired videos and comments can be returned. Replies require a published parent. Displaying original comments does not create visitor evidence or inferred sentiment. Changing an original comment returns it to moderation; closing comments or withdrawing the parent prevents public access.

Visitors can optionally submit their own 1–5 ratings for nine dimensions. Submission is transactional and pending; a supplied public profile is a private lead for the moderator, never automatic proof of identity. Ratings require independent identities checked by the moderator, and are never inferred from platform comments. Existing evidence thresholds and YouTube analytics approval remain in place.

`db/006-pulse-activation.sql` is backward compatible. The staged deployment runs the idempotent Community Pulse migrations before building. The collection worker prefers reviewed videos, carries pagination/replies forward, and preserves the 29-day API retention limit. Source metadata is refreshed through the official API when an admin approves a video. Search uses a quoted place/provider name plus Garut and its aliases.

Checks: `npm run test:pulse`, `npm run test:pulse-activation`, `npm run test:youtube-collection`, `npm run test:youtube`, `npx tsc --noEmit`, and `npm run build`. No test reviews should be published to the live visitor sample.

### Community Pulse insight table

Place pages show a three-column insight table before curated videos: topic, distinct reviewed contributors, and confidence. Every topic opens its evidence panel, even when the sample is empty. Ordinary topics remain insufficient below three independent contributors. Sensitive report counts and texts stay withheld until six identities, two content sources, and complete review checks are satisfied. Traffic and unofficial-ticket reports have separate moderation topics in migration 007. Existing YouTube original comments remain separate from derived metrics until the required approval is configured.

### Public source discovery

`/admin/pulse/discovery` discovers public Instagram, TikTok, Threads and X post/video URLs through public search-result HTML. During this early stage, candidates that pass URL validation and reach a relevance score of at least 70 are automatically inserted as approved `vg_social_contents`; no manual approval is required. Admin can still withdraw/reject a bad source after ingestion.

Discovery metadata is not visitor evidence. Search-result titles/snippets are never treated as reviews or sentiment, snippets are not retained after ingestion, and auto-ingest never creates `vg_social_mentions`. Community Pulse evidence therefore still requires a separate eligible comment/review/contribution source.

The default search endpoint is DuckDuckGo HTML and can be replaced with `PUBLIC_SEARCH_HTML_ENDPOINT`. The collector does not bypass login, CAPTCHA, anti-bot controls, private content, or platform access controls. Runs are capped at five per place per Jakarta day, twelve queries per run and sixty unique candidates. Migration `db/008-public-discovery.sql` creates the discovery log and is applied by `scripts/pulse-migrate.cjs` during staged deploy.

Check the parser/query logic with `npm run test:discovery` in addition to the existing Pulse tests.
