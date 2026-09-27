'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LocateFixed, MapPin, Navigation, Star } from 'lucide-react'

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
}

type NearbyResponse = {
  places: NearbyPlace[]
}

function formatDistance(value: number) {
  if (value < 1000) return `${Math.round(value)} m`
  return `${(value / 1000).toFixed(1)} km`
}

export default function NearbyPlaces() {
  const [places, setPlaces] = useState<NearbyPlace[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('Aktifkan lokasi untuk melihat destinasi terdekat.')

  function findNearby() {
    if (!navigator.geolocation) {
      setMessage('Browser ini tidak mendukung geolocation.')
      return
    }

    setLoading(true)
    setMessage('Mencari tempat di sekitar kamu…')

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const query = new URLSearchParams({
            lat: String(coords.latitude),
            lng: String(coords.longitude),
            radius: '30000',
            limit: '12',
          })
          const response = await fetch(`/api/nearby?${query.toString()}`)
          if (!response.ok) throw new Error('Nearby request failed')
          const data = (await response.json()) as NearbyResponse
          setPlaces(data.places)
          setMessage(data.places.length ? `${data.places.length} tempat ditemukan dalam radius 30 km.` : 'Belum ada tempat terdaftar di sekitar lokasi ini.')
        } catch {
          setMessage('Belum bisa memuat tempat terdekat. Coba lagi sebentar lagi.')
        } finally {
          setLoading(false)
        }
      },
      () => {
        setLoading(false)
        setMessage('Izin lokasi tidak diberikan. Kamu tetap bisa menjelajah lewat Explore.')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }

  return (
    <section className="nearby-panel">
      <div className="nearby-heading">
        <div>
          <span className="kicker">NEAR ME</span>
          <h2>Temukan tempat terdekat.</h2>
          <p>{message}</p>
        </div>
        <button className="nearby-button" onClick={findNearby} disabled={loading}>
          <LocateFixed size={18} /> {loading ? 'Mencari…' : 'Cari di dekat saya'}
        </button>
      </div>

      {places.length ? (
        <div className="nearby-grid">
          {places.map((place) => (
            <Link className="nearby-card" href={`/explore/${place.slug}`} key={place.id}>
              <div className="nearby-card-image" style={{ backgroundImage: place.cover_image_url ? `url(${place.cover_image_url})` : undefined }} />
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
