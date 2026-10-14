import {Shell,Breadcrumbs} from '@/components/mvp/Shell'
import SavedPlaces from '@/components/saved/SavedPlaces'
export const metadata={title:'Tempat tersimpan',description:'Kumpulkan pilihan tempat di Garut dan gunakan untuk merencanakan perjalanan.',alternates:{canonical:'/saved'},robots:{index:false,follow:true}}
export default function Saved(){return <Shell><section className="vg-wrap vg-section"><Breadcrumbs items={[{name:'Simpanan',path:'/saved'}]}/><span className="vg-eyebrow">PILIHAN PERJALANANMU</span><h1>Tempat pilihanmu di Garut</h1><p className="vg-intro">Simpan tempat yang ingin kamu kunjungi. Daftar ini tersimpan di browser, tanpa perlu login.</p><SavedPlaces/></section></Shell>}
