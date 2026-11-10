import Link from 'next/link'
import { Shell, JsonLd } from '@/components/mvp/Shell'
import FaqBlock from '@/components/mvp/Faq'
import { directorySummary } from '@/lib/mvp/data'
import { absoluteUrl } from '@/lib/site'
import { organization } from '@/lib/mvp/org'
import { ratingEnabled } from '@/lib/rating/server'
import type { Faq } from '@/lib/mvp/faq'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tentang VisitGarut', description: 'VisitGarut adalah direktori independen untuk merencanakan kunjungan ke Kabupaten Garut, dikelola oleh Sorotnamedia. Cara kami memeriksa informasi dan menjaga independensi.', alternates: { canonical: '/tentang' } }

export default async function Tentang() {
  const summary = await directorySummary().catch(() => ({ total: 0, districts: [] as string[] }))
  const count = summary.total
  const rating = ratingEnabled()
  const faq: Faq[] = [
    { q: 'Siapa yang mengelola VisitGarut?', a: 'VisitGarut dikelola oleh Sorotnamedia sebagai direktori independen tentang Kabupaten Garut, Jawa Barat. VisitGarut bukan situs resmi pemerintah daerah maupun milik pengelola tempat wisata.' },
    { q: 'Dari mana informasi di VisitGarut berasal?', a: 'Dari sumber yang bisa diperiksa, seperti situs dan akun resmi pengelola serta panduan pariwisata. Setiap halaman tempat menyebut sumbernya dan tanggal pemeriksaan. Informasi yang belum pasti ditandai "perlu konfirmasi".' },
    { q: 'Apakah pemilik usaha bisa membayar agar tampil lebih atas?', a: 'Tidak. Urutan di direktori, peringkat, dan skor dari pengunjung tidak bisa dibeli. Ulasan juga tidak bisa dihapus atas permintaan usaha.' },
    { q: 'Bagaimana jika ada informasi yang salah?', a: 'Kirim koreksi lewat bagian "Info di sini tidak sesuai?" di halaman tempat. Laporan diperiksa dulu sebelum informasi yang tampil diubah.' },
  ]
  return <Shell>
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'AboutPage', url: absoluteUrl('/tentang'), name: 'Tentang VisitGarut', inLanguage: 'id-ID', mainEntity: organization() }}/>
    <article className="vg-wrap vg-section vg-reading" id="konten-utama">
      <span className="vg-eyebrow">TENTANG</span>
      <h1>Tentang VisitGarut</h1>
      <p className="vg-intro">VisitGarut adalah direktori independen untuk merencanakan kunjungan ke Kabupaten Garut, Jawa Barat: tempat wisata, penginapan, kuliner, cafe, rental kendaraan, dan usaha lokal. VisitGarut dikelola oleh Sorotnamedia.</p>
      {count > 0 && <p>Saat ini {count} tempat{summary.districts.length ? ` di ${summary.districts.length} kecamatan` : ''} sudah terbit di direktori, dan jumlahnya bertambah setelah setiap tempat diperiksa.</p>}
      <h2>Yang bisa kamu lakukan di sini</h2>
      <ul>
        <li><Link href="/wisata">Membandingkan tempat</Link> berdasarkan wilayah, biaya, dan kecocokan untuk rombongan.</li>
        <li><Link href="/trip">Menyusun rencana perjalanan</Link> lengkap dengan perkiraan biaya dan waktu pulang.</li>
        <li><Link href="/community-pulse">Membaca cerita dan video publik</Link> tentang sebuah tempat, dengan tautan ke sumber aslinya.</li>
        {rating && <li><Link href="/rating/metode">Melihat nilai dari pengunjung</Link> yang check-in langsung di lokasi.</li>}
      </ul>
      <h2 id="cara-memeriksa">Cara kami memeriksa informasi</h2>
      <ul>
        <li>Tarif, jam buka, dan catatan kunjungan selalu menyebut sumber dan tanggal pemeriksaan.</li>
        <li>Tarif yang diperiksa lebih dari 30 hari lalu ditandai perlu konfirmasi ulang, tidak ditampilkan sebagai harga terkini.</li>
        <li>Informasi yang belum pasti ditulis apa adanya: "perlu konfirmasi", bukan angka tebakan.</li>
        <li>Koreksi dari pengunjung dan pengelola diperiksa dulu sebelum mengubah informasi yang tampil.</li>
      </ul>
      <h2 id="sumber">Sumber yang kami pakai</h2>
      <ul>
        <li><strong>Pengelola tempat:</strong> situs resmi, akun media sosial resmi, dan nomor kontak yang dicantumkan pengelola sendiri.</li>
        <li><strong>Panduan dan publikasi pariwisata</strong> yang bisa dibuka ulang; tautannya dicantumkan di halaman yang memakainya.</li>
        <li><strong>Google Maps</strong> hanya untuk memastikan sebuah tempat ada dan berada di desa atau kecamatan mana. Ulasan, foto, jam buka, rating, nomor telepon, dan koordinat dari Google Maps tidak kami salin.</li>
        <li><strong>Foto</strong> dari Wikimedia Commons dengan lisensi bebas, selalu dengan nama fotografer dan lisensinya di <Link href="/kredit-foto">kredit foto</Link>. Bila belum ada foto bebas dari tempat itu sendiri, kami memakai foto kawasan sekitar atau foto arsip dan menandainya dengan jelas.</li>
      </ul>
      <h2 id="belum-lengkap">Halaman yang belum lengkap</h2>
      <p>Sebagian tempat baru kami cek keberadaan dan lokasinya, belum menu, harga, atau fasilitasnya. Halaman seperti ini menyebut hal itu secara terbuka, dan tidak kami ajukan ke mesin pencari sampai ada informasi tambahan dari pengelola atau pemeriksaan langsung. Daftar per wilayah ada di halaman <Link href="/kecamatan">Garut per kecamatan</Link>.</p>
      <h2 id="independensi">Independensi</h2>
      <p>VisitGarut tidak menjual posisi di direktori, peringkat, atau skor. {rating ? <>Skor VisitGarut Rating hanya berasal dari pengunjung yang check-in di lokasi; metodenya terbuka di <Link href="/rating/metode">halaman metode</Link>.</> : null} Cara kami membaca percakapan publik dijelaskan di <Link href="/community-pulse/metode">metode Community Pulse</Link>.</p>
      <h2 id="koreksi">Koreksi</h2>
      <p>Bila ada informasi yang salah atau sudah berubah, gunakan bagian "Info di sini tidak sesuai?" di halaman tempat itu. Pengelola usaha bisa mengirim koreksi dengan cara yang sama. Setiap laporan kami periksa dulu sebelum informasi yang tampil diubah.</p>
      <FaqBlock id="tanya-jawab" card={false} title="Tanya jawab" items={faq}/>
      <p><small>Lihat juga <Link href="/privasi">privasi</Link>, <Link href="/ketentuan">ketentuan</Link>, dan <Link href="/kredit-foto">kredit foto</Link>.</small></p>
    </article>
  </Shell>
}
