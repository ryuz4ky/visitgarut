import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell, Breadcrumbs } from '@/components/mvp/Shell'
import OwnerForm from '@/components/owner/OwnerForm'
import { place, categories } from '@/lib/mvp/data'
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ category: string; slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { category, slug } = await params
  const p = await place(slug, category)
  return { title: p ? `Lengkapi data ${p.name}` : 'Tempat tidak ditemukan', robots: { index: false, follow: false } }
}

export default async function Lengkapi({ params }: Props) {
  const { category, slug } = await params
  const c = categories.find(x => x.slug === category)
  const p = c ? await place(slug, category) : undefined
  if (!c || !p) notFound()
  return <Shell><main className="vr-biz vo-page" id="konten-utama">
    <Breadcrumbs items={[{ name: c.name, path: `/${category}` }, { name: p.name, path: `/${category}/${slug}` }, { name: 'Lengkapi data', path: `/lengkapi/${category}/${slug}` }]}/>
    <section className="vr-biz-hero">
      <p className="vr-eyebrow">Untuk pemilik dan pengelola</p>
      <h1>Lengkapi data {p.name}</h1>
      <p className="vr-lead">Kontak, jam buka, kisaran harga, dan keterangan dari Anda membantu pengunjung memutuskan datang. Tim VisitGarut memeriksa kiriman dulu, lalu menampilkannya dengan keterangan “dari pengelola”.</p>
    </section>
    <section className="vo-form">
      <OwnerForm placeId={p.id} placeName={p.name}/>
      <p className="vr-fine">Bukan pemilik atau pengelola? Gunakan <Link href={`/${category}/${slug}#community-pulse`}>Laporkan perubahan</Link> di halaman tempat.</p>
    </section>
  </main></Shell>
}
