'use client'
import { useState,useTransition } from 'react'
import Link from 'next/link'
import type { Pulse } from '@/lib/pulse/core'
import { loadYoutubePulse } from '@/lib/pulse/public-actions'
import { ContributionForm,ReportForm } from './ContributionForm'
import PlaceResearch from './ResearchEvidence'
import SocialMedia from './SocialMedia'
import DimensionRatings from './DimensionRatings'
import PulseOverview from './PulseOverview'
import type { SocialContent } from '@/lib/pulse/data'
import type { ResearchEvidence } from '@/lib/pulse/research'

export default function CommunityPulse({pulse:initial,placeId,research=[],contents=[],youtubeAvailable=false,rental=false}:{pulse:Pulse;placeId:number;research?:ResearchEvidence[];contents?:SocialContent[];youtubeAvailable?:boolean;rental?:boolean}){
 const [pulse,setPulse]=useState(initial),[consent,setConsent]=useState(false),[loaded,setLoaded]=useState(false)
 const [pending,startTransition]=useTransition(),[error,setError]=useState('')
 return <section id="community-pulse" className="pulse-section pulse-section-compact">
  <div className="vg-section-heading"><div><span className="vg-eyebrow">COMMUNITY PULSE</span><h2>{rental?'Apa kata pelanggan?':'Apa kata orang?'}</h2></div></div>
  <PulseOverview pulse={pulse} placeId={placeId} rental={rental}/>
  {contents.length>0&&<details className="pulse-supporting" id="sumber-pengalaman"><summary>Video & sumber percakapan <span>{contents.length} sumber</span></summary><SocialMedia contents={contents} placeId={placeId}/></details>}
  {research.length>0&&<details className="pulse-supporting" id="riset-tempat"><summary>Info praktis dari sumber publik <span>{research.length} catatan</span></summary><PlaceResearch items={research}/></details>}
  {pulse.ratings.length>0&&<details className="pulse-supporting"><summary>Penilaian aspek dari {rental?'pelanggan':'pengunjung'} VisitGarut</summary><DimensionRatings pulse={pulse} placeId={placeId}/></details>}
  {youtubeAvailable&&!loaded&&<details className="pulse-supporting"><summary>Tambahkan sampel YouTube yang tersedia</summary><div className="pulse-consent"><p>Tambahkan komentar YouTube yang telah diperiksa ke sampel ini. Dengan melanjutkan, Anda menyetujui <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">Ketentuan YouTube</a> dan memahami <Link href="/privasi">kebijakan privasi</Link> serta <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">privasi Google</a>.</p><label className="vg-checkbox"><input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)}/>Saya setuju memuat data YouTube.</label><button className="vg-button" disabled={!consent||pending} onClick={()=>startTransition(async()=>{try{setPulse(await loadYoutubePulse(placeId,consent));setLoaded(true)}catch{setError('Data YouTube belum dapat dimuat.')}})}>{pending?'Memuat…':'Tambahkan sampel YouTube'}</button>{error&&<p role="alert">{error}</p>}</div></details>}
  <ContributionForm placeId={placeId} rental={rental}/>
  <ReportForm placeId={placeId}/>
 </section>
}
