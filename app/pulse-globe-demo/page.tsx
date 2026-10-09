import { notFound } from 'next/navigation'
import PulseGlobeDemo from '@/components/pulse/PulseGlobeDemo'
import { Shell } from '@/components/mvp/Shell'

export const dynamic='force-dynamic'
export const metadata={
  title:'Pulse Globe — Visual Prototype',
  robots:{index:false,follow:false},
}

export default function Page(){
  // A review utility, never publish a fictional sentiment demo on the real website.
  if(process.env.VERCEL_ENV!=='preview' && process.env.NODE_ENV!=='development') notFound()
  return <Shell><section className="vg-wrap vg-section">
    <span className="vg-eyebrow">VISITGARUT 2.0 · PROTOTYPE</span>
    <h1>Pulse Globe — Preview interaktif</h1>
    <p className="vg-intro">Uji globe, warna sentimen, animasi, aksesibilitas dan interaksi klik topik sebelum data nyata diaktifkan.</p>
    <PulseGlobeDemo />
  </section></Shell>
}
