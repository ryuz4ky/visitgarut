import 'server-only'
import { db } from '@/lib/mvp/db'
import { hydratePlace, type Place, type Article } from '@/lib/mvp/data'

/** English pages exist only for records that have a translation row; everything else stays Indonesian-only. */
export type EnPlace = Place & { en_excerpt: string; en_content: string; en_updated_at: Date }
export type EnArticle = Article & { en_title: string; en_excerpt: string; en_content: string; en_updated_at: Date }

const placeSql = `SELECT p.*, t.excerpt AS en_excerpt, t.content AS en_content, t.updated_at AS en_updated_at
  FROM vg_places p JOIN vg_i18n t ON t.kind='place' AND t.ref_id=p.id AND t.lang='en' WHERE p.status='published' AND p.category='wisata'`
const articleSql = `SELECT a.*, t.title AS en_title, t.excerpt AS en_excerpt, t.content AS en_content, t.updated_at AS en_updated_at
  FROM vg_articles a JOIN vg_i18n t ON t.kind='article' AND t.ref_id=a.id AND t.lang='en' WHERE a.status='published'`

const safe = async <T>(run: () => Promise<T>, fallback: T) => { if (!process.env.DATABASE_URL) return fallback; try { return await run() } catch { return fallback } }

export const enPlaces = () => safe(async () => (await db().query<EnPlace>(`${placeSql} ORDER BY (p.image_url<>'' AND p.image_credit !~* '^Foto (kawasan|arsip)') DESC, p.name`)).rows.map(r => hydratePlace(r) as EnPlace), [] as EnPlace[])
export const enPlace = (slug: string) => safe(async () => (await db().query<EnPlace>(`${placeSql} AND p.slug=$1`, [slug])).rows.map(r => hydratePlace(r) as EnPlace)[0], undefined as EnPlace | undefined)
export const enArticles = () => safe(async () => (await db().query<EnArticle>(`${articleSql} ORDER BY a.published_at DESC NULLS LAST`)).rows, [] as EnArticle[])
export const enArticle = (slug: string) => safe(async () => (await db().query<EnArticle>(`${articleSql} AND a.slug=$1`, [slug])).rows[0], undefined as EnArticle | undefined)
export const enRelatedPlaces = (articleId: number) => safe(async () => (await db().query<EnPlace>(`${placeSql} AND p.id IN (SELECT place_id FROM vg_article_places WHERE article_id=$1) ORDER BY p.name`, [articleId])).rows.map(r => hydratePlace(r) as EnPlace), [] as EnPlace[])

/** For the Indonesian page: is there an English version to point hreflang at? */
export const hasEn = (kind: 'place' | 'article', id: number) => safe(async () => (await db().query("SELECT 1 FROM vg_i18n WHERE kind=$1 AND ref_id=$2 AND lang='en'", [kind, id])).rows.length > 0, false)
