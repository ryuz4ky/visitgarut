'use server'
import { db } from '@/lib/mvp/db'
import { ratingEnabled, ratingSecret, allowedRequest } from '@/lib/rating/server'
import { startCheckin, requestOtp, verifyOtp } from '@/lib/rating/store'
import { sendWhatsapp, otpMessage } from '@/lib/rating/whatsapp'

export type CheckinState = { step: 'start' | 'phone' | 'code' | 'done'; id?: string; geo?: boolean; message?: string }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export async function checkinAction(_prev: CheckinState, form: FormData): Promise<CheckinState> {
  if (!ratingEnabled()) return { step: 'start', message: 'Fitur rating belum aktif.' }
  const intent = String(form.get('intent') || '')
  const now = new Date()
  try {
    if (intent === 'start') {
      if (!await allowedRequest('checkin', 30)) return { step: 'start', message: 'Terlalu banyak percobaan hari ini. Coba lagi besok.' }
      const lat = Number(form.get('lat')), lon = Number(form.get('lon')), accuracy = Number(form.get('accuracy'))
      const device = form.get('lat') ? { lat, lon, accuracy } : null
      const result = await startCheckin(db(), String(form.get('code') || ''), device, now)
      if ('error' in result) return { step: 'start', message: 'Plat QR ini tidak aktif.' }
      return { step: 'phone', id: result.id, geo: result.geo }
    }
    const id = String(form.get('id') || '')
    if (!uuid.test(id)) return { step: 'start', message: 'Sesi check-in tidak valid. Pindai ulang QR.' }
    if (intent === 'phone') {
      if (form.get('consent') !== 'yes') return { step: 'phone', id, message: 'Centang persetujuan penggunaan nomor terlebih dulu.' }
      if (!await allowedRequest('otp', 8)) return { step: 'phone', id, message: 'Batas pengiriman kode hari ini tercapai.' }
      const result = await requestOtp(db(), id, String(form.get('phone') || ''), ratingSecret(), now)
      if (!result.ok) {
        const messages = {
          expired: 'Sesi check-in sudah lewat 4 jam. Pindai ulang QR di lokasi.',
          invalid_phone: 'Masukkan nomor WhatsApp Indonesia (+62).',
          insider: 'Nomor ini terdaftar sebagai pemilik atau staf usaha ini, jadi tidak bisa menilai tempat ini.',
          repeat: 'Nomor ini sudah check-in di sini dalam 90 hari terakhir. Satu orang dihitung sekali.',
          verified: 'Check-in ini sudah terverifikasi.',
        }
        return { step: result.error === 'expired' ? 'start' : 'phone', id, message: messages[result.error] }
      }
      const place = (await db().query('SELECT p.name FROM vg_rating_checkins c JOIN vg_places p ON p.id=c.place_id WHERE c.id=$1', [id])).rows[0]
      const sent = await sendWhatsapp(result.phone, otpMessage(result.code, place?.name || 'tempat ini'))
      if (!sent.ok) return { step: 'phone', id, message: 'Kode belum bisa dikirim lewat WhatsApp. Coba lagi sebentar.' }
      return { step: 'code', id }
    }
    if (intent === 'code') {
      const result = await verifyOtp(db(), id, String(form.get('otp') || '').trim(), ratingSecret(), now)
      if (result === 'ok') return { step: 'done', id }
      const messages = { wrong: 'Kode salah. Periksa pesan WhatsApp terbaru.', expired: 'Kode sudah kedaluwarsa. Minta kode baru.', locked: 'Terlalu banyak kode salah. Pindai ulang QR.' }
      return { step: result === 'locked' ? 'start' : 'code', id, message: messages[result] }
    }
  } catch (error) {
    console.error('rating checkin failed', error instanceof Error ? error.message : 'unknown')
    return { step: 'start', message: 'Terjadi gangguan. Coba lagi.' }
  }
  return { step: 'start' }
}
