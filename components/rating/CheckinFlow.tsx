'use client'
import { useActionState, useState } from 'react'
import { checkinAction, type CheckinState } from '@/app/r/[code]/actions'

export default function CheckinFlow({ code, placeName, hasCoordinates }: { code: string; placeName: string; hasCoordinates: boolean }) {
  const [state, action, pending] = useActionState<CheckinState, FormData>(checkinAction, { step: 'start' })
  const [geo, setGeo] = useState<{ lat: number; lon: number; accuracy: number } | null>(null)
  const [locating, setLocating] = useState(false)

  function locate() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      p => { setGeo({ lat: p.coords.latitude, lon: p.coords.longitude, accuracy: p.coords.accuracy }); setLocating(false) },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    )
  }

  if (state.step === 'done') return <section className="vr-card vr-done" role="status">
    <h2>Selamat menikmati! Check-in tercatat.</h2>
    <p>Dalam 2–24 jam kami kirim undangan menilai {placeName} lewat WhatsApp. Undangan yang sama dikirim ke semua pengunjung yang check-in, puas atau tidak.</p>
  </section>

  return <section className="vr-card">
    {state.message && <p className="vr-message" role="alert">{state.message}</p>}
    {state.step === 'start' && <form action={action} className="vr-form">
      <input type="hidden" name="intent" value="start"/><input type="hidden" name="code" value={code}/>
      {geo && <><input type="hidden" name="lat" value={geo.lat}/><input type="hidden" name="lon" value={geo.lon}/><input type="hidden" name="accuracy" value={geo.accuracy}/></>}
      {hasCoordinates && <div className="vr-geo">
        {geo ? <p>Lokasi HP siap dicocokkan (akurasi ±{Math.round(geo.accuracy)} m).</p> : <p>Izinkan lokasi supaya nilaimu berbobot lebih tinggi. Tanpa lokasi tetap bisa check-in.</p>}
        {!geo && <button type="button" className="vg-button vg-secondary" onClick={locate} disabled={locating}>{locating ? 'Mencari lokasi…' : 'Cocokkan lokasi'}</button>}
      </div>}
      <button className="vg-button" disabled={pending}>{pending ? 'Memproses…' : 'Check-in'}</button>
    </form>}
    {state.step === 'phone' && <form action={action} className="vr-form">
      <input type="hidden" name="intent" value="phone"/><input type="hidden" name="id" value={state.id}/>
      <p>{state.geo ? 'Lokasi cocok.' : 'Lokasi tidak dicocokkan; nilaimu tetap dihitung dengan bobot lebih kecil.'} Satu langkah lagi: satu orang, satu suara.</p>
      <label>Nomor WhatsApp<input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0812…" required/></label>
      <label className="vr-check"><input type="checkbox" name="consent" value="yes" required/> Saya setuju nomor saya dipakai untuk kode verifikasi dan undangan menilai.</label>
      <button className="vg-button" disabled={pending}>{pending ? 'Mengirim…' : 'Kirim kode lewat WhatsApp'}</button>
    </form>}
    {state.step === 'code' && <form action={action} className="vr-form">
      <input type="hidden" name="intent" value="code"/><input type="hidden" name="id" value={state.id}/>
      <label>Kode 6 digit dari WhatsApp<input name="otp" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required/></label>
      <button className="vg-button" disabled={pending}>{pending ? 'Memeriksa…' : 'Verifikasi & check-in'}</button>
    </form>}
  </section>
}
