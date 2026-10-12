'use server'
import { db } from '@/lib/mvp/db'
import { type Evidence, type Topic } from './core'
import {
 archivePageSql,archiveCountSql,archiveSelectedSql,ARCHIVE_PAGE_SIZE,
 encodeArchiveCursor,validateArchiveFilters,type ArchiveFilters,
} from './archive-query'

export type ArchivePageResponse={
 items: Evidence[]
 nextCursor: string|null
 total: number|null
}
/** Only PUBLIC read access. Accepts only validated filters, a selected record ID and an opaque cursor. */
export async function fetchPublicEvidencePage(input:{
 placeId:number;filters:ArchiveFilters;cursor:string|null;youtubeConsent:boolean;selectedId?:number
}):Promise<ArchivePageResponse>{
 if(!input || typeof input!=='object' || typeof input.youtubeConsent!=='boolean') throw new Error('Permintaan tidak valid.')
 const {placeId,filters,cursor,youtubeConsent}=input
 if(cursor!==null && typeof cursor!=='string') throw new Error('Cursor tidak valid.')
 validateArchiveFilters(filters)
 if(!Number.isSafeInteger(placeId)||placeId<1) throw new Error('Lokasi tidak valid.')
 const client=db()
 const published=await client.query("SELECT 1 FROM vg_places WHERE id=$1 AND status='published' LIMIT 1",[placeId])
 if(!published.rowCount) throw new Error('Lokasi tidak tersedia.')
 // Sensitive topics are available only through the existing moderated
 // public aggregate. Raw archive queries cannot bypass publication thresholds.
 if(filters.topic==='keamanan'||filters.topic==='tiket') throw new Error('Gunakan bukti topik yang sudah ditinjau.')
 if(filters.topic!==null){
  const check=await client.query(`SELECT EXISTS(
   SELECT 1 FROM vg_social_mentions m JOIN vg_mention_topics t ON t.mention_id=m.id
   WHERE m.place_id=$1 AND t.topic=$2 AND m.status='approved' AND m.reviewed_at IS NOT NULL
   AND m.published_at>=now()-interval '90 days'
   AND (m.is_sensitive OR m.original_text ~* $3)
  ) AS sensitive`,[placeId,filters.topic,String.raw`\y(preman|calo|pungli|pemerasan|penipuan|pelecehan|kecelakaan|kriminal|scam|extortion|harassment|fraud|ilegal)\y`])
  if(check.rows[0]?.sensitive) throw new Error('Topik memerlukan pemeriksaan publikasi khusus.')
 }
 const allowedYoutube=youtubeConsent&&!!process.env.YOUTUBE_DERIVED_METRICS_APPROVAL_REFERENCE
 const query=archivePageSql(placeId,filters,allowedYoutube,cursor)
 const [{rows},count]=await Promise.all([
  client.query(query.sql,query.params),
  cursor===null?client.query(archiveCountSql(placeId,filters,allowedYoutube).sql,archiveCountSql(placeId,filters,allowedYoutube).params):Promise.resolve(null),
 ])
 const hasMore=rows.length>ARCHIVE_PAGE_SIZE
 const page=rows.slice(0,ARCHIVE_PAGE_SIZE)
 const last=page.at(-1)
 // Revalidate a selected comment against the same current publication gates.
 // Never pin stale SSR evidence after withdrawal or expiry.
 if(cursor===null && Number.isSafeInteger(input.selectedId) && (input.selectedId ?? 0)>0){
  const selectedQuery=archiveSelectedSql(placeId,filters,allowedYoutube,input.selectedId!)
  const selected=await client.query(selectedQuery.sql,selectedQuery.params)
  if(selected.rows[0]){const index=page.findIndex(row=>row.id===input.selectedId);if(index>=0)page.splice(index,1);page.unshift(selected.rows[0])}
 }
 return {
  items:page.map(row=>({
   id:row.id,platform:row.platform,original_text:row.original_text,
   display_name:row.display_name,source_url:row.source_url,
   published_at:new Date(row.published_at).toISOString(),
   experience_date:row.experience_date,
   sentiment:row.sentiment,engagement_count:row.engagement_count,
   topics:row.topics||[],ratings:row.platform==='visitgarut'?(row.ratings||[]):[],
  })) as Evidence[],
  nextCursor:hasMore&&last?encodeArchiveCursor({
   time:new Date(last.published_at).toISOString(),id:last.id,engagement:last.engagement_count,
  }):null,
  total:count?Number(count.rows[0]?.total||0):null,
 }
}
