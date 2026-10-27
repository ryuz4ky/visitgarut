# VisitGarut Rating — MVP

Status: built and tested locally on 2026-10-28, **not deployed**. Every public part stays hidden until `RATING_ENABLED=1`, so deploying this code alone changes nothing for visitors.

## What it does

1. **Plat QR "Titik Ulasan"** (`/r/<kode>`): the visitor checks in. Location is only compared with the place's map point (≤150 m + GPS accuracy) and is not stored. WhatsApp OTP proves one person = one vote.
2. **Undangan menilai**: `scripts/rating-worker.cjs` (cron) sends a WhatsApp invite 2 hours after check-in to *every* verified visitor. The review is never collected at the counter, so staff cannot filter who rates.
3. **Form nilai** (`/nilai/<token>`): overall 1–5 + sector aspects (with "–" for unknown) + no-incentive declaration. Reviews are held as `pending`. The reviewer can withdraw with the same link.
4. **Moderasi** (`/admin/rating`): queue, plates, insider blocking, plaques, business replies. Rejections require a reason.
5. **Skor** on place pages (`#rating`) and the methodology page (`/rating/metode`), which reads its numbers from `lib/rating/core.ts`.
6. **Plakat** (`/plakat/<VG-26-00001>`): issued only at tier "Keyakinan tinggi", valid 12 months, public status (aktif / kedaluwarsa / ditangguhkan / dicabut).

## Scoring (lib/rating/core.ts)

- Bayesian average, m = 10, sector prior (4.0 until a sector has 30 approved reviews).
- Weight = 0.5^(age/365 days) × evidence (receipt 1.0, QR + location 0.7, no location 0.3); reviews older than 730 days are ignored.
- Tiers by independent reviewers in 12 months: 0–2 none, 3–9 awal, 10–14 terverifikasi (percentages shown), 15+ with ≥2 evidence kinds = tinggi.
- Aspects need ≥3 raters. One phone counts once per place per 90 days. Spike rule: >3× weekly average and ≥5 reviews in 7 days → "aktivitas tidak wajar" label and plaque issuance blocked.
- Receipt evidence (weight 1.0) has a schema slot but no upload UI yet; until then no place can reach "Keyakinan tinggi" without an admin marking receipt evidence. This is intentional for the pilot.

## Files

- `db/013-rating.sql` — additive, idempotent; added to `scripts/pulse-migrate.cjs`.
- `lib/rating/{core,tokens,store,worker,whatsapp,server}.ts`
- `app/r/[code]`, `app/nilai/[token]`, `app/plakat/[serial]`, `app/rating/metode`, `app/admin/rating`
- `components/rating/*`, `app/rating.css`, AdminShell link, place page panel.
- `scripts/rating-tests.cjs` (`npm run test:rating`, also part of `npm run build`), `scripts/rating-worker.cjs`.

## Environment (in ~/visitgarut.env)

| Variable | Value |
| --- | --- |
| `RATING_ENABLED` | `1` to show public pages; leave unset until the pilot starts |
| `RATING_SECRET` | random ≥32 chars; keys phone hashes and rate limits. **Never change after launch** (phone hashes would stop matching) |
| `WHATSAPP_PROVIDER` | `fonnte` (needs `WHATSAPP_TOKEN`) or `log` (development only) |
| `WHATSAPP_TOKEN` | gateway token |

Note: Fonnte is an unofficial WhatsApp gateway; numbers can be banned by WhatsApp. For scale, switch to the official WhatsApp Business (Meta Cloud) API with approved templates; add it in `lib/rating/whatsapp.ts`.

## Deploy (when approved)

1. Back up the database.
2. Apply the code to a branch, run `npm run test:rating`, `npx tsc --noEmit`, `npm run build`.
3. `node scripts/pulse-migrate.cjs` (runs 013 with the others).
4. Add cron every 15 minutes: `cd ~/public_html && npm run build:rating-worker && node scripts/rating-worker.cjs` (the build step can move into `scripts/deploy.sh`).
5. Create plates in `/admin/rating`, print QR codes for `https://visitgarut.com/r/<kode>`, register owner/staff phones as insiders.
6. Set `RATING_ENABLED=1` and `WHATSAPP_PROVIDER` only when the pilot starts.

## Verified locally (2026-10-28)

- `npm run test:rating`: formula worked example (4.55 → ≈4.38 after one 1-star), tiers, aspects, distribution, spikes, phone normalisation, geofence, OTP lockout, insider block, 90-day repeat block, invite expiry/too-early, one review per invite, withdrawal, plaque issue/expiry, retention purge, rate limits, worker retry.
- `npx tsc --noEmit` and `next build` pass.
- Browser run against PostgreSQL 16: scan → OTP (log provider) → check-in → worker invite → review form → pending row with aspects → approved → place panel → admin queue/plates/plaques render.

## Not done yet

Receipt/QRIS upload, QR image generation in admin (print from the URL for now), business dashboard, transparency report page, business claim flow, Meta Cloud API provider, Garut-specific legal review (see "Aturan Main" doc).
