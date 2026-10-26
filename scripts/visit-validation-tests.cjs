const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const { PGlite } = require('@electric-sql/pglite')
const { NextRequest, NextResponse } = require('next/server')
const core = require('../.visit-validation-test/validation.js')
const store = require('../.visit-validation-test/validation-store.js')
const id = '11111111-1111-4111-8111-111111111111'
const second = '22222222-2222-4222-8222-222222222222'
const third = '33333333-3333-4333-8333-333333333333'
const input = { session: id, stages: ['opened', 'selected', 'budget_viewed'] }
function load(file, dependencies, extras = {}) {
  const module = { exports: {} }
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
  vm.runInNewContext(source, { module, exports: module.exports, require: name => {
    if (!(name in dependencies)) throw Error(`Unexpected dependency ${name}`)
    return dependencies[name]
  }, Date, URL, Buffer, Uint8Array, console: { error() {} }, ...extras })
  return module.exports
}
(async () => {
  const random = require('node:crypto').randomBytes(16)
  const original = Buffer.from(random)
  assert.ok(core.validEvaluationSession(core.evaluationSessionFromBytes(random)))
  assert.deepEqual(random, original)
  assert.throws(() => core.evaluationSessionFromBytes(new Uint8Array(15)))
  assert.deepEqual(core.parseValidationRecord(input), input)
  assert.equal(core.parseValidationRecord({ ...input, date: '2026-10-17' }), null)
  assert.equal(core.parseValidationRecord({ ...input, stages: ['opened', 'unknown'] }), null)
  assert.equal(core.parseValidationRecord({ ...input, stages: ['opened', 'share_copied'] }), null)
  assert.equal(core.parseValidationRecord({ ...input, stages: Array(12).fill('opened') }), null)
  assert.equal(core.parseValidationRecord({ ...input, feedback: { helpfulness: 'yes', barrier: 'costs', message: 'private' } }), null)
  assert.equal(core.parseValidationRecord({ ...input, session: 'not-a-uuid' }), null)
  assert.equal(core.parseValidationRecord({ ...input, feedback: { helpfulness: 'yes' } }), null)
  assert.equal(core.parseValidationRecord({ ...input, feedback: { helpfulness: 'yes', barrier: '__proto__' } }), null)
  assert.deepEqual(core.parseValidationRecord({ ...input, stages: ['opened', 'selected', 'selected'] }).stages, ['opened', 'selected'])
  assert.equal(core.parseValidationWithdrawal({ session: id }), id)
  assert.equal(core.parseValidationWithdrawal({ session: id, url: 'private' }), null)
  const database = new PGlite()
  await database.exec(fs.readFileSync('db/012-trip-validation.sql', 'utf8'))
  await database.exec(fs.readFileSync('db/012-trip-validation.sql', 'utf8'))
  const query = (sql, values) => database.query(sql, values)
  const client = { query }
  const key = 'a'.repeat(64); const reset = new Date(Date.now() + 86400000)
  assert.equal(await store.recordEvaluation(client, input, key, reset), 'saved')
  assert.equal(await store.recordEvaluation(client, input, key, reset), 'saved')
  assert.equal((await query('SELECT count(*)::int n FROM vg_trip_validation')).rows[0].n, 1)
  await store.recordEvaluation(client, { session: id, stages: ['opened', 'selected', 'share_copied'], feedback: { helpfulness: 'partly', barrier: 'transport' } }, key, reset)
  await store.recordEvaluation(client, input, key, reset)
  let row = (await query('SELECT * FROM vg_trip_validation WHERE session=$1', [id])).rows[0]
  assert.equal(row.helpfulness, 'partly'); assert.equal(row.barrier, 'transport')
  assert.deepEqual(new Set(row.stages), new Set([...input.stages, 'share_copied']))
  assert.equal(await store.withdrawEvaluation(client, id, key, reset), true)
  assert.equal(await store.recordEvaluation(client, input, key, reset), 'withdrawn')
  row = (await query('SELECT * FROM vg_trip_validation WHERE session=$1', [id])).rows[0]
  assert.equal(row.withdrawn, true); assert.equal(row.helpfulness, null); assert.deepEqual(row.stages, [])
  // A withdrawal arriving before a delayed first write also prevents resurrection.
  await store.withdrawEvaluation(client, second, key, reset)
  assert.equal(await store.recordEvaluation(client, { ...input, session: second }, key, reset), 'withdrawn')
  const broken = { query: async (sql, args) => { if (sql.startsWith('INSERT INTO vg_trip_validation(session')) throw Error('write failed'); return query(sql, args) } }
  const before = (await query('SELECT requests FROM vg_trip_validation_limits WHERE key=$1', [key])).rows[0].requests
  await assert.rejects(store.recordEvaluation(broken, { ...input, session: third }, key, reset))
  assert.equal((await query('SELECT requests FROM vg_trip_validation_limits WHERE key=$1', [key])).rows[0].requests, before)
  await query('UPDATE vg_trip_validation_limits SET requests=200 WHERE key=$1', [key])
  assert.equal(await store.recordEvaluation(client, { ...input, session: third }, key, reset), 'limited')
  assert.equal(await store.withdrawEvaluation(client, third, key, reset), true)
  await query('UPDATE vg_trip_validation_limits SET requests=400 WHERE key=$1', [key])
  assert.equal(await store.withdrawEvaluation(client, third, key, reset), false)
  await query("UPDATE vg_trip_validation SET created_at=now()-interval '31 days' WHERE session=$1", [id])
  await store.recordEvaluation(client, { session: third, stages: ['opened'] }, 'b'.repeat(64), reset)
  assert.equal((await query('SELECT session FROM vg_trip_validation WHERE session=$1', [id])).rows.length, 0)
  await assert.rejects(query("INSERT INTO vg_trip_validation(session,stages) VALUES($1,ARRAY['opened','private'])", [id]))
  await assert.rejects(query("INSERT INTO vg_trip_validation(session,stages,helpfulness) VALUES($1,ARRAY['opened'],'yes')", [id]))
  await query('TRUNCATE vg_trip_validation,vg_trip_validation_limits')
  let connections = 0; let released = 0
  const endpoint = load('app/api/trip-validation/route.ts', {
    'node:crypto': require('node:crypto'), 'next/server': { NextRequest, NextResponse },
    '@/lib/mvp/db': { db: () => ({ connect: async () => { connections++; return { query, release() { released++ } } } }) },
    '@/lib/site': { siteUrl: 'https://visitgarut.com' }, '@/lib/visit/validation': core, '@/lib/visit/validation-store': store,
  }, { process: { env: { SESSION_SECRET: 'isolated-test-secret', DATABASE_URL: 'test' } } })
  const request = (body, options = {}) => new NextRequest('https://visitgarut.com/api/trip-validation', { method: options.method || 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://visitgarut.com', 'x-forwarded-for': '198.51.100.7', ...options.headers }, body: typeof body === 'string' ? body : JSON.stringify(body) })
  assert.equal((await endpoint.POST(request(input, { headers: { Origin: 'https://other.example' } }))).status, 403)
  assert.equal((await endpoint.POST(request(input, { headers: { Origin: '' } }))).status, 403)
  assert.equal((await endpoint.POST(request(input, { headers: { 'sec-fetch-site': 'cross-site' } }))).status, 403)
  assert.equal((await endpoint.POST(request({ ...input, budget: '1000000' }))).status, 400)
  assert.equal((await endpoint.POST(request('x'.repeat(2049)))).status, 400)
  assert.equal((await endpoint.POST(request('{'))).status, 400)
  assert.equal(connections, 0)
  const response = await endpoint.POST(request(input))
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.deepEqual(await response.json(), { ok: true })
  assert.equal((await endpoint.POST(request({ ...input, feedback: { helpfulness: 'no', barrier: 'access' } }))).status, 200)
  assert.equal((await endpoint.DELETE(request({ session: id }, { method: 'DELETE' }))).status, 200)
  assert.equal((await endpoint.POST(request(input))).status, 410)
  assert.equal(connections, released)
  const limitRow = (await query('SELECT key FROM vg_trip_validation_limits')).rows[0]
  assert.match(limitRow.key, /^[a-f0-9]{64}$/); assert.ok(!limitRow.key.includes('198.51.100'))
  const active = { ...input, session: second, feedback: { helpfulness: 'yes', barrier: 'none' } }
  await endpoint.POST(request(active)); await endpoint.POST(request(active))
  let authorized = false; let reportQueries = 0
  const report = load('app/admin/trip-validation/page.tsx', {
    'react/jsx-runtime': require('react/jsx-runtime'),
    'next/link': { default: props => require('react').createElement('a', props, props.children) },
    '@/components/mvp/AdminShell': { default: props => props.children },
    '@/lib/mvp/auth': { requireAdmin: async () => { if (!authorized) throw Error('admin required') } },
    '@/lib/mvp/db': { db: () => ({ query: (sql, args) => { reportQueries++; return query(sql, args) } }) },
    '@/lib/visit/validation': core,
  })
  await assert.rejects(report.default(), /admin required/); assert.equal(reportQueries, 0)
  authorized = true
  const markup = require('react-dom/server').renderToStaticMarkup(await report.default())
  assert.ok(markup.includes('Apakah planner membantu?')); assert.ok(!markup.includes('Belum ada kunjungan yang ikut'))
  assert.equal((await query('SELECT count(*)::int n FROM vg_trip_validation WHERE NOT withdrawn')).rows[0].n, 1)
  assert.equal((await query("SELECT unnest(stages) stage,count(*)::int n FROM vg_trip_validation WHERE NOT withdrawn GROUP BY stage")).rows.find(row => row.stage === 'selected').n, 1)
  await query("UPDATE vg_trip_validation SET withdrawn=true,stages='{}',helpfulness=NULL,barrier=NULL")
  const empty = require('react-dom/server').renderToStaticMarkup(await report.default())
  assert.ok(empty.includes('Belum ada kunjungan yang ikut evaluasi'))
  await database.close()
  console.log('PASS voluntary trip evaluation: strict payloads, private fields rejected, SQL idempotency/rollback, withdrawal tombstones, expiry, rate limits, API origin/body guards, admin authorization and cohort counts')
})().catch(error => { console.error(error); process.exitCode = 1 })
