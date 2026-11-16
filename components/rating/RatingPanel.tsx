import Link from 'next/link'
import { QrCode, ShieldCheck, BadgeCheck } from 'lucide-react'
import { RATING, aspectsForSector, formatScore, sectors } from '@/lib/rating/core'
import type { PlaceRating } from './RatingBadge'
import type { BoardRow } from './SectorBoard'
import { ScoreRing, TierPill } from './bits'
import TopList from './TopList'

const MIN_REVIEWERS = 3
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
  if (!scored && rating.latest.length === 0 && !rating.plaque && !rating.unusual) {
    const left = Math.max(0, MIN_REVIEWERS - rating.reviewers)
    return <section className="vp-card vr-panel2 vr-panel-empty" id="rating" aria-labelledby="rating-title">
      <div className="vr-pe-icon" aria-hidden="true"><QrCode size={22}/></div>
      <div className="vr-pe-copy">
        <p className="vr-eyebrow">Nilai pengunjung</p>
        <p className="vr-pe-title" id="rating-title">Belum ada skor untuk tempat ini</p>
        <p>{rating.reviewers > 0 ? `${rating.reviewers} pengunjung sudah menilai. Butuh ${left} lagi sebelum skornya muncul.` : `Skor muncul setelah ${MIN_REVIEWERS} pengunjung menilai lewat QR VisitGarut di lokasi.`} Pernah ke sini? Cari plat QR di kasir atau meja.</p>
      </div>
      <Link className="vr-pe-link" href="/rating/metode">Cara kerjanya</Link>
    </section>
  }
  return <section className="vp-card vr-panel2" id="rating" aria-labelledby="rating-title">
    <div className="vr-p-head">
      <p className="vr-eyebrow">Nilai pengunjung · {sectors[rating.sector].label}</p>
      <h2 id="rating-title">Kata pengunjung yang sudah datang</h2>
    </div>
    {rating.unusual && <p className="vr-alert">Minggu ini ulasan untuk tempat ini masuk jauh lebih banyak dari biasanya. Ulasan baru kami tahan dulu sampai selesai dicek.</p>}

    <div className="vr-p-grid">
      <div className="vr-p-score">
        <ScoreRing score={rating.score} tier={rating.tier} size="lg"/>
        {scored ? <span className="vr-p-of">dari 5</span> : <span className="vr-p-of">belum ada skor</span>}
        <TierPill tier={rating.tier}/>
        <strong>dari {rating.reviewers} pengunjung</strong>
        {evidence && rating.reviewers > 0 && <ul className="vr-p-evidence">
          {(Object.keys(evidenceLabel) as (keyof typeof evidenceLabel)[]).filter(k => evidence[k] > 0).map(k => <li key={k}>{evidenceLabel[k]} <b>{evidence[k]}</b></li>)}
        </ul>}
        <small>Periode {month(from)} – {month(now)}</small>
        <Link href="/rating/metode">Cara skor dihitung</Link>
      </div>

      <div className="vr-p-detail">
        {scored ? <>
          <h3>Rinciannya</h3>
          <p className="vr-fine">Bagian yang dinilai kurang dari {RATING.aspectMinRaters} orang belum diberi angka.</p>
          <div className="vr-aspects">{rating.aspects.map(a => <div key={a.key} className="vr-aspect">
            <span>{a.label}</span>
            {a.average === null
              ? <small>Belum cukup ({a.raters} orang)</small>
              : <><span className="vr-bar" aria-hidden="true"><i style={{ width: `${(a.average / 5) * 100}%` }}/></span><strong>{formatScore(a.average)}</strong></>}
          </div>)}</div>
          {rating.distribution
            ? <><h3>Sebaran nilai</h3><div className="vr-dist" aria-label="Sebaran nilai keseluruhan">{[5, 4, 3, 2, 1].map(star => <div key={star}><span>{star}</span><span className="vr-bar" aria-hidden="true"><i style={{ width: `${rating.distribution![star - 1]}%` }}/></span><small>{rating.distribution![star - 1]}%</small></div>)}</div></>
            : <p className="vr-fine">Sebaran nilai tampil setelah 10 pengunjung menilai.</p>}
        </> : <div className="vr-p-empty">
          <p className="vr-p-empty-title">Belum ada skor</p>
          <p>Skor muncul setelah 3 pengunjung menilai. Sampai saat itu kami tidak menampilkan angka apa pun.</p>
        </div>}
      </div>
    </div>

    {rating.latest.length > 0 && <div className="vr-reviews">
      <h3>Ulasan terbaru</h3>
      <p className="vr-fine">Dari yang terbaru. Semua sudah dicek dengan cara yang sama, baik nilai bagus maupun jelek.</p>
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
      {rating.plaque && <div className="vr-p-note"><BadgeCheck size={20} aria-hidden="true"/><p><strong>Plakat resmi: <Link href={`/plakat/${rating.plaque.serial}`}>{rating.plaque.serial}</Link> ({plaqueStateLabel[rating.plaque.state]})</strong>Kalau nomor plakat di lokasi berbeda atau sudah lewat masa berlakunya, jangan dijadikan acuan.</p></div>}
      <div className="vr-p-note"><ShieldCheck size={20} aria-hidden="true"/><p><strong>Skor ini tidak dibayar</strong>Pemilik tidak bisa membeli skor, mengatur urutan, atau menghapus ulasan.</p></div>
      <div className="vr-p-note is-lime"><QrCode size={20} aria-hidden="true"/><p><strong>Pernah ke sini?</strong>Pindai QR VisitGarut di kasir atau meja. Link untuk menilai dikirim lewat WhatsApp {RATING.inviteDelayMinutes / 60} jam kemudian.</p></div>
    </div>

    {peers.length > 0 && <div className="vr-p-peers"><h3>Bandingkan dengan {sectors[rating.sector].label.toLocaleLowerCase('id-ID')} lain</h3><TopList rows={peers} compact/></div>}
    <p className="vr-fine">Skor dari ulasan pengunjung, bukan sertifikasi pemerintah.</p>
  </section>
}
