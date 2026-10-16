# Calendar tariffs and visitor-entered tickets

## Visitor outcome

The earlier planner could not calculate places whose Saturday, Sunday, or holiday tariffs differed. It also left visitors unable to include confirmed adult ticket totals when a listing's tariff was unknown. This revision resolves both gaps while retaining explicit uncertainty and existing share links.

- Use the visit date for individual weekdays. National holidays and operator-specific special holidays are separate manual choices; holiday detection is not automatic.
- If a visitor selects a general weekday/weekend category, a calendar rate is calculated only when all days in that category have the same known amount. Otherwise the visitor needs a date or their own estimate.
- Enter an adult group total for each selected attraction. It replaces that attraction's sourced adult subtotal, is labeled as the visitor's estimate, and never edits public place data. Empty means use the source if available; an explicit zero is retained as a visitor-entered amount.
- Estimates are scoped to place IDs. Reordering keeps them; removing a stop drops its estimate. Changing the date, day category, or adult count clears adult and child ticket estimates. Changing child count or the selection clears the combined child total. A date change also clears the transport-return checkbox.
- Shared plans retain the manual values and tag them in the prepared message. Holiday categories are included in operator questions. Old share links without these fields remain valid.

## Source-checked calendars

The sources were checked again on 16 October 2026. They remain online references, not direct operator confirmations for a future visit. Adult rates only; existing child-cost handling is retained.

| Place | Ordinary days | National holiday | Special holiday | Unknown |
| --- | --- | --- | --- | --- |
| Situ Bagendit | Mon–Thu Rp10,000; Sat–Sun Rp15,000 | Not separately stated | Rp20,000 | Friday; national-holiday classification |
| Kebun Mawar Situhapa | Mon–Sat Rp17,500; Sun Rp22,500 | Rp22,500 | Not stated | Special-holiday exceptions; child rules |
| Darajat Pass | Sat–Sun Rp35,000 | Rp35,000 in the source's general holiday group | Not separately stated | Ambiguous weekday amount; age-ten boundary |

Sources: [Indonesia Travel](https://www.indonesia.travel/id/id/travel-ideas/adventure/situ-bagendit), [Kebun Mawar](https://www.kebunmawar.com/), [Darajat Pass](https://darajatpass.com/kolam-renang-air-panas/).

Example: two adults at Kebun Mawar calculate Rp35,000 on Saturday and Rp45,000 on Sunday. Two adults at Bagendit calculate Rp20,000 Monday–Thursday, Rp30,000 on an ordinary weekend, Rp40,000 when explicitly selecting the special-holiday category, and an unknown admission subtotal on Friday. Other trip costs remain separate.

## Storage and editorial controls

The existing version-one metadata envelope gains an optional validated calendar: seven daily adult amounts, a national-holiday amount, and a special-holiday amount. A null rate stays unknown and never falls back to a generic price. Legacy metadata is still valid. Numeric source prices retain the existing 30-day freshness rule.

CMS fields can enable or disable a calendar and leave individual days blank. An older form preserves the calendar only if its source and check date are unchanged; an older edit that omits practical fields preserves the whole existing record. Existing authentication, revision snapshots, transactions, and public-URL protections remain in place. No schema migration is needed.

## Controlled production content upgrade

The standard seed still preserves same-date/newer practical records. Calendar upgrades require the explicit `--upgrade-calendar` mode:

```sh
npm run seed:visit -- --upgrade-calendar
npm run seed:visit -- --upgrade-calendar --apply
npm run seed:visit -- --upgrade-calendar
```

This mode only updates an existing record that exactly matches one of the three stored pre-upgrade baselines in `data/visit-calendar-baselines-2026-10-16.json`. The source, check date, legacy rates, and other notes must match. Only the calendar and price explanation are added or revised. All other records and operator edits are skipped, regardless of their dates. Public descriptions stay intact; changed metadata receives existing revision snapshots. The first and last commands are read-only; the final run should list no imports. A fresh database uses the ordinary seed, which already includes the calendars.

## Verification

`test:visit` checks calendar boundaries, unknown Fridays, separate holidays, stale prices, legacy links, replacement rather than double counting, zero/invalid manual values, estimate resets, and sharing. It also runs the actual importer against isolated PostgreSQL-compatible fixtures to verify baseline matching, preservation of owner edits, rollback, snapshots, and idempotency. Editorial tests cover calendar saves, older forms, explicit removal, and invalid prices.

Browser checks cover place-to-planner handoff, Saturday/Sunday/holiday prices, an unknown tariff completed by a visitor estimate, group/date resets, shared-plan reload, and a mobile viewport. The full existing build suite and TypeScript checks run before publishing. Production checks repeat the important calculations after the three-record upgrade.
