import Link from 'next/link'
import { notFound } from 'next/navigation'
import { QrCode, MessageSquareReply, BarChart3, BadgeCheck, Ban, ShieldAlert } from 'lucide-react'
import { Shell } from '@/components/mvp/Shell'
import ApplyForm from '@/components/rating/ApplyForm'
import { PreviewNote } from '@/components/rating/bits'
import { categories } from '@/lib/mvp/categories'
import { RATING } from '@/lib/rating/core'
import { ratingPreviewNote, ratingVisible } from '@/lib/rating/server'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Untuk pemilik usaha — VisitGarut Rating', description: 'Plat QR gratis untuk usaha di Garut. Skor dari pengunjung yang benar-benar datang, tidak bisa dibeli.', alternates: { canonical: '/untuk-usaha' } }

export default async function UntukUsaha() {
  if (!(await ratingVisible())) notFound()
  return <Shell><main className="vr-biz" id="konten-utama">
    <PreviewNote note={ratingPreviewNote()}/>
    <section className="vr-biz-hero">
      <p className="vr-eyebrow">Untuk pemilik usaha di Garut</p>
      <h1>Skor bagus layak dipajang.</h1>
      <p className="vr-lead">Rumah makan, kafe, penginapan, tempat wisata, toko oleh-oleh, rental, sampai jasa: semua dinilai dengan aturan yang sama, oleh pengunjung yang benar-benar datang.</p>
      <a className="vg-pill-cta" href="#daftar">Daftarkan usaha<span className="vg-pill-cta-icon" aria-hidden="true">→</span></a>
    </section>

    <section className="vr-biz-grid" aria-label="Yang Anda dapat">
      <div><span><QrCode size={22} aria-hidden="true"/></span><h2>Plat QR gratis</h2><p>Plat “Titik Ulasan” dipasang petugas di kasir atau meja. Plat tidak memuat angka; fungsinya hanya memulai check-in.</p></div>
      <div><span><MessageSquareReply size={22} aria-hidden="true"/></span><h2>Hak jawab</h2><p>Setiap ulasan bisa Anda tanggapi secara resmi di halaman usaha Anda.</p></div>
      <div><span><BarChart3 size={22} aria-hidden="true"/></span><h2>Masukan per aspek</h2><p>Lihat aspek mana yang dipuji dan mana yang perlu diperbaiki, sesuai sektor usaha Anda.</p></div>
      <div><span><BadgeCheck size={22} aria-hidden="true"/></span><h2>Plakat skor</h2><p>Hanya untuk label Keyakinan tinggi (15+ penilai). Bernomor seri, berlaku {RATING.plaqueValidMonths} bulan, dan QR-nya selalu menunjukkan status terkini. Biaya cetak diinformasikan saat skor Anda lolos ambang.</p></div>
    </section>

    <section className="vr-biz-rules">
      <div className="vr-card">
        <h2><Ban size={20} aria-hidden="true"/>Yang tidak bisa dibeli</h2>
        <ul><li>Skor dan label keyakinan</li><li>Urutan di peringkat sektor</li><li>Penghapusan ulasan, termasuk ulasan buruk</li></ul>
        <p className="vr-fine">Ulasan hanya ditolak bila bukan pengalaman kunjungan, menyerang pribadi atau menyebut nama staf, memuat data pribadi, ditulis orang dalam, atau terbukti dibeli. Aturan ini sama untuk ulasan baik dan buruk.</p>
      </div>
      <div className="vr-card">
        <h2><ShieldAlert size={20} aria-hidden="true"/>Kewajiban usaha</h2>
        <ul><li>Plat dipasang di tempat yang terlihat semua pengunjung, tidak disembunyikan atau hanya disodorkan ke pelanggan tertentu.</li><li>Tidak menawarkan diskon, hadiah, atau imbalan untuk ulasan.</li><li>Mendaftarkan nomor pemilik, staf, dan keluarga sebagai orang dalam: nomor itu tidak bisa menilai usaha Anda.</li></ul>
        <p className="vr-fine">Pelanggaran membuat plakat ditangguhkan atau dicabut, dan status itu terlihat publik di halaman cek plakat.</p>
      </div>
    </section>

    <section className="vr-biz-steps" aria-labelledby="vr-steps-title">
      <h2 id="vr-steps-title">Dari daftar sampai skor tampil</h2>
      <ol>
        <li><b>1</b><div><strong>Daftar</strong><p>Isi formulir di bawah. Tim menghubungi lewat WhatsApp untuk verifikasi.</p></div></li>
        <li><b>2</b><div><strong>Verifikasi &amp; orang dalam</strong><p>Kami cocokkan usaha dengan lokasinya, lalu Anda mendaftarkan nomor orang dalam.</p></div></li>
        <li><b>3</b><div><strong>Plat dipasang</strong><p>Petugas memasang plat dan mencatat posisinya. Plat diaudit berkala.</p></div></li>
        <li><b>4</b><div><strong>Pengunjung menilai</strong><p>Skor tampil setelah minimal 3 penilai independen dalam 12 bulan.</p></div></li>
      </ol>
    </section>

    <section className="vr-biz-apply" id="daftar" aria-labelledby="vr-apply-title">
      <div><h2 id="vr-apply-title">Daftarkan usaha</h2><p className="vr-lead">Gratis. Tidak ada paket berbayar yang memengaruhi skor.</p><p className="vr-fine"><Link href="/rating/metode">Baca metode lengkap</Link></p></div>
      <ApplyForm categories={categories.map(c => ({ slug: c.slug, name: c.name }))}/>
    </section>
  </main></Shell>
}
