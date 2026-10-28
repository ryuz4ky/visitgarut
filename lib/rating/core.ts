// VisitGarut Rating — pure rules shared by the site, the worker and the tests.
// Every number here is published on the methodology page; change them only together with that page.

export type Sector = 'kuliner' | 'kafe' | 'penginapan' | 'wisata' | 'umkm' | 'rental' | 'tur' | 'jasa'
export type Tier = 'kurang' | 'awal' | 'terverifikasi' | 'tinggi'
export type Evidence = 'receipt' | 'qr_geo' | 'otp_only'

export const RATING = {
  priorWeight: 10, // m in the Bayesian average
  defaultPrior: 4.0, // used until a sector has enough approved reviews of its own
  minSectorReviewsForPrior: 30,
  halfLifeDays: 365,
  maxAgeDays: 730,
  windowDays: 365, // reviewers counted for the tier
  repeatDays: 90, // one phone counts once per place in this period
  geofenceMeters: 150,
  checkinMinutesBeforeOtpExpires: 240,
  inviteDelayMinutes: 120,
  inviteValidDays: 7,
  minMinutesAfterCheckin: 30,
  aspectMinRaters: 3,
  plaqueValidMonths: 12,
  spikeFactor: 3,
  spikeMinReviews: 5,
} as const

export const evidenceWeight: Record<Evidence, number> = { receipt: 1, qr_geo: 0.7, otp_only: 0.3 }

export const coreAspects = [
  { key: 'pelayanan', label: 'Pelayanan' },
  { key: 'harga', label: 'Harga sepadan' },
] as const

export const sectors: Record<Sector, { label: string; aspects: { key: string; label: string }[] }> = {
  kuliner: { label: 'Rumah makan', aspects: [{ key: 'rasa', label: 'Rasa' }, { key: 'kebersihan', label: 'Kebersihan' }, { key: 'kecepatan', label: 'Kecepatan saji' }, { key: 'suasana', label: 'Suasana' }, { key: 'parkir', label: 'Parkir' }] },
  kafe: { label: 'Kafe & kopi', aspects: [{ key: 'minuman', label: 'Kualitas minuman' }, { key: 'suasana', label: 'Suasana' }, { key: 'kebersihan', label: 'Kebersihan' }, { key: 'kerja', label: 'Nyaman untuk kerja' }, { key: 'parkir', label: 'Parkir' }] },
  penginapan: { label: 'Penginapan', aspects: [{ key: 'kamar', label: 'Kebersihan kamar' }, { key: 'tidur', label: 'Kenyamanan tidur' }, { key: 'sesuai_foto', label: 'Sesuai foto & deskripsi' }, { key: 'fasilitas', label: 'Air panas & fasilitas' }, { key: 'lokasi', label: 'Lokasi' }] },
  wisata: { label: 'Wisata', aspects: [{ key: 'akses', label: 'Akses jalan' }, { key: 'kebersihan', label: 'Kebersihan' }, { key: 'fasilitas', label: 'Fasilitas' }, { key: 'keluarga', label: 'Ramah keluarga' }, { key: 'keamanan', label: 'Keamanan' }, { key: 'keramaian', label: 'Keramaian' }, { key: 'parkir', label: 'Parkir' }] },
  umkm: { label: 'Oleh-oleh & UMKM', aspects: [{ key: 'kualitas', label: 'Kualitas produk' }, { key: 'harga_tertera', label: 'Harga tertera jelas' }, { key: 'keaslian', label: 'Keaslian produk lokal' }, { key: 'kemasan', label: 'Kemasan' }] },
  rental: { label: 'Rental kendaraan', aspects: [{ key: 'kondisi', label: 'Kondisi kendaraan' }, { key: 'tepat_waktu', label: 'Tepat waktu' }, { key: 'biaya_jelas', label: 'Biaya tanpa kejutan' }, { key: 'sopir', label: 'Sopir' }] },
  tur: { label: 'Jasa tur & pemandu', aspects: [{ key: 'pengetahuan', label: 'Pengetahuan lokal' }, { key: 'keamanan', label: 'Keamanan' }, { key: 'tepat_waktu', label: 'Tepat waktu' }, { key: 'sesuai_paket', label: 'Sesuai paket' }] },
  jasa: { label: 'Jasa lainnya', aspects: [{ key: 'hasil', label: 'Hasil kerja' }, { key: 'tepat_waktu', label: 'Tepat waktu' }, { key: 'biaya_jelas', label: 'Kejujuran biaya' }] },
}

