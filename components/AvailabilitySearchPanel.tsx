'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ExternalLink, SearchCheck, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type AvailabilitySearchPanelProps = {
  action: string
  categorySlug: string
  mode: 'range' | 'day'
  startDate?: string
  endDate?: string
  guests?: number
  query?: string
  district?: string
  subtype?: string
  preserve?: Record<string, string | undefined>
}

type AvailableInventoryItem = {
  inventory_item_id: string
  place_name: string
  place_slug: string
  district: string | null
  subtype: string | null
  item_type: string
  item_name: string
  capacity: number | null
  effective_price: number | null
  currency: string
  price_unit: string | null
  booking_url: string | null
}

function formatPrice(value: number, currency: string) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency || 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatSubtype(value?: string | null) {
  if (!value) return 'Inventory'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function AvailabilitySearchPanel({
  action,
  categorySlug,
  mode,
  startDate = '',
  endDate = '',
  guests = 1,
  query = '',
  district = '',
  subtype = '',
  preserve = {},
}: AvailabilitySearchPanelProps) {
  const supabase = useMemo(() => createClient(), [])
  const [results, setResults] = useState<AvailableInventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const hasSearch = Boolean(startDate)
  const invalidRange = mode === 'range' && Boolean(startDate && endDate && endDate <= startDate)

  useEffect(() => {
    let active = true

    async function loadAvailability() {
      if (!hasSearch || invalidRange) {
        setResults([])
        setLoadError(null)
        return
      }

      setLoading(true)
      setLoadError(null)

      const { data, error } = await supabase.rpc('search_available_inventory', {
        p_category_slug: categorySlug,
        p_start_date: startDate,
        p_end_date: mode === 'range' ? endDate || null : null,
        p_query: query.trim() || null,
        p_district: district || null,
        p_subtype: subtype || null,
        p_guests: Math.max(1, Math.min(guests || 1, 20)),
        p_limit: 24,
      })

      if (!active) return

      if (error) {
        setResults([])
        setLoadError('Live availability belum dapat dimuat. Kamu masih bisa melihat katalog dan mengirim inquiry langsung ke partner.')
        setLoading(false)
        return
      }

      const normalized = ((data ?? []) as Record<string, unknown>[]).map((row) => ({
        inventory_item_id: String(row.inventory_item_id),
        place_name: String(row.place_name),
        place_slug: String(row.place_slug),
        district: (row.district as string | null) ?? null,
        subtype: (row.subtype as string | null) ?? null,
        item_type: String(row.item_type),
        item_name: String(row.item_name),
        capacity: row.capacity == null ? null : Number(row.capacity),
        effective_price: row.effective_price == null ? null : Number(row.effective_price),
        currency: String(row.currency || 'IDR'),
        price_unit: (row.price_unit as string | null) ?? null,
        booking_url: (row.booking_url as string | null) ?? null,
      }))

      setResults(normalized)
      setLoading(false)
    }

    loadAvailability()
    return () => { active = false }
  }, [categorySlug, district, endDate, guests, hasSearch, invalidRange, mode, query, startDate, subtype, supabase])

  return (
    <section className="marketplace-shell availability-search-shell">
      <div className="availability-search-heading">
        <div>
          <span className="marketplace-kicker">LIVE AVAILABILITY</span>
          <h2>{mode === 'range' ? 'Cari inventory berdasarkan tanggal menginap.' : 'Cari inventory untuk tanggal penggunaan.'}</h2>
          <p>Hanya inventory yang dipublikasikan partner sebagai tersedia yang muncul di hasil ini.</p>
        </div>
        <SearchCheck size={30} />
      </div>

      <form className="availability-search-form" action={action}>
        {Object.entries(preserve).map(([key, value]) => value ? <input key={key} type="hidden" name={key} value={value} /> : null)}
        <label>
          <span><CalendarDays size={15} /> {mode === 'range' ? 'Check-in' : 'Tanggal'}</span>
          <input type="date" name={mode === 'range' ? 'checkin' : 'date'} defaultValue={startDate} required />
        </label>
        {mode === 'range' ? (
          <label>
            <span><CalendarDays size={15} /> Check-out</span>
            <input type="date" name="checkout" defaultValue={endDate} required />
          </label>
        ) : null}
        <label>
          <span><Users size={15} /> {mode === 'range' ? 'Tamu' : 'Penumpang'}</span>
          <input type="number" name="guests" min={1} max={20} defaultValue={Math.max(1, guests)} />
        </label>
        <button type="submit">Cek availability</button>
      </form>

      {invalidRange ? <div className="availability-message error">Tanggal selesai harus setelah tanggal mulai.</div> : null}
      {loadError ? <div className="availability-message error">{loadError}</div> : null}
      {loading ? <div className="availability-message"><strong>Mengecek live availability…</strong><p>Mengambil kalender inventory yang dipublikasikan partner.</p></div> : null}

      {hasSearch && !invalidRange && !loading && !loadError ? (
        results.length ? (
          <div className="availability-results">
            <div className="availability-results-heading">
              <strong>{results.length} inventory tersedia</strong>
              <span>Availability berasal dari kalender partner VisitGarut.</span>
            </div>
            <div className="availability-result-grid">
              {results.map((item) => {
                const bookingParams = new URLSearchParams()
                bookingParams.set('item', item.inventory_item_id)
                bookingParams.set('start', startDate)
                if (mode === 'range' && endDate) bookingParams.set('end', endDate)
                bookingParams.set('guests', String(Math.max(1, guests)))
                const listingHref = `/explore/${item.place_slug}?${bookingParams.toString()}#booking`

                return (
                  <article key={item.inventory_item_id}>
                    <div>
                      <span>{formatSubtype(item.subtype)} · {formatSubtype(item.item_type)}</span>
                      <h3>{item.place_name}</h3>
                      <p>{item.item_name}</p>
                      <small>{item.district || 'Kabupaten Garut'}{item.capacity ? ` · hingga ${item.capacity} orang` : ''}</small>
                    </div>
                    <div className="availability-result-actions">
                      {item.effective_price != null ? <strong>{formatPrice(item.effective_price, item.currency)}{item.price_unit ? ` / ${item.price_unit.replace(/_/g, ' ')}` : ''}</strong> : <strong>Cek harga partner</strong>}
                      <Link href={listingHref}>Pilih & inquiry</Link>
                      {item.booking_url ? <a href={item.booking_url} target="_blank" rel="noreferrer">Booking partner <ExternalLink size={13} /></a> : null}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="availability-message">
            <strong>Belum ada live availability untuk tanggal ini.</strong>
            <p>Ini tidak otomatis berarti sold out. Partner VisitGarut mungkin belum mempublikasikan kalender stoknya. Gunakan katalog di bawah untuk melihat listing dan mengirim inquiry langsung.</p>
          </div>
        )
      ) : null}
    </section>
  )
}
