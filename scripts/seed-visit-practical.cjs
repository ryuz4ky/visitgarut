// Explicit import into existing content storage. Default is a read-only dry run.
const {Pool}=require('pg');const fs=require('node:fs');const {joinPractical,splitPractical,validatePractical}=require('../.visit-test/practical.js');
(async()=>{
 if(!process.env.DATABASE_URL)throw Error('DATABASE_URL is required')
 const facts=JSON.parse(fs.readFileSync('data/visit-practical-2026-10-16.json','utf8'))
 const upgrading=process.argv.includes('--upgrade-calendar')
 const baselines=upgrading?JSON.parse(fs.readFileSync('data/visit-calendar-baselines-2026-10-16.json','utf8')):{}
 const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1});const client=await pool.connect()
 try{
  await client.query('BEGIN');const applied=[]
  for(const [slug,raw]of Object.entries(facts)){
   const info=validatePractical(raw);if(!info)throw Error('Invalid facts for '+slug)
   const row=(await client.query('SELECT * FROM vg_places WHERE slug=$1 FOR UPDATE',[slug])).rows[0]
   if(!row){console.log('SKIP missing place: '+slug);continue}
   const previous=splitPractical(row.content).practical
   if(upgrading){
    const baseline=validatePractical(baselines[slug])
    const upgrade=baseline&&!baseline.calendar&&info.calendar&&JSON.stringify(previous)===JSON.stringify(baseline)&&Object.keys(baseline).every(key=>key==='priceNote'||JSON.stringify(info[key])===JSON.stringify(baseline[key]))
    if(!upgrade){console.log('KEEP unmatched/already updated calendar: '+slug);continue}
    console.log('UPGRADE matched calendar: '+slug)
   }else if(previous&&previous.checkedAt>=info.checkedAt){console.log('KEEP existing/newer facts: '+slug);continue}
   if(process.argv.includes('--apply')){
    await client.query("INSERT INTO vg_content_revisions(kind,content_id,snapshot) VALUES('place',$1,$2)",[row.id,JSON.stringify(row)])
    await client.query('UPDATE vg_places SET content=$1,updated_at=now() WHERE id=$2',[joinPractical(row.content,info),row.id])
   }
   applied.push(slug)
  }
  await client.query(process.argv.includes('--apply')?'COMMIT':'ROLLBACK')
  console.log(process.argv.includes('--apply')?'Imported:':'Would import:',applied)
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release();await pool.end()}
})().catch(e=>{console.error(e.message);process.exitCode=1})
