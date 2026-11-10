'use client'
import {useEffect,useMemo,useRef,useState,type CSSProperties,type PointerEvent} from 'react'
import {buildResearchGlobeNodes,publicResearchItems} from '@/lib/pulse/research-globe'
import {clampPitch,projectGlobePoint} from '@/lib/pulse/globe-motion'
import {topics,type Topic} from '@/lib/pulse/core'
import {sourceKinds,type ResearchEvidence} from '@/lib/pulse/research'

const date=(value:string)=>new Date(value).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jakarta'})
export default function ResearchGlobe({items,placeId}:{items:ResearchEvidence[];placeId:number}) {
 const records=useMemo(()=>publicResearchItems(items),[items])
 const nodes=useMemo(()=>buildResearchGlobeNodes(records),[records])
 const stage=useRef<HTMLDivElement>(null),dialog=useRef<HTMLDialogElement>(null)
 const trigger=useRef<HTMLButtonElement|null>(null)
 const [paused,setPaused]=useState(false),[selected,setSelected]=useState<Topic|null>(null)
 const motion=useRef({yaw:0,pitch:0,hover:false,focused:false,paused:false,open:false,drag:null as null|{id:number;x:number;y:number;startX:number;startY:number;moved:boolean},suppress:false})
 useEffect(()=>{motion.current.paused=paused},[paused])
 useEffect(()=>{
  const element=stage.current
  if(!element||!nodes.length)return
  const buttons=Array.from(element.querySelectorAll<HTMLButtonElement>('[data-research-topic]'))
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)')
  let reduced=preference.matches,raf=0,visible=false,last=0
  const change=(event:MediaQueryListEvent)=>{reduced=event.matches}
  preference.addEventListener('change',change)
  function frame(now:number) {
   if(!visible||document.hidden){raf=0;last=0;return}
   const state=motion.current,dt=Math.min(48,now-(last||now));last=now
   if(!reduced&&!state.paused&&!state.open&&!state.hover&&!state.focused&&!state.drag)state.yaw+=dt*Math.PI*2/80000
   nodes.forEach((node,index)=>{
    const button=buttons[index];if(!button)return
    const position=projectGlobePoint(node,state.yaw,state.pitch)
    button.style.left=position.left.toFixed(3)+'%'
    button.style.top=position.top.toFixed(3)+'%'
    button.style.opacity=position.opacity.toFixed(3)
    button.style.zIndex=String(Math.round((position.depth+1)*100))
    button.style.setProperty('--pulse-scale',String(position.perspective))
   })
   raf=window.requestAnimationFrame(frame)
  }
  const start=()=>{if(visible&&!document.hidden&&!raf)raf=window.requestAnimationFrame(frame)}
  const observer=new IntersectionObserver(entries=>{
   visible=!!entries[0]?.isIntersecting
   if(visible)start();else{window.cancelAnimationFrame(raf);raf=0;last=0}
  },{threshold:.01})
  const visibility=()=>{if(document.hidden){window.cancelAnimationFrame(raf);raf=0;last=0}else start()}
  observer.observe(element);document.addEventListener('visibilitychange',visibility)
  return ()=>{observer.disconnect();preference.removeEventListener('change',change);document.removeEventListener('visibilitychange',visibility);window.cancelAnimationFrame(raf)}
 },[nodes])
 function open(topic:Topic|null,button:HTMLButtonElement) {
  trigger.current=button;setSelected(topic);motion.current.open=true
  dialog.current?.showModal()
 }
 function down(event:PointerEvent<HTMLDivElement>) {
  if(event.button!==0)return
  motion.current.drag={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moved:false}
  motion.current.suppress=false
 }
 function move(event:PointerEvent<HTMLDivElement>) {
  const state=motion.current,drag=state.drag
  if(!drag){
   if(event.pointerType==='mouse'){
    const rect=event.currentTarget.getBoundingClientRect()
    state.yaw=(event.clientX-rect.left-rect.width/2)/rect.width*.9
    state.pitch=clampPitch(-(event.clientY-rect.top-rect.height/2)/rect.height*.6)
   }
   return
  }
  if(drag.id!==event.pointerId)return
  if(!drag.moved&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>7){
   drag.moved=true;state.suppress=true;event.currentTarget.setPointerCapture(event.pointerId)
  }
  if(drag.moved){state.yaw+=(event.clientX-drag.x)*.009;state.pitch=clampPitch(state.pitch+(event.clientY-drag.y)*.009)}
  drag.x=event.clientX;drag.y=event.clientY
 }
 function end(event:PointerEvent<HTMLDivElement>) {
  if(motion.current.drag?.id!==event.pointerId)return
  motion.current.drag=null
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)
 }
 const shown=selected===null?records:records.filter(item=>item.topic===selected)
 if(!records.length)return null
 return <section className="pulse-globe pulse-research-globe" aria-labelledby={'place-globe-title-'+placeId}>
  <div className="pulse-globe-intro"><div><span className="vg-eyebrow">KENALI TEMPATNYA</span><h3 id={'place-globe-title-'+placeId}>Informasi tempat dari berbagai sumber</h3><p>Pilih topik untuk membaca catatan dari pengelola, instansi, dan sumber publik.</p><p className="pulse-globe-hint">Gerakkan pointer atau tarik Globe untuk memutar.</p></div><button type="button" className="pulse-globe-pause" aria-pressed={paused} onClick={()=>setPaused(value=>!value)}>{paused?'Putar otomatis':'Jeda putaran otomatis'}</button></div>
  <div className="pulse-globe-layout">
   <div ref={stage} className="pulse-globe-stage" data-paused={paused} aria-label="Globe informasi tempat; tarik untuk memutar"
    onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
    onPointerEnter={()=>{motion.current.hover=true}} onPointerLeave={()=>{motion.current.hover=false}}
    onFocusCapture={()=>{motion.current.focused=true}} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))motion.current.focused=false}}
    onClickCapture={event=>{if(motion.current.suppress){event.preventDefault();event.stopPropagation();motion.current.suppress=false}}}>
    <div className="pulse-globe-sphere" aria-hidden="true"><div className="pulse-globe-equator"/><div className="pulse-globe-meridian"/><div className="pulse-globe-latitude"/></div>
    <div className="pulse-globe-rotor">{nodes.map(node=><button type="button" key={node.topic} data-research-topic={node.topic} className="pulse-globe-node"
     style={{left:(50+node.x*37)+'%',top:(50-node.y*37)+'%'} as CSSProperties} aria-haspopup="dialog"
     aria-label={node.label+', '+node.notes+' catatan dari '+node.sourceCount+' sumber. Baca informasi.'} onClick={event=>open(node.topic,event.currentTarget)}>
     <strong>{node.label}</strong><small>{node.notes} catatan · {node.sourceCount} sumber</small></button>)}</div>
   </div>
   <div className="pulse-globe-side"><p className="pulse-globe-caption">Informasi bersumber</p><strong className="pulse-globe-total">{records.length} catatan · {new Set(records.map(item=>item.source_url)).size} sumber</strong><p className="pulse-globe-method">Catatan ini menjelaskan informasi yang dicantumkan sumber. Ringkasan pengalaman pengunjung menggunakan komentar yang tersedia.</p><div className="pulse-globe-chips">{nodes.map(node=><button type="button" key={node.topic} aria-haspopup="dialog" onClick={event=>open(node.topic,event.currentTarget)}>{node.label}<span>{node.notes}</span></button>)}</div><button type="button" className="pulse-globe-pause" onClick={event=>open(null,event.currentTarget)}>Baca semua informasi tempat</button></div>
  </div>
  <div className="pulse-globe-seo-summary"><h4>Informasi penting sebelum berkunjung</h4><ul>{nodes.map(node=><li key={node.topic}><strong>{node.label}</strong> — {node.items[0].summary}</li>)}</ul></div>
  <dialog ref={dialog} className="pulse-dialog pulse-evidence-drawer" aria-labelledby={'research-dialog-title-'+placeId}
   onClose={()=>{motion.current.open=false;trigger.current?.focus()}}>
   <header className="pulse-drawer-header"><div><span className="vg-eyebrow">INFORMASI BERSUMBER</span><h2 id={'research-dialog-title-'+placeId}>{selected===null?'Semua informasi tempat':'Informasi '+topics[selected]}</h2><p>{shown.length} catatan</p></div><button type="button" aria-label="Tutup informasi tempat" onClick={()=>dialog.current?.close()}>✕</button></header>
   <div className="pulse-drawer-scroll">{shown.map(item=><article className="pulse-research-note" key={item.id}><span className="pulse-confidence">{topics[item.topic]}</span><h3>{item.title}</h3><p>{item.summary}</p><p><strong>{item.publisher}</strong> · {sourceKinds[item.source_kind]} · Diperiksa {date(item.checked_at)}</p>{item.limitations&&<p className="pulse-disclosure">{item.limitations}</p>}<a href={item.source_url} target="_blank" rel="noopener noreferrer">Baca sumber asli ↗</a></article>)}</div>
  </dialog>
 </section>
}
