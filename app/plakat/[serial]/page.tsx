import Link from 'next/link'
import { Shell } from '@/components/mvp/Shell'
import { db } from '@/lib/mvp/db'
import { ratingVisible } from '@/lib/rating/server'
import { plaqueBySerial, placeRating } from '@/lib/rating/store'
import { RATING, formatScore, normalizeSerial, sectors, tierLabels } from '@/lib/rating/core'
import { notFound } from 'next/navigation'
import { ShieldCheck, ShieldAlert, ShieldX, Clock } from 'lucide-react'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Cek plakat VisitGarut Rating', robots: { index: false, follow: true } }

const stateText = {
  aktif: ['AKTIF', 'Plakat ini resmi dan masih berlaku.', ShieldCheck],
  kedaluwarsa: ['KEDALUWARSA', 'Masa berlaku plakat ini sudah habis. Skor terkini ada di halaman tempat.', Clock],
  ditangguhkan: ['DITANGGUHKAN', 'Plakat ini sedang ditangguhkan sambil diperiksa ulang.', ShieldAlert],
  dicabut: ['DICABUT', 'Plakat ini sudah dicabut dan tidak boleh dipajang.', ShieldX],
} as const
const monthYear = (d: Date | string) => new Date(d).toLocaleDateString('id-ID', { month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })

export default async function Plakat({ params }: { params: Promise<{ serial: string }> }) {
  if (!(await ratingVisible())) notFound()
  const { serial: rawSerial } = await params
  const serial = normalizeSerial(decodeURIComponent(rawSerial)) ?? rawSerial.toUpperCase()
  const now = new Date()
  const plaque = await plaqueBySerial(db(), serial, now)
  if (!plaque) return <Shell><main className="vr-wrap" id="konten-utama">
    <p className="vr-eyebrow">Cek plakat</p>
    <h1>Nomor plakat tidak dikenal</h1>
    <p className={`vr-state is-dicabut`}>TIDAK DITEMUKAN</p>
    <p className="vr-lead">“{serial.slice(0, 20)}” tidak ada di catatan VisitGarut. Bila kamu melihatnya dipajang, kemungkinan plakat palsu: jangan jadikan acuan, dan kabari kami lewat halaman tempat terkait.</p>
    <Link className="vg-button vg-secondary" href="/plakat">Cek nomor lain</Link>
  </main></Shell>
  const current = await placeRating(db(), plaque.place_id, now)
  const [label, text, Icon] = stateText[plaque.state as keyof typeof stateText]
  const active = plaque.state === 'aktif'
  return <Shell><main className="vr-wrap vr-plaque-page" id="konten-utama">
    <p className="vr-eyebrow">Cek plakat</p>
    <h1>{plaque.serial}</h1>
    <p className={`vr-state is-${plaque.state}`}><Icon size={16} aria-hidden="true"/>{label}</p>
    <p className="vr-lead">{text}</p>
    <div className={active ? 'vr-plaque-visual' : 'vr-plaque-visual is-void'} aria-hidden="true">
      <div><small>VISITGARUT RATING</small><b>{formatScore(Number(plaque.score_at_issue))}</b><span>KEYAKINAN TINGGI</span><em>{plaque.name}</em><small>No. {plaque.serial} · s.d. {monthYear(plaque.expires_at)}</small></div>
    </div>
    <dl className="vr-card vr-facts">
      <div><dt>Usaha</dt><dd><Link href={`/${plaque.category}/${plaque.slug}#rating`}>{plaque.name}</Link></dd></div>
      {current && <div><dt>Sektor</dt><dd>{sectors[current.sector].label}</dd></div>}
      <div><dt>Skor saat dicetak</dt><dd>{formatScore(Number(plaque.score_at_issue))} ({plaque.reviewers_at_issue} penilai)</dd></div>
      <div><dt>Skor hari ini</dt><dd>{current?.score != null ? `${formatScore(current.score)} · ${tierLabels[current.tier]}` : 'Belum cukup penilai'}</dd></div>
      <div><dt>Dicetak</dt><dd>{monthYear(plaque.issued_at)}</dd></div>
      <div><dt>Berlaku sampai</dt><dd>{monthYear(plaque.expires_at)}</dd></div>
      {plaque.status_note && plaque.state !== 'aktif' && <div><dt>Catatan</dt><dd>{plaque.status_note}</dd></div>}
    </dl>
    <Link className="vg-button" href={`/${plaque.category}/${plaque.slug}#rating`}>Lihat ulasan lengkap</Link>
    <p className="vr-fine">Plakat hanya diberikan untuk skor berlabel Keyakinan tinggi dan berlaku {RATING.plaqueValidMonths} bulan. Pemilik tidak bisa membeli skor. Skor ulasan pengunjung, bukan sertifikasi pemerintah. <Link href="/rating/metode">Cara skor dihitung</Link> · Ada yang janggal? <Link href={`/${plaque.category}/${plaque.slug}#community-pulse`}>Laporkan</Link></p>
  </main></Shell>
}
