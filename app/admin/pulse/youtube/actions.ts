'use server'
import { createHash } from 'node:crypto'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/mvp/auth'
import { db } from '@/lib/mvp/db'
import { fetchYoutubeVideo } from '@/lib/pulse/youtube'
import { locationQueries } from '@/lib/pulse/youtube-collection'
import { sensitivePattern } from '@/lib/pulse/core'
const hash=(s:string)=>createHash('sha256').update(s).digest('hex')
export async function collectionControl(f:FormData){
 await requireAdmin();const place=Number(f.get('place_id'));const mode=String(f.get('mode'));if(!Number.isSafeInteger(place)||place<=0)redirect('/admin/pulse/youtube?error=save')
 const p=(await db().query("SELECT name,aliases FROM vg_places WHERE id=$1 AND status='published'",[place])).rows[0]
 if(!p||!['resume','pause','restart'].includes(mode))redirect('/admin/pulse/youtube?error=save')
 if(mode==='pause')await db().query('UPDATE vg_youtube_places SET enabled=false,updated_at=now() WHERE place_id=$1',[place])
 else await db().query(`INSERT INTO vg_youtube_places(place_id,queries) VALUES($1,$2::jsonb) ON CONFLICT(place_id) DO UPDATE SET enabled=true,last_error='',queries=CASE WHEN $3 THEN EXCLUDED.queries ELSE vg_youtube_places.queries END,query_index=CASE WHEN $3 THEN 0 ELSE vg_youtube_places.query_index END,next_page=CASE WHEN $3 THEN '' ELSE vg_youtube_places.next_page END,search_done=CASE WHEN $3 THEN false ELSE vg_youtube_places.search_done END,next_task=CASE WHEN $3 THEN 'search' ELSE vg_youtube_places.next_task END,completed_at=CASE WHEN $3 THEN NULL ELSE vg_youtube_places.completed_at END,updated_at=now()`,[place,JSON.stringify(locationQueries(p.name,p.aliases)),mode==='restart'])
 revalidatePath('/admin/pulse/youtube');redirect('/admin/pulse/youtube?place='+place+'&saved=1')
}
export async function reviewCollectedVideo(f:FormData){
 await requireAdmin();const id=Number(f.get('video_id'));const status=String(f.get('status'));if(!Number.isSafeInteger(id)||id<=0||!['approved','rejected','pending'].includes(status))redirect('/admin/pulse/youtube?error=save')
 if(status==='approved'&&!String(f.get('relevance_note')||'').trim())redirect('/admin/pulse/youtube?error=save')
 if(status==='approved'){
  const source=(await db().query('SELECT video_id FROM vg_youtube_videos WHERE id=$1 AND expires_at>now()',[id])).rows[0];if(!source)redirect('/admin/pulse/youtube?error=save')
  let meta;try{meta=await fetchYoutubeVideo(source.video_id)}catch{redirect('/admin/pulse/youtube?error=save')}
  await db().query("UPDATE vg_youtube_videos SET title=$2,description=$3,channel_id=$4,channel_title=$5,published_at=$6,embeddable=$7,collected_at=now(),expires_at=now()+interval '29 days' WHERE id=$1",[id,meta.title,meta.description,meta.channelId,meta.creator,meta.publishedAt,meta.embeddable])
 }
 const r=await db().query("UPDATE vg_youtube_videos SET review_status=$2,reviewed_at=CASE WHEN $2::varchar='approved' THEN now() ELSE NULL END,relevance_note=$3 WHERE id=$1 AND expires_at>now() RETURNING place_id",[id,status,String(f.get('relevance_note')||'').trim().slice(0,1000)]);if(!r.rowCount)redirect('/admin/pulse/youtube?error=save')
 revalidatePath('/','layout');redirect('/admin/pulse/youtube?place='+r.rows[0].place_id+'&saved=1')
}
export async function stageCollectedComment(f:FormData){
 await requireAdmin();let client;let mentionId:number|undefined
 try{
  const row=(await db().query(`SELECT c.*,v.place_id,v.video_id AS youtube_id,v.expires_at AS video_expiry,p.name AS place_name FROM vg_youtube_comments c JOIN vg_youtube_videos v ON v.id=c.video_id JOIN vg_places p ON p.id=v.place_id WHERE c.id=$1 AND c.expires_at>now() AND v.expires_at>now() AND v.review_status='approved' AND c.parent_key IS NULL`,[Number(f.get('comment_id'))])).rows[0]
  if(!row||Array.from(row.original_text).length<20||Array.from(row.original_text).length>4000)throw Error('Invalid sample')
  client=await db().connect();await client.query('BEGIN')
  const source='https://www.youtube.com/watch?v='+row.youtube_id
  const c=(await client.query(`INSERT INTO vg_social_contents(place_id,platform,source_url,source_post_id,title,status,reviewed_at) VALUES($1,'youtube',$2,$3,$4,'approved',now()) ON CONFLICT(place_id,source_url) DO UPDATE SET source_post_id=EXCLUDED.source_post_id RETURNING id,status`,[row.place_id,source,row.youtube_id,'Video YouTube tentang '+row.place_name])).rows[0]
  if(c.status!=='approved')throw Error('Source not approved')
  const r=await client.query(`INSERT INTO vg_social_mentions(place_id,content_id,platform,source_url,source_key,display_name,original_text,independence_key,fingerprint,published_at,rights_basis,analysis_allowed,expires_at,is_sensitive,engagement_count) VALUES($1,$2,'youtube',$3,$4,$5,$6,$7,$8,$9,'youtube_api',false,$10,$11,$12) ON CONFLICT(place_id,platform,source_key) DO NOTHING RETURNING id`,[row.place_id,c.id,source+'&lc='+encodeURIComponent(row.source_key),row.source_key,Array.from(row.author_name).slice(0,120).join(''),row.original_text,row.author_channel_id?hash('youtube:'+row.author_channel_id):null,hash('youtube:'+row.source_key),row.published_at,new Date(Math.min(new Date(row.expires_at).getTime(),new Date(row.video_expiry).getTime())),sensitivePattern.test(row.original_text),row.likes])
  mentionId=r.rows[0]?.id||(await client.query("SELECT id FROM vg_social_mentions WHERE place_id=$1 AND platform='youtube' AND source_key=$2",[row.place_id,row.source_key])).rows[0]?.id
  await client.query('COMMIT')
 }catch{if(client)await client.query('ROLLBACK')}finally{client?.release()}
 if(!mentionId)redirect('/admin/pulse/youtube?error=stage')
 revalidatePath('/admin/pulse');redirect('/admin/pulse?edit='+mentionId)
}

