'use client'

import { useMemo, useState } from 'react'
import {
  BedDouble,
  CalendarDays,
  Car,
  Coffee,
  MapPin,
  Mountain,
  Search,
  Users,
} from 'lucide-react'

type TabId = 'explore' | 'stay' | 'transport' | 'eat' | 'events'

const tabs: Array<{ id: TabId; label: string; icon: typeof Mountain }> = [
  { id: 'explore', label: 'Wisata', icon: Mountain },
  { id: 'stay', label: 'Stay', icon: BedDouble },
  { id: 'transport', label: 'Transport', icon: Car },
  { id: 'eat', label: 'Kuliner', icon: Coffee },
  { id: 'events', label: 'Event', icon: CalendarDays },
]

export default function TravelSearch() {
  const [activeTab, setActiveTab] = useState<TabId>('explore')

  const config = useMemo(() => {
    switch (activeTab) {
      case 'stay':
        return {
          action: '/stay',
          placeholder: 'Area, hotel, villa, atau homestay',
          button: 'Cari penginapan',
        }
      case 'transport':
        return {
          action: '/transport',
          placeholder: 'Rental mobil, motor, travel, atau area jemput',
          button: 'Cari transportasi',
        }
      case 'eat':
        return {
          action: '/eat',
          placeholder: 'Cafe, restoran, makanan khas, atau oleh-oleh',
          button: 'Cari kuliner',
        }
      case 'events':
        return {
          action: '/events',
          placeholder: 'Cari event, aktivitas, atau tanggal kunjungan',
          button: 'Cari event',
        }
      default:
        return {
          action: '/explore',
          placeholder: 'Destinasi, kecamatan, atau aktivitas',
          button: 'Jelajahi Garut',
        }
    }
  }, [activeTab])

  return (
    <div className="travel-search-card">
      <div className="travel-search-tabs" role="tablist" aria-label="Cari kebutuhan perjalanan">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            className={activeTab === id ? 'active' : ''}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <form className="travel-search-form" action={config.action}>
        <input type="hidden" name="type" value={activeTab} />

        <label className="search-field search-field-main">
          <span>Tujuan / kebutuhan</span>
          <div>
            <MapPin size={19} />
            <input name="q" placeholder={config.placeholder} aria-label={config.placeholder} />
          </div>
        </label>

        {(activeTab === 'stay' || activeTab === 'events') && (
          <label className="search-field search-field-date">
            <span>{activeTab === 'stay' ? 'Check-in' : 'Tanggal'}</span>
            <div>
              <CalendarDays size={18} />
              <input type="date" name="date" aria-label="Tanggal" />
            </div>
          </label>
        )}

        {activeTab === 'stay' && (
          <label className="search-field search-field-guests">
            <span>Tamu</span>
            <div>
              <Users size={18} />
              <select name="guests" defaultValue="2" aria-label="Jumlah tamu">
                <option value="1">1 tamu</option>
                <option value="2">2 tamu</option>
                <option value="3">3 tamu</option>
                <option value="4">4 tamu</option>
                <option value="5">5+ tamu</option>
              </select>
            </div>
          </label>
        )}

        {activeTab === 'transport' && (
          <label className="search-field search-field-guests">
            <span>Jenis</span>
            <div>
              <Car size={18} />
              <select name="vehicle" defaultValue="car" aria-label="Jenis transportasi">
                <option value="car">Rental mobil</option>
                <option value="motorbike">Rental motor</option>
                <option value="travel">Travel</option>
                <option value="driver">Mobil + driver</option>
              </select>
            </div>
          </label>
        )}

        <button className="travel-search-submit" type="submit">
          <Search size={19} />
          <span>{config.button}</span>
        </button>
      </form>

      <div className="travel-search-suggestions">
        <strong>Populer:</strong>
        <a href="/explore?q=Papandayan">Papandayan</a>
        <a href="/explore?q=Cipanas">Cipanas</a>
        <a href="/explore?q=Darajat">Darajat</a>
        <a href="/explore?q=Bagendit">Situ Bagendit</a>
      </div>
    </div>
  )
}
