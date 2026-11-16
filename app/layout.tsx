import type { Metadata, Viewport } from 'next'
import { siteUrl } from '@/lib/site'
import LangSync from '@/components/mvp/LangSync'
import Analytics from '@/components/mvp/Analytics'
import './mvp.css'
import './pulse.css'
import './pulse-evidence.css'
import './visitgarut2.css'
import './travel-dashboard.css'
import './trip-companion.css'
import './brand.css'
import './home.css'
import './explore.css'
import './place.css'
import './planner.css'
import './pulse-brand.css'
import './rating.css'
import './readable.css'
export const viewport: Viewport={themeColor:'#f4f5ef'}
export const metadata: Metadata={metadataBase:new URL(siteUrl),title:{default:'VisitGarut — Rencana Garut, lebih jelas',template:'%s | VisitGarut'},description:'Rencanakan kunjungan Garut dengan biaya yang jelas, informasi kelompok, sumber yang bisa diperiksa, dan perjalanan pergi-pulang.',openGraph:{siteName:'VisitGarut',locale:'id_ID',type:'website'},twitter:{card:'summary_large_image'},robots:{index:true,follow:true},...(process.env.GOOGLE_SITE_VERIFICATION||process.env.BING_SITE_VERIFICATION?{verification:{...(process.env.GOOGLE_SITE_VERIFICATION?{google:process.env.GOOGLE_SITE_VERIFICATION}:{}),...(process.env.BING_SITE_VERIFICATION?{other:{'msvalidate.01':process.env.BING_SITE_VERIFICATION}}:{})}}:{})}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="id"><head>
 <link rel="preload" href="/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/>
 <link rel="preload" href="/fonts/inter-tight-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/>
</head><body><LangSync/>{children}<Analytics/></body></html>}
