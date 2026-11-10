import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Shell, Breadcrumbs, PlaceGrid, JsonLd } from '@/components/mvp/Shell'
import { DirectoryHero } from '@/components/mvp/Directory'
import FaqBlock from '@/components/mvp/Faq'
import DistrictLinks from '@/components/mvp/DistrictLinks'
import { categories } from '@/lib/mvp/data'
import { districts, districtPlaces, hubIndexable } from '@/lib/mvp/kecamatan'
import { districtIntro, districtIntroFallback, isThinPlace, clip } from '@/lib/mvp/seo'
import { absoluteUrl } from '@/lib/site'
export const revalidate = 3600
// Rendered on first visit, then cached; nothing is built ahead of time.
export async function generateStaticParams() { return [] }

type Props = { params: Promise<{ district: string }> }
const PREVIEW = 6

function countsSentence(name: string, byCategory: Record<string, number>, total: number) {
  const parts = categories.filter(c => byCategory[c.slug]).map(c => `${byCategory[c.slug]} ${c.name.toLocaleLowerCase('id-ID')}`)
  return `VisitGarut mencatat ${total} tempat di Kecamatan ${name}, Kabupaten Garut${parts.length ? `: ${parts.join(', ')}` : ''}.`
}

export async function generateMetadata({ params }: Props) {
  const { district } = await params
  const d = (await districts()).find(x => x.slug === district)
  if (!d) return { title: 'Kecamatan tidak ditemukan', robots: { index: false } }
  const cats = categories.filter(c => d.byCategory[c.slug]).map(c => c.name.toLocaleLowerCase('id-ID'))
  return {
    title: `${d.name}, Garut: ${cats.slice(0, 4).join(', ')}`,
    description: (() => { const base = countsSentence(d.name, d.byCategory, d.total); const full = `${base} Lihat lokasi dan rute sebelum berkunjung.`; return full.length <= 158 ? full : clip(base, 158) })(),
    alternates: { canonical: `/kecamatan/${d.slug}` },
    ...(hubIndexable(d.total) ? {} : { robots: { index: false, follow: true } }),
  }
}

export default async function DistrictHub({ params }: Props) {
  const { district } = await params
  const all = await districts()
  const d = all.find(x => x.slug === district)
  if (!d) notFound()
  const places = await districtPlaces(d.name)
  // Listings with their own information first, so the preview shows the most useful pages.
  const rank = (p: (typeof places)[number]) => (isThinPlace(p) ? 1 : 0)
  const sections = categories.filter(c => d.byCategory[c.slug]).map(c => {
    const items = places.filter(p => p.category === c.slug).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'id'))
    return { c, items }
  })
  const intro = districtIntro[d.name] || districtIntroFallback(d.name)
  const summary = countsSentence(d.name, d.byCategory, d.total)
  const faq = [
    { q: `Ada berapa tempat di Kecamatan ${d.name} yang tercatat di VisitGarut?`, a: summary },
    ...sections.slice(0, 4).map(({ c, items }) => ({
      q: `${c.name} apa saja yang ada di ${d.name}?`,
      a: `Beberapa di antaranya: ${items.slice(0, 5).map(p => p.name).join(', ')}${items.length > 5 ? `, dan ${items.length - 5} lainnya` : ''}. Daftar lengkap ada di ${absoluteUrl(`/kecamatan/${d.slug}/${c.slug}`)}.`,
    })),
    { q: `Apakah informasi tempat di ${d.name} sudah pasti?`, a: 'Setiap halaman tempat menyebut sumber dan tanggal pemeriksaannya. Jam buka, harga, dan ketersediaan bisa berubah, jadi konfirmasikan ke pengelola sebelum datang.' },
  ]
  return <Shell><section className="vg-wrap vx-page vx-page-category">
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: `Tempat di Kecamatan ${d.name}, Garut`, url: absoluteUrl(`/kecamatan/${d.slug}`), about: { '@type': 'AdministrativeArea', name: `Kecamatan ${d.name}`, containedInPlace: { '@type': 'AdministrativeArea', name: 'Kabupaten Garut, Jawa Barat' } }, mainEntity: { '@type': 'ItemList', numberOfItems: places.length, itemListElement: sections.flatMap(s => s.items.slice(0, PREVIEW)).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: absoluteUrl(`/${p.category}/${p.slug}`), name: p.name })) } }}/>
    <Breadcrumbs items={[{ name: 'Kecamatan', path: '/kecamatan' }, { name: d.name, path: `/kecamatan/${d.slug}` }]}/>
    <DirectoryHero title={`${d.name}, Garut.`} intro={intro}/>
    <p className="vk-summary">{summary}</p>
    {sections.map(({ c, items }) => <section className="vk-section" key={c.slug} aria-labelledby={`vk-${c.slug}`}>
      <div className="vk-section-head"><h2 id={`vk-${c.slug}`}>{c.name} di {d.name}</h2>{items.length > PREVIEW && <Link href={`/kecamatan/${d.slug}/${c.slug}`}>Lihat semua {items.length} {c.unit} →</Link>}</div>
      <PlaceGrid items={items.slice(0, PREVIEW)}/>
      {items.length > PREVIEW && <ul className="vk-names">{items.slice(PREVIEW, 60).map(p => <li key={p.id}><Link href={`/${p.category}/${p.slug}`}>{p.name}</Link></li>)}</ul>}
    </section>)}
    <FaqBlock id="tanya-jawab" card={false} title={`Tanya jawab: ${d.name}`} items={faq}/>
    <DistrictLinks items={all} current={d.slug} title="Kecamatan lain di Garut"/>
  </section></Shell>
}
