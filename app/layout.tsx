import type { Metadata } from 'next'
import { siteUrl } from '@/lib/site'
import './mvp.css'
import './pulse.css'
import './pulse-globe.css'
export const metadata: Metadata={metadataBase:new URL(siteUrl),title:{default:'VisitGarut — Jelajahi Garut',template:'%s | VisitGarut'},description:'Pilih tempat di Garut dengan panduan lokal dan pengalaman pengunjung yang bisa ditelusuri melalui Community Pulse.',openGraph:{siteName:'VisitGarut',locale:'id_ID',type:'website'},robots:{index:true,follow:true}}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>}
