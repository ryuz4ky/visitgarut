export const savedStorageKey='visitgarut:saved:v1'
export const maxSavedPlaces=100
export const emptySavedSnapshot=JSON.stringify({version:1,ids:[]})
export type SavedPlaceCard={id:number;slug:string;name:string;category:string;district:string;excerpt:string;image_url:string;image_credit?:string;canPlan?:boolean}
export function normalizeSavedIds(ids:unknown):number[]{
 if(!Array.isArray(ids))return []
 return [...new Set(ids.slice(0,1000).filter((id):id is number=>typeof id==='number'&&Number.isInteger(id)&&id>0&&id<=2147483647))].slice(0,maxSavedPlaces)
}
export function readSavedSnapshot(raw:string|null):number[]{
 if(!raw||raw.length>10000)return []
 try{const data=JSON.parse(raw);return data?.version===1?normalizeSavedIds(data.ids):[]}catch{return []}
}
export function parseSelectedIds(raw:string):number[]|null{
 if(!raw)return []
 if(raw.length>1100)return null
 const parts=raw.split(',')
 if(parts.length>maxSavedPlaces||parts.some(p=>!/^\d+$/.test(p)||Number(p)<1||Number(p)>2147483647))return null
 return normalizeSavedIds(parts.map(Number))
}
