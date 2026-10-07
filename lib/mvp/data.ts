import 'server-only'
import { db } from './db'

export const categories = [
  { slug: 'wisata', name: 'Wisata', icon: 'Mountain', description: 'Gunung, danau, pantai, dan pengalaman alam di Garut.' },
  { slug: 'hotel', name: 'Hotel', icon: 'BedDouble', description: 'Temukan penginapan untuk perjalananmu.' },
  { slug: 'kuliner', name: 'Kuliner', icon: 'Utensils', description: 'Jelajahi tempat makan dan cita rasa lokal Garut.' },
  { slug: 'cafe', name: 'Cafe', icon: 'Coffee', description: 'Cari tempat untuk ngopi dan beristirahat.' },
  { slug: 'transportasi', name: 'Transportasi', icon: 'Car', description: 'Pilihan transportasi dan rental untuk menjelajahi Garut.' },
  { slug: 'paket-wisata', name: 'Paket wisata', icon: 'Compass', description: 'Pilihan perjalanan bersama penyedia lokal.' },
]
export type Place = { id: number; slug: string; name: string; category: string; district: string; address: string; excerpt: string; content: string; image_url: string; image_credit: string; latitude: number | null; longitude: number | null; website: string; whatsapp: string; source_url: string; status: string; updated_at: Date }
export type Article = { id: number; slug: string; title: string; excerpt: string; content: string; author: string; status: string; published_at: Date | null; updated_at: Date }
export type Event = { id: number; slug: string; title: string; excerpt: string; content: string; address: string; starts_at: Date; ends_at: Date | null; source_url: string; status: string; updated_at: Date }
export async function places(options: { category?: string; query?: string; district?: string } = {}): Promise<Place[]> {
  if (!process.env.DATABASE_URL) return []
  const values: string[] = []; const conditions = ["status='published'"]
  if (options.category) { values.push(options.category); conditions.push(`category=$${values.length}`) }
  if (options.district) { values.push(options.district); conditions.push(`district=$${values.length}`) }
  if (options.query?.trim()) { values.push(options.query.trim().slice(0,120)); const n=values.length; conditions.push(`(search_vector @@ plainto_tsquery('simple',$${n}) OR name ILIKE '%' || $${n} || '%' OR district ILIKE '%' || $${n} || '%')`) }
  return (await db().query<Place>(`SELECT * FROM vg_places WHERE ${conditions.join(' AND ')} ORDER BY name LIMIT 100`, values)).rows
}
export async function place(slug: string, category?: string): Promise<Place | undefined> {
  if (!process.env.DATABASE_URL) return undefined
  return (await db().query<Place>("SELECT * FROM vg_places WHERE slug=$1 AND status='published' AND ($2::text IS NULL OR category=$2)",[slug,category||null])).rows[0]
}
export async function articles(): Promise<Article[]> {
  if (!process.env.DATABASE_URL) return []
  return (await db().query<Article>("SELECT * FROM vg_articles WHERE status='published' ORDER BY published_at DESC LIMIT 100")).rows
}
export async function article(slug: string): Promise<Article | undefined> {
  if (!process.env.DATABASE_URL) return undefined
  return (await db().query<Article>("SELECT * FROM vg_articles WHERE slug=$1 AND status='published'",[slug])).rows[0]
}
export async function relatedPlaces(id: number): Promise<Place[]> {
  return (await db().query<Place>("SELECT p.* FROM vg_places p JOIN vg_article_places ap ON ap.place_id=p.id WHERE ap.article_id=$1 AND p.status='published' ORDER BY p.name",[id])).rows
}
export async function relatedArticles(id: number): Promise<Article[]> {
  return (await db().query<Article>("SELECT a.* FROM vg_articles a JOIN vg_article_places ap ON ap.article_id=a.id WHERE ap.place_id=$1 AND a.status='published' ORDER BY a.published_at DESC",[id])).rows
}
export async function events(): Promise<Event[]> {
  if (!process.env.DATABASE_URL) return []
  return (await db().query<Event>("SELECT * FROM vg_events WHERE status='published' AND COALESCE(ends_at,starts_at+interval '1 day')>=now() ORDER BY starts_at LIMIT 100")).rows
}
