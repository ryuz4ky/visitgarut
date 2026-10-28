import { notFound } from 'next/navigation'
import { Shell } from '@/components/mvp/Shell'
import { RATING, evidenceWeight, sectors, coreAspects } from '@/lib/rating/core'
import { ratingVisible } from '@/lib/rating/server'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Metode & integritas VisitGarut Rating', description: 'Cara skor VisitGarut dihitung, kapan skor tampil, dan apa yang tidak bisa dibeli.', alternates: { canonical: '/rating/metode' } }

// Numbers below are read from lib/rating/core.ts, so this page cannot drift from the code that computes scores.
export default async function Metode() {
  if (!(await ratingVisible())) notFound()
  return <Shell><main className="vr-wrap vr-doc" id="konten-utama">
    <p className="vr-eyebrow">VisitGarut Rating</p>
    <h1>Metode &amp; integritas</h1>
    <p className="vr-lead">Skor VisitGarut adalah rata-rata nilai pengunjung terverifikasi selama 12 bulan terakhir, dihaluskan dengan rata-rata sektornya. Rumusnya dipublikasikan dan tidak bisa diubah manual oleh siapa pun, termasuk tim VisitGarut.</p>
    <h2>Rumus</h2>
    <p className="vr-formula">Skor = (m × C + Σ wᵢ × rᵢ) ÷ (m + Σ wᵢ)</p>
    <ul>
      <li>r = nilai keseluruhan 1–5; C = rata-rata sektor (nilai awal {RATING.defaultPrior.toLocaleString('id-ID')} sampai sektor punya {RATING.minSectorReviewsForPrior} ulasan); m = {RATING.priorWeight}.</li>
      <li>Bobot ulasan berkurang separuh setiap {RATING.halfLifeDays} hari; ulasan di atas {RATING.maxAgeDays} hari tidak dihitung.</li>
      <li>Bobot bukti kunjungan: check-in + bukti bayar {evidenceWeight.receipt.toLocaleString('id-ID')}, check-in di lokasi {evidenceWeight.qr_geo.toLocaleString('id-ID')}, check-in tanpa lokasi {evidenceWeight.otp_only.toLocaleString('id-ID')}.</li>
      <li>Satu nomor WhatsApp dihitung sekali per usaha per {RATING.repeatDays} hari. Nomor pemilik dan staf diblokir untuk usahanya.</li>
    </ul>
    <h2>Kapan skor tampil</h2>
    <table className="vr-table"><thead><tr><th>Penilai independen (12 bulan)</th><th>Label</th><th>Yang tampil</th></tr></thead><tbody>
      <tr><td>0–2</td><td>Belum cukup penilai</td><td>Tidak ada angka</td></tr>
      <tr><td>3–9</td><td>Skor awal</td><td>Skor dan jumlah penilai</td></tr>
      <tr><td>10–14</td><td>Terverifikasi</td><td>Skor dan sebaran nilai dalam persen</td></tr>
      <tr><td>15+ dari 2 jenis bukti</td><td>Keyakinan tinggi</td><td>Skor lengkap; boleh memesan plakat</td></tr>
    </tbody></table>
    <p>Aspek dengan kurang dari {RATING.aspectMinRaters} penilai tidak diberi angka. Peringkat hanya dibandingkan di dalam sektor yang sama.</p>
    <h2>Aspek per sektor</h2>
    <p>Semua sektor menilai keseluruhan, {coreAspects.map(a => a.label.toLowerCase()).join(', ')}.</p>
    <table className="vr-table"><thead><tr><th>Sektor</th><th>Aspek khusus</th></tr></thead><tbody>
      {Object.entries(sectors).map(([key, s]) => <tr key={key}><td>{s.label}</td><td>{s.aspects.map(a => a.label).join(', ')}</td></tr>)}
    </tbody></table>
    <h2>Yang tidak bisa dibeli</h2>
    <ul><li>Skor, peringkat, dan urutan di pencarian.</li><li>Penghapusan, penyembunyian, atau penundaan ulasan.</li><li>Label Keyakinan tinggi dan hak memesan plakat.</li></ul>
    <p>Usaha hanya boleh membayar proses: cetak plakat setelah lolos ambang, dasbor masukan, dan kunjungan ulang yang hasilnya bisa naik atau turun.</p>
    <h2>Label dan sanksi</h2>
    <ul>
      <li>Ulasan dalam 7 hari terakhir lebih dari {RATING.spikeFactor}× rata-rata mingguan sebulan sebelumnya memunculkan label &quot;Aktivitas ulasan tidak wajar&quot;, dan ulasan baru ditahan.</li>
      <li>Usaha yang terbukti membeli atau mengarahkan ulasan mendapat label 90 hari dan plakatnya dicabut.</li>
      <li>Plat QR yang disembunyikan atau hanya diberikan ke pelanggan tertentu membuat plakat ditangguhkan.</li>
    </ul>
    <p>Plakat berlaku {RATING.plaqueValidMonths} bulan dan bernomor seri. Pindai QR plakat untuk melihat statusnya: aktif, kedaluwarsa, ditangguhkan, atau dicabut.</p>
  </main></Shell>
}
