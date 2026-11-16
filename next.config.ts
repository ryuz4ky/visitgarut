import type { NextConfig } from 'next'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
// Only the file listing is loaded here; image work runs in a separate process (below) so its memory is freed before the build starts.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const variants = require('./scripts/image-variants.cjs') as { available: () => string[] }

const longCache = [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }]
const nextConfig:NextConfig={output:'standalone',htmlLimitedBots:/.*/,experimental:{cpus:1},images:{unoptimized:true,remotePatterns:[{protocol:'https',hostname:'images.unsplash.com'},{protocol:'https',hostname:'upload.wikimedia.org'}]},async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},{key:'X-Frame-Options',value:'SAMEORIGIN'}]},{source:'/places/:file*',headers:longCache},{source:'/fonts/:file*',headers:[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]},{source:'/:file(papandayan|situ-bagendit|talaga-bodas)(.*)',headers:longCache}]}}

/** Production builds first write WebP copies of the site's photos, then tell the pages which ones exist. */
export default async function config(phase: string): Promise<NextConfig> {
  if (phase === PHASE_PRODUCTION_BUILD && !process.env.VG_IMAGE_VARIANTS_DONE) {
    try { execFileSync(process.execPath, [path.join(process.cwd(), 'scripts/image-variants.cjs')], { stdio: 'inherit', timeout: 180000, env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=128' } }) } catch (e) { console.log('image-variants: skipped,', (e as Error).message) }
    process.env.VG_IMAGE_VARIANTS_DONE = '1'
  }
  let list: string[] = []
  try { list = variants.available() } catch {}
  return { ...nextConfig, env: { NEXT_PUBLIC_VG_WEBP: list.join(',') } }
}
