'use server'
import { headers } from 'next/headers'
import { db } from '@/lib/mvp/db'
import { normalizePhone } from '@/lib/rating/core'
import { allow } from '@/lib/rating/store'
import { limitKey } from '@/lib/rating/tokens'
import { siteUrl } from '@/lib/site'

export type OwnerState = { ok: boolean; message: string }
const str = (f: FormData, k: string, max: number) => String(f.get(k) || '').replace(/\r/g, '').trim().slice(0, max)

function cleanUrl(input: string) {
  if (!input) return ''
  try {
    const u = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`)
    if (!/^https?:$/.test(u.protocol) || u.username || u.password || !u.hostname.includes('.')) return null
    return u.toString()
  } catch { return null }
}

/** Same-origin check and a daily per-network counter. Raw IPs are never stored. */
async function allowed() {
  const h = await headers()
  const origin = h.get('origin')
  if (origin && origin !== new URL(siteUrl).origin) return false
  const secret = process.env.RATING_SECRET || process.env.SESSION_SECRET || ''
  if (secret.length < 16) return true
  const ip = h.get('x-forwarded-for')?.split(',').at(-1)?.trim() || 'unknown'
  return allow(db(), limitKey('owner-update', ip, secret), 5, new Date())
}

/** Stores an owner's submission for review. Nothing changes on the public page until an admin accepts it. */
export async function submitOwnerUpdate(_prev: OwnerState, f: FormData): Promise<OwnerState> {
  if (str(f, 'company', 100)) return { ok: true, message: 'Terima kasih.' } // honeypot
  const placeId = Number(f.get('place_id'))
  const relation = str(f, 'relation', 20), name = str(f, 'contact_name', 80)
  const phone = normalizePhone(str(f, 'contact_phone', 30))
  const publicRaw = str(f, 'public_whatsapp', 30)
  const publicWa = publicRaw ? normalizePhone(publicRaw) : ''
  const website = cleanUrl(str(f, 'website', 300))
  const address = str(f, 'address', 300), hours = str(f, 'hours', 300), price = str(f, 'price_note', 300), description = str(f, 'description', 1200)
  if (!Number.isInteger(placeId) || placeId < 1) return { ok: false, message: 'Tempat tidak dikenali. Muat ulang halaman ini.' }
  if (!['pemilik', 'pengelola', 'staf'].includes(relation)) return { ok: false, message: 'Pilih hubungan Anda dengan tempat ini.' }
  if (name.length < 2) return { ok: false, message: 'Isi nama Anda.' }
  if (!phone) return { ok: false, message: 'Nomor WhatsApp Anda harus nomor Indonesia, misalnya 0812…' }
  if (publicWa === null) return { ok: false, message: 'Nomor WhatsApp untuk pengunjung harus nomor Indonesia, misalnya 0812…' }
  if (website === null) return { ok: false, message: 'Alamat situs atau media sosial tidak valid.' }
  if (!publicWa && !website && !address && !hours && !price && !description) return { ok: false, message: 'Isi minimal satu informasi tentang tempat ini.' }
  if (f.get('consent') !== 'yes') return { ok: false, message: 'Centang pernyataan di bawah terlebih dahulu.' }
  try {
    if (!(await allowed())) return { ok: false, message: 'Terlalu banyak kiriman dari jaringan ini hari ini. Coba lagi besok.' }
    const exists = (await db().query("SELECT 1 FROM vg_places WHERE id=$1 AND status='published'", [placeId])).rows.length
    if (!exists) return { ok: false, message: 'Tempat tidak dikenali. Muat ulang halaman ini.' }
    await db().query(
      `INSERT INTO vg_owner_updates(place_id,relation,contact_name,contact_phone,public_whatsapp,website,address,hours,price_note,description)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [placeId, relation, name, phone, publicWa, website, address, hours, price, description])
  } catch {
    return { ok: false, message: 'Kiriman belum tersimpan. Coba lagi beberapa saat lagi.' }
  }
  return { ok: true, message: 'Data diterima. Tim VisitGarut akan memeriksanya dan bisa menghubungi Anda lewat WhatsApp untuk verifikasi sebelum ditampilkan.' }
}
