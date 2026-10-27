// Secrets and hashing for VisitGarut Rating. Pure functions that take the secret as an argument, so they are testable.
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789' // no 0/o/1/l/i to survive being typed from a printed plate

export function randomCode(length = 10) {
  let out = ''
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)]
  return out
}

export function validPlateCode(code: string) {
  return /^[a-hj-km-np-z2-9]{10}$/.test(code)
}

/** Phone numbers are stored only as a keyed hash; the raw number is kept briefly for the WhatsApp invite. */
export function phoneHash(phone: string, secret: string) {
  if (!secret || secret.length < 16) throw new Error('RATING_SECRET minimal 16 karakter')
  return createHmac('sha256', secret).update('phone:' + phone).digest('hex')
}

export function newOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export function otpHash(code: string, checkinId: string, secret: string) {
  return createHmac('sha256', secret).update(`otp:${checkinId}:${code}`).digest('hex')
}

export function sameHash(a: string, b: string) {
  const aa = Buffer.from(a, 'hex')
  const bb = Buffer.from(b, 'hex')
  return aa.length === bb.length && aa.length > 0 && timingSafeEqual(aa, bb)
}

/** Invite links carry a random token; only its SHA-256 is stored. */
export function newInviteToken() {
  return randomBytes(24).toString('base64url')
}

export function inviteHash(token: string) {
  return createHash('sha256').update('invite:' + token).digest('hex')
}

export function validInviteToken(token: string) {
  return /^[A-Za-z0-9_-]{32}$/.test(token)
}

/** Daily rotating key for rate limits, so raw IPs are never stored. */
export function limitKey(scope: string, value: string, secret: string, day = new Date().toISOString().slice(0, 10)) {
  return createHmac('sha256', secret).update(`${scope}:${day}:${value}`).digest('hex').slice(0, 64)
}
