import { formatScore, tierLabels, type Tier } from '@/lib/rating/core'

/** Small shared pieces of the rating UI. A missing score is always "?", never a guessed number. */
export function TierPill({ tier }: { tier: Tier }) {
  return <span className={`vr-tier is-${tier}`}>{tierLabels[tier]}</span>
}

export function ScoreRing({ score, tier, size = 'md' }: { score: number | null; tier: Tier; size?: 'sm' | 'md' | 'lg' }) {
  const none = score === null
  return <span className={`vr-ring is-${tier} is-${size}`} aria-label={none ? 'Belum ada skor' : `Skor ${formatScore(score)} dari 5`}>
    {none ? '?' : formatScore(score)}
  </span>
}

export function PreviewNote({ note }: { note: string | null }) {
  return note ? <p className="vr-preview" role="note">{note}</p> : null
}
