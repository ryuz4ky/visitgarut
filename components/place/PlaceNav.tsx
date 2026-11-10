'use client'
import {useEffect,useRef,useState} from 'react'

/** Section pills: one swipeable row that stays under the header and marks the section in view. */
export default function PlaceNav({links}:{links:{href:string;label:string}[]}){
 const ref=useRef<HTMLElement>(null)
 const [active,setActive]=useState('')
 useEffect(()=>{
  const nav=ref.current;if(!nav)return
  const root=document.documentElement
  const header=document.querySelector<HTMLElement>('.vg-header')
  const measure=()=>{root.style.setProperty('--vp-header-h',`${header?.offsetHeight??0}px`);root.style.setProperty('--vp-nav-h',`${nav.offsetHeight}px`)}
  measure();window.addEventListener('resize',measure)
  const sections=links.map(l=>document.getElementById(l.href.slice(1))).filter((x):x is HTMLElement=>!!x)
  const pick=()=>{const line=(header?.offsetHeight??0)+nav.offsetHeight+24;let id='';for(const s of sections)if(s.getBoundingClientRect().top<=line)id=s.id;setActive(id)}
  pick();window.addEventListener('scroll',pick,{passive:true})
  return()=>{window.removeEventListener('resize',measure);window.removeEventListener('scroll',pick)}
 },[links])
 useEffect(()=>{const nav=ref.current;const a=nav?.querySelector<HTMLElement>('a[aria-current]');if(nav&&a)nav.scrollTo({left:a.offsetLeft-16,behavior:'smooth'})},[active])
 return <nav ref={ref} className="vg-detail-nav vp-nav" aria-label="Bagian informasi tempat">{links.map(l=><a key={l.href} href={l.href} aria-current={active===l.href.slice(1)?'true':undefined}>{l.label}</a>)}</nav>
}
