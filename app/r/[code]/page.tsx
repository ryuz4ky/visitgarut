import { notFound } from 'next/navigation'
import { Shell } from '@/components/mvp/Shell'
import { db } from '@/lib/mvp/db'
import { ratingEnabled } from '@/lib/rating/server'
import { plateByCode, placeRating } from '@/lib/rating/store'
import CheckinFlow from '@/components/rating/CheckinFlow'
import RatingBadge from '@/components/rating/RatingBadge'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Check-in VisitGarut Rating', robots: { index: false, follow: false } }

export default async function Checkin({ params }: { params: Promise<{ code: string }> }) {
  if (!ratingEnabled()) notFound()
  const { code } = await params
  const plate = await plateByCode(db(), code)
  if (!plate) notFound()
  const rating = await placeRating(db(), plate.place_id, new Date())
  return <Shell><main className="vr-wrap" id="konten-utama">
    <p className="vr-eyebrow">Nilai pengunjung VisitGarut</p>
    <h1>Check-in di {plate.name}?</h1>
    <p className="vr-lead">Cukup check-in sekarang. Setelah kunjungan selesai, kami kirim link untuk menilai lewat WhatsApp.</p>
    {rating && <RatingBadge rating={rating} compact/>}
    <CheckinFlow code={plate.code} placeName={plate.name} hasCoordinates={plate.latitude !== null && plate.longitude !== null}/>
    <p className="vr-fine">Lokasi HP hanya dicek cocok atau tidak, lalu dihapus. Nomormu tidak pernah ditampilkan atau diberikan ke pemilik. <a href="/privasi">Kebijakan privasi</a></p>
  </main></Shell>
}
