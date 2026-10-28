// Database operations for VisitGarut Rating. The caller owns the connection (pg Pool/Client or PGlite in tests).
import { randomUUID } from 'node:crypto'
import {
  RATING, aspectsForSector, aspectAverages, bayesianScore, categoriesForSector, distribution, geoMatches, normalizePhone, plaqueSerial,
  plaqueState, rankingScore, sectorForCategory, tierFor, unusualActivity, type Evidence, type ReviewInput, type ScoredReview, type Sector, type Tier,
} from './core'
import { inviteHash, newOtp, otpHash, phoneHash, sameHash, validInviteToken, validPlateCode } from './tokens'

type Row = Record<string, any>
export type Connection = { query: (sql: string, values?: unknown[]) => Promise<{ rows: Row[] }> }

const MIN = 60_000
const DAY = 86_400_000

export function placeSector(place: Row): Sector {
  return (place.rating_sector as Sector) || sectorForCategory(String(place.category))
}

/** Daily counter; returns false once `max` is exceeded for this key. */
export async function allow(client: Connection, key: string, max: number, now: Date) {
  const resets = new Date(now.getTime() + DAY)
  const row = (await client.query(
    `INSERT INTO vg_rating_limits(key,hits,resets_at) VALUES($1,1,$2)
     ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN vg_rating_limits.resets_at<=$3 THEN 1 ELSE vg_rating_limits.hits+1 END,
       resets_at=CASE WHEN vg_rating_limits.resets_at<=$3 THEN $2 ELSE vg_rating_limits.resets_at END
     RETURNING hits`, [key, resets, now])).rows[0]
  return Number(row.hits) <= max
}

export async function plateByCode(client: Connection, code: string) {
  if (!validPlateCode(code)) return null
  const row = (await client.query(
    `SELECT pl.id plate_id,pl.code,pl.location_note,p.id place_id,p.name,p.slug,p.category,p.rating_sector,p.district,p.latitude,p.longitude
     FROM vg_rating_plates pl JOIN vg_places p ON p.id=pl.place_id
     WHERE pl.code=$1 AND pl.active AND p.status='published'`, [code])).rows[0]
  return row || null
}

/** Step 1: scan. Records whether the device was within the geofence; coordinates themselves are not stored. */
export async function startCheckin(client: Connection, code: string, device: { lat: number; lon: number; accuracy: number } | null, now: Date) {
  const plate = await plateByCode(client, code)
  if (!plate) return { error: 'plate' as const }
  const id = randomUUID()
  const geo = geoMatches({ latitude: plate.latitude, longitude: plate.longitude }, device)
  await client.query('INSERT INTO vg_rating_checkins(id,place_id,plate_id,geo_match,created_at) VALUES($1,$2,$3,$4,$5)', [id, plate.place_id, plate.plate_id, geo, now])
  return { id, geo, place: plate }
}

export type OtpResult = { ok: true; code: string; phone: string } | { ok: false; error: 'expired' | 'invalid_phone' | 'insider' | 'repeat' | 'verified' }

/** Step 2: phone. Returns the OTP for the caller to send by WhatsApp. */
export async function requestOtp(client: Connection, checkinId: string, rawPhone: string, secret: string, now: Date): Promise<OtpResult> {
  const checkin = (await client.query('SELECT * FROM vg_rating_checkins WHERE id=$1', [checkinId])).rows[0]
  if (!checkin || now.getTime() - new Date(checkin.created_at).getTime() > RATING.checkinMinutesBeforeOtpExpires * MIN) return { ok: false, error: 'expired' }
  if (checkin.verified_at) return { ok: false, error: 'verified' }
  const phone = normalizePhone(rawPhone)
  if (!phone) return { ok: false, error: 'invalid_phone' }
  const hash = phoneHash(phone, secret)
  const insider = (await client.query('SELECT 1 FROM vg_rating_insiders WHERE place_id=$1 AND phone_hash=$2', [checkin.place_id, hash])).rows.length
  if (insider) return { ok: false, error: 'insider' }
  const since = new Date(now.getTime() - RATING.repeatDays * DAY)
  const repeat = (await client.query(
    `SELECT 1 FROM vg_rating_checkins WHERE place_id=$1 AND phone_hash=$2 AND verified_at IS NOT NULL AND created_at>=$3 AND id<>$4 LIMIT 1`,
    [checkin.place_id, hash, since, checkinId])).rows.length
  if (repeat) return { ok: false, error: 'repeat' }
  const code = newOtp()
  await client.query(
    `UPDATE vg_rating_checkins SET phone_hash=$2,phone_raw=$3,otp_hash=$4,otp_expires_at=$5,otp_attempts=0 WHERE id=$1`,
    [checkinId, hash, phone, otpHash(code, checkinId, secret), new Date(now.getTime() + 10 * MIN)])
  return { ok: true, code, phone }
}

