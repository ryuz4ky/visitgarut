'use client'
import { useActionState } from 'react'
import { applyForPlate, type ApplyState } from '@/app/untuk-usaha/actions'

export default function ApplyForm({ categories }: { categories: { slug: string; name: string }[] }) {
  const [state, action, pending] = useActionState<ApplyState, FormData>(applyForPlate, { ok: false, message: '' })
  if (state.ok) return <div className="vr-card vr-done" role="status"><h2>Terima kasih</h2><p>{state.message}</p></div>
  return <form action={action} className="vr-card vr-form vr-apply">
    {state.message && <p className="vr-message" role="alert">{state.message}</p>}
    <label>Nama usaha<input name="business_name" required maxLength={120} autoComplete="organization"/></label>
    <div className="vr-apply-row">
      <label>Jenis usaha<select name="category" required defaultValue=""><option value="" disabled>Pilih…</option>{categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
      <label>Kecamatan<input name="district" maxLength={80} placeholder="Misalnya Tarogong Kidul"/></label>
    </div>
    <div className="vr-apply-row">
      <label>Nama penanggung jawab<input name="contact_name" required maxLength={80} autoComplete="name"/></label>
      <label>Nomor WhatsApp<input name="contact_phone" required inputMode="tel" maxLength={30} placeholder="0812…" autoComplete="tel"/></label>
    </div>
    <label>Catatan (opsional)<textarea name="note" rows={3} maxLength={1000} placeholder="Alamat, jam buka, atau titik pasang yang diinginkan"/></label>
    <input className="vr-hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
    <label className="vr-check"><input type="checkbox" name="consent" value="yes" required/>Saya setuju plat dipasang di tempat yang terlihat semua pengunjung, tidak menawarkan imbalan untuk ulasan, dan mendaftarkan nomor pemilik, staf, dan keluarga sebagai orang dalam.</label>
    <button className="vg-button" type="submit" disabled={pending}>{pending ? 'Mengirim…' : 'Daftarkan usaha'}</button>
    <p className="vr-fine">Nomor WhatsApp hanya dipakai tim VisitGarut untuk verifikasi dan tidak ditampilkan di situs.</p>
  </form>
}
