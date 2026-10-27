'use server'
import { db } from '@/lib/mvp/db'
import { parseReview } from '@/lib/rating/core'
import { ratingEnabled, allowedRequest } from '@/lib/rating/server'
import { loadInvite, submitReview, withdrawReview } from '@/lib/rating/store'

export type ReviewState = { ok: boolean; message: string }

export async function submitReviewAction(_prev: ReviewState, form: FormData): Promise<ReviewState> {
  if (!ratingEnabled()) return { ok: false, message: 'Fitur rating belum aktif.' }
  const token = String(form.get('token') || '')
  if (!await allowedRequest('review', 20)) return { ok: false, message: 'Terlalu banyak percobaan hari ini.' }
  const now = new Date()
  const loaded = await loadInvite(db(), token, now)
  if ('error' in loaded) return { ok: false, message: loaded.error === 'used' ? 'Nilai untuk kunjungan ini sudah terkirim.' : loaded.error === 'early' ? 'Undangan baru bisa dipakai 30 menit setelah check-in.' : 'Undangan tidak berlaku atau sudah kedaluwarsa.' }
  const input = parseReview(Object.fromEntries(form.entries()), loaded.sector)
  if (!input) return { ok: false, message: 'Pilih nilai keseluruhan 1–5, siapa yang ikut, dan centang pernyataan bahwa kamu tidak dibayar atau diminta pemilik.' }
  const result = await submitReview(db(), token, input, String(form.get('display_name') || ''), now)
  if (result !== 'ok') return { ok: false, message: 'Nilai belum tersimpan. Undangan mungkin sudah dipakai atau kedaluwarsa.' }
  return { ok: true, message: 'Hatur nuhun! Nilaimu ditahan 24–48 jam dan diperiksa dengan aturan yang sama untuk nilai baik maupun buruk.' }
}

export async function withdrawAction(_prev: ReviewState, form: FormData): Promise<ReviewState> {
  if (!ratingEnabled()) return { ok: false, message: 'Fitur rating belum aktif.' }
  if (!await allowedRequest('withdraw', 20)) return { ok: false, message: 'Terlalu banyak percobaan hari ini.' }
  const ok = await withdrawReview(db(), String(form.get('token') || ''))
  return ok ? { ok: true, message: 'Nilaimu sudah ditarik dan tidak dihitung lagi.' } : { ok: false, message: 'Tidak ada nilai yang bisa ditarik.' }
}
