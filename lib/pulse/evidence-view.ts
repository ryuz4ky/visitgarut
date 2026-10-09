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
  const primary: Platform[] = ['youtube','instagram','tiktok','threads','x','visitgarut']
  const included = items.some(item => item.platform === 'google') ? [...primary, 'google' as Platform] : primary
  return included.map(platform => ({
    platform, count: items.filter(item => item.platform === platform).length, label: platforms[platform],
  }))
}

/** Source links must correspond to their displayed platform. A generic HTTPS
 * link is not sufficient provenance and could mislabel an unrelated website. */
const allowedSourceHosts: Record<Platform, readonly string[]> = {
  youtube: ['youtube.com','www.youtube.com','m.youtube.com','youtu.be'],
  instagram: ['instagram.com','www.instagram.com'],
  tiktok: ['tiktok.com','www.tiktok.com','m.tiktok.com','vm.tiktok.com'],
  threads: ['threads.net','www.threads.net','threads.com','www.threads.com'],
  x: ['x.com','www.x.com','twitter.com','www.twitter.com'],
  visitgarut: ['visitgarut.com','www.visitgarut.com'],
  google: ['google.com','www.google.com','maps.google.com','maps.app.goo.gl'],
}
export function safeEvidenceSource(url: string, platform?: Platform): string | null {
  try {
    const value = new URL(url)
    if (value.protocol !== 'https:' || value.username || value.password || value.port) return null
    if (platform && !allowedSourceHosts[platform].includes(value.hostname.toLowerCase())) return null
    return value.href
  } catch { return null }
}
