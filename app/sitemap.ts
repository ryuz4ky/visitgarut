import type { MetadataRoute } from 'next'
import { getPublishedPlaceSlugs } from '@/lib/data/places'
import { absoluteUrl } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getPublishedPlaceSlugs()
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/explore'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/trip'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/eat'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteUrl('/stay'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteUrl('/transport'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteUrl('/events'), lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: absoluteUrl('/map'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  ]

  const placeRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: absoluteUrl(`/explore/${slug}`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...placeRoutes]
}
