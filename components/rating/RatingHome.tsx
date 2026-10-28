import Link from 'next/link'
import { ArrowUpRight, BadgeCheck, CircleHelp, QrCode, ShieldCheck, ScanLine, MessageCircle, UserCheck, Gauge, Search } from 'lucide-react'
import { RATING } from '@/lib/rating/core'
import SectorBoard, { type BoardTab } from './SectorBoard'
import { TierPill } from './bits'

type Stats = { reviewers: number; reviews: number; scoredPlaces: number }

export function RatingPromises() {
  return <section className="vh-principles vr-promises" aria-label="Janji VisitGarut Rating">
    <div><span><QrCode size={22} aria-hidden="true"/></span><h3>Yang menilai benar-benar datang</h3><p>Check-in lewat QR di lokasi, dan satu orang hanya dihitung sekali.</p></div>
    <div><span><ShieldCheck size={22} aria-hidden="true"/></span><h3>Tidak bisa dibeli</h3><p>Pemilik tidak bisa membayar untuk menaikkan skor atau menghapus ulasan.</p></div>
    <div><span><CircleHelp size={22} aria-hidden="true"/></span><h3>Tidak ada angka asal</h3><p>Kalau penilainya belum cukup, kami tulis apa adanya.</p></div>
  </section>
}

export function CheckScoreForm({ dark = false }: { dark?: boolean }) {
  return <form action="/search" className={dark ? 'vr-check-form is-dark' : 'vr-check-form'} role="search">
    <Search size={20} aria-hidden="true"/>
    <label className="sr-only" htmlFor="vr-check-q">Cari tempat di Garut</label>
    <input id="vr-check-q" name="q" maxLength={120} placeholder="Nama tempat, warung, hotel, toko…"/>
    <button type="submit">Cek skor</button>
  </form>
}

const chips = <ul className="vr-promise-chips">
  <li><QrCode size={15} aria-hidden="true"/>Penilai benar-benar datang</li>
  <li><ShieldCheck size={15} aria-hidden="true"/>Tidak bisa dibeli</li>
  <li><CircleHelp size={15} aria-hidden="true"/>Tidak ada angka asal</li>
</ul>

const steps = <ol className="vr-flow-steps">
  <li><span><ScanLine size={20} aria-hidden="true"/></span><div><strong>Pindai QR di lokasi</strong><p>Ada di kasir atau meja. Cukup nomor WhatsApp, tanpa bikin akun.</p></div></li>
  <li><span><MessageCircle size={20} aria-hidden="true"/></span><div><strong>Dapat link menilai</strong><p>Dikirim VisitGarut {RATING.inviteDelayMinutes / 60} jam kemudian ke semua yang check-in, bukan dipilih pemilik.</p></div></li>
  <li><span><UserCheck size={20} aria-hidden="true"/></span><div><strong>Dicek dulu</strong><p>Nilai dari pemilik, staf, atau nomor yang sama tidak dihitung. Nilai bagus dan jelek dicek dengan cara yang sama.</p></div></li>
  <li><span><BadgeCheck size={20} aria-hidden="true"/></span><div><strong>Skor muncul</strong><p>Ulasan baru lebih berbobot daripada yang lama, jadi skor ikut naik atau turun kalau pelayanannya berubah.</p></div></li>
</ol>

const ownerCta = <Link className="vg-pill-cta is-dark" href="/untuk-usaha">Minta plat QR gratis<span className="vg-pill-cta-icon"><ArrowUpRight size={18} aria-hidden="true"/></span></Link>

/** Before any place has a score: one compact block, no empty leaderboard. */
function RatingTeaser() {
  return <section className="vr-flow-wrap vr-teaser" aria-labelledby="vr-flow-title"><div className="vr-flow">
    <div className="vr-flow-inner">
      <div className="vr-flow-copy">
        <span className="vr-flow-chip"><Gauge size={15} aria-hidden="true"/>Baru dimulai</span>
        <h2 id="vr-flow-title">Nilai dari tamu<br/>yang benar-benar datang.</h2>
        <p>Kami sedang memasang plat QR di warung, kafe, penginapan, dan tempat wisata di Garut. Begitu 3 pengunjung menilai sebuah tempat, skornya muncul di sini.</p>
        <div className="vr-teaser-ctas">{ownerCta}<Link className="vr-teaser-link" href="/rating/metode">Cara skor dihitung</Link></div>
      </div>
      {steps}
    </div>
  </div></section>
}

