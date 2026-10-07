import type { MetadataRoute } from 'next'
import { places,articles,categories } from '@/lib/mvp/data'
import { absoluteUrl } from '@/lib/site'
export const dynamic='force-dynamic'
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const [ps,as]=await Promise.all([places(),articles()]);return [{url:absoluteUrl('/'),priority:1},...['community-pulse','privasi','ketentuan'].map(s=>({url:absoluteUrl('/'+s),priority:0.5})),...categories.filter(c=>ps.some(p=>p.category===c.slug)).map(c=>({url:absoluteUrl('/'+c.slug),priority:0.8})),{url:absoluteUrl('/artikel'),priority:0.8},{url:absoluteUrl('/map'),priority:0.6},...ps.map(p=>({url:absoluteUrl(`/${p.category}/${p.slug}`),lastModified:p.updated_at,priority:0.8})),...as.map(a=>({url:absoluteUrl(`/artikel/${a.slug}`),lastModified:a.updated_at,priority:0.7}))]}
