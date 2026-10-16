import type { Metadata } from 'next'
import { siteUrl } from '@/lib/site'
import './mvp.css'
import './pulse.css'
import './pulse-globe.css'
import './pulse-evidence.css'
import './visitgarut2.css'
import './travel-dashboard.css'
import './trip-companion.css'
export const metadata: Metadata={metadataBase:new URL(siteUrl),title:{default:'VisitGarut — Rencana Garut, lebih jelas',template:'%s | VisitGarut'},description:'Rencanakan kunjungan Garut dengan biaya yang jelas, informasi kelompok, sumber yang bisa diperiksa, dan perjalanan pergi-pulang.',openGraph:{siteName:'VisitGarut',locale:'id_ID',type:'website'},robots:{index:true,follow:true}}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>}
