# VisitGarut 2.0 — Product Realignment & Delivery Plan

Status: **Working specification (2026-10-08)**  
Repository: `ryuz4ky/visitgarut`  
Development branch: `feature/visitgarut-2-realignment`  
Production branch: `main` — **do not deploy this branch without review**.

## 1. Vision

**VisitGarut — Explore Garut with Confidence.**

A search-first and mobile-first Garut travel discovery platform combining:

1. **Explore** — location entities for wisata, kuliner, cafes, hotel, transport, rentals, tours, events and (later) UMKM.
2. **Community Intelligence** — existing Community Pulse plus Pulse Globe, with moderated evidence and accountable sources.
3. **Travel planning** — maps, practical travel information, and an AI itinerary grounded in verified place data.
4. **Content & Search** — editorial articles, trending local queries, entity-based internal links and SEO/GEO-friendly HTML.
5. **Local commerce (later)** — merchant claims, inquiries, booking and rewards only after content trust and operational readiness.

Do not duplicate the competitor's UI, code, or branding. Use comparable functional coverage while making provenance, search visibility and ease of use the differentiators.

## 2. Baseline — verified from code and hosting

- **Stack:** Next.js 15, React 19, TypeScript, PostgreSQL 16, Leaflet/OpenStreetMap. Hosted on DomaiNesia Nimbus Go.
- **Git source:** `ryuz4ky/visitgarut`; production checkout matches commit `196ad7a` from `main` at initial inspection.
- **Deployment:** cPanel Git Deploy Manager; cron checks the deployed SHA every seven minutes and may build/restart the app. Do not change `main` as an unreviewed test mechanism.
- **Data:** `vg_places`, `vg_articles`, `vg_article_places`, `vg_events` and existing Pulse tables.
- **Existing routes:** category/place, `/artikel`, `/map`, `/community-pulse`, `/event`, admin CMS.
- **Currently deferred:** account/booking routes and `/trip` (redirects home in inspected version).
- **Existing SEO:** server-side content, canonical metadata, dynamic sitemap, robots, place and article JSON-LD.
- **Existing Pulse:** topic/evidence tables, moderation, YouTube pipeline, public social source discovery and researched insights.

**Verification limitations:** live external HTTP fetch failed from the investigation environment; the existence of source code is not proof every production interaction works. Live browser QA, database row counts, actual indexing and Core Web Vitals remain to be measured.

## 3. Non-negotiable invariants

1. Preserve production data, existing URLs, redirects and published content. **Never reset the database.**
2. Retain PostgreSQL as source of truth. Do not introduce Supabase, Cloudflare, Vercel, or a new CMS without a clear performance/operational justification.
3. Preserve existing Community Pulse's moderation, independence keys, 90-day window and sensitive-topic withholding. Editorial notes and discovered post URLs are **not** visitor sentiment.
4. Never generate fabricated reviews, metrics, tickets, prices or availability. Label unverified information.
5. Publish important summaries in server-rendered text. Globe/visuals are progressive enhancement; source evidence must be accessible through semantic controls.
6. Do not expose environment variables, API keys, emails, backups or PII. Backup archives must remain **outside** the web root and Git.
7. Feature flags and rollback paths are required for high-impact features. Production changes require reviewed PRs and a tested backup restoration plan.

## 4. Site navigation & URL strategy

Primary user navigation (mobile-first): **Jelajahi · Peta · Trip · Artikel**. Community Pulse is a prominent integrated feature on place pages, with a methodology hub.

Preserve:
- `/wisata/[slug]`, `/hotel/[slug]`, `/kuliner/[slug]`, `/cafe/[slug]`
- `/transportasi/[slug]`, `/paket-wisata/[slug]`
- `/artikel/[slug]`, `/map`, `/community-pulse`, `/event`

Do not index internal search/filter states. Prioritize entity landing pages and editorial clusters rather than automatically creating thin landing pages for every combination of terms.

## 5. Design principles

