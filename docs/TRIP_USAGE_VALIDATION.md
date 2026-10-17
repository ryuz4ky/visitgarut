# Planner usage validation

## Outcome

Visitors using a phone can jump from selected places to the cost or time section through a compact navigation bar. The bar shows the calculated portion of the group cost and the number of unfilled cost components, so a partial subtotal is never presented as a complete quote. Existing planning, public facts, shared URLs, Maps and prepared messages retain their behavior.

An optional, collapsed evaluation offers explicit participation and two categorical answers: whether the planner helped a decision, and the remaining obstacle. All planning features work without participation. No evaluation request is sent before the visitor selects “Boleh catat langkah saya”.

## Measurement contract

`/admin/trip-validation` requires the existing admin session and reports a rolling 30-day cohort of opted-in page visits. It is linked from the CMS. Counts are distinct per page visit and stage, not unique people. Reloading starts a new in-memory identifier and requires participation again. Stages can occur in different orders; percentages use the entire participant cohort, not a claimed sequential conversion rate.

The event allowlist covers opening, selection, cost/time headings becoming visible, route requests/results, input completion, successful clipboard copies, and selecting Maps/operator links. “Input completion” requires at least one stop, no missing budget components, valid and sufficient round-trip time, and the visitor's return-transport checkbox. It means the inputs were once complete, not that facts were confirmed, a booking occurred, or the current plan is still complete. Link events record the click, not a message sent or external-page success. Visibility events do not prove reading.

Stages reached earlier in the current page visit are held only in memory and submitted after explicit participation. A participant can stop and erase their answers/stages from the same page. An empty tombstone prevents delayed requests from restoring them. Both ordinary rows and tombstones expire after 30 days. Expired rows and daily rate-limit keys are removed by the existing supervised maintenance job; recording requests also remove expired rows. The dashboard excludes withdrawn and expired visits immediately.

No itinerary IDs, names, date, party size, amount, location, contact, URL/referrer, or message text is in the evaluation payload. Requests explicitly omit cookies and the referrer, and use only a random page-memory UUID, allowlisted stages, and optional allowlisted answers. No external analytics service or dependency is added. Hosting access logs are a separate infrastructure concern. The published privacy page explains the distinction and the share URL's existing contents.

The same-origin endpoint rejects unknown fields, malformed identifiers/categories and bodies above 2 KiB. PostgreSQL constraints repeat the allowlist. Requests are serialized/idempotent per session; answers persist across later stage writes. Daily HMAC IP keys limit recording to 200 requests, with a higher 400-request threshold leaving room for withdrawal. Raw IPs are not stored in these tables; the key changes each UTC day. Admin authentication is checked before aggregate queries.

## Deployment

The additive, idempotent `db/012-trip-validation.sql` migration creates two independent tables in the existing PostgreSQL database. The normal `pulse-migrate.cjs` deployment step applies it before the new build is activated. Existing content and authentication tables are not rewritten. If a build is rolled back, the extra tables can remain unused. No provider, domain, public-content URL, or environment credential changes are required.

`pulse-maintenance.cjs` removes expired evaluation data after the existing supervisor run. Validate that the existing supervisor cron still invokes this script; do not add a second persistent cron.

## Validation and product decision

Run `npm run test:trip-validation`, the existing full build, TypeScript checks, and browser QA in an isolated database. Cover no request/row before participation, two-answer save, duplicate events, feedback preservation, stage tracking, withdrawal, unavailable service, and phone navigation/overflow. Production smoke tests must erase any synthetic participant through the same withdrawal path so it does not appear as market evidence.

This release establishes collection; it does not establish product-market fit. Start with 15 recent-traveler interviews and ten observed real trip plans. Ask people to plan their own outing, then observe how they identify missing costs, check travel back, and explain the total. Record obstacles separately from feature suggestions. Do not contact participants or operators automatically.

Review the participant cohort alongside those observations. Many selections with few cost views suggest a navigation/understanding problem; frequent transport/access answers identify facts or supplier coverage to investigate. A repeated pattern is a research lead, not proof of willingness to pay. Agree the next experiment from actual results; do not invent conversion targets or user responses.
