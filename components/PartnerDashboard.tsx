'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BadgeCheck, BarChart3, CheckCircle2, ChevronRight, Inbox, Megaphone, Plus, Store, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type PartnerPlace = {
  id: string
  name: string
  slug: string
  district: string | null
}

type PartnerOffer = {
  id: string
  place_id: string
  title: string
  description: string | null
  promo_code: string | null
  price_label: string | null
  cta_url: string | null
  valid_until: string | null
  status: string
  is_featured: boolean
}

type PartnerLead = {
  id: string
  place_id: string
  source: string
  intent: string
  full_name: string | null
  email: string | null
  phone: string | null
  message: string | null
  status: string
  created_at: string
}

type PartnerDashboardProps = {
  userId: string
  places: PartnerPlace[]
  offers: PartnerOffer[]
  leads: PartnerLead[]
}

export default function PartnerDashboard({ userId, places, offers, leads }: PartnerDashboardProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [selectedPlaceId, setSelectedPlaceId] = useState(places[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priceLabel, setPriceLabel] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [publishNow, setPublishNow] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const newLeadCount = leads.filter((lead) => lead.status === 'new').length
  const convertedCount = leads.filter((lead) => lead.status === 'converted').length
  const publishedOfferCount = offers.filter((offer) => offer.status === 'published').length

  async function createOffer() {
    if (!selectedPlaceId || !title.trim()) return
    setBusy('offer')
    setFeedback(null)

    const { error } = await supabase.from('offers').insert({
      place_id: selectedPlaceId,
      created_by: userId,
      title: title.trim(),
      description: description.trim() || null,
      price_label: priceLabel.trim() || null,
      promo_code: promoCode.trim() || null,
      cta_url: ctaUrl.trim() || null,
      valid_until: validUntil ? new Date(`${validUntil}T23:59:59`).toISOString() : null,
      status: publishNow ? 'published' : 'draft',
      is_featured: false,
    })

    setBusy(null)
    setFeedback(error ? error.message : publishNow ? 'Offer berhasil dipublikasikan.' : 'Offer disimpan sebagai draft.')
    if (!error) {
      setTitle('')
      setDescription('')
      setPriceLabel('')
      setPromoCode('')
      setCtaUrl('')
      setValidUntil('')
      router.refresh()
    }
  }

  async function changeOfferStatus(id: string, status: string) {
    setBusy(`offer-${id}`)
    const { error } = await supabase.from('offers').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setBusy(null)
    setFeedback(error ? error.message : `Status offer diubah menjadi ${status}.`)
    if (!error) router.refresh()
  }

  async function changeLeadStatus(id: string, status: string) {
    setBusy(`lead-${id}`)
    const { error } = await supabase.from('booking_leads').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setBusy(null)
    setFeedback(error ? error.message : 'Status lead diperbarui.')
    if (!error) router.refresh()
  }

  function placeName(placeId: string) {
    return places.find((place) => place.id === placeId)?.name || 'Listing VisitGarut'
  }

  return (
    <div className="partner-dashboard">
      <section className="partner-stat-grid">
        <article><div><Store size={20} /></div><span>Listing dikelola</span><strong>{places.length}</strong><small>Approved claims</small></article>
        <article><div><Inbox size={20} /></div><span>Lead baru</span><strong>{newLeadCount}</strong><small>Perlu ditindaklanjuti</small></article>
        <article><div><Megaphone size={20} /></div><span>Offer aktif</span><strong>{publishedOfferCount}</strong><small>Terlihat publik</small></article>
        <article><div><BarChart3 size={20} /></div><span>Converted</span><strong>{convertedCount}</strong><small>Ditandai partner</small></article>
      </section>

      {feedback ? <div className="partner-feedback"><CheckCircle2 size={16} /> {feedback}</div> : null}

      <section className="partner-managed-listings">
        <div className="partner-section-heading">
          <div><span className="marketplace-kicker">YOUR INVENTORY</span><h2>Listing yang kamu kelola</h2><p>Listing muncul di sini setelah claim disetujui.</p></div>
        </div>
        <div className="partner-listing-grid">
          {places.map((place) => (
            <Link key={place.id} href={`/explore/${place.slug}`}>
              <div><BadgeCheck size={18} /></div>
              <span>VERIFIED MANAGEMENT</span>
              <h3>{place.name}</h3>
              <p>{place.district || 'Kabupaten Garut'}</p>
              <strong>Lihat listing <ChevronRight size={15} /></strong>
            </Link>
          ))}
        </div>
      </section>

      <div className="partner-two-column">
        <section className="partner-panel">
          <div className="partner-panel-heading"><div><Plus size={18} /> Buat offer / promo</div><p>Publikasikan penawaran yang benar-benar tersedia dari bisnismu.</p></div>
          <label><span>Listing</span><select value={selectedPlaceId} onChange={(event) => setSelectedPlaceId(event.target.value)}>{places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}</select></label>
          <label><span>Judul offer</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Contoh: Paket weekday 2D1N" /></label>
          <label><span>Deskripsi</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Syarat, benefit, atau detail offer…" /></label>
          <div className="partner-field-pair">
            <label><span>Harga / label</span><input value={priceLabel} onChange={(event) => setPriceLabel(event.target.value)} placeholder="Rp750.000 / paket" /></label>
            <label><span>Kode promo</span><input value={promoCode} onChange={(event) => setPromoCode(event.target.value)} placeholder="GARUT10" /></label>
          </div>
          <label><span>CTA URL</span><input type="url" value={ctaUrl} onChange={(event) => setCtaUrl(event.target.value)} placeholder="https://…" /></label>
          <label><span>Berlaku sampai</span><input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} /></label>
          <label className="partner-toggle"><input type="checkbox" checked={publishNow} onChange={(event) => setPublishNow(event.target.checked)} /><span>Publikasikan sekarang</span></label>
          <button className="partner-primary-button" type="button" onClick={createOffer} disabled={busy === 'offer' || !selectedPlaceId || !title.trim()}><Megaphone size={17} /> {busy === 'offer' ? 'Menyimpan…' : publishNow ? 'Publikasikan offer' : 'Simpan draft'}</button>
        </section>

        <section className="partner-panel">
          <div className="partner-panel-heading"><div><Tag size={18} /> Offer aktif & draft</div><p>Kelola visibility penawaran dari partner center.</p></div>
          <div className="partner-offer-list">
            {offers.length ? offers.map((offer) => (
              <article key={offer.id}>
                <div><span>{placeName(offer.place_id)}</span><h3>{offer.title}</h3>{offer.price_label ? <strong>{offer.price_label}</strong> : null}</div>
                <div className="partner-status-actions">
                  <em className={`partner-status ${offer.status}`}>{offer.status}</em>
                  <select value={offer.status} onChange={(event) => changeOfferStatus(offer.id, event.target.value)} disabled={busy === `offer-${offer.id}`}>
                    <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option><option value="expired">Expired</option>
                  </select>
                </div>
              </article>
            )) : <div className="partner-empty"><Megaphone size={24} /><p>Belum ada offer untuk listing kamu.</p></div>}
          </div>
        </section>
      </div>

      <section className="partner-leads-section">
        <div className="partner-section-heading">
          <div><span className="marketplace-kicker">INQUIRY INBOX</span><h2>Lead dari traveler</h2><p>Inquiry yang dikirim melalui VisitGarut atau click-to-WhatsApp tercatat di sini.</p></div>
        </div>
        {leads.length ? (
          <div className="partner-lead-table-wrap">
            <table className="partner-lead-table">
              <thead><tr><th>Traveler</th><th>Listing</th><th>Intent</th><th>Kontak</th><th>Masuk</th><th>Status</th></tr></thead>
              <tbody>{leads.map((lead) => (
                <tr key={lead.id}>
                  <td><strong>{lead.full_name || 'Anonymous traveler'}</strong>{lead.message ? <small>{lead.message}</small> : null}</td>
                  <td>{placeName(lead.place_id)}</td>
                  <td><span className="lead-intent">{lead.intent}</span><small>{lead.source}</small></td>
                  <td>{lead.phone ? <a href={`tel:${lead.phone}`}>{lead.phone}</a> : null}{lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : null}</td>
                  <td>{new Date(lead.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</td>
                  <td><select value={lead.status} onChange={(event) => changeLeadStatus(lead.id, event.target.value)} disabled={busy === `lead-${lead.id}`}><option value="new">New</option><option value="contacted">Contacted</option><option value="converted">Converted</option><option value="closed">Closed</option></select></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <div className="partner-empty large"><Inbox size={30} /><h3>Belum ada inquiry.</h3><p>Lead baru akan muncul setelah traveler menghubungi listing melalui VisitGarut.</p></div>}
      </section>
    </div>
  )
}
