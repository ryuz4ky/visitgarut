'use client'
import { useRef, useState } from 'react'
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
const insights: Insight[]=examples.map(e=>{
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
const evidence: Evidence[]=insights.flatMap(i=>i.evidenceIds.map(id=>({
  id,platform:'visitgarut' as const, original_text:'CONTOH SAJA: bukti simulasi, bukan komentar pengunjung asli.',
  display_name:'Data Demo',source_url:'',published_at:'2026-10-08T12:00:00+07:00',
  experience_date:null,sentiment:'mixed' as const,engagement_count:0,
  topics:[{topic:i.topic,sentiment:'mixed' as const}],ratings:[],
})))
const pulse: Pulse={
  insights,topicStatuses,evidence,ratings:[],classified:evidence.length,
  positivePercent:null,lastUpdated:'2026-10-08T12:00:00+07:00',windowDays:90,limited:false,
}

export default function PulseGlobeDemo(){
  const [selected,setSelected]=useState<Topic|null>(null)
  const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement|null>(null)
  const item=insights.find(i=>i.topic===selected)
  return <>
    <div role="note" className="vg-alert" style={{marginBottom:20}}>
      <strong>DEMO VISUAL — DATA FIKTIF</strong>
      <p>Semua topik, angka, dan kecenderungan pada halaman ini dibuat khusus untuk menguji desain. Bukan analisis tempat wisata nyata.</p>
    </div>
    <PulseGlobe pulse={pulse} onOpenTopic={(topic,button)=>{
      trigger.current=button;setSelected(topic);if(!dialog.current?.open)dialog.current?.showModal()
    }}/>
    <dialog className="pulse-dialog" ref={dialog} aria-labelledby="pulse-demo-dialog-title"
      onClose={()=>{setSelected(null);trigger.current?.focus()}}>
      <header><div><span className="vg-eyebrow">PREVIEW INTERAKSI — SIMULASI</span>
        <h2 id="pulse-demo-dialog-title">{item?.label||'Topik contoh'}</h2></div>
        <button type="button" aria-label="Tutup dialog" onClick={()=>dialog.current?.close()}>✕</button></header>
      {item&&<><p>{item.summary}</p><p>{item.count} kontributor ilustratif. Detail bukti asli sengaja tidak ditampilkan pada demo ini.</p>
        <p>Di halaman destinasi asli, panel ini menggunakan dialog evidence Community Pulse yang sama dengan tabel insight.</p></>}
    </dialog>
  </>
}
