import { type Pulse, type Topic, type Sentiment } from './core'

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
