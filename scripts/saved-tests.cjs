const assert=require('node:assert/strict'),fs=require('node:fs')
const {normalizeSavedIds,readSavedSnapshot,parseSelectedIds,maxSavedPlaces}=require('../.saved-test/saved.js')
assert.deepEqual(normalizeSavedIds([3,1,3,0,-1,'2',NaN,2147483648]),[3,1])
assert.equal(normalizeSavedIds(Array.from({length:500},(_,i)=>i+1)).length,maxSavedPlaces)
assert.deepEqual(readSavedSnapshot('{bad'),[])
assert.deepEqual(readSavedSnapshot(JSON.stringify({version:2,ids:[1]})),[])
assert.deepEqual(readSavedSnapshot(JSON.stringify({version:1,ids:[8,1,8]})),[8,1])
assert.deepEqual(parseSelectedIds('8,1,8'),[8,1])
for(const raw of ['-1','1;DROP TABLE vg_places','1,abc','2147483648','1,,2',Array.from({length:101},()=>1).join(',')])assert.equal(parseSelectedIds(raw),null)
const api=fs.readFileSync('app/api/saved-places/route.ts','utf8')
assert.match(api,/status='published'/);assert.match(api,/id=ANY\(\$1::int\[\]\)/);assert.match(api,/private, no-store/)
assert.doesNotMatch(api,/SELECT \*/)
console.log('PASS saved places: versioning, malformed storage, limits, order/dedup, strict query IDs and public-only parameterized lookup')

const {PGlite}=require('@electric-sql/pglite')
;(async()=>{const db=new PGlite();try{
 await db.exec(fs.readFileSync('db/001-mvp.sql','utf8'))
 await db.exec("INSERT INTO vg_places(id,slug,name,category,status) VALUES(1,'one','One','wisata','published'),(2,'private','Private','wisata','draft'),(3,'three','Three','kuliner','published'),(1001,'far-id','Far ID','wisata','published')")
 const sql=api.match(/query<Place>\("([^"]+)"/)[1]
 const rows=(await db.query(sql,[[2,3,1,999]])).rows
 assert.deepEqual(rows.map(p=>p.id),[3,1]);assert(!rows.some(p=>p.name==='Private'))
 const selectionSql=fs.readFileSync('lib/mvp/data.ts','utf8').match(/selectedTripPlacesSql="([^"]+)"/)[1]
 const selected=(await db.query(selectionSql,[[1001,2]])).rows;assert.deepEqual(selected.map(p=>p.id),[1001])
 console.log('PASS saved lookup: PostgreSQL excludes private/unknown records and preserves selected order')
}finally{await db.close()}})().catch(e=>{console.error(e);process.exitCode=1})
