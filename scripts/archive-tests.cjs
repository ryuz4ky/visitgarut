const assert=require('node:assert/strict')
const { PGlite }=require('@electric-sql/pglite')
const {
 archivePageSql,archiveCountSql,encodeArchiveCursor,decodeArchiveCursor,
 validateArchiveFilters,ARCHIVE_PAGE_SIZE,
}=require('../.archive-test/archive-query.js')
const defaults={topic:null,platform:'',sentiment:'',sort:'newest'}
let pass=0
function check(name,fn){fn();pass++;console.log('PASS '+name)}
check('Cursor encode/decode is strictly validated',()=>{
 const t={time:'2026-10-09T00:00:00.000Z',id:55,engagement:4}
 assert.deepEqual(decodeArchiveCursor(encodeArchiveCursor(t)),t)
 for(const v of ['/', 'bad',encodeArchiveCursor({time:'not-a-date',id:0,engagement:-1})])
  assert.throws(()=>decodeArchiveCursor(v),/Cursor/)
})
check('No free-form SQL injection via enum filters',()=>{
 assert.throws(()=>validateArchiveFilters({...defaults,platform:"x'; DROP TABLE vg_social_mentions; --"}))
 assert.throws(()=>validateArchiveFilters({...defaults,sort:'anything'}))
 assert.throws(()=>archivePageSql(0,defaults,false,null))
})
check('New page uses stable keyset rather than LIMIT/OFFSET',()=>{
 const q=archivePageSql(7,defaults,false,encodeArchiveCursor({
  time:'2026-10-09T00:00:00.000Z',id:12,engagement:2}))
 assert.match(q.sql,/\(m.published_at,m.id\)</)
 assert.match(q.sql,/ORDER BY m.published_at DESC,m.id DESC LIMIT/)
 assert.doesNotMatch(q.sql,/OFFSET/i)
 assert.equal(q.params.at(-1),ARCHIVE_PAGE_SIZE+1)
 const count=archiveCountSql(7,defaults,false)
 assert.ok(count.sql.includes('count(*)'))
})

async function main(){
 const pg=new PGlite()
 try{
  await pg.exec(`CREATE TABLE vg_social_mentions(
   id integer primary key,place_id integer,status text,reviewed_at timestamptz,
   published_at timestamptz,expires_at timestamptz,experience_date date,
   platform text,rights_basis text,is_sensitive boolean,original_text text,
   display_name text,source_url text,sentiment text,engagement_count integer);
   CREATE TABLE vg_mention_topics(mention_id integer,topic text,sentiment text);
   CREATE TABLE vg_mention_ratings(mention_id integer,dimension text,rating integer);`)
  await pg.exec(`INSERT INTO vg_social_mentions
    (id,place_id,status,reviewed_at,published_at,expires_at,experience_date,
     platform,rights_basis,is_sensitive,original_text,display_name,source_url,sentiment,engagement_count)
    SELECT s,7,'approved',now()-interval '2 minutes',
      now()-s*interval '1 minute',NULL,NULL,
      CASE WHEN s%5=0 THEN 'instagram' ELSE 'tiktok' END,
      'first_party',false,'Pemandangan dan akses Garut sangat bagus hari ini',
      'Sample '||s,'https://visitgarut.com/', 'positive', s%7
    FROM generate_series(1,55) s;
    INSERT INTO vg_mention_topics SELECT id,'pemandangan','positive' FROM vg_social_mentions;
    INSERT INTO vg_mention_topics SELECT id,'akses','negative' FROM vg_social_mentions WHERE id%2=0;
    UPDATE vg_social_mentions SET reviewed_at=NULL WHERE id=3;
    UPDATE vg_social_mentions SET status='pending' WHERE id=4;
    UPDATE vg_social_mentions SET is_sensitive=true WHERE id=5;
    UPDATE vg_social_mentions SET original_text='Preman meminta uang tambahan' WHERE id=6;
    INSERT INTO vg_mention_topics VALUES(7,'keamanan','negative');
    UPDATE vg_social_mentions SET rights_basis='youtube_api',platform='youtube' WHERE id=8;
    UPDATE vg_social_mentions SET place_id=77 WHERE id=9;
    UPDATE vg_social_mentions SET expires_at=now()-interval '1 day' WHERE id=10;`)
  const c=archiveCountSql(7,defaults,false)
  const total=(await pg.query(c.sql,c.params)).rows[0].total
  assert.equal(total,47)
  console.log('PASS PostgreSQL eligibility excludes unpublished, unreviewed, sensitive and unconsented rows');pass++
  let cursor=null,seen=[]
  for(let i=0;i<5;i++){
   const q=archivePageSql(7,defaults,false,cursor)
   const result=(await pg.query(q.sql,q.params)).rows
   const rows=result.slice(0,ARCHIVE_PAGE_SIZE)
   seen.push(...rows.map(x=>x.id))
   cursor=result.length>ARCHIVE_PAGE_SIZE?encodeArchiveCursor({
    time:new Date(rows.at(-1).published_at).toISOString(),
    id:rows.at(-1).id,engagement:rows.at(-1).engagement_count,
   }):null
   if(!cursor)break
  }
  assert.equal(seen.length,47)
  assert.equal(new Set(seen).size,47)
  assert.equal(cursor,null)
  console.log('PASS PostgreSQL keyset walks all 47 visible records without duplicates');pass++
  const first=archivePageSql(7,{...defaults,topic:'akses',sentiment:'negative'},false,null)
  const data=(await pg.query(first.sql,first.params)).rows
  assert.ok(data.every(row=>row.id%2===0 && row.topics.some(t=>t.topic==='akses')))
  console.log('PASS topic-specific negative filter and lateral JSON topics');pass++
  const positive=archivePageSql(7,{...defaults,platform:'instagram',sort:'engagement'},false,null)
  const filtered=(await pg.query(positive.sql,positive.params)).rows
  assert.ok(filtered.every(r=>r.platform==='instagram'))
  assert.ok(filtered.every((r,i)=>!i||filtered[i-1].engagement_count>=r.engagement_count))
  console.log('PASS PostgreSQL platform + engagement ordering');pass++
  const yt=archiveCountSql(7,defaults,true)
  assert.equal((await pg.query(yt.sql,yt.params)).rows[0].total,48)
  console.log('PASS YouTube data appears only with explicit approved consent boolean');pass++
  console.log(pass+' PostgreSQL evidence pagination checks passed')
 }finally{await pg.close()}
}
main().catch(error=>{console.error(error);process.exitCode=1})
