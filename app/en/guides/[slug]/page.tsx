import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/mvp/Shell'
import Picture from '@/components/mvp/Picture'
import { EnShell, EnBreadcrumbs, EnText, EnPlaceCard, enDate } from '@/components/en/EnShell'
import { enArticle, enRelatedPlaces } from '@/lib/en/data'
import { imageObject } from '@/lib/mvp/image-object'
import { organizationRef } from '@/lib/mvp/org'
import { absoluteUrl } from '@/lib/site'
export const revalidate = 3600
export async function generateStaticParams() { return [] }

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const a = await enArticle(slug)
  if (!a) return { title: 'Guide not found', robots: { index: false } }
  return {
    title: { absolute: `${a.en_title} | VisitGarut` }, description: a.en_excerpt,
    alternates: { canonical: `/en/guides/${slug}`, languages: { 'id-ID': `/artikel/${slug}`, en: `/en/guides/${slug}`, 'x-default': `/artikel/${slug}` } },
    openGraph: { type: 'article', title: a.en_title, description: a.en_excerpt, url: absoluteUrl(`/en/guides/${slug}`), locale: 'en_GB', modifiedTime: new Date(a.en_updated_at).toISOString() },
  }
}

export default async function EnGuide({ params }: Props) {
  const { slug } = await params
  const a = await enArticle(slug)
  if (!a) notFound()
  const related = await enRelatedPlaces(a.id)
  const url = absoluteUrl(`/en/guides/${slug}`)
  return <EnShell idHref={`/artikel/${slug}`}>
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Article', headline: a.en_title, description: a.en_excerpt, inLanguage: 'en', datePublished: new Date(a.published_at || a.updated_at).toISOString(), dateModified: new Date(a.en_updated_at).toISOString(), author: organizationRef(), publisher: organizationRef(), mainEntityOfPage: url, translationOfWork: { '@type': 'Article', '@id': absoluteUrl(`/artikel/${slug}`), inLanguage: 'id-ID' }, ...(a.image_url ? { image: imageObject(a.image_url) } : {}), ...(a.source_urls?.length ? { citation: a.source_urls } : {}) }}/>
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ name: 'Home', path: '/en' }, { name: a.en_title, path: `/en/guides/${slug}` }].map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: absoluteUrl(it.path) })) }}/>
    <section className="vg-wrap vg-section">
      <EnBreadcrumbs items={[{ name: a.en_title, path: `/en/guides/${slug}` }]}/>
      <article className="vg-reading">
        <span className="vg-eyebrow">GARUT GUIDE</span>
        <h1>{a.en_title}</h1>
        <p className="vg-count">VisitGarut team · <time dateTime={new Date(a.published_at || a.updated_at).toISOString()}>{enDate(a.published_at || a.updated_at)}</time></p>
        <p className="vg-intro">{a.en_excerpt}</p>
        {a.image_url && <figure className="vg-detail-image"><Picture src={a.image_url} sizes="(max-width: 760px) 92vw, 720px" alt={a.en_title}/><figcaption>{a.image_credit}</figcaption></figure>}
        <EnText content={a.en_content}/>
        {!!a.source_urls?.length && <section><h2>Sources</h2><ul>{a.source_urls.map(u => <li key={u}><a href={u} target="_blank" rel="noopener noreferrer">{new URL(u).hostname} ↗</a></li>)}</ul></section>}
        <small>Translated from the <Link href={`/artikel/${slug}`} hrefLang="id">Indonesian article</Link>. Translation updated <time dateTime={new Date(a.en_updated_at).toISOString()}>{enDate(a.en_updated_at)}</time>.</small>
      </article>
      {related.length > 0 && <section className="vg-section"><h2>Places in this guide</h2><div className="vg-grid">{related.map(p => <EnPlaceCard key={p.id} place={p}/>)}</div></section>}
    </section>
  </EnShell>
}
