import { type Pulse, type Topic, type Sentiment, type Platform } from './core'
import { evidenceForTopic } from './evidence-view'

/** The existing moderated Pulse aggregate is the ONLY data source for the globe. */
export type GlobeNode = {
  topic: Topic
  label: string
  contributors: number
  sources: number
  confidence: 'rendah' | 'sedang' | 'tinggi'
  sentiment: Sentiment
  summary: string
  evidenceIds: number[]
  x: number
  y: number
  depth: number
}

export function dominantSentiment(counts: Pick<GlobeNodeCounts, 'positive' | 'neutral' | 'negative' | 'mixed'>): Sentiment {
  const total = counts.positive + counts.neutral + counts.negative + counts.mixed
  if (!total) return 'mixed'
  // Mixed is an honest label when no single category has a clear majority.
  if (counts.positive > total / 2) return 'positive'
  if (counts.negative > total / 2) return 'negative'
  if (counts.neutral > total / 2) return 'neutral'
  return 'mixed'
}
type GlobeNodeCounts = { positive: number; neutral: number; negative: number; mixed: number }

/** A deterministic Fibonacci sphere projection: no random layout or hydration mismatch. */
export function globePosition(index: number, total: number) {
  const n = Math.max(1, total)
  const y = 1 - (2 * (index + .5)) / n
  const radius = Math.sqrt(Math.max(0, 1 - y * y))
  const theta = index * Math.PI * (3 - Math.sqrt(5))
  return { x: radius * Math.cos(theta), y, depth: radius * Math.sin(theta) }
}

export function buildGlobeNodes(pulse: Pulse, limit = 10): GlobeNode[] {
  // The existing engine handles moderation and independent source thresholds.
  // Cross-check publishable TopicStatus and public Evidence as an extra guard:
  // the insight may contain counts/IDs from a withheld sensitive contribution.
  const publiclyVisible = new Set(pulse.evidence.map(e => e.id))
  const allowed = pulse.insights
    .filter(i => {
      if (i.count < (i.sensitive ? 6 : 3)) return false
      const status = pulse.topicStatuses.find(s => s.topic === i.topic)
      if (!status || status.missing !== null || status.count !== i.count) return false
      if (status.evidenceIds.length !== i.count) return false
      const ids = new Set(status.evidenceIds)
      return i.evidenceIds.length === i.count &&
        i.evidenceIds.every(id => ids.has(id) && publiclyVisible.has(id))
    })
    .slice(0, Math.min(12, Math.max(0, limit)))
  return allowed.map((item, index) => ({
    topic: item.topic,
    label: item.label,
    contributors: item.count,
    sources: item.sourceCount,
    confidence: item.confidence,
    sentiment: dominantSentiment(item),
    summary: item.summary,
    evidenceIds: [...item.evidenceIds],
    ...globePosition(index, allowed.length),
  }))
}

/** Sample visual cards only; every eligible comment remains in the evidence drawer. */
export type GlobeCommentBubble = {
 id:number; topic:Topic; platform:Platform; excerpt:string; sentiment:Sentiment;
 x:number; y:number; depth:number
}
export function buildGlobeCommentBubbles(pulse:Pulse, maxCards=14):GlobeCommentBubble[] {
 const nodes=buildGlobeNodes(pulse)
 const allowedIds=new Map<number,Topic>()
 for(const node of nodes)for(const evidence of evidenceForTopic(pulse,node.topic))
   if(!allowedIds.has(evidence.id))allowedIds.set(evidence.id,node.topic)
 // All visible, published comments per eligible topic; no sampling by contributor.
 // This is a visual subset only. The drawer renders all available records.
 const selected=pulse.evidence
  .filter(e=>allowedIds.has(e.id) && e.original_text.trim().length>0)
  .sort((a,b)=>Date.parse(b.published_at)-Date.parse(a.published_at))
  .slice(0,Math.max(0,Math.min(18,maxCards)))
 return selected.map((e,i)=>{
  const position=globePosition(i,selected.length)
  const matchingTopic=e.topics.find(t=>t.topic===allowedIds.get(e.id))
  return {
   id:e.id, topic:allowedIds.get(e.id)!,platform:e.platform,
   excerpt:e.original_text.length>64?e.original_text.slice(0,61).trimEnd()+'…':e.original_text,
   sentiment:matchingTopic?.sentiment || 'mixed',
   ...position,
  }
 })
}
