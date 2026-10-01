import Link from 'next/link'
import { CalendarDays, ExternalLink, SearchCheck, Users } from 'lucide-react'
import { searchAvailableInventory } from '@/lib/data/availability'

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

export default async function AvailabilitySearchPanel({
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
  const hasSearch = Boolean(startDate)
  const invalidRange = mode === 'range' && Boolean(startDate && endDate && endDate <= startDate)
  const results = hasSearch && !invalidRange
    ? await searchAvailableInventory({
        categorySlug,
        startDate,
        endDate: mode === 'range' ? endDate || undefined : undefined,
        query,
        district,
        subtype,
        guests,
        limit: 24,
      })
    : []

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

      {invalidRange ? (
        <div className="availability-message error">Tanggal selesai harus setelah tanggal mulai.</div>
      ) : null}

      {hasSearch && !invalidRange ? (
        results.length ? (
          <div className="availability-results">
            <div className="availability-results-heading">
              <strong>{results.length} inventory tersedia</strong>
              <span>Availability berasal dari kalender partner VisitGarut.</span>
            </div>
            <div className="availability-result-grid">
              {results.map((item) => (
                <article key={item.inventory_item_id}>
                  <div>
                    <span>{formatSubtype(item.subtype)} · {formatSubtype(item.item_type)}</span>
                    <h3>{item.place_name}</h3>
                    <p>{item.item_name}</p>
                    <small>{item.district || 'Kabupaten Garut'}{item.capacity ? ` · hingga ${item.capacity} orang` : ''}</small>
                  </div>
                  <div className="availability-result-actions">
                    {item.effective_price != null ? <strong>{formatPrice(item.effective_price, item.currency)}{item.price_unit ? ` / ${item.price_unit.replace(/_/g, ' ')}` : ''}</strong> : <strong>Cek harga partner</strong>}
                    <Link href={`/explore/${item.place_slug}`}>Lihat listing</Link>
                    {item.booking_url ? <a href={item.booking_url} target="_blank" rel="noreferrer">Booking partner <ExternalLink size={13} /></a> : null}
                  </div>
                </article>
              ))}
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
