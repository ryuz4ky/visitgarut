import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Heart, MapPinned, Route } from 'lucide-react'
import AuthForm from '@/components/AuthForm'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Masuk atau Daftar',
  description: 'Masuk ke VisitGarut untuk menyimpan tempat favorit, membuat itinerary, dan mengelola pengalaman Garut kamu.',
  robots: { index: false, follow: true },
}

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next = '/account' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect(next.startsWith('/') ? next : '/account')

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-brand-panel">
          <Link href="/" className="auth-back"><ArrowLeft size={17} /> Kembali ke VisitGarut</Link>
          <div>
            <span className="marketplace-eyebrow">YOUR GARUT, SAVED</span>
            <h1>Satu akun untuk perjalanan Garut kamu.</h1>
            <p>Simpan tempat, susun itinerary, dan kembali ke rencana perjalanan kapan saja.</p>
          </div>
          <div className="auth-benefits">
            <span><Heart size={19} /> Simpan tempat favorit</span>
            <span><Route size={19} /> Buat itinerary per hari</span>
            <span><MapPinned size={19} /> Kelola trip dan bisnis lokal</span>
          </div>
        </section>
        <section className="auth-form-panel">
          <Link className="vg-brand auth-logo" href="/" aria-label="VisitGarut home">
            <span className="vg-brand-mark">⌃</span>
            <span>Visit<span>Garut</span></span>
          </Link>
          <h2>Selamat datang.</h2>
          <p>Masuk atau buat akun baru untuk menggunakan fitur personal VisitGarut.</p>
          <AuthForm next={next.startsWith('/') ? next : '/account'} />
        </section>
      </div>
    </main>
  )
}