/** Existing directory categories → rating sector. Unknown categories fall back to "jasa". */
export const categorySector: Record<string, Sector> = { wisata: 'wisata', hotel: 'penginapan', kuliner: 'kuliner', cafe: 'kafe', transportasi: 'rental', 'paket-wisata': 'tur', 'oleh-oleh': 'umkm', umkm: 'umkm', jasa: 'jasa' }

export function sectorForCategory(category: string): Sector {
  return categorySector[category] ?? 'jasa'
}

/** Directory categories whose places fall in a sector unless a place overrides it with rating_sector. */
export function categoriesForSector(sector: Sector) {
  return Object.keys(categorySector).filter(c => categorySector[c] === sector)
}

export const sectorOrder: Sector[] = ['kuliner', 'kafe', 'penginapan', 'wisata', 'umkm', 'rental', 'tur', 'jasa']

export function aspectsForSector(sector: Sector) {
  return [...coreAspects, ...sectors[sector].aspects]
}

export const tierLabels: Record<Tier, string> = { kurang: 'Belum cukup penilai', awal: 'Skor awal', terverifikasi: 'Terverifikasi', tinggi: 'Keyakinan tinggi' }

const DAY = 86_400_000

export type ScoredReview = { overall: number; evidence: Evidence; createdAt: Date; reviewer: string; aspects?: Record<string, number | null> }

export function decay(createdAt: Date, now: Date) {
  const age = (now.getTime() - createdAt.getTime()) / DAY
  if (age < 0) return 1
  if (age > RATING.maxAgeDays) return 0
  return Math.pow(0.5, age / RATING.halfLifeDays)
}

export function reviewWeight(review: ScoredReview, now: Date) {
  return decay(review.createdAt, now) * evidenceWeight[review.evidence]
}

/** Bayesian average: m·C + Σ wᵢ·rᵢ over m + Σ wᵢ. */
export function bayesianScore(reviews: ScoredReview[], prior: number, now: Date, m: number = RATING.priorWeight) {
  let sum = 0
  let weight = 0
  for (const review of reviews) {
    const w = reviewWeight(review, now)
    sum += w * review.overall
    weight += w
  }
  return (m * prior + sum) / (m + weight)
}

export function tierFor(reviews: ScoredReview[], now: Date): { tier: Tier; reviewers: number } {
  const windowStart = now.getTime() - RATING.windowDays * DAY
  const recent = reviews.filter(r => r.createdAt.getTime() >= windowStart)
  const reviewers = new Set(recent.map(r => r.reviewer)).size
  const evidenceKinds = new Set(recent.map(r => r.evidence === 'receipt' ? 'receipt' : 'visit'))
  if (reviewers >= 15 && evidenceKinds.size >= 2) return { tier: 'tinggi', reviewers }
  if (reviewers >= 10) return { tier: 'terverifikasi', reviewers }
  if (reviewers >= 3) return { tier: 'awal', reviewers }
  return { tier: 'kurang', reviewers }
}

/** Lower bound of an 80% interval around the score, used only for ranking so a single 5 cannot outrank many 4.6s. */
export function rankingScore(reviews: ScoredReview[], prior: number, now: Date) {
  const score = bayesianScore(reviews, prior, now)
  const weights = reviews.map(r => reviewWeight(r, now))
  const n = weights.reduce((a, b) => a + b, 0)
  if (n === 0) return score - 1
  const mean = reviews.reduce((a, r, i) => a + weights[i] * r.overall, 0) / n
  const variance = reviews.reduce((a, r, i) => a + weights[i] * (r.overall - mean) ** 2, 0) / n
  return score - 1.2816 * Math.sqrt((variance + 0.25) / (RATING.priorWeight + n))
}

export function aspectAverages(reviews: ScoredReview[], keys: string[], now: Date) {
  const result: Record<string, { average: number | null; raters: number }> = {}
  for (const key of keys) {
    const rated = reviews.filter(r => typeof r.aspects?.[key] === 'number')
    const raters = new Set(rated.map(r => r.reviewer)).size
    if (raters < RATING.aspectMinRaters) { result[key] = { average: null, raters }; continue }
    let sum = 0
    let weight = 0
    for (const r of rated) { const w = reviewWeight(r, now); sum += w * (r.aspects![key] as number); weight += w }
    result[key] = { average: weight ? Math.round((sum / weight) * 10) / 10 : null, raters }
  }
  return result
}

