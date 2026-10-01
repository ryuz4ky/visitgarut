'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type PartnerPlace = { id: string; name: string; slug: string; district: string | null }
type PartnerInventory = { id: string; place_id: string; item_type: string; name: string; status: string }
type AvailabilityRow = {
  id: string
  inventory_item_id: string
  available_date: string
  quantity_available: number
  price_amount: number | null
  currency: string
  status: string
}

type Props = {
  places: PartnerPlace[]
  inventory: PartnerInventory[]
  availability: AvailabilityRow[]
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateRange(start: string, end: string) {
  const result: string[] = []
  const current = new Date(`${start}T00:00:00`)
  const last = new Date(`${end || start}T00:00:00`)
  while (current <= last && result.length < 90) {
    result.push(toIsoDate(current))
    current.setDate(current.getDate() + 1)
  }
  return result
}

function formatRupiah(value: number | null) {
  if (value == null) return 'Default item price'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

export default function PartnerAvailabilityManager({ places, inventory, availability }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [selectedItemId, setSelectedItemId] = useState(inventory[0]?.id ?? '')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [price, setPrice] = useState('')
  const [status, setStatus] = useState('available')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const selectedItem = inventory.find((item) => item.id === selectedItemId)
  const upcoming = availability
    .filter((row) => !selectedItemId || row.inventory_item_id === selectedItemId)
    .slice()
    .sort((a, b) => a.available_date.localeCompare(b.available_date))
    .slice(0, 45)

  function placeName(placeId: string) {
    return places.find((place) => place.id === placeId)?.name || 'Listing VisitGarut'
  }

  async function saveAvailability() {
    if (!selectedItemId || !startDate) {
      setFeedback('Pilih inventory dan tanggal mulai.')
      return
    }
    if (endDate && endDate < startDate) {
      setFeedback('Tanggal selesai harus sama atau setelah tanggal mulai.')
      return
    }

    const dates = dateRange(startDate, endDate || startDate)
    if (!dates.length) return
    if (dates.length >= 90 && endDate) {
      setFeedback('Satu kali update maksimal 90 hari.')
      return
    }

    setBusy(true)
    setFeedback(null)
    const quantityValue = Math.max(0, Math.min(Number.parseInt(quantity, 10) || 0, 9999))
    const parsedPrice = price.trim() ? Number(price) : null
    const priceValue = parsedPrice != null && Number.isFinite(parsedPrice) ? Math.max(0, parsedPrice) : null
    const rows = dates.map((availableDate) => ({
      inventory_item_id: selectedItemId,
      available_date: availableDate,
      quantity_available: status === 'available' ? quantityValue : 0,
      price_amount: priceValue,
      currency: 'IDR',
      status,
      source: 'partner',
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('inventory_availability')
      .upsert(rows, { onConflict: 'inventory_item_id,available_date' })

    setBusy(false)
    setFeedback(error ? error.message : `${dates.length} tanggal berhasil diperbarui.`)
    if (!error) window.location.reload()
  }

  if (!inventory.length) {
    return (
      <section className="partner-availability-panel">
        <div className="partner-section-heading"><div><span className="marketplace-kicker">AVAILABILITY</span><h2>Kalender stok & harga</h2><p>Buat inventory terlebih dahulu sebelum mengatur ketersediaan per tanggal.</p></div></div>
      </section>
    )
  }

  return (
    <section className="partner-availability-panel">
      <div className="partner-section-heading">
        <div><span className="marketplace-kicker">AVAILABILITY</span><h2>Kalender stok & harga</h2><p>Data ini menjadi sumber hasil pencarian tanggal di Stay dan Transport.</p></div>
      </div>

      {feedback ? <div className="partner-feedback"><CheckCircle2 size={16} /> {feedback}</div> : null}

      <div className="partner-availability-grid">
        <div className="partner-panel availability-editor">
          <label><span>Inventory</span><select value={selectedItemId} onChange={(event) => setSelectedItemId(event.target.value)}>{inventory.map((item) => <option key={item.id} value={item.id}>{placeName(item.place_id)} — {item.name}</option>)}</select></label>
          <div className="partner-field-pair">
            <label><span>Tanggal mulai</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
            <label><span>Tanggal selesai</span><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
          </div>
          <div className="partner-field-pair">
            <label><span>Quantity tersedia</span><input type="number" min={0} max={9999} value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
            <label><span>Harga per tanggal (opsional)</span><input type="number" min={0} step="1000" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Kosong = harga default inventory" /></label>
          </div>
          <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="available">Available</option><option value="sold_out">Sold out</option><option value="closed">Closed</option></select></label>
          <button className="partner-primary-button" type="button" onClick={saveAvailability} disabled={busy}><Save size={17} /> {busy ? 'Menyimpan…' : 'Simpan availability'}</button>
          <small className="availability-editor-note">Update range akan membuat atau menimpa tanggal yang sama untuk inventory terpilih. Maksimal 90 hari per update.</small>
        </div>

        <div className="partner-panel availability-preview">
          <div className="partner-panel-heading"><div><CalendarDays size={18} /> Upcoming availability</div><p>{selectedItem ? `${placeName(selectedItem.place_id)} — ${selectedItem.name}` : 'Pilih inventory'}</p></div>
          {upcoming.length ? (
            <div className="availability-preview-list">
              {upcoming.map((row) => (
                <article key={row.id}>
                  <div><strong>{row.available_date}</strong><span>{row.status}</span></div>
                  <div><strong>{row.quantity_available} unit</strong><small>{formatRupiah(row.price_amount)}</small></div>
                </article>
              ))}
            </div>
          ) : <div className="partner-empty"><CalendarDays size={24} /><p>Belum ada kalender availability untuk inventory ini.</p></div>}
        </div>
      </div>
    </section>
  )
}
