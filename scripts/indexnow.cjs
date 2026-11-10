#!/usr/bin/env node
// Notify IndexNow (Bing, Yandex, Seznam, Naver; shared with several answer engines) about changed URLs.
// Usage: node scripts/indexnow.cjs [--all]  — reads the live sitemap, sends URLs whose lastmod is newer than the last run.
const fs = require('fs')
const path = require('path')
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://visitgarut.com').replace(/\/$/, '')
const KEY = process.env.INDEXNOW_KEY || fs.readdirSync(path.join(__dirname, '..', 'public')).find(f => /^[0-9a-f]{32}\.txt$/.test(f))?.slice(0, 32)
const STATE = path.join(process.env.HOME || '/tmp', '.visitgarut-indexnow-last')
if (!KEY) { console.error('indexnow: no key file in public/'); process.exit(1) }

const locs = xml => [...xml.matchAll(/<(?:url|sitemap)><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/g)].map(m => ({ loc: m[1].replace(/&amp;/g, '&'), lastmod: m[2] ? Date.parse(m[2]) : 0 }))

async function main() {
  const since = process.argv.includes('--all') ? 0 : Number(fs.existsSync(STATE) ? fs.readFileSync(STATE, 'utf8') : 0) || 0
  const index = await (await fetch(`${SITE}/sitemap.xml`)).text()
  const urls = []
  for (const s of locs(index)) urls.push(...locs(await (await fetch(s.loc)).text()).filter(u => !since || !u.lastmod || u.lastmod > since).map(u => u.loc))
  const unique = [...new Set(urls)]
  console.log(`indexnow: ${unique.length} URL(s) to submit`)
  for (let i = 0; i < unique.length; i += 10000) {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: unique.slice(i, i + 10000) }),
    })
    console.log(`indexnow: batch ${i / 10000 + 1} -> HTTP ${res.status}`)
    if (res.status >= 300) process.exitCode = 1
  }
  if (!process.exitCode) fs.writeFileSync(STATE, String(Date.now()))
}
main().catch(e => { console.error('indexnow:', e.message); process.exit(1) })
