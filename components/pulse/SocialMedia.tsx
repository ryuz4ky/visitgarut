'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { SocialContent } from '@/lib/pulse/data'
import { platforms } from '@/lib/pulse/core'
import YoutubeComments from './YoutubeComments'
const date=(v:string)=>new Date(v).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jakarta'})
export default function SocialMedia({contents,placeId}:{contents:SocialContent[];placeId:number}){
 const [loaded,setLoaded]=useState<number[]>([]),[platform,setPlatform]=useState('')
 const available=[...new Set(contents.map(c=>c.platform))],shown=contents.filter(c=>!platform||c.platform===platform)
 if(!contents.length)return null
 return <section className="pulse-sources"><div className="vg-section-heading"><div><span className="vg-eyebrow">LIHAT KONTEKSNYA LANGSUNG</span><h3>Video & percakapan tentang tempat ini</h3></div>{available.length>1&&<label className="pulse-comment-order">Platform sumber<select value={platform} onChange={e=>setPlatform(e.target.value)}><option value="">Semua platform</option>{available.map(p=><option key={p} value={p}>{platforms[p]}</option>)}</select></label>}</div>
 <p>Konten dipilih karena membahas lokasi ini. Baca setiap sumber secara terpisah; komentar penonton belum menjadi ringkasan pengalaman pengunjung.</p>
 <div className="pulse-media-grid">{shown.map(c=>{const video=c.platform==='tiktok'||c.platform==='youtube'&&c.can_embed,ready=loaded.includes(c.id);const src=c.platform==='youtube'?`https://www.youtube-nocookie.com/embed/${c.source_post_id}?autoplay=0`:`https://www.tiktok.com/player/v1/${c.source_post_id}?autoplay=0&description=1&music_info=1`
 return <article className="pulse-media" key={c.id}>
  <a className={c.platform==='youtube'?'pulse-youtube-brand':'vg-eyebrow'} href={c.source_url} target="_blank" rel="noopener noreferrer">{c.platform==='youtube'&&<svg aria-hidden="true" viewBox="0 0 28 20" width="28" height="20"><path fill="#f00" d="M27.4 3.1a3.5 3.5 0 0 0-2.5-2.5C22.7 0 14 0 14 0S5.3 0 3.1.6A3.5 3.5 0 0 0 .6 3.1C0 5.3 0 10 0 10s0 4.7.6 6.9a3.5 3.5 0 0 0 2.5 2.5C5.3 20 14 20 14 20s8.7 0 10.9-.6a3.5 3.5 0 0 0 2.5-2.5C28 14.7 28 10 28 10s0-4.7-.6-6.9Z"/><path fill="#fff" d="m11 14 7-4-7-4Z"/></svg>}{platforms[c.platform]}</a>
  <h4>{c.title}</h4>{c.creator&&<p>{c.creator_url?<a href={c.creator_url} target="_blank" rel="noopener noreferrer">{c.creator}</a>:c.creator}</p>}
  {c.published_at&&<small>Video terbit {date(c.published_at)}{c.checked_at?' · data diperbarui '+date(c.checked_at):''}</small>}
  {video&&(ready?<iframe src={src} title={c.title} referrerPolicy="strict-origin-when-cross-origin" allow="encrypted-media; fullscreen; picture-in-picture" allowFullScreen/>:<div className="pulse-player-placeholder"><p>Putar di sini saat kamu ingin menonton. Platform dapat menerima IP dan data browsermu.</p><button className="vg-button vg-secondary" onClick={()=>setLoaded(current=>[...current,c.id])}>Muat pemutar {platforms[c.platform]}</button><p><Link href="/privasi">Privasi</Link>{c.platform==='youtube'&&<> · <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">Ketentuan YouTube</a></>}</p></div>)}
  <div className="pulse-source-actions">{c.platform==='youtube'&&c.comments_available&&<YoutubeComments placeId={placeId} videoId={c.source_post_id} title={c.title}/>}<a href={c.source_url} target="_blank" rel="noopener noreferrer">Buka sumber asli ↗</a></div>
  <small>{c.api_source?'Judul, kreator, dan tanggal bersumber dari YouTube API.':'Judul kurasi VisitGarut.'} {c.platform==='youtube'&&!c.comments_available?'Komentar belum diterbitkan di VisitGarut; buka percakapan pada sumber asli.':'Publikasi sumber tidak mengubahnya menjadi penilaian VisitGarut.'}</small>
 </article>})}</div></section>
}
