import Link from 'next/link'
import {Shell,Breadcrumbs} from '@/components/mvp/Shell'
import {places,selectedTripPlaces} from '@/lib/mvp/data'
import {parseSelectedIds} from '@/lib/mvp/saved'
import {normalizeOptions,parsePlan,type CompanionPlace} from '@/lib/visit/companion'
import TripCompanion from '@/components/visit/TripCompanion'
export const dynamic='force-dynamic'
export const metadata={title:'Rencana Garut: biaya, waktu & perjalanan pulang',description:'Bandingkan tempat, rincikan budget rombongan, dan atur waktu pergi-pulang di Garut.',robots:{index:false,follow:true},alternates:{canonical:'/trip'}}
export default async function Trip({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const p=await searchParams;const value=(key:string)=>typeof p[key]==='string'?p[key] as string:''
 const selected=p.selected===undefined?undefined:(parseSelectedIds(value('selected'))??[])
 const initial=parsePlan(value('v'))
 if(!value('v')){initial.date=value('date')||new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());initial.budget=value('budget');const add=Number(value('add'));if(Number.isInteger(add)&&add>0)initial.stopIds=[add]}
 const legacyStart=Number(value('start'));if(legacyStart>0&&Number.isInteger(legacyStart)&&legacyStart<=2147483647)initial.originId=legacyStart
 if(p.intent==='family'&&!value('v'))initial.children=1
 const rows=selected===undefined?await places():await selectedTripPlaces(selected,initial.originId)
 const items:CompanionPlace[]=rows.map(x=>({id:x.id,slug:x.slug,name:x.name,category:x.category,district:x.district,excerpt:x.excerpt,image_url:x.image_url,source_url:x.source_url,website:x.website,whatsapp:x.whatsapp,latitude:x.latitude,longitude:x.longitude,practical:x.practical||null}))
 initial.stopIds=initial.stopIds.filter(id=>items.some(p=>p.id===id&&['wisata','kuliner','cafe'].includes(p.category)&&(selected===undefined||selected.includes(p.id)))&&id!==initial.originId)
 if(initial.originId!==-1&&!items.some(p=>p.id===initial.originId))initial.originId=-1
 return <Shell><section className="vg-wrap vg-section vg-trip-page"><Breadcrumbs items={[{name:'Rencana perjalanan',path:'/trip'}]}/><div className="vg-trip-page-heading"><span className="vg-eyebrow">SEBELUM BERANGKAT</span><h1>Rencana yang pas.<br/><em>Dari berangkat sampai pulang.</em></h1><p>Bandingkan tempat, lihat biaya yang sudah diketahui, dan sisakan waktu untuk perjalananmu.</p><div><span>01 Atur perjalanan</span><span>02 Bandingkan tempat</span><span>03 Cek biaya & waktu</span></div></div>{items.length?<TripCompanion places={items} initial={normalizeOptions(initial)} allowedIds={selected}/>:<div className="vg-empty"><h2>Tempat belum tersedia untuk pilihan ini</h2><p>Coba seluruh direktori atau kembali ke tempat tersimpan.</p><Link className="vg-button" href="/trip">Lihat seluruh pilihan</Link><Link href="/saved">Buka simpanan</Link></div>}</section></Shell>
}
