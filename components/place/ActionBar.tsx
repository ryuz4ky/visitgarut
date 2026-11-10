'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {Navigation,MessageCircle,Globe,ArrowUpRight} from 'lucide-react'

export type BarAction={kind:'route'|'whatsapp'|'website'|'plan';href:string;label:string}
const icons={route:Navigation,whatsapp:MessageCircle,website:Globe,plan:ArrowUpRight}

/** Phone-only bar with the actions people come for. Appears once the hero buttons scroll away, hides again at the footer. */
export default function ActionBar({actions}:{actions:BarAction[]}){
 const [show,setShow]=useState(false)
 useEffect(()=>{
  const hero=document.querySelector('.vp-hero-wrap'),footer=document.querySelector('.vg-footer')
  let pastHero=false,atFooter=false
  const update=()=>setShow(pastHero&&!atFooter)
  const io=new IntersectionObserver(es=>{for(const e of es){if(e.target===hero)pastHero=!e.isIntersecting&&e.boundingClientRect.top<0;if(e.target===footer)atFooter=e.isIntersecting}update()})
  if(hero)io.observe(hero);if(footer)io.observe(footer)
  return()=>io.disconnect()
 },[])
 if(!actions.length)return null
 return <div className={show?'vp-actionbar is-shown':'vp-actionbar'} aria-hidden={!show}>
  {actions.map(a=>{const Icon=icons[a.kind];const cls=a.kind==='plan'||(a.kind==='whatsapp'&&!actions.some(x=>x.kind==='plan'))?'is-primary':undefined;const body=<><Icon size={18} aria-hidden="true"/><span>{a.label}</span></>
   return a.kind==='plan'?<Link key={a.kind} className={cls} href={a.href} tabIndex={show?undefined:-1}>{body}</Link>:<a key={a.kind} className={cls} href={a.href} target="_blank" rel="noopener noreferrer" tabIndex={show?undefined:-1}>{body}</a>})}
 </div>
}
