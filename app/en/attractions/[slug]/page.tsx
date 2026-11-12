import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/mvp/Shell'
import Picture from '@/components/mvp/Picture'
import { EnShell, EnBreadcrumbs, EnText, enDate, enPhotoAlt, rp } from '@/components/en/EnShell'
import { enPlace } from '@/lib/en/data'
import { imageObject } from '@/lib/mvp/image-object'
import { isAreaPhoto } from '@/lib/mvp/photo'
import { clip } from '@/lib/mvp/seo'
import { absoluteUrl } from '@/lib/site'
export const revalidate = 3600
export async function generateStaticParams() { return [] }

type Props = { params: Promise<{ slug: string }> }
const where = (district: string) => (district ? `${district} District, Garut Regency, West Java` : 'Garut Regency, West Java')

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const p = await enPlace(slug)
  if (!p) return { title: 'Attraction not found', robots: { index: false } }
  const base = `${p.name}: ${p.en_excerpt.charAt(0).toLowerCase() + p.en_excerpt.slice(1)}`
  const full = `${base} Location, entrance fee, and what to confirm before you go.`
  const description = full.length <= 158 ? full : clip(base, 158)
  return {
    title: { absolute: `${p.name}, Garut: location, fees, what to know | VisitGarut` },
    description,
    alternates: { canonical: `/en/attractions/${slug}`, languages: { 'id-ID': `/wisata/${slug}`, en: `/en/attractions/${slug}`, 'x-default': `/wisata/${slug}` } },
    openGraph: { title: p.name, description, url: absoluteUrl(`/en/attractions/${slug}`), locale: 'en_GB', images: [p.image_url ? (p.image_url.startsWith('/') ? absoluteUrl(p.image_url) : p.image_url) : absoluteUrl('/opengraph-image.png')] },
  }
}

export default async function EnAttraction({ params }: Props) {
  const { slug } = await params
  const p = await enPlace(slug)
  if (!p) notFound()
  const info = p.practical
  const fee = !info ? null : info.weekday === null && info.weekend === null ? null
    : info.weekday === 0 && (info.weekend === 0 || info.weekend === null) ? 'Free'
    : [info.weekday !== null ? `${rp(info.weekday)} on weekdays` : '', info.weekend !== null ? `${rp(info.weekend)} at weekends` : ''].filter(Boolean).join(', ')
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + (p.district ? ' ' + p.district : '') + ' Garut')}${p.google_place_id ? '&query_place_id=' + encodeURIComponent(p.google_place_id) : ''}`
  const area = isAreaPhoto(p)
  const credit = p.image_credit ? (area ? p.image_credit.split('/').slice(1).join('/').trim() : p.image_credit) : ''
  const url = absoluteUrl(`/en/attractions/${slug}`)
  return <EnShell idHref={`/wisata/${slug}`}>
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'TouristAttraction', '@id': `${url}#place`, name: p.name, description: p.en_excerpt, url, inLanguage: 'en', sameAs: [absoluteUrl(`/wisata/${slug}`), ...(p.website ? [p.website] : [])],
      address: { '@type': 'PostalAddress', streetAddress: p.address, addressLocality: p.district, addressRegion: 'West Java', addressCountry: 'ID' },
      ...(p.latitude !== null && p.longitude !== null ? { geo: { '@type': 'GeoCoordinates', latitude: p.latitude, longitude: p.longitude } } : {}),
      ...(p.image_url ? { image: imageObject(p.image_url, area ? enPhotoAlt(p) : undefined) } : {}), hasMap: mapUrl,
      containedInPlace: { '@type': 'AdministrativeArea', name: where(p.district) } }}/>
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ name: 'Home', path: '/en' }, { name: 'Attractions', path: '/en/attractions' }, { name: p.name, path: `/en/attractions/${slug}` }].map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: absoluteUrl(it.path) })) }}/>
    <section className="vg-wrap vg-section">
      <EnBreadcrumbs items={[{ name: 'Attractions', path: '/en/attractions' }, { name: p.name, path: `/en/attractions/${slug}` }]}/>
      <article className="vg-reading ve-place">
        <span className="vg-eyebrow">ATTRACTION · {(p.district || 'Garut').toUpperCase()}</span>
        <h1>{p.name}</h1>
        <p className="vg-intro">{p.name}: {p.en_excerpt.charAt(0).toLowerCase() + p.en_excerpt.slice(1).replace(/\.$/, '')}{p.district && p.en_excerpt.includes(p.district) ? ', Garut Regency, West Java, Indonesia.' : `, in ${where(p.district)}, Indonesia.`}</p>
        {p.image_url && <figure className="vg-detail-image"><Picture src={p.image_url} sizes="(max-width: 760px) 92vw, 760px" alt={enPhotoAlt(p)} width={1600} height={900}/><figcaption>{area ? `${/^Foto arsip/i.test(p.image_credit) ? 'Archive photo' : 'Photo'} of the surrounding area, not of ${p.name}. ` : ''}Photo: {credit}</figcaption></figure>}
        <h2>At a glance</h2>
        <dl className="ve-facts">
          <div><dt>Location</dt><dd>{p.address ? `${p.address.replace(/\.$/, '')}, West Java` : where(p.district)}. <a href={mapUrl} target="_blank" rel="noopener noreferrer">Open in Google Maps ↗</a></dd></div>
          <div><dt>Entrance fee</dt><dd>{fee ? <>{fee}, as listed by {info!.publisher} (checked {enDate(info!.checkedAt)}). Where a source separates visitor types, this is the domestic-visitor rate; foreign visitors may pay more. Confirm before you go.</> : 'Not confirmed. Ask the management before you go.'}</dd></div>
          <div><dt>Opening hours</dt><dd>Hours can change and are not translated here. See the Indonesian page or check with the management.</dd></div>
          {(p.website || p.whatsapp) && <div><dt>Contact</dt><dd>{p.website && <a href={p.website} target="_blank" rel="noopener noreferrer">Official site or account ↗</a>}{p.website && p.whatsapp ? ' · ' : ''}{p.whatsapp && <a href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp +{p.whatsapp.replace(/\D/g, '')}</a>}</dd></div>}
        </dl>
        <h2>About {p.name}</h2>
        <EnText content={p.en_content}/>
        {p.source_url && <p className="vg-source"><a href={p.source_url} target="_blank" rel="noopener noreferrer">Read the source (in Indonesian) ↗</a></p>}
        <p className="ve-more">Ticket details by day, access notes, visitor reports, and the trip planner are on the <Link href={`/wisata/${slug}`} hrefLang="id">Indonesian page for {p.name}</Link>.</p>
        <small>Translated from the Indonesian page by the VisitGarut team. Indonesian page updated {enDate(p.updated_at)}; translation updated {enDate(p.en_updated_at)}.</small>
      </article>
    </section>
  </EnShell>
}
