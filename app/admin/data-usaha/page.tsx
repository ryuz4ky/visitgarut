import Link from 'next/link'
import AdminShell from '@/components/mvp/AdminShell'
import { requireAdmin } from '@/lib/mvp/auth'
import { db } from '@/lib/mvp/db'
import { acceptOwnerUpdate, rejectOwnerUpdate } from './actions'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Data dari pengelola — Admin', robots: { index: false, follow: false } }

const fmt = (d: string | Date) => new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' })
const errors: Record<string, string> = { wa: 'nomor WhatsApp untuk pengunjung tidak valid', url: 'alamat situs harus diawali https://', simpan: 'perubahan belum tersimpan' }

export default async function AdminOwnerUpdates({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin()
  const q = await searchParams
  const rows = (await db().query(
    `SELECT u.*, p.name, p.slug, p.category, p.district, p.whatsapp AS cur_whatsapp, p.website AS cur_website, p.address AS cur_address
     FROM vg_owner_updates u JOIN vg_places p ON p.id=u.place_id ORDER BY (u.status='baru') DESC, u.created_at DESC LIMIT 200`).catch(() => ({ rows: [] }))).rows
  return <AdminShell active="/admin/data-usaha"><div className="va-page">
    <h1>Data dari pengelola</h1>
    <p className="va-note">Kiriman dari formulir “Lengkapi data” di halaman tempat. Verifikasi dulu lewat WhatsApp bahwa pengirim benar pemilik atau pengelola. Saat diterima, kontak dan alamat masuk ke data tempat; jam buka, harga, dan keterangan tampil di halaman tempat dengan label “dari pengelola”. Semua nilai bisa disunting sebelum diterima.</p>
    {q.saved && <p className="va-ok">Tersimpan.</p>}
    {q.error && <p className="va-error">Gagal: {errors[q.error] || q.error}</p>}
    {!rows.length && <p>Belum ada kiriman.</p>}
    <div className="va-list">{rows.map(r => <article key={r.id} className="va-card">
      <header><strong><Link href={`/${r.category}/${r.slug}`} target="_blank">{r.name}</Link></strong> · {r.category}{r.district ? ' · ' + r.district : ''} · {fmt(r.created_at)} · <em>{r.status}</em></header>
      <p>{r.relation}: {r.contact_name} · <a href={`https://wa.me/${r.contact_phone}`} target="_blank" rel="noopener noreferrer">+{r.contact_phone}</a></p>
      <form action={acceptOwnerUpdate} className="va-owner-form"><input type="hidden" name="id" value={r.id}/>
        <label>WhatsApp untuk pengunjung<input name="public_whatsapp" defaultValue={r.public_whatsapp} maxLength={30}/><small>Sekarang: {r.cur_whatsapp || '(kosong)'}</small></label>
        <label>Situs / media sosial<input name="website" defaultValue={r.website} maxLength={300}/><small>Sekarang: {r.cur_website || '(kosong)'}</small></label>
        <label>Alamat<input name="address" defaultValue={r.address} maxLength={300}/><small>Sekarang: {r.cur_address || '(kosong)'}</small></label>
        <label>Jam buka<input name="hours" defaultValue={r.hours} maxLength={300}/></label>
        <label>Kisaran harga<input name="price_note" defaultValue={r.price_note} maxLength={300}/></label>
        <label>Keterangan<textarea name="description" defaultValue={r.description} rows={4} maxLength={1200}/></label>
        <label>Catatan tim<input name="admin_note" defaultValue={r.admin_note} maxLength={1000} placeholder="Cara verifikasi, alasan penolakan"/></label>
        <div className="va-inline"><button type="submit" data-act="accept">{r.status === 'diterima' ? 'Simpan perubahan' : 'Terima & tampilkan'}</button><button type="submit" formAction={rejectOwnerUpdate} data-act="reject" className="is-quiet">Tolak</button></div>
      </form>
    </article>)}</div>
  </div></AdminShell>
}
