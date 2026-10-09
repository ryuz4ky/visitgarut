'use client'
import { useRef,useState } from 'react'
import Link from 'next/link'
import { platforms,sentimentNames,type Pulse,type Sentiment,type Topic } from '@/lib/pulse/core'
import { overviewEvidence } from '@/lib/pulse/overview'
import { ReportForm } from './ContributionForm'

const order:Sentiment[]=['positive','mixed','neutral','negative']
const date=(value:string)=>new Date(value).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jakarta'})
type Selection=Topic|'all'|'quality'|null

export default function PulseOverview({pulse,placeId,rental=false,onOpenEvidence}:{pulse:Pulse;placeId:number;rental?:boolean;onOpenEvidence?:(topic:Topic|null,trigger:HTMLButtonElement)=>void}){
 const overview=pulse.overview
 const [selection,setSelection]=useState<Selection>(null),[expanded,setExpanded]=useState(false),[platform,setPlatform]=useState(''),[sentiment,setSentiment]=useState('')
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement|null>(null)
 const topic=overview.topics.find(t=>t.topic===selection)
 const related=overviewEvidence(pulse.evidence,topic?.evidenceIds||overview.evidenceIds)
 const sourcePlatforms=[...new Set(related.map(row=>row.platform))]
 const shown=related.filter(row=>(!platform||row.platform===platform)&&(!sentiment||(topic?row.topics.find(t=>t.topic===topic.topic)?.sentiment:row.sentiment)===sentiment))
 const title=selection==='quality'?'Cara komentar dipilih':selection==='all'?'Semua komentar terkurasi':topic?.label||''
 const quality=overview.quality,excluded=quality.repeatedAccount+quality.identicalText+quality.withoutTopic+quality.unclassified
 function open(next:Selection,button:HTMLButtonElement){if(next!=='quality'&&onOpenEvidence){onOpenEvidence(next==='all'?null:next,button);return}trigger.current=button;setSelection(next);setPlatform('');setSentiment('');dialog.current?.showModal();if(dialog.current)dialog.current.scrollTop=0}
 return <div className="pulse-overview">
  <p className="pulse-overview-summary">{overview.summary}</p>
  {overview.sampleSize>0?<p className="pulse-overview-meta">{overview.sampleSize} komentar tersaring · {overview.platforms.length} platform · {pulse.windowDays} hari terakhir{pulse.limited?' · sampel dibatasi':''}</p>:<p className="pulse-overview-meta">Persentase muncul setelah tersedia cukup komentar yang sesuai dengan tempat dan dapat dianalisis.</p>}
  {overview.percentages&&<div className="pulse-sentiment-overview"><div className="pulse-sentiment-strip" aria-hidden="true">{order.filter(key=>overview.sentiments[key]>0).map(key=><span key={key} className={'sentiment-'+key} style={{flex:overview.sentiments[key]}}/>)}</div><ul aria-label="Sentimen keseluruhan dalam sampel">{order.map(key=><li key={key}><span className={'pulse-sentiment-dot sentiment-'+key} aria-hidden="true"/>{overview.percentages![key]}% {sentimentNames[key].toLowerCase()}</li>)}</ul></div>}
  {!overview.percentages&&overview.sampleSize>0&&<p className="pulse-overview-meta">Sampel awal; persentase menunggu minimal 10 komentar dari identitas akun berbeda.</p>}
  {overview.topics.length>0&&<><div className="pulse-topics-heading"><h3>Paling sering dibahas</h3><span>Proporsi dari {overview.sampleSize} komentar tersaring</span></div><div className="pulse-topic-cards">{overview.topics.slice(0,expanded?undefined:5).map(item=>{
   const leading=order.reduce((best,key)=>item.sentiments[key]>item.sentiments[best]?key:best,'positive')
   return <button type="button" className="pulse-topic-card" key={item.topic} aria-haspopup="dialog" aria-label={'Baca '+item.count+' komentar tentang '+item.label} onClick={event=>open(item.topic,event.currentTarget)}>
    <span className="pulse-topic-copy"><strong>{item.label}</strong><span>{item.headline}</span></span><span className="pulse-topic-number"><strong>{item.percent===null?item.count:item.percent+'%'}</strong><small>{item.percent===null?'komentar':item.count+' komentar'}</small></span>
    <span className="pulse-topic-detail"><span>{item.sentiments[leading]} dari {item.count} komentar topik ini {sentimentNames[leading].toLowerCase()}</span><span className="pulse-topic-open">Lihat komentar →</span></span>
   </button>
  })}</div>{overview.topics.length>5&&<button type="button" className="pulse-overview-link" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?'Ringkas topik':'Lihat '+(overview.topics.length-5)+' topik lainnya'}</button>}<p className="pulse-overview-meta pulse-overlap-note">Satu komentar dapat membahas beberapa topik. Persentase topik tidak harus berjumlah 100%.</p></>}
  <div className="pulse-overview-actions">{overview.sampleSize>0&&<button type="button" className="pulse-overview-link" aria-haspopup="dialog" onClick={event=>open('all',event.currentTarget)}>Lihat semua {overview.sampleSize} komentar</button>}<button type="button" className="pulse-overview-link" aria-haspopup="dialog" onClick={event=>open('quality',event.currentTarget)}>{excluded?excluded+' kontribusi tidak dihitung · lihat alasan':'Cara komentar dipilih'}</button></div>
  {overview.platforms.length>0&&<p className="pulse-overview-meta">Cakupan sampel: {overview.platforms.map(key=>platforms[key]).join(', ')}. {pulse.lastUpdated?'Diperiksa '+date(pulse.lastUpdated)+'. ':''}Keaslian kunjungan belum terverifikasi.</p>}
  <dialog className="pulse-dialog pulse-overview-dialog" ref={dialog} aria-labelledby={'pulse-overview-title-'+placeId} onClose={()=>{setSelection(null);trigger.current?.focus()}}>
   <header><div><span className="vg-eyebrow">COMMUNITY PULSE</span><h2 id={'pulse-overview-title-'+placeId}>{title}</h2></div><button type="button" aria-label="Tutup komentar dan ringkasan" onClick={()=>dialog.current?.close()}>✕</button></header>
   {selection==='quality'?<div className="pulse-quality-detail">
    <p>Ringkasan memakai komentar relevan yang telah diperiksa dan memiliki dasar penggunaan untuk analisis. Setiap angka dapat ditelusuri ke komentar pendukungnya.</p>
    {quality.evaluated>0&&<dl><div><dt>Kontribusi yang dapat dievaluasi</dt><dd>{quality.evaluated}</dd></div><div><dt>Masuk sampel ringkasan</dt><dd>{overview.sampleSize}</dd></div>{quality.repeatedAccount>0&&<div><dt>Kontribusi berulang dari akun yang sama</dt><dd>{quality.repeatedAccount}</dd></div>}{quality.identicalText>0&&<div><dt>Salinan panjang dengan teks identik</dt><dd>{quality.identicalText}</dd></div>}{quality.withoutTopic>0&&<div><dt>Belum memiliki topik yang dikurasi</dt><dd>{quality.withoutTopic}</dd></div>}{quality.unclassified>0&&<div><dt>Sentimen belum diklasifikasikan</dt><dd>{quality.unclassified}</dd></div>}</dl>}
    <h3>Bagaimana dengan bot atau review palsu?</h3><p>Status keaslian: belum dapat dipastikan. Kesamaan teks atau aktivitas akun belum membuktikan bot, dan komentar yang tampak wajar belum membuktikan kunjungan nyata.</p><p>Satu identitas akun memakai komentar terbarunya yang memenuhi syarat. Salinan teks panjang dihitung sekali. Akun berbeda yang membahas pengalaman serupa tetap dapat dihitung; kritik tidak dikeluarkan hanya karena negatif.</p><p>Persentase menggambarkan sampel yang berhasil dikumpulkan dalam {pulse.windowDays} hari, bukan seluruh percakapan internet atau semua {rental?'pelanggan':'pengunjung'}. Platform yang belum terhubung tidak masuk hitungan.</p><Link href="/community-pulse/metode">Baca metode lengkap</Link>
   </div>:selection&&<>
    <p className="pulse-overview-meta">{related.length} komentar · {sourcePlatforms.length} platform · {pulse.windowDays} hari terakhir · terbaru dahulu</p>
    {topic&&<><p>{topic.headline}</p><div className="pulse-insight-breakdown">{order.map(key=><span key={key}>{sentimentNames[key]}: {topic.sentiments[key]}</span>)}</div></>}
    {topic?.sensitive&&<p className="vg-alert">Laporan komunitas, bukan temuan pelanggaran oleh VisitGarut. Periksa konteks dan tanggal sumber.</p>}
    {related.length>3&&<div className="pulse-filters pulse-overview-filters"><label>Sentimen<select value={sentiment} onChange={event=>setSentiment(event.target.value)}><option value="">Semua sentimen</option>{order.map(key=><option value={key} key={key}>{sentimentNames[key]}</option>)}</select></label>{sourcePlatforms.length>1&&<label>Platform<select value={platform} onChange={event=>setPlatform(event.target.value)}><option value="">Semua platform</option>{sourcePlatforms.map(key=><option key={key} value={key}>{platforms[key]}</option>)}</select></label>}</div>}
    <p className="pulse-overview-meta" role="status">{shown.length} komentar ditampilkan.</p>
    {shown.map(row=><article className="pulse-evidence" key={row.id}><strong>{platforms[row.platform]} · {row.display_name||'Nama tidak ditampilkan'}</strong><small>Terbit {date(row.published_at)} · {sentimentNames[(topic?row.topics.find(t=>t.topic===topic.topic)!.sentiment:row.sentiment) as Sentiment]}</small><p>{row.original_text}</p><small>{row.experience_date?'Tanggal pengalaman yang dilaporkan: '+date(row.experience_date):'Tanggal kunjungan tidak diketahui.'} Keaslian kunjungan belum terverifikasi.</small>{row.source_url&&<a href={row.source_url} target="_blank" rel="noopener noreferrer">Buka komentar / sumber asli ↗</a>}<ReportForm placeId={placeId} mentionId={row.id}/></article>)}
    {!shown.length&&<p>Tidak ada komentar sesuai filter ini.</p>}
   </>}
  </dialog>
 </div>
}
