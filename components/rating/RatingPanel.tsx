import Link from 'next/link'
import { QrCode, ShieldCheck, BadgeCheck } from 'lucide-react'
import { RATING, aspectsForSector, formatScore, sectors, tierLabels } from '@/lib/rating/core'
import type { PlaceRating } from './RatingBadge'
import type { BoardRow } from './SectorBoard'
import { ScoreRing, TierPill } from './bits'
import TopList from './TopList'

const evidenceLabel = { receipt: 'Check-in + bukti bayar', qr_geo: 'Check-in di lokasi', otp_only: 'Check-in tanpa lokasi' } as const
const partyLabel: Record<string, string> = { sendiri: 'sendiri', teman: 'bersama teman', keluarga: 'bersama keluarga', rombongan: 'rombongan', kerja: 'urusan kerja' }
const month = (d: Date) => d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })
const plaqueStateLabel = { aktif: 'berlaku', kedaluwarsa: 'kedaluwarsa', ditangguhkan: 'ditangguhkan', dicabut: 'dicabut' } as const

/** Public rating section on a place page. No number until 3 independent reviewers, as the methodology says. */
export default function RatingPanel({ rating, peers = [] }: { rating: PlaceRating; peers?: BoardRow[] }) {
  const now = new Date()
  const from = new Date(now.getTime() - RATING.windowDays * 86_400_000)
  const aspectLabels = Object.fromEntries(aspectsForSector(rating.sector).map(a => [a.key, a.label]))
  const evidence = rating.evidence
  const scored = rating.score !== null
  return <section className="vp-card vr-panel2" id="rating" aria-labelledby="rating-title">
    <div className="vr-p-head">
      <p className="vr-eyebrow">VisitGarut Rating · {sectors[rating.sector].label}</p>
      <h2 id="rating-title">Nilai dari pengunjung terverifikasi</h2>
    </div>
    {rating.unusual && <p className="vr-alert">Aktivitas ulasan tidak wajar terdeteksi minggu ini. Ulasan baru ditahan sampai diperiksa, dan plakat tidak diterbitkan sampai pemeriksaan selesai.</p>}

    <div className="vr-p-grid">
      <div className="vr-p-score">
        <ScoreRing score={rating.score} tier={rating.tier} size="lg"/>
        {scored ? <span className="vr-p-of">dari 5</span> : <span className="vr-p-of">belum ada skor</span>}
        <TierPill tier={rating.tier}/>
        <strong>{rating.reviewers} penilai independen</strong>
        {evidence && rating.reviewers > 0 && <ul className="vr-p-evidence">
          {(Object.keys(evidenceLabel) as (keyof typeof evidenceLabel)[]).filter(k => evidence[k] > 0).map(k => <li key={k}>{evidenceLabel[k]} <b>{evidence[k]}</b></li>)}
        </ul>}
        <small>Periode {month(from)} – {month(now)}</small>
        <Link href="/rating/metode">Bagaimana skor ini dihitung?</Link>
      </div>

      <div className="vr-p-detail">
        {scored ? <>
          <h3>Nilai per aspek</h3>
          <p className="vr-fine">Tiap aspek dihitung terpisah. Aspek dengan kurang dari {RATING.aspectMinRaters} penilai tidak diberi angka.</p>
          <div className="vr-aspects">{rating.aspects.map(a => <div key={a.key} className="vr-aspect">
            <span>{a.label}</span>
            {a.average === null
              ? <small>Belum cukup ({a.raters} penilai)</small>
              : <><span className="vr-bar" aria-hidden="true"><i style={{ width: `${(a.average / 5) * 100}%` }}/></span><strong>{formatScore(a.average)}</strong></>}
          </div>)}</div>
          {rating.distribution
            ? <><h3>Sebaran nilai keseluruhan</h3><div className="vr-dist" aria-label="Sebaran nilai keseluruhan">{[5, 4, 3, 2, 1].map(star => <div key={star}><span>{star}</span><span className="vr-bar" aria-hidden="true"><i style={{ width: `${rating.distribution![star - 1]}%` }}/></span><small>{rating.distribution![star - 1]}%</small></div>)}</div></>
            : <p className="vr-fine">Sebaran dalam persen tampil setelah 10 penilai.</p>}
        </> : <div className="vr-p-empty">
          <h3>Belum cukup penilai untuk menampilkan angka</h3>
          <p>Skor tampil setelah minimal 3 pengunjung independen menilai dalam 12 bulan. Sampai saat itu kami tidak menampilkan angka apa pun, termasuk perkiraan.</p>
        </div>}
      </div>
    </div>

    {rating.latest.length > 0 && <div className="vr-reviews">
      <h3>Ulasan terbaru</h3>
      <p className="vr-fine">Urut dari yang terbaru. Semua ulasan di sini sudah lolos moderasi dengan aturan yang sama untuk nilai baik dan buruk.</p>
      {rating.latest.slice(0, 5).map(r => {
        const chips = Object.entries((r.aspects || {}) as Record<string, number | null>).filter(([, v]) => typeof v === 'number').slice(0, 3)
        return <article key={r.id} className="vr-review">
          <header><span className="vr-avatar" aria-hidden="true">{r.displayName.slice(0, 2).toUpperCase()}</span><span><strong>{r.displayName}</strong><span><BadgeCheck size={13} aria-hidden="true"/>{evidenceLabel[r.evidence]} · {month(r.month)}{partyLabel[r.party] ? ` · ${partyLabel[r.party]}` : ''}</span></span><b className="vr-mini-score" aria-label={`Nilai ${r.overall} dari 5`}>{r.overall}</b></header>
          {r.body && <p>{r.body}</p>}
          {chips.length > 0 && <div className="vr-chips">{chips.map(([k, v]) => <span key={k}>{aspectLabels[k] ?? k} {v}</span>)}</div>}
          {r.reply && <p className="vr-reply"><strong>Tanggapan pengelola:</strong> {r.reply}</p>}
        </article>
      })}
    </div>}

    <div className="vr-p-notes">
      {rating.plaque && <div className="vr-p-note"><BadgeCheck size={20} aria-hidden="true"/><p><strong>Plakat resmi: <Link href={`/plakat/${rating.plaque.serial}`}>{rating.plaque.serial}</Link> ({plaqueStateLabel[rating.plaque.state]})</strong>Nomor di plakat lokasi berbeda atau sudah lewat masa berlaku? Jangan jadikan acuan.</p></div>}
      <div className="vr-p-note"><ShieldCheck size={20} aria-hidden="true"/><p><strong>Pengelola tidak membayar untuk skor ini</strong>Skor dan urutan tidak bisa dibeli, dan ulasan tidak bisa dihapus atas permintaan usaha.</p></div>
      <div className="vr-p-note is-lime"><QrCode size={20} aria-hidden="true"/><p><strong>Pernah ke sini?</strong>Pindai plat QR “Titik Ulasan” VisitGarut di kasir atau meja. Undangan menilai dikirim lewat WhatsApp {RATING.inviteDelayMinutes / 60} jam setelah check-in.</p></div>
    </div>

    {peers.length > 0 && <div className="vr-p-peers"><h3>Bandingkan dengan {sectors[rating.sector].label.toLocaleLowerCase('id-ID')} lain</h3><TopList rows={peers} compact/></div>}
    <p className="vr-fine">{tierLabels[rating.tier]} · Skor ulasan pengunjung, bukan sertifikasi pemerintah.</p>
  </section>
}
