'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BriefcaseBusiness, CalendarDays, Check, ChevronRight, Heart, MapPin, Plus, Route, Save, Trash2, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  full_name: string | null
  username: string | null
  avatar_url: string | null
}

type FavoritePlace = {
  id: string
  name: string
  slug: string
  district: string | null
  cover_image_url: string | null
  rating: number | null
}

type Favorite = {
  created_at: string
  place: FavoritePlace | null
}

type Itinerary = {
  id: string
  title: string
  trip_start: string | null
  trip_end: string | null
  status: string
  updated_at: string
  item_count: number
}

type Claim = {
  id: string
  status: string
  created_at: string
  place: { name: string; slug: string } | null
}

type AccountDashboardProps = {
  userId: string
  email: string
  profile: Profile | null
  favorites: Favorite[]
  itineraries: Itinerary[]
  claims: Claim[]
}

export default function AccountDashboard({ userId, email, profile, favorites, itineraries, claims }: AccountDashboardProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [username, setUsername] = useState(profile?.username ?? '')
  const [tripTitle, setTripTitle] = useState('Weekend di Garut')
  const [busy, setBusy] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  async function updateProfile() {
    setBusy('profile')
    setFeedback(null)
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: fullName || null,
      username: username || null,
      updated_at: new Date().toISOString(),
    })
    setBusy(null)
    setFeedback(error ? error.message : 'Profil berhasil diperbarui.')
    if (!error) router.refresh()
  }

  async function removeFavorite(placeId: string) {
    setBusy(`favorite-${placeId}`)
    setFeedback(null)
    const { error } = await supabase.from('favorites').delete().eq('user_id', userId).eq('place_id', placeId)
    setBusy(null)
    setFeedback(error ? error.message : 'Tempat dihapus dari favorit.')
    if (!error) router.refresh()
  }

  async function createTrip() {
    if (!tripTitle.trim()) return
    setBusy('create-trip')
    setFeedback(null)
    const { error } = await supabase.from('itineraries').insert({ user_id: userId, title: tripTitle.trim() })
    setBusy(null)
    setFeedback(error ? error.message : 'Trip baru berhasil dibuat.')
    if (!error) {
      setTripTitle('Trip Garut Baru')
      router.refresh()
    }
  }

  async function addToTrip(itineraryId: string, placeId: string) {
    setBusy(`add-${itineraryId}-${placeId}`)
    setFeedback(null)
    const { error } = await supabase.from('itinerary_items').insert({ itinerary_id: itineraryId, place_id: placeId })
    setBusy(null)
    if (error?.code === '23505') {
      setFeedback('Tempat itu sudah ada di itinerary tersebut.')
      return
    }
    setFeedback(error ? error.message : 'Tempat ditambahkan ke itinerary.')
    if (!error) router.refresh()
  }

  return (
    <div className="account-dashboard">
      <section className="account-overview-card">
        <div className="account-avatar"><UserRound size={28} /></div>
        <div>
          <span className="marketplace-kicker">MY VISITGARUT</span>
          <h1>{profile?.full_name || profile?.username || 'Traveler Garut'}</h1>
          <p>{email}</p>
        </div>
        <form action="/auth/signout" method="post">
          <button className="account-secondary-button" type="submit">Keluar</button>
        </form>
      </section>

      {feedback ? <div className="account-feedback"><Check size={16} /> {feedback}</div> : null}

      <div className="account-grid">
        <section className="account-panel">
          <div className="account-panel-heading">
            <div><UserRound size={20} /><span>Profil</span></div>
            <p>Identitas sederhana untuk akun VisitGarut.</p>
          </div>
          <div className="account-form-grid">
            <label>
              <span>Nama lengkap</span>
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nama kamu" />
            </label>
            <label>
              <span>Username</span>
              <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="username" />
            </label>
          </div>
          <button className="account-primary-button" type="button" onClick={updateProfile} disabled={busy === 'profile'}>
            <Save size={17} /> {busy === 'profile' ? 'Menyimpan…' : 'Simpan profil'}
          </button>
        </section>

        <section className="account-panel">
          <div className="account-panel-heading">
            <div><Route size={20} /><span>Buat trip baru</span></div>
            <p>Mulai itinerary lalu isi dari tempat yang kamu simpan.</p>
          </div>
          <div className="account-trip-create">
            <input value={tripTitle} onChange={(event) => setTripTitle(event.target.value)} placeholder="Nama trip" />
            <button type="button" onClick={createTrip} disabled={busy === 'create-trip'}><Plus size={17} /> Buat</button>
          </div>
          <Link className="account-inline-link" href="/trip">Buka Trip Planner <ChevronRight size={15} /></Link>
        </section>
      </div>

      <section className="account-section">
        <div className="account-section-heading">
          <div>
            <span className="marketplace-kicker">SAVED PLACES</span>
            <h2>Tempat favorit</h2>
            <p>{favorites.length} tempat tersimpan untuk perjalananmu.</p>
          </div>
          <Link href="/explore">Cari tempat baru <ChevronRight size={16} /></Link>
        </div>

        {favorites.length ? (
          <div className="account-favorites-grid">
            {favorites.map(({ place }) => place ? (
              <article className="account-favorite-card" key={place.id}>
                <Link href={`/explore/${place.slug}`} className="account-favorite-media">
                  {place.cover_image_url ? <Image src={place.cover_image_url} alt={place.name} fill sizes="(max-width: 720px) 90vw, 30vw" /> : null}
                </Link>
                <div className="account-favorite-copy">
                  <div>
                    <h3>{place.name}</h3>
                    <p><MapPin size={14} /> {place.district || 'Garut'}</p>
                  </div>
                  <div className="account-favorite-actions">
                    {itineraries.length ? (
                      <select
                        defaultValue=""
                        onChange={(event) => {
                          if (event.target.value) addToTrip(event.target.value, place.id)
                          event.currentTarget.value = ''
                        }}
                        aria-label={`Tambahkan ${place.name} ke trip`}
                      >
                        <option value="">+ Tambah ke trip</option>
                        {itineraries.map((trip) => <option key={trip.id} value={trip.id}>{trip.title}</option>)}
                      </select>
                    ) : <Link href="/trip">Buat trip</Link>}
                    <button type="button" onClick={() => removeFavorite(place.id)} disabled={busy === `favorite-${place.id}`} aria-label={`Hapus ${place.name} dari favorit`}><Trash2 size={16} /></button>
                  </div>
                </div>
              </article>
            ) : null)}
          </div>
        ) : (
          <div className="account-empty-state">
            <Heart size={28} />
            <h3>Belum ada tempat tersimpan.</h3>
            <p>Simpan destinasi yang menarik supaya mudah dimasukkan ke itinerary.</p>
            <Link href="/explore">Jelajahi Garut</Link>
          </div>
        )}
      </section>

      <section className="account-section">
        <div className="account-section-heading">
          <div>
            <span className="marketplace-kicker">MY TRIPS</span>
            <h2>Itinerary kamu</h2>
            <p>Trip yang sudah kamu buat akan tersimpan di sini.</p>
          </div>
        </div>
        {itineraries.length ? (
          <div className="account-trip-grid">
            {itineraries.map((trip) => (
              <Link href={`/trip/${trip.id}`} className="account-trip-card" key={trip.id}>
                <div><CalendarDays size={22} /></div>
                <span>{trip.status}</span>
                <h3>{trip.title}</h3>
                <p>{trip.item_count} tempat · {trip.trip_start ? trip.trip_start : 'Tanggal fleksibel'}</p>
                <strong>Buka itinerary <ChevronRight size={15} /></strong>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className="account-section">
        <div className="account-section-heading">
          <div>
            <span className="marketplace-kicker">BUSINESS</span>
            <h2>Claim bisnis</h2>
            <p>Pantau permintaan claim listing yang pernah kamu ajukan.</p>
          </div>
        </div>
        {claims.length ? (
          <div className="account-claim-list">
            {claims.map((claim) => (
              <Link key={claim.id} href={claim.place ? `/explore/${claim.place.slug}` : '/account'}>
                <BriefcaseBusiness size={18} />
                <div><strong>{claim.place?.name || 'Listing VisitGarut'}</strong><span>Diajukan {new Date(claim.created_at).toLocaleDateString('id-ID')}</span></div>
                <em className={`claim-status ${claim.status}`}>{claim.status}</em>
              </Link>
            ))}
          </div>
        ) : (
          <div className="account-empty-state compact">
            <BriefcaseBusiness size={26} />
            <h3>Belum ada claim bisnis.</h3>
            <p>Jika kamu pemilik listing di VisitGarut, claim bisnis dari halaman detail tempat.</p>
          </div>
        )}
      </section>
    </div>
  )
}
