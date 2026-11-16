'use client'
import {useState} from 'react'
import {Bookmark} from 'lucide-react'
import {toggleSavedPlace,useSavedPlaces} from './store'
export default function SaveButton({id,name,compact=false}:{id:number;name:string;compact?:boolean}){
 const {ids,ready}=useSavedPlaces();const saved=ids.includes(id);const [error,setError]=useState('')
 return <span className={compact?'vg-save-control compact':'vg-save-control'}><button type="button" className="vg-save-button" data-vg-event={saved?"unsave_place":"save_place"} disabled={!ready} aria-pressed={saved} aria-label={saved?`Hapus ${name} dari simpanan`:`Simpan ${name}`} title={saved?'Hapus dari simpanan':'Simpan tempat'} onClick={()=>{const result=toggleSavedPlace(id);setError(result==='limit'?'Maksimal 100 tempat tersimpan. Hapus satu pilihan untuk menambah tempat lain.':result==='unavailable'?'Browser tidak dapat menyimpan pilihan. Periksa pengaturan penyimpanan browser.':'')}}><Bookmark size={19} aria-hidden="true" fill={saved?'currentColor':'none'}/>{!compact&&<span>{saved?'Tersimpan':'Simpan tempat'}</span>}</button>{error&&<span className="vg-save-error" role="alert">{error}</span>}</span>
}
