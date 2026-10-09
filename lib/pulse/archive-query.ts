import { sensitivePattern, topics, platforms, sentimentNames, type Platform, type Sentiment, type Topic } from './core'

export type ArchiveSort = 'newest' | 'oldest' | 'engagement'
export type ArchiveFilters = { topic: Topic | null; platform: Platform | ''; sentiment: Sentiment | ''; sort: ArchiveSort }
export type ArchiveCursor = { time: string; id: number; engagement: number }
export const ARCHIVE_PAGE_SIZE = 20

const sensitivePgExpression = '\\y' + sensitivePattern.source.replace(/^\\b|\\b$/g, '') + '\\y'

export function validateArchiveFilters(raw: ArchiveFilters): ArchiveFilters {
 if (!raw || (raw.topic !== null && !Object.hasOwn(topics, raw.topic)) ||
  (raw.platform !== '' && !Object.hasOwn(platforms, raw.platform)) ||
  (raw.sentiment !== '' && !Object.hasOwn(sentimentNames, raw.sentiment)) ||
  !['newest','oldest','engagement'].includes(raw.sort)) throw new Error('Filter tidak valid.')
 return raw
}
export function encodeArchiveCursor(cursor: ArchiveCursor): string {
 return Buffer.from(JSON.stringify(cursor),'utf8').toString('base64url')
}
export function decodeArchiveCursor(value: string | null): ArchiveCursor | null {
 if (!value) return null
 if (value.length > 220 || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Cursor tidak valid.')
 let parsed: unknown
 try { parsed=JSON.parse(Buffer.from(value,'base64url').toString('utf8')) } catch { throw new Error('Cursor tidak valid.') }
 if (!parsed || typeof parsed !== 'object') throw new Error('Cursor tidak valid.')
 const p=parsed as Partial<ArchiveCursor>
 if (typeof p.time !== 'string' || p.time.length>40 || !Number.isFinite(Date.parse(p.time)) ||
  !Number.isInteger(p.id) || (p.id||0)<1 || !Number.isInteger(p.engagement) || (p.engagement||0)<0)
   throw new Error('Cursor tidak valid.')
 return {time:new Date(p.time).toISOString(),id:p.id!,engagement:p.engagement!}
}

/** SQL is parameterised end-to-end and restricts all rows to independently
 * moderated, publication-eligible, NON-SENSITIVE evidence only.
 * Sensitive topics continue to use the tightly controlled existing aggregate. */
export function archiveWhere(placeId:number, filters:ArchiveFilters, youtubeConsent:boolean) {
 validateArchiveFilters(filters)
 if (!Number.isSafeInteger(placeId) || placeId<1) throw new Error('Lokasi tidak valid.')
 const params: unknown[]=[placeId,sensitivePgExpression]
 let where=`m.place_id=$1 AND m.status='approved' AND m.reviewed_at IS NOT NULL
  AND m.platform<>'google'
  AND m.published_at BETWEEN now()-interval '90 days' AND now()
  AND (m.expires_at IS NULL OR m.expires_at>now())
  AND (m.experience_date IS NULL OR m.experience_date>=((now() AT TIME ZONE 'Asia/Jakarta')::date - 90))
  AND m.is_sensitive=false AND m.original_text !~* $2
  AND NOT EXISTS(SELECT 1 FROM vg_mention_topics forbidden WHERE forbidden.mention_id=m.id AND forbidden.topic IN ('tiket','keamanan'))
  AND (m.rights_basis<>'youtube_api' OR $3::boolean)`
 params.push(youtubeConsent)
 if(filters.topic!==null) {
  params.push(filters.topic)
  where+=` AND EXISTS(SELECT 1 FROM vg_mention_topics t WHERE t.mention_id=m.id AND t.topic=$${params.length})`
 }
 if(filters.platform!=='') {params.push(filters.platform);where+=` AND m.platform=$${params.length}`}
 if(filters.sentiment!=='') {
  params.push(filters.sentiment)
  if(filters.topic!==null) where+=` AND EXISTS(SELECT 1 FROM vg_mention_topics st WHERE st.mention_id=m.id AND st.topic=$${params.indexOf(filters.topic)+1} AND st.sentiment=$${params.length})`
  else where+=` AND m.sentiment=$${params.length}`
 }
 return {where, params}
}
export function archivePageSql(placeId:number, filters:ArchiveFilters, youtubeConsent:boolean, cursor:string|null) {
 const {where,params}=archiveWhere(placeId,filters,youtubeConsent)
 const decoded=decodeArchiveCursor(cursor)
 let cursorCondition=''
 if(decoded){
  params.push(decoded.time,decoded.id)
  const timeIndex=params.length-1,idIndex=params.length
  if(filters.sort==='engagement'){
   params.push(decoded.engagement)
   cursorCondition=` AND (m.engagement_count,m.published_at,m.id)<($${params.length}::integer,$${timeIndex}::timestamptz,$${idIndex}::integer)`
  }else{
   cursorCondition=` AND (m.published_at,m.id)${filters.sort==='oldest'?'>':'<'}($${timeIndex}::timestamptz,$${idIndex}::integer)`
  }
 }
 const order=filters.sort==='engagement'?'m.engagement_count DESC,m.published_at DESC,m.id DESC':filters.sort==='oldest'?'m.published_at ASC,m.id ASC':'m.published_at DESC,m.id DESC'
 params.push(ARCHIVE_PAGE_SIZE+1)
 const sql=`SELECT m.id,m.platform,m.original_text,m.display_name,m.source_url,m.published_at,
  to_char(m.experience_date,'YYYY-MM-DD') AS experience_date,m.sentiment,m.engagement_count,
  COALESCE((SELECT jsonb_agg(jsonb_build_object('topic',t.topic,'sentiment',t.sentiment)) FROM vg_mention_topics t WHERE t.mention_id=m.id),'[]'::jsonb) AS topics,
  COALESCE((SELECT jsonb_agg(jsonb_build_object('dimension',r.dimension,'rating',r.rating)) FROM vg_mention_ratings r WHERE r.mention_id=m.id),'[]'::jsonb) AS ratings
 FROM vg_social_mentions m WHERE ${where}${cursorCondition}
 ORDER BY ${order} LIMIT $${params.length}`
 return {sql,params}
}
export function archiveCountSql(placeId:number,filters:ArchiveFilters,youtubeConsent:boolean) {
 const {where,params}=archiveWhere(placeId,filters,youtubeConsent)
 return {sql:`SELECT count(*)::integer AS total FROM vg_social_mentions m WHERE ${where}`,params}
}
