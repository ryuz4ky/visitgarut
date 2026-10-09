import type { Evidence,Insight,Mention,Platform,Sentiment,Topic } from './core'

export type TopicOverview={topic:Topic;label:string;headline:string;count:number;percent:number|null;sentiments:Record<Sentiment,number>;sourceCount:number;platforms:Platform[];evidenceIds:number[];sensitive:boolean}
export type PulseOverview={sampleSize:number;sourceCount:number;platforms:Platform[];evidenceIds:number[];sentiments:Record<Sentiment,number>;percentages:Record<Sentiment,number>|null;topics:TopicOverview[];summary:string;quality:{evaluated:number;repeatedAccount:number;identicalText:number;withoutTopic:number;unclassified:number}}
const emptyCounts=():Record<Sentiment,number>=>({positive:0,mixed:0,neutral:0,negative:0})
const sentiments:Sentiment[]=['positive','mixed','neutral','negative']

export function contentIdentity(value:string){
 try{const u=new URL(value);if(['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname))return u.origin+u.pathname+'?v='+(u.searchParams.get('v')||'');return u.origin+u.pathname}catch{return value}
}
function percentages(counts:Record<Sentiment,number>,total:number){
 const rows=sentiments.map((key,index)=>({key,index,value:Math.floor(counts[key]/total*100),remainder:counts[key]/total*100%1}))
 let left=100-rows.reduce((sum,row)=>sum+row.value,0)
 for(const row of [...rows].sort((a,b)=>b.remainder-a.remainder||a.index-b.index)){if(left--<=0)break;row.value++}
 return Object.fromEntries(rows.map(row=>[row.key,row.value])) as Record<Sentiment,number>
}
function headline(label:string,counts:Record<Sentiment,number>,count:number,sensitive:boolean){
 if(sensitive)return 'Laporan terkait topik ini perlu dibaca bersama konteksnya.'
 if(counts.positive>count/2)return `${label} lebih banyak mendapat tanggapan positif.`
 if(counts.negative>count/2)return `Keluhan lebih banyak muncul dalam pembahasan ${label.toLocaleLowerCase('id-ID')}.`
 if(counts.neutral>count/2)return `Pembahasan ${label.toLocaleLowerCase('id-ID')} lebih banyak bersifat informatif.`
 return `Pendapat tentang ${label.toLocaleLowerCase('id-ID')} beragam.`
}

function selectSample(rows:Mention[]){
 const quality={evaluated:rows.length,repeatedAccount:0,identicalText:0,withoutTopic:0,unclassified:0}
 const seenAccounts=new Set<string>(),seenTexts=new Set<string>(),sample:Mention[]=[]
 for(const row of [...rows].sort((a,b)=>Date.parse(b.published_at)-Date.parse(a.published_at)||b.id-a.id)){
  if(!row.topics.length){quality.withoutTopic++;continue}
  if(row.sentiment==='unclassified'){quality.unclassified++;continue}
  const account=row.independence_key!
  if(seenAccounts.has(account)){quality.repeatedAccount++;continue}
  const text=row.original_text.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('id-ID')
  if(text.length>=80&&seenTexts.has(text)){quality.identicalText++;continue}
  seenAccounts.add(account);if(text.length>=80)seenTexts.add(text);sample.push(row)
 }
 return {sample,quality}
}

/** Receives only visible, approved, analysis-permitted records from calculatePulse. */
export function buildPulseOverview(rows:Mention[],validatedTopics:Insight[],sensitiveRowIds:number[]=[]):PulseOverview{
 const provisional=selectSample(rows),sensitiveIds=new Set(sensitiveRowIds),allowedSensitiveIds=new Set<number>()
 for(const topic of validatedTopics.filter(t=>t.sensitive)){
  const matched=provisional.sample.filter(row=>row.topics.some(t=>t.topic===topic.topic))
  if(matched.length>=6&&new Set(matched.map(row=>contentIdentity(row.source_url))).size>=2&&matched.every(row=>!!row.verification_reference&&!!row.reviewed_at))for(const row of matched)allowedSensitiveIds.add(row.id)
 }
 const safeRows=rows.filter(row=>!sensitiveIds.has(row.id)||allowedSensitiveIds.has(row.id))
 const {sample,quality}=safeRows.length===rows.length?provisional:selectSample(safeRows)
 const counts=emptyCounts();for(const row of sample)counts[row.sentiment as Sentiment]++
 const sampleSize=sample.length,topics:TopicOverview[]=[]
 for(const validated of validatedTopics){
  const matched=sample.filter(row=>row.topics.some(t=>t.topic===validated.topic))
  const sources=new Set(matched.map(row=>contentIdentity(row.source_url)))
  if(matched.length<(validated.sensitive?6:3))continue
  if(validated.sensitive&&(sources.size<2||matched.some(row=>!row.verification_reference||!row.reviewed_at)))continue
  const values=emptyCounts();for(const row of matched)values[row.topics.find(t=>t.topic===validated.topic)!.sentiment]++
  topics.push({topic:validated.topic,label:validated.label,headline:headline(validated.label,values,matched.length,validated.sensitive),count:matched.length,percent:sampleSize>=10?Math.round(matched.length/sampleSize*100):null,sentiments:values,sourceCount:sources.size,platforms:[...new Set(matched.map(row=>row.platform))],evidenceIds:matched.map(row=>row.id),sensitive:validated.sensitive})
 }
 topics.sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,'id'))
 const lead=topics.find(topic=>!topic.sensitive)
 const concern=topics.filter(topic=>!topic.sensitive&&topic.topic!==lead?.topic&&topic.sentiments.negative>topic.count/2).sort((a,b)=>b.sentiments.negative-a.sentiments.negative)[0]
 const summary=lead?`${lead.label} paling sering dibahas dalam sampel ini. ${concern?concern.headline:lead.headline}`:sampleSize?'Komentar tersaring sudah tersedia. Jumlahnya belum cukup untuk menyimpulkan topik utama.':'Ringkasan percakapan belum tersedia. Sampel komentar yang bisa dianalisis masih belum mencukupi.'
 return {sampleSize,sourceCount:new Set(sample.map(row=>contentIdentity(row.source_url))).size,platforms:[...new Set(sample.map(row=>row.platform))],evidenceIds:sample.map(row=>row.id),sentiments:counts,percentages:sampleSize>=10?percentages(counts,sampleSize):null,topics,summary,quality}
}

export function overviewEvidence(evidence:Evidence[],ids:number[]){const selected=new Set(ids);return evidence.filter(row=>selected.has(row.id)).sort((a,b)=>Date.parse(b.published_at)-Date.parse(a.published_at)||b.id-a.id)}
