'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Eye,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  XCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Claim = {
  id: string
  status: string
  business_email: string | null
  phone: string | null
  note: string | null
  created_at: string
  place: { id: string; name: string; slug: string; district: string | null } | null
}

type Review = {
  id: string
  rating: number
  body: string | null
  status: string
  created_at: string
  place: { id: string; name: string; slug: string } | null
}

type Place = {
  id: string
  name: string
  slug: string
  district: string | null
  status: string
  is_featured: boolean
  is_verified: boolean
  rating: number | null
  review_count: number
}

type Lead = {
  id: string
  status: string
  intent: string
  created_at: string
  place: { name: string; slug: string } | null
}

type Offer = {
  id: string
  status: string
  title: string
  created_at: string
  place: { name: string; slug: string } | null
}

type Props = {
  userId: string
  operatorName: string
  claims: Claim[]
  reviews: Review[]
  places: Place[]
  leads: Lead[]
  offers: Offer[]
}

function relation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

export default function AdminDashboard({ userId, operatorName, claims, reviews, places, leads, offers }: Props) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [busy, setBusy] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const normalizedClaims = claims.map((item) => ({ ...item, place: relation(item.place) }))
  const normalizedReviews = reviews.map((item) => ({ ...item, place: relation(item.place) }))
  const normalizedLeads = leads.map((item) => ({ ...item, place: relation(item.place) }))
  const normalizedOffers = offers.map((item) => ({ ...item, place: relation(item.place) }))

  const pendingClaims = normalizedClaims.filter((item) => item.status === 'pending')
  const pendingReviews = normalizedReviews.filter((item) => item.status === 'pending')
  const newLeads = normalizedLeads.filter((item) => item.status === 'new')
  const publishedOffers = normalizedOffers.filter((item) => item.status === 'published')

  async function moderateClaim(id: string, status: 'approved' | 'rejected') {
    setBusy(`claim-${id}`)
    setFeedback(null)
    const { error } = await supabase
      .from('place_claims')
      .update({ status, reviewed_by: userId, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
    setBusy(null)
    setFeedback(error ? error.message : `Claim ${status === 'approved' ? 'disetujui' : 'ditolak'}.`)
    if (!error) router.refresh()
  }

  async function moderateReview(id: string, status: 'published' | 'rejected') {
    setBusy(`review-${id}`)
    setFeedback(null)
    const { error } = await supabase
      .from('reviews')
      .update({ status, moderated_by: userId, moderated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
    setBusy(null)
    setFeedback(error ? error.message : `Review ${status === 'published' ? 'dipublikasikan' : 'ditolak'}.`)
    if (!error) router.refresh()
  }

  async function updatePlace(id: string, patch: Partial<Pick<Place, 'status' | 'is_featured' | 'is_verified'>>) {
    setBusy(`place-${id}`)
    setFeedback(null)
    const { error } = await supabase.from('places').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
    setBusy(null)
    setFeedback(error ? error.message : 'Listing diperbarui.')
    if (!error) router.refresh()
  }

  return (
    <div className="admin-dashboard">
      <section className="admin-operator-card">
        <div className="admin-operator-icon"><ShieldCheck size={26} /></div>
        <div>
          <span>OPERATOR AKTIF</span>
          <h2>{operatorName}</h2>
          <p>Perubahan moderation dan listing dijalankan dengan policy admin Supabase.</p>
        </div>
      </section>

      {feedback ? <div className="admin-feedback">{feedback}</div> : null}

      <section className="admin-stat-grid">
        <article><BriefcaseBusiness size={22} /><span>Pending claims</span><strong>{pendingClaims.length}</strong></article>
        <article><MessageSquareText size={22} /><span>Pending reviews</span><strong>{pendingReviews.length}</strong></article>
        <article><CircleDollarSign size={22} /><span>New leads</span><strong>{newLeads.length}</strong></article>
        <article><Sparkles size={22} /><span>Published offers</span><strong>{publishedOffers.length}</strong></article>
        <article><Store size={22} /><span>Total listings</span><strong>{places.length}</strong></article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div><span className="marketplace-kicker">BUSINESS VERIFICATION</span><h2>Claim bisnis menunggu keputusan</h2></div>
          <strong>{pendingClaims.length} pending</strong>
        </div>
        {pendingClaims.length ? (
          <div className="admin-stack">
            {pendingClaims.map((claim) => (
              <article className="admin-moderation-card" key={claim.id}>
                <div>
                  <span>{new Date(claim.created_at).toLocaleDateString('id-ID')}</span>
                  <h3>{claim.place?.name || 'Listing VisitGarut'}</h3>
                  <p>{claim.place?.district || 'Garut'} · {claim.business_email || 'Email tidak diisi'} · {claim.phone || 'Telepon tidak diisi'}</p>
                  {claim.note ? <blockquote>{claim.note}</blockquote> : null}
                </div>
                <div className="admin-card-actions">
                  {claim.place ? <Link href={`/explore/${claim.place.slug}`} target="_blank"><Eye size={16} /> Lihat listing</Link> : null}
                  <button className="approve" disabled={busy === `claim-${claim.id}`} onClick={() => moderateClaim(claim.id, 'approved')}><CheckCircle2 size={16} /> Approve</button>
                  <button className="reject" disabled={busy === `claim-${claim.id}`} onClick={() => moderateClaim(claim.id, 'rejected')}><XCircle size={16} /> Reject</button>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="admin-empty">Tidak ada claim bisnis yang menunggu verifikasi.</div>}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div><span className="marketplace-kicker">TRAVELER TRUST</span><h2>Review moderation</h2></div>
          <strong>{pendingReviews.length} pending</strong>
        </div>
        {pendingReviews.length ? (
          <div className="admin-stack">
            {pendingReviews.map((review) => (
              <article className="admin-moderation-card review" key={review.id}>
                <div>
                  <span>{review.place?.name || 'Listing VisitGarut'} · {new Date(review.created_at).toLocaleDateString('id-ID')}</span>
                  <div className="admin-stars">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={16} fill={index < review.rating ? 'currentColor' : 'none'} />)}</div>
                  <p>{review.body || 'Traveler tidak menulis komentar.'}</p>
                </div>
                <div className="admin-card-actions">
                  {review.place ? <Link href={`/explore/${review.place.slug}`} target="_blank"><Eye size={16} /> Listing</Link> : null}
                  <button className="approve" disabled={busy === `review-${review.id}`} onClick={() => moderateReview(review.id, 'published')}><CheckCircle2 size={16} /> Publish</button>
                  <button className="reject" disabled={busy === `review-${review.id}`} onClick={() => moderateReview(review.id, 'rejected')}><XCircle size={16} /> Reject</button>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="admin-empty">Tidak ada review yang menunggu moderasi.</div>}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div><span className="marketplace-kicker">LISTING CONTROL</span><h2>Quality & visibility</h2></div>
          <strong>{places.filter((place) => place.status === 'published').length} published</strong>
        </div>
        <div className="admin-place-table">
          {places.map((place) => (
            <article key={place.id}>
              <div className="admin-place-title">
                <Link href={`/explore/${place.slug}`} target="_blank">{place.name}</Link>
                <span>{place.district || 'Garut'} · {place.review_count} review · {place.rating ? `${place.rating.toFixed(1)}/5` : 'belum ada rating'}</span>
              </div>
              <div className="admin-place-controls">
                <button className={place.is_verified ? 'active' : ''} disabled={busy === `place-${place.id}`} onClick={() => updatePlace(place.id, { is_verified: !place.is_verified })}><BadgeCheck size={15} /> Verified</button>
                <button className={place.is_featured ? 'active' : ''} disabled={busy === `place-${place.id}`} onClick={() => updatePlace(place.id, { is_featured: !place.is_featured })}><Sparkles size={15} /> Featured</button>
                <select value={place.status} disabled={busy === `place-${place.id}`} onChange={(event) => updatePlace(place.id, { status: event.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="admin-two-column">
        <section className="admin-panel compact">
          <div className="admin-panel-heading"><div><span className="marketplace-kicker">LEAD PIPELINE</span><h2>Recent demand</h2></div></div>
          <div className="admin-mini-list">
            {normalizedLeads.slice(0, 8).map((lead) => <div key={lead.id}><span>{lead.place?.name || 'VisitGarut'}</span><strong>{lead.intent}</strong><em>{lead.status}</em></div>)}
            {!normalizedLeads.length ? <div className="admin-empty">Belum ada lead.</div> : null}
          </div>
        </section>
        <section className="admin-panel compact">
          <div className="admin-panel-heading"><div><span className="marketplace-kicker">OFFER HEALTH</span><h2>Partner promos</h2></div></div>
          <div className="admin-mini-list">
            {normalizedOffers.slice(0, 8).map((offer) => <div key={offer.id}><span>{offer.title}</span><strong>{offer.place?.name || 'VisitGarut'}</strong><em>{offer.status}</em></div>)}
            {!normalizedOffers.length ? <div className="admin-empty">Belum ada offer.</div> : null}
          </div>
        </section>
      </div>
    </div>
  )
}
