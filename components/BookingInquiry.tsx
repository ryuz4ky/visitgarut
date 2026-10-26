'use client'

import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, CalendarDays, CheckCircle2, ExternalLink, MessageCircle, PackageOpen, Send, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type BookingInquiryProps = {
  placeId: string
  placeName: string
  userId: string | null
  whatsappNumber?: string | null
  categorySlug?: string | null
  initialItemId?: string
  initialStartDate?: string
  initialEndDate?: string
  initialGuests?: number
}
type Inventory = { id: string; item_type: string; name: string; description: string | null; capacity: number | null; price_amount: number | null; currency: string; price_unit: string | null; booking_url: string | null }
type Source = { source_name: string; source_type: string; source_url: string | null; last_verified_at: string }

function money(value: number | null, currency: string) {
  if (value == null) return 'Cek harga'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

export default function BookingInquiry({
  placeId,
  placeName,
  userId,
  whatsappNumber,
  categorySlug,
  initialItemId = '',
  initialStartDate = '',
  initialEndDate = '',
  initialGuests = 1,
}: BookingInquiryProps) {
  const supabase = useMemo(() => createClient(), [])
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [source, setSource] = useState<Source | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string>(initialItemId)
  const [intent, setIntent] = useState('availability')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)
  const [guests, setGuests] = useState(Math.max(1, initialGuests || 1))
  const [message, setMessage] = useState(`Halo, saya ingin menanyakan informasi tentang ${placeName}.`)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isStay = categorySlug === 'penginapan'
  const isTransport = categorySlug === 'transportasi'

  useEffect(() => {
    let active = true
    Promise.all([
      supabase.from('inventory_items').select('id,item_type,name,description,capacity,price_amount,currency,price_unit,booking_url').eq('place_id', placeId).eq('status', 'published').order('item_type').order('name'),
      supabase.from('place_sources').select('source_name,source_type,source_url,last_verified_at').eq('place_id', placeId).order('last_verified_at', { ascending: false }).limit(1).maybeSingle(),
    ]).then(([itemsResult, sourceResult]) => {
      if (!active) return
      const items = (itemsResult.data ?? []).map((item) => ({ ...item, price_amount: item.price_amount == null ? null : Number(item.price_amount) })) as Inventory[]
      setInventory(items)
      if (initialItemId && !items.some((item) => item.id === initialItemId)) setSelectedItemId('')
      setSource((sourceResult.data as Source | null) ?? null)
    })
    return () => { active = false }
  }, [initialItemId, placeId, supabase])

  const selectedItem = inventory.find((item) => item.id === selectedItemId) ?? null

  useEffect(() => {
    if (!selectedItem || !initialItemId) return
    const dates = startDate
      ? isStay && endDate
        ? ` untuk ${startDate} sampai ${endDate}`
        : ` untuk ${startDate}`
      : ''
    setMessage(`Halo, saya ingin menanyakan ${selectedItem.name} di ${placeName}${dates}. Mohon konfirmasi ketersediaan dan harga terbaru.`)
  }, [endDate, initialItemId, isStay, placeName, selectedItem, startDate])

  function chooseItem(item: Inventory) {
    setSelectedItemId(item.id)
    const dates = startDate
      ? isStay && endDate
        ? ` untuk ${startDate} sampai ${endDate}`
        : ` untuk ${startDate}`
      : ''
    setMessage(`Halo, saya ingin menanyakan ${item.name} di ${placeName}${dates}. Mohon konfirmasi ketersediaan dan harga terbaru.`)
  }

  function validateContext() {
    if (!fullName.trim() || (!phone.trim() && !email.trim())) return 'Isi nama dan minimal email atau nomor telepon.'
    if (startDate && endDate && endDate < startDate) return 'Tanggal selesai tidak boleh sebelum tanggal mulai.'
    if (selectedItem?.capacity && guests > selectedItem.capacity) return `Inventory ini tercatat untuk maksimal ${selectedItem.capacity} orang. Hubungi partner untuk kebutuhan grup lebih besar.`
    return null
  }

  async function submitLead() {
    const validationError = validateContext()
    if (validationError) { setError(validationError); return }
    setBusy(true); setError(null)
    const { error: submitError } = await supabase.from('booking_leads').insert({
      place_id: placeId,
      inventory_item_id: selectedItem?.id ?? null,
      user_id: userId,
      source: 'visitgarut',
      intent,
      full_name: fullName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      message: message.trim() || null,
      status: 'new',
      start_date: startDate || null,
      end_date: endDate || null,
      guests,
      quantity: 1,
      currency: selectedItem?.currency || 'IDR',
      metadata: {
        place_name: placeName,
        inventory_item_name: selectedItem?.name ?? null,
        inventory_item_type: selectedItem?.item_type ?? null,
        base_price_snapshot: selectedItem?.price_amount ?? null,
        category_slug: categorySlug ?? null,
      },
    })
    setBusy(false)
    if (submitError) { setError(submitError.message); return }
    setSent(true)
  }

  async function trackWhatsapp() {
    const normalized = whatsappNumber?.replace(/\D/g, '')
    if (!normalized) return
    await supabase.from('booking_leads').insert({
      place_id: placeId,
      inventory_item_id: selectedItem?.id ?? null,
      user_id: userId,
      source: 'whatsapp',
      intent,
      full_name: fullName.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      message: message.trim() || null,
      status: 'new',
      start_date: startDate || null,
      end_date: endDate || null,
      guests,
      quantity: 1,
      currency: selectedItem?.currency || 'IDR',
      metadata: {
        place_name: placeName,
        direct_click: true,
        inventory_item_name: selectedItem?.name ?? null,
        inventory_item_type: selectedItem?.item_type ?? null,
        base_price_snapshot: selectedItem?.price_amount ?? null,
        category_slug: categorySlug ?? null,
      },
    })
    const text = encodeURIComponent(message.trim() || `Halo, saya ingin menanyakan informasi tentang ${placeName}.`)
    window.open(`https://wa.me/${normalized}?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  if (sent) return <div className="booking-success-state"><CheckCircle2 size={30} /><h3>Permintaan terkirim.</h3><p>Inquiry kamu sudah tercatat lengkap dengan inventory dan tanggal perjalanan. Partner dapat menindaklanjuti melalui kontak yang kamu berikan.</p>{whatsappNumber ? <button type="button" onClick={trackWhatsapp}><MessageCircle size={17} /> Lanjut via WhatsApp</button> : null}</div>

  return (
    <div className="booking-inquiry-card catalog-booking-card" id="booking">
      {source ? <div className="catalog-provenance"><BadgeCheck size={16} /><div><strong>Data source verified</strong><span>{source.source_name} · {new Date(source.last_verified_at).toLocaleDateString('id-ID')}</span></div>{source.source_url ? <a href={source.source_url} target="_blank" rel="noreferrer" aria-label={`Buka sumber ${source.source_name}`}><ExternalLink size={14} /></a> : null}</div> : null}

      {inventory.length ? (
        <div className="catalog-selector">
          <span className="marketplace-kicker"><PackageOpen size={14} /> PILIH PRODUK / LAYANAN</span>
          <div className="catalog-selector-list">
            {inventory.map((item) => <button type="button" key={item.id} className={selectedItemId === item.id ? 'selected' : ''} onClick={() => chooseItem(item)}><div><span>{item.item_type}</span><strong>{item.name}</strong>{item.description ? <small>{item.description}</small> : null}{item.capacity ? <small>Hingga {item.capacity} orang</small> : null}</div><em>{money(item.price_amount, item.currency)}{item.price_unit ? ` / ${item.price_unit}` : ''}</em></button>)}
          </div>
          {selectedItem?.booking_url ? <a className="catalog-external-booking" href={selectedItem.booking_url} target="_blank" rel="noreferrer">Cek langsung di partner <ExternalLink size={14} /></a> : null}
        </div>
      ) : null}

      <span className="marketplace-kicker">BOOK / ASK LOCAL</span>
      <h2>{selectedItem ? `Tanya ${selectedItem.name}` : 'Tanya ketersediaan'}</h2>
      <p>Kirim inquiry tanpa pembayaran di VisitGarut. Tanggal dan kebutuhan perjalanan ikut dikirim ke partner agar follow-up lebih relevan.</p>
      <label><span>Kebutuhan</span><select value={intent} onChange={(event) => setIntent(event.target.value)}><option value="availability">Cek ketersediaan</option><option value="booking">Ingin booking</option><option value="promo">Tanya promo</option><option value="inquiry">Pertanyaan umum</option></select></label>

      <div className="booking-two-col">
        <label><span><CalendarDays size={13} /> {isStay ? 'Check-in' : isTransport ? 'Tanggal penggunaan' : 'Tanggal mulai (opsional)'}</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
        {isStay || (!isTransport && endDate) ? <label><span><CalendarDays size={13} /> {isStay ? 'Check-out' : 'Tanggal selesai'}</span><input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} /></label> : <label><span><Users size={13} /> {isTransport ? 'Penumpang' : 'Jumlah orang'}</span><input type="number" min={1} max={50} value={guests} onChange={(event) => setGuests(Math.max(1, Number(event.target.value) || 1))} /></label>}
      </div>
      {isStay ? <label><span><Users size={13} /> Tamu</span><input type="number" min={1} max={50} value={guests} onChange={(event) => setGuests(Math.max(1, Number(event.target.value) || 1))} /></label> : null}

      <div className="booking-two-col"><label><span>Nama</span><input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nama kamu" /></label><label><span>WhatsApp / Telepon</span><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="08…" inputMode="tel" /></label></div>
      <label><span>Email (opsional jika sudah isi telepon)</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" /></label>
      <label><span>Pesan</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} /></label>
      {error ? <p className="booking-error">{error}</p> : null}
      <div className="booking-actions"><button className="booking-primary" type="button" onClick={submitLead} disabled={busy}><Send size={16} /> {busy ? 'Mengirim…' : 'Kirim inquiry'}</button>{whatsappNumber ? <button className="booking-whatsapp" type="button" onClick={trackWhatsapp}><MessageCircle size={16} /> WhatsApp langsung</button> : null}</div>
      <small>Harga dan availability harus dikonfirmasi partner. VisitGarut belum memproses pembayaran pada tahap ini.</small>
    </div>
  )
}
