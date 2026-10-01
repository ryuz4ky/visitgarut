'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
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

type InventoryMapProps = { places: MapPlace[] }
type MapInstance = {
  addControl: (control: unknown, position?: string) => void
  on: (event: string, callback: () => void) => void
  remove: () => void
  flyTo: (options: { center: [number, number]; zoom: number }) => void
  fitBounds: (bounds: BoundsInstance, options: { padding: number; maxZoom: number; duration: number }) => void
  easeTo: (options: { center: [number, number]; zoom: number; duration: number }) => void
  getZoom: () => number
}
type MarkerInstance = {
  setLngLat: (coordinates: [number, number]) => MarkerInstance
  addTo: (map: MapInstance) => MarkerInstance
  remove: () => void
}
type BoundsInstance = {
  extend: (coordinates: [number, number]) => BoundsInstance
  isEmpty: () => boolean
}
type MapLibreGlobal = {
  Map: new (options: { container: HTMLElement; style: string; center: [number, number]; zoom: number }) => MapInstance
  NavigationControl: new (options: { visualizePitch: boolean }) => unknown
  Marker: new (options: { element: HTMLElement; anchor: string }) => MarkerInstance
  LngLatBounds: new () => BoundsInstance
}

declare global {
  interface Window {
    maplibregl?: MapLibreGlobal
  }
}

const MAPLIBRE_VERSION = '5.24.0'
let mapLibrePromise: Promise<MapLibreGlobal> | null = null

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

function loadMapLibre() {
  if (window.maplibregl) return Promise.resolve(window.maplibregl)
  if (mapLibrePromise) return mapLibrePromise

  mapLibrePromise = new Promise<MapLibreGlobal>((resolve, reject) => {
    const cssId = 'visitgarut-maplibre-css'
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link')
      link.id = cssId
      link.rel = 'stylesheet'
      link.href = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.css`
      document.head.appendChild(link)
    }

    const finish = () => {
      if (window.maplibregl) resolve(window.maplibregl)
      else reject(new Error('MapLibre did not initialize'))
    }

    const existing = document.getElementById('visitgarut-maplibre-js') as HTMLScriptElement | null
    if (existing) {
      if (window.maplibregl) finish()
      else {
        existing.addEventListener('load', finish, { once: true })
        existing.addEventListener('error', () => reject(new Error('MapLibre failed to load')), { once: true })
      }
      return
    }

    const script = document.createElement('script')
    script.id = 'visitgarut-maplibre-js'
    script.src = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.js`
    script.async = true
    script.addEventListener('load', finish, { once: true })
    script.addEventListener('error', () => reject(new Error('MapLibre failed to load')), { once: true })
    document.head.appendChild(script)
  })

  return mapLibrePromise
}

export default function InventoryMap({ places }: InventoryMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapInstance | null>(null)
  const markersRef = useRef<MarkerInstance[]>([])
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(false)
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

    loadMapLibre()
      .then(({ Map, NavigationControl }) => {
        if (cancelled || !containerRef.current) return
        const map = new Map({
          container: containerRef.current,
          style: 'https://tiles.openfreemap.org/styles/liberty',
          center: [107.9, -7.22],
          zoom: 9.3,
        })
        map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right')
        map.on('load', () => setMapReady(true))
        mapRef.current = map
      })
      .catch(() => setMapError(true))

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

    loadMapLibre().then(({ Marker, LngLatBounds }) => {
      const map = mapRef.current
      if (disposed || !map) return
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
          .addTo(map)
        markersRef.current.push(marker)
        bounds.extend([place.longitude, place.latitude])
      })

      if (filteredPlaces.length === 1) {
        map.flyTo({ center: [filteredPlaces[0].longitude, filteredPlaces[0].latitude], zoom: 13 })
      } else if (filteredPlaces.length > 1 && !bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 72, maxZoom: 12, duration: 650 })
      }
    }).catch(() => setMapError(true))

    return () => { disposed = true }
  }, [filteredPlaces, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!selected || !map || !mapReady) return
    map.easeTo({ center: [selected.longitude, selected.latitude], zoom: Math.max(map.getZoom(), 11), duration: 450 })
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
        <div className="inventory-map-canvas" ref={containerRef}>{mapError ? <p className="inventory-map-empty">Map belum bisa dimuat. Gunakan daftar lokasi di samping atau Near Me.</p> : null}</div>
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
