const fs=require('node:fs'),path=require('node:path'),{Client}=require('pg');
const envFile=path.join(process.env.HOME,'visitgarut.env');const env={};
for(const line of fs.readFileSync(envFile,'utf8').split('\n')){const i=line.indexOf('=');if(i>0&&!line.startsWith('#'))env[line.slice(0,i)]=line.slice(i+1)}
const client=new Client({connectionString:env.DATABASE_URL,connectionTimeoutMillis:5000,query_timeout:30000});
(async()=>{await client.connect();await client.query('BEGIN');for(const file of ['003-community-pulse.sql','004-place-research.sql','005-youtube-collection.sql','006-pulse-activation.sql'])await client.query(fs.readFileSync(path.join(__dirname,'../db',file),'utf8'));await client.query('COMMIT');console.log('Community Pulse schema ready')})().catch(async()=>{try{await client.query('ROLLBACK')}catch{}console.error('Community Pulse migration failed');process.exitCode=1}).finally(()=>client.end());
