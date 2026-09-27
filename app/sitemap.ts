import type { MetadataRoute } from 'next'
import { getPublishedPlaceSlugs } from '@/lib/data/places'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getPublishedPlaceSlugs()
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: 'https://visitgarut.com', lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: 'https://visitgarut.com/explore', lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: 'https://visitgarut.com/eat', lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: 'https://visitgarut.com/stay', lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: 'https://visitgarut.com/transport', lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: 'https://visitgarut.com/events', lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: 'https://visitgarut.com/map', lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
  ]

  const placeRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `https://visitgarut.com/explore/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...placeRoutes]
}
