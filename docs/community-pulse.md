# Community Pulse MVP

Live routes: `/community-pulse`, `/admin/pulse`, each destination page, `/privasi`, `/ketentuan`.

## Implemented

- Six PostgreSQL tables in `db/003-community-pulse.sql`, destination aliases and Google Place ID.
- Own experience submissions, consent, honeypot, duplicate suppression, daily limits, moderation and reports.
- Editor assigns source identity, rights and per-topic labels. Mixed experiences keep their full original context. No external AI service is called.
- Ninety-day sample, one latest observation per identified contributor and topic; percentages only after ten classified contributors.
- Normal insights: three independent contributors. Sensitive: six, two content sources and moderator verification notes for every supporting observation. High confidence: fifteen, two platforms, three recent contributors.
- Clickable evidence dialog with sentiment/platform filters, date and engagement sorting. Private identity hashes and permission notes stay server-side.
- Official YouTube and TikTok players loaded only after visitor consent. Instagram, Threads and X use links.
- Optional official YouTube `commentThreads.list` import: latest fifty top-level comments per approved video, not all comments or replies. Original text expires after 29 days. Refresh returns observations to pending and clears old topic labels.
- Public YouTube API evidence and metrics remain disabled until an approval reference is configured. After approval, visitors separately consent to load that data. No API keys are shipped to browsers.
- Maintenance deletes expired API observations, old pending/rejected/spam submissions, reports and expired daily-limit keys. Cascading topic deletion and snapshot invalidation prevent stale evidence counts.
- Google ratings are not imported; the destination link opens Google Maps. No combined platform rating or invented scores.

## Operations

1. Apply migrations 001–003 once; never rerun the seed as an update strategy.
2. Moderate at `/admin/pulse`: check attribution, ownership/licence and context; identify independent contributors using real source identity. Different display names alone do not establish independence.
3. Add social source links with editorial titles, review and approve them.
4. For API imports, configure `YOUTUBE_API_KEY` outside the web root, then restart the app. Configure `YOUTUBE_DERIVED_METRICS_APPROVAL_REFERENCE` only after documented permission is granted to this API client.
5. Cron runs `scripts/pulse-maintenance.cjs` after deployment/supervision. Monitor app/build logs without recording raw keys or source API request URLs.
6. Evidence is calculated from current approved, unexpired data on each request; snapshots are administrative audit records, not public caches. Reports can immediately withdraw evidence.

## Still to develop

Live API credential/permission validation, automated place matching from aliases, automated permitted topic classification, Google rating through a policy-compliant integration, additional platform APIs, full pagination/replies and ongoing refresh scheduling. This release deliberately starts with moderated first-party and licensed evidence. No illustrative values from the handoff are seeded.

## Validation

`npm run test:pulse`, `npx tsc --noEmit`, `npm run build`, then exercise public submission → pending row → admin review → public insight/evidence → report → withdrawal on a disposable destination. Test URLs/records are removed afterward.

## Primary policy references

- https://developers.google.com/youtube/terms/developer-policies
- https://developers.google.com/youtube/terms/derived-metrics-policy
- https://cloud.google.com/maps-platform/terms
- https://developers.google.com/maps/documentation/places/web-service/policies
- https://developers.tiktok.com/doc/embed-player/
