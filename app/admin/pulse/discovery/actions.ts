'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/mvp/db'
import { requireAdmin } from '@/lib/mvp/auth'
import { discoverPublicSources } from '@/lib/pulse/discovery'
import { normalizeSocialUrl, type Platform } from '@/lib/pulse/core'

async function reserveRun(placeId:number){
 const key=`discovery:${placeId}:${new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'})}`
 const row=(await db().query(`INSERT INTO vg_pulse_limits(key,attempts,resets_at) VALUES($1,1,now()+interval '1 day') ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN vg_pulse_limits.resets_at<now() THEN 1 ELSE vg_pulse_limits.attempts+1 END,resets_at=CASE WHEN vg_pulse_limits.resets_at<now() THEN now()+interval '1 day' ELSE vg_pulse_limits.resets_at END RETURNING attempts`,[key])).rows[0]
 return Number(row.attempts)<=5
}

export async function runDiscovery(formData:FormData){
 await requireAdmin();const placeId=Number(formData.get('place_id'))
 const place=(await db().query("SELECT id,name,aliases FROM vg_places WHERE id=$1 AND status='published'",[placeId])).rows[0]
 if(!place)redirect('/admin/pulse/discovery?error=place')
 if(!await reserveRun(placeId))redirect(`/admin/pulse/discovery?place=${placeId}&error=limit`)
 let result
 try{result=await discoverPublicSources(place.name,place.aliases||[])}catch{redirect(`/admin/pulse/discovery?place=${placeId}&error=search`)}
 let inserted=0
 for(const c of result.candidates){
  const r=await db().query(`INSERT INTO vg_discovery_sources(place_id,platform,source_url,source_key,source_title,source_snippet,search_query,search_provider,relevance_score) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(place_id,source_url) DO UPDATE SET source_title=EXCLUDED.source_title,source_snippet=EXCLUDED.source_snippet,search_query=EXCLUDED.search_query,relevance_score=GREATEST(vg_discovery_sources.relevance_score,EXCLUDED.relevance_score),discovered_at=now() WHERE vg_discovery_sources.status='pending' RETURNING id`,[placeId,c.platform,c.url,c.sourceKey,c.title,c.snippet,c.query,c.provider,c.relevanceScore])
  if(r.rowCount)inserted++
 }
 revalidatePath('/admin/pulse/discovery')
 const errors=result.errors.length?`&warnings=${encodeURIComponent(result.errors.join(','))}`:''
 redirect(`/admin/pulse/discovery?place=${placeId}&found=${inserted}${errors}`)
}

export async function reviewDiscovery(formData:FormData){
 await requireAdmin();const id=Number(formData.get('id')),decision=String(formData.get('decision')||'')
 const row=(await db().query(`SELECT d.*,p.name AS place_name FROM vg_discovery_sources d JOIN vg_places p ON p.id=d.place_id WHERE d.id=$1`,[id])).rows[0]
 if(!row)redirect('/admin/pulse/discovery?error=missing')
 if(decision==='reject'){
  await db().query("UPDATE vg_discovery_sources SET status='rejected',reviewed_at=now() WHERE id=$1",[id])
 }else if(decision==='approve'){
  const platform=row.platform as Platform;let normalized
  try{normalized=normalizeSocialUrl(row.source_url,platform)}catch{redirect(`/admin/pulse/discovery?place=${row.place_id}&error=url`)}
  const title=(row.source_title||`${row.place_name} di ${platform}`).slice(0,200)
  const content=(await db().query(`INSERT INTO vg_social_contents(place_id,platform,source_url,source_post_id,title,creator,status,reviewed_at) VALUES($1,$2,$3,$4,$5,'','approved',now()) ON CONFLICT(place_id,source_url) DO UPDATE SET title=EXCLUDED.title,status='approved',reviewed_at=now() RETURNING id`,[row.place_id,platform,normalized.url,normalized.id,title])).rows[0]
  await db().query("UPDATE vg_discovery_sources SET status='approved',content_id=$2,reviewed_at=now() WHERE id=$1",[id,content.id])
 }else redirect(`/admin/pulse/discovery?place=${row.place_id}&error=decision`)
 revalidatePath('/admin/pulse/discovery');revalidatePath('/admin/pulse');revalidatePath('/','layout')
 redirect(`/admin/pulse/discovery?place=${row.place_id}&saved=1`)
}