- One clear primary action per screen; avoid dashboard-like overload for casual visitors.
- Place details: hero + practical information → **Pulse Globe + fast takeaway** → attributable evidence → articles / itinerary.
- Pulse Globe: subtle rotating spherical arrangement of topic words/nodes; tap a topic to open the **same evidence content as InsightTable**, not a separate data or publication logic.
- Responsive and keyboard-accessible; support reduced motion and a static fallback.
- If eligible evidence is insufficient, show a clear **insufficient data** state, not synthetic proportions or quotes.
- Optimize mobile CPU, loading and Core Web Vitals; defer heavy graphics.

## 6. Entity/data architecture

**One stable place ID** links practical details, category facets, articles, events, media, Pulse sources and itinerary.

The current `vg_places.category` check constraint recognizes `wisata`, `hotel`, `kuliner`, `cafe`, `transportasi`, `paket-wisata`. Add new categories only through a backward-compatible schema migration and category routing plan.

Upgrade later via measured gaps: amenities, price source timestamps, location precision, transport options, photo licenses, authorship, opening-hour verification, collection metadata. Keep canonical identity and preserve old slugs.

## 7. Delivery order and acceptance gates

### Sprint 0 — Safety & baseline
- [x] Identify repository, deployment method, stack, route map, database structure and Pulse architecture.
- [x] Create isolated realignment branch.
- [ ] Verify a **completed** backup file (backup job requested 2026-10-08; not verified at authoring time); test restore feasibility.
- [ ] Establish staging or isolated local testing; never point staging at writable production data.
- [ ] Check live `/api/health`, homepage, sitemap, robots, places, article, map, admin and Pulse in a real browser.
- [ ] Run full existing test suite and build; record baseline.
- [ ] Capture GSC/GA4, keyword, traffic and indexed URL baseline when authorized data is accessible.

### Sprint 1 — Discovery & directory
- [ ] IA/navigation, mobile UX, search and filter parity.
- [ ] Place detail UX, practical facts, source timestamps, entity internal links.
- [ ] Preserve redirects and metadata; run crawl regression test.

### Sprint 2 — Pulse Globe
- [ ] Existing `Pulse` aggregate → safe Globe view model.
- [ ] Node click → existing shared evidence dialog; preserve thresholds & rights.
- [ ] SSR insight text, reduced motion, empty and limited states.
- [ ] Accessibility/performance/mobile regression.

### Sprint 3 — Content engine
- [ ] Article CMS with authors, sources, structured article metadata, source dates and entity linking.
- [ ] Topic/keyword/editorial workflow tied to destinations and trends.
- [ ] Reusable editorial templates and source checking.

### Sprint 4 — Travel planner
- [ ] Trusted place/route input, personalized itinerary, realistic duration and cost uncertainty.
- [ ] Navigable/shareable itinerary; no invented booking inventory.

### Sprint 5 — Release quality
- [ ] End-to-end QA, errors, CWV, crawl, schema, security and content integrity.
- [ ] Rollout through feature flags, rollback, metrics baseline and monitoring.

## 8. Gates before merge to main

- `npx tsc --noEmit`
- `npm run build`
- `npm run test:pulse`
- `npm run test:pulse-activation`
- `npm run test:youtube`
- `npm run test:youtube-collection`
- `npm run test:discovery`
- `npm run test:research-insights`
- `npm run test:directory`
- `node scripts/test-schema.cjs` (if available)
- Browser QA for indexable HTML, globe dialog, mobile and no-data states.

Record actual results. **Do not mark gates as passed without running them.**

## 9. Measurement

SEO: indexed entity pages, non-brand clicks/impressions, CTR, cannibalization and crawl health.  
Product: place-detail views, Globe topic opens, evidence-source clicks and itinerary starts.  
Trust: eligible independent contributors, evidence freshness, withdrawals and moderation errors.  
Quality: LCP/INP/CLS, mobile responsiveness, JS errors, deploy reliability.

## 10. Open decisions

- Staging environment choice and backup restore verification.
- Prioritized directory entity coverage and data sources.
- Source-rights-approved micro-quotes for Pulse Globe.
- Analytics property access and keyword baseline.
- Merchant and booking policy before enabling commerce.

No destructive production writes are authorized by this document.