/** Step 3: code. On success schedules the invitation; the review itself is never collected at the venue. */
export async function verifyOtp(client: Connection, checkinId: string, code: string, secret: string, now: Date) {
  const c = (await client.query('SELECT * FROM vg_rating_checkins WHERE id=$1', [checkinId])).rows[0]
  if (!c || !c.otp_hash) return 'expired' as const
  if (c.verified_at) return 'ok' as const
  if (c.otp_attempts >= 5) return 'locked' as const
  if (new Date(c.otp_expires_at).getTime() < now.getTime()) return 'expired' as const
  if (!/^\d{6}$/.test(code) || !sameHash(otpHash(code, checkinId, secret), c.otp_hash)) {
    await client.query('UPDATE vg_rating_checkins SET otp_attempts=otp_attempts+1 WHERE id=$1', [checkinId])
    return 'wrong' as const
  }
  await client.query(
    'UPDATE vg_rating_checkins SET verified_at=$2,otp_hash=NULL,invite_after=$3 WHERE id=$1',
    [checkinId, now, new Date(now.getTime() + RATING.inviteDelayMinutes * MIN)])
  return 'ok' as const
}

/** For the worker: verified check-ins whose invite is due. */
export async function dueInvites(client: Connection, now: Date, limit = 50) {
  return (await client.query(
    `SELECT c.id,c.phone_raw,p.name FROM vg_rating_checkins c JOIN vg_places p ON p.id=c.place_id
     WHERE c.verified_at IS NOT NULL AND c.invited_at IS NULL AND NOT c.opted_out AND c.phone_raw IS NOT NULL AND c.invite_after<=$1
       AND c.created_at>=$2
     ORDER BY c.invite_after LIMIT $3`, [now, new Date(now.getTime() - RATING.inviteValidDays * DAY), limit])).rows
}

export async function markInvited(client: Connection, checkinId: string, token: string, now: Date) {
  await client.query(
    'UPDATE vg_rating_checkins SET invite_hash=$2,invited_at=$3,invite_expires_at=$4 WHERE id=$1 AND invited_at IS NULL',
    [checkinId, inviteHash(token), now, new Date(now.getTime() + RATING.inviteValidDays * DAY)])
}

export async function loadInvite(client: Connection, token: string, now: Date) {
  if (!validInviteToken(token)) return { error: 'invalid' as const }
  const row = (await client.query(
    `SELECT c.*,p.name,p.slug,p.category,p.rating_sector,r.id review_id,r.status review_status
     FROM vg_rating_checkins c JOIN vg_places p ON p.id=c.place_id LEFT JOIN vg_rating_reviews r ON r.checkin_id=c.id
     WHERE c.invite_hash=$1`, [inviteHash(token)])).rows[0]
  if (!row) return { error: 'invalid' as const }
  if (row.review_id) return { error: 'used' as const, row }
  if (new Date(row.invite_expires_at).getTime() < now.getTime()) return { error: 'expired' as const }
  if (now.getTime() - new Date(row.created_at).getTime() < RATING.minMinutesAfterCheckin * MIN) return { error: 'early' as const }
  return { row, sector: placeSector(row) }
}

