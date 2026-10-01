const fallbackSiteUrl = 'https://visitgarut.sorotnamedia.com'

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || fallbackSiteUrl).replace(/\/$/, '')

export function absoluteUrl(path = '/') {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${siteUrl}${normalized}`
}
