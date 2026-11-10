import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Shell, Breadcrumbs, PlaceGrid, JsonLd } from '@/components/mvp/Shell'
import { DirectoryHero } from '@/components/mvp/Directory'
import DirectoryPagination from '@/components/mvp/DirectoryPagination'
import DistrictLinks from '@/components/mvp/DistrictLinks'
import { categories, directoryPlaces } from '@/lib/mvp/data'
import { districts, hubIndexable } from '@/lib/mvp/kecamatan'
import { parseDirectoryPage, directoryPageSize, directoryPageHref } from '@/lib/mvp/search'
import { districtIntro } from '@/lib/mvp/seo'
import { absoluteUrl } from '@/lib/site'
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ district: string; category: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

async function resolve(district: string, category: string) {
  const all = await districts()
  const d = all.find(x => x.slug === district)
  const c = categories.find(x => x.slug === category)
  return { all, d, c, n: d && c ? d.byCategory[c.slug] || 0 : 0 }
}

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ district, category }, raw] = await Promise.all([params, searchParams])
  const { d, c, n } = await resolve(district, category)
  const page = parseDirectoryPage(raw.page)
  if (!d || !c || !n || page === null) return { title: 'Halaman tidak ditemukan', robots: { index: false } }
  const label = c.name.toLocaleLowerCase('id-ID')
  return {
    title: `${c.name} di ${d.name}, Garut${page > 1 ? ` — Halaman ${page}` : ''}`,
    description: `${n} ${c.unit} ${label} di Kecamatan ${d.name}, Kabupaten Garut. Lihat lokasi, rute Google Maps, dan hal yang perlu dicek sebelum datang.`,
    alternates: { canonical: directoryPageHref(`/kecamatan/${d.slug}/${c.slug}`, page) },
    ...(hubIndexable(n) ? {} : { robots: { index: false, follow: true } }),
  }
}

export default async function DistrictCategory({ params, searchParams }: Props) {
  const [{ district, category }, raw] = await Promise.all([params, searchParams])
  const { all, d, c, n } = await resolve(district, category)
  if (!d || !c || !n) notFound()
  const page = parseDirectoryPage(raw.page)
  if (page === null) notFound()
  const { items, total, pages } = await directoryPlaces({ category: c.slug, district: d.name }, page)
  if (page > pages) notFound()
  const label = c.name.toLocaleLowerCase('id-ID')
  const path = `/kecamatan/${d.slug}/${c.slug}`
  return <Shell><section className="vg-wrap vx-page vx-page-category">
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'ItemList', name: `${c.name} di ${d.name}, Garut`, url: absoluteUrl(path), numberOfItems: total, itemListElement: items.map((p, i) => ({ '@type': 'ListItem', position: (page - 1) * directoryPageSize + i + 1, url: absoluteUrl(`/${p.category}/${p.slug}`), name: p.name })) }}/>
    <Breadcrumbs items={[{ name: 'Kecamatan', path: '/kecamatan' }, { name: d.name, path: `/kecamatan/${d.slug}` }, { name: c.name, path }]}/>
    <DirectoryHero title={`${c.name} di ${d.name}.`} intro={districtIntro[d.name]} active={c.slug}/>
    <p className="vk-summary">VisitGarut mencatat {total} {c.unit} {label} di Kecamatan {d.name}, Kabupaten Garut. Setiap halaman tempat menyebut sumber dan tanggal pemeriksaannya. <Link href={`/kecamatan/${d.slug}`}>Lihat semua kategori di {d.name}</Link> · <Link href={`/${c.slug}`}>{c.name} di seluruh Garut</Link></p>
    <PlaceGrid items={items}/>
    <DirectoryPagination path={path} page={page} pages={pages}/>
    <DistrictLinks items={all} category={c.slug} current={d.slug} title={`${c.name} di kecamatan lain`}/>
  </section></Shell>
}
