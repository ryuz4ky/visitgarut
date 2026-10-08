'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/mvp/db'
import { requireAdmin } from '@/lib/mvp/auth'
import { discoverPublicSources } from '@/lib/pulse/discovery'
import { normalizeSocialUrl, type Platform } from '@/lib/pulse/core'

const AUTO_INGEST_SCORE=70

async function reserveRun(placeId:number){
 const key=`discovery:${placeId}:${new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'})}`
 const row=(await db().query(`INSERT INTO vg_pulse_limits(key,attempts,resets_at) VALUES($1,1,now()+interval '1 day') ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN vg_pulse_limits.resets_at<now() THEN 1 ELSE vg_pulse_limits.attempts+1 END,resets_at=CASE WHEN vg_pulse_limits.resets_at<now() THEN now()+interval '1 day' ELSE vg_pulse_limits.resets_at END RETURNING attempts`,[key])).rows[0]
 return Number(row.attempts)<=5
}

async function autoIngest(placeId:number,placeName:string,c:{platform:string;url:string;title:string;sourceKey:string;snippet:string;query:string;provider:string;relevanceScore:number}){
 const platform=c.platform as Platform
 const normalized=normalizeSocialUrl(c.url,platform)
 const title=(c.title||`${placeName} di ${platform}`).slice(0,200)
 const client=await db().connect()
 try{
  await client.query('BEGIN')
  const content=(await client.query(`INSERT INTO vg_social_contents(place_id,platform,source_url,source_post_id,title,creator,status,reviewed_at) VALUES($1,$2,$3,$4,$5,'','approved',now()) ON CONFLICT(place_id,source_url) DO UPDATE SET title=EXCLUDED.title,status='approved',reviewed_at=now() RETURNING id`,[placeId,platform,normalized.url,normalized.id,title])).rows[0]
  await client.query(`INSERT INTO vg_discovery_sources(place_id,platform,source_url,source_key,source_title,source_snippet,search_query,search_provider,relevance_score,status,content_id,reviewed_at) VALUES($1,$2,$3,$4,$5,'',$6,$7,$8,'approved',$9,now()) ON CONFLICT(place_id,source_url) DO UPDATE SET source_title=EXCLUDED.source_title,source_snippet='',search_query=EXCLUDED.search_query,search_provider=EXCLUDED.search_provider,relevance_score=GREATEST(vg_discovery_sources.relevance_score,EXCLUDED.relevance_score),status='approved',content_id=EXCLUDED.content_id,reviewed_at=now(),discovered_at=now()`,[placeId,platform,normalized.url,c.sourceKey,title,c.query,c.provider,c.relevanceScore,content.id])
  await client.query('COMMIT')
  return true
 }catch(error){
  await client.query('ROLLBACK')
  throw error
 }finally{client.release()}
}

export async function runDiscovery(formData:FormData){
 await requireAdmin();const placeId=Number(formData.get('place_id'))
 const place=(await db().query("SELECT id,name,aliases FROM vg_places WHERE id=$1 AND status='published'",[placeId])).rows[0]
 if(!place)redirect('/admin/pulse/discovery?error=place')
 if(!await reserveRun(placeId))redirect(`/admin/pulse/discovery?place=${placeId}&error=limit`)
 let result
 try{result=await discoverPublicSources(place.name,place.aliases||[])}catch{redirect(`/admin/pulse/discovery?place=${placeId}&error=search`)}
 let ingested=0,skipped=0
 for(const c of result.candidates){
  if(c.relevanceScore<AUTO_INGEST_SCORE){skipped++;continue}
  try{if(await autoIngest(placeId,place.name,c))ingested++}catch{skipped++}
 }
 revalidatePath('/admin/pulse/discovery');revalidatePath('/admin/pulse');revalidatePath('/','layout')
 const errors=result.errors.length?`&warnings=${encodeURIComponent(result.errors.join(','))}`:''
 redirect(`/admin/pulse/discovery?place=${placeId}&ingested=${ingested}&skipped=${skipped}${errors}`)
}

export async function reviewDiscovery(formData:FormData){
 await requireAdmin();const id=Number(formData.get('id')),decision=String(formData.get('decision')||'')
 const row=(await db().query(`SELECT d.*,p.name AS place_name FROM vg_discovery_sources d JOIN vg_places p ON p.id=d.place_id WHERE d.id=$1`,[id])).rows[0]
 if(!row)redirect('/admin/pulse/discovery?error=missing')
 if(decision==='reject'){
  const client=await db().connect()
  try{
   await client.query('BEGIN')
   if(row.content_id)await client.query("UPDATE vg_social_contents SET status='rejected',reviewed_at=now() WHERE id=$1",[row.content_id])
   await client.query("UPDATE vg_discovery_sources SET status='rejected',source_snippet='',reviewed_at=now() WHERE id=$1",[id])
   await client.query('COMMIT')
  }catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
 }else redirect(`/admin/pulse/discovery?place=${row.place_id}&error=decision`)
 revalidatePath('/admin/pulse/discovery');revalidatePath('/admin/pulse');revalidatePath('/','layout')
 redirect(`/admin/pulse/discovery?place=${row.place_id}&saved=1`)
}
