const assert=require('node:assert/strict'),fs=require('node:fs')
const {PGlite}=require('@electric-sql/pglite')
const {buildDirectoryQueries,parseDirectoryPage,directoryPageHref,parseDirectoryFilters,directorySummarySql,directoryPageSize}=require('../.directory-test/search.js')
assert.equal(parseDirectoryPage(undefined),1)
assert.equal(parseDirectoryPage('2'),2)
for(const raw of ['0','-1','1.5','Infinity','1e3','1000001','9999999999999999','',[],['2','3']])assert.equal(parseDirectoryPage(raw),null)
assert.throws(()=>buildDirectoryQueries({},0),RangeError)
const filters={query:'mobil & motor',category:'transportasi',district:'Garut Kota',sort:'latest'}
const u=new URL(directoryPageHref('/search',2,filters),'https://visitgarut.com')
for(const [key,val] of Object.entries({q:filters.query,category:filters.category,district:filters.district,sort:filters.sort,page:'2'}))assert.equal(u.searchParams.get(key),val)
assert.equal(directoryPageHref('/wisata',1),'/wisata')
assert.equal(directoryPageHref('/wisata',2),'/wisata?page=2')
assert(!new URL(directoryPageHref('/search',1,filters),'https://visitgarut.com').searchParams.has('page'))
assert.deepEqual(parseDirectoryFilters({q:['bad'],category:'invalid',district:['bad'],sort:'DROP TABLE'}),{query:'',category:'',district:'',sort:'relevant'})
;(async()=>{
 const pg=new PGlite()
 try{
  await pg.exec(fs.readFileSync('db/001-mvp.sql','utf8'))
  await pg.exec("ALTER TABLE vg_places ADD COLUMN aliases text[] NOT NULL DEFAULT '{}'")
  await pg.exec("INSERT INTO vg_places(id,slug,name,category,district,status,updated_at,aliases) SELECT n,'listing-'||n,'Listing','wisata','Leles','published','2026-10-01',CASE WHEN n<=24 THEN ARRAY['seo'] ELSE ARRAY[]::text[] END FROM generate_series(1,120) n")
  await pg.exec("INSERT INTO vg_places(id,slug,name,category,district,status,updated_at) VALUES(121,'beyond','Z beyond first hundred','wisata','Bayongbong','published','2026-10-01'),(122,'private','Private','wisata','Private district','draft','2026-10-01')")
  const page=async(options,n=1)=>{
   const queries=buildDirectoryQueries(options,n)
   return {total:(await pg.query(queries.count.text,queries.count.values)).rows[0].total,items:(await pg.query(queries.items.text,queries.items.values)).rows}
  }
  const ids=[]
  for(let n=1;n<=Math.ceil(121/directoryPageSize);n++){
   const r=await page({},n);assert.equal(r.total,121);assert(r.items.length<=directoryPageSize);ids.push(...r.items.map(x=>x.id))
  }
  assert.deepEqual(ids,Array.from({length:121},(_,i)=>i+1),'all published rows reachable exactly once despite tied names, beyond the previous 100 limit')
  assert.deepEqual((await page({sort:'latest'},2)).items.map(x=>x.id),Array.from({length:12},(_,i)=>i+13),'stable IDs break timestamp/name ties')
  const selected=await page({query:'seo',category:'wisata',district:'Leles'},2)
  assert.equal(selected.total,24);assert.deepEqual(selected.items.map(x=>x.id),Array.from({length:12},(_,i)=>i+13))
  assert.equal((await page({query:'seo',category:'hotel',district:'Leles'})).total,0)
  assert.equal((await page({query:"' OR 1=1 --"})).total,0)
  assert.equal((await page({},999999)).items.length,0)
  const summary=(await pg.query(directorySummarySql)).rows
  assert.equal(summary.reduce((sum,x)=>sum+x.total,0),121)
  assert(summary.some(x=>x.district==='Bayongbong'),'district beyond first 100 remains selectable')
  assert(!summary.some(x=>x.district==='Private district'))
  await pg.exec("UPDATE vg_places SET status='draft' WHERE id=121")
  assert.equal((await page({})).total,120)
  assert(!(await pg.query(directorySummarySql)).rows.some(x=>x.district==='Bayongbong'))
  console.log('PASS directory pagination: strict page bounds, encoded filter-preserving links, complete totals, 121 unique rows, tied sort stability, combined filters, safe SQL, unpublished exclusion and uncapped district summary')
 }finally{await pg.close()}
})().catch(e=>{console.error(e);process.exitCode=1})
