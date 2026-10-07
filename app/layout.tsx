import type { Metadata } from 'next'
import { siteUrl } from '@/lib/site'
import './mvp.css'
export const metadata: Metadata={metadataBase:new URL(siteUrl),title:{default:'VisitGarut — Jelajahi Garut',template:'%s | VisitGarut'},description:'Temukan tempat wisata, penginapan, kuliner, cafe, dan panduan perjalanan Garut.',openGraph:{siteName:'VisitGarut',locale:'id_ID',type:'website'},robots:{index:true,follow:true}}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>}
