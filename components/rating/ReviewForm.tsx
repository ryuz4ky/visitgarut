'use client'
import { useActionState } from 'react'
import { submitReviewAction, withdrawAction, type ReviewState } from '@/app/nilai/[token]/actions'

const initial: ReviewState = { ok: false, message: '' }
const parties = [['sendiri', 'Sendiri'], ['teman', 'Teman'], ['keluarga', 'Keluarga'], ['rombongan', 'Rombongan'], ['kerja', 'Urusan kerja']] as const

export default function ReviewForm({ token, placeName, aspects, withdrawOnly = false }: { token: string; placeName: string; sectorLabel: string; aspects: readonly { key: string; label: string }[]; withdrawOnly?: boolean }) {
  const [state, submit, pending] = useActionState(submitReviewAction, initial)
  const [wState, withdraw, wPending] = useActionState(withdrawAction, initial)
  const withdrawForm = <form action={withdraw} className="vr-withdraw"><input type="hidden" name="token" value={token}/><button className="vg-button vg-secondary" disabled={wPending}>Tarik nilaiku</button>{wState.message && <p role="status">{wState.message}</p>}</form>
  if (withdrawOnly) return withdrawForm
  if (state.ok) return <section className="vr-card vr-done" role="status"><h2>Nilaimu sudah masuk</h2><p>{state.message}</p>{withdrawForm}</section>
  return <form action={submit} className="vr-card vr-form">
    <input type="hidden" name="token" value={token}/>
    <fieldset className="vr-scale"><legend>Secara umum, berapa nilainya?</legend>
      {[1, 2, 3, 4, 5].map(v => <label key={v}><input type="radio" name="overall" value={v} required/><span>{v}</span></label>)}
      <small>1 kecewa · 5 mantap</small>
    </fieldset>
    <fieldset className="vr-aspect-form"><legend>Lebih rinci (lewati yang tidak kamu tahu)</legend>
      {aspects.map(a => <div key={a.key} className="vr-aspect-row"><span>{a.label}</span><div>
        <label><input type="radio" name={'aspect_' + a.key} value="-" defaultChecked/><span>–</span></label>
        {[1, 2, 3, 4, 5].map(v => <label key={v}><input type="radio" name={'aspect_' + a.key} value={v}/><span>{v}</span></label>)}
      </div></div>)}
    </fieldset>
    <label>Datang bersama<select name="party" required defaultValue=""><option value="" disabled>Pilih</option>{parties.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
    <label>Cerita singkat (opsional)<textarea name="body" maxLength={1500} rows={4} placeholder={`Apa yang perlu diketahui pengunjung berikutnya tentang ${placeName}?`}/></label>
    <label>Nama tampilan (opsional)<input name="display_name" maxLength={40} placeholder="mis. R. A."/></label>
    <label className="vr-check"><input type="checkbox" name="no_incentive" value="yes" required/> Saya benar-benar datang ke sini, dan tidak dibayar, diberi hadiah, atau disuruh pemilik untuk menilai.</label>
    {state.message && <p className="vr-message" role="alert">{state.message}</p>}
    <button className="vg-button" disabled={pending}>{pending ? 'Mengirim…' : 'Kirim nilai'}</button>
  </form>
}
