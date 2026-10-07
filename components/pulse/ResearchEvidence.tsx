import { topics } from '@/lib/pulse/core'
import { sourceKinds,type ResearchEvidence } from '@/lib/pulse/research'
const day=(v:string)=>new Date(v).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jakarta'})
export default function PlaceResearch({items}:{items:ResearchEvidence[]}){
 if(!items.length)return null
 const sources=new Set(items.map(i=>i.source_url)).size
 return <div className="pulse-research" aria-labelledby="research-heading"><div className="pulse-research-heading"><div><span className="vg-eyebrow">SUMBER UNTUK MERENCANAKAN KUNJUNGAN</span><h3 id="research-heading">Riset VisitGarut</h3></div><span>{items.length} catatan · {sources} sumber</span></div><p>Catatan editorial dari informasi publik. Buka sumber untuk membaca konteksnya; catatan ini tidak masuk hitungan sentimen pengunjung.</p><div className="pulse-research-grid">{items.map(i=><article key={i.id}><span className="pulse-confidence">{topics[i.topic]}</span><h4>{i.title}</h4><p>{i.summary}</p><details><summary>Sumber & tanggal pemeriksaan</summary><p><strong>{i.publisher}</strong> · {sourceKinds[i.source_kind]}</p><p>{i.source_published_at?'Terbit '+day(i.source_published_at)+' · ':'Tanggal publikasi tidak tercantum · '}Diperiksa {day(i.checked_at)}</p>{i.limitations&&<p>{i.limitations}</p>}<a href={i.source_url} target="_blank" rel="noopener noreferrer">Baca sumber asli ↗</a></details></article>)}</div></div>
}
