# Practical information coverage — 16 October 2026

## Visitor outcome

Extend the practical summaries from the three launch records to all 19 existing attraction listings. The 16 additions explain what a visitor should check about prices, group needs, access, hours, and extra costs. This is a content release using the existing metadata and revision storage; there is no application, schema, URL, or hosting change.

Checked dates describe online source inspection, not an operator call or a visit. Older reports retain their original dates in the public notes. Questions and recommendations are marked as such; an article's silence is not evidence that a facility is absent. Listings with unknown prices remain incomplete in the budget.

## Additions and evidence

The canonical source URL for every row is in `data/visit-practical-2026-10-16.json` and is displayed on the place page.

| Place | Source inspected | Useful distinction | Automatic adult price |
| --- | --- | --- | --- |
| Situ Bagendit | Indonesia Travel | Several tariff calendars; Friday not stated; separate activities | Unknown |
| Candi Cangkuang | Indonesia Travel | Raft transfer and return time; article refers to 2021 | Unknown |
| Talaga Bodas | Pemkab, 5 January 2026 | Wanaraja location; current final access needs confirmation | Unknown |
| Kamojang Ecopark | Sisparnas | Listed toilets/access facilities; 08:00–17:00; malformed price | Unknown |
| Karacak Valley | Sukabumiupdate, 22 November 2024 | Trekking versus overnight visit; transport connection needs recheck | Unknown |
| Curug Orok | Pemkab, 19 June 2024 | Cikandang/Cikajang location; walking and return allowance | Unknown |
| Sanghyang Taraje | Pemkab, 2 August 2026 | Reported request for 2.5 km access-road improvements | Unknown |
| Pantai Santolo | Kecamatan Cikelet profile | Separate accommodation/services; no dependable live travel time | Unknown |
| Pantai Sayang Heulang | Pemkab, April 2026 | Past festival is not a current activity schedule | Unknown |
| Pantai Rancabuaya | Pemkab, 27 June 2025 | Ask for payment breakdown; historical collection concerns are dated | Unknown |
| Pantai Karang Paranje | Pemkab, 16 May 2023 | Conservation-event report is not a bookable visitor package | Unknown |
| Pantai Taman Manalusu | Kecamatan Cikelet profile | Beach/rock areas; boat service separate from admission | Unknown |
| Leuwi Jurig | RRI, 20 August 2026 | Reported narrow access and limited facilities require reconfirmation | Unknown |
| Leuweung Oko | Perhutani, 1 July 2022 | Historical partnership does not establish today's operator | Unknown |
| Saung Ciburial | Jadesta profile | Package/room prices are not general admission; agree group quote | Unknown |
| Kebun Mawar Situhapa | Operator website, undated | Saturday and Sunday differ; garden and restaurant hours differ | Rp17,500 on weekdays only |

The three launch records are unchanged. There are now four attraction records with at least one sourced numeric adult-rate field; this does not mean four complete visit budgets. The other 15 have unknown numeric admission fields. Missing prices never become zero-price admission.

## Deliberate tariff exclusions

- Bagendit publishes Monday–Thursday, Saturday–Sunday, and special-holiday amounts, with Friday omitted. Neither numeric field is populated because the current two-way tariff model cannot preserve all these conditions. The published notes retain the distinctions.
- Kebun Mawar lists Monday–Saturday and Sunday/national-holiday tariffs. Monday–Friday can use the weekday field. The weekend field stays null because Saturday and Sunday differ. The existing planner warning still requires manual selection for holidays; users must confirm date-specific charges.
- Cangkuang and Karacak articles contain older prices. Reading those pages today does not make their old tariffs current. Neither becomes an automatic tariff.
- Sisparnas's Kamojang price text is ambiguous. No amount is inferred from it.
- Saung Ciburial lists differently scoped products. No package or room price is converted to per-person entry.

## Import and review

Run the existing `npm run seed:visit` dry run with the production environment, inspect the intended slugs, then use `npm run seed:visit -- --apply`. The importer locks each row, snapshots changed content, and commits atomically. It preserves same-date/newer practical edits, including the three launch records. It does not create places, change coordinates, or alter visitor evidence.

Validate all records with `npm run test:visit` and compare their slugs with the existing attraction directory. After import, check all 19 public practical panels, source/date labels, unknown admission handling, and a weekday Kebun Mawar budget. Confirm a second import is a no-op.

## Remaining product work

Coverage is not operational completeness. The most valuable next work is direct confirmation with operators, sourced map points for listings that cannot yet route, a tariff model with explicit calendar exceptions and special holidays, and observed planning sessions with real visitors. No new adoption, conversion, booking, or market-validation result is claimed by this release.
