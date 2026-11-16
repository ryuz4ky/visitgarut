/** The site's publisher, described once and reused by every page's structured data. */
import { siteUrl, absoluteUrl } from '@/lib/site'

/** Official profiles of VisitGarut/Sorotnamedia, comma separated, e.g. VISITGARUT_SAME_AS="https://www.instagram.com/…,https://www.youtube.com/@…". */
export const sameAs = (process.env.VISITGARUT_SAME_AS || '').split(',').map(s => s.trim()).filter(s => /^https:\/\//.test(s))

export const organizationId = `${siteUrl}/#organization`

export function organization() {
  return {
    '@type': 'Organization',
    '@id': organizationId,
    name: 'VisitGarut',
    url: siteUrl,
    logo: { '@type': 'ImageObject', url: absoluteUrl('/icon.png'), width: 512, height: 512 },
    description: 'Direktori independen tempat wisata, penginapan, kuliner, dan usaha lokal di Kabupaten Garut, Jawa Barat. Setiap halaman menyebut sumber dan tanggal pemeriksaannya.',
    areaServed: { '@type': 'AdministrativeArea', name: 'Kabupaten Garut, Jawa Barat, Indonesia' },
    knowsAbout: ['Pariwisata Kabupaten Garut', 'Kuliner Garut', 'Penginapan di Garut', 'Kecamatan di Kabupaten Garut'],
    parentOrganization: { '@type': 'Organization', name: 'Sorotnamedia' },
    publishingPrinciples: absoluteUrl('/tentang#cara-memeriksa'),
    correctionsPolicy: absoluteUrl('/tentang#koreksi'),
    ownershipFundingInfo: absoluteUrl('/tentang#independensi'),
    ...(sameAs.length ? { sameAs } : {}),
  }
}

/** Short reference for publisher/author fields once the full node is on the page or elsewhere on the site. */
export const organizationRef = () => ({ '@type': 'Organization', '@id': organizationId, name: 'VisitGarut', url: siteUrl })

/** Editorial team shown on /tentang#tim, e.g. VISITGARUT_EDITORS="Nama Lengkap|Peran|https://profil;Nama Kedua|Peran". Empty = section hidden. */
export type Editor = { name: string; role: string; url?: string }
export const editors = (): Editor[] => (process.env.VISITGARUT_EDITORS || '').split(';').map(s => s.split('|').map(x => x.trim())).filter(([name, role]) => name && role).map(([name, role, url]) => ({ name, role, ...(url && /^https:\/\//.test(url) ? { url } : {}) }))
