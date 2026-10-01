'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function FavoriteButton({ placeId, initialFavorite = false, loggedIn = false }: { placeId: string; initialFavorite?: boolean; loggedIn?: boolean }) {
  const router = useRouter()
  const [favorite, setFavorite] = useState(initialFavorite)
  const [loading, setLoading] = useState(false)

  async function toggleFavorite() {
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    const result = favorite
      ? await supabase.from('favorites').delete().eq('user_id', user.id).eq('place_id', placeId)
      : await supabase.from('favorites').insert({ user_id: user.id, place_id: placeId })

    if (!result.error) setFavorite((value) => !value)
    setLoading(false)
    router.refresh()
  }

  return (
    <button type="button" className={`favorite-action-button ${favorite ? 'active' : ''}`} onClick={toggleFavorite} disabled={loading} aria-pressed={favorite}>
      <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
      {loading ? 'Menyimpan…' : favorite ? 'Tersimpan' : 'Simpan'}
    </button>
  )
}
