'use client'
import { useRef,useState } from 'react'
import { platforms,sentimentNames,type Pulse,type Topic,type TopicStatus } from '@/lib/pulse/core'
import { ReportForm } from './ContributionForm'

const symbols:Record<Topic,string>={pemandangan:'🌄',aktivitas:'📷',keluarga:'👪',pelayanan:'🤝',harga:'💰',akses:'🛣️',lalu_lintas:'🚗',parkir:'🅿️',kebersihan:'🧼',fasilitas:'🚻',keramaian:'👥',tiket:'🎟️',keamanan:'🛡️'}
const labels:Partial<Record<Topic,string>>={keluarga:'Bersama keluarga',harga:'Harga',lalu_lintas:'Lalu lintas',fasilitas:'Fasilitas & toilet',tiket:'Tiket di luar kanal resmi'}
const priority:Topic[]=['pemandangan','keluarga','lalu_lintas','harga','tiket','kebersihan','keamanan']
const rentalPriority:Topic[]=['pelayanan','harga','akses','fasilitas','kebersihan','keamanan']
const confidenceLabels={'tinggi':'Tinggi','sedang':'Sedang','rendah':'Rendah','belum cukup':'Belum cukup'}
const confidenceClasses={'tinggi':'high','sedang':'medium','rendah':'low','belum cukup':'insufficient'}
const date=(v:string)=>new Date(v).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jakarta'})

