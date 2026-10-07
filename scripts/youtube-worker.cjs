const fs=require('node:fs'),path=require('node:path');
const envFile=path.join(process.env.HOME,'visitgarut.env');if(!fs.existsSync(envFile))process.exit(0);
const env={};for(const l of fs.readFileSync(envFile,'utf8').split('\n')){const i=l.indexOf('=');if(i>0&&!l.startsWith('#'))env[l.slice(0,i)]=l.slice(i+1)}
if(!env.YOUTUBE_API_KEY)process.exit(0);
const {locationQueries}=require('../.youtube-worker/youtube-collection.js');
const {Client}=require('pg'),{runYoutubeWorker}=require('../.youtube-worker/youtube-pipeline.js');
const client=new Client({connectionString:env.DATABASE_URL,connectionTimeoutMillis:5000,statement_timeout:10000});
(async()=>{await client.connect();const places=(await client.query("SELECT id,name,aliases FROM vg_places WHERE status='published'")).rows;for(const p of places)await client.query('INSERT INTO vg_youtube_places(place_id,queries) VALUES($1,$2::jsonb) ON CONFLICT DO NOTHING',[p.id,JSON.stringify(locationQueries(p.name,p.aliases))]);await runYoutubeWorker(client,env.YOUTUBE_API_KEY)})().catch(()=>{console.error('YouTube collection could not complete this run');process.exitCode=1}).finally(()=>client.end());
