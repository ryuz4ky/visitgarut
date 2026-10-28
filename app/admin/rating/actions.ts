'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/mvp/db'
import { requireAdmin } from '@/lib/mvp/auth'
import { normalizePhone } from '@/lib/rating/core'
import { ratingSecret } from '@/lib/rating/server'
import { issuePlaque, moderate } from '@/lib/rating/store'
import { phoneHash, randomCode } from '@/lib/rating/tokens'

const str = (f: FormData, k: string, max = 1000) => String(f.get(k) || '').trim().slice(0, max)

export async function moderateReview(f: FormData) {
  await requireAdmin()
  const decision = str(f, 'decision', 10)
  if (decision !== 'approved' && decision !== 'rejected') redirect('/admin/rating?error=decision')
  const note = str(f, 'note')
  if (decision === 'rejected' && !note) redirect('/admin/rating?error=note')
  const placeId = await moderate(db(), Number(f.get('id')), decision, note, new Date())
  if (placeId) revalidatePath('/', 'layout')
  redirect('/admin/rating?saved=1')
}

export async function createPlate(f: FormData) {
  await requireAdmin()
  const placeId = Number(f.get('place_id'))
  let code = randomCode()
  for (let i = 0; i < 5; i++) {
    const exists = (await db().query('SELECT 1 FROM vg_rating_plates WHERE code=$1', [code])).rows.length
    if (!exists) break
    code = randomCode()
  }
  await db().query('INSERT INTO vg_rating_plates(place_id,code,location_note) VALUES($1,$2,$3)', [placeId, code, str(f, 'location_note', 80)])
  redirect('/admin/rating?tab=plates&saved=1')
}

export async function setPlateActive(f: FormData) {
  await requireAdmin()
  await db().query('UPDATE vg_rating_plates SET active=$2,audit_note=$3,last_audit_at=now() WHERE id=$1', [Number(f.get('id')), f.get('active') === 'yes', str(f, 'audit_note')])
  redirect('/admin/rating?tab=plates&saved=1')
}

export async function addInsider(f: FormData) {
  await requireAdmin()
  const phone = normalizePhone(str(f, 'phone', 30))
  if (!phone) redirect('/admin/rating?tab=plates&error=phone')
  await db().query('INSERT INTO vg_rating_insiders(place_id,phone_hash) VALUES($1,$2) ON CONFLICT DO NOTHING', [Number(f.get('place_id')), phoneHash(phone, ratingSecret())])
  redirect('/admin/rating?tab=plates&saved=1')
}

export async function issuePlaqueAction(f: FormData) {
  await requireAdmin()
  const result = await issuePlaque(db(), Number(f.get('place_id')), new Date())
  if ('error' in result) redirect('/admin/rating?tab=plaques&error=' + result.error)
  revalidatePath('/', 'layout')
  redirect('/admin/rating?tab=plaques&issued=' + result.serial)
}

export async function setPlaqueStatus(f: FormData) {
  await requireAdmin()
  const status = str(f, 'status', 10)
  if (!['active', 'suspended', 'revoked'].includes(status)) redirect('/admin/rating?tab=plaques&error=status')
  await db().query('UPDATE vg_rating_plaques SET status=$2,status_note=$3 WHERE serial=$1', [str(f, 'serial', 12), status, str(f, 'note')])
  revalidatePath('/', 'layout')
  redirect('/admin/rating?tab=plaques&saved=1')
}

export async function saveBusinessReply(f: FormData) {
  await requireAdmin()
  await db().query("UPDATE vg_rating_reviews SET business_reply=$2 WHERE id=$1 AND status='approved'", [Number(f.get('id')), str(f, 'reply', 1500)])
  revalidatePath('/', 'layout')
  redirect('/admin/rating?tab=approved&saved=1')
}

export async function setApplicationStatus(f: FormData) {
  await requireAdmin()
  const status = str(f, 'status', 12)
  if (!['baru', 'dihubungi', 'terpasang', 'ditolak'].includes(status)) redirect('/admin/rating?tab=applications&error=status')
  await db().query('UPDATE vg_rating_applications SET status=$2,admin_note=$3 WHERE id=$1', [Number(f.get('id')), status, str(f, 'admin_note')])
  redirect('/admin/rating?tab=applications&saved=1')
}
