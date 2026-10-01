'use client'

import { useState } from 'react'
import { CheckCircle2, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ClaimBusinessForm({ placeId, userId, defaultEmail, existingStatus }: { placeId: string; userId: string; defaultEmail: string; existingStatus?: string | null }) {
  const router = useRouter()
  const [email, setEmail] = useState(defaultEmail)
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submitClaim(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage(null)
    const supabase = createClient()
    const { error } = await supabase.from('place_claims').insert({
      place_id: placeId,
      user_id: userId,
      business_email: email || null,
      phone: phone || null,
      note: note || null,
      status: 'pending',
    })
    setLoading(false)

    if (error?.code === '23505') {
      setMessage('Claim aktif untuk listing ini sudah ada.')
      return
    }
    setMessage(error ? error.message : 'Claim berhasil diajukan. Tim VisitGarut akan memverifikasi kepemilikan bisnis.')
    if (!error) router.refresh()
  }

  if (existingStatus) {
    return (
      <div className="claim-existing-state">
        <CheckCircle2 size={30} />
        <h2>Claim sudah diajukan.</h2>
        <p>Status saat ini: <strong>{existingStatus}</strong>. Kamu bisa memantau statusnya dari halaman akun.</p>
        <a href="/account">Buka akun</a>
      </div>
    )
  }

  return (
    <form className="claim-form" onSubmit={submitClaim}>
      <label>
        <span>Email bisnis</span>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <label>
        <span>Nomor telepon / WhatsApp</span>
        <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="08xxxxxxxxxx" required />
      </label>
      <label>
        <span>Hubungan dengan bisnis</span>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Contoh: Saya pemilik usaha / pengelola operasional. Sertakan informasi yang membantu proses verifikasi." rows={5} required />
      </label>
      {message ? <p className="claim-form-message">{message}</p> : null}
      <button type="submit" disabled={loading}><Send size={17} /> {loading ? 'Mengirim…' : 'Ajukan claim bisnis'}</button>
      <small>Pengajuan tidak otomatis mengubah listing. VisitGarut akan melakukan verifikasi terlebih dahulu.</small>
    </form>
  )
}
