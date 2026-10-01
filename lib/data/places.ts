import { createClient } from '@supabase/supabase-js'

export type PlaceSummary = {
  id?: string
  name: string
  slug: string
  district: string | null
  rating: number | null
  review_count: number
  short_description: string | null
  description?: string | null
  cover_image_url: string | null
  latitude?: number | null
  longitude?: number | null
  seo_title?: string | null
  seo_description?: string | null
  website_url?: string | null
  whatsapp?: string | null
  address?: string | null
  price_label?: string | null
  category?: {
    name: string
    slug: string
  } | null
}

const fallbackPlaces: PlaceSummary[] = [
  {
    name: 'Gunung Papandayan',
    slug: 'gunung-papandayan',
    district: 'Cisurupan',
    rating: 4.8,
    review_count: 1200,
    short_description: 'Gunung vulkanik populer dengan kawah, hutan mati, dan jalur trekking yang ramah wisatawan.',
    cover_image_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85',
    category: { name: 'Wisata', slug: 'wisata' },
  },
  {
    name: 'Darajat Pass',
    slug: 'darajat-pass',
    district: 'Pasirwangi',
    rating: 4.7,
    review_count: 1500,
    short_description: 'Kawasan wisata pegunungan dengan pemandian air panas dan panorama dataran tinggi.',
    cover_image_url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=85',
    category: { name: 'Wisata', slug: 'wisata' },
  },
  {
    name: 'Cipanas Garut',
    slug: 'cipanas-garut',
    district: 'Tarogong Kaler',
    rating: 4.6,
    review_count: 860,
    short_description: 'Kawasan pemandian air panas dengan hotel, resort, dan kolam air panas alami.',
    cover_image_url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=85',
    category: { name: 'Wisata', slug: 'wisata' },
  },
  {
    name: 'Situ Bagendit',
    slug: 'situ-bagendit',
    district: 'Banyuresmi',
    rating: 4.6,
    review_count: 980,
    short_description: 'Danau ikonik Garut untuk wisata keluarga, perahu, dan pemandangan pegunungan.',
    cover_image_url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=85',
    category: { name: 'Wisata', slug: 'wisata' },
  },
]

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) return null

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function normalizePlace(row: Record<string, unknown>): PlaceSummary {
  const rawCategory = row.category
  const category = Array.isArray(rawCategory)
    ? (rawCategory[0] as { name: string; slug: string } | undefined) ?? null
    : (rawCategory as { name: string; slug: string } | null) ?? null

  return {
    id: row.id as string | undefined,
    name: String(row.name),
    slug: String(row.slug),
    district: (row.district as string | null) ?? null,
    rating: row.rating == null ? null : Number(row.rating),
    review_count: Number(row.review_count ?? 0),
    short_description: (row.short_description as string | null) ?? null,
    description: (row.description as string | null | undefined) ?? null,
    cover_image_url: (row.cover_image_url as string | null) ?? null,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    seo_title: (row.seo_title as string | null | undefined) ?? null,
    seo_description: (row.seo_description as string | null | undefined) ?? null,
    website_url: (row.website_url as string | null | undefined) ?? null,
    whatsapp: (row.whatsapp as string | null | undefined) ?? null,
    address: (row.address as string | null | undefined) ?? null,
    price_label: (row.price_label as string | null | undefined) ?? null,
    category,
  }
}

const placeSelect = `
  id,
  name,
  slug,
  district,
  rating,
  review_count,
  short_description,
  description,
  cover_image_url,
  latitude,
  longitude,
  seo_title,
  seo_description,
  website_url,
  whatsapp,
  address,
  price_label,
  category:categories(name, slug)
`

function mergeFallbackImage(place: PlaceSummary) {
  const fallback = fallbackPlaces.find((item) => item.slug === place.slug)
  return {
    ...place,
    cover_image_url: place.cover_image_url || fallback?.cover_image_url || null,
  }
}

export async function getFeaturedPlaces(limit = 4): Promise<PlaceSummary[]> {
  const supabase = getPublicClient()
  if (!supabase) return fallbackPlaces.slice(0, limit)

  const { data, error } = await supabase
    .from('places')
    .select(placeSelect)
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('rating', { ascending: false })
    .limit(limit)

  if (error || !data?.length) return fallbackPlaces.slice(0, limit)

  return data
    .map((row) => normalizePlace(row as unknown as Record<string, unknown>))
    .map(mergeFallbackImage)
}

export async function getPublishedPlaces(): Promise<PlaceSummary[]> {
  const supabase = getPublicClient()
  if (!supabase) return fallbackPlaces

  const { data, error } = await supabase
    .from('places')
    .select(placeSelect)
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false })

  if (error || !data?.length) return fallbackPlaces

  return data
    .map((row) => normalizePlace(row as unknown as Record<string, unknown>))
    .map(mergeFallbackImage)
}

export async function getPublishedPlacesByCategory(categorySlug: string): Promise<PlaceSummary[]> {
  const places = await getPublishedPlaces()
  return places.filter((place) => place.category?.slug === categorySlug)
}

export async function getPlaceBySlug(slug: string): Promise<PlaceSummary | null> {
  const supabase = getPublicClient()

  if (!supabase) {
    return fallbackPlaces.find((place) => place.slug === slug) ?? null
  }

  const { data, error } = await supabase
    .from('places')
    .select(placeSelect)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error || !data) {
    return fallbackPlaces.find((place) => place.slug === slug) ?? null
  }

  return mergeFallbackImage(normalizePlace(data as unknown as Record<string, unknown>))
}

export async function getPublishedPlaceSlugs(): Promise<string[]> {
  const supabase = getPublicClient()
  if (!supabase) return fallbackPlaces.map((place) => place.slug)

  const { data, error } = await supabase
    .from('places')
    .select('slug')
    .eq('status', 'published')

  if (error || !data?.length) return fallbackPlaces.map((place) => place.slug)
  return data.map((row) => row.slug)
}
