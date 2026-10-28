import Link from 'next/link'
import { ArrowUpRight, BadgeCheck, CircleHelp, QrCode, ShieldCheck, ScanLine, ListChecks, UserCheck, Gauge, Search } from 'lucide-react'
import { RATING } from '@/lib/rating/core'
import SectorBoard, { type BoardTab } from './SectorBoard'
import { TierPill } from './bits'

type Stats = { reviewers: number; reviews: number; scoredPlaces: number }

export function RatingPromises() {
  return <section className="vh-principles vr-promises" aria-label="Janji VisitGarut Rating">
    <div><span><QrCode size={22} aria-hidden="true"/></span><h3>Ada bukti kunjungan</h3><p>Check-in lewat plat QR di lokasi. Undangan menilai dikirim VisitGarut ke semua yang check-in, dan satu orang hanya dihitung sekali.</p></div>
    <div><span><ShieldCheck size={22} aria-hidden="true"/></span><h3>Tidak bisa dibeli</h3><p>Pemilik usaha tidak bisa membayar untuk menaikkan skor, mengatur urutan, atau menghapus ulasan.</p></div>
    <div><span><CircleHelp size={22} aria-hidden="true"/></span><h3>Kurang data? Kami bilang</h3><p>Angka baru tampil setelah minimal 3 penilai independen. Tidak ada angka tebakan.</p></div>
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

export default function RatingHome({ tabs, stats }: { tabs: BoardTab[]; stats: Stats }) {
  return <>
    <section className="vr-home-board" aria-labelledby="vr-top-title">
      <div className="vr-home-head">
        <div><span className="vg-eyebrow">VISITGARUT RATING</span><h2 id="vr-top-title">Nilai tertinggi di Garut</h2>
          <ul className="vr-promise-chips"><li><QrCode size={15} aria-hidden="true"/>Ada bukti kunjungan</li><li><ShieldCheck size={15} aria-hidden="true"/>Tidak bisa dibeli</li><li><CircleHelp size={15} aria-hidden="true"/>Tanpa angka tebakan</li></ul></div>
        <p>{stats.scoredPlaces > 0
          ? <>{stats.scoredPlaces} tempat sudah punya skor dari {stats.reviewers} penilai independen dalam 12 bulan terakhir. Peringkat hanya dibandingkan dalam sektor yang sama.</>
          : <>Rating baru dimulai. Tempat muncul di sini setelah dinilai minimal 3 pengunjung independen. Peringkat hanya dibandingkan dalam sektor yang sama.</>}</p>
      </div>
      <SectorBoard tabs={tabs}/>
    </section>

    <section className="vr-flow-wrap" aria-labelledby="vr-flow-title"><div className="vr-flow">
      <div className="vr-flow-inner">
        <div className="vr-flow-copy"><span className="vr-flow-chip"><Gauge size={15} aria-hidden="true"/>Cara kerjanya</span><h2 id="vr-flow-title">Dari kunjungan<br/>sampai skor.</h2><p>Setiap angka di VisitGarut bisa ditelusuri ke kunjungan nyata. Rumusnya terbuka dan sama untuk semua usaha.</p><Link className="vg-pill-cta" href="/rating/metode">Baca metode lengkap<span className="vg-pill-cta-icon"><ArrowUpRight size={18} aria-hidden="true"/></span></Link></div>
        <ol className="vr-flow-steps">
          <li><span><ScanLine size={20} aria-hidden="true"/></span><div><strong>Datang &amp; check-in</strong><p>Pindai plat QR di kasir atau meja. Nomor WhatsApp diverifikasi, lokasi hanya dicocokkan, tidak disimpan.</p></div></li>
          <li><span><ListChecks size={20} aria-hidden="true"/></span><div><strong>Undangan dari VisitGarut</strong><p>{RATING.inviteDelayMinutes / 60} jam kemudian undangan menilai dikirim ke semua yang check-in, bukan dipilih pemilik.</p></div></li>
          <li><span><UserCheck size={20} aria-hidden="true"/></span><div><strong>Diperiksa moderator</strong><p>Pemilik, staf, dan nomor ganda tidak dihitung. Ulasan baik dan buruk diperiksa dengan aturan yang sama.</p></div></li>
          <li><span><BadgeCheck size={20} aria-hidden="true"/></span><div><strong>Skor tampil</strong><p>Hanya 12 bulan terakhir yang dihitung, ulasan lama makin kecil bobotnya, jadi skor ikut berubah saat kualitas berubah.</p></div></li>
        </ol>
      </div>
    </div></section>

    <section className="vr-tiers-wrap" aria-labelledby="vr-tiers-title">
      <div className="vr-home-head"><div><span className="vg-eyebrow">SEBERAPA YAKIN</span><h2 id="vr-tiers-title">Skor dari 4 orang tidak sama kuatnya dengan 40.</h2></div><p>Label keyakinan selalu tampil di samping angka.</p></div>
      <div className="vr-tiers">
        <div><TierPill tier="tinggi"/><p>15+ penilai independen dari minimal 2 jenis bukti kunjungan. Syarat plakat.</p></div>
        <div><TierPill tier="terverifikasi"/><p>10–14 penilai. Sebaran nilai dalam persen mulai ditampilkan.</p></div>
        <div><TierPill tier="awal"/><p>3–9 penilai. Angka tampil, tapi masih bisa banyak berubah.</p></div>
        <div><TierPill tier="kurang"/><p>Kurang dari 3 penilai. Tidak ada angka sama sekali.</p></div>
      </div>
    </section>

    <section className="vh-duo vr-home-duo">
      <div className="vh-color is-sage vr-plaque-check">
        <span className="vh-color-kicker">Plakat di pintu</span>
        <h2>Lihat plakat skor? Cek dulu.</h2>
        <p>Plakat resmi bernomor seri dan berlaku {RATING.plaqueValidMonths} bulan. Kode yang tidak ditemukan, kedaluwarsa, atau dicabut berarti plakat itu tidak bisa dipercaya.</p>
        <form action="/plakat" className="vr-serial-form">
          <label htmlFor="vr-serial">Nomor plakat</label>
          <div><input id="vr-serial" name="serial" placeholder="VG-26-00001" pattern="[Vv][Gg]-?\d{2}-?\d{5}" maxLength={12} autoCapitalize="characters" required/><button type="submit">Cek</button></div>
        </form>
      </div>
      <div className="vh-color is-lime">
        <span className="vh-color-kicker">Untuk pemilik usaha</span>
        <h2>Skor bagus layak dipajang.</h2>
        <p>Plat QR gratis untuk semua usaha di Garut. Pengunjung yang benar-benar datang menilai, dan skor yang lolos ambang bisa jadi bukti di pintu Anda.</p>
        <Link className="vg-pill-cta is-dark" href="/untuk-usaha">Cara mendapatkan plat QR<span className="vg-pill-cta-icon"><ArrowUpRight size={18} aria-hidden="true"/></span></Link>
      </div>
    </section>
  </>
}
