const assert=require('node:assert/strict'),fs=require('node:fs')
const {PGlite}=require('@electric-sql/pglite')
;(async()=>{
 const db=new PGlite()
 try{
  for(const file of ['001-mvp.sql','003-community-pulse.sql','004-place-research.sql'])await db.exec(fs.readFileSync('db/'+file,'utf8'))
  await db.exec("INSERT INTO vg_places(slug,name,category,status) VALUES('situ-bagendit','Situ Bagendit','wisata','published'),('bale-tingtrim-resto','Bale Tingtrim','kuliner','published'),('curug-sanghyang-taraje','Curug Sanghyang Taraje','wisata','published')")
  const sql=fs.readFileSync('db/010-research-enrichment.sql','utf8')
  await db.exec(sql);await db.exec(sql)
  assert.equal((await db.query('SELECT count(*)::int n FROM vg_place_research')).rows[0].n,11)
  assert.equal((await db.query('SELECT count(*)::int n FROM vg_social_mentions')).rows[0].n,0)
  await db.exec("DELETE FROM vg_place_research;UPDATE vg_places SET status='draft' WHERE slug='bale-tingtrim-resto'")
  await db.exec(sql)
  assert.equal((await db.query('SELECT count(*)::int n FROM vg_place_research')).rows[0].n,6)
  console.log('PASS research enrichment: idempotent source/topic upsert, published-place scope and no invented visitor records')
 }finally{await db.close()}
})().catch(error=>{console.error(error);process.exitCode=1})
