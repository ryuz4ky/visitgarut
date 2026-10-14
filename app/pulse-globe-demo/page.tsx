import PulseGlobeDemo from '@/components/pulse/PulseGlobeDemo'
import { Shell } from '@/components/mvp/Shell'

export const dynamic='force-dynamic'
export const metadata={
  title:'Pulse Globe — Visual Prototype',
  robots:{index:false,follow:false},
}

export default function Page(){
  return <Shell><section className="vg-wrap vg-section">
    <span className="vg-eyebrow">VISITGARUT · PERCOBAAN PUBLIK</span>
    <h1>Coba Pulse Globe</h1>
    <p className="vg-intro">Halaman percobaan untuk menguji animasi dan panel semua komentar. Seluruh data di halaman ini adalah simulasi dan tidak mewakili tempat wisata tertentu.</p>
    <PulseGlobeDemo />
  </section></Shell>
}