export default function InsightTable({pulse,placeId,rental=false,hasSources=false}:{pulse:Pulse;placeId:number;rental?:boolean;hasSources?:boolean}){
 const [selectedTopic,setSelectedTopic]=useState<Topic|null>(null)
 const [sentiment,setSentiment]=useState(''),[platform,setPlatform]=useState(''),[sort,setSort]=useState('newest')
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement|null>(null)
 const main=rental?rentalPriority:priority
 const rows=pulse.topicStatuses.filter(s=>main.includes(s.topic)||(s.count??0)>0||pulse.insights.some(i=>i.topic===s.topic))
  .sort((a,b)=>Number(a.missing!==null)-Number(b.missing!==null)||(b.count??0)-(a.count??0)||(main.indexOf(a.topic)<0?99:main.indexOf(a.topic))-(main.indexOf(b.topic)<0?99:main.indexOf(b.topic)))
 const selected=pulse.topicStatuses.find(s=>s.topic===selectedTopic)
 const insight=pulse.insights.find(i=>i.topic===selectedTopic)
 const ids=new Set(selected?.evidenceIds||[])
 const related=pulse.evidence.filter(e=>ids.has(e.id))
 const sourcePlatforms=Array.from(new Set(related.map(e=>e.platform)))
 const shown=related.filter(e=>(!platform||e.platform===platform)&&(!sentiment||e.topics.some(t=>t.topic===selectedTopic&&t.sentiment===sentiment)))
  .sort((a,b)=>sort==='engagement'?b.engagement_count-a.engagement_count:Date.parse(b.published_at)-Date.parse(a.published_at))
 function open(status:TopicStatus,button:HTMLButtonElement){trigger.current=button;setSelectedTopic(status.topic);setSentiment('');setPlatform('');setSort('newest');dialog.current?.showModal()}
 return <div className="pulse-insight-block">
  <div className="pulse-insight-heading"><h3>Insight pengalaman</h3><span>{pulse.windowDays} hari terakhir</span></div>
  <p id={'pulse-table-help-'+placeId}>Klik topik atau jumlah bukti untuk membaca pengalaman dan konteksnya.</p>
  <table className="pulse-insight-table" aria-describedby={'pulse-table-help-'+placeId}>
   <caption className="pulse-table-caption">Insight pengalaman, bukti, dan tingkat keyakinan</caption>
   <thead><tr><th scope="col">Insight</th><th scope="col">Bukti</th><th scope="col">Keyakinan</th></tr></thead>
   <tbody>{rows.map(s=><tr key={s.topic}>
    <th scope="row"><button type="button" aria-haspopup="dialog" aria-label={'Periksa bukti '+s.label} onClick={e=>open(s,e.currentTarget)}><span className="pulse-topic-icon" aria-hidden="true">{symbols[s.topic]}</span><span>{labels[s.topic]||s.label}</span></button></th>
    <td><button type="button" className="pulse-table-count" aria-haspopup="dialog" aria-label={'Periksa jumlah bukti '+s.label} onClick={e=>open(s,e.currentTarget)}><strong>{s.count===null?'—':s.count}</strong><small>{s.count===null?'Diperiksa':'kontribusi'}</small></button></td>
    <td><span className={'pulse-status '+confidenceClasses[s.confidence]}><span aria-hidden="true"/>{confidenceLabels[s.confidence]}</span></td>
   </tr>)}</tbody>
  </table>
  {!pulse.insights.length&&<p className="pulse-table-empty">Ringkasan menunggu kontribusi yang telah diperiksa dan memiliki sumber identitas berbeda. Belum cukup bukti untuk menyimpulkan pengalaman di tempat ini.</p>}
  <details className="pulse-confidence-guide"><summary>Cara menghitung bukti dan keyakinan</summary><p>Satu akun atau pengunjung dihitung sekali per topik. Rendah: 3–5 kontribusi berbeda. Sedang: minimal 6. Tinggi: minimal 15, dari 2 platform, dengan minimal 3 dalam 30 hari terakhir. Keyakinan menunjukkan kecukupan sampel, bukan kepastian suatu pernyataan.</p><p>Topik sensitif membutuhkan minimal 6 sumber identitas, 2 sumber konten, dan pemeriksaan seluruh bukti. Jumlah serta isi laporannya menunggu semua syarat terpenuhi. Komentar video dan catatan riset dibaca terpisah dari hitungan ini.</p></details>
  {hasSources&&<a className="pulse-table-source-link" href="#sumber-pengalaman">Baca video dan komentar asli</a>}
  <dialog ref={dialog} className="pulse-dialog pulse-insight-dialog" aria-labelledby={'pulse-insight-title-'+placeId} onClose={()=>{setSelectedTopic(null);trigger.current?.focus()}}>
   <header><div><span className="vg-eyebrow">BUKTI COMMUNITY PULSE</span><h2 id={'pulse-insight-title-'+placeId}>{selected?.label}</h2></div><button type="button" aria-label="Tutup bukti" onClick={()=>dialog.current?.close()}>✕</button></header>
   {selected&&<>
    <p><span className={'pulse-status '+confidenceClasses[selected.confidence]}><span aria-hidden="true"/>{confidenceLabels[selected.confidence]}</span> · {pulse.windowDays} hari terakhir</p>
    {insight?<><p>{insight.summary}</p><p>{insight.count} kontribusi berbeda · {insight.sourceCount} sumber konten · {insight.platformCount} platform.</p><div className="pulse-insight-breakdown">{Object.entries(sentimentNames).map(([key,label])=><span key={key}>{label}: {insight[key as keyof typeof sentimentNames]}</span>)}</div><p className="pulse-disclosure">Tren jumlah kontribusi: {insight.trend}{insight.trend==='belum cukup data'?'':` (${insight.previous30} → ${insight.current30}, dua periode 30 hari).`}</p></>:<div className="pulse-insight-pending"><h3>Ringkasan belum tersedia</h3>{selected.sensitive?<p>Belum ada cukup bukti yang layak diterbitkan untuk topik ini. Laporan sensitif membutuhkan minimal 6 sumber identitas berbeda, 2 sumber konten, dan pemeriksaan konteks seluruh bukti.</p>:<p>{selected.count||0} kontribusi dengan sumber identitas berbeda dapat dihitung. Ringkasan membutuhkan minimal 3. Pengalaman individual di bawah ini belum menjadi kesimpulan umum.</p>}</div>}
    {selected.sensitive&&insight&&<p className="vg-alert">Laporan komunitas, bukan temuan pelanggaran oleh VisitGarut. Periksa konteks dan tanggal setiap sumber.</p>}
    {related.length>0?<><div className="pulse-filters"><label>Sentimen<select value={sentiment} onChange={e=>setSentiment(e.target.value)}><option value="">Semua</option>{Object.entries(sentimentNames).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><label>Platform<select value={platform} onChange={e=>setPlatform(e.target.value)}><option value="">Semua</option>{sourcePlatforms.map(p=><option key={p} value={p}>{platforms[p]}</option>)}</select></label><label>Urutan<select value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Terbaru</option><option value="engagement">Interaksi sumber tertinggi</option></select></label></div><p role="status">{shown.length} bukti sesuai filter.</p>{shown.map(e=><article className="pulse-evidence" key={e.id}><strong>{platforms[e.platform]} · {e.display_name||'Pengunjung anonim'}</strong><small>Terbit {date(e.published_at)}{e.experience_date?' · pengalaman '+date(e.experience_date):''} · {sentimentNames[e.topics.find(t=>t.topic===selectedTopic)!.sentiment]}</small><p>{e.original_text}</p>{e.source_url&&<a href={e.source_url} target="_blank" rel="noopener noreferrer">Buka sumber asli</a>}<ReportForm placeId={placeId} mentionId={e.id}/></article>)}{!shown.length&&<p>Tidak ada bukti dalam filter ini.</p>}</>:<p>Teks bukti akan tersedia di sini setelah lolos pemeriksaan publikasi.</p>}
    <div className="pulse-insight-next"><a href={'#pengalaman-form-'+placeId} onClick={()=>dialog.current?.close()}>Bagikan pengalaman{rental?' menyewamu':' kunjunganmu'}</a>{hasSources&&<a href="#sumber-pengalaman" onClick={()=>dialog.current?.close()}>Baca video dan komentar asli</a>}</div>
   </>}
  </dialog>
 </div>
}
