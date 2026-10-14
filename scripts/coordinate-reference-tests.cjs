const assert=require('node:assert/strict'),fs=require('node:fs')
const {PGlite}=require('@electric-sql/pglite')
const {publicCoordinateReference}=require('../.nearby-test/coordinate-reference.js')
const ref={latitude:-7.2,longitude:107.8,source_url:'https://example.org/location',publisher:'Operator',checked_at:'2026-10-14',note:'Area reference'}
const p={latitude:-7.2,longitude:107.8,coordinate_reference:ref}
assert.deepEqual(publicCoordinateReference(p),ref)
assert.equal(publicCoordinateReference({...p,latitude:-7.21}),null)
assert.equal(publicCoordinateReference({...p,coordinate_reference:{...ref,source_url:'javascript:alert(1)'}}),null)
assert.equal(publicCoordinateReference({...p,coordinate_reference:{...ref,source_url:'https://user:pass@example.org'}}),null)
assert.equal(publicCoordinateReference({...p,coordinate_reference:{...ref,checked_at:'invalid'}}),null)
assert.equal(publicCoordinateReference({...p,coordinate_reference:null}),null)
;(async()=>{const db=new PGlite();try{
 await db.exec(fs.readFileSync('db/001-mvp.sql','utf8'))
 const slugs=['candi-cangkuang','darajat-pass','bale-tingtrim-resto','kampung-sampireun','favehotel-cimanuk-garut','hotel-santika-premiere-garut']
 for(const slug of slugs)await db.query("INSERT INTO vg_places(slug,name,category,status) VALUES($1,$1,'wisata','published')",[slug])
 const sql=fs.readFileSync('db/011-coordinate-references.sql','utf8')
 await db.exec(sql);const first=(await db.query('SELECT slug,latitude,longitude,coordinate_reference,updated_at FROM vg_places ORDER BY slug')).rows
 assert.equal(first.filter(publicCoordinateReference).length,6)
 await db.exec(sql);assert.deepEqual((await db.query('SELECT slug,latitude,longitude,coordinate_reference,updated_at FROM vg_places ORDER BY slug')).rows,first)
 await db.exec("UPDATE vg_places SET latitude=1,longitude=2 WHERE slug='candi-cangkuang'")
 await db.exec(sql);const edited=(await db.query("SELECT * FROM vg_places WHERE slug='candi-cangkuang'")).rows[0]
 assert.equal(edited.latitude,1);assert.equal(publicCoordinateReference(edited),null)
 await db.exec("UPDATE vg_places SET latitude=NULL,longitude=NULL WHERE slug='candi-cangkuang'")
 await db.exec(sql);assert.equal((await db.query("SELECT latitude FROM vg_places WHERE slug='candi-cangkuang'")).rows[0].latitude,null)
 await db.exec("UPDATE vg_places SET latitude=NULL,longitude=NULL,status='draft' WHERE slug='darajat-pass'")
 await db.exec(sql);assert.equal((await db.query("SELECT latitude FROM vg_places WHERE slug='darajat-pass'")).rows[0].latitude,null)
 console.log('PASS coordinate references: safe URLs, matching current point, idempotent migration, no overwritten pins, and published-only scope')
}finally{await db.close()}})().catch(e=>{console.error(e);process.exitCode=1})
