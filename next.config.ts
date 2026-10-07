import type { NextConfig } from 'next'
const nextConfig:NextConfig={output:'standalone',experimental:{cpus:1},images:{unoptimized:true,remotePatterns:[{protocol:'https',hostname:'images.unsplash.com'},{protocol:'https',hostname:'upload.wikimedia.org'}]},async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},{key:'X-Frame-Options',value:'SAMEORIGIN'}]}]}}
export default nextConfig
