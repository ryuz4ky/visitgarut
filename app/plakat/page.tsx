import { notFound, redirect } from 'next/navigation'
import { Shell } from '@/components/mvp/Shell'
import { normalizeSerial } from '@/lib/rating/core'
import { ratingVisible } from '@/lib/rating/server'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Cek plakat VisitGarut Rating', description: 'Periksa apakah plakat skor VisitGarut yang dipajang masih resmi dan berlaku.', alternates: { canonical: '/plakat' } }

export default async function CekPlakat({ searchParams }: { searchParams: Promise<{ serial?: string | string[] }> }) {
  if (!(await ratingVisible())) notFound()
  const raw = (await searchParams).serial
  const typed = typeof raw === 'string' ? raw.trim().slice(0, 20) : ''
  const serial = typed ? normalizeSerial(typed) : null
  if (serial) redirect(`/plakat/${serial}`)
  return <Shell><main className="vr-wrap" id="konten-utama">
    <p className="vr-eyebrow">Cek plakat</p>
    <h1>Plakat di pintu itu masih berlaku?</h1>
    <p className="vr-lead">Masukkan nomor seri yang tercetak di plakat, misalnya VG-26-00001. Atau pindai QR di plakat untuk langsung membuka halamannya.</p>
    {typed && <p className="vr-message" role="alert">“{typed}” bukan format nomor plakat. Nomor resmi selalu VG, dua angka tahun, lalu lima angka.</p>}
    <form className="vr-card vr-serial-form" action="/plakat">
      <label htmlFor="serial">Nomor plakat</label>
      <div><input id="serial" name="serial" defaultValue={typed} placeholder="VG-26-00001" maxLength={20} autoCapitalize="characters" required/><button type="submit">Cek</button></div>
    </form>
  </main></Shell>
}
