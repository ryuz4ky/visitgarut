'use client'
import { useState } from 'react'
import EvidencePanel, { type EvidenceOpenRequest } from './EvidencePanel'
import PulseGlobe from '@/components/pulse/PulseGlobe'
import type { Pulse, Topic, Insight, Evidence, TopicStatus } from '@/lib/pulse/core'

/**
 * PREVIEW-ONLY UI fixture. These numbers and records are fictitious.
 * Never use this component as an actual visitor sentiment data source.
 */
const examples: { topic: Topic; label: string; count: number; positive: number; negative: number; neutral: number; mixed: number; summary: string }[] = [
  { topic: 'pemandangan', label: 'Pemandangan', count: 18, positive: 15, neutral: 2, mixed: 1, negative: 0, summary: 'Contoh: pembicaraan didominasi apresiasi pemandangan.' },
  { topic: 'aktivitas', label: 'Aktivitas', count: 13, positive: 10, neutral: 1, mixed: 2, negative: 0, summary: 'Contoh: aktivitas dan spot foto sering disebut.' },
  { topic: 'akses', label: 'Akses jalan', count: 12, positive: 3, negative: 4, neutral: 1, mixed: 4, summary: 'Contoh: persepsi akses berbeda menurut pengalaman.' },
  { topic: 'parkir', label: 'Parkir', count: 9, positive: 2, negative: 5, neutral: 0, mixed: 2, summary: 'Contoh: sebagian percakapan menyinggung keterbatasan parkir.' },
  { topic: 'fasilitas', label: 'Fasilitas', count: 8, positive: 2, negative: 1, neutral: 5, mixed: 0, summary: 'Contoh: pembicaraan fasilitas cenderung informatif.' },
  { topic: 'kebersihan', label: 'Kebersihan', count: 6, positive: 2, negative: 1, neutral: 0, mixed: 3, summary: 'Contoh: pengalaman mengenai kebersihan beragam.' },
  { topic: 'keramaian', label: 'Keramaian', count: 5, positive: 0, negative: 4, neutral: 1, mixed: 0, summary: 'Contoh: keramaian menjadi salah satu hal yang diperhatikan.' },
]

let nextId=1
const insights: Insight[]=examples.map((e): Insight=>{
  const evidenceIds=Array.from({length:e.count},()=>nextId++)
  return {
    topic:e.topic,label:e.label,count:e.count,
    positive:e.positive,negative:e.negative,neutral:e.neutral,mixed:e.mixed,
    sourceCount:e.count,platformCount:2,confidence:e.count>=15?'tinggi':e.count>=6?'sedang':'rendah',
    summary:e.summary,evidenceIds,sensitive:false,trend:'stabil',current30:3,previous30:3,
  }
})
const topicStatuses: TopicStatus[]=insights.map(i=>({
  topic:i.topic,label:i.label,count:i.count,confidence:i.confidence,
  sensitive:false,evidenceIds:i.evidenceIds,missing:null,
}))
const channels = ['youtube','instagram','tiktok','threads','x','visitgarut'] as const
const sampleTexts = [
 'SIMULASI — View dari atasnya bagus sekali, banyak spot untuk foto.',
 'SIMULASI — Jalan menuju lokasi agak menanjak, siapkan kendaraan.',
 'SIMULASI — Suasananya sejuk dan nyaman untuk bersantai.',
 'SIMULASI — Fasilitasnya lumayan, tetapi masih bisa diperbaiki.',
 'SIMULASI — Kalau ramai lebih baik datang lebih pagi.',
 'SIMULASI — Pemandangannya benar-benar menarik saat cuaca cerah.',
]
const evidence: Evidence[]=insights.flatMap(i=>i.evidenceIds.map(id=>({
  id,platform:channels[id % channels.length],original_text:sampleTexts[id % sampleTexts.length],
  display_name:'Akun demo '+id,source_url:'',
  published_at:'2026-10-08T12:00:00+07:00',experience_date:null,
  sentiment:'mixed' as const,engagement_count:0,
  topics:[{topic:i.topic,sentiment:'mixed' as const}],ratings:[],
})))
const pulse: Pulse={
  insights,topicStatuses,evidence,ratings:[],classified:evidence.length,
  positivePercent:null,lastUpdated:'2026-10-08T12:00:00+07:00',windowDays:90,limited:false,
}

export default function PulseGlobeDemo(){
  const [request,setRequest]=useState<EvidenceOpenRequest|null>(null)
  const [open,setOpen]=useState(false)
  function openEvidence(topic:Topic|null,trigger:HTMLButtonElement,evidenceId?:number){
    setOpen(true)
    setRequest(previous=>({token:(previous?.token||0)+1,topic,trigger,evidenceId}))
  }
  return <>
    <div role="note" className="vg-alert" style={{marginBottom:20}}>
      <strong>DEMO VISUAL — DATA FIKTIF</strong>
      <p>Semua topik, akun, komentar, sumber, dan angka pada halaman ini simulasi UI. Tidak mencerminkan pengunjung wisata sebenarnya.</p>
    </div>
    <PulseGlobe pulse={pulse} onOpenEvidence={openEvidence} dialogOpen={open}/>
    <div className="pulse-all-evidence-cta">
      <p>Globe hanya menampilkan sejumlah cuplikan. Seluruh komentar dalam dataset demo dapat dibaca melalui panel yang sama.</p>
      <button className="vg-button" type="button" onClick={e=>openEvidence(null,e.currentTarget)}>
        Lihat semua {pulse.evidence.length} komentar simulasi
      </button>
    </div>
    <EvidencePanel pulse={pulse} placeId={999999} request={request} onDismiss={()=>setOpen(false)}/>
  </>
}