/** Overall-star histogram in whole percent that always sums to 100 (largest remainder). */
export function distribution(reviews: ScoredReview[]) {
  const counts = [0, 0, 0, 0, 0]
  for (const r of reviews) counts[r.overall - 1]++
  const total = counts.reduce((a, b) => a + b, 0)
  if (!total) return counts
  const raw = counts.map(c => (c * 100) / total)
  const floors = raw.map(Math.floor)
  let rest = 100 - floors.reduce((a, b) => a + b, 0)
  const order = raw.map((v, i) => [v - floors[i], i] as const).sort((a, b) => b[0] - a[0])
  for (const [, i] of order) { if (rest <= 0) break; floors[i]++; rest-- }
  return floors
}

/** True when the last 7 days hold more than 3× the weekly average of the 4 weeks before. */
export function unusualActivity(createdAt: Date[], now: Date) {
  const t = now.getTime()
  const lastWeek = createdAt.filter(d => t - d.getTime() <= 7 * DAY).length
  const before = createdAt.filter(d => t - d.getTime() > 7 * DAY && t - d.getTime() <= 35 * DAY).length
  const weekly = before / 4
  return lastWeek >= RATING.spikeMinReviews && lastWeek > RATING.spikeFactor * Math.max(weekly, 1)
}

export function roundScore(score: number) {
  return Math.round(score * 10) / 10
}

export function formatScore(score: number) {
  return roundScore(score).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

/** Indonesian mobile numbers only, normalised to 62xxxxxxxxxx. Returns null for anything else. */
export function normalizePhone(input: string) {
  const digits = String(input || '').replace(/[\s\-().]/g, '')
  let n = digits.startsWith('+') ? digits.slice(1) : digits
  if (n.startsWith('0')) n = '62' + n.slice(1)
  if (n.startsWith('8')) n = '62' + n
  return /^628\d{8,11}$/.test(n) ? n : null
}

/** Great-circle distance in metres. */
export function distanceMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6_371_000
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function geoMatches(place: { latitude: number | null; longitude: number | null }, device: { lat: number; lon: number; accuracy: number } | null) {
  if (!device || place.latitude === null || place.longitude === null) return false
  if (!Number.isFinite(device.lat) || !Number.isFinite(device.lon) || !(device.accuracy >= 0) || device.accuracy > 500) return false
  return distanceMeters({ lat: place.latitude, lon: place.longitude }, device) <= RATING.geofenceMeters + Math.min(device.accuracy, 100)
}

export type ReviewInput = { overall: number; aspects: Record<string, number | null>; body: string; party: string; noIncentive: boolean }
export const parties = ['sendiri', 'teman', 'keluarga', 'rombongan', 'kerja'] as const

/** Validates a submitted review form against the sector's aspects. Returns null when invalid. */
export function parseReview(form: Record<string, unknown>, sector: Sector): ReviewInput | null {
  const overall = Number(form.overall)
  if (!Number.isInteger(overall) || overall < 1 || overall > 5) return null
  if (form.no_incentive !== 'yes') return null
  const party = String(form.party || '')
  if (!(parties as readonly string[]).includes(party)) return null
  const body = String(form.body || '').trim()
  if (body.length > 1500) return null
  const aspects: Record<string, number | null> = {}
  for (const { key } of aspectsForSector(sector)) {
    const raw = form['aspect_' + key]
    if (raw === undefined || raw === '' || raw === '-') { aspects[key] = null; continue }
    const value = Number(raw)
    if (!Number.isInteger(value) || value < 1 || value > 5) return null
    aspects[key] = value
  }
  return { overall, aspects, body, party, noIncentive: true }
}

export type PlaqueState = 'aktif' | 'kedaluwarsa' | 'ditangguhkan' | 'dicabut'
export function plaqueState(plaque: { status: string; expiresAt: Date }, now: Date): PlaqueState {
  if (plaque.status === 'revoked') return 'dicabut'
  if (plaque.status === 'suspended') return 'ditangguhkan'
  if (plaque.expiresAt.getTime() <= now.getTime()) return 'kedaluwarsa'
  return 'aktif'
}

export function plaqueSerial(year: number, sequence: number) {
  return `VG-${String(year % 100).padStart(2, '0')}-${String(sequence).padStart(5, '0')}`
}

/** Accepts what people type from a plaque ("vg 26 00412", "VG2600412") and returns the canonical serial, or null. */
export function normalizeSerial(input: string) {
  const m = input.toUpperCase().replace(/[\s_]/g, '').match(/^VG-?(\d{2})-?(\d{5})$/)
  return m ? `VG-${m[1]}-${m[2]}` : null
}
