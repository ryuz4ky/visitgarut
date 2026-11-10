import { Shell } from '@/components/mvp/Shell'
import { photoCredits } from '@/lib/mvp/photo-credits'
export const metadata={title:'Kredit Foto',robots:{index:false,follow:true}}
export default function Credits(){return <Shell><section className="vg-wrap vg-section vg-prose"><h1>Kredit foto</h1><p>Foto tempat berasal dari Wikimedia Commons dengan lisensi terbuka. Foto telah diperkecil untuk web dan dapat dipotong oleh tampilan kartu atau banner. Derivatif foto tetap menggunakan lisensi masing-masing. Pengelola tempat yang ingin mengganti foto dengan foto resmi dapat menghubungi kami lewat halaman tempatnya.</p>
 {photoCredits.map(c=><div key={c.image}><h2>{c.place}</h2><p><a href={c.page}>{c.title}</a> — {c.author}{c.year?`, ${c.year}`:''}. <a href={c.licenseUrl}>{c.license}</a>.{c.note?` ${c.note}`:''}{c.usedFor?<> Dipakai sebagai foto kawasan (bukan foto tempatnya) untuk: {c.usedFor}.</>:null}</p></div>)}
</section></Shell>}
