'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AuthForm({ next = '/account' }: { next?: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    const supabase = createClient()

    try {
      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) throw authError
        router.push(next)
        router.refresh()
        return
      }

      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      })
      if (authError) throw authError

      if (data.session) {
        router.push(next)
        router.refresh()
        return
      }

      setMessage('Akun dibuat. Cek email kamu untuk konfirmasi sebelum masuk.')
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Autentikasi gagal. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-mode-switch" role="tablist" aria-label="Masuk atau daftar">
        <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Masuk</button>
        <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Daftar</button>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          <span>Email</span>
          <div className="auth-input-wrap">
            <Mail size={18} />
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" autoComplete="email" required />
          </div>
        </label>

        <label>
          <span>Password</span>
          <div className="auth-input-wrap">
            <LockKeyhole size={18} />
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimal 6 karakter" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} required />
            <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>

        {message ? <p className="auth-message success">{message}</p> : null}
        {error ? <p className="auth-message error">{error}</p> : null}

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? 'Memproses…' : mode === 'login' ? 'Masuk ke VisitGarut' : 'Buat akun VisitGarut'}
        </button>
      </form>

      <p className="auth-note">Dengan akun VisitGarut, kamu bisa menyimpan tempat favorit, membuat itinerary, dan mengelola claim bisnis.</p>
    </div>
  )
}
