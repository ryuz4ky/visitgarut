import { createClient } from '@supabase/supabase-js'

export type NearbyPlace = {
  id: string
  name: string
  slug: string
  district: string | null
  rating: number | null
  review_count: number
  cover_image_url: string | null
  latitude: number
  longitude: number
  distance_meters: number
}

export async function getNearbyPlaces(
  latitude: number,
  longitude: number,
  radiusMeters = 10000,
  limit = 30
): Promise<NearbyPlace[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) return []

  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  const { data, error } = await supabase.rpc('find_nearby_places', {
    lat: latitude,
    lng: longitude,
    radius_meters: radiusMeters,
    result_limit: limit,
  })

  if (error || !data) return []

  return data.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    district: (row.district as string | null) ?? null,
    rating: row.rating == null ? null : Number(row.rating),
    review_count: Number(row.review_count ?? 0),
    cover_image_url: (row.cover_image_url as string | null) ?? null,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    distance_meters: Number(row.distance_meters),
  }))
}
