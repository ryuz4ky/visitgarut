import {topics} from './core'
import {globePosition} from './globe'
import {researchTopicGroups,type ResearchEvidence} from './research'

export function publicResearchItems(items:ResearchEvidence[]) {
 const seen=new Set<string>()
 return items.filter(item=>{
  try {
   const url=new URL(item.source_url)
   if(url.protocol!=='https:'||url.username||url.password||!Object.hasOwn(topics,item.topic)||!item.summary.trim()||!Number.isFinite(Date.parse(item.checked_at)))return false
   const key=item.topic+'|'+url.href+'|'+item.summary.trim()
   if(seen.has(key))return false
   seen.add(key);return true
  } catch {return false}
 })
}
export function buildResearchGlobeNodes(items:ResearchEvidence[]) {
 const groups=researchTopicGroups(publicResearchItems(items))
 return groups.map((group,index)=>({
  ...group,label:topics[group.topic],notes:group.items.length,
  ...globePosition(index,groups.length),
 }))
}
