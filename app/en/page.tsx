import Link from 'next/link'
import { JsonLd } from '@/components/mvp/Shell'
import { EnShell, EnPlaceCard, enDate } from '@/components/en/EnShell'
import { enPlaces, enArticles } from '@/lib/en/data'
import { organizationRef } from '@/lib/mvp/org'
import { absoluteUrl } from '@/lib/site'
export const dynamic = 'force-dynamic'

const description = 'An independent guide to Garut Regency, West Java: volcanoes, hot springs, waterfalls, and south-coast beaches, with sourced facts and the date each was checked.'
export const metadata = {
  title: { absolute: 'Garut travel guide: things to do in Garut, West Java | VisitGarut' },
  description,
  alternates: { canonical: '/en', languages: { 'id-ID': '/', en: '/en', 'x-default': '/' } },
  openGraph: { title: 'Garut travel guide', description, url: absoluteUrl('/en'), locale: 'en_GB' },
}

export default async function EnHome() {
  const [places, guides] = await Promise.all([enPlaces(), enArticles()])
  const faq = [
    { q: 'Where is Garut?', a: 'Garut is a regency in West Java, Indonesia, south-east of Bandung. Its town centre sits in a highland basin ringed by volcanoes, and the regency stretches south to the Indian Ocean coast.' },
    { q: 'What is Garut known for?', a: 'Mount Papandayan and its crater, the Cipanas hot springs at the foot of Mount Guntur, Situ Bagendit and Situ Cangkuang lakes, south-coast beaches such as Santolo and Sayang Heulang, dodol sweets, and Sukaregang leather goods.' },
    { q: 'Is the information on VisitGarut official?', a: 'No. VisitGarut is an independent directory run by Sorotnamedia. Each page names its source and the date it was checked. Fees and opening hours can change, so confirm with the management before you go.' },
  ]
  return <EnShell idHref="/">
    <JsonLd data={{ '@context': 'https://schema.org', '@graph': [
      { '@type': 'CollectionPage', url: absoluteUrl('/en'), name: 'Garut travel guide', inLanguage: 'en', description, publisher: organizationRef(), about: { '@type': 'AdministrativeArea', name: 'Garut Regency, West Java, Indonesia' }, mainEntity: { '@type': 'ItemList', numberOfItems: places.length, itemListElement: places.slice(0, 12).map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, url: absoluteUrl(`/en/attractions/${p.slug}`) })) } },
      { '@type': 'FAQPage', inLanguage: 'en', mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ] }}/>
    <section className="vg-wrap vx-page ve-page">
      <span className="vg-eyebrow">GARUT, WEST JAVA</span>
      <h1 className="ve-title">Garut travel guide.</h1>
      <p className="vg-intro">Garut is a highland regency in West Java, Indonesia, with volcanoes, hot springs, waterfalls, and beaches on the Indian Ocean. VisitGarut lists {places.length} attractions in English, each with its source and the date it was checked.</p>
      <section className="vk-section" aria-labelledby="ve-top"><div className="vk-section-head"><h2 id="ve-top">Attractions in Garut</h2><Link href="/en/attractions">See all {places.length} attractions →</Link></div>
        <div className="vg-grid">{places.slice(0, 9).map(p => <EnPlaceCard key={p.id} place={p}/>)}</div>
      </section>
      {guides.length > 0 && <section className="vk-section" id="guides" aria-labelledby="ve-guides"><div className="vk-section-head"><h2 id="ve-guides">Guides</h2></div>
        <div className="vg-article-grid">{guides.map(a => <Link key={a.id} className="vg-article-card" href={`/en/guides/${a.slug}`}><span className="vg-eyebrow">GARUT GUIDE</span><h3>{a.en_title}</h3><p>{a.en_excerpt}</p><small>VisitGarut team · {enDate(a.published_at || a.updated_at)}</small></Link>)}</div>
      </section>}
      <section className="vk-section ve-about" id="about" aria-labelledby="ve-about"><h2 id="ve-about">About this guide</h2>
        {faq.map(f => <div key={f.q} className="ve-qa"><h3>{f.q}</h3><p>{f.a}</p></div>)}
        <p>Hotels, restaurants, cafés, and the trip planner are available in Indonesian for now: <Link href="/" hrefLang="id">open the Indonesian site</Link>.</p>
      </section>
    </section>
  </EnShell>
}
