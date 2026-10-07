// Refresh reviewed sources in bounded batches before the 29-day API retention limit.
const fs=require('node:fs'),path=require('node:path'),{Client}=require('pg');
const envFile=path.join(process.env.HOME,'visitgarut.env');if(!fs.existsSync(envFile))process.exit(0);
const env={};for(const line of fs.readFileSync(envFile,'utf8').split('\n')){const i=line.indexOf('=');if(i>0&&!line.startsWith('#'))env[line.slice(0,i)]=line.slice(i+1)}
if(!env.YOUTUBE_API_KEY||!env.DATABASE_URL)process.exit(0);
const {reserveYoutubeCall}=require('../.youtube-worker/youtube-pipeline.js');
const client=new Client({connectionString:env.DATABASE_URL,connectionTimeoutMillis:5000,query_timeout:15000});
(async()=>{await client.connect();if(!(await client.query('SELECT pg_try_advisory_lock(78241007) AS locked')).rows[0].locked)return;
 try{
  const rows=(await client.query("SELECT v.id,v.video_id,v.channel_id FROM vg_youtube_videos v JOIN vg_places p ON p.id=v.place_id JOIN vg_youtube_places j ON j.place_id=p.id WHERE v.review_status='approved' AND p.status='published' AND j.enabled AND v.collected_at<now()-interval '6 days' ORDER BY v.collected_at,v.id LIMIT 50")).rows;if(!rows.length)return;
  await reserveYoutubeCall(client,'data');const url=new URL('https://www.googleapis.com/youtube/v3/videos');url.search=new URLSearchParams({part:'snippet,status',id:rows.map(v=>v.video_id).join(','),key:env.YOUTUBE_API_KEY}).toString();const response=await fetch(url,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Source refresh unavailable');const data=await response.json();
  await client.query('BEGIN');
  for(const row of rows){const v=data.items?.find(v=>v.id===row.video_id);
   if(!v||v.status.privacyStatus!=='public'||v.snippet.channelId!==row.channel_id){await client.query("UPDATE vg_youtube_videos SET review_status='pending',reviewed_at=NULL,last_error='youtube_video_unavailable' WHERE id=$1",[row.id]);continue}
   await client.query("UPDATE vg_youtube_videos SET title=$2,description=$3,channel_title=$4,published_at=$5,embeddable=$6,collected_at=now(),expires_at=now()+interval '29 days',comment_refresh_started_at=now(),next_page='',threads_done=false,last_fetched_at=NULL,last_error='' WHERE id=$1",[row.id,v.snippet.title,v.snippet.description,v.snippet.channelTitle,v.snippet.publishedAt,v.status.embeddable===true]);
   await client.query("UPDATE vg_youtube_replies SET next_page='',done=false,last_run_at=NULL,last_error='' WHERE video_id=$1",[row.id]);
  }
  await client.query('COMMIT');console.log('YouTube reviewed source refresh completed: '+rows.length);
 }catch{try{await client.query('ROLLBACK')}catch{}console.error('YouTube reviewed source refresh needs retry')}finally{await client.query('SELECT pg_advisory_unlock(78241007)')}
})().catch(()=>{console.error('YouTube source refresh unavailable');process.exitCode=1}).finally(()=>client.end());
