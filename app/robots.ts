import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site'
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:'/',disallow:['/admin','/api/','/search','/account','/partner','/trip','/claim','/auth','/login']},sitemap:absoluteUrl('/sitemap.xml')}}
