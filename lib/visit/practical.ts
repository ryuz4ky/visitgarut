/** Practical visit facts live alongside editorial content in the existing vg_places.content.
 * This versioned envelope avoids a schema change; public rendering always strips it.
 */
export type TariffDayType='auto'|'weekday'|'weekend'|'holiday'|'special'
export type CalendarTariffs={days:(number|null)[];holiday:number|null;specialHoliday:number|null}
export const dayNames=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'] as const
export type PracticalInfo = {
 version:1; sourceUrl:string; publisher:string; checkedAt:string;
 weekday:number|null; weekend:number|null; calendar?:CalendarTariffs;
 priceNote:string; familyNote:string; accessNote:string; hoursNote:string; extrasNote:string;
}
const start='<!-- visitgarut:practical:v1\n',end='\n/visitgarut:practical -->'
export function safeSource(value:unknown):string {
 if(typeof value!=='string')return ''
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}
}
export function validatePractical(value:unknown):PracticalInfo|null {
 if(!value||typeof value!=='object'||Array.isArray(value))return null
 const r=value as Record<string,unknown>
 if(r.version!==1||!safeSource(r.sourceUrl)||typeof r.publisher!=='string'||!r.publisher.trim()||r.publisher.length>160)return null
 if(typeof r.checkedAt!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(r.checkedAt)||Number.isNaN(Date.parse(r.checkedAt))||new Date(r.checkedAt).toISOString().slice(0,10)!==r.checkedAt)return null
 const result={version:1,sourceUrl:safeSource(r.sourceUrl),publisher:r.publisher.trim(),checkedAt:r.checkedAt} as PracticalInfo
 for(const key of ['weekday','weekend'] as const){if(r[key]!==null&&(typeof r[key]!=='number'||!Number.isInteger(r[key])||r[key]<0||r[key]>100000000))return null;result[key]=r[key] as number|null}
 if(r.calendar!==undefined){
  if(!r.calendar||typeof r.calendar!=='object'||Array.isArray(r.calendar))return null
  const c=r.calendar as Record<string,unknown>
  const rate=(v:unknown)=>v===null||(typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<=100000000)
  if(!Array.isArray(c.days)||c.days.length!==7||!Array.from(c.days).every(rate)||!rate(c.holiday)||!rate(c.specialHoliday))return null
  result.calendar={days:[...c.days] as (number|null)[],holiday:c.holiday as number|null,specialHoliday:c.specialHoliday as number|null}
 }
 for(const key of ['priceNote','familyNote','accessNote','hoursNote','extrasNote'] as const){if(typeof r[key]!=='string'||r[key].length>800)return null;result[key]=r[key].trim()}
 return result
}
export function splitPractical(content:string):{content:string;practical:PracticalInfo|null} {
 const at=content.indexOf(start)
 if(at<0)return {content,practical:null}
 const close=content.indexOf(end,at+start.length)
 // Never leak a malformed internal envelope to a public page.
 const clean=(content.slice(0,at)+(close<0?'':content.slice(close+end.length))).trim()
 if(close<0)return {content:clean,practical:null}
 try{return {content:clean,practical:validatePractical(JSON.parse(content.slice(at+start.length,close)))}}catch{return {content:clean,practical:null}}
}
export function joinPractical(content:string,practical:PracticalInfo|null):string {
 const clean=splitPractical(content).content
 if(!practical)return clean
 const validated=validatePractical(practical)
 if(!validated)throw new Error('Informasi kunjungan tidak valid')
 return clean+'\n\n'+start+JSON.stringify(validated).replace(/</g,'\\u003c')+end
}
export function currentPractical(info:PracticalInfo|null|undefined,now=new Date()):boolean {
 if(!info)return false
 const age=now.getTime()-Date.parse(info.checkedAt+'T00:00:00+07:00')
 return age>=0&&age<=30*86400000
}
const sameRate=(rates:(number|null)[])=>rates.every(n=>n!==null&&n===rates[0])?rates[0]:null
export function listedEntry(info:PracticalInfo|null|undefined,date:string,dayType:TariffDayType='auto',now=new Date()):number|null {
 if(!info||!currentPractical(info,now))return null
 if(dayType==='holiday')return info.calendar?.holiday??null
 if(dayType==='special')return info.calendar?.specialHoliday??null
 if(info.calendar&&dayType==='weekday')return sameRate(info.calendar.days.slice(1,6))
 if(info.calendar&&dayType==='weekend')return sameRate([info.calendar.days[6],info.calendar.days[0]])
 let weekend=dayType==='weekend'
 if(dayType==='auto'){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)return null
  const day=new Date(date+'T12:00:00+07:00').getUTCDay();weekend=day===0||day===6
  if(info.calendar)return info.calendar.days[day]??null
 }
 return weekend?info.weekend:info.weekday
}
export function tariffRows(info:PracticalInfo|null|undefined):{label:string;amount:number|null}[]{
 if(!info?.calendar)return [{label:'Hari kerja',amount:info?.weekday??null},{label:'Akhir pekan',amount:info?.weekend??null},{label:'Libur nasional / khusus',amount:null}]
 const order=[1,2,3,4,5,6,0],rows:{label:string;amount:number|null}[]=[]
 for(let i=0;i<order.length;){let end=i;const amount=info.calendar.days[order[i]];while(end+1<order.length&&info.calendar.days[order[end+1]]===amount)end++;rows.push({label:dayNames[order[i]]+(end>i?'–'+dayNames[order[end]]:''),amount});i=end+1}
 return [...rows,{label:'Libur nasional',amount:info.calendar.holiday},{label:'Libur khusus',amount:info.calendar.specialHoliday}]
}
export function rupiah(n:number){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n)}
