/** Practical visit facts live alongside editorial content in the existing vg_places.content.
 * This versioned envelope avoids a schema change; public rendering always strips it.
 */
export type PracticalInfo = {
 version:1; sourceUrl:string; publisher:string; checkedAt:string;
 weekday:number|null; weekend:number|null;
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
export function listedEntry(info:PracticalInfo|null|undefined,date:string,dayType:'auto'|'weekday'|'weekend'='auto',now=new Date()):number|null {
 if(!info||!currentPractical(info,now))return null
 let weekend=dayType==='weekend'
 if(dayType==='auto'){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date)))return null
  const day=new Date(date+'T12:00:00+07:00').getUTCDay();weekend=day===0||day===6
 }
 return weekend?info.weekend:info.weekday
}
export function rupiah(n:number){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n)}
