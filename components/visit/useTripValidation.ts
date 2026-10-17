'use client'
import { useCallback, useRef, useState } from 'react'
import { evaluationSessionFromBytes, type ValidationFeedback, type ValidationStage } from '@/lib/visit/validation'

export function useTripValidation() {
  const token = useRef<string | null>(null)
  const enabled = useRef(false)
  const stages = useRef(new Set<ValidationStage>(['opened']))
  const queue = useRef<Promise<boolean>>(Promise.resolve(true))
  const [state, setState] = useState<'idle' | 'active' | 'stopped'>('idle')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const send = useCallback((feedback?: ValidationFeedback) => {
    if (!enabled.current || !token.current) return Promise.resolve(false)
    // The payload is deliberately constructed here; plan values never enter it.
    const body = JSON.stringify({ session: token.current, stages: [...stages.current], ...(feedback ? { feedback } : {}) })
    const session = token.current
    const job = queue.current.then(async () => {
      if (!enabled.current || session !== token.current) return false
      try {
        const response = await fetch('/api/trip-validation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', signal: AbortSignal.timeout(8000) })
        return response.ok
      } catch { return false }
    })
    queue.current = job
    return job
  }, [])
  const track = useCallback((stage: ValidationStage) => {
    if (stages.current.has(stage)) return
    stages.current.add(stage)
    if (enabled.current) void send()
  }, [send])
  async function start() {
    if (busy) return
    if (typeof crypto === 'undefined' || !crypto.getRandomValues) { setStatus('Evaluasi belum tersedia di browser ini. Kamu tetap bisa menyusun rencana.'); return }
    token.current ||= crypto.randomUUID ? crypto.randomUUID() : evaluationSessionFromBytes(crypto.getRandomValues(new Uint8Array(16)))
    enabled.current = true; setState('active'); setBusy(true)
    const ok = await send()
    setStatus(ok ? 'Terima kasih. Pencatatan berlaku untuk kunjungan halaman ini.' : 'Evaluasi belum tersimpan. Kamu bisa mencoba lagi; rencanamu tetap bisa digunakan.')
    setBusy(false)
  }
  async function feedback(value: ValidationFeedback) {
    if (busy || !enabled.current) return
    setBusy(true); const ok = await send(value)
    setStatus(ok ? 'Masukan tersimpan. Terima kasih sudah membantu.' : 'Masukan belum tersimpan. Coba kirim lagi.'); setBusy(false)
  }
  async function withdraw() {
    if (busy || !token.current) return
    enabled.current = false; setState('stopped'); setBusy(true)
    await queue.current
    try {
      const response = await fetch('/api/trip-validation', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session: token.current }), credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', signal: AbortSignal.timeout(8000) })
      if (!response.ok) throw Error('withdraw')
      setStatus('Pencatatan dihentikan. Jawaban dan tahapan kunjungan ini sudah dihapus.'); token.current = null
    } catch { setStatus('Pencatatan dihentikan, tetapi penghapusan belum berhasil. Coba hapus lagi.') }
    setBusy(false)
  }
  return { state, busy, status, track, start, feedback, withdraw, canWithdraw: token.current !== null }
}
