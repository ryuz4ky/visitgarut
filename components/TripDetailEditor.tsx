'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, ChevronLeft, MapPin, Plus, Save, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Place = {
  id: string
  name: string
  slug: string
  district: string | null
  cover_image_url: string | null
}

type TripItem = {
  id: string
  day_number: number
  position: number
  note: string | null
  place: Place | null
}

type Trip = {
  id: string
  title: string
  trip_start: string | null
  trip_end: string | null
  status: string
}

export default function TripDetailEditor({ trip, items, favoritePlaces }: { trip: Trip; items: TripItem[]; favoritePlaces: Place[] }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [title, setTitle] = useState(trip.title)
  const [start, setStart] = useState(trip.trip_start ?? '')
  const [end, setEnd] = useState(trip.trip_end ?? '')
  const [status, setStatus] = useState(trip.status)
  const [selectedPlace, setSelectedPlace] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const days = useMemo(() => {
    const grouped = new Map<number, TripItem[]>()
    items.forEach((item) => {
      const current = grouped.get(item.day_number) ?? []
      current.push(item)
      grouped.set(item.day_number, current)
    })
    return Array.from(grouped.entries()).sort(([a], [b]) => a - b)
  }, [items])

  const availableFavorites = favoritePlaces.filter((place) => !items.some((item) => item.place?.id === place.id))

  async function saveTrip() {
    setBusy('save')
    setMessage(null)
    const { error } = await supabase
      .from('itineraries')
      .update({ title: title.trim() || trip.title, trip_start: start || null, trip_end: end || null, status })
      .eq('id', trip.id)
    setBusy(null)
    setMessage(error ? error.message : 'Trip berhasil diperbarui.')
    if (!error) router.refresh()
  }

  async function addPlace() {
    if (!selectedPlace) return
    setBusy('add')
    setMessage(null)
    const { error } = await supabase.from('itinerary_items').insert({ itinerary_id: trip.id, place_id: selectedPlace, day_number: 1, position: items.length })
    setBusy(null)
    if (error?.code === '23505') {
      setMessage('Tempat ini sudah ada di itinerary.')
      return
    }
    setMessage(error ? error.message : 'Tempat ditambahkan ke Hari 1.')
    if (!error) {
      setSelectedPlace('')
      router.refresh()
    }
  }

  async function moveItem(itemId: string, day: number) {
    setBusy(itemId)
    const { error } = await supabase.from('itinerary_items').update({ day_number: day }).eq('id', itemId).eq('itinerary_id', trip.id)
    setBusy(null)
    setMessage(error ? error.message : `Tempat dipindahkan ke Hari ${day}.`)
    if (!error) router.refresh()
  }

  async function saveNote(itemId: string, note: string) {
    const { error } = await supabase.from('itinerary_items').update({ note: note || null }).eq('id', itemId).eq('itinerary_id', trip.id)
    if (error) setMessage(error.message)
  }

  async function removeItem(itemId: string) {
    setBusy(itemId)
    const { error } = await supabase.from('itinerary_items').delete().eq('id', itemId).eq('itinerary_id', trip.id)
    setBusy(null)
    setMessage(error ? error.message : 'Tempat dihapus dari itinerary.')
    if (!error) router.refresh()
  }

  return (
    <div className="trip-detail-editor">
      <Link href="/trip" className="trip-detail-back"><ChevronLeft size={16} /> Semua trip</Link>

      <section className="trip-detail-toolbar">
        <div className="trip-detail-title-fields">
          <label><span>Nama trip</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="draft">Draft</option><option value="planned">Planned</option><option value="completed">Completed</option><option value="archived">Archived</option></select></label>
        </div>
        <div className="trip-detail-date-fields">
          <label><span>Mulai</span><input type="date" value={start} onChange={(event) => setStart(event.target.value)} /></label>
          <label><span>Selesai</span><input type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></label>
          <button type="button" onClick={saveTrip} disabled={busy === 'save'}><Save size={17} /> {busy === 'save' ? 'Menyimpan…' : 'Simpan'}</button>
        </div>
      </section>

      {message ? <div className="trip-detail-message">{message}</div> : null}

      <section className="trip-add-place-panel">
        <div><span className="marketplace-kicker">ADD FROM SAVED</span><h2>Tambahkan tempat favorit</h2></div>
        {availableFavorites.length ? (
          <div className="trip-add-place-controls">
            <select value={selectedPlace} onChange={(event) => setSelectedPlace(event.target.value)}>
              <option value="">Pilih tempat tersimpan…</option>
              {availableFavorites.map((place) => <option key={place.id} value={place.id}>{place.name} — {place.district || 'Garut'}</option>)}
            </select>
            <button type="button" onClick={addPlace} disabled={!selectedPlace || busy === 'add'}><Plus size={17} /> Tambah</button>
          </div>
        ) : <p className="trip-no-saved">Semua favorit sudah ada di trip, atau kamu belum menyimpan tempat. <Link href="/explore">Cari tempat</Link>.</p>}
      </section>

      <section className="trip-days-section">
        <div className="trip-days-heading">
          <span className="marketplace-kicker"><CalendarDays size={14} /> DAILY PLAN</span>
          <h2>Susunan perjalanan</h2>
        </div>

        {days.length ? days.map(([day, dayItems]) => (
          <article className="trip-day-block" key={day}>
            <div className="trip-day-label"><strong>Hari {day}</strong><span>{dayItems.length} tempat</span></div>
            <div className="trip-day-items">
              {dayItems.map((item) => item.place ? (
                <div className="trip-day-item" key={item.id}>
                  <Link href={`/explore/${item.place.slug}`} className="trip-day-media">
                    {item.place.cover_image_url ? <Image src={item.place.cover_image_url} alt={item.place.name} fill sizes="100px" /> : null}
                  </Link>
                  <div className="trip-day-copy">
                    <Link href={`/explore/${item.place.slug}`}><h3>{item.place.name}</h3></Link>
                    <p><MapPin size={13} /> {item.place.district || 'Garut'}</p>
                    <input defaultValue={item.note ?? ''} placeholder="Catatan singkat…" onBlur={(event) => saveNote(item.id, event.target.value)} />
                  </div>
                  <div className="trip-day-actions">
                    <select value={item.day_number} onChange={(event) => moveItem(item.id, Number(event.target.value))} disabled={busy === item.id} aria-label={`Pindahkan ${item.place.name} ke hari`}>
                      {[1,2,3,4,5,6,7].map((value) => <option key={value} value={value}>Hari {value}</option>)}
                    </select>
                    <button type="button" onClick={() => removeItem(item.id)} disabled={busy === item.id} aria-label={`Hapus ${item.place.name}`}><Trash2 size={16} /></button>
                  </div>
                </div>
              ) : null)}
            </div>
          </article>
        )) : (
          <div className="trip-empty-itinerary">
            <MapPin size={30} />
            <h3>Itinerary masih kosong.</h3>
            <p>Simpan tempat dari Explore lalu tambahkan ke trip ini.</p>
            <Link href="/explore">Jelajahi tempat</Link>
          </div>
        )}
      </section>
    </div>
  )
}
