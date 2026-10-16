# VisitGarut: practical trip decisions

## Visitor outcome

A visitor can compare places for their party, calculate the known portion of a group budget, identify missing costs, and plan travel back to the starting point. The homepage promise is "Ke Garut, lebih jelas." Existing category/place URLs, maps, saved places, articles, and Community Pulse remain available.

## What changed

- Homepage has family, train-arrival, and budget entry points, with an actual form that carries the group/date/budget into `/trip`.
- `/trip` compares up to three stops, supports date/holiday tariff choice, adult/child counts, individual stop durations, reorder/remove, and a round trip to a selected origin (Stasiun Garut by default).
- The subtotal includes current sourced adult attraction entry and user-entered group estimates. Unfilled components, missing tariffs, child rules, and stale data stay explicit. Dining costs belong in the meal budget rather than a fictional admission ticket.
- Road estimates use the OSRM route service for published place coordinates, include the return leg, and are labeled as estimates without traffic. Missing points, excessive road snapping, timeouts, or provider failures produce an editable Maps-based fallback. Walking always uses the visitor's own allocations.
- Public place pages show practical information before the original descriptions and Pulse. CMS fields maintain the source, publisher, check date, rates, family/access/hours notes, and extras.
- Shared URLs preserve planning inputs. They do not confirm operating hours, transport supply, tariffs, or bookings. Copy and WhatsApp actions prepare a message; the app does not send one.

## Storage and editorial import

No database migration, new database, or schema change. `PracticalInfo` is a validated, versioned content envelope in existing `vg_places.content`; `hydratePlace` strips the envelope from public prose. The CMS exposes ordinary fields and uses existing revision snapshots and transactions. Existing editorial saves that omit the practical fields preserve them; clearing the source explicitly removes them.

Three reviewed pilot records are supplied in `data/visit-practical-2026-10-16.json`: Gunung Papandayan (national tourism guide), Taman Air Sabda Alam (operator), Darajat Pass (operator). These are online source checks, not a direct operator confirmation. Darajat's ambiguous weekday amount is deliberately null. Child prices are never inferred from an adult price. Numeric rates stop being calculated 30 days after the source-check date; they are still visible as requiring reconfirmation. Refreshing this date requires checking the source again.

After the code is deployed with production approval, run the import with the existing production environment loaded:

```sh
npm run seed:visit
npm run seed:visit -- --apply
```

The first invocation is a read-only dry run. The second validates each record, preserves same/newer operator edits, snapshots changed rows, and updates content transactionally. It does not add missing places or publish new visitor evidence. If used after 15 November 2026, recheck the sources before importing; do not merely change the dates.

## Verification

- `npm run test:visit`: persistence envelope, invalid/future/stale facts, weekday and explicit holiday rates, partial budgets and child costs, time overrides and overruns, round-trip links, route input and response validation.
- `npm run test:editorial`: practical fields persist, survive older edits, clear explicitly, reject invalid dates/prices, and retain transaction/authorization/stable URL protections.
- `npm run build` runs existing required suites and builds the Next.js application; `npx tsc --noEmit` is also run.
- Browser QA uses an isolated temporary copy with PGlite and repository source data. The preview adapter and QA startup files are not part of the production branch. This validates rendering and interactions without touching production records.

## Release boundary and remaining validation

The branch is reviewable before production approval, in accordance with the user's previous deployment instruction. Production remains on main until approved. Deploy code, apply the explicit content import, then check health, `/`, `/trip`, and the three pilot place pages on DomaiNesia.

Road availability depends on the provider and existing coordinate quality; it is not live traffic or a guaranteed route. Many existing listings still need practical information. The next product validation is 15 recent-traveler interviews and ten observed real trip plans; no adoption or revenue claim has been made.