export async function reviewOriginalComment(f:FormData){
 await requireAdmin();const id=String(f.get('comment_id')||''),state=String(f.get('public_status')),note=String(f.get('moderation_note')||'').trim().slice(0,1000)
 if(!/^\d+$/.test(id)||!['pending','approved','rejected','withdrawn'].includes(state)||(state==='approved'&&(!note||f.get('context_checked')!=='yes')))redirect('/admin/pulse/youtube?error=save')
 const row=(await db().query(`SELECT c.id,c.parent_key,v.place_id,v.review_status,v.id AS video_row FROM vg_youtube_comments c JOIN vg_youtube_videos v ON v.id=c.video_id WHERE c.id=$1 AND c.expires_at>now() AND v.expires_at>now()`,[id])).rows[0]
 if(!row||state==='approved'&&(row.review_status!=='approved'||row.parent_key&&!(await db().query("SELECT 1 FROM vg_youtube_comments WHERE video_id=$1 AND source_key=$2 AND public_status='approved' AND expires_at>now()",[row.video_row,row.parent_key])).rowCount))redirect('/admin/pulse/youtube?error=save')
 await db().query("UPDATE vg_youtube_comments SET public_status=$2,reviewed_at=CASE WHEN $2::varchar='approved' THEN now() ELSE NULL END,moderation_note=$3 WHERE id=$1",[id,state,note])
 revalidatePath('/','layout');redirect('/admin/pulse/youtube?place='+row.place_id+'&video='+row.video_row+'&saved=1#sampel-komentar')
}
