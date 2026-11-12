import Link from 'next/link'
import Picture from '@/components/mvp/Picture'
import { Wordmark } from '@/components/mvp/SiteHeader'
import { isAreaPhoto } from '@/lib/mvp/photo'
import type { EnPlace } from '@/lib/en/data'

export const enDate = (value: Date | string) => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })
export const rp = (n: number) => 'Rp' + n.toLocaleString('en-US')
/** Alt text that never presents an area or archive photo as a photo of the place itself. */
export const enPhotoAlt = (p: { name: string; image_credit?: string | null }) => isAreaPhoto(p) ? `Photo of the surrounding area, not of ${p.name}` : `Photo of ${p.name}`

/** English pages share the site's look but have their own short navigation; the full directory stays in Indonesian. */
export function EnShell({ children, idHref }: { children: React.ReactNode; idHref: string }) {
  return <div lang="en" className="ve">
    <a className="vg-skip" href="#main-content">Skip to content</a>
    <div className="vg-header"><header className="vg-header-bar">
      <Link className="vg-brand" href="/en" aria-label="VisitGarut home (English)"><Wordmark/></Link>
      <nav className="vg-header-links ve-links" aria-label="Main navigation"><Link href="/en/attractions">Attractions</Link><Link href="/en#guides">Guides</Link><Link href="/en#about">About</Link></nav>
      <Link className="ve-lang" href={idHref} hrefLang="id" lang="id">Bahasa Indonesia</Link>
    </header></div>
    <main id="main-content">{children}</main>
    <footer className="vg-footer"><div className="vg-footer-card">
      <div className="vg-footer-grid">
        <div className="vg-footer-brand"><Wordmark/><p>An independent directory of places in Garut Regency, West Java, Indonesia.</p></div>
        <nav aria-label="English pages"><strong>In English</strong><Link href="/en">Garut travel guide</Link><Link href="/en/attractions">Attractions</Link></nav>
        <nav aria-label="Indonesian pages" lang="id"><strong>Bahasa Indonesia</strong><Link href="/" hrefLang="id">Beranda</Link><Link href="/wisata" hrefLang="id">Wisata</Link><Link href="/kecamatan" hrefLang="id">Garut per kecamatan</Link><Link href="/tentang" hrefLang="id">Tentang VisitGarut</Link><Link href="/kredit-foto" hrefLang="id">Kredit foto</Link></nav>
      </div>
      <small>VisitGarut is not an official government site and is not owned by any attraction. Fees, hours, and access can change; confirm with the management before you visit.</small>
    </div></footer>
  </div>
}

export function EnBreadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return <nav className="vg-breadcrumb" aria-label="Breadcrumb"><Link href="/en">Home</Link>{items.map((it, i) => <span key={it.path}> / {i === items.length - 1 ? it.name : <Link href={it.path}>{it.name}</Link>}</span>)}</nav>
}

export function EnText({ content }: { content: string }) {
  return <div className="vg-prose">{content.split(/\n\s*\n/).filter(Boolean).map((b, i) => b.startsWith('## ') ? <h2 key={i}>{b.slice(3)}</h2> : <p key={i}>{b}</p>)}</div>
}

export function EnPlaceCard({ place: p }: { place: EnPlace }) {
  return <article className="vg-card-shell"><div className="vg-card">
    <Link className="vg-card-image cat-wisata" href={`/en/attractions/${p.slug}`} tabIndex={-1} aria-hidden="true">
      {p.image_url ? <Picture src={p.image_url} sizes="(max-width: 700px) 92vw, 400px" alt="" loading="lazy" width={600} height={400}/> : <div className="vg-image-empty"><span>{p.district || 'Garut'}</span><small>No photo yet</small></div>}
      {p.image_url && isAreaPhoto(p) && <span className="vg-area-tag">{/^Foto arsip/i.test(p.image_credit || '') ? 'Archive photo' : 'Area photo'}</span>}
    </Link>
    <div className="vg-card-body"><h3><Link href={`/en/attractions/${p.slug}`}>{p.name}</Link></h3><p className="ve-card-meta">{p.district ? `${p.district}, Garut` : 'Garut'}</p><p>{p.en_excerpt}</p></div>
  </div></article>
}
