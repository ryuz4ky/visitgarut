import { createHmac } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/mvp/db'
import { siteUrl } from '@/lib/site'
import { parseValidationRecord, parseValidationWithdrawal } from '@/lib/visit/validation'
import { recordEvaluation, withdrawEvaluation } from '@/lib/visit/validation-store'
export const runtime = 'nodejs'
const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' }
function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  return !!origin && [new URL(siteUrl).origin, request.nextUrl.origin].includes(origin) && request.headers.get('sec-fetch-site') !== 'cross-site'
}
function requestLimit(request: NextRequest) {
  const day = new Date().toISOString().slice(0, 10)
  const ip = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown').split(',')[0].trim().slice(0, 100)
  return {
    key: createHmac('sha256', process.env.SESSION_SECRET!).update(day + '|' + ip).digest('hex'),
    resetsAt: new Date(Date.parse(day + 'T00:00:00Z') + 86400000),
  }
}
async function limitedJson(request: NextRequest): Promise<unknown> {
  if (!request.headers.get('content-type')?.startsWith('application/json') || Number(request.headers.get('content-length')) > 2048) throw Error('body')
  const reader = request.body?.getReader()
  if (!reader) throw Error('body')
  const chunks: Uint8Array[] = []; let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break
      length += value.byteLength
      if (length > 2048) { await reader.cancel(); throw Error('body') }
      chunks.push(value)
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } finally { reader.releaseLock() }
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'origin' }, { status: 403, headers })
  let data
  try { data = parseValidationRecord(await limitedJson(request)) } catch { /* Invalid or oversized body. */ }
  if (!data) return NextResponse.json({ error: 'input' }, { status: 400, headers })
  if (!process.env.SESSION_SECRET || !process.env.DATABASE_URL) return NextResponse.json({ error: 'unavailable' }, { status: 503, headers })
  let client
  try {
    const limit = requestLimit(request)
    client = await db().connect()
    const result = await recordEvaluation(client, data, limit.key, limit.resetsAt)
    return NextResponse.json({ ok: result === 'saved' }, { status: result === 'limited' ? 429 : result === 'withdrawn' ? 410 : 200, headers })
  } catch { console.error('Trip evaluation unavailable'); return NextResponse.json({ error: 'unavailable' }, { status: 503, headers }) }
  finally { client?.release() }
}
export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'origin' }, { status: 403, headers })
  let session
  try { session = parseValidationWithdrawal(await limitedJson(request)) } catch { /* Invalid body. */ }
  if (!session) return NextResponse.json({ error: 'input' }, { status: 400, headers })
  if (!process.env.SESSION_SECRET || !process.env.DATABASE_URL) return NextResponse.json({ error: 'unavailable' }, { status: 503, headers })
  let client
  try {
    const limit = requestLimit(request)
    client = await db().connect(); const ok = await withdrawEvaluation(client, session, limit.key, limit.resetsAt)
    return NextResponse.json({ ok }, { status: ok ? 200 : 429, headers })
  } catch { return NextResponse.json({ error: 'unavailable' }, { status: 503, headers }) }
  finally { client?.release() }
}
