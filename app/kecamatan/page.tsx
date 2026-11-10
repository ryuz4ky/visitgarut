import Link from 'next/link'
import { Shell, Breadcrumbs, JsonLd } from '@/components/mvp/Shell'
import { DirectoryHero } from '@/components/mvp/Directory'
import { categories } from '@/lib/mvp/data'
import { districts } from '@/lib/mvp/kecamatan'
import { absoluteUrl } from '@/lib/site'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Jelajahi Garut per kecamatan',
  description: 'Wisata, hotel, kuliner, dan cafe di setiap kecamatan Kabupaten Garut, dari Garut Kota dan Tarogong sampai pesisir Pameungpeuk dan Rancabuaya.',
  alternates: { canonical: '/kecamatan' },
}

export default async function DistrictIndex() {
  const all = await districts()
  const total = all.reduce((s, d) => s + d.total, 0)
  return <Shell><section className="vg-wrap vx-page vx-page-category">
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'ItemList', name: 'Kecamatan di Kabupaten Garut', url: absoluteUrl('/kecamatan'), numberOfItems: all.length, itemListElement: all.map((d, i) => ({ '@type': 'ListItem', position: i + 1, url: absoluteUrl(`/kecamatan/${d.slug}`), name: `Kecamatan ${d.name}` })) }}/>
    <Breadcrumbs items={[{ name: 'Kecamatan', path: '/kecamatan' }]}/>
    <DirectoryHero title="Garut per kecamatan." intro="Pilih kecamatan untuk melihat tempat wisata, penginapan, kuliner, dan cafe di sekitarnya."/>
    <p className="vk-summary">VisitGarut mencatat {total} tempat di {all.length} kecamatan di Kabupaten Garut.</p>
    <div className="vg-grid">{all.map(d => <Link key={d.slug} className="vg-article-card" href={`/kecamatan/${d.slug}`}>
      <span className="vg-eyebrow">{d.total} TEMPAT</span><h3>{d.name}</h3>
      <p>{categories.filter(c => d.byCategory[c.slug]).map(c => `${d.byCategory[c.slug]} ${c.name.toLocaleLowerCase('id-ID')}`).join(' · ')}</p>
    </Link>)}</div>
  </section></Shell>
}
