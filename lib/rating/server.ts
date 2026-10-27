import 'server-only'
import { headers } from 'next/headers'
import { db } from '@/lib/mvp/db'
import { siteUrl } from '@/lib/site'
import { allow } from './store'
import { limitKey } from './tokens'

/** Public rating features stay hidden until RATING_ENABLED=1, so deploying this code changes nothing for visitors. */
export function ratingEnabled() {
  return process.env.RATING_ENABLED === '1'
}

export function ratingSecret() {
  const s = process.env.RATING_SECRET || ''
  if (s.length < 16) throw new Error('RATING_SECRET belum diatur (minimal 16 karakter)')
  return s
}

/** Same-origin check plus a daily per-IP counter keyed by HMAC (raw IPs are never stored). */
export async function allowedRequest(scope: string, max: number) {
  const h = await headers()
  const origin = h.get('origin')
  if (origin && origin !== new URL(siteUrl).origin) return false
  const ip = h.get('x-forwarded-for')?.split(',').at(-1)?.trim() || 'unknown'
  return allow(db(), limitKey(scope, ip, ratingSecret()), max, new Date())
}
