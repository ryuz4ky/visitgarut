'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, ChevronRight, MapPin, Plus, Route, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Trip = {
  id: string
  title: string
  trip_start: string | null
  trip_end: string | null
  status: string
  item_count: number
}

type SelectedPlace = {
  id: string
  name: string
  slug: string
  district: string | null
} | null

export default function TripPlannerClient({ userId, trips, selectedPlace }: { userId: string; trips: Trip[]; selectedPlace: SelectedPlace }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [title, setTitle] = useState(selectedPlace ? `Trip ke ${selectedPlace.name}` : 'Weekend di Garut')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [selectedTrip, setSelectedTrip] = useState(trips[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function createTrip() {
    if (!title.trim()) return
    setLoading(true)
    setMessage(null)
    const { data, error } = await supabase
      .from('itineraries')
      .insert({
        user_id: userId,
        title: title.trim(),
        trip_start: start || null,
        trip_end: end || null,
      })
      .select('id')
      .single()

    if (!error && data?.id && selectedPlace) {
      await supabase.from('itinerary_items').insert({ itinerary_id: data.id, place_id: selectedPlace.id, day_number: 1, position: 0 })
    }

    setLoading(false)
    if (error) {
      setMessage(error.message)
      return
    }
    router.push(`/trip/${data.id}`)
    router.refresh()
  }

  async function addSelectedPlace() {
    if (!selectedPlace || !selectedTrip) return
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.from('itinerary_items').insert({ itinerary_id: selectedTrip, place_id: selectedPlace.id })
    setLoading(false)
    if (error?.code === '23505') {
      setMessage('Tempat ini sudah ada di trip tersebut.')
      return
    }
    if (error) {
      setMessage(error.message)
      return
    }
    router.push(`/trip/${selectedTrip}`)
    router.refresh()
  }

  return (
    <div className="trip-app-grid">
      <section className="trip-create-card">
        <span className="marketplace-kicker"><Sparkles size={14} /> NEW TRIP</span>
        <h2>Buat itinerary baru</h2>
        <p>Mulai dengan nama dan tanggal. Tempat bisa ditambahkan dari Explore atau daftar favorit.</p>
        <label><span>Nama trip</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <div className="trip-date-grid">
          <label><span>Mulai</span><input type="date" value={start} onChange={(event) => setStart(event.target.value)} /></label>
          <label><span>Selesai</span><input type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></label>
        </div>
        {selectedPlace ? <div className="trip-selected-place"><MapPin size={17} /><div><strong>{selectedPlace.name}</strong><span>{selectedPlace.district || 'Garut'} akan dimasukkan ke Hari 1.</span></div></div> : null}
        {message ? <p className="trip-message">{message}</p> : null}
        <button type="button" onClick={createTrip} disabled={loading}><Plus size={17} /> {loading ? 'Menyimpan…' : 'Buat trip'}</button>
      </section>

      <section className="trip-existing-card">
        <span className="marketplace-kicker">MY TRIPS</span>
        <h2>Trip tersimpan</h2>
        {trips.length ? (
          <div className="trip-existing-list">
            {trips.map((trip) => (
              <Link key={trip.id} href={`/trip/${trip.id}`}>
                <div className="trip-existing-icon"><Route size={19} /></div>
                <div><strong>{trip.title}</strong><span>{trip.item_count} tempat · {trip.trip_start || 'Tanggal fleksibel'}</span></div>
                <ChevronRight size={17} />
              </Link>
            ))}
          </div>
        ) : <p className="trip-empty-copy">Belum ada trip tersimpan. Buat itinerary pertamamu dari panel di sebelah.</p>}

        {selectedPlace && trips.length ? (
          <div className="trip-quick-add">
            <span>Tambahkan <strong>{selectedPlace.name}</strong> ke trip yang sudah ada:</span>
            <select value={selectedTrip} onChange={(event) => setSelectedTrip(event.target.value)}>
              {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.title}</option>)}
            </select>
            <button type="button" onClick={addSelectedPlace} disabled={loading}><MapPin size={16} /> Tambahkan</button>
          </div>
        ) : null}
      </section>
    </div>
  )
}
