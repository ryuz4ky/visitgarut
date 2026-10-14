'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import PlaceCard from '@/components/mvp/PlaceCard'
import type {SavedPlaceCard} from '@/lib/mvp/saved'
import {useSavedPlaces,toggleSavedPlace} from './store'
export default function SavedPlaces(){
 const {ids,ready}=useSavedPlaces();const [items,setItems]=useState<SavedPlaceCard[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [retry,setRetry]=useState(0);const [loadedFor,setLoadedFor]=useState<string|null>(null)
 useEffect(()=>{if(!ready)return;const controller=new AbortController();setError('');setLoading(true);if(!ids.length){setItems([]);setLoadedFor('');setLoading(false);return()=>controller.abort()}
  fetch('/api/saved-places?'+new URLSearchParams({ids:ids.join(',')}),{signal:controller.signal,cache:'no-store'}).then(async r=>{if(!r.ok)throw Error('lookup');const data=await r.json();if(!controller.signal.aborted){setItems(data.items);setLoadedFor(ids.join(','))}}).catch(()=>{if(!controller.signal.aborted)setError('Pilihanmu belum dapat dimuat. Coba lagi.')}).finally(()=>{if(!controller.signal.aborted)setLoading(false)})
  return()=>controller.abort()
 },[ids,ready,retry])
 const eligible=items.filter(p=>p.canPlan)
 const missing=ids.filter(id=>!items.some(p=>p.id===id))
 const tripHref='/trip?'+new URLSearchParams({start:String(eligible[0]?.id||0),selected:eligible.map(p=>p.id).join(',')})
 if(!ready||loading)return <p role="status" className="vg-loading-status">Memuat pilihanmu…</p>
 if(error)return <div className="vg-empty"><p role="alert">{error}</p><button className="vg-button" onClick={()=>setRetry(n=>n+1)}>Coba lagi</button></div>
 if(loadedFor!==ids.join(','))return <p role="status" className="vg-loading-status">Memuat pilihanmu…</p>
 if(!ids.length)return <div className="vg-empty"><h2>Mulai dari tempat yang menarik perhatianmu</h2><p>Pilih tombol simpan pada kartu atau halaman tempat. Pilihanmu akan muncul di sini.</p><Link className="vg-button" href="/search">Jelajahi tempat</Link></div>
 return <><div className="vg-saved-summary"><div><strong>{items.length} tempat tersimpan</strong><p>Untuk itinerary, kami memakai tujuan wisata, kuliner, dan kafe yang memiliki titik peta. Penginapan dan rental tetap tersimpan sebagai referensi perjalanan.</p></div>{eligible.length>0&&<Link className="vg-button" href={tripHref}>Susun itinerary dari {eligible.length} pilihan ↗</Link>}</div><div className="vg-grid">{items.map(p=><PlaceCard key={p.id} place={p}/>)}</div>{missing.length>0&&<div className="vg-saved-unavailable"><p role="status">{missing.length} pilihan tidak lagi tersedia di direktori publik.</p>{missing.map((id,index)=><button key={id} onClick={()=>toggleSavedPlace(id)} aria-label={`Hapus pilihan tidak tersedia ${index+1}`}>Hapus pilihan tidak tersedia</button>)}</div>}<p className="vg-source">Pilihan tersimpan di browser ini dan tidak tersinkron ke perangkat lain. Menghapus data situs di browser akan menghapus simpanan.</p></>
}
