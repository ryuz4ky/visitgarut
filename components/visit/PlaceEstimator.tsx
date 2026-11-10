'use client'
import {useMemo,useState} from 'react'
import Link from 'next/link'
import {Minus,Plus,ArrowUpRight,MessageCircle} from 'lucide-react'
import {listedEntry,type PracticalInfo} from '@/lib/visit/practical'

const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
const idr=(n:number)=>`Rp${n.toLocaleString('id-ID')}`

function Counter({label,value,min,onChange}:{label:string;value:number;min:number;onChange:(n:number)=>void}){
 return <div className="vp-counter"><span>{label}</span><span className="vp-counter-ctrl">
  <button type="button" aria-label={`Kurangi ${label.toLowerCase()}`} disabled={value<=min} onClick={()=>onChange(Math.max(min,value-1))}><Minus size={16} aria-hidden="true"/></button>
  <output aria-live="polite">{value}</output>
  <button type="button" aria-label={`Tambah ${label.toLowerCase()}`} disabled={value>=50} onClick={()=>onChange(Math.min(50,value+1))}><Plus size={16} aria-hidden="true"/></button>
 </span></div>
}

/** Group estimate built only from sourced, current adult tariffs. Unknowns stay marked as unknown. */
export default function PlaceEstimator({placeId,name,practical,whatsapp,plannable}:{placeId:number;name:string;practical:PracticalInfo|null;whatsapp:string;plannable:boolean}){
 const [date,setDate]=useState(today)
 const [adults,setAdults]=useState(2)
 const [children,setChildren]=useState(0)
 const adult=useMemo(()=>listedEntry(practical,date,'auto'),[practical,date])
 const adultTotal=adult===null?null:adult*adults
 const wa=whatsapp.replace(/\D/g,'')
 const message=`Halo, saya ingin berkunjung ke ${name} pada ${date} untuk ${adults} dewasa${children?` dan ${children} anak`:''}. Mohon konfirmasi jam buka, tarif tiket dewasa dan anak, parkir, serta biaya tambahan. Terima kasih.`
 return <form className="vp-estimator" onSubmit={e=>e.preventDefault()} aria-labelledby="vp-est-title">
  <h2 id="vp-est-title">Perkiraan biaya rombongan</h2>
  <label>Tanggal kunjungan<input type="date" value={date} min={today()} onChange={e=>setDate(e.target.value)}/></label>
  <Counter label="Dewasa" value={adults} min={1} onChange={setAdults}/>
  <Counter label="Anak" value={children} min={0} onChange={setChildren}/>
  <dl>
   <div><dt>Tiket {adults} dewasa</dt><dd>{adultTotal===null?<span className="vp-unknown">Perlu konfirmasi</span>:idr(adultTotal)}</dd></div>
   {children>0&&<div><dt>Tiket {children} anak</dt><dd><span className="vp-unknown">Perlu konfirmasi</span></dd></div>}
   <div><dt>Parkir &amp; kegiatan</dt><dd><span className="vp-unknown">Belum dihitung</span></dd></div>
   <div className="vp-total"><dt>Yang sudah diketahui</dt><dd>{adultTotal===null?'—':idr(adultTotal)}</dd></div>
  </dl>
  <p className="vp-est-note">{adult===null?'Tarif untuk tanggal ini belum tersedia atau sudah lebih dari 30 hari sejak diperiksa.':'Dari tarif dewasa yang bersumber. Biaya lain ditanyakan ke pengelola.'}</p>
  {plannable&&<Link className="vg-pill-cta is-dark vp-est-cta" href={`/trip?add=${placeId}&date=${date}`}>Tambah ke rencana<span className="vg-pill-cta-icon"><ArrowUpRight size={18} aria-hidden="true"/></span></Link>}
  {wa&&<a className="vg-button vg-secondary" href={`https://wa.me/${wa}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} aria-hidden="true"/>Tanya pengelola via WhatsApp</a>}
 </form>
}
