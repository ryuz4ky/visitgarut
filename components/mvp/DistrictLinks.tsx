import Link from 'next/link'
import type { DistrictSummary } from '@/lib/mvp/kecamatan'

/** Plain crawlable links between kecamatan hubs, optionally scoped to one category. */
export default function DistrictLinks({ items, category, current, title = 'Jelajahi per kecamatan' }: { items: DistrictSummary[]; category?: string; current?: string; title?: string }) {
  const list = items.filter(d => d.slug !== current && (!category || d.byCategory[category]))
  if (!list.length) return null
  return <section className="vg-district-links" aria-labelledby="vg-district-links-title">
    <h2 id="vg-district-links-title">{title}</h2>
    <ul>{list.map(d => <li key={d.slug}><Link href={category ? `/kecamatan/${d.slug}/${category}` : `/kecamatan/${d.slug}`}>{d.name}<span>{category ? d.byCategory[category] : d.total}</span></Link></li>)}</ul>
  </section>
}
