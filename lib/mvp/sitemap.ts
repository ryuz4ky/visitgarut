import 'server-only'
import { db } from './db'
import { categories } from './categories'
import { indexableSql } from './seo'
import { districts, hubIndexable } from './kecamatan'
import { absoluteUrl } from '@/lib/site'
import { ratingEnabled } from '@/lib/rating/server'

export type SitemapUrl = { loc: string; lastmod?: Date; priority?: number }
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const iso = (d?: Date) => (d ? new Date(d).toISOString() : '')
const newest = (ds: Date[]) => (ds.length ? new Date(Math.max(...ds.map(d => new Date(d).getTime()))) : undefined)

export function urlsetXml(urls: SitemapUrl[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${iso(u.lastmod)}</lastmod>` : ''}${u.priority !== undefined ? `<priority>${u.priority}</priority>` : ''}</url>`).join('\n')}\n</urlset>\n`
}
export function indexXml(items: { loc: string; lastmod?: Date }[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.map(i => `<sitemap><loc>${esc(i.loc)}</loc>${i.lastmod ? `<lastmod>${iso(i.lastmod)}</lastmod>` : ''}</sitemap>`).join('\n')}\n</sitemapindex>\n`
}

type Row = { slug: string; category: string; updated_at: Date }

async function indexablePlaces(): Promise<Row[]> {
  if (!process.env.DATABASE_URL) return []
  return (await db().query<Row>(`SELECT slug,category,updated_at FROM vg_places WHERE status='published' AND ${indexableSql} ORDER BY id LIMIT 45000`)).rows
}
async function publishedArticles(): Promise<{ slug: string; updated_at: Date }[]> {
  if (!process.env.DATABASE_URL) return []
  return (await db().query("SELECT slug,updated_at FROM vg_articles WHERE status='published' ORDER BY id LIMIT 4500")).rows
}
async function categoryLastmod(): Promise<Record<string, Date>> {
  if (!process.env.DATABASE_URL) return {}
  const rows = (await db().query<{ category: string; m: Date }>("SELECT category,max(updated_at) AS m FROM vg_places WHERE status='published' GROUP BY category")).rows
  return Object.fromEntries(rows.map(r => [r.category, r.m]))
}

/** Each sitemap section, keyed by file name. Only indexable URLs are listed. */
export async function sitemapSections(): Promise<Record<string, SitemapUrl[]>> {
  const [ps, as, lastByCat, ds] = await Promise.all([indexablePlaces(), publishedArticles(), categoryLastmod(), districts()])
  const lastAll = newest(Object.values(lastByCat))
  const pages = ['tentang', 'community-pulse', 'community-pulse/metode', 'event', 'privasi', 'ketentuan', ...(ratingEnabled() ? ['rating/metode', 'untuk-usaha'] : [])]
  const out: Record<string, SitemapUrl[]> = {
    halaman: [
      { loc: absoluteUrl('/'), lastmod: newest([lastAll, ...as.map(a => a.updated_at)].filter(Boolean) as Date[]), priority: 1 },
      ...pages.map(s => ({ loc: absoluteUrl('/' + s), priority: 0.5 })),
      ...categories.filter(c => lastByCat[c.slug]).map(c => ({ loc: absoluteUrl('/' + c.slug), lastmod: lastByCat[c.slug], priority: 0.8 })),
      { loc: absoluteUrl('/artikel'), lastmod: newest(as.map(a => a.updated_at)), priority: 0.8 },
      { loc: absoluteUrl('/map'), lastmod: lastAll, priority: 0.6 },
    ],
    kecamatan: [
      { loc: absoluteUrl('/kecamatan'), lastmod: lastAll, priority: 0.7 },
      ...ds.filter(d => hubIndexable(d.total)).map(d => ({ loc: absoluteUrl(`/kecamatan/${d.slug}`), lastmod: lastAll, priority: 0.7 })),
      ...ds.flatMap(d => categories.filter(c => hubIndexable(d.byCategory[c.slug] || 0)).map(c => ({ loc: absoluteUrl(`/kecamatan/${d.slug}/${c.slug}`), lastmod: lastByCat[c.slug], priority: 0.6 }))),
    ],
    artikel: as.map(a => ({ loc: absoluteUrl(`/artikel/${a.slug}`), lastmod: a.updated_at, priority: 0.7 })),
  }
  for (const c of categories) {
    const rows = ps.filter(p => p.category === c.slug)
    if (rows.length) out[c.slug] = rows.map(p => ({ loc: absoluteUrl(`/${p.category}/${p.slug}`), lastmod: p.updated_at, priority: 0.8 }))
  }
  return out
}

export const xmlResponse = (body: string) => new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=3600' } })
