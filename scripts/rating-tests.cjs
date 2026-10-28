const assert = require('node:assert/strict')
const fs = require('node:fs')
const { PGlite } = require('@electric-sql/pglite')
const core = require('../.rating-test/core.js')
const tokens = require('../.rating-test/tokens.js')
const store = require('../.rating-test/store.js')

const DAY = 86400000
const now = new Date('2026-11-01T05:00:00Z')
const secret = 'test-secret-0123456789'
const ago = days => new Date(now.getTime() - days * DAY)
const review = (overall, days = 1, evidence = 'qr_geo', reviewer = Math.random().toString(36)) => ({ overall, evidence, createdAt: ago(days), reviewer })

;(async () => {
  // --- Score formula (matches the worked example on the methodology page) ---
  const fresh = Array.from({ length: 10 }, () => ({ ...review(5, 0, 'receipt'), overall: 4.8 }))
  assert.equal(core.roundScore(core.bayesianScore(fresh, 4.3, now)), 4.6) // (43+48)/20 = 4.55
  assert.ok(Math.abs(core.bayesianScore(fresh, 4.3, now) - 4.55) < 1e-9)
  const attacked = [...fresh, { ...review(1, 0, 'receipt') }]
  assert.ok(Math.abs(core.bayesianScore(attacked, 4.3, now) - 92 / 21) < 1e-9)
  assert.equal(core.bayesianScore([], 4.0, now), 4.0)
  // Decay and evidence weights
  assert.equal(core.decay(ago(0), now), 1)
  assert.ok(Math.abs(core.decay(ago(365), now) - 0.5) < 1e-9)
  assert.equal(core.decay(ago(731), now), 0)
  assert.ok(Math.abs(core.reviewWeight(review(5, 0, 'otp_only'), now) - 0.3) < 1e-9)
  // One perfect review cannot outrank many good ones
  const one = [review(5, 1, 'receipt')]
  const many = Array.from({ length: 30 }, () => review(5, 1, 'receipt')).map((r, i) => ({ ...r, overall: i % 3 ? 5 : 4 }))
  assert.ok(core.rankingScore(many, 4.0, now) > core.rankingScore(one, 4.0, now))

  // --- Tiers follow the published thresholds ---
  const n = (k, evidence = 'qr_geo') => Array.from({ length: k }, (_, i) => review(4, 2, evidence, 'p' + i))
  assert.equal(core.tierFor(n(2), now).tier, 'kurang')
  assert.equal(core.tierFor(n(3), now).tier, 'awal')
  assert.equal(core.tierFor(n(10), now).tier, 'terverifikasi')
  assert.equal(core.tierFor(n(15), now).tier, 'terverifikasi') // one evidence kind only
  assert.equal(core.tierFor([...n(14), review(4, 2, 'receipt', 'r1')], now).tier, 'tinggi')
  assert.equal(core.tierFor([...n(3).map(r => ({ ...r, reviewer: 'same' }))], now).tier, 'kurang')
  assert.equal(core.tierFor(n(5).map(r => ({ ...r, createdAt: ago(400) })), now).tier, 'kurang')

  // --- Aspects, distribution, spikes ---
  const asp = [1, 2, 3].map(i => ({ ...review(4, 1, 'qr_geo', 'a' + i), aspects: { rasa: 5, parkir: i === 1 ? 2 : null } }))
  const avg = core.aspectAverages(asp, ['rasa', 'parkir'], now)
  assert.equal(avg.rasa.average, 5)
  assert.equal(avg.parkir.average, null)
  assert.equal(avg.parkir.raters, 1)
  assert.deepEqual(core.distribution([1, 2, 3].map(v => review(v))), [34, 33, 33, 0, 0].map((x, i) => [34, 33, 33, 0, 0][i]))
  assert.equal(core.distribution([5, 5, 4].map(v => review(v))).reduce((a, b) => a + b), 100)
  assert.equal(core.unusualActivity(Array.from({ length: 6 }, () => ago(1)), now), true)
  assert.equal(core.unusualActivity([...Array.from({ length: 6 }, () => ago(1)), ...Array.from({ length: 12 }, () => ago(10))], now), false)
  assert.equal(core.unusualActivity(Array.from({ length: 4 }, () => ago(1)), now), false)

  // --- Input parsing ---
  assert.equal(core.normalizePhone('0812-3456-7890'), '6281234567890')
  assert.equal(core.normalizePhone('+62 812 3456 7890'), '6281234567890')
  assert.equal(core.normalizePhone('812345678'), '62812345678')
  assert.equal(core.normalizePhone('+1 415 555 0100'), null)
  assert.equal(core.normalizePhone('021-555-1234'), null)
  const form = { overall: '4', party: 'keluarga', no_incentive: 'yes', body: 'Enak', aspect_rasa: '5', aspect_parkir: '-' }
  const parsed = core.parseReview(form, 'kuliner')
  assert.equal(parsed.overall, 4)
  assert.equal(parsed.aspects.rasa, 5)
  assert.equal(parsed.aspects.parkir, null)
  assert.equal(core.parseReview({ ...form, no_incentive: undefined }, 'kuliner'), null)
  assert.equal(core.parseReview({ ...form, overall: '6' }, 'kuliner'), null)
  assert.equal(core.parseReview({ ...form, aspect_rasa: '9' }, 'kuliner'), null)
  assert.equal(core.parseReview({ ...form, party: 'bos' }, 'kuliner'), null)
  assert.equal(core.sectorForCategory('hotel'), 'penginapan')
  assert.equal(core.sectorForCategory('unknown'), 'jasa')
  assert.equal(core.geoMatches({ latitude: -7.2, longitude: 107.9 }, { lat: -7.2005, lon: 107.9, accuracy: 20 }), true)
  assert.equal(core.geoMatches({ latitude: -7.2, longitude: 107.9 }, { lat: -7.21, lon: 107.9, accuracy: 20 }), false)
  assert.equal(core.geoMatches({ latitude: null, longitude: null }, { lat: -7.2, lon: 107.9, accuracy: 5 }), false)
  assert.equal(core.plaqueSerial(2026, 412), 'VG-26-00412')
  assert.equal(core.plaqueState({ status: 'active', expiresAt: ago(-10) }, now), 'aktif')
  assert.equal(core.plaqueState({ status: 'active', expiresAt: ago(1) }, now), 'kedaluwarsa')
  assert.equal(core.plaqueState({ status: 'revoked', expiresAt: ago(-10) }, now), 'dicabut')

  assert.equal(core.normalizeSerial('vg 26 00412'), 'VG-26-00412')
  assert.equal(core.normalizeSerial('VG2600412'), 'VG-26-00412')
  assert.equal(core.normalizeSerial('VG-26-0041'), null)
  assert.equal(core.normalizeSerial('XX-26-00412'), null)

  // --- Tokens ---
  const code = tokens.randomCode()
  assert.ok(tokens.validPlateCode(code))
  assert.equal(tokens.validPlateCode('abc'), false)
  assert.equal(tokens.validPlateCode('oooooooooo'), false)
  assert.notEqual(tokens.phoneHash('6281', secret), tokens.phoneHash('6281', secret + 'x'))
  assert.throws(() => tokens.phoneHash('6281', 'short'))
  assert.ok(tokens.validInviteToken(tokens.newInviteToken()))

  // --- Full flow against the real schema (PGlite) ---
  const db = new PGlite()
  await db.exec(fs.readFileSync('db/001-mvp.sql', 'utf8'))
  await db.exec(fs.readFileSync('db/013-rating.sql', 'utf8'))
  await db.exec(fs.readFileSync('db/013-rating.sql', 'utf8')) // idempotent
  await db.exec(fs.readFileSync('db/014-sectors.sql', 'utf8'))
  await db.exec(fs.readFileSync('db/014-sectors.sql', 'utf8')) // idempotent
  const client = { query: (sql, values) => db.query(sql, values) }
  const placeId = (await client.query(`INSERT INTO vg_places(slug,name,category,latitude,longitude,status) VALUES('bale','Bale Tingtrim','kuliner',-7.2,107.9,'published') RETURNING id`)).rows[0].id
  await client.query(`INSERT INTO vg_places(slug,name,category,status) VALUES('draft','Draft','kuliner','draft')`)
  await client.query('INSERT INTO vg_rating_plates(place_id,code) VALUES($1,$2)', [placeId, 'abcdefghjk'])

  assert.equal((await store.startCheckin(client, 'zzzzzzzzzz', null, now)).error, 'plate')
  const near = { lat: -7.2003, lon: 107.9, accuracy: 15 }

  async function visit(phone, overall, opts = {}) {
    const t0 = opts.at || ago(1)
    const c = await store.startCheckin(client, 'abcdefghjk', opts.far ? null : near, t0)
    const otp = await store.requestOtp(client, c.id, phone, secret, t0)
    if (!otp.ok) return otp.error
    assert.equal(await store.verifyOtp(client, c.id, '000000' === otp.code ? '111111' : '000000', secret, t0), 'wrong')
    assert.equal(await store.verifyOtp(client, c.id, otp.code, secret, t0), 'ok')
    const due = await store.dueInvites(client, new Date(t0.getTime() + 3 * 3600000))
    const mine = due.find(d => d.id === c.id)
    assert.ok(mine, 'invite due after delay')
    assert.equal(mine.phone_raw, core.normalizePhone(phone))
    const token = tokens.newInviteToken()
    await store.markInvited(client, c.id, token, new Date(t0.getTime() + 3 * 3600000))
    const input = core.parseReview({ overall: String(overall), party: 'teman', no_incentive: 'yes', aspect_rasa: '5' }, 'kuliner')
    const result = await store.submitReview(client, token, input, 'R.', new Date(t0.getTime() + 4 * 3600000))
    return { result, token, checkin: c }
  }

  const first = await visit('081200000001', 5)
  assert.equal(first.result, 'ok')
  assert.equal(first.checkin.geo, true)
  // Same invite cannot be used twice
  const again = core.parseReview({ overall: '1', party: 'teman', no_incentive: 'yes' }, 'kuliner')
  assert.equal(await store.submitReview(client, first.token, again, '', now), 'used')
  // Same phone within 90 days is refused at the phone step
  assert.equal(await visit('0812 0000 0001', 1), 'repeat')
  // Insiders are blocked
  await client.query('INSERT INTO vg_rating_insiders(place_id,phone_hash) VALUES($1,$2)', [placeId, tokens.phoneHash('6281200000099', secret)])
  assert.equal(await visit('081200000099', 5), 'insider')
  // Expired invite
  const c2 = await store.startCheckin(client, 'abcdefghjk', null, ago(20))
  const o2 = await store.requestOtp(client, c2.id, '081200000002', secret, ago(20))
  await store.verifyOtp(client, c2.id, o2.code, secret, ago(20))
  const t2 = tokens.newInviteToken(); await store.markInvited(client, c2.id, t2, ago(20))
  assert.equal((await store.loadInvite(client, t2, now)).error, 'expired')
  // Too early after check-in
  const c3 = await store.startCheckin(client, 'abcdefghjk', near, now)
  const o3 = await store.requestOtp(client, c3.id, '081200000003', secret, now)
  await store.verifyOtp(client, c3.id, o3.code, secret, now)
  const t3 = tokens.newInviteToken(); await store.markInvited(client, c3.id, t3, now)
  assert.equal((await store.loadInvite(client, t3, new Date(now.getTime() + 5 * 60000))).error, 'early')
  // OTP lockout after 5 wrong tries
  const c4 = await store.startCheckin(client, 'abcdefghjk', near, now)
  await store.requestOtp(client, c4.id, '081200000004', secret, now)
  for (let i = 0; i < 5; i++) await store.verifyOtp(client, c4.id, '999999', secret, now)
  assert.equal(await store.verifyOtp(client, c4.id, '999999', secret, now), 'locked')

  // Pending reviews do not count
  let rating = await store.placeRating(client, placeId, now)
  assert.equal(rating.tier, 'kurang')
  assert.equal(rating.score, null)

  // Approve 15 reviews (14 qr_geo + 1 receipt) → tier tinggi
  for (let i = 10; i < 24; i++) {
    const v = await visit('0812000000' + i, i % 2 ? 5 : 4, { at: ago(30 + i) })
    assert.equal(v.result, 'ok')
  }
  const ids = (await client.query("SELECT id FROM vg_rating_reviews WHERE status='pending'")).rows.map(r => r.id)
  for (const id of ids) await store.moderate(client, id, 'approved', '', now)
  rating = await store.placeRating(client, placeId, now)
  assert.equal(rating.reviewers, 15)
  assert.equal(rating.tier, 'terverifikasi') // no receipt evidence yet
  assert.equal((await store.issuePlaque(client, placeId, now)).error, 'tier')
  await client.query("UPDATE vg_rating_reviews SET evidence='receipt' WHERE id=$1", [ids[0]])
  rating = await store.placeRating(client, placeId, now)
  assert.equal(rating.tier, 'tinggi')
  assert.ok(rating.score > 4 && rating.score < 5)
  assert.equal(rating.distribution.reduce((a, b) => a + b), 100)
  assert.equal(rating.aspects.find(a => a.key === 'rasa').average, 5)
  assert.equal(rating.aspects.find(a => a.key === 'parkir').average, null)
  const plaque = await store.issuePlaque(client, placeId, now)
  assert.match(plaque.serial, /^VG-26-\d{5}$/)
  const status = await store.plaqueBySerial(client, plaque.serial, now)
  assert.equal(status.state, 'aktif')
  assert.equal((await store.plaqueBySerial(client, plaque.serial, new Date(now.getTime() + 400 * DAY))).state, 'kedaluwarsa')
  assert.equal(await store.plaqueBySerial(client, 'nope', now), null)

  // --- Listings: batch summaries, sector ranking, headline stats ---
  assert.deepEqual(core.categoriesForSector('umkm').sort(), ['oleh-oleh', 'umkm'])
  assert.equal(core.sectorForCategory('oleh-oleh'), 'umkm')
  assert.equal(core.sectorForCategory('jasa'), 'jasa')
  const shop = (await client.query(`INSERT INTO vg_places(slug,name,category,status) VALUES('dodol','Toko Dodol','oleh-oleh','published') RETURNING id`)).rows[0].id
  const cafe = (await client.query(`INSERT INTO vg_places(slug,name,category,status,rating_sector) VALUES('kopi','Kedai Kopi','kuliner','published','kafe') RETURNING id`)).rows[0].id
  const fakeCheckin = async (pid, i, overall, days) => {
    const id = require('node:crypto').randomUUID()
    await client.query('INSERT INTO vg_rating_checkins(id,place_id,phone_hash,verified_at) VALUES($1,$2,$3,$4)', [id, pid, 'h' + pid + '-' + i, ago(days)])
    await client.query(`INSERT INTO vg_rating_reviews(checkin_id,place_id,phone_hash,sector,overall,party,evidence,status,created_at) VALUES($1,$2,$3,$4,$5,'teman','qr_geo','approved',$6)`, [id, pid, 'h' + pid + '-' + i, 'umkm', overall, ago(days)])
  }
  for (let i = 0; i < 3; i++) await fakeCheckin(shop, i, 4, 5 + i)
  await fakeCheckin(cafe, 0, 5, 3)
  const sums = await store.ratingSummaries(client, [placeId, shop, cafe, 99999], now)
  assert.equal(sums.get(placeId).tier, 'tinggi')
  assert.ok(Math.abs(sums.get(placeId).score - rating.score) < 1e-9)
  assert.equal(sums.get(shop).tier, 'awal')
  assert.equal(sums.get(shop).sector, 'umkm')
  assert.equal(sums.get(cafe).tier, 'kurang')
  assert.equal(sums.get(cafe).score, null)
  assert.equal(sums.get(cafe).sector, 'kafe') // rating_sector override
  assert.equal(sums.has(99999), false)
  assert.equal((await store.ratingSummaries(client, [], now)).size, 0)
  const topK = await store.topRated(client, 'kuliner', now)
  assert.deepEqual(topK.map(t => t.slug), ['bale']) // the cafe override is not counted as kuliner
  assert.deepEqual((await store.topRated(client, 'umkm', now)).map(t => t.slug), ['dodol'])
  assert.deepEqual(await store.topRated(client, 'kafe', now), []) // below 3 reviewers: no rank
  assert.deepEqual((await store.sectorPeers(client, placeId, 'kuliner', now)), [])
  const stats = await store.ratingStats(client, now)
  assert.equal(stats.scoredPlaces, 2)
  assert.equal(stats.reviewers, 19)
  await assert.rejects(client.query(`INSERT INTO vg_places(slug,name,category,status) VALUES('x','X','bogus','draft')`))

  // Reviewer withdrawal removes it from the score
  assert.equal(await store.withdrawReview(client, first.token), true)
  assert.equal((await client.query('SELECT status FROM vg_rating_reviews WHERE id=(SELECT min(id) FROM vg_rating_reviews)')).rows[0].status, 'withdrawn')

  // Retention: raw phones removed after 30 days; unverified check-ins after 1 day
  await store.purgeRating(client, new Date(now.getTime() + 40 * DAY))
  assert.equal((await client.query('SELECT count(*)::int n FROM vg_rating_checkins WHERE phone_raw IS NOT NULL')).rows[0].n, 0)
  assert.equal((await client.query('SELECT count(*)::int n FROM vg_rating_checkins WHERE verified_at IS NULL')).rows[0].n, 0)
  assert.ok((await client.query('SELECT count(*)::int n FROM vg_rating_reviews')).rows[0].n >= 15)

  // Worker sends due invites once and records them
  const worker = require('../.rating-test/worker.js')
  const c9 = await store.startCheckin(client, 'abcdefghjk', near, now)
  const o9 = await store.requestOtp(client, c9.id, '081299999999', secret, now)
  await store.verifyOtp(client, c9.id, o9.code, secret, now)
  const sentTo = []
  const later = new Date(now.getTime() + 3 * 3600000)
  const fake = async (phone, text) => { sentTo.push([phone, text]); return { ok: true } }
  const run1 = await worker.runRatingWorker(client, 'https://visitgarut.com/', later, fake)
  assert.equal(run1.sent, 1)
  assert.match(sentTo[0][1], /https:\/\/visitgarut\.com\/nilai\/[A-Za-z0-9_-]{32}/)
  assert.equal(sentTo[0][0], '6281299999999')
  assert.equal((await worker.runRatingWorker(client, 'https://visitgarut.com', later, fake)).sent, 0)
  const failing = async () => ({ ok: false, reason: 'down' })
  const c10 = await store.startCheckin(client, 'abcdefghjk', near, now)
  const o10 = await store.requestOtp(client, c10.id, '081288888888', secret, now)
  await store.verifyOtp(client, c10.id, o10.code, secret, now)
  assert.equal((await worker.runRatingWorker(client, 'https://visitgarut.com', later, failing)).failed, 1)
  assert.equal((await worker.runRatingWorker(client, 'https://visitgarut.com', later, fake)).sent, 1) // retried next run

  // Rate limit
  for (let i = 0; i < 3; i++) assert.equal(await store.allow(client, 'k'.repeat(64), 3, now), true)
  assert.equal(await store.allow(client, 'k'.repeat(64), 3, now), false)
  assert.equal(await store.allow(client, 'k'.repeat(64), 3, new Date(now.getTime() + 2 * DAY)), true)

  console.log('Rating tests passed')
})().catch(error => { console.error(error); process.exit(1) })
