// Cron entry: node scripts/rating-worker.cjs   (every 15–30 minutes). Reads ~/visitgarut.env like the other workers.
const fs = require('node:fs'), path = require('node:path'), { Client } = require('pg')
const envFile = path.join(process.env.HOME, 'visitgarut.env')
for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) { const i = line.indexOf('='); if (i > 0 && !line.startsWith('#') && !(line.slice(0, i) in process.env)) process.env[line.slice(0, i)] = line.slice(i + 1) }
if (process.env.RATING_ENABLED !== '1') { console.log('Rating disabled; nothing to do'); process.exit(0) }
const { runRatingWorker } = require('../.rating-worker/worker.js')
const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000, query_timeout: 30000 })
;(async () => {
  await client.connect()
  const result = await runRatingWorker(client, process.env.NEXT_PUBLIC_SITE_URL || 'https://visitgarut.com')
  console.log(`Rating worker: ${result.sent} invites sent, ${result.failed} failed`)
})().catch(error => { console.error('Rating worker failed', error && error.message); process.exitCode = 1 }).finally(() => client.end())
