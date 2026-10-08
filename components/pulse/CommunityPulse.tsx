'use client'
import { useState,useTransition } from 'react'
import Link from 'next/link'
import { platforms,type Pulse,type Topic } from '@/lib/pulse/core'
import { loadYoutubePulse } from '@/lib/pulse/public-actions'
import { ContributionForm,ReportForm } from './ContributionForm'
import PlaceResearch from './ResearchEvidence'
import SocialMedia from './SocialMedia'
import DimensionRatings from './DimensionRatings'
import InsightTable from './InsightTable'
import ResearchInsightTable from './ResearchInsightTable'
import PulseGlobe from './PulseGlobe'
import EvidencePanel, { type EvidenceOpenRequest } from './EvidencePanel'
import type { SocialContent } from '@/lib/pulse/data'
import type { ResearchEvidence } from '@/lib/pulse/research'
const date=(v:string)=>new Date(v).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jakarta'})

export default function CommunityPulse({pulse:initial,placeId,research=[],contents=[],youtubeAvailable=false,rental=false,globeEnabled=false}:{pulse:Pulse;placeId:number;research?:ResearchEvidence[];contents?:SocialContent[];youtubeAvailable?:boolean;rental?:boolean;globeEnabled?:boolean}){
 const [pulse,setPulse]=useState(initial),[consent,setConsent]=useState(false),[loaded,setLoaded]=useState(false)
 const [view,setView]=useState<'research'|'visitors'>(research.length&&initial.classified===0?'research':'visitors')
 const [pending,startTransition]=useTransition(),[error,setError]=useState('')
 const [openRequest,setOpenRequest]=useState<EvidenceOpenRequest|null>(null)
 const [evidenceOpen,setEvidenceOpen]=useState(false)
 function openEvidence(topic:Topic|null,trigger:HTMLButtonElement,evidenceId?:number){
   setEvidenceOpen(true)
   setOpenRequest(previous=>({topic,trigger,evidenceId,token:(previous?.token||0)+1}))
 }
 return <section id="community-pulse" className="pulse-section">
  <div className="vg-section-heading"><div><span className="vg-eyebrow">PENGALAMAN YANG BISA DITELUSURI</span><h2>Community Pulse</h2></div><Link href="/community-pulse/metode">Cara membaca bukti</Link></div>
  <p>{rental?'Periksa topik pengalaman pelanggan dan bukti di baliknya sebelum memilih penyedia rental.':'Periksa topik pengalaman pengunjung dan bukti di baliknya sebelum merencanakan kunjungan.'}</p>
  {globeEnabled&&<PulseGlobe pulse={pulse} onOpenEvidence={openEvidence} dialogOpen={evidenceOpen}/>}
  <div className="pulse-view-choice" role="group" aria-label="Jenis informasi Community Pulse"><button type="button" aria-pressed={view==='research'} onClick={()=>setView('research')}>Riset tempat <span>{research.length} catatan</span></button><button type="button" aria-pressed={view==='visitors'} onClick={()=>setView('visitors')}>Pengalaman {rental?'pelanggan':'pengunjung'} <span>{pulse.classified} dalam sampel</span></button></div>
  {view==='research'?<ResearchInsightTable items={research} placeId={placeId}/>:<InsightTable pulse={pulse} placeId={placeId} rental={rental} hasSources={contents.length>0} onOpenEvidence={openEvidence}/>}
  {pulse.ratings.length>0&&<><h3 className="pulse-visitor-heading">Penilaian {rental?'pelanggan':'pengunjung'} VisitGarut</h3><DimensionRatings pulse={pulse} placeId={placeId}/></>}
  {pulse.classified>0&&<><div className="pulse-stats"><div><strong>{pulse.positivePercent===null?'Belum cukup data':pulse.positivePercent+'% positif'}</strong><small>{pulse.positivePercent===null?'Persentase muncul setelah minimal 10 kontribusi terklasifikasi.':`Dari ${pulse.classified} kontribusi terklasifikasi, termasuk netral dan campuran.`}</small></div><div><strong>{pulse.classified} terklasifikasi</strong><small>Sampel dengan sumber berbeda yang telah diperiksa dalam 90 hari.</small></div><div><strong>{pulse.lastUpdated?date(pulse.lastUpdated):'Menunggu pengalaman'}</strong><small>Pemeriksaan bukti terakhir</small></div></div><p className="pulse-disclosure">Ringkasan dari sampel kontribusi yang disetujui. {pulse.limited&&'Sampel dibatasi pada 1.000 kontribusi terbaru. '}</p></>}
  <PlaceResearch items={research}/>
  <SocialMedia contents={contents} placeId={placeId}/>
  {pulse.evidence.length>0&&<div className="pulse-all-evidence-cta">
   <p>Seluruh komentar dan post yang dapat ditampilkan dalam sampel tersedia dalam satu panel dengan sumber dan filter.</p>
   <button type="button" className="vg-button" onClick={e=>openEvidence(null,e.currentTarget)}>Lihat semua {pulse.evidence.length} komentar / post</button>
  </div>}
  {youtubeAvailable&&!loaded&&<div className="pulse-consent"><p>Bukti YouTube opsional</p><p>Tambahkan komentar YouTube yang telah diperiksa ke sampel ini. Dengan melanjutkan, Anda menyetujui <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">Ketentuan YouTube</a> dan memahami <Link href="/privasi">kebijakan privasi</Link> serta <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">privasi Google</a>.</p><label className="vg-checkbox"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>Saya setuju memuat data YouTube.</label><button className="vg-button" disabled={!consent||pending} onClick={()=>startTransition(async()=>{try{setPulse(await loadYoutubePulse(placeId,consent));setLoaded(true)}catch{setError('Data YouTube belum dapat dimuat.')}})}>{pending?'Memuat…':'Tambahkan bukti YouTube'}</button>{error&&<p role="alert">{error}</p>}</div>}
  <EvidencePanel pulse={pulse} placeId={placeId} rental={rental} request={openRequest} onDismiss={()=>setEvidenceOpen(false)}/>
  <ContributionForm placeId={placeId} rental={rental}/>
  <ReportForm placeId={placeId}/>
 </section>
}
