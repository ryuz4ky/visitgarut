import { sitemapSections, urlsetXml, xmlResponse } from '@/lib/mvp/sitemap'
export const revalidate = 3600
export async function generateStaticParams() { return [] }

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const key = name.replace(/\.xml$/, '')
  const urls = (await sitemapSections())[key]
  if (!name.endsWith('.xml') || !urls?.length) return new Response('Not found', { status: 404 })
  return xmlResponse(urlsetXml(urls))
}
