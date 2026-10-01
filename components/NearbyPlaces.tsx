'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BedDouble, Car, Coffee, LocateFixed, MapPin, Mountain, Navigation, Star } from 'lucide-react'

type NearbyPlace = {
  id: string
  name: string
  slug: string
  district: string | null
  rating: number | null
  review_count: number
  cover_image_url: string | null
  latitude: number
  longitude: number
  distance_meters: number
  category_name: string | null
  category_slug: string | null
}

type NearbyResponse = {
  places: NearbyPlace[]
}

type Coords = { latitude: number; longitude: number }

const filters = [
  { label: 'Semua', value: '', icon: MapPin },
  { label: 'Wisata', value: 'wisata', icon: Mountain },
  { label: 'Kuliner', value: 'kuliner', icon: Coffee },
  { label: 'Stay', value: 'penginapan', icon: BedDouble },
  { label: 'Transport', value: 'transportasi', icon: Car },
]

function formatDistance(value: number) {
  if (value < 1000) return `${Math.round(value)} m`
  return `${(value / 1000).toFixed(1)} km`
}

export default function NearbyPlaces() {
  const [places, setPlaces] = useState<NearbyPlace[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('Aktifkan lokasi untuk melihat tempat terdekat.')
  const [coords, setCoords] = useState<Coords | null>(null)
  const [category, setCategory] = useState('')
  const [radius, setRadius] = useState(30000)

  async function loadNearby(currentCoords: Coords, categoryValue = category, radiusValue = radius) {
    setLoading(true)
    setMessage('Mencari tempat di sekitar kamu…')
    try {
      const query = new URLSearchParams({
        lat: String(currentCoords.latitude),
        lng: String(currentCoords.longitude),
        radius: String(radiusValue),
        limit: '20',
      })
      if (categoryValue) query.set('category', categoryValue)
      const response = await fetch(`/api/nearby?${query.toString()}`)
      if (!response.ok) throw new Error('Nearby request failed')
      const data = (await response.json()) as NearbyResponse
      setPlaces(data.places)
      const filterLabel = filters.find((item) => item.value === categoryValue)?.label ?? 'Semua'
      setMessage(data.places.length ? `${data.places.length} ${filterLabel.toLowerCase()} ditemukan dalam radius ${Math.round(radiusValue / 1000)} km.` : 'Belum ada listing sesuai filter di sekitar lokasi ini.')
    } catch {
      setMessage('Belum bisa memuat tempat terdekat. Coba lagi sebentar lagi.')
    } finally {
      setLoading(false)
    }
  }

  function findNearby() {
    if (!navigator.geolocation) {
      setMessage('Browser ini tidak mendukung geolocation.')
      return
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords: browserCoords }) => {
        const nextCoords = { latitude: browserCoords.latitude, longitude: browserCoords.longitude }
        setCoords(nextCoords)
        loadNearby(nextCoords)
      },
      () => {
        setLoading(false)
        setMessage('Izin lokasi tidak diberikan. Kamu tetap bisa menjelajah lewat Explore.')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }

  function changeCategory(value: string) {
    setCategory(value)
    if (coords) loadNearby(coords, value, radius)
  }

  function changeRadius(value: number) {
    setRadius(value)
    if (coords) loadNearby(coords, category, value)
  }

  return (
    <section className="nearby-panel rich-nearby-panel">
      <div className="nearby-heading">
        <div>
          <span className="marketplace-kicker">NEAR ME</span>
          <h2>Temukan yang paling dekat.</h2>
          <p>{message}</p>
        </div>
        <button className="nearby-button" onClick={findNearby} disabled={loading}>
          <LocateFixed size={18} /> {loading ? 'Mencari…' : coords ? 'Perbarui lokasi' : 'Gunakan lokasi saya'}
        </button>
      </div>

      <div className="nearby-controls">
        <div className="nearby-filter-tabs">
          {filters.map(({ label, value, icon: Icon }) => (
            <button key={label} type="button" className={category === value ? 'active' : ''} onClick={() => changeCategory(value)} disabled={loading}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
        <label className="nearby-radius-control">
          <span>Radius</span>
          <select value={radius} onChange={(event) => changeRadius(Number(event.target.value))} disabled={loading}>
            <option value={10000}>10 km</option>
            <option value={20000}>20 km</option>
            <option value={30000}>30 km</option>
            <option value={50000}>50 km</option>
          </select>
        </label>
      </div>

      {places.length ? (
        <div className="nearby-grid">
          {places.map((place) => (
            <Link className="nearby-card" href={`/explore/${place.slug}`} key={place.id}>
              <div className="nearby-card-image" style={{ backgroundImage: place.cover_image_url ? `url(${place.cover_image_url})` : undefined }}>
                {place.category_name ? <span className="nearby-category-badge">{place.category_name}</span> : null}
              </div>
              <div className="nearby-card-copy">
                <span className="nearby-distance"><Navigation size={13} /> {formatDistance(place.distance_meters)}</span>
                <h3>{place.name}</h3>
                <p><MapPin size={13} /> {place.district || 'Garut'}</p>
                <span className="nearby-rating"><Star size={13} fill="currentColor" /> {place.rating?.toFixed(1) ?? '—'}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  )
}