export async function submitReview(client: Connection, token: string, input: ReviewInput, displayName: string, now: Date) {
  await client.query('BEGIN')
  try {
    const loaded = await loadInvite(client, token, now)
    if ('error' in loaded) { await client.query('ROLLBACK'); return loaded.error }
    const { row, sector } = loaded
    const evidence: Evidence = row.geo_match ? 'qr_geo' : 'otp_only'
    const review = (await client.query(
      `INSERT INTO vg_rating_reviews(checkin_id,place_id,phone_hash,sector,overall,body,party,evidence,display_name,created_at)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(checkin_id) DO NOTHING RETURNING id`,
      [row.id, row.place_id, row.phone_hash, sector, input.overall, input.body, input.party, evidence, displayName.trim().slice(0, 40), now])).rows[0]
    if (!review) { await client.query('ROLLBACK'); return 'used' as const }
    for (const [aspect, rating] of Object.entries(input.aspects)) {
      if (rating !== null) await client.query('INSERT INTO vg_rating_review_aspects(review_id,aspect,rating) VALUES($1,$2,$3)', [review.id, aspect, rating])
    }
    await client.query('COMMIT')
    return 'ok' as const
  } catch (error) { await client.query('ROLLBACK'); throw error }
}

/** The reviewer can withdraw at any time with the same invite link. */
export async function withdrawReview(client: Connection, token: string) {
  if (!validInviteToken(token)) return false
  const rows = (await client.query(
    `UPDATE vg_rating_reviews r SET status='withdrawn',decided_at=now() FROM vg_rating_checkins c
     WHERE c.id=r.checkin_id AND c.invite_hash=$1 RETURNING r.id`, [inviteHash(token)])).rows
  return rows.length > 0
}

export async function moderate(client: Connection, reviewId: number, decision: 'approved' | 'rejected', note: string, now: Date) {
  const rows = (await client.query(
    `UPDATE vg_rating_reviews SET status=$2,moderation_note=$3,decided_at=$4 WHERE id=$1 AND status IN ('pending','approved','rejected') RETURNING place_id`,
    [reviewId, decision, note.slice(0, 1000), now])).rows
  return rows[0]?.place_id as number | undefined
}

async function sectorPrior(client: Connection, sector: Sector) {
  const row = (await client.query(
    `SELECT count(*)::int n, avg(overall)::float a FROM vg_rating_reviews WHERE sector=$1 AND status='approved'`, [sector])).rows[0]
  return row.n >= RATING.minSectorReviewsForPrior ? Number(row.a) : RATING.defaultPrior
}

export async function placeRating(client: Connection, placeId: number, now: Date) {
  const place = (await client.query('SELECT id,name,slug,category,rating_sector FROM vg_places WHERE id=$1', [placeId])).rows[0]
  if (!place) return null
  const sector = placeSector(place)
  const since = new Date(now.getTime() - RATING.maxAgeDays * DAY)
  const rows = (await client.query(
    `SELECT r.id,r.overall,r.evidence,r.created_at,r.phone_hash,r.body,r.party,r.display_name,r.business_reply,
       COALESCE(json_object_agg(a.aspect,a.rating) FILTER (WHERE a.aspect IS NOT NULL),'{}') aspects
     FROM vg_rating_reviews r LEFT JOIN vg_rating_review_aspects a ON a.review_id=r.id
     WHERE r.place_id=$1 AND r.status='approved' AND r.created_at>=$2
     GROUP BY r.id ORDER BY r.created_at DESC`, [placeId, since])).rows
  const reviews: ScoredReview[] = rows.map(r => ({
    overall: Number(r.overall), evidence: r.evidence, createdAt: new Date(r.created_at), reviewer: r.phone_hash,
    aspects: typeof r.aspects === 'string' ? JSON.parse(r.aspects) : r.aspects,
  }))
  const recentIntake = (await client.query(
    `SELECT created_at FROM vg_rating_reviews WHERE place_id=$1 AND status<>'rejected' AND created_at>=$2`,
    [placeId, new Date(now.getTime() - 35 * DAY)])).rows.map(r => new Date(r.created_at))
  const prior = await sectorPrior(client, sector)
  const { tier, reviewers } = tierFor(reviews, now)
  const aspectList = aspectsForSector(sector)
  const plaque = (await client.query('SELECT serial,status,expires_at FROM vg_rating_plaques WHERE place_id=$1 ORDER BY issued_at DESC LIMIT 1', [placeId])).rows[0]
  return {
    place, sector, tier, reviewers,
    score: tier === 'kurang' ? null : bayesianScore(reviews, prior, now),
    prior,
    aspects: aspectList.map(a => ({ ...a, ...aspectAverages(reviews, [a.key], now)[a.key] })),
    distribution: reviewers >= 10 ? distribution(reviews) : null,
    evidence: reviews.filter(r => r.createdAt.getTime() >= now.getTime() - RATING.windowDays * DAY)
      .reduce((acc, r) => { acc[r.evidence] += 1; return acc }, { receipt: 0, qr_geo: 0, otp_only: 0 } as Record<Evidence, number>),
    totalApproved: rows.length,
    unusual: unusualActivity(recentIntake, now),
    latest: rows.slice(0, 10).map(r => ({
      id: r.id, overall: Number(r.overall), body: r.body, party: r.party, displayName: r.display_name || 'Pengunjung',
      evidence: r.evidence as Evidence, month: new Date(r.created_at), reply: r.business_reply,
      aspects: typeof r.aspects === 'string' ? JSON.parse(r.aspects) : r.aspects,
    })),
    plaque: plaque ? { serial: plaque.serial, state: plaqueState({ status: plaque.status, expiresAt: new Date(plaque.expires_at) }, now) } : null,
  }
}

