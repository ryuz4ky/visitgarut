import 'server-only'
import {splitPractical,type PracticalInfo} from '@/lib/visit/practical'
import { db } from './db'
import { buildPlacesQuery,buildDirectoryQueries,directorySummarySql,directoryPageSize, type PlaceSearch } from './search'
import {normalizeSavedIds} from './saved'
import {relatedPlaceSuggestionsSql} from './related-places'

export { categories } from './categories'
export type Place = {practical?:PracticalInfo|null;coordinate_reference?:unknown;google_place_id?:string; id: number; slug: string; name: string; category: string; district: string; address: string; excerpt: string; content: string; image_url: string; image_credit: string; latitude: number | null; longitude: number | null; website: string; whatsapp: string; source_url: string; status: string; updated_at: Date }
export type Article = { source_urls?:string[];image_url?:string;image_credit?:string;author_type?:string;reviewed_by?:string;reviewed_at?:Date|null; id: number; slug: string; title: string; excerpt: string; content: string; author: string; status: string; published_at: Date | null; updated_at: Date }
export type Event = { id: number; slug: string; title: string; excerpt: string; content: string; address: string; starts_at: Date; ends_at: Date | null; source_url: string; status: string; updated_at: Date }
export function hydratePlace(row:Place):Place {const parsed=splitPractical(row.content);return {...row,...parsed}}
export async function places(options: PlaceSearch = {}): Promise<Place[]> {
  if (!process.env.DATABASE_URL) return []
  const query = buildPlacesQuery(options)
  return (await db().query<Place>(query.text, query.values)).rows.map(hydratePlace)
}
export async function directoryPlaces(options:PlaceSearch={},page=1){
  if(!process.env.DATABASE_URL)return {items:[] as Place[],total:0,pages:1,page}
  const queries=buildDirectoryQueries(options,page)
  const total=(await db().query<{total:number}>(queries.count.text,queries.count.values)).rows[0].total
  const pages=Math.max(1,Math.ceil(total/directoryPageSize))
  const items=page>pages?[]:(await db().query<Place>(queries.items.text,queries.items.values)).rows.map(hydratePlace)
  return {items,total,pages,page}
}
export async function directorySummary(){
  if(!process.env.DATABASE_URL)return {total:0,districts:[] as string[]}
  const rows=(await db().query<{district:string;total:number}>(directorySummarySql)).rows
  return {total:rows.reduce((sum,row)=>sum+row.total,0),districts:rows.map(row=>row.district).filter(Boolean)}
}
export async function place(slug: string, category?: string): Promise<Place | undefined> {
  if (!process.env.DATABASE_URL) return undefined
  return (await db().query<Place>("SELECT * FROM vg_places WHERE slug=$1 AND status='published' AND ($2::text IS NULL OR category=$2)",[slug,category||null])).rows.map(hydratePlace)[0]
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
  return (await db().query<Place>("SELECT p.* FROM vg_places p JOIN vg_article_places ap ON ap.place_id=p.id WHERE ap.article_id=$1 AND p.status='published' ORDER BY p.name",[id])).rows.map(hydratePlace)
}
export async function relatedArticles(id: number): Promise<Article[]> {
  return (await db().query<Article>("SELECT a.* FROM vg_articles a JOIN vg_article_places ap ON ap.article_id=a.id WHERE ap.place_id=$1 AND a.status='published' ORDER BY a.published_at DESC",[id])).rows
}
export async function relatedPlaceSuggestions(id:number):Promise<Place[]>{
  if(!process.env.DATABASE_URL)return []
  return (await db().query<Place>(relatedPlaceSuggestionsSql,[id])).rows.map(hydratePlace)
}
export async function events(): Promise<Event[]> {
  if (!process.env.DATABASE_URL) return []
  return (await db().query<Event>("SELECT * FROM vg_events WHERE status='published' AND COALESCE(ends_at,starts_at+interval '1 day')>=now() ORDER BY starts_at LIMIT 100")).rows
}

// Sitemaps must not silently inherit the 100-row interactive directory cap.
export async function sitemapRecords(){
 if(!process.env.DATABASE_URL)return {places:[],articles:[]};
 const [ps,as]=await Promise.all([
  db().query<Pick<Place,'slug'|'category'|'updated_at'>>("SELECT slug,category,updated_at FROM vg_places WHERE status='published' ORDER BY id LIMIT 45000"),
  db().query<Pick<Article,'slug'|'updated_at'>>("SELECT slug,updated_at FROM vg_articles WHERE status='published' ORDER BY id LIMIT 4500")
 ]);
 return {places:ps.rows,articles:as.rows};
}

// Saved selections must not inherit the interactive directory's 100-row cap.
export const selectedTripPlacesSql="SELECT * FROM vg_places WHERE id=ANY($1::int[]) AND status='published' ORDER BY name LIMIT 101"
export async function selectedTripPlaces(ids:number[],startId:number):Promise<Place[]>{
 if(!process.env.DATABASE_URL)return []
 const wanted=normalizeSavedIds(ids)
 if(Number.isInteger(startId)&&startId>0&&startId<=2147483647&&!wanted.includes(startId))wanted.push(startId)
 if(!wanted.length)return []
 return (await db().query<Place>(selectedTripPlacesSql,[wanted])).rows.map(hydratePlace)
}
