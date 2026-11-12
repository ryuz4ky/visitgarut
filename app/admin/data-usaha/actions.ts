'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/mvp/db'
import { requireAdmin } from '@/lib/mvp/auth'
import { normalizePhone } from '@/lib/rating/core'

const str = (f: FormData, k: string, max = 1200) => String(f.get(k) || '').replace(/\r/g, '').trim().slice(0, max)

/** Accepting applies the contact fields to the place and publishes the text fields as "dari pengelola". The admin can edit every value first.
 * Each button has its own action: a submit button's name/value is not sent with a client-side server-action submit. */
export async function rejectOwnerUpdate(f: FormData) {
  await requireAdmin()
  await db().query("UPDATE vg_owner_updates SET status='ditolak', admin_note=$2, reviewed_at=now() WHERE id=$1", [Number(f.get('id')), str(f, 'admin_note', 1000)])
  revalidatePath('/', 'layout')
  redirect('/admin/data-usaha?saved=1')
}

export async function acceptOwnerUpdate(f: FormData) {
  await requireAdmin()
  const id = Number(f.get('id')), note = str(f, 'admin_note', 1000)
  const waRaw = str(f, 'public_whatsapp', 30), wa = waRaw ? normalizePhone(waRaw) : ''
  if (wa === null) redirect('/admin/data-usaha?error=wa')
  const website = str(f, 'website', 300)
  if (website && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(website)) redirect('/admin/data-usaha?error=url')
  const address = str(f, 'address', 300), hours = str(f, 'hours', 300), price = str(f, 'price_note', 300), description = str(f, 'description', 1200)
  const client = await db().connect()
  try {
    await client.query('BEGIN')
    const row = (await client.query(
      `UPDATE vg_owner_updates SET status='diterima', admin_note=$2, reviewed_at=now(), public_whatsapp=$3, website=$4, address=$5, hours=$6, price_note=$7, description=$8
       WHERE id=$1 RETURNING place_id`, [id, note, wa, website, address, hours, price, description])).rows[0]
    if (row) await client.query(
      `UPDATE vg_places SET whatsapp=CASE WHEN $2<>'' THEN $2 ELSE whatsapp END, website=CASE WHEN $3<>'' THEN $3 ELSE website END,
         address=CASE WHEN $4<>'' THEN $4 ELSE address END, updated_at=now() WHERE id=$1`, [row.place_id, wa, website, address])
    await client.query('COMMIT')
  } catch { await client.query('ROLLBACK').catch(() => {}); client.release(); redirect('/admin/data-usaha?error=simpan') }
  client.release()
  revalidatePath('/', 'layout')
  redirect('/admin/data-usaha?saved=1')
}
