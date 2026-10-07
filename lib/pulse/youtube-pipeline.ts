import type { PoolClient } from 'pg'
import { YoutubeImportError } from './youtube-core'
import { YoutubeCollectionApi,type CollectionApi,type RawComment,type SearchQuery } from './youtube-collection'
export async function reserveYoutubeCall(client:PoolClient,bucket:'search'|'data',now=new Date()){
 const day=now.toLocaleDateString('en-CA',{timeZone:'America/Los_Angeles'}),limit=bucket==='search'?80:3000
 const r=await client.query(`INSERT INTO vg_youtube_usage(quota_day,bucket,calls) VALUES($1,$2,1) ON CONFLICT(quota_day,bucket) DO UPDATE SET calls=vg_youtube_usage.calls+1 WHERE vg_youtube_usage.calls<$3 RETURNING calls`,[day,bucket,limit])
 if(!r.rowCount)throw new YoutubeImportError('youtube_daily_budget')
}
async function storeComments(client:PoolClient,videoId:number,comments:RawComment[]){
 if(!comments.length)return
 await client.query(`INSERT INTO vg_youtube_comments(video_id,source_key,parent_key,author_name,author_channel_id,original_text,published_at,likes) SELECT $1,x.id,x."parentId",x.author,x."authorId",x.text,x."publishedAt"::timestamptz,x.likes FROM jsonb_to_recordset($2::jsonb) AS x(id text,"parentId" text,author text,"authorId" text,text text,"publishedAt" text,likes int) ON CONFLICT(video_id,source_key) DO UPDATE SET parent_key=EXCLUDED.parent_key,author_name=EXCLUDED.author_name,author_channel_id=EXCLUDED.author_channel_id,original_text=EXCLUDED.original_text,published_at=EXCLUDED.published_at,likes=EXCLUDED.likes,collected_at=now(),expires_at=now()+interval '29 days'`,[videoId,JSON.stringify(comments)])
}
export async function collectYoutubeStep(client:PoolClient,api:CollectionApi,placeId?:number){
 const budget=(await client.query("SELECT bucket,calls FROM vg_youtube_usage WHERE quota_day=(now() AT TIME ZONE 'America/Los_Angeles')::date")).rows
 const searchAvailable=!budget.some(r=>r.bucket==='search'&&r.calls>=80),dataAvailable=!budget.some(r=>r.bucket==='data'&&r.calls>=3000)
 if(!dataAvailable&&!searchAvailable)return null
 const j=(await client.query(`SELECT j.* FROM vg_youtube_places j JOIN vg_places p ON p.id=j.place_id WHERE j.enabled AND p.status='published' AND ($1::int IS NULL OR j.place_id=$1) AND (j.last_error IN ('','youtube_daily_budget') OR j.last_run_at<now()-interval '30 minutes') AND (($2 AND (NOT j.search_done OR j.completed_at<now()-interval '7 days')) OR ($3 AND (EXISTS(SELECT 1 FROM vg_youtube_videos v WHERE v.place_id=j.place_id AND v.review_status<>'rejected' AND NOT v.threads_done AND v.expires_at>now()) OR EXISTS(SELECT 1 FROM vg_youtube_replies r JOIN vg_youtube_videos v ON v.id=r.video_id WHERE v.place_id=j.place_id AND v.review_status<>'rejected' AND v.expires_at>now() AND NOT r.done)))) ORDER BY j.last_run_at NULLS FIRST,j.place_id LIMIT 1`,[placeId||null,searchAvailable,dataAvailable])).rows[0]
 if(!j)return null
 if(j.search_done&&j.completed_at&&new Date(j.completed_at).getTime()<Date.now()-7*86400000){await client.query("UPDATE vg_youtube_places SET query_index=0,next_page='',search_done=false,next_task='search',completed_at=NULL WHERE place_id=$1",[j.place_id]);j.query_index=0;j.next_page='';j.search_done=false;j.next_task='search'}
 const v=(await client.query(`SELECT * FROM vg_youtube_videos WHERE place_id=$1 AND review_status<>'rejected' AND NOT threads_done AND expires_at>now() ORDER BY last_fetched_at NULLS FIRST,id LIMIT 1`,[j.place_id])).rows[0]
 const reply=(await client.query(`SELECT r.*,v.video_id AS youtube_id FROM vg_youtube_replies r JOIN vg_youtube_videos v ON v.id=r.video_id WHERE v.place_id=$1 AND v.review_status<>'rejected' AND v.expires_at>now() AND NOT r.done ORDER BY r.last_run_at NULLS FIRST,r.video_id,r.parent_key LIMIT 1`,[j.place_id])).rows[0]
 const queries=j.queries as SearchQuery[];const search=searchAvailable&&!j.search_done&&(j.next_task==='search'||!dataAvailable||(!v&&!reply))
 let task='idle'
 try{
  if(search){
   task='search';const q=queries[j.query_index];if(!q)throw new YoutubeImportError('youtube_content')
   const page=await api.search(q,j.next_page);if(page.next&&page.next===j.next_page)throw new YoutubeImportError('youtube_connection')
   await client.query('BEGIN')
   for(const video of page.items){const existing=(await client.query('SELECT id,collected_at FROM vg_youtube_videos WHERE place_id=$1 AND video_id=$2',[j.place_id,video.id])).rows[0];await client.query(`INSERT INTO vg_youtube_videos(place_id,video_id,title,description,channel_id,channel_title,published_at,search_query) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(place_id,video_id) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,channel_id=EXCLUDED.channel_id,channel_title=EXCLUDED.channel_title,published_at=EXCLUDED.published_at,search_query=EXCLUDED.search_query,collected_at=now(),expires_at=now()+interval '29 days'`,[j.place_id,video.id,video.title,video.description,video.channelId,video.channelTitle,video.publishedAt,q.q]);if(existing&&new Date(existing.collected_at).getTime()<Date.now()-6*86400000){await client.query("UPDATE vg_youtube_videos SET next_page='',threads_done=false,last_error='' WHERE id=$1",[existing.id]);await client.query("UPDATE vg_youtube_replies SET next_page='',done=false,last_error='' WHERE video_id=$1",[existing.id])}}
   const index=page.next?j.query_index:j.query_index+1,done=index>=queries.length
   await client.query(`UPDATE vg_youtube_places SET query_index=$2,next_page=$3,search_done=$4,next_task='comments',last_error='',last_run_at=now(),updated_at=now(),completed_at=CASE WHEN $4 THEN now() ELSE NULL END WHERE place_id=$1`,[j.place_id,index,page.next,done]);await client.query('COMMIT')
   return {placeId:j.place_id,task,videos:page.items.length}
  }
  const fetchReplies=reply&&(!v||j.next_comment_kind==='replies')
  if(fetchReplies){
   task='replies';const page=await api.replies(reply.parent_key,reply.next_page);if(page.next&&page.next===reply.next_page)throw new YoutubeImportError('youtube_connection')
   await client.query('BEGIN');await storeComments(client,reply.video_id,page.items)
   await client.query('UPDATE vg_youtube_replies SET next_page=$3,done=$4,last_run_at=now(),last_error=\'\' WHERE video_id=$1 AND parent_key=$2',[reply.video_id,reply.parent_key,page.next,!page.next]);await client.query("UPDATE vg_youtube_places SET next_task='search',next_comment_kind='threads',last_run_at=now(),last_error='',updated_at=now() WHERE place_id=$1",[j.place_id]);await client.query('COMMIT');return {placeId:j.place_id,task,comments:page.items.length}
  }
  if(v){
   task='threads';const page=await api.threads(v.video_id,v.next_page);if(page.next&&page.next===v.next_page)throw new YoutubeImportError('youtube_connection')
   await client.query('BEGIN');await storeComments(client,v.id,page.items.map(t=>t.comment))
   for(const t of page.items)if(t.replyCount>0)await client.query('INSERT INTO vg_youtube_replies(video_id,parent_key) VALUES($1,$2) ON CONFLICT DO NOTHING',[v.id,t.comment.id])
   await client.query("UPDATE vg_youtube_videos SET next_page=$2,threads_done=$3,last_fetched_at=now(),last_error='' WHERE id=$1",[v.id,page.next,!page.next]);await client.query("UPDATE vg_youtube_places SET next_task='search',next_comment_kind='replies',last_run_at=now(),last_error='',updated_at=now() WHERE place_id=$1",[j.place_id]);await client.query('COMMIT');return {placeId:j.place_id,task,comments:page.items.length}
  }
  await client.query("UPDATE vg_youtube_places SET last_run_at=now(),last_error='',updated_at=now() WHERE place_id=$1",[j.place_id]);return {placeId:j.place_id,task}
 }catch(error){await client.query('ROLLBACK');const code=error instanceof YoutubeImportError?error.code:'youtube_storage';if(task==='threads'&&v&&['youtube_comments_disabled','youtube_video_unavailable'].includes(code))await client.query('UPDATE vg_youtube_videos SET threads_done=true,last_error=$2,last_fetched_at=now() WHERE id=$1',[v.id,code]);if(task==='replies'&&reply&&['youtube_video_unavailable','youtube_comments_disabled'].includes(code))await client.query('UPDATE vg_youtube_replies SET done=true,last_error=$3,last_run_at=now() WHERE video_id=$1 AND parent_key=$2',[reply.video_id,reply.parent_key,code]);await client.query("UPDATE vg_youtube_places SET last_run_at=now(),last_error=$2,next_task=CASE WHEN $3='search' THEN 'comments' ELSE 'search' END,updated_at=now() WHERE place_id=$1",[j.place_id,['youtube_comments_disabled','youtube_video_unavailable'].includes(code)?'':code,task]);return {placeId:j.place_id,task,error:code}}
}
export async function runYoutubeWorker(client:PoolClient,key:string,options:{placeId?:number;maxSteps?:number;maxMs?:number;api?:CollectionApi}={}){
 const lock=(await client.query('SELECT pg_try_advisory_lock(78241007) AS locked')).rows[0].locked;if(!lock)return []
 const results=[];const start=Date.now();const api=options.api||new YoutubeCollectionApi(key,bucket=>reserveYoutubeCall(client,bucket))
 try{for(let i=0;i<(options.maxSteps||8)&&Date.now()-start<(options.maxMs||35000);i++){const step=await collectYoutubeStep(client,api,options.placeId);if(!step)break;results.push(step);if(step.error==='youtube_daily_budget'||step.error==='youtube_quota')break}}finally{await client.query('SELECT pg_advisory_unlock(78241007)')}
 return results
}
