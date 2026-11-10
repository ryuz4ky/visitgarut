import { sitemapSections, indexXml, xmlResponse } from '@/lib/mvp/sitemap'
import { absoluteUrl } from '@/lib/site'
export const dynamic = 'force-dynamic'

const newest = (ds: (Date | undefined)[]) => { const t = ds.filter(Boolean).map(d => new Date(d!).getTime()); return t.length ? new Date(Math.max(...t)) : undefined }

/** Sitemap index: one file per section so Search Console reports coverage per category. */
export async function GET() {
  const sections = await sitemapSections()
  return xmlResponse(indexXml(Object.entries(sections).filter(([, urls]) => urls.length).map(([name, urls]) => ({ loc: absoluteUrl(`/sitemaps/${name}.xml`), lastmod: newest(urls.map(u => u.lastmod)) }))))
}
