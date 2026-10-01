'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock3, MessageSquareText, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type ReviewItem = {
  id: string
  rating: number
  body: string | null
  status: string
  created_at: string
  user_id: string
  profile: { full_name: string | null; username: string | null } | null
}

type ReviewSectionProps = {
  placeId: string
  placeSlug: string
  userId: string | null
  reviews: ReviewItem[]
}

export default function ReviewSection({ placeId, placeSlug, userId, reviews }: ReviewSectionProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const existing = userId ? reviews.find((review) => review.user_id === userId) : null
  const [rating, setRating] = useState(existing?.rating ?? 5)
  const [body, setBody] = useState(existing?.body ?? '')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const publishedReviews = reviews.filter((review) => review.status === 'published')

  async function submitReview() {
    if (!userId) return
    setBusy(true)
    setFeedback(null)

    const { error } = await supabase.from('reviews').upsert(
      {
        user_id: userId,
        place_id: placeId,
        rating,
        body: body.trim() || null,
        status: 'pending',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,place_id' }
    )

    setBusy(false)
    setFeedback(error ? error.message : 'Review terkirim dan menunggu moderasi.')
    if (!error) router.refresh()
  }

  return (
    <section className="transaction-review-section">
      <div className="transaction-section-heading">
        <div>
          <span className="marketplace-kicker">TRAVELER REVIEWS</span>
          <h2>Pengalaman pengunjung</h2>
          <p>Review dari traveler membantu orang lain merencanakan kunjungan dengan informasi yang lebih nyata.</p>
        </div>
        <div className="review-summary-pill">
          <MessageSquareText size={17} />
          <strong>{publishedReviews.length}</strong>
          <span>review terpublikasi</span>
        </div>
      </div>

      <div className="review-layout">
        <div className="review-compose-card">
          <h3>{existing ? 'Perbarui review kamu' : 'Bagikan pengalamanmu'}</h3>
          {!userId ? (
            <div className="review-login-state">
              <p>Masuk ke akun VisitGarut untuk memberi rating dan review.</p>
              <Link href={`/login?next=${encodeURIComponent(`/explore/${placeSlug}`)}`}>Masuk untuk review</Link>
            </div>
          ) : (
            <>
              {existing?.status === 'pending' ? (
                <div className="review-pending-note"><Clock3 size={15} /> Review kamu sedang menunggu moderasi.</div>
              ) : null}
              <div className="rating-picker" role="radiogroup" aria-label="Rating tempat">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={value <= rating ? 'active' : ''}
                    onClick={() => setRating(value)}
                    aria-label={`${value} bintang`}
                    aria-checked={rating === value}
                    role="radio"
                  >
                    <Star size={23} fill="currentColor" />
                  </button>
                ))}
                <strong>{rating}/5</strong>
              </div>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Ceritakan pengalaman, akses, fasilitas, atau tips untuk pengunjung lain…"
                maxLength={1000}
              />
              <div className="review-compose-footer">
                <span>{body.length}/1000</span>
                <button type="button" onClick={submitReview} disabled={busy}>
                  {busy ? 'Mengirim…' : existing ? 'Perbarui review' : 'Kirim review'}
                </button>
              </div>
              {feedback ? <p className="review-feedback"><CheckCircle2 size={15} /> {feedback}</p> : null}
            </>
          )}
        </div>

        <div className="review-list">
          {publishedReviews.length ? publishedReviews.slice(0, 6).map((review) => {
            const author = review.profile?.full_name || review.profile?.username || 'Traveler VisitGarut'
            return (
              <article key={review.id}>
                <div className="review-card-top">
                  <div className="review-avatar">{author.slice(0, 1).toUpperCase()}</div>
                  <div><strong>{author}</strong><span>{new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                  <div className="review-stars">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={13} fill={index < review.rating ? 'currentColor' : 'none'} />)}</div>
                </div>
                {review.body ? <p>{review.body}</p> : <p className="muted-review">Memberikan rating tanpa komentar.</p>}
              </article>
            )
          }) : (
            <div className="review-empty-state">
              <MessageSquareText size={28} />
              <h3>Belum ada review terpublikasi.</h3>
              <p>Jadilah salah satu traveler pertama yang membagikan pengalaman.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
