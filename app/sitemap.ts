import type { MetadataRoute } from 'next'
import { sitemapRecords,categories } from '@/lib/mvp/data'
import { absoluteUrl } from '@/lib/site'
import { ratingEnabled } from '@/lib/rating/server'
export const dynamic='force-dynamic'

const newest=(dates:Date[])=>dates.length?new Date(Math.max(...dates.map(d=>new Date(d).getTime()))):undefined

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const {places:ps,articles:as}=await sitemapRecords()
 const lastPlace=newest(ps.map(p=>p.updated_at)),lastArticle=newest(as.map(a=>a.updated_at))
 const pages=['community-pulse','community-pulse/metode','event','privasi','ketentuan',...(ratingEnabled()?['rating/metode','untuk-usaha']:[])]
 return [
  {url:absoluteUrl('/'),lastModified:newest([lastPlace,lastArticle].filter(Boolean) as Date[]),priority:1},
  ...pages.map(s=>({url:absoluteUrl('/'+s),priority:0.5})),
  // Only categories with published listings; empty ones are noindex until they are filled.
  ...categories.filter(c=>ps.some(p=>p.category===c.slug)).map(c=>({url:absoluteUrl('/'+c.slug),lastModified:newest(ps.filter(p=>p.category===c.slug).map(p=>p.updated_at)),priority:0.8})),
  {url:absoluteUrl('/artikel'),lastModified:lastArticle,priority:0.8},
  {url:absoluteUrl('/map'),lastModified:lastPlace,priority:0.6},
  ...ps.map(p=>({url:absoluteUrl(`/${p.category}/${p.slug}`),lastModified:p.updated_at,priority:0.8})),
  ...as.map(a=>({url:absoluteUrl(`/artikel/${a.slug}`),lastModified:a.updated_at,priority:0.7})),
 ]
}
