import { topics,type Topic } from './core'
export const sourceKinds={authority:'Instansi / lembaga',operator:'Pengelola',report:'Liputan media',directory:'Direktori pemesanan'} as const
export type ResearchEvidence={id:number;topic:Topic;title:string;summary:string;source_url:string;publisher:string;source_kind:keyof typeof sourceKinds;source_published_at:string|null;checked_at:string;limitations:string}
export type ResearchTopicGroup={topic:Topic;items:ResearchEvidence[];sourceCount:number;sourceKinds:(keyof typeof sourceKinds)[];checkedAt:string}
export function researchTopicGroups(items:ResearchEvidence[]):ResearchTopicGroup[]{
 const groups=new Map<Topic,ResearchEvidence[]>()
 for(const item of items){const rows=groups.get(item.topic)||[];rows.push(item);groups.set(item.topic,rows)}
 return (Object.keys(topics) as Topic[]).filter(topic=>groups.has(topic)).map(topic=>{
  const rows=[...groups.get(topic)!].sort((a,b)=>Date.parse(b.checked_at)-Date.parse(a.checked_at)||a.id-b.id)
  return {topic,items:rows,sourceCount:new Set(rows.map(r=>r.source_url)).size,sourceKinds:[...new Set(rows.map(r=>r.source_kind))],checkedAt:rows[0].checked_at}
 })
}
export function researchSourceUrl(value:string){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port||!u.hostname.includes('.'))throw new Error('Gunakan sumber publik https.');return u.href}