export async function issuePlaque(client: Connection, placeId: number, now: Date) {
  const rating = await placeRating(client, placeId, now)
  if (!rating || rating.tier !== 'tinggi' || rating.score === null) return { error: 'tier' as const }
  if (rating.unusual) return { error: 'unusual' as const }
  const seq = Number((await client.query("SELECT nextval('vg_rating_plaque_seq') n")).rows[0].n)
  const serial = plaqueSerial(now.getUTCFullYear(), seq)
  const expires = new Date(now)
  expires.setUTCMonth(expires.getUTCMonth() + RATING.plaqueValidMonths)
  await client.query(
    'INSERT INTO vg_rating_plaques(serial,place_id,score_at_issue,reviewers_at_issue,issued_at,expires_at) VALUES($1,$2,$3,$4,$5,$6)',
    [serial, placeId, Math.round(rating.score * 10) / 10, rating.reviewers, now, expires])
  return { serial, expires }
}

export async function plaqueBySerial(client: Connection, serial: string, now: Date) {
  if (!/^VG-\d{2}-\d{5}$/.test(serial)) return null
  const row = (await client.query(
    `SELECT q.*,p.name,p.slug,p.category FROM vg_rating_plaques q JOIN vg_places p ON p.id=q.place_id WHERE q.serial=$1`, [serial])).rows[0]
  if (!row) return null
  return { ...row, state: plaqueState({ status: row.status, expiresAt: new Date(row.expires_at) }, now) } as Row & { state: ReturnType<typeof plaqueState> }
}

/** Privacy retention: raw phone numbers are deleted 30 days after check-in; unverified check-ins after 1 day. */
export async function purgeRating(client: Connection, now: Date) {
  await client.query('UPDATE vg_rating_checkins SET phone_raw=NULL WHERE phone_raw IS NOT NULL AND created_at<$1', [new Date(now.getTime() - 30 * DAY)])
  await client.query('DELETE FROM vg_rating_checkins WHERE verified_at IS NULL AND created_at<$1', [new Date(now.getTime() - DAY)])
  await client.query('DELETE FROM vg_rating_limits WHERE resets_at<=$1', [now])
}

export type RatingSummary = { placeId: number; sector: Sector; tier: Tier; reviewers: number; score: number | null; rank: number }

async function sectorPriors(client: Connection) {
  const rows = (await client.query(`SELECT sector, count(*)::int n, avg(overall)::float a FROM vg_rating_reviews WHERE status='approved' GROUP BY sector`)).rows
  const priors: Record<string, number> = {}
  for (const r of rows) if (r.n >= RATING.minSectorReviewsForPrior) priors[r.sector] = Number(r.a)
  return (sector: string) => priors[sector] ?? RATING.defaultPrior
}