export default function RatingHome({ tabs, stats }: { tabs: BoardTab[]; stats: Stats }) {
  if (stats.scoredPlaces === 0) return <RatingTeaser/>
  return <>
    <section className="vr-home-board" aria-labelledby="vr-top-title">
      <div className="vr-home-head">
        <div><span className="vg-eyebrow">NILAI PENGUNJUNG</span><h2 id="vr-top-title">Paling disukai pengunjung</h2>{chips}</div>
        <p>{stats.scoredPlaces} tempat sudah punya skor dari {stats.reviewers} pengunjung dalam 12 bulan terakhir. Tiap tempat hanya dibandingkan dengan yang sejenis.</p>
      </div>
      <SectorBoard tabs={tabs}/>
    </section>

    <section className="vr-flow-wrap" aria-labelledby="vr-flow-title"><div className="vr-flow">
      <div className="vr-flow-inner">
        <div className="vr-flow-copy"><span className="vr-flow-chip"><Gauge size={15} aria-hidden="true"/>Cara kerjanya</span><h2 id="vr-flow-title">Dari kunjungan<br/>sampai skor.</h2><p>Setiap skor berasal dari kunjungan nyata. Rumusnya terbuka dan sama untuk semua usaha.</p><Link className="vg-pill-cta" href="/rating/metode">Cara skor dihitung<span className="vg-pill-cta-icon"><ArrowUpRight size={18} aria-hidden="true"/></span></Link></div>
        {steps}
      </div>
    </div></section>

    <section className="vr-tiers-wrap" aria-labelledby="vr-tiers-title">
      <div className="vr-home-head"><div><span className="vg-eyebrow">LABEL DI SAMPING SKOR</span><h2 id="vr-tiers-title">Skor dari 4 orang beda dengan skor dari 40 orang.</h2></div><p>Karena itu setiap skor selalu ditemani labelnya.</p></div>
      <div className="vr-tiers">
        <div><TierPill tier="tinggi"/><p>15 pengunjung atau lebih. Bisa dapat plakat.</p></div>
        <div><TierPill tier="terverifikasi"/><p>10–14 pengunjung. Sebaran nilainya ikut tampil.</p></div>
        <div><TierPill tier="awal"/><p>3–9 pengunjung. Masih bisa banyak berubah.</p></div>
        <div><TierPill tier="kurang"/><p>Kurang dari 3 pengunjung. Belum ada angka.</p></div>
      </div>
    </section>

    <section className="vh-duo vr-home-duo">
      <div className="vh-color is-sage vr-plaque-check">
        <span className="vh-color-kicker">Plakat di pintu</span>
        <h2>Lihat plakat skor? Cek keasliannya.</h2>
        <p>Plakat asli punya nomor seri dan berlaku {RATING.plaqueValidMonths} bulan. Kalau nomornya tidak ditemukan atau sudah kedaluwarsa, jangan dijadikan acuan.</p>
        <form action="/plakat" className="vr-serial-form">
          <label htmlFor="vr-serial">Nomor plakat</label>
          <div><input id="vr-serial" name="serial" placeholder="VG-26-00001" pattern="[Vv][Gg]-?\d{2}-?\d{5}" maxLength={12} autoCapitalize="characters" required/><button type="submit">Cek</button></div>
        </form>
      </div>
      <div className="vh-color is-lime">
        <span className="vh-color-kicker">Untuk pemilik usaha</span>
        <h2>Pelayanan bagus pantas dipajang.</h2>
        <p>Plat QR gratis untuk semua usaha di Garut. Tamu yang benar-benar datang yang menilai, dan skor yang cukup kuat bisa Anda pajang di pintu.</p>
        {ownerCta}
      </div>
    </section>
  </>
}
