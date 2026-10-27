import Link from 'next/link'
import { formatScore, sectors, tierLabels } from '@/lib/rating/core'
import RatingBadge, { type PlaceRating } from './RatingBadge'

const evidenceLabel = { receipt: 'Check-in + bukti bayar', qr_geo: 'Check-in di lokasi', otp_only: 'Check-in tanpa lokasi' } as const
const month = (d: Date) => d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })

/** Public rating section on a place page. Shows no number until 3 independent reviewers, as the methodology says. */
export default function RatingPanel({ rating }: { rating: PlaceRating }) {
  return <section className="vp-card vr-panel" id="rating" aria-labelledby="rating-title">
    <div className="vr-panel-head">
      <div><p className="vr-eyebrow">VisitGarut Rating · {sectors[rating.sector].label}</p><h2 id="rating-title">Nilai dari pengunjung terverifikasi</h2></div>
      <RatingBadge rating={rating}/>
    </div>
    {rating.unusual && <p className="vr-alert">Aktivitas ulasan tidak wajar terdeteksi minggu ini. Ulasan baru ditahan sampai diperiksa.</p>}
    {rating.tier === 'kurang'
      ? <p>Belum cukup penilai untuk menampilkan angka (minimal 3 orang dalam 12 bulan). Pernah ke sini? Pindai plat QR VisitGarut di lokasi untuk check-in.</p>
      : <>
        <div className="vr-aspects">{rating.aspects.map(a => <div key={a.key} className="vr-aspect">
          <span>{a.label}</span>
          {a.average === null
            ? <small>Belum cukup ({a.raters} penilai)</small>
            : <><span className="vr-bar" aria-hidden="true"><i style={{ width: `${(a.average / 5) * 100}%` }}/></span><strong>{formatScore(a.average)}</strong></>}
        </div>)}</div>
        {rating.distribution && <div className="vr-dist" aria-label="Sebaran nilai keseluruhan">{[5, 4, 3, 2, 1].map(star => <div key={star}><span>{star}</span><span className="vr-bar" aria-hidden="true"><i style={{ width: `${rating.distribution![star - 1]}%` }}/></span><small>{rating.distribution![star - 1]}%</small></div>)}</div>}
      </>}
    {rating.latest.length > 0 && <div className="vr-reviews">
      <h3>Ulasan terbaru</h3>
      {rating.latest.slice(0, 5).map(r => <article key={r.id} className="vr-review">
        <header><strong>{r.displayName}</strong><span>{evidenceLabel[r.evidence]} · {month(r.month)}</span><b className="vr-mini-score">{r.overall}</b></header>
        {r.body && <p>{r.body}</p>}
        {r.reply && <p className="vr-reply"><strong>Tanggapan pengelola:</strong> {r.reply}</p>}
      </article>)}
    </div>}
    <p className="vr-fine">{tierLabels[rating.tier]}. Skor dihitung otomatis dari ulasan 12 bulan terakhir dan tidak bisa dibeli atau diubah oleh siapa pun. {rating.plaque && <>Plakat resmi: <Link href={`/plakat/${rating.plaque.serial}`}>{rating.plaque.serial}</Link> ({rating.plaque.state}).</>} <Link href="/rating/metode">Cara skor dihitung</Link></p>
  </section>
}
