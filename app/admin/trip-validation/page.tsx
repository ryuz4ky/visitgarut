import Link from 'next/link'
import { Shell } from '@/components/mvp/Shell'
import { requireAdmin } from '@/lib/mvp/auth'
import { db } from '@/lib/mvp/db'
import { barrierLabels, helpfulnessLabels, validationStages } from '@/lib/visit/validation'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Evaluasi planner', robots: { index: false, follow: false } }
const cohort = "FROM vg_trip_validation WHERE NOT withdrawn AND created_at>now()-interval '30 days'"
export default async function TripValidation() {
  await requireAdmin()
  const [totals, stages, feedback, barriers] = await Promise.all([
    db().query<{ visits: number; answers: number }>(`SELECT count(*)::int visits,count(helpfulness)::int answers ${cohort}`),
    db().query<{ stage: string; n: number }>(`SELECT unnest(stages) stage,count(*)::int n ${cohort} GROUP BY stage`),
    db().query<{ helpfulness: string; n: number }>(`SELECT helpfulness,count(*)::int n ${cohort} AND helpfulness IS NOT NULL GROUP BY helpfulness`),
    db().query<{ barrier: string; n: number }>(`SELECT barrier,count(*)::int n ${cohort} AND barrier IS NOT NULL GROUP BY barrier`),
  ])
  const { visits, answers } = totals.rows[0]
  const stageCount = new Map(stages.rows.map(row => [row.stage, row.n]))
  const answerCount = new Map(feedback.rows.map(row => [row.helpfulness, row.n]))
  const barrierCount = new Map(barriers.rows.map(row => [row.barrier, row.n]))
  return <Shell><section className="vg-wrap vg-section vg-validation-report">
    <Link href="/admin">← Kelola konten</Link><span className="vg-eyebrow">VALIDASI PENGGUNAAN</span><h1>Apakah planner membantu?</h1>
    <p>30 hari terakhir · hanya kunjungan halaman yang secara sukarela ikut evaluasi. Memuat ulang halaman dihitung sebagai kunjungan baru jika pengunjung kembali mengizinkan.</p>
    <div className="vg-validation-stats"><article><strong>{visits}</strong><span>Kunjungan peserta</span></article><article><strong>{answers}</strong><span>Jawaban manfaat & hambatan</span></article><article><strong>{stageCount.get('plan_completed') || 0}</strong><span>Pernah melengkapi input rencana</span></article></div>
    {!visits && <p className="vg-visit-notice">Belum ada kunjungan yang ikut evaluasi. Angka akan terisi setelah pengunjung memilih ikut; tidak ada data contoh dalam laporan ini.</p>}
    <h2>Tahapan yang dicapai</h2><p>Tiap tahap dihitung sekali per kunjungan peserta. Tahapan dapat dibuka dalam urutan berbeda; proporsi memakai seluruh kunjungan peserta sebagai penyebut.</p>
    <div className="vg-validation-table"><table><thead><tr><th>Tahap</th><th>Kunjungan</th><th>Proporsi peserta</th></tr></thead><tbody>{Object.entries(validationStages).map(([key, label]) => { const n = stageCount.get(key) || 0; return <tr key={key}><th scope="row">{label}</th><td>{n}</td><td>{visits ? Math.round(n / visits * 100) + '%' : '—'}</td></tr> })}</tbody></table></div>
    <div className="vg-validation-columns"><section><h2>Manfaat menurut peserta</h2><ul>{Object.entries(helpfulnessLabels).map(([key, label]) => <li key={key}><span>{label}</span><strong>{answerCount.get(key) || 0}</strong></li>)}</ul></section><section><h2>Hambatan yang tersisa</h2><ul>{Object.entries(barrierLabels).map(([key, label]) => <li key={key}><span>{label}</span><strong>{barrierCount.get(key) || 0}</strong></li>)}</ul></section></div>
    <h2>Cara membaca hasil</h2><p>Peserta memilih sendiri untuk ikut; sampel ini belum mewakili seluruh pengunjung atau pasar Garut. “Melengkapi input” berarti biaya terisi, alokasi waktu cukup, dan transport pulang ditandai pada suatu saat dalam kunjungan tersebut. Ini bukan konfirmasi tarif, booking, perjalanan, atau kepuasan setelah berwisata.</p><p>Memilih Maps atau kanal pengelola mencatat klik; menyalin dicatat hanya setelah clipboard berhasil. Membuka bagian biaya atau waktu mencatat judul yang terlihat, bukan memastikan isinya dibaca. Gunakan pola hambatan untuk menyiapkan wawancara dan amati orang menyusun rencana nyata sebelum menetapkan prioritas produk.</p>
  </section></Shell>
}
