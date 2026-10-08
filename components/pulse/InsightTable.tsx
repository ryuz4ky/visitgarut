'use client'
import { type Pulse, type Topic, type TopicStatus } from '@/lib/pulse/core'

const symbols:Record<Topic,string>={pemandangan:'🌄',aktivitas:'📷',keluarga:'👪',pelayanan:'🤝',harga:'💰',akses:'🛣️',lalu_lintas:'🚗',parkir:'🅿️',kebersihan:'🧼',fasilitas:'🚻',keramaian:'👥',tiket:'🎟️',keamanan:'🛡️'}
const labels:Partial<Record<Topic,string>>={keluarga:'Bersama keluarga',harga:'Harga',lalu_lintas:'Lalu lintas',fasilitas:'Fasilitas & toilet',tiket:'Tiket di luar kanal resmi'}
const priority:Topic[]=['pemandangan','keluarga','lalu_lintas','harga','tiket','kebersihan','keamanan']
const rentalPriority:Topic[]=['pelayanan','harga','akses','fasilitas','kebersihan','keamanan']
const confidenceLabels={'tinggi':'Tinggi','sedang':'Sedang','rendah':'Rendah','belum cukup':'Belum cukup'}
const confidenceClasses={'tinggi':'high','sedang':'medium','rendah':'low','belum cukup':'insufficient'}

export default function InsightTable({
 pulse, placeId, rental=false, hasSources=false, onOpenEvidence,
}:{
 pulse:Pulse;placeId:number;rental?:boolean;hasSources?:boolean;
 onOpenEvidence:(topic:Topic,trigger:HTMLButtonElement)=>void
}){
 const main=rental?rentalPriority:priority
 const rows=pulse.topicStatuses.filter(s=>main.includes(s.topic)||(s.count??0)>0||pulse.insights.some(i=>i.topic===s.topic))
  .sort((a,b)=>Number(a.missing!==null)-Number(b.missing!==null)||(b.count??0)-(a.count??0)||(main.indexOf(a.topic)<0?99:main.indexOf(a.topic))-(main.indexOf(b.topic)<0?99:main.indexOf(b.topic)))
 return <div className="pulse-insight-block">
  <div className="pulse-insight-heading"><h3>Insight pengalaman</h3><span>{pulse.windowDays} hari terakhir</span></div>
  <p id={'pulse-table-help-'+placeId}>Klik topik atau jumlah bukti untuk membaca pengalaman dan konteksnya.</p>
  <table className="pulse-insight-table" aria-describedby={'pulse-table-help-'+placeId}>
   <caption className="pulse-table-caption">Insight pengalaman, bukti, dan tingkat keyakinan</caption>
   <thead><tr><th scope="col">Insight</th><th scope="col">Bukti</th><th scope="col">Keyakinan</th></tr></thead>
   <tbody>{rows.map(s=><tr key={s.topic}>
    <th scope="row"><button type="button" aria-haspopup="dialog" aria-label={'Periksa bukti '+s.label} onClick={e=>onOpenEvidence(s.topic,e.currentTarget)}><span className="pulse-topic-icon" aria-hidden="true">{symbols[s.topic]}</span><span>{labels[s.topic]||s.label}</span></button></th>
    <td><button type="button" className="pulse-table-count" aria-haspopup="dialog" aria-label={'Periksa jumlah bukti '+s.label} onClick={e=>onOpenEvidence(s.topic,e.currentTarget)}><strong>{s.count===null?'—':s.count}</strong><small>{s.count===null?'Diperiksa':'kontribusi'}</small></button></td>
    <td><span className={'pulse-status '+confidenceClasses[s.confidence]}><span aria-hidden="true"/>{confidenceLabels[s.confidence]}</span></td>
   </tr>)}</tbody>
  </table>
  {!pulse.insights.length&&<p className="pulse-table-empty">Ringkasan menunggu kontribusi yang telah diperiksa dan memiliki sumber identitas berbeda. Belum cukup bukti untuk menyimpulkan pengalaman di tempat ini.</p>}
  <details className="pulse-confidence-guide"><summary>Cara menghitung bukti dan keyakinan</summary><p>Satu akun atau pengunjung dihitung sekali per topik. Rendah: 3–5 kontribusi berbeda. Sedang: minimal 6. Tinggi: minimal 15, dari 2 platform, dengan minimal 3 dalam 30 hari terakhir. Keyakinan menunjukkan kecukupan sampel, bukan kepastian suatu pernyataan.</p><p>Topik sensitif membutuhkan minimal 6 sumber identitas, 2 sumber konten, dan pemeriksaan seluruh bukti. Jumlah serta isi laporannya menunggu semua syarat terpenuhi. Komentar video dan catatan riset dibaca terpisah dari hitungan ini.</p></details>
  {hasSources&&<a className="pulse-table-source-link" href="#sumber-pengalaman">Baca video dan komentar asli</a>}
 </div>
}
