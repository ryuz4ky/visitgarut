import Link from 'next/link'
import AdminShell from '@/components/mvp/AdminShell'
import { requireAdmin } from '@/lib/mvp/auth'
import { db } from '@/lib/mvp/db'
import { absoluteUrl } from '@/lib/site'
import { formatScore, tierLabels } from '@/lib/rating/core'
import { placeRating } from '@/lib/rating/store'
import { ratingEnabled } from '@/lib/rating/server'
import { moderateReview, createPlate, setPlateActive, addInsider, issuePlaqueAction, setPlaqueStatus, saveBusinessReply, setApplicationStatus } from './actions'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Rating — Admin', robots: { index: false, follow: false } }

const tabs = [['queue', 'Antrean moderasi'], ['applications', 'Pendaftaran usaha'], ['plates', 'Plat QR & orang dalam'], ['plaques', 'Plakat'], ['approved', 'Disetujui & hak jawab']] as const
const evidenceLabel: Record<string, string> = { receipt: 'QR + bukti bayar (1,0)', qr_geo: 'QR + lokasi (0,7)', otp_only: 'Tanpa lokasi (0,3)' }
const fmt = (d: string | Date) => new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' })

export default async function AdminRating({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin()
  const q = await searchParams
  const tab = tabs.some(([k]) => k === q.tab) ? q.tab! : 'queue'
  const places = (await db().query("SELECT id,name,category FROM vg_places WHERE status='published' ORDER BY name")).rows
  return <AdminShell active="/admin/rating"><div className="va-page">
    <h1>VisitGarut Rating</h1>
    {!ratingEnabled() && <p className="va-note">RATING_ENABLED belum aktif: halaman publik (check-in, undangan, plakat, panel rating) masih tersembunyi. Admin tetap bisa menyiapkan plat, dan sebagai admin Anda melihat pratinjau rating di beranda, halaman sektor, dan halaman tempat.</p>}
    {q.saved && <p className="va-ok">Tersimpan.</p>}
    {q.issued && <p className="va-ok">Plakat {q.issued} diterbitkan. <Link href={`/admin/rating/cetak/plakat/${q.issued}`}>Cetak plakat</Link> (QR ke {absoluteUrl('/plakat/' + q.issued)})</p>}
    {q.error && <p className="va-error">Gagal: {q.error === 'tier' ? 'tempat belum berlabel Skor teruji' : q.error === 'unusual' ? 'ada aktivitas ulasan tidak wajar; periksa dulu' : q.error === 'note' ? 'alasan penolakan wajib diisi' : q.error}</p>}
    <nav className="va-tabs">{tabs.map(([k, l]) => <Link key={k} href={`/admin/rating?tab=${k}`} aria-current={tab === k ? 'page' : undefined}>{l}</Link>)}</nav>
    {tab === 'queue' && <Queue/>}
    {tab === 'applications' && <Applications/>}
    {tab === 'plates' && <Plates places={places}/>}
    {tab === 'plaques' && <Plaques places={places}/>}
    {tab === 'approved' && <Approved/>}
  </div></AdminShell>
}

async function Queue() {
  const rows = (await db().query(`SELECT r.*,p.name,
      (SELECT count(*)::int FROM vg_rating_reviews x WHERE x.place_id=r.place_id AND x.created_at>now()-interval '7 days') week,
      COALESCE((SELECT json_object_agg(aspect,rating) FROM vg_rating_review_aspects WHERE review_id=r.id),'{}') aspects
    FROM vg_rating_reviews r JOIN vg_places p ON p.id=r.place_id WHERE r.status='pending' ORDER BY r.created_at LIMIT 100`)).rows
  if (!rows.length) return <p>Tidak ada ulasan menunggu.</p>
  return <div className="va-list">
    <p className="va-note">Terapkan aturan yang sama untuk nilai baik dan buruk. Tolak hanya untuk: bukan pengalaman kunjungan, menyerang pribadi atau menyebut nama staf, data pribadi, orang dalam, atau bukti pembelian ulasan. Alasan penolakan wajib dan masuk laporan transparansi.</p>
    {rows.map(r => <article key={r.id} className="va-card">
      <header><strong>{r.name}</strong> · nilai <b>{r.overall}</b> · {evidenceLabel[r.evidence]} · {fmt(r.created_at)} · pengulas #{String(r.phone_hash).slice(0, 8)} · {r.week} ulasan/7 hari di tempat ini</header>
      <p>{r.body || <em>(tanpa cerita)</em>}</p>
      <small>Aspek: {Object.entries(typeof r.aspects === 'string' ? JSON.parse(r.aspects) : r.aspects).map(([k, v]) => `${k} ${v}`).join(' · ') || '—'} · bersama {r.party}</small>
      <form action={moderateReview} className="va-inline"><input type="hidden" name="id" value={r.id}/>
        <input name="note" placeholder="Alasan (wajib bila menolak)" maxLength={1000}/>
        <button name="decision" value="approved">Setujui</button><button name="decision" value="rejected">Tolak</button>
      </form>
    </article>)}
  </div>
}

async function Plates({ places }: { places: Record<string, any>[] }) {
  const plates = (await db().query('SELECT pl.*,p.name FROM vg_rating_plates pl JOIN vg_places p ON p.id=pl.place_id ORDER BY p.name,pl.id')).rows
  return <div className="va-list">
    <form action={createPlate} className="va-card va-inline"><strong>Plat baru</strong>
      <select name="place_id" required>{places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <input name="location_note" placeholder="Posisi: kasir / meja 07 / pintu" maxLength={80}/><button>Buat plat</button>
    </form>
    <table className="va-table"><thead><tr><th>Tempat</th><th>Kode</th><th>URL untuk QR</th><th>Posisi</th><th>Status / audit</th></tr></thead><tbody>
      {plates.map(p => <tr key={p.id}><td>{p.name}</td><td><code>{p.code}</code></td><td><code>{absoluteUrl('/r/' + p.code)}</code><br/><Link href={`/admin/rating/cetak/plat/${p.id}`}>Cetak plat</Link></td><td>{p.location_note}</td>
        <td><form action={setPlateActive} className="va-inline"><input type="hidden" name="id" value={p.id}/>
          <select name="active" defaultValue={p.active ? 'yes' : 'no'}><option value="yes">Aktif</option><option value="no">Nonaktif</option></select>
          <input name="audit_note" defaultValue={p.audit_note} placeholder="Catatan audit / mystery visit"/><button>Simpan</button></form>
          <small>{p.last_audit_at ? 'Audit ' + fmt(p.last_audit_at) : 'Belum diaudit'}</small></td></tr>)}
    </tbody></table>
    <form action={addInsider} className="va-card va-inline"><strong>Blokir orang dalam</strong>
      <select name="place_id" required>{places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <input name="phone" placeholder="Nomor pemilik/staf/keluarga" required/><button>Tambahkan</button>
      <small>Nomor disimpan sebagai hash; nomor ini tidak bisa menilai tempat tersebut.</small>
    </form>
  </div>
}

async function Plaques({ places }: { places: Record<string, any>[] }) {
  const now = new Date()
  const withReviews = (await db().query("SELECT DISTINCT place_id FROM vg_rating_reviews WHERE status='approved'")).rows.map(r => r.place_id)
  const ratings = (await Promise.all(withReviews.map(id => placeRating(db(), id, now)))).filter(Boolean)
  const plaques = (await db().query('SELECT q.*,p.name FROM vg_rating_plaques q JOIN vg_places p ON p.id=q.place_id ORDER BY issued_at DESC')).rows
  return <div className="va-list">
    <table className="va-table"><thead><tr><th>Tempat</th><th>Skor</th><th>Label</th><th>Penilai</th><th></th></tr></thead><tbody>
      {ratings.map(r => <tr key={r!.place.id}><td>{r!.place.name}</td><td>{r!.score === null ? '—' : formatScore(r!.score)}</td><td>{tierLabels[r!.tier]}{r!.unusual ? ' · aktivitas tidak wajar' : ''}</td><td>{r!.reviewers}</td>
        <td>{r!.tier === 'tinggi' && <form action={issuePlaqueAction}><input type="hidden" name="place_id" value={r!.place.id}/><button>Terbitkan plakat</button></form>}</td></tr>)}
    </tbody></table>
    <h2>Plakat terbit</h2>
    <table className="va-table"><thead><tr><th>Nomor</th><th>Tempat</th><th>Skor cetak</th><th>Berlaku s.d.</th><th>Status</th></tr></thead><tbody>
      {plaques.map(p => <tr key={p.serial}><td><Link href={'/plakat/' + p.serial}>{p.serial}</Link><br/><Link href={`/admin/rating/cetak/plakat/${p.serial}`}>Cetak plakat</Link></td><td>{p.name}</td><td>{formatScore(Number(p.score_at_issue))}</td><td>{fmt(p.expires_at)}</td>
        <td><form action={setPlaqueStatus} className="va-inline"><input type="hidden" name="serial" value={p.serial}/>
          <select name="status" defaultValue={p.status}><option value="active">Aktif</option><option value="suspended">Ditangguhkan</option><option value="revoked">Dicabut</option></select>
          <input name="note" defaultValue={p.status_note} placeholder="Alasan"/><button>Simpan</button></form></td></tr>)}
    </tbody></table>
    <p className="va-note">{places.length} tempat terbit di direktori; plakat hanya untuk label Skor teruji tanpa aktivitas ulasan tidak wajar.</p>
  </div>
}

async function Approved() {
  const rows = (await db().query(`SELECT r.id,r.overall,r.body,r.business_reply,r.created_at,p.name FROM vg_rating_reviews r JOIN vg_places p ON p.id=r.place_id WHERE r.status='approved' ORDER BY r.created_at DESC LIMIT 50`)).rows
  return <div className="va-list">{rows.map(r => <article key={r.id} className="va-card">
    <header><strong>{r.name}</strong> · nilai {r.overall} · {fmt(r.created_at)}</header><p>{r.body || <em>(tanpa cerita)</em>}</p>
    <form action={saveBusinessReply} className="va-inline"><input type="hidden" name="id" value={r.id}/><input name="reply" defaultValue={r.business_reply} placeholder="Tanggapan resmi pengelola (dari pengelola, bukan dari tim)" maxLength={1500}/><button>Simpan tanggapan</button></form>
  </article>)}</div>
}

async function Applications() {
  const rows = (await db().query(`SELECT * FROM vg_rating_applications ORDER BY (status='baru') DESC, created_at DESC LIMIT 200`).catch(() => ({ rows: [] }))).rows
  if (!rows.length) return <p>Belum ada pendaftaran usaha. Formulir ada di <Link href="/untuk-usaha">/untuk-usaha</Link>.</p>
  return <div className="va-list">
    <p className="va-note">Hubungi lewat WhatsApp untuk verifikasi. Setelah plat dipasang, buat plat di tab “Plat QR & orang dalam” dan daftarkan nomor orang dalam.</p>
    {rows.map(r => <article key={r.id} className="va-card">
      <header><strong>{r.business_name}</strong> · {r.category}{r.district ? ' · ' + r.district : ''} · {fmt(r.created_at)}</header>
      <p>{r.contact_name} · <a href={`https://wa.me/${r.contact_phone}`} target="_blank" rel="noopener noreferrer">+{r.contact_phone}</a></p>
      {r.note && <p>{r.note}</p>}
      <form action={setApplicationStatus} className="va-inline"><input type="hidden" name="id" value={r.id}/>
        <select name="status" defaultValue={r.status}><option value="baru">Baru</option><option value="dihubungi">Dihubungi</option><option value="terpasang">Plat terpasang</option><option value="ditolak">Ditolak</option></select>
        <input name="admin_note" defaultValue={r.admin_note} placeholder="Catatan tim" maxLength={1000}/><button>Simpan</button></form>
    </article>)}
  </div>
}
