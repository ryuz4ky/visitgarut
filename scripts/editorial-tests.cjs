const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const {PGlite} = require('@electric-sql/pglite');

(async () => {
  const database = new PGlite();
  for (const file of ['001-mvp.sql', '009-editorial.sql']) await database.exec(fs.readFileSync(`db/${file}`, 'utf8'));
  const query = (sql, args) => database.query(sql, args);
  let authorized = true;
  let invalidations = 0;
  const redirect = location => {throw Object.assign(new Error('redirect'), {location});};
  const practicalCode=ts.transpileModule(fs.readFileSync('lib/visit/practical.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const practicalModule={exports:{}};vm.runInNewContext(practicalCode,{module:practicalModule,exports:practicalModule.exports,URL,Date});
  const dependencies = {
    '@/lib/visit/practical':practicalModule.exports,
    '@/lib/mvp/db': {db: () => ({connect: async () => ({query, release() {}}), query})},
    '@/lib/mvp/auth': {requireAdmin: async () => {if (!authorized) redirect('/admin/login');}},
    'next/navigation': {redirect},
    'next/cache': {revalidatePath: () => {invalidations++;}},
  };
  const module = {exports: {}};
  const source = ts.transpileModule(fs.readFileSync('app/admin/actions.ts', 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(source, {module, exports: module.exports, require: name => {
    if (!(name in dependencies)) throw Error(`Unexpected dependency ${name}`);
    return dependencies[name];
  }, URL, FormData, console: {error() {}}});
  async function save(values, expected = '/admin?saved=1') {
    const form = new FormData();
    for (const [key, value] of Object.entries({kind: 'article', slug: 'test-guide', title: 'Guide', status: 'draft', ...values})) form.set(key, String(value));
    await assert.rejects(module.exports.saveContent(form), error => error.location === expected);
  }
  await save({});
  const id = (await query('SELECT id FROM vg_articles')).rows[0].id;
  await save({id, status: 'published'}, '/admin?error=save');
  assert.equal((await query('SELECT status FROM vg_articles')).rows[0].status, 'draft');
  assert.equal((await query('SELECT * FROM vg_content_revisions')).rows.length, 0);
  const publication = {id, status: 'published', author: 'Editor', author_type: 'Person', reviewed_by: 'Reviewer', source_urls: 'https://example.org/source\nhttps://example.org/source'};
  await save(publication);
  const published = (await query('SELECT * FROM vg_articles')).rows[0];
  assert.equal(published.author_type, 'Person');
  assert.equal(published.source_urls.length, 1);
  assert.ok(published.reviewed_at && published.published_at);
  const revision = (await query('SELECT snapshot FROM vg_content_revisions')).rows[0].snapshot;
  assert.equal(revision.status, 'draft');
  await save({...publication, slug: 'changed-url'}, '/admin?error=save');
  await save({...publication, source_urls: 'javascript:alert(1)'}, '/admin?error=save');
  await save({...publication, image_url: 'https://example.org/photo.jpg'}, '/admin?error=save');
  await save({...publication, source_urls: 'https://user:secret@example.org/'}, '/admin?error=save');
  assert.equal((await query('SELECT * FROM vg_content_revisions')).rows.length, 1);
  assert.equal((await query('SELECT slug FROM vg_articles')).rows[0].slug, 'test-guide');
  await save({...publication, status: 'draft'});
  await save({...publication, slug: 'changed-after-unpublish'}, '/admin?error=save');
  authorized = false;
  await save({...publication, title: 'Unauthorized edit'}, '/admin/login');
  assert.equal((await query('SELECT title FROM vg_articles')).rows[0].title, 'Guide');
  assert.equal(invalidations, 3);
  authorized=true;
  const placeValues={kind:'place',slug:'visit-test',name:'Visit test',category:'wisata',content:'Original public description',status:'draft'};
  await save(placeValues);
  const placeId=(await query("SELECT id FROM vg_places WHERE slug='visit-test'")).rows[0].id;
  const visitValues={...placeValues,id:placeId,visit_source:'https://example.org/operator',visit_publisher:'Operator',visit_checked:'2026-10-01',visit_weekday:'45000',visit_weekend:'60000',visit_priceNote:'Adult price only',visit_extrasNote:'Parking is not included',visit_familyNote:'Children rules need confirmation',visit_accessNote:'Ask the entrance distance',visit_hoursNote:'Confirm date-specific hours'};
  await save(visitValues);
  let raw=(await query('SELECT content FROM vg_places WHERE id=$1',[placeId])).rows[0].content;
  assert.equal(practicalModule.exports.splitPractical(raw).practical.weekend,60000);
  assert.equal(practicalModule.exports.splitPractical(raw).content,'Original public description');
  await save({...visitValues,visit_weekday:'-1'},'/admin?error=save');
  await save({...visitValues,visit_checked:'2099-01-01'},'/admin?error=save');
  await save({...placeValues,id:placeId,content:'Updated public description'});
  raw=(await query('SELECT content FROM vg_places WHERE id=$1',[placeId])).rows[0].content;
  assert.equal(practicalModule.exports.splitPractical(raw).practical.weekday,45000);
  await save({...visitValues,visit_source:''});
  raw=(await query('SELECT content FROM vg_places WHERE id=$1',[placeId])).rows[0].content;
  assert.equal(practicalModule.exports.splitPractical(raw).practical,null);
  await database.close();
  console.log('Editorial actions: practical metadata persistence, preservation/removal, invalid-date/price rollback, publication validation, revision snapshots, rollback, stable URLs and authorization passed');
})().catch(error => {console.error(error); process.exitCode = 1;});
