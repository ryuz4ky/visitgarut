import Link from 'next/link'
import { Shell } from '@/components/mvp/Shell'
export const metadata={title:'Community Pulse — Cara Membaca Percakapan dan Sentimen',description:'Cara VisitGarut mengkurasi komentar, menghitung sentimen dan topik, serta menampilkan sumber pendukung tanpa memastikan keaslian yang belum terbukti.',alternates:{canonical:'/community-pulse/metode'}}
export default function Method(){return <Shell><article className="vg-wrap vg-section vg-reading">
 <span className="vg-eyebrow">COMMUNITY PULSE</span><h1>Ringkasan yang bisa kamu telusuri.</h1>
 <p className="vg-intro">Lihat topik yang paling sering dibahas tentang suatu tempat, lalu klik topik untuk membaca komentar pendukung dari platform yang tercakup.</p>
 <h2>Ringkasan dan komentar dalam satu klik</h2>
 <p>Bagian utama menampilkan ringkasan pendek, distribusi sentimen, dan maksimal lima topik utama. Setiap kartu menunjukkan proporsi pembahasan topik dan kecenderungan sentimen di dalam topik tersebut. Dialog langsung menampilkan komentar terkait dari semua platform yang masuk sampel, diurutkan terbaru dahulu. Filter platform dan sentimen bersifat opsional.</p>
 <h2>Sampel yang dipakai</h2>
 <p>Kontribusi harus disetujui, memiliki dasar penggunaan untuk analisis, sesuai dengan lokasi, memiliki identitas sumber yang dapat dibedakan, dan belum kedaluwarsa. Sampel menggunakan 90 hari terakhir, dari maksimal 1.000 kontribusi terbaru yang memenuhi kueri publikasi per tempat. Tanggal komentar tidak dinyatakan sebagai tanggal kunjungan.</p>
 <p>Untuk ringkasan utama, satu identitas akun diwakili komentar terbarunya yang memiliki topik dan sentimen terkurasi. Jika teks sepanjang minimal 80 karakter sama persis setelah normalisasi huruf dan spasi, salinannya dihitung sekali. Kesamaan topik atau pengalaman dari akun berbeda tidak dianggap duplikat. Akun lintas platform tidak otomatis dianggap satu orang atau terbukti sebagai orang yang berbeda.</p>
 <h2>Dua persentase yang berbeda</h2>
 <p>Persentase pembahasan topik adalah jumlah komentar dalam sampel yang membahas topik itu dibagi seluruh komentar dalam sampel ringkasan. Satu komentar bisa membahas beberapa topik, sehingga jumlah persentase topik dapat melebihi 100%.</p>
 <p>Sentimen keseluruhan memakai klasifikasi positif, negatif, netral, dan campuran dari sampel yang sama. Persentasenya berjumlah 100% setelah pembulatan. Sentimen di dalam kartu topik memakai klasifikasi topik tersebut: banyak membahas akses tidak otomatis berarti banyak mengeluhkan akses.</p>
 <p>Persentase baru ditampilkan setelah minimal 10 komentar dari identitas akun berbeda. Di bawah ambang itu, jumlah komentar tetap dapat dibaca. Ini ambang penyajian untuk sampel awal, bukan jaminan bahwa sampel mewakili semua pengunjung.</p>
 <h2>Relevansi dan konteks</h2>
 <p>Komentar dibaca bersama konteks unggahan dan, bila perlu, komentar induknya. Pujian terhadap musik atau kreator, promosi yang tidak terkait, dan pembahasan lokasi lain tidak menjadi pengalaman tentang tempat ini. Pertanyaan, informasi, dugaan, dan pengalaman pribadi harus dibedakan saat kurasi. Detail kondisi tidak disimpulkan hanya dari judul video.</p>
 <p>Judul ringkasan saat ini mengikuti topik dan sentimen yang sudah dikurasi. Sistem tidak mengarang detail seperti kondisi jalan, kebersihan toilet, atau tarif yang tidak didukung komentar. Kritik yang relevan tetap dihitung.</p>
 <h2>Kapan topik dapat diringkas?</h2>
 <p>Topik biasa membutuhkan minimal tiga identitas sumber berbeda dalam sampel. Laporan tentang keamanan atau penawaran biaya tidak resmi memerlukan minimal enam identitas, dua sumber konten, dan catatan pemeriksaan konteks. Pemeriksaan ini diterapkan kembali setelah penghapusan kontribusi berulang. Laporan yang belum memenuhi syarat tidak dibuka melalui ringkasan maupun dialognya.</p>
 <p>Kecukupan sampel tidak menjamin setiap pernyataan benar. Laporan komunitas tidak dinyatakan sebagai temuan kriminal atau pelanggaran oleh VisitGarut.</p>
 <h2>Review nyata atau bot?</h2>
 <p>VisitGarut belum memberikan sertifikasi bahwa penulis adalah manusia, bahwa kunjungannya terjadi, atau bahwa komentarnya pasti benar. Pola salinan dan pengulangan merupakan petunjuk kualitas data, bukan bukti pasti akun bot. Komentar yang tampak wajar juga belum membuktikan keaslian kunjungan. Saat bukti tidak cukup, status tetap belum dapat dipastikan.</p>
 <p>Dialog “Cara komentar dipilih” menjelaskan kontribusi berulang, salinan teks, dan klasifikasi yang belum lengkap jika hitungannya tersedia. Identitas internal serta catatan pemeriksaan privat tidak ditampilkan.</p>
 <h2>Cakupan platform dan izin penggunaan</h2>
 <p>Cakupan mengikuti sumber yang benar-benar berhasil dikumpulkan dan boleh dianalisis. Tidak ada klaim mencakup seluruh video, platform, atau percakapan internet. Platform yang belum terhubung tidak masuk persentase. Rating Google Maps, catatan riset, dan video tidak digabung menjadi rating buatan.</p>
 <p>Pengumpulan YouTube mencari kandidat lintas video berdasarkan nama dan alias lokasi, lalu memeriksa kecocokannya. Komentar asli yang disetujui untuk publikasi dapat dibaca per video. Teks, kreator, tanggal, dan angka suka berasal dari YouTube API. Publikasi komentar asli terpisah dari izin analisis; data YouTube tidak dimasukkan ke ringkasan sebelum dasar analisis dan syarat lainnya terpenuhi. Balasan ditampilkan bersama komentar induk yang disetujui. Data diperbarui atau dihapus dalam 29 hari.</p>
 <h2>Info praktis dan penilaian pengunjung</h2>
 <p>Catatan dari instansi, pengelola, liputan, dan direktori tetap tersedia pada “Info praktis dari sumber publik”. Setiap catatan menyertakan penerbit, tautan, tanggal sumber bila ada, tanggal pemeriksaan, dan batasannya. Pemeriksaan daring bukan kunjungan lapangan; informasi pengelola dapat bersifat promosi. Catatan ini tidak masuk persentase sentimen.</p>
 <p>Nilai aspek 1–5 hanya berasal dari penilaian yang dikirim melalui VisitGarut, bukan hasil menebak nilai dari teks komentar platform lain. Rata-rata memerlukan minimal tiga identitas sumber yang diperiksa. Aspek keamanan memerlukan minimal enam dan catatan pemeriksaan seluruh sumber.</p>
 <h2>Koreksi dan penarikan</h2>
 <p>Gunakan tombol laporan pada halaman tempat atau komentar untuk melaporkan salah lokasi, duplikasi, konteks yang hilang, atau meminta penarikan. Kontribusi dapat disembunyikan dan ringkasannya dihitung ulang.</p>
 <p><Link className="vg-button" href="/search">Temukan tempat di Garut</Link> · <Link href="/privasi">Privasi</Link> · <Link href="/ketentuan">Ketentuan penggunaan</Link></p>
 </article></Shell>}
