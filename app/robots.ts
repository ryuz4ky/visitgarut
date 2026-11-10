import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site'

const disallow = ['/admin', '/api/', '/search', '/account', '/partner', '/trip', '/claim', '/auth', '/login']
// Search and answer engines are welcome to read and cite public pages; private and transactional paths stay closed for everyone.
const answerEngines = ['Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot', 'Applebot-Extended', 'CCBot', 'DuckDuckBot']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow }, { userAgent: answerEngines, allow: '/', disallow }],
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
