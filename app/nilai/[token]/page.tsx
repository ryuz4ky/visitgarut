import { notFound } from 'next/navigation'
import { Shell } from '@/components/mvp/Shell'
import { db } from '@/lib/mvp/db'
import { ratingEnabled } from '@/lib/rating/server'
import { loadInvite } from '@/lib/rating/store'
import { aspectsForSector, sectors } from '@/lib/rating/core'
import ReviewForm from '@/components/rating/ReviewForm'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Beri nilai — VisitGarut Rating', robots: { index: false, follow: false } }

export default async function Nilai({ params }: { params: Promise<{ token: string }> }) {
  if (!ratingEnabled()) notFound()
  const { token } = await params
  const loaded = await loadInvite(db(), token, new Date())
  if ('error' in loaded && loaded.error !== 'used') return <Shell><main className="vr-wrap" id="konten-utama"><h1>Undangan tidak berlaku</h1><p className="vr-lead">{loaded.error === 'early' ? 'Undangan baru bisa dipakai 30 menit setelah check-in.' : 'Link ini sudah kedaluwarsa atau tidak dikenali. Undangan berlaku 7 hari setelah check-in.'}</p></main></Shell>
  if ('error' in loaded) return <Shell><main className="vr-wrap" id="konten-utama"><h1>Nilai sudah terkirim</h1><p className="vr-lead">Nilai untuk kunjungan ini sudah kami terima. Kamu bisa menariknya kapan saja.</p><ReviewForm token={token} placeName={loaded.row!.name} sectorLabel="" aspects={[]} withdrawOnly/></main></Shell>
  const { row, sector } = loaded
  return <Shell><main className="vr-wrap" id="konten-utama">
    <p className="vr-eyebrow">{sectors[sector].label} · check-in {new Date(row.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' })}</p>
    <h1>Bagaimana kunjunganmu ke {row.name}?</h1>
    <p className="vr-lead">Nilai yang kamu tahu saja. Pemilik tidak bisa melihat nomormu atau menghapus nilaimu.</p>
    <ReviewForm token={token} placeName={row.name} sectorLabel={sectors[sector].label} aspects={aspectsForSector(sector)}/>
  </main></Shell>
}
