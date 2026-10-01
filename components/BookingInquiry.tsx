'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, MessageCircle, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type BookingInquiryProps = {
  placeId: string
  placeName: string
  userId: string | null
  whatsappNumber?: string | null
}

export default function BookingInquiry({ placeId, placeName, userId, whatsappNumber }: BookingInquiryProps) {
  const supabase = useMemo(() => createClient(), [])
  const [intent, setIntent] = useState('availability')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState(`Halo, saya ingin menanyakan informasi tentang ${placeName}.`)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submitLead() {
    if (!fullName.trim() || (!phone.trim() && !email.trim())) {
      setError('Isi nama dan minimal email atau nomor telepon.')
      return
    }

    setBusy(true)
    setError(null)
    const { error: submitError } = await supabase.from('booking_leads').insert({
      place_id: placeId,
      user_id: userId,
      source: 'visitgarut',
      intent,
      full_name: fullName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      message: message.trim() || null,
      status: 'new',
      metadata: { place_name: placeName },
    })
    setBusy(false)
    if (submitError) {
      setError(submitError.message)
      return
    }
    setSent(true)
  }

  async function trackWhatsapp() {
    const normalized = whatsappNumber?.replace(/\D/g, '')
    if (!normalized) return

    await supabase.from('booking_leads').insert({
      place_id: placeId,
      user_id: userId,
      source: 'whatsapp',
      intent,
      full_name: fullName.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      message: message.trim() || null,
      status: 'new',
      metadata: { place_name: placeName, direct_click: true },
    })

    const text = encodeURIComponent(message.trim() || `Halo, saya ingin menanyakan informasi tentang ${placeName}.`)
    window.open(`https://wa.me/${normalized}?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  if (sent) {
    return (
      <div className="booking-success-state">
        <CheckCircle2 size={30} />
        <h3>Permintaan terkirim.</h3>
        <p>Inquiry kamu sudah tercatat di VisitGarut. Partner dapat menindaklanjuti melalui kontak yang kamu berikan.</p>
        {whatsappNumber ? <button type="button" onClick={trackWhatsapp}><MessageCircle size={17} /> Lanjut via WhatsApp</button> : null}
      </div>
    )
  }

  return (
    <div className="booking-inquiry-card">
      <span className="marketplace-kicker">BOOK / ASK LOCAL</span>
      <h2>Tanya ketersediaan</h2>
      <p>Kirim inquiry tanpa pembayaran di VisitGarut. Konfirmasi final tetap dilakukan langsung dengan partner.</p>

      <label>
        <span>Kebutuhan</span>
        <select value={intent} onChange={(event) => setIntent(event.target.value)}>
          <option value="availability">Cek ketersediaan</option>
          <option value="booking">Ingin booking</option>
          <option value="promo">Tanya promo</option>
          <option value="inquiry">Pertanyaan umum</option>
        </select>
      </label>

      <div className="booking-two-col">
        <label><span>Nama</span><input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nama kamu" /></label>
        <label><span>WhatsApp / Telepon</span><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="08…" inputMode="tel" /></label>
      </div>
      <label><span>Email (opsional jika sudah isi telepon)</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" /></label>
      <label><span>Pesan</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} /></label>

      {error ? <p className="booking-error">{error}</p> : null}
      <div className="booking-actions">
        <button className="booking-primary" type="button" onClick={submitLead} disabled={busy}><Send size={16} /> {busy ? 'Mengirim…' : 'Kirim inquiry'}</button>
        {whatsappNumber ? <button className="booking-whatsapp" type="button" onClick={trackWhatsapp}><MessageCircle size={16} /> WhatsApp langsung</button> : null}
      </div>
      <small>VisitGarut tidak memproses pembayaran pada tahap ini dan tidak menjamin ketersediaan sampai dikonfirmasi partner.</small>
    </div>
  )
}
