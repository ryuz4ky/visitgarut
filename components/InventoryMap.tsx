'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl'
import { BadgeCheck, BedDouble, Car, MapPin, Mountain, Store, Utensils } from 'lucide-react'

type MapPlace = {
  id: string
  name: string
  slug: string
  district: string | null
  latitude: number
  longitude: number
  category_name: string | null
  category_slug: string | null
  subtype: string | null
  is_verified: boolean
  price_label: string | null
}

type InventoryMapProps = {
  places: MapPlace[]
}

const categoryOptions = [
  { label: 'Semua', value: '', icon: MapPin },
  { label: 'Wisata', value: 'wisata', icon: Mountain },
  { label: 'Stay', value: 'penginapan', icon: BedDouble },
  { label: 'Kuliner', value: 'kuliner', icon: Utensils },
  { label: 'Transport', value: 'transportasi', icon: Car },
  { label: 'Bisnis', value: 'bisnis-lokal', icon: Store },
]

function markerLabel(slug: string | null) {
  if (slug === 'wisata') return '⛰'
  if (slug === 'penginapan') return '⌂'
  if (slug === 'kuliner') return '☕'
  if (slug === 'transportasi') return '↗'
  return '•'
}

export default function InventoryMap({ places }: InventoryMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<MapLibreMarker[]>([])
  const [mapReady, setMapReady] = useState(false)
  const [category, setCategory] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filteredPlaces = useMemo(
    () => places.filter((place) => (!category || place.category_slug === category) && (!verifiedOnly || place.is_verified)),
    [places, category, verifiedOnly]
  )
  const selected = filteredPlaces.find((place) => place.id === selectedId) ?? filteredPlaces[0] ?? null

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false

    import('maplibre-gl').then(({ Map, NavigationControl }) => {
      if (cancelled || !containerRef.current) return
      const map = new Map({
        container: containerRef.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [107.9, -7.22],
        zoom: 9.3,
        attributionControl: true,
      })
      map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right')
      map.on('load', () => setMapReady(true))
      mapRef.current = map
    })

    return () => {
      cancelled = true
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    let disposed = false

    import('maplibre-gl').then(({ Marker, LngLatBounds }) => {
      if (disposed || !mapRef.current) return
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      const bounds = new LngLatBounds()
      filteredPlaces.forEach((place) => {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = `inventory-map-marker${place.is_verified ? ' verified' : ''}`
        button.textContent = markerLabel(place.category_slug)
        button.setAttribute('aria-label', `Buka ${place.name}`)
        button.addEventListener('click', () => setSelectedId(place.id))

        const marker = new Marker({ element: button, anchor: 'bottom' })
          .setLngLat([place.longitude, place.latitude])
          .addTo(mapRef.current!)
        markersRef.current.push(marker)
        bounds.extend([place.longitude, place.latitude])
      })

      if (filteredPlaces.length === 1) {
        mapRef.current.flyTo({ center: [filteredPlaces[0].longitude, filteredPlaces[0].latitude], zoom: 13 })
      } else if (filteredPlaces.length > 1 && !bounds.isEmpty()) {
        mapRef.current.fitBounds(bounds, { padding: 72, maxZoom: 12, duration: 650 })
      }
    })

    return () => {
      disposed = true
    }
  }, [filteredPlaces, mapReady])

  useEffect(() => {
    if (!selected || !mapRef.current || !mapReady) return
    mapRef.current.easeTo({
      center: [selected.longitude, selected.latitude],
      zoom: Math.max(mapRef.current.getZoom(), 11),
      duration: 450,
    })
  }, [selected, mapReady])

  return (
    <section className="inventory-map-shell">
      <div className="inventory-map-toolbar">
        <div>
          <span className="marketplace-kicker">LIVE MAP INVENTORY</span>
          <h2>Jelajahi listing berdasarkan lokasi.</h2>
          <p>{filteredPlaces.length} listing dengan koordinat tersedia pada filter ini.</p>
        </div>
        <label className="inventory-verified-toggle">
          <input type="checkbox" checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} />
          <BadgeCheck size={16} /> Verified only
        </label>
      </div>

      <div className="inventory-map-tabs">
        {categoryOptions.map(({ label, value, icon: Icon }) => (
          <button key={label} type="button" className={category === value ? 'active' : ''} onClick={() => setCategory(value)}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="inventory-map-layout">
        <div className="inventory-map-canvas" ref={containerRef} />
        <aside className="inventory-map-results">
          {filteredPlaces.length ? filteredPlaces.map((place) => (
            <button key={place.id} type="button" className={selected?.id === place.id ? 'active' : ''} onClick={() => setSelectedId(place.id)}>
              <div className="inventory-map-result-head">
                <span>{place.subtype || place.category_name || 'Listing'}</span>
                {place.is_verified ? <BadgeCheck size={15} /> : null}
              </div>
              <strong>{place.name}</strong>
              <small><MapPin size={12} /> {place.district || 'Garut'}</small>
              {place.price_label ? <em>{place.price_label}</em> : null}
            </button>
          )) : <p className="inventory-map-empty">Belum ada listing berkoordinat untuk filter ini.</p>}
        </aside>
      </div>

      {selected ? (
        <div className="inventory-map-selected">
          <div>
            <span>{selected.category_name || 'VisitGarut'} · {selected.subtype || 'Local listing'}</span>
            <strong>{selected.name}</strong>
            <small>{selected.district || 'Kabupaten Garut'}</small>
          </div>
          <Link href={`/explore/${selected.slug}`}>Lihat detail</Link>
        </div>
      ) : null}
    </section>
  )
}
