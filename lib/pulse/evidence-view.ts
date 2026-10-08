import { platforms, type Evidence, type Platform, type Pulse, type Sentiment, type Topic } from './core'

export type EvidenceSort = 'newest' | 'oldest' | 'engagement'
export type EvidenceFilters = { platform: Platform | ''; sentiment: Sentiment | ''; sort: EvidenceSort }

/**
 * Always use the already published server aggregate. Topic IDs are limited
 * to those disclosed by its TopicStatus; withheld sensitive topics have no
 * evidence IDs and are never inferred from the raw Evidence array.
 */
export function evidenceForTopic(pulse: Pulse, topic: Topic | null): Evidence[] {
  if (topic === null) return pulse.evidence
  const status = pulse.topicStatuses.find(row => row.topic === topic)
  if (!status || (status.sensitive && status.missing !== null)) return []
  // Insights count unique authors; the drawer must show ALL already-public
  // comments on that topic, including repeat comments by the same author.
  // The core Pulse engine alone determines which raw records are publishable.
  return pulse.evidence.filter(item => item.topics.some(t => t.topic === topic))
}

export function evidenceSentiment(evidence: Evidence, topic: Topic | null): Sentiment | 'unclassified' {
  if (topic !== null) {
    return evidence.topics.find(t => t.topic === topic)?.sentiment || 'unclassified'
  }
  return evidence.sentiment
}

export function filterPublicEvidence(items: Evidence[], topic: Topic | null, filters: EvidenceFilters): Evidence[] {
  return items
    .filter(item => (!filters.platform || item.platform === filters.platform) &&
      (!filters.sentiment || evidenceSentiment(item, topic) === filters.sentiment))
    .sort((a, b) => {
      if (filters.sort === 'engagement') {
        const delta = b.engagement_count - a.engagement_count
        if (delta) return delta
      }
      const dateDiff = Date.parse(b.published_at) - Date.parse(a.published_at)
      return filters.sort === 'oldest' ? -dateDiff || a.id - b.id : dateDiff || b.id - a.id
    })
}

export function platformEvidenceCounts(items: Evidence[]): { platform: Platform; count: number; label: string }[] {
  return (Object.keys(platforms) as Platform[])
    .map(platform => ({ platform, count: items.filter(item => item.platform === platform).length, label: platforms[platform] }))
    .filter(item => item.count > 0)
}

export function safeEvidenceSource(url: string): string | null {
  try {
    const value = new URL(url)
    return value.protocol === 'https:' && !value.username && !value.password ? value.href : null
  } catch { return null }
}
