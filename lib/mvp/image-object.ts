/** schema.org ImageObject for a photo shown on the site, with author and licence when it is a credited free-licence photo. */
import { photoCredits } from '@/lib/mvp/photo-credits'
import { absoluteUrl } from '@/lib/site'

const byImage = new Map(photoCredits.map(c => [c.image, c]))

export function imageObject(src: string, caption?: string) {
  const url = src.startsWith('/') ? absoluteUrl(src) : src
  const c = byImage.get(src)
  if (!c) return { '@type': 'ImageObject', url, contentUrl: url, ...(caption ? { caption } : {}) }
  const unknownAuthor = /tidak diketahui/i.test(c.author)
  return {
    '@type': 'ImageObject',
    url,
    contentUrl: url,
    name: c.title,
    ...(caption ? { caption } : {}),
    ...(unknownAuthor ? {} : { creator: { '@type': 'Person', name: c.author.replace(/, koleksi .*$/, '') } }),
    creditText: `${c.author} / Wikimedia Commons / ${c.license}`,
    copyrightNotice: `${c.author}${c.year ? `, ${c.year}` : ''}. ${c.license}.`,
    license: c.licenseUrl,
    acquireLicensePage: c.page,
    isBasedOn: c.page,
  }
}
