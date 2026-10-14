'use client'
import {useMemo,useSyncExternalStore} from 'react'
import {emptySavedSnapshot,maxSavedPlaces,readSavedSnapshot,savedStorageKey} from '@/lib/mvp/saved'
const listeners=new Set<()=>void>()
function emit(){[...listeners].forEach(fn=>fn())}
function storageChanged(e:StorageEvent){if(e.key===savedStorageKey||e.key===null)emit()}
function subscribe(fn:()=>void){if(!listeners.size)window.addEventListener('storage',storageChanged);listeners.add(fn);return()=>{listeners.delete(fn);if(!listeners.size)window.removeEventListener('storage',storageChanged)}}
function snapshot(){try{return window.localStorage.getItem(savedStorageKey)||emptySavedSnapshot}catch{return emptySavedSnapshot}}
const serverSnapshot=()=>null
export function useSavedPlaces(){const raw=useSyncExternalStore<string|null>(subscribe,snapshot,serverSnapshot);const ids=useMemo(()=>readSavedSnapshot(raw),[raw]);return {ids,ready:raw!==null}}
export function toggleSavedPlace(id:number):'ok'|'limit'|'unavailable'{
 if(!Number.isInteger(id)||id<1||id>2147483647)return 'unavailable'
 try{const ids=readSavedSnapshot(window.localStorage.getItem(savedStorageKey));const exists=ids.includes(id);if(!exists&&ids.length>=maxSavedPlaces)return 'limit';window.localStorage.setItem(savedStorageKey,JSON.stringify({version:1,ids:exists?ids.filter(x=>x!==id):[...ids,id]}));emit();return 'ok'}catch{return 'unavailable'}
}
