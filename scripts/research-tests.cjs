const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {PGlite}=require('@electric-sql/pglite');
const {buildResearchSQL}=require('./seed-research.cjs');
(async()=>{
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/researched-places-2026-10-07.json'))),pg=new PGlite();
 for(const name of ['001-mvp.sql','002-seed.sql','003-community-pulse.sql','004-place-research.sql'])await pg.exec(fs.readFileSync(path.join(__dirname,'../db',name),'utf8'));
 assert.equal(data.new_places.length,20);assert.equal(new Set(data.new_places.map(p=>p.slug)).size,20);
 for(const place of [...data.new_places,...data.existing_place_research])for(const note of place.research){const u=new URL(note.source_url);assert.equal(u.protocol,'https:');assert.ok(note.publisher&&note.summary.length>=20);assert.ok(!note.source_published_at||Date.parse(note.source_published_at)<=Date.parse(data.researched_at))}
 const before=(await pg.query('SELECT count(*)::int AS n FROM vg_places')).rows[0].n;
 await pg.exec(buildResearchSQL(data));
 assert.equal((await pg.query('SELECT count(*)::int AS n FROM vg_places')).rows[0].n,before+20);
 assert.equal((await pg.query('SELECT count(*)::int AS n FROM vg_place_research')).rows[0].n,52);
 assert.equal((await pg.query('SELECT count(*)::int AS n FROM vg_social_mentions')).rows[0].n,0);
 console.log('PASS 20 new places and 52 research notes; zero fabricated guest experiences');
 const id=(await pg.query('SELECT id FROM vg_place_research LIMIT 1')).rows[0].id;
 await pg.query("UPDATE vg_place_research SET title='Owner edited',status='withdrawn' WHERE id=$1",[id]);
 await pg.exec(buildResearchSQL(data));
 assert.equal((await pg.query('SELECT count(*)::int AS n FROM vg_place_research')).rows[0].n,52);
 assert.equal((await pg.query('SELECT title,status FROM vg_place_research WHERE id=$1',[id])).rows[0].title,'Owner edited');
 assert.equal((await pg.query("SELECT count(*)::int AS n FROM vg_place_research WHERE status='approved'")).rows[0].n,51);
 console.log('PASS repeat import preserves owner edits and withdrawn notes');
 const place=(await pg.query('SELECT place_id FROM vg_place_research WHERE id=$1',[id])).rows[0].place_id;
 await pg.query('DELETE FROM vg_places WHERE id=$1',[place]);
 assert.equal((await pg.query('SELECT count(*)::int AS n FROM vg_place_research WHERE place_id=$1',[place])).rows[0].n,0);
 console.log('PASS deleting a place cascades research cleanup');
 await pg.close();
})().catch(e=>{console.error(e);process.exitCode=1});
