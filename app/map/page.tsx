import { Shell,Breadcrumbs } from '@/components/mvp/Shell'
import { places } from '@/lib/mvp/data'
import MapClient from '@/components/mvp/MapClient'
export const dynamic='force-dynamic'
export const metadata={title:'Peta Tempat Wisata Garut',description:'Jelajahi lokasi tempat wisata dan bisnis lokal di Garut.',alternates:{canonical:'/map'}}
export default async function MapPage(){const items=await places();return <Shell><section className="vg-wrap vg-section"><Breadcrumbs items={[{name:'Peta',path:'/map'}]}/><h1>Garut, dalam satu peta.</h1><p className="vg-intro">Pilih tempat untuk melihat detail. Titik peta menunjukkan perkiraan kawasan; cek rute dan pintu masuk sebelum berangkat.</p><MapClient items={items.map(p=>({id:p.id,name:p.name,category:p.category,slug:p.slug,district:p.district,latitude:p.latitude,longitude:p.longitude}))}/></section></Shell>}
