// WhatsApp delivery for OTP codes and review invitations.
// WHATSAPP_PROVIDER=fonnte uses the Fonnte gateway (WHATSAPP_TOKEN). =log only prints, and is refused in production.
// Other providers (Meta Cloud API, Wablas, Qontak) can be added here behind the same function.

export type SendResult = { ok: true } | { ok: false; reason: string }

export async function sendWhatsapp(phone: string, message: string): Promise<SendResult> {
  const provider = process.env.WHATSAPP_PROVIDER || ''
  if (provider === 'log') {
    if (process.env.NODE_ENV === 'production' && process.env.RATING_ALLOW_LOG_PROVIDER !== '1') return { ok: false, reason: 'log provider not allowed in production' }
    console.log(`[whatsapp:log] to ${phone.slice(0, 5)}… ${message}`)
    return { ok: true }
  }
  if (provider === 'fonnte') {
    const token = process.env.WHATSAPP_TOKEN
    if (!token) return { ok: false, reason: 'WHATSAPP_TOKEN missing' }
    try {
      const body = new URLSearchParams({ target: phone, message, countryCode: '62' })
      const res = await fetch('https://api.fonnte.com/send', { method: 'POST', headers: { Authorization: token }, body, signal: AbortSignal.timeout(10_000) })
      const json = await res.json().catch(() => ({})) as { status?: boolean; reason?: string }
      return res.ok && json.status !== false ? { ok: true } : { ok: false, reason: json.reason || `HTTP ${res.status}` }
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : 'network' }
    }
  }
  return { ok: false, reason: 'WHATSAPP_PROVIDER not configured' }
}

export function otpMessage(code: string, placeName: string) {
  return `Kode VisitGarut Rating: ${code}\nUntuk check-in di ${placeName}. Berlaku 10 menit. Jangan berikan kode ini kepada siapa pun, termasuk pemilik usaha.`
}

export function inviteMessage(placeName: string, url: string) {
  return `Sampurasun! Kamu tadi check-in di ${placeName}.\nBagaimana kunjunganmu? Nilaimu membantu pengunjung lain, dan pemilik tidak bisa menghapusnya.\n\nBeri nilai (1 menit): ${url}\n\nUndangan berlaku 7 hari. Balas STOP untuk berhenti.`
}
