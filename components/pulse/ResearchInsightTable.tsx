'use client'
import { useRef,useState } from 'react'
import { topics,type Topic } from '@/lib/pulse/core'
import { researchTopicGroups,sourceKinds,type ResearchEvidence,type ResearchTopicGroup } from '@/lib/pulse/research'

const kindLabels={authority:'Instansi',operator:'Pengelola',report:'Liputan',directory:'Direktori'}
const date=(value:string)=>new Date(value).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jakarta'})

export default function ResearchInsightTable({items,placeId}:{items:ResearchEvidence[];placeId:number}){
 const [selectedTopic,setSelectedTopic]=useState<Topic|null>(null)
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement|null>(null)
 const rows=researchTopicGroups(items),selected=rows.find(row=>row.topic===selectedTopic)
 const sources=new Set(items.map(item=>item.source_url)).size
 function open(row:ResearchTopicGroup,button:HTMLButtonElement){trigger.current=button;setSelectedTopic(row.topic);dialog.current?.showModal()}
 return <div className="pulse-insight-block">
  <div className="pulse-insight-heading"><h3>Riset tempat</h3><span>{sources} sumber publik</span></div>
  <p id={'pulse-research-help-'+placeId}>Informasi dari instansi, pengelola, dan publikasi untuk merencanakan perjalanan. Klik topik atau jumlah sumber untuk membaca catatan dan tanggalnya.</p>
  {rows.length?<table className="pulse-insight-table pulse-research-table" aria-describedby={'pulse-research-help-'+placeId}>
   <caption className="pulse-table-caption">Topik riset tempat, jumlah URL sumber berbeda, dan jenis sumber</caption>
   <thead><tr><th scope="col">Insight</th><th scope="col">Bukti</th><th scope="col">Jenis sumber</th></tr></thead>
   <tbody>{rows.map(row=><tr key={row.topic}>
    <th scope="row"><button type="button" aria-haspopup="dialog" aria-label={'Periksa riset '+topics[row.topic]} onClick={event=>open(row,event.currentTarget)}><span className="pulse-research-topic"><strong>{topics[row.topic]}</strong><small>{row.items[0].title}</small></span></button></th>
    <td><button type="button" className="pulse-table-count" aria-haspopup="dialog" aria-label={'Periksa '+row.sourceCount+' sumber riset '+topics[row.topic]} onClick={event=>open(row,event.currentTarget)}><strong>{row.sourceCount}</strong><small>sumber</small></button></td>
    <td><span className="pulse-research-kind">{row.sourceKinds.length===1?kindLabels[row.sourceKinds[0]]:'Beragam'}</span></td>
   </tr>)}</tbody>
  </table>:<p className="pulse-table-empty">Catatan riset belum tersedia untuk tempat ini.</p>}
  <p className="pulse-research-disclosure">Bukti di sini menghitung URL sumber berbeda per topik. Catatan riset tidak menilai kepuasan, kebersihan, kemacetan, atau keamanan berdasarkan pengalaman pengunjung.</p>
  <dialog ref={dialog} className="pulse-dialog pulse-insight-dialog" aria-labelledby={'pulse-research-title-'+placeId} onClose={()=>{setSelectedTopic(null);trigger.current?.focus()}}>
   <header><div><span className="vg-eyebrow">RISET SUMBER PUBLIK</span><h2 id={'pulse-research-title-'+placeId}>{selected?topics[selected.topic]:''}</h2></div><button type="button" aria-label="Tutup riset" onClick={()=>dialog.current?.close()}>✕</button></header>
   {selected&&<><p>{selected.sourceCount} URL sumber berbeda · {selected.items.length} catatan. Pemeriksaan sumber daring, bukan kunjungan lapangan.</p>
    {selected.items.map(item=><article className="pulse-evidence pulse-research-evidence" key={item.id}>
     <span className="pulse-research-kind">{sourceKinds[item.source_kind]}</span><h3>{item.title}</h3><p>{item.summary}</p><strong>{item.publisher}</strong>
     <small>{item.source_published_at?'Terbit '+date(item.source_published_at):'Tanggal publikasi tidak tercantum'} · Diperiksa {date(item.checked_at)}</small>
     {item.limitations&&<p className="pulse-disclosure">{item.limitations}</p>}
     <a href={item.source_url} target="_blank" rel="noopener noreferrer">Buka sumber riset asli ↗</a>
    </article>)}
    <div className="pulse-insight-next"><a href="#riset-tempat" onClick={()=>dialog.current?.close()}>Baca semua catatan riset</a><a href={'#pengalaman-form-'+placeId} onClick={()=>dialog.current?.close()}>Bagikan pengalamanmu</a></div>
   </>}
  </dialog>
 </div>
}
