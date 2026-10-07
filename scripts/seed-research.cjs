const fs=require('node:fs'),path=require('node:path');
function buildResearchSQL(data){
 const encoded=Buffer.from(JSON.stringify(data),'utf8').toString('base64');
 return `BEGIN;
 CREATE TEMP TABLE vg_research_import(payload jsonb) ON COMMIT DROP;
 INSERT INTO vg_research_import VALUES(convert_from(decode('${encoded}','base64'),'UTF8')::jsonb);
 INSERT INTO vg_places(slug,name,category,district,address,excerpt,content,source_url,website,whatsapp,aliases,status)
 SELECT x.slug,x.name,x.category,x.district,x.address,x.excerpt,x.content,x.source_url,x.website,x.whatsapp,x.aliases,'published'
 FROM vg_research_import r CROSS JOIN LATERAL jsonb_to_recordset(r.payload->'new_places') AS x(slug text,name text,category text,district text,address text,excerpt text,content text,source_url text,website text,whatsapp text,aliases text[])
 ON CONFLICT(slug) DO NOTHING;
 INSERT INTO vg_place_research(place_id,topic,title,summary,source_url,publisher,source_kind,source_published_at,checked_at,limitations,status)
 SELECT p.id,n.topic,n.title,n.summary,n.source_url,n.publisher,n.source_kind,n.source_published_at,n.checked_at,n.limitations,'approved'
 FROM vg_research_import r CROSS JOIN LATERAL jsonb_array_elements((r.payload->'new_places')||(r.payload->'existing_place_research')) item
 JOIN vg_places p ON p.slug=item->>'slug'
 CROSS JOIN LATERAL jsonb_to_recordset(item->'research') AS n(topic text,title text,summary text,source_url text,publisher text,source_kind text,source_published_at date,checked_at timestamptz,limitations text)
 ON CONFLICT(place_id,source_url,topic) DO NOTHING;
 INSERT INTO vg_social_contents(place_id,platform,source_url,source_post_id,title,creator,status,reviewed_at)
 SELECT p.id,c.platform,c.source_url,c.source_post_id,c.title,c.creator,'approved',now()
 FROM vg_research_import r CROSS JOIN LATERAL jsonb_to_recordset(r.payload->'social_contents') AS c(slug text,platform text,source_url text,source_post_id text,title text,creator text)
 JOIN vg_places p ON p.slug=c.slug ON CONFLICT(place_id,source_url) DO NOTHING;
 COMMIT;`;
}
module.exports={buildResearchSQL};
if(require.main===module){
 (async()=>{if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL required');const {Client}=require('pg');const client=new Client({connectionString:process.env.DATABASE_URL});await client.connect();try{await client.query(fs.readFileSync(path.join(__dirname,'../db/004-place-research.sql'),'utf8'));const source=process.argv[2]?path.resolve(process.argv[2]):path.join(__dirname,'../data/researched-places-2026-10-07.json');await client.query(buildResearchSQL(JSON.parse(fs.readFileSync(source,'utf8'))));console.log('Research imported; existing entries preserved.')}finally{await client.end()}})().catch(e=>{console.error(e.message);process.exitCode=1});
}
