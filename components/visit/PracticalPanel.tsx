import {Wallet,Users,MapPin,Clock} from 'lucide-react'
import type {Place} from '@/lib/mvp/data'
import type {ResearchEvidence} from '@/lib/pulse/research'
import {currentPractical,rupiah,tariffRows} from '@/lib/visit/practical'
export default function PracticalPanel({place,research}:{place:Place;research:ResearchEvidence[]}){
 if(place.category!=='wisata')return null
 const info=place.practical;const current=currentPractical(info)
 const fact=(topic:string)=>research.find(x=>x.topic===topic)
 const rows=[
  {title:'Untuk kelompokmu',icon:Users,text:info?.familyNote||fact('keluarga')?.summary||'Fasilitas untuk anak, kebutuhan orang tua, dan akses kursi roda belum dirinci. Tanyakan sesuai kebutuhan rombongan.'},
  {title:'Akses & berjalan kaki',icon:MapPin,text:info?.accessNote||fact('akses')?.summary||'Kondisi jalan dan jarak dari parkir ke area kunjungan perlu dikonfirmasi.'},
  {title:'Jam & waktu kunjungan',icon:Clock,text:info?.hoursNote||'Jam operasional untuk tanggal kunjungan belum dikonfirmasi.'},
 ]
 return <section className="vg-practical-panel" id="praktis" aria-labelledby="practical-title"><div className="vg-practical-heading"><div><span className="vg-eyebrow">SEBELUM MEMILIH</span><h2 id="practical-title">Yang perlu kamu tahu</h2><p>Biaya, kebutuhan rombongan, dan akses dalam satu tempat.</p></div></div>
 <div className="vg-practical-grid"><article className="vg-practical-cost"><Wallet size={22}/><h3>Tiket & biaya lain</h3><dl>{tariffRows(info).map(row=><div key={row.label}><dt>Dewasa · {row.label}</dt><dd>{current&&row.amount!==null?rupiah(row.amount):'Perlu konfirmasi'}</dd></div>)}</dl><p>{info?.priceNote||fact('harga')?.summary||'Tarif terperinci belum tersedia. Tanyakan total sesuai jumlah pengunjung dan kegiatan.'}</p><small>{info?.extrasNote||'Parkir, kegiatan, dan sewa fasilitas belum dihitung.'}</small></article>{rows.map(({title,icon:Icon,text})=><article key={title}><Icon size={22}/><h3>{title}</h3><p>{text}</p></article>)}</div>
 <div className="vg-practical-evidence">{info?<><span>Rujukan: <a href={info.sourceUrl} target="_blank" rel="noopener noreferrer">{info.publisher} ↗</a> · diperiksa {info.checkedAt}{!current?' · periksa ulang tarif':''}</span><span>Pemeriksaan sumber daring; belum konfirmasi langsung untuk tanggalmu.</span></>:<span>Informasi kunjungan masih perlu dilengkapi. <a href={place.website||place.source_url} target="_blank" rel="noopener noreferrer">Periksa kanal sumber ↗</a></span>}</div></section>
}
