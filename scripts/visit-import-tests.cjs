const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {PGlite}=require('@electric-sql/pglite');
const practical=require('../.visit-test/practical.js');
const facts=JSON.parse(fs.readFileSync('data/visit-practical-2026-10-16.json','utf8'));
const baselines=JSON.parse(fs.readFileSync('data/visit-calendar-baselines-2026-10-16.json','utf8'));
const source=fs.readFileSync('scripts/seed-visit-practical.cjs','utf8').replace('(async()=>{','module.exports=(async()=>{');

async function fixture(ownerEdits){
 const database=new PGlite();
 for(const file of ['001-mvp.sql','009-editorial.sql'])await database.exec(fs.readFileSync('db/'+file,'utf8'));
 for(const [slug,info]of Object.entries(facts)){
  let previous=baselines[slug]||info;
  if(ownerEdits&&slug==='kebun-mawar-situhapa')previous={...previous,familyNote:'Owner has updated this note'};
  if(ownerEdits&&slug==='darajat-pass')previous={...previous,sourceUrl:'https://example.org/new-operator-source'};
  await database.query("INSERT INTO vg_places(slug,name,category,content,status) VALUES($1,$1,'wisata',$2,'published')",[slug,practical.joinPractical('Existing public description: '+slug,previous)]);
 }
 const rows=async()=>(await database.query('SELECT slug,content FROM vg_places ORDER BY slug')).rows;
 const revisions=async()=>Number((await database.query('SELECT count(*) AS count FROM vg_content_revisions')).rows[0].count);
 const run=async({apply=false,upgrade=false,invalid=false}={})=>{
  const module={exports:{}},output=[];
  const process={env:{DATABASE_URL:'isolated-validation'},argv:['node','seed',...(apply?['--apply']:[]),...(upgrade?['--upgrade-calendar']:[])],exitCode:0};
  const invalidFacts=invalid?{...facts,'kebun-mawar-situhapa':{...facts['kebun-mawar-situhapa'],calendar:{...facts['kebun-mawar-situhapa'].calendar,holiday:-1}}}:null;
  const testFs={readFileSync:(file,encoding)=>invalidFacts&&file==='data/visit-practical-2026-10-16.json'?JSON.stringify(invalidFacts):fs.readFileSync(file,encoding)};
  const pool={connect:async()=>({query:(...args)=>database.query(...args),release(){}}),end:async()=>{}};
  vm.runInNewContext(source,{module,process,console:{log:(...args)=>output.push(args),error:(...args)=>output.push(args)},require:name=>name==='pg'?{Pool:function(){return pool}}:name==='node:fs'?testFs:name==='../.visit-test/practical.js'?practical:require(name)});
  await module.exports;
  assert.equal(process.exitCode,invalid?1:0,JSON.stringify(output));
 };
 const before=await rows();
 await run({upgrade:true});assert.deepEqual(await rows(),before);assert.equal(await revisions(),0);
 await run({apply:true});assert.deepEqual(await rows(),before);assert.equal(await revisions(),0);
 await run({apply:true,upgrade:true,invalid:true});assert.deepEqual(await rows(),before);assert.equal(await revisions(),0);
 await run({apply:true,upgrade:true});
 const updated=await rows();
 assert.equal(await revisions(),ownerEdits?1:3);
 for(const row of updated){
  const parsed=practical.splitPractical(row.content);
  assert.equal(parsed.content,'Existing public description: '+row.slug);
  if(ownerEdits&&['kebun-mawar-situhapa','darajat-pass'].includes(row.slug))assert.equal(row.content,before.find(x=>x.slug===row.slug).content);
  else assert.deepEqual(parsed.practical,facts[row.slug]);
 }
 await run({apply:true,upgrade:true});assert.deepEqual(await rows(),updated);assert.equal(await revisions(),ownerEdits?1:3);
 await database.close();
}
(async()=>{await fixture(false);await fixture(true);console.log('PASS practical importer: dry-run/default preservation, opt-in exact-baseline calendar upgrades, owner edits protected, transaction rollback, revision snapshots and idempotent repeat.');})().catch(error=>{console.error(error);process.exitCode=1});
