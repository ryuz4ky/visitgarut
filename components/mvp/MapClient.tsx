'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { categories } from '@/lib/mvp/categories'
import { hasCoordinates, nearestPlaces } from '@/lib/mvp/nearby'

type Pin = { id: number; name: string; category: string; slug: string; district: string; latitude: number | null; longitude: number | null; canPlan: boolean }
type Origin = { latitude: number; longitude: number; label: string; id?: number }
export default function MapClient({ items, initialCategory = '', initialPlace }: { items: Pin[]; initialCategory?: string; initialPlace?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const map = useRef<LeafletMap | null>(null)
  const request = useRef(0)
  const [category, setCategory] = useState(initialCategory)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [locating, setLocating] = useState(false)
  const [selected, setSelected] = useState<number | null>(initialPlace || null)
  const [radius, setRadius] = useState(50)
  const [origin, setOrigin] = useState<Origin | null>(() => {
    const p = items.find(x => x.id === initialPlace)
    return p && hasCoordinates(p) ? { latitude: p.latitude, longitude: p.longitude, label: p.name, id: p.id } : null
  })
  const shown = useMemo(() => items.filter(p => (!category || p.category === category) && (p.name + ' ' + p.district).toLocaleLowerCase('id-ID').includes(query.trim().toLocaleLowerCase('id-ID'))), [items, category, query])
  const listed = useMemo(() => origin ? nearestPlaces(shown, origin, radius) : shown.map(p => ({ ...p, distanceKm: null })), [shown, origin, radius])
  const mapped = items.filter(hasCoordinates)
  const pinned = shown.filter(hasCoordinates).length

  useEffect(() => () => { request.current++ }, [])
  useEffect(() => {
    let disposed = false
    import('leaflet').then(L => {
      if (disposed || !ref.current) return
      const m = L.map(ref.current).setView([-7.23, 107.90], 10)
      map.current = m
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19 }).on('tileerror', () => { if (!disposed) setError('Sebagian peta tidak dapat dimuat. Daftar tempat tetap tersedia.') }).addTo(m)
      const points: [number, number][] = []
      listed.forEach(p => {
        if (!hasCoordinates(p)) return
        points.push([p.latitude, p.longitude])
        const link = document.createElement('a')
        link.href = `/${p.category}/${p.slug}`
        link.textContent = p.name
        L.circleMarker([p.latitude, p.longitude], { radius: 9, color: '#fff', weight: 3, fillColor: '#0e1311', fillOpacity: 1 }).bindPopup(link).on('click', () => setSelected(p.id)).addTo(m)
      })
      if (origin) {
        points.push([origin.latitude, origin.longitude])
        L.circleMarker([origin.latitude, origin.longitude], { radius: 7, color: '#1263c7', fillOpacity: 1 }).bindTooltip(origin.label).addTo(m)
      }
      if (points.length) m.fitBounds(points, { padding: [40, 40], maxZoom: points.length === 1 ? 14 : 12 })
      m.invalidateSize()
    }).catch(() => { if (!disposed) setError('Peta tidak dapat dimuat. Pilih tempat melalui daftar.') })
    return () => { disposed = true; map.current?.remove(); map.current = null }
  }, [listed, origin])

  function locate() {
    if (!navigator.geolocation) { setError('Browser ini tidak mendukung lokasi. Pilih titik awal dari daftar.'); return }
    const token = ++request.current
    setLocating(true); setError('')
    navigator.geolocation.getCurrentPosition(pos => {
      if (token !== request.current) return
      setOrigin({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, label: 'Lokasimu' })
      setSelected(null); setLocating(false)
    }, () => {
      if (token !== request.current) return
      setError('Lokasi tidak tersedia. Kamu tetap dapat memilih titik awal dari daftar.'); setLocating(false)
    }, { timeout: 10000, maximumAge: 60000 })
  }
  function changeOrigin(value: string) {
    request.current++; setLocating(false); setError('')
    const p = items.find(x => x.id === Number(value))
    setOrigin(p && hasCoordinates(p) ? { latitude: p.latitude, longitude: p.longitude, label: p.name, id: p.id } : null)
    setSelected(p?.id || null)
  }
  return <>
    <nav className="vg-map-interests" aria-label="Jelajahi peta berdasarkan minat"><button aria-pressed={!category} onClick={() => { setCategory(''); setSelected(null) }}>Semua tempat</button>{categories.filter(c => items.some(p => p.category === c.slug)).map(c => <button key={c.slug} aria-pressed={category === c.slug} onClick={() => { setCategory(c.slug); setSelected(null) }}>{c.shortName}</button>)}</nav>
    <div className="vg-map-controls vg-nearby-controls"><label>Urutkan jarak dari<select value={origin?.id || (origin ? 'device' : '')} onChange={e => changeOrigin(e.target.value)}><option value="">Tanpa urutan jarak</option>{origin && !origin.id && <option value="device">Lokasimu</option>}{mapped.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Radius<select disabled={!origin} value={radius} onChange={e => setRadius(Number(e.target.value))}>{[5, 10, 25, 50].map(n => <option key={n} value={n}>{n} km</option>)}</select></label><button className="vg-button" onClick={locate} disabled={locating}>{locating ? 'Mencari lokasi…' : 'Cari dekat saya'}</button>{origin && <button className="vg-map-reset" onClick={() => changeOrigin('')}>Tampilkan seluruh daftar</button>}</div>
    <p className="vg-nearby-note">Lokasi diminta setelah kamu memilih “Cari dekat saya”. Perhitungan jarak dilakukan di browser; koordinat perangkat tidak dikirim ke server VisitGarut. Peta menggunakan OpenStreetMap.</p>
    {error && <p role="status" className="vg-alert">{error}</p>}
    <p className="vg-count" role="status">{origin ? `${listed.length} tempat dalam ${radius} km dari ${origin.label}. Jarak garis lurus, bukan jarak atau waktu perjalanan di jalan.` : `${pinned} tempat memiliki titik peta · ${shown.length - pinned} tempat tersedia melalui daftar.`}</p>
    {origin && shown.length > pinned && <p className="vg-count">{shown.length - pinned} tempat tanpa koordinat belum dapat diurutkan berdasarkan jarak. Pilih “Tampilkan seluruh daftar” untuk membacanya.</p>}
    <div className="vg-map-layout"><div className="vg-map-canvas" ref={ref} aria-label="Peta interaktif Garut"/><div><label className="vg-map-search">Cari di daftar<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Nama tempat atau wilayah…" maxLength={120}/></label><div className="vg-map-list">{listed.map(p => <div className={selected === p.id ? 'selected' : ''} key={p.id}><button aria-pressed={selected === p.id} onClick={() => { setSelected(p.id); if (hasCoordinates(p)) map.current?.setView([p.latitude, p.longitude], 14) }} disabled={!hasCoordinates(p)}>{p.name}</button>{!hasCoordinates(p) && <small>Titik peta belum tersedia</small>}<small>{p.district}{p.distanceKm !== null ? ` · ${p.distanceKm.toLocaleString('id-ID', { maximumFractionDigits: 1 })} km garis lurus` : ''}</small><Link href={`/${p.category}/${p.slug}`}>Lihat detail</Link>{p.canPlan && <Link href={`/trip?start=${p.id}`}>Mulai itinerary dari sini ↗</Link>}</div>)}{!listed.length && <p role="status">Tidak ada tempat yang sesuai. Ubah kategori, pencarian, radius, atau titik awal.</p>}</div></div></div>
  </>
}
