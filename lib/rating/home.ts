import 'server-only'
import { db } from '@/lib/mvp/db'
import { categories } from '@/lib/mvp/categories'
import { categoriesForSector, sectorOrder, type Sector } from './core'
import { ratingStats, ratingSummaries, topRated, type RankedPlace, type RatingSummary } from './store'
import type { BoardRow, BoardTab } from '@/components/rating/SectorBoard'

export const sectorShort: Record<Sector, string> = {
  kuliner: 'Kuliner', kafe: 'Kafe', penginapan: 'Penginapan', wisata: 'Wisata', umkm: 'Oleh-oleh & UMKM', rental: 'Rental', tur: 'Tur & pemandu', jasa: 'Jasa',
}

export function sectorHref(sector: Sector) {
  return `/${categoriesForSector(sector)[0] ?? 'search'}`
}

export function boardRow(p: RankedPlace): BoardRow {
  const cat = categories.find(c => c.slug === p.category)
  return {
    id: p.placeId, name: p.name, href: `/${p.category}/${p.slug}#rating`, image: p.image_url,
    meta: [cat?.shortName ?? cat?.name, p.district].filter(Boolean).join(' · '),
    tier: p.tier, score: p.score, reviewers: p.reviewers,
  }
}

/** Everything the rating part of the home page needs. Failures degrade to empty boards, never to made-up numbers. */
export async function loadRatingHome(now = new Date()) {
  if (!process.env.DATABASE_URL) return { tabs: [] as BoardTab[], stats: { reviewers: 0, reviews: 0, scoredPlaces: 0 } }
  try {
    const client = db()
    const [stats, ...lists] = await Promise.all([ratingStats(client, now), ...sectorOrder.map(s => topRated(client, s, now, 5))])
    const tabs: BoardTab[] = sectorOrder.map((s, i) => ({ key: s, label: sectorShort[s], href: sectorHref(s), rows: lists[i].map(boardRow) }))
    return { tabs, stats }
  } catch {
    return { tabs: sectorOrder.map(s => ({ key: s, label: sectorShort[s], href: sectorHref(s), rows: [] })), stats: { reviewers: 0, reviews: 0, scoredPlaces: 0 } }
  }
}

/** Card chips for a list of places. Empty when the database is unavailable; never invents a score. */
export async function cardRatings(ids: number[], now = new Date()) {
  const out: Record<number, { score: number | null; tier: RatingSummary['tier']; reviewers: number }> = {}
  if (!process.env.DATABASE_URL || !ids.length) return out
  try {
    const sums = await ratingSummaries(db(), ids, now)
    for (const [id, s] of sums) out[id] = { score: s.score, tier: s.tier, reviewers: s.reviewers }
  } catch {}
  return out
}
