import { JsonLd } from '@/components/mvp/Shell'
import { EnShell, EnBreadcrumbs, EnPlaceCard } from '@/components/en/EnShell'
import { enPlaces } from '@/lib/en/data'
import { absoluteUrl } from '@/lib/site'
export const dynamic = 'force-dynamic'

const description = 'Volcanoes, crater lakes, hot springs, waterfalls, beaches, and traditional villages in Garut Regency, West Java, each with its source and check date.'
export const metadata = {
  title: { absolute: 'Attractions in Garut, West Java: places to visit | VisitGarut' },
  description,
  alternates: { canonical: '/en/attractions', languages: { 'id-ID': '/wisata', en: '/en/attractions', 'x-default': '/wisata' } },
}

export default async function EnAttractions() {
  const places = await enPlaces()
  return <EnShell idHref="/wisata">
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'CollectionPage', url: absoluteUrl('/en/attractions'), name: 'Attractions in Garut', inLanguage: 'en', description, mainEntity: { '@type': 'ItemList', numberOfItems: places.length, itemListElement: places.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, url: absoluteUrl(`/en/attractions/${p.slug}`) })) } }}/>
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ name: 'Home', path: '/en' }, { name: 'Attractions', path: '/en/attractions' }].map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: absoluteUrl(it.path) })) }}/>
    <section className="vg-wrap vx-page ve-page">
      <EnBreadcrumbs items={[{ name: 'Attractions', path: '/en/attractions' }]}/>
      <h1 className="ve-title">Attractions in Garut.</h1>
      <p className="vg-intro">{places.length} places to visit in Garut Regency, West Java. Photos labelled “Area photo” or “Archive photo” show the surroundings, not the place itself.</p>
      <div className="vg-grid">{places.map(p => <EnPlaceCard key={p.id} place={p}/>)}</div>
    </section>
  </EnShell>
}
