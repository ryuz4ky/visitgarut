'use server'
import { db } from '@/lib/mvp/db'
import { categories } from '@/lib/mvp/categories'
import { normalizePhone } from '@/lib/rating/core'
import { allowedRequest, ratingVisible } from '@/lib/rating/server'

export type ApplyState = { ok: boolean; message: string }
const str = (f: FormData, k: string, max: number) => String(f.get(k) || '').trim().slice(0, max)

/** Stores a plate request for the team to follow up. Contact details are visible to admins only. */
export async function applyForPlate(_prev: ApplyState, f: FormData): Promise<ApplyState> {
  if (!(await ratingVisible())) return { ok: false, message: 'Pendaftaran belum dibuka.' }
  if (str(f, 'website', 100)) return { ok: true, message: 'Terima kasih.' } // honeypot
  const business = str(f, 'business_name', 120), contact = str(f, 'contact_name', 80)
  const category = str(f, 'category', 40), district = str(f, 'district', 80), note = str(f, 'note', 1000)
  const phone = normalizePhone(str(f, 'contact_phone', 30))
  if (business.length < 2 || contact.length < 2) return { ok: false, message: 'Isi nama usaha dan nama penanggung jawab.' }
  if (!categories.some(c => c.slug === category)) return { ok: false, message: 'Pilih jenis usaha.' }
  if (!phone) return { ok: false, message: 'Nomor WhatsApp harus nomor Indonesia, misalnya 0812…' }
  if (f.get('consent') !== 'yes') return { ok: false, message: 'Setujui aturan main terlebih dahulu.' }
  try {
    if (!(await allowedRequest('apply', 5))) return { ok: false, message: 'Terlalu banyak pendaftaran dari jaringan ini hari ini. Coba lagi besok.' }
    await db().query('INSERT INTO vg_rating_applications(business_name,category,district,contact_name,contact_phone,note) VALUES($1,$2,$3,$4,$5,$6)',
      [business, category, district, contact, phone, note])
  } catch {
    return { ok: false, message: 'Pendaftaran belum tersimpan. Coba lagi beberapa saat lagi.' }
  }
  return { ok: true, message: 'Pendaftaran diterima. Tim VisitGarut akan menghubungi lewat WhatsApp untuk verifikasi dan jadwal pemasangan plat.' }
}
