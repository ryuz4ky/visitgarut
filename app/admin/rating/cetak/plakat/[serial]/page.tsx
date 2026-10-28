import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/mvp/auth'
import { db } from '@/lib/mvp/db'
import { absoluteUrl } from '@/lib/site'
import { formatScore, normalizeSerial, sectors } from '@/lib/rating/core'
import { plaqueBySerial, placeRating } from '@/lib/rating/store'
import Qr from '@/components/rating/Qr'
import PrintButton from '@/components/rating/PrintButton'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Cetak plakat — Admin', robots: { index: false, follow: false } }

const monthYear = (d: Date | string) => new Date(d).toLocaleDateString('id-ID', { month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })

/** Printable plaques: round door sticker (15 cm) and cashier card (A5). Prints the score at issue, never a newer number. */
export default async function CetakPlakat({ params }: { params: Promise<{ serial: string }> }) {
  await requireAdmin()
  const serial = normalizeSerial(decodeURIComponent((await params).serial))
  if (!serial) notFound()
  const now = new Date()
  const plaque = await plaqueBySerial(db(), serial, now)
  if (!plaque) notFound()
  const rating = await placeRating(db(), plaque.place_id, now)
  const url = absoluteUrl('/plakat/' + plaque.serial)
  const score = formatScore(Number(plaque.score_at_issue))
  const aspects = (rating?.aspects ?? []).filter(a => a.average !== null).sort((a, b) => (b.raters - a.raters)).slice(0, 3)
  const sectorLabel = rating ? sectors[rating.sector].label : ''
  return <main className="vr-print">
    <div className="vr-print-bar"><Link href="/admin/rating?tab=plaques">← Kembali</Link>
      <span>{plaque.state === 'aktif' ? 'Stiker kaca Ø 15 cm dan kartu kasir A5, skala 100%.' : `Plakat ${plaque.state}: jangan dicetak ulang.`}</span>
      {plaque.state === 'aktif' && <PrintButton/>}</div>
    {plaque.state === 'aktif' && <>
      <section className="vr-door">
        <div>
          <small>VISITGARUT RATING</small>
          <b>{score}</b>
          <span className="vr-door-tier">SKOR TERUJI</span>
          <em>{plaque.name}{sectorLabel ? ` · ${sectorLabel}` : ''}</em>
          <div className="vr-door-qr"><Qr value={url} label="QR status plakat"/><span><strong>No. {plaque.serial}</strong><span>Berlaku s.d. {monthYear(plaque.expires_at)}</span><span>Pindai: status terkini</span></span></div>
          <small className="vr-door-fine">Skor ulasan pengunjung, bukan sertifikasi pemerintah</small>
        </div>
      </section>
      <section className="vr-cashier">
        <span className="vr-cashier-kicker">DINILAI PENGUNJUNG</span>
        <strong className="vr-cashier-name">{plaque.name}</strong>
        <div className="vr-cashier-score"><b>{score}</b><span>dari 5</span></div>
        <span className="vr-cashier-meta">Skor teruji · {plaque.reviewers_at_issue} pengunjung · 12 bulan terakhir</span>
        {aspects.length > 0 && <dl>{aspects.map(a => <div key={a.key}><dt>{a.label}</dt><dd>{formatScore(a.average!)}</dd></div>)}</dl>}
        <div className="vr-cashier-qr"><Qr value={url} label="QR status plakat"/><span><strong>No. {plaque.serial}</strong><span>Berlaku s.d. {monthYear(plaque.expires_at)} · pindai untuk cek</span></span></div>
        <small>Skor ulasan pengunjung, bukan sertifikasi pemerintah</small>
      </section>
    </>}
  </main>
}
