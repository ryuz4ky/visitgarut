import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/mvp/auth'
import { db } from '@/lib/mvp/db'
import { absoluteUrl } from '@/lib/site'
import Qr from '@/components/rating/Qr'
import PrintButton from '@/components/rating/PrintButton'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Cetak plat QR — Admin', robots: { index: false, follow: false } }

/** Printable "Titik Ulasan" plate (A6). Carries no score: it only starts a check-in. */
export default async function CetakPlat({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id < 1) notFound()
  const plate = (await db().query('SELECT pl.*,p.name FROM vg_rating_plates pl JOIN vg_places p ON p.id=pl.place_id WHERE pl.id=$1', [id])).rows[0]
  if (!plate) notFound()
  const url = absoluteUrl('/r/' + plate.code)
  return <main className="vr-print">
    <div className="vr-print-bar"><Link href="/admin/rating?tab=plates">← Kembali</Link><span>Cetak di kertas A6 atau stiker 105 × 148 mm, skala 100%. Jangan perkecil: QR minimal 3 cm.</span><PrintButton/></div>
    <section className="vr-plate">
      <span className="vr-plate-brand"><svg width="16" height="16" viewBox="0 0 24 24" fill="#8db21c" aria-hidden="true"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z"/></svg>VISITGARUT RATING</span>
      <strong>Nilai tempat ini</strong>
      <p>Check-in sebentar, lalu kami kirim link untuk menilai lewat WhatsApp.</p>
      <Qr className="vr-plate-qr" value={url} label={`QR check-in ${plate.name}`}/>
      <small>Siapa saja boleh memindai. Pemilik tidak bisa melihat siapa kamu atau menghapus nilaimu.</small>
      <footer><span>{plate.name}</span><span>Plat P-{String(plate.id).padStart(4, "0")}{plate.location_note ? ` · ${plate.location_note}` : ''}</span></footer>
    </section>
    <p className="vr-print-url">{url}</p>
  </main>
}
