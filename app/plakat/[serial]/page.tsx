import Link from 'next/link'
import { Shell } from '@/components/mvp/Shell'
import { db } from '@/lib/mvp/db'
import { ratingEnabled } from '@/lib/rating/server'
import { plaqueBySerial, placeRating } from '@/lib/rating/store'
import { formatScore } from '@/lib/rating/core'
import { notFound } from 'next/navigation'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Cek plakat VisitGarut Rating', robots: { index: false, follow: true } }

const stateText = {
  aktif: ['AKTIF', 'Plakat ini resmi dan masih berlaku.'],
  kedaluwarsa: ['KEDALUWARSA', 'Masa berlaku plakat ini sudah habis. Skor terkini ada di halaman tempat.'],
  ditangguhkan: ['DITANGGUHKAN', 'Plakat ini sedang ditangguhkan sambil diperiksa ulang.'],
  dicabut: ['DICABUT', 'Plakat ini sudah dicabut dan tidak boleh dipajang.'],
} as const

export default async function Plakat({ params }: { params: Promise<{ serial: string }> }) {
  if (!ratingEnabled()) notFound()
  const { serial } = await params
  const now = new Date()
  const plaque = await plaqueBySerial(db(), serial.toUpperCase(), now)
  if (!plaque) return <Shell><main className="vr-wrap" id="konten-utama"><h1>Nomor plakat tidak dikenal</h1><p className="vr-lead">Nomor ini tidak ada di catatan VisitGarut. Bila kamu melihatnya dipajang, kemungkinan plakat palsu. Laporkan ke tim VisitGarut.</p></main></Shell>
  const current = await placeRating(db(), plaque.place_id, now)
  const [label, text] = stateText[plaque.state as keyof typeof stateText]
  return <Shell><main className="vr-wrap" id="konten-utama">
    <p className="vr-eyebrow">Cek plakat</p>
    <h1>{plaque.serial}</h1>
    <p className={`vr-state is-${plaque.state}`}>{label}</p>
    <p className="vr-lead">{text}</p>
    <dl className="vr-card vr-facts">
      <div><dt>Usaha</dt><dd><Link href={`/${plaque.category}/${plaque.slug}#rating`}>{plaque.name}</Link></dd></div>
      <div><dt>Skor saat dicetak</dt><dd>{formatScore(Number(plaque.score_at_issue))} ({plaque.reviewers_at_issue} penilai)</dd></div>
      <div><dt>Skor hari ini</dt><dd>{current?.score != null ? formatScore(current.score) : 'Belum cukup penilai'}</dd></div>
      <div><dt>Berlaku sampai</dt><dd>{new Date(plaque.expires_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })}</dd></div>
    </dl>
    <p className="vr-fine">Skor ulasan pengunjung, bukan sertifikasi pemerintah. <Link href="/rating/metode">Cara skor dihitung</Link></p>
  </main></Shell>
}
