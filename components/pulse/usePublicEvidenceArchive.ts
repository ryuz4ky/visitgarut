'use client'
import { useEffect,useRef,useState } from 'react'
import { fetchPublicEvidencePage, type ArchivePageResponse } from '@/lib/pulse/archive-actions'
import { type Evidence,type Pulse,type Topic } from '@/lib/pulse/core'
import { type EvidenceFilters } from '@/lib/pulse/evidence-view'
import { type EvidenceOpenRequest } from './EvidencePanel'

type State={ active:boolean; items:Evidence[]; loading:boolean; loadingMore:boolean; error:string; cursor:string|null; total:number|null }
const empty:State={ active:false,items:[],loading:false,loadingMore:false,error:'',cursor:null,total:null }

/** Public PostgreSQL keyset paging; never fetches unmoderated/sensitive rows. */
export function usePublicEvidenceArchive({
 pulse,placeId,request,filters,demo,youtubeConsent,
}:{
 pulse:Pulse;placeId:number;request:EvidenceOpenRequest|null;filters:EvidenceFilters;demo:boolean;youtubeConsent:boolean
}){
 const [state,setState]=useState<State>(empty)
 const [retry,setRetry]=useState(0)
 const currentKey=useRef(0)
 const topic:Topic|null=request?.topic??null
 const isSensitive=topic!==null && !!pulse.topicStatuses.find(s=>s.topic===topic)?.sensitive
 const enabled=!demo && !!request && !isSensitive
 useEffect(()=>{
  const key=++currentKey.current
  if(!enabled) {setState(empty);return}
  setState({...empty,active:true,loading:true})
  fetchPublicEvidencePage({
   placeId,
   filters:{topic,platform:filters.platform,sentiment:filters.sentiment,sort:filters.sort},
   cursor:null,youtubeConsent,
  }).then((result:ArchivePageResponse)=>{
   if(currentKey.current!==key)return
   setState({active:true,items:result.items,cursor:result.nextCursor,
    total:result.total,loading:false,loadingMore:false,error:''})
  }).catch(()=>{
   if(currentKey.current!==key)return
   setState({...empty,active:true,error:'Arsip PostgreSQL belum dapat dimuat. Menampilkan sampel komentar yang telah tersedia.'})
  })
 },[enabled,placeId,request?.token,topic,filters.platform,filters.sentiment,filters.sort,youtubeConsent,retry])
 function loadMore(){
  if(!enabled||!state.cursor||state.loading||state.loadingMore)return
  const key=currentKey.current
  const cursor=state.cursor
  setState(prev=>({...prev,loadingMore:true,error:''}))
  fetchPublicEvidencePage({
   placeId,filters:{topic,platform:filters.platform,sentiment:filters.sentiment,sort:filters.sort},
   cursor,youtubeConsent,
  }).then(result=>{
   if(currentKey.current!==key)return
   setState(prev=>({...prev,loadingMore:false,
    items:[...prev.items,...result.items.filter(item=>!prev.items.some(old=>old.id===item.id))],
    cursor:result.nextCursor}))
  }).catch(()=>{
   if(currentKey.current!==key)return
   setState(prev=>({...prev,loadingMore:false,error:'Halaman berikutnya belum dapat dimuat. Coba lagi.'}))
  })
 }
 return {state,retry:()=>setRetry(n=>n+1),loadMore,enabled}
}
