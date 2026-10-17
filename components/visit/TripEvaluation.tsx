'use client'
import Link from 'next/link'
import { useState } from 'react'
import { barrierLabels, helpfulnessLabels, type ValidationFeedback } from '@/lib/visit/validation'
import type { useTripValidation } from './useTripValidation'
export default function TripEvaluation({ evaluation }: { evaluation: ReturnType<typeof useTripValidation> }) {
  const [helpfulness, setHelpfulness] = useState<ValidationFeedback['helpfulness'] | ''>('')
  const [barrier, setBarrier] = useState<ValidationFeedback['barrier'] | ''>('')
  return <details className="vg-trip-evaluation">
    <summary>Bantu perbaiki planner (opsional)</summary>
    <p>Izinkan VisitGarut mencatat tahapan yang kamu buka pada kunjungan halaman ini, lalu beri dua jawaban singkat.</p>
    <p>Tanggal, tempat pilihan, jumlah orang, nilai anggaran, dan isi pesanmu tidak dikirim dalam evaluasi. Tanpa akun atau cookie analitik. Catatan evaluasi disimpan paling lama 30 hari. <Link href="/privasi#evaluasi-planner">Rincian privasi</Link></p>
    {evaluation.state === 'idle' && <button type="button" className="vg-button vg-secondary" onClick={evaluation.start}>Boleh catat langkah saya</button>}
    {evaluation.state === 'active' && <form onSubmit={event => { event.preventDefault(); if (helpfulness && barrier) void evaluation.feedback({ helpfulness, barrier }) }}>
      <fieldset><legend>Rencana ini membantu mengambil keputusan?</legend>{Object.entries(helpfulnessLabels).map(([value, label]) => <label key={value} className="vg-evaluation-choice"><input type="radio" name="trip-helpfulness" value={value} checked={helpfulness === value} onChange={() => setHelpfulness(value as ValidationFeedback['helpfulness'])} required />{label}</label>)}</fieldset>
      <label>Apa yang masih menghambat?<select value={barrier} onChange={event => setBarrier(event.target.value as ValidationFeedback['barrier'])} required><option value="">Pilih satu jawaban</option>{Object.entries(barrierLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button className="vg-button vg-secondary" disabled={evaluation.busy || !helpfulness || !barrier}>{evaluation.busy ? 'Menyimpan…' : 'Kirim masukan'}</button>
    </form>}
    {evaluation.canWithdraw && <button type="button" className="vg-evaluation-withdraw" disabled={evaluation.busy} onClick={evaluation.withdraw}>{evaluation.state === 'stopped' ? 'Coba hapus catatan lagi' : 'Hentikan & hapus catatan evaluasi'}</button>}
    <p role="status">{evaluation.status}</p>
  </details>
}