/** Score, tier and ranking value for many places in two queries (listings, sector pages, home). */
export async function ratingSummaries(client: Connection, placeIds: number[], now: Date) {
  const ids = [...new Set(placeIds.filter(id => Number.isInteger(id) && id > 0))]
  const result = new Map<number, RatingSummary>()
  if (!ids.length) return result
  const places = (await client.query('SELECT id,category,rating_sector FROM vg_places WHERE id = ANY($1::int[])', [ids])).rows
  const since = new Date(now.getTime() - RATING.maxAgeDays * DAY)
  const rows = (await client.query(
    `SELECT place_id,overall,evidence,created_at,phone_hash FROM vg_rating_reviews
     WHERE status='approved' AND created_at>=$2 AND place_id = ANY($1::int[])`, [ids, since])).rows
  const byPlace = new Map<number, ScoredReview[]>()
  for (const r of rows) {
    const list = byPlace.get(Number(r.place_id)) ?? []
    list.push({ overall: Number(r.overall), evidence: r.evidence, createdAt: new Date(r.created_at), reviewer: r.phone_hash })
    byPlace.set(Number(r.place_id), list)
  }
  const prior = await sectorPriors(client)
  for (const p of places) {
    const sector = placeSector(p)
    const reviews = byPlace.get(Number(p.id)) ?? []
    const { tier, reviewers } = tierFor(reviews, now)
    const c = prior(sector)
    result.set(Number(p.id), {
      placeId: Number(p.id), sector, tier, reviewers,
      score: tier === 'kurang' ? null : bayesianScore(reviews, c, now),
      rank: tier === 'kurang' ? -99 : rankingScore(reviews, c, now),
    })
  }
  return result
}

export type RankedPlace = RatingSummary & { name: string; slug: string; category: string; district: string; image_url: string }

/** Highest-ranked places of one sector that already show a score (3+ independent reviewers). */
export async function topRated(client: Connection, sector: Sector, now: Date, limit = 5): Promise<RankedPlace[]> {
  const candidates = (await client.query(
    `SELECT DISTINCT p.id,p.name,p.slug,p.category,p.district,p.image_url FROM vg_places p
     JOIN vg_rating_reviews r ON r.place_id=p.id AND r.status='approved'
     WHERE p.status='published' AND (p.rating_sector=$1 OR (p.rating_sector IS NULL AND p.category = ANY($2::text[])))`,
    [sector, categoriesForSector(sector)])).rows
  const summaries = await ratingSummaries(client, candidates.map(c => Number(c.id)), now)
  return candidates
    .map(c => ({ ...(summaries.get(Number(c.id)) as RatingSummary), name: c.name, slug: c.slug, category: c.category, district: c.district || '', image_url: c.image_url || '' }))
    .filter(r => r.tier !== 'kurang')
    .sort((a, b) => b.rank - a.rank || b.reviewers - a.reviewers)
    .slice(0, limit)
}

/** Headline numbers: places with a visible score and independent reviewers in the last 12 months. */
export async function ratingStats(client: Connection, now: Date) {
  const since = new Date(now.getTime() - RATING.windowDays * DAY)
  const row = (await client.query(
    `SELECT count(DISTINCT phone_hash)::int reviewers, count(*)::int reviews FROM vg_rating_reviews WHERE status='approved' AND created_at>=$1`, [since])).rows[0]
  const scored = (await client.query(
    `SELECT count(*)::int n FROM (SELECT place_id FROM vg_rating_reviews WHERE status='approved' AND created_at>=$1
     GROUP BY place_id HAVING count(DISTINCT phone_hash)>=3) x`, [since])).rows[0]
  return { reviewers: Number(row.reviewers), reviews: Number(row.reviews), scoredPlaces: Number(scored.n) }
}

/** Places of the same sector to compare with, best first, excluding one place. */
export async function sectorPeers(client: Connection, placeId: number, sector: Sector, now: Date, limit = 3) {
  return (await topRated(client, sector, now, limit + 1)).filter(p => p.placeId !== placeId).slice(0, limit)
}
