import { formatScore, tierLabels } from '@/lib/rating/core'
import type { placeRating } from '@/lib/rating/store'
export type PlaceRating = NonNullable<Awaited<ReturnType<typeof placeRating>>>

export default function RatingBadge({ rating, compact = false }: { rating: PlaceRating; compact?: boolean }) {
  const none = rating.score === null
  return <div className={`vr-badge is-${rating.tier}${compact ? ' is-compact' : ''}`}>
    <span className="vr-score" aria-label={none ? 'Belum ada skor' : `Skor ${formatScore(rating.score!)} dari 5`}>{none ? '?' : formatScore(rating.score!)}</span>
    <span className="vr-badge-text"><strong>{tierLabels[rating.tier]}</strong><small>{rating.reviewers} penilai independen · 12 bulan terakhir</small></span>
  </div>
}
