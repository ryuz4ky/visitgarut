'use client'
import { useRef,useState,useTransition } from 'react'
import Link from 'next/link'
import { ReportForm } from './ContributionForm'
import type { YoutubeCommentPage } from '@/lib/pulse/youtube-public'
const date=(v:string)=>new Date(v).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jakarta'})
export default function YoutubeComments({placeId,videoId,title}:{placeId:number;videoId:string;title:string}){
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null)
 const [data,setData]=useState<YoutubeCommentPage|null>(null),[error,setError]=useState(''),[order,setOrder]=useState('newest'),[pending,startTransition]=useTransition()
 function load(page=0,nextOrder=order){
  setError('');startTransition(async()=>{try{
   const q=new URLSearchParams({place:String(placeId),video:videoId,page:String(page),order:nextOrder})
   const response=await fetch('/api/community/youtube?'+q,{cache:'no-store'})
   const result=await response.json();if(!response.ok)throw Error(result.error||'Komentar belum dapat dimuat.')
   setData(current=>page>0&&current?{...result,comments:[...current.comments,...result.comments]}:result)
  }catch(e){setError(e instanceof Error?e.message:'Komentar belum dapat dimuat.')}})
 }
 function open(){dialog.current?.showModal();if(!data)load()}
 return <><button className="vg-button vg-secondary" ref={trigger} onClick={open}>Baca komentar</button>
 <dialog className="pulse-dialog pulse-youtube-dialog" ref={dialog} aria-labelledby={'youtube-title-'+videoId} onClose={()=>trigger.current?.focus()}>
  <header><div><span className="pulse-youtube-brand">YouTube · komentar asli</span><h2 id={'youtube-title-'+videoId}>{title}</h2></div><button aria-label="Tutup komentar" onClick={()=>dialog.current?.close()}>✕</button></header>
  <p>Diurutkan dalam video ini saja. Teks dipertahankan utuh setelah pemeriksaan publikasi; komentar bukan bukti bahwa penulis pernah berkunjung. Tanggal di bawah adalah tanggal komentar, bukan tanggal kunjungan.</p>
  <p className="pulse-disclosure">Komentar dari YouTube API. Tidak diberi skor atau sentimen oleh VisitGarut. <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">Ketentuan YouTube</a> · <Link href="/privasi">Privasi</Link></p>
  <label className="pulse-comment-order">Urutan komentar<select disabled={pending} value={order} onChange={e=>{const next=e.target.value;setOrder(next);load(0,next)}}><option value="newest">Terbaru</option><option value="engagement">Suka terbanyak dalam video ini</option></select></label>
  {pending&&!data&&<p role="status">Memuat komentar…</p>}
  {error&&<div role="alert"><p>{error}</p><button className="vg-button vg-secondary" disabled={pending} onClick={()=>load()}>Coba lagi</button></div>}
  {data&&<><p className="pulse-disclosure">{data.video.creator} · video terbit {date(data.video.publishedAt)} · data diperbarui {date(data.video.checkedAt)}.</p>
  {data.comments.length===0&&<p className="vg-empty">Komentar video ini belum tersedia untuk publik. Kamu tetap bisa membaca percakapan di YouTube.</p>}
  {data.comments.map(c=><article className="pulse-evidence" key={c.id}>
   {c.parent&&<div className="pulse-parent"><span>Menanggapi komentar {c.parent.author}</span><blockquote className="youtube-original">{c.parent.text}</blockquote><small>{date(c.parent.publishedAt)} · <a href={c.parent.sourceUrl} target="_blank" rel="noopener noreferrer">Komentar induk ↗</a></small></div>}
   <strong>{c.authorUrl?<a href={c.authorUrl} target="_blank" rel="noopener noreferrer">{c.author}</a>:c.author}</strong><small>{date(c.publishedAt)} · {c.likes} suka di YouTube{c.parent?' · balasan':''}</small>
   <p className="youtube-original">{c.text}</p><a href={c.sourceUrl} target="_blank" rel="noopener noreferrer">Buka komentar asli ↗</a>
   <ReportForm placeId={placeId} youtubeCommentId={c.id}/>
  </article>)}
  {data.nextPage!==null&&<button className="vg-button vg-secondary" disabled={pending} onClick={()=>load(data.nextPage!)}>{pending?'Memuat…':'Baca komentar berikutnya'}</button>}
  <p><a href={data.video.sourceUrl} target="_blank" rel="noopener noreferrer">Lihat seluruh percakapan di YouTube ↗</a></p></>}
 </dialog></>
}
