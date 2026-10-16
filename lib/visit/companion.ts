import {listedEntry,type PracticalInfo,type TariffDayType} from './practical'
export type CompanionPlace={id:number;slug:string;name:string;category:string;district:string;excerpt:string;image_url:string;source_url:string;website:string;whatsapp:string;latitude:number|null;longitude:number|null;practical:PracticalInfo|null}
export type DayType=TariffDayType
export const tariffLabels:Record<DayType,string>={auto:'sesuai tanggal (bukan hari libur)',weekday:'hari kerja',weekend:'akhir pekan',holiday:'libur nasional',special:'libur khusus pengelola'}
export type VisitOptions={date:string;dayType:DayType;adults:number;children:number;budget:string;adultTickets:Record<string,string>;childrenTickets:string;transport:string;meals:string;parking:string;extras:string;departure:string;returnBy:string;buffer:number;visitMinutes:number;mode:'driving'|'walking';originId:number;stopIds:number[];durations:number[];travelMinutes:string[];returnChecked:boolean}
const amount=(v:unknown)=>typeof v==='string'&&/^\d{1,9}$/.test(v)&&Number(v)<=100000000?v:''
const integer=(v:unknown,min:number,max:number,fallback:number)=>typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max?v:fallback
const clock=(v:unknown,fallback:string)=>typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v)?v:fallback
export function normalizeOptions(raw:Partial<VisitOptions>={}):VisitOptions {
 const ids=Array.isArray(raw.stopIds)?[...new Set(raw.stopIds.filter(id=>Number.isInteger(id)&&id>0&&id<=2147483647))].slice(0,3):[]
 const date=typeof raw.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(raw.date)&&Number.isFinite(Date.parse(raw.date))&&new Date(raw.date).toISOString().slice(0,10)===raw.date?raw.date:''
 const estimates=raw.adultTickets&&typeof raw.adultTickets==='object'&&!Array.isArray(raw.adultTickets)?raw.adultTickets:{}
 return {date,dayType:['weekday','weekend','holiday','special'].includes(String(raw.dayType))?raw.dayType as DayType:'auto',adults:integer(raw.adults,1,50,2),children:integer(raw.children,0,50,0),budget:amount(raw.budget),adultTickets:Object.fromEntries(ids.map(id=>[String(id),amount(estimates[String(id)])])),childrenTickets:amount(raw.childrenTickets),transport:amount(raw.transport),meals:amount(raw.meals),parking:amount(raw.parking),extras:amount(raw.extras),departure:clock(raw.departure,'09:00'),returnBy:clock(raw.returnBy,'18:00'),buffer:integer(raw.buffer,0,180,60),visitMinutes:integer(raw.visitMinutes,30,360,90),mode:raw.mode==='walking'?'walking':'driving',originId:raw.originId===-1?-1:integer(raw.originId,1,2147483647,-1),stopIds:ids,durations:ids.map((_,i)=>integer(raw.durations?.[i],15,480,90)),travelMinutes:Array.from({length:ids.length+1},(_,i)=>{const x=raw.travelMinutes?.[i];return typeof x==='string'&&/^\d{1,3}$/.test(x)&&Number(x)<=600?x:''}),returnChecked:raw.returnChecked===true}
}
export function updatePlanOptions(current:VisitOptions,patch:Partial<VisitOptions>):VisitOptions {
 const changed=(key:keyof VisitOptions)=>key in patch&&patch[key]!==current[key]
 const contextChanged=changed('date')||changed('dayType')||changed('adults')
 const selectionChanged=!!patch.stopIds&&(patch.stopIds.length!==current.stopIds.length||patch.stopIds.some(id=>!current.stopIds.includes(id)))
 return normalizeOptions({...current,...patch,...(contextChanged?{adultTickets:{}}:{}),...(contextChanged||changed('children')||selectionChanged?{childrenTickets:''}:{}),...(changed('date')?{returnChecked:false}:{})})
}
export function parsePlan(raw:string|undefined):VisitOptions {if(!raw||raw.length>6000)return normalizeOptions();try{return normalizeOptions(JSON.parse(raw))}catch{return normalizeOptions()}}
export function budgetSummary(stops:CompanionPlace[],options:VisitOptions,now=new Date()) {
 const entries=stops.filter(p=>p.category==='wisata').map(p=>{const unit=listedEntry(p.practical,options.date,options.dayType,now);const input=amount(options.adultTickets?.[String(p.id)]);const manual=input!=='';return {place:p,unit,manual,total:manual?Number(input):unit===null?null:unit*options.adults}})
 let known=0;const unknown:string[]=[]
 for(const row of entries){if(row.total===null)unknown.push('Tiket '+row.place.name);else known+=row.total}
 if(options.children>0&&entries.length){if(options.childrenTickets==='')unknown.push('Ketentuan dan tiket anak');else known+=Number(options.childrenTickets)}
 for(const [key,label] of [['transport','Transport pergi-pulang'],['meals','Makan & minum'],['parking','Parkir seluruh kunjungan'],['extras','Aktivitas & sewa tambahan']] as const){if(options[key]==='')unknown.push(label);else known+=Number(options[key])}
 return {entries,known,unknown,remaining:options.budget===''?null:Number(options.budget)-known}
}
export const clockMinutes=(time:string)=>Number(time.slice(0,2))*60+Number(time.slice(3))
export function timeline(options:VisitOptions,roadMinutes:number[]|null){
 const durations=options.stopIds.map((_,i)=>options.durations[i]||options.visitMinutes)
 const legs=Array.from({length:options.stopIds.length+1},(_,i)=>options.travelMinutes[i]!==''?Number(options.travelMinutes[i]):roadMinutes?.[i]??null)
 const missing=legs.some(n=>n===null);const minutes=durations.reduce((a,b)=>a+b,0)+legs.reduce<number>((a,b)=>a+(b||0),0)+options.buffer
 const available=clockMinutes(options.returnBy)-clockMinutes(options.departure)
 return {legs,missing,minutes,available,over:!missing&&minutes>available,invalid:available<=0}
}
export function mapsUrl(origin:Pick<CompanionPlace,'name'>|undefined,stops:CompanionPlace[],mode:'driving'|'walking'){
 if(!origin||!stops.length)return ''
 const q=new URLSearchParams({api:'1',origin:origin.name+' Garut',destination:origin.name+' Garut',travelmode:mode,waypoints:stops.map(p=>p.name+' Garut').join('|')})
 return 'https://www.google.com/maps/dir/?'+q
}
export function inquiryText(place:CompanionPlace,options:VisitOptions){return `Halo, saya ingin berkunjung ke ${place.name}${options.date?' pada '+options.date:''}, untuk ${options.adults} dewasa dan ${options.children} anak. Saya memilih kategori tarif ${tariffLabels[options.dayType]}; mohon konfirmasi apakah sesuai. Mohon konfirmasi jam buka, total tiket dan ketentuan anak, parkir, fasilitas yang termasuk, biaya tambahan, serta akses dari area parkir. Terima kasih.`}
