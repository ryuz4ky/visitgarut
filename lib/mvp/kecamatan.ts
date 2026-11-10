import 'server-only'
import { db } from './db'
import { hydratePlace, type Place } from './data'
import { categories } from './categories'
import { districtSlug, indexableSql } from './seo'

export type DistrictSummary = { name: string; slug: string; total: number; indexable: number; byCategory: Record<string, number> }

/** Every kecamatan that has published listings, with counts per category. */
export async function districts(): Promise<DistrictSummary[]> {
  if (!process.env.DATABASE_URL) return []
  const rows = (await db().query<{ district: string; category: string; n: number; idx: number }>(
    `SELECT district, category, count(*)::int AS n, count(*) FILTER (WHERE ${indexableSql})::int AS idx
     FROM vg_places WHERE status='published' AND btrim(district)<>'' GROUP BY district, category`,
  )).rows
  const map = new Map<string, DistrictSummary>()
  for (const r of rows) {
    const name = r.district.trim()
    const d = map.get(name) || { name, slug: districtSlug(name), total: 0, indexable: 0, byCategory: {} }
    d.total += r.n; d.indexable += r.idx; d.byCategory[r.category] = (d.byCategory[r.category] || 0) + r.n
    map.set(name, d)
  }
  return [...map.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'id'))
}

export async function districtBySlug(slug: string) {
  return (await districts()).find(d => d.slug === slug)
}

export async function districtPlaces(name: string, category?: string): Promise<Place[]> {
  if (!process.env.DATABASE_URL) return []
  return (await db().query<Place>(
    "SELECT * FROM vg_places WHERE status='published' AND district=$1 AND ($2::text IS NULL OR category=$2) ORDER BY name, id LIMIT 2000",
    [name, category || null],
  )).rows.map(hydratePlace)
}

export const categoryOrder = categories.map(c => c.slug)

/** A hub page is worth indexing once it lists a handful of places; tiny ones stay reachable but noindex. */
export const hubIndexable = (count: number) => count >= 3
