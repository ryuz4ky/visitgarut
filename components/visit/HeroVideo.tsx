'use client'
import {useEffect,useRef,useState} from 'react'

// Background video for the home hero, played through YouTube's own player (no download or re-hosting).
// The poster image underneath stays visible until YouTube reports that the video is actually playing,
// so a blocked, removed or non-embeddable video never covers the hero. Reduced-motion and data-saver
// visitors get the image only.
const VIDEO_ID='HMi8kJVE21s'
const ORIGIN='https://www.youtube-nocookie.com'

export default function HeroVideo(){
 const [src,setSrc]=useState<string|null>(null)
 const [playing,setPlaying]=useState(false)
 const frame=useRef<HTMLIFrameElement>(null)
 useEffect(()=>{
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const saveData=(navigator as Navigator&{connection?:{saveData?:boolean}}).connection?.saveData
  if(reduce||saveData)return
  const params=new URLSearchParams({autoplay:'1',mute:'1',loop:'1',playlist:VIDEO_ID,controls:'0',disablekb:'1',fs:'0',iv_load_policy:'3',modestbranding:'1',playsinline:'1',rel:'0',enablejsapi:'1',origin:window.location.origin})
  setSrc(`${ORIGIN}/embed/${VIDEO_ID}?${params}`)
  const onMessage=(e:MessageEvent)=>{
   if(e.origin!==ORIGIN||e.source!==frame.current?.contentWindow||typeof e.data!=='string')return
   try{const d=JSON.parse(e.data);if(d?.info?.playerState===1||d?.event==='onStateChange'&&d.info===1)setPlaying(true)}catch{}
  }
  window.addEventListener('message',onMessage)
  return()=>window.removeEventListener('message',onMessage)
 },[])
 if(!src)return null
 // Ask the player to post its state to this page (YouTube iframe API "listening" handshake).
 const listen=()=>{for(const t of [0,500,1500,3000])setTimeout(()=>frame.current?.contentWindow?.postMessage(JSON.stringify({event:'listening',id:'vh-hero',channel:'widget'}),ORIGIN),t)}
 return <>
  <div className={playing?'vh-hero-video is-shown':'vh-hero-video'} aria-hidden="true">
   <iframe ref={frame} src={src} title="Video udara Kota Garut" tabIndex={-1} allow="autoplay; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" onLoad={listen}/>
  </div>
  {playing&&<a className="vh-hero-credit" href={`https://www.youtube.com/watch?v=${VIDEO_ID}`} target="_blank" rel="noopener">Video: Gunawan Fala · YouTube</a>}
 </>
}
