'use client'
import {useEffect,useRef,type ReactNode} from 'react'

/** Desktop side column that stays in view. When it is taller than the window it scrolls with the page until its last card is visible, then holds. */
export default function StickyAside({children}:{children:ReactNode}){
 const ref=useRef<HTMLElement>(null)
 useEffect(()=>{
  const el=ref.current;if(!el)return
  const set=()=>{const header=document.querySelector<HTMLElement>('.vg-header')?.offsetHeight??80;const top=Math.min(header+16,window.innerHeight-el.offsetHeight-16);el.style.setProperty('--vp-aside-top',`${top}px`)}
  set();const ro=new ResizeObserver(set);ro.observe(el);window.addEventListener('resize',set)
  return()=>{ro.disconnect();window.removeEventListener('resize',set)}
 },[])
 return <aside ref={ref} className="vp-aside">{children}</aside>
}
