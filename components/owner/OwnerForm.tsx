'use client'
import { useActionState } from 'react'
import { submitOwnerUpdate, type OwnerState } from '@/app/lengkapi/[category]/[slug]/actions'

export default function OwnerForm({ placeId, placeName }: { placeId: number; placeName: string }) {
  const [state, action, pending] = useActionState<OwnerState, FormData>(submitOwnerUpdate, { ok: false, message: '' })
  if (state.ok) return <div className="vr-card vr-done" role="status"><h2>Terima kasih</h2><p>{state.message}</p></div>
  return <form action={action} className="vr-card vr-form vr-apply" data-vg-event="owner_update">
    {state.message && <p className="vr-message" role="alert">{state.message}</p>}
    <input type="hidden" name="place_id" value={placeId}/>
    <fieldset className="vo-set"><legend>Tentang Anda</legend>
      <div className="vr-apply-row">
        <label>Hubungan dengan tempat ini<select name="relation" required defaultValue=""><option value="" disabled>Pilih…</option><option value="pemilik">Pemilik</option><option value="pengelola">Pengelola</option><option value="staf">Staf yang ditugaskan</option></select></label>
        <label>Nama Anda<input name="contact_name" required maxLength={80} autoComplete="name"/></label>
      </div>
      <label>Nomor WhatsApp Anda<input name="contact_phone" required inputMode="tel" maxLength={30} placeholder="0812…" autoComplete="tel"/><small>Hanya untuk verifikasi oleh tim. Tidak ditampilkan di situs.</small></label>
    </fieldset>
    <fieldset className="vo-set"><legend>Informasi {placeName}</legend>
      <p className="vr-fine">Isi yang Anda tahu saja. Kolom yang dikosongkan tidak mengubah apa pun.</p>
      <div className="vr-apply-row">
        <label>WhatsApp untuk pengunjung<input name="public_whatsapp" inputMode="tel" maxLength={30} placeholder="0812…"/><small>Akan tampil di halaman tempat.</small></label>
        <label>Situs atau akun media sosial resmi<input name="website" maxLength={300} placeholder="instagram.com/namausaha" inputMode="url"/></label>
      </div>
      <label>Alamat lengkap<input name="address" maxLength={300} placeholder="Nama jalan, nomor, desa/kelurahan"/></label>
      <div className="vr-apply-row">
        <label>Jam buka<input name="hours" maxLength={300} placeholder="Setiap hari 09.00–21.00, Jumat tutup"/></label>
        <label>Kisaran harga<input name="price_note" maxLength={300} placeholder="Makanan Rp15.000–40.000"/></label>
      </div>
      <label>Keterangan untuk pengunjung<textarea name="description" rows={4} maxLength={1200} placeholder="Menu andalan, fasilitas, parkir, cara pesan, hal yang perlu diketahui sebelum datang"/></label>
    </fieldset>
    <input className="vr-hp" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
    <label className="vr-check"><input type="checkbox" name="consent" value="yes" required/>Saya berwenang mewakili tempat ini, informasi di atas benar, dan saya setuju informasi tempat ditampilkan di VisitGarut dengan keterangan “dari pengelola”.</label>
    <button className="vg-button" type="submit" disabled={pending}>{pending ? 'Mengirim…' : 'Kirim untuk diperiksa'}</button>
    <p className="vr-fine">Gratis. Mengisi formulir ini tidak mengubah urutan, peringkat, atau skor tempat Anda.</p>
  </form>
}
