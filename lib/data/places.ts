import { createClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from '@/lib/supabase/config'

export type PlaceSummary = {
  id?: string
  name: string
  slug: string
  district: string | null
  subdistrict?: string | null
  village?: string | null
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
  phone?: string | null
  address?: string | null
  google_maps_url?: string | null
  price_label?: string | null
  opening_hours?: Record<string, unknown> | null
  amenities?: Record<string, unknown> | unknown[] | null
  tags?: string[]
  is_verified?: boolean
  subtype?: string | null
  booking_mode?: string | null
  data_quality?: string | null
  category?: { name: string; slug: string } | null
}

export type SearchPlace = PlaceSummary & {
  inventory_count: number
  inventory_min_price: number | null
}

export type SearchPlacesOptions = {
  categorySlug?: string
  query?: string
  district?: string
  subtype?: string
  verified?: boolean
  amenity?: string
  priceBucket?: string
  sort?: 'recommended' | 'price_asc' | 'rating_desc' | 'name_asc' | 'newest'
  limit?: number
  offset?: number
}

export type InventoryItem = {
  id: string
  item_type: string
  name: string
  slug: string
  description: string | null
  capacity: number | null
  price_amount: number | null
  currency: string
  price_unit: string | null
  image_url: string | null
  booking_url: string | null
  metadata: Record<string, unknown>
}

export type PlaceSource = {
  id: string
  source_type: string
  source_name: string
  source_url: string | null
  last_verified_at: string
}

export type InventoryFacet = {
  itemCount: number
  minPrice: number | null
  itemTypes: string[]
}

const fallbackPlaces: PlaceSummary[] = [
  { name: 'Gunung Papandayan', slug: 'gunung-papandayan', district: 'Cisurupan', rating: null, review_count: 0, short_description: 'Gunung vulkanik populer dengan kawah, hutan mati, dan jalur trekking yang ramah wisatawan.', cover_image_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85', subtype: 'nature', data_quality: 'unverified', category: { name: 'Wisata', slug: 'wisata' } },
  { name: 'Darajat Pass', slug: 'darajat-pass', district: 'Pasirwangi', rating: null, review_count: 0, short_description: 'Kawasan wisata pegunungan dengan pemandian air panas dan panorama dataran tinggi.', cover_image_url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=85', subtype: 'attraction', data_quality: 'unverified', category: { name: 'Wisata', slug: 'wisata' } },
  { name: 'Cipanas Garut', slug: 'cipanas-garut', district: 'Tarogong Kaler', rating: null, review_count: 0, short_description: 'Kawasan pemandian air panas dengan hotel, resort, dan kolam air panas alami.', cover_image_url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=85', subtype: 'hot_spring', data_quality: 'unverified', category: { name: 'Wisata', slug: 'wisata' } },
  { name: 'Situ Bagendit', slug: 'situ-bagendit', district: 'Banyuresmi', rating: null, review_count: 0, short_description: 'Danau ikonik Garut untuk wisata keluarga, perahu, dan pemandangan pegunungan.', cover_image_url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=85', subtype: 'lake', data_quality: 'unverified', category: { name: 'Wisata', slug: 'wisata' } },
]

function getPublicClient() {
  const { url, publishableKey } = getSupabaseConfig()
  return createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
}

function normalizePlace(row: Record<string, unknown>): PlaceSummary {
  const rawCategory = row.category
  const category = Array.isArray(rawCategory)
    ? (rawCategory[0] as { name: string; slug: string } | undefined) ?? null
    : (rawCategory as { name: string; slug: string } | null) ?? null

  return {
    id: row.id as string | undefined,
    name: String(row.name), slug: String(row.slug), district: (row.district as string | null) ?? null,
    subdistrict: (row.subdistrict as string | null | undefined) ?? null, village: (row.village as string | null | undefined) ?? null,
    rating: row.rating == null ? null : Number(row.rating), review_count: Number(row.review_count ?? 0),
    short_description: (row.short_description as string | null) ?? null, description: (row.description as string | null | undefined) ?? null,
    cover_image_url: (row.cover_image_url as string | null) ?? null, latitude: row.latitude == null ? null : Number(row.latitude), longitude: row.longitude == null ? null : Number(row.longitude),
    seo_title: (row.seo_title as string | null | undefined) ?? null, seo_description: (row.seo_description as string | null | undefined) ?? null,
    website_url: (row.website_url as string | null | undefined) ?? null, whatsapp: (row.whatsapp as string | null | undefined) ?? null,
    phone: (row.phone as string | null | undefined) ?? null, address: (row.address as string | null | undefined) ?? null,
    google_maps_url: (row.google_maps_url as string | null | undefined) ?? null, price_label: (row.price_label as string | null | undefined) ?? null,
    opening_hours: (row.opening_hours as Record<string, unknown> | null | undefined) ?? null,
    amenities: (row.amenities as Record<string, unknown> | unknown[] | null | undefined) ?? null,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [], is_verified: Boolean(row.is_verified),
    subtype: (row.subtype as string | null | undefined) ?? null, booking_mode: (row.booking_mode as string | null | undefined) ?? null,
    data_quality: (row.data_quality as string | null | undefined) ?? null, category,
  }
}

function normalizeSearchPlace(row: Record<string, unknown>): SearchPlace {
  const place = normalizePlace({
    ...row,
    category: row.category_name && row.category_slug
      ? { name: String(row.category_name), slug: String(row.category_slug) }
      : null,
  })
  return {
    ...place,
    inventory_count: Number(row.inventory_count ?? 0),
    inventory_min_price: row.inventory_min_price == null ? null : Number(row.inventory_min_price),
  }
}

const placeSelect = `id,name,slug,district,subdistrict,village,rating,review_count,short_description,description,cover_image_url,latitude,longitude,seo_title,seo_description,website_url,whatsapp,phone,address,google_maps_url,price_label,opening_hours,amenities,tags,is_verified,subtype,booking_mode,data_quality,category:categories(name, slug)`

function mergeFallbackImage<T extends PlaceSummary>(place: T): T {
  const fallback = fallbackPlaces.find((item) => item.slug === place.slug)
  return { ...place, cover_image_url: place.cover_image_url || fallback?.cover_image_url || null }
}

export async function getFeaturedPlaces(limit = 4): Promise<PlaceSummary[]> {
  const { data, error } = await getPublicClient().from('places').select(placeSelect).eq('status', 'published').eq('is_featured', true).order('rating', { ascending: false }).limit(limit)
  if (error || !data?.length) return fallbackPlaces.slice(0, limit)
  return data.map((row) => normalizePlace(row as unknown as Record<string, unknown>)).map(mergeFallbackImage)
}

export async function getPublishedPlaces(): Promise<PlaceSummary[]> {
  const { data, error } = await getPublicClient().from('places').select(placeSelect).eq('status', 'published').order('is_featured', { ascending: false }).order('rating', { ascending: false })
  if (error || !data?.length) return fallbackPlaces
  return data.map((row) => normalizePlace(row as unknown as Record<string, unknown>)).map(mergeFallbackImage)
}

export async function getPublishedPlacesByCategory(categorySlug: string): Promise<PlaceSummary[]> {
  const places = await getPublishedPlaces()
  return places.filter((place) => place.category?.slug === categorySlug)
}

export async function searchPlaces(options: SearchPlacesOptions = {}): Promise<{ places: SearchPlace[]; total: number }> {
  const limit = Math.max(1, Math.min(options.limit ?? 24, 100))
  const offset = Math.max(options.offset ?? 0, 0)
  const { data, error } = await getPublicClient().rpc('search_places', {
    p_category_slug: options.categorySlug || null,
    p_query: options.query?.trim() || null,
    p_district: options.district || null,
    p_subtype: options.subtype || null,
    p_verified: Boolean(options.verified),
    p_amenity: options.amenity || null,
    p_price_bucket: options.priceBucket || null,
    p_sort: options.sort || 'recommended',
    p_limit: limit,
    p_offset: offset,
  })

  if (error || !data) {
    const fallback = options.categorySlug
      ? fallbackPlaces.filter((place) => place.category?.slug === options.categorySlug)
      : fallbackPlaces
    return {
      places: fallback.slice(offset, offset + limit).map((place) => ({ ...place, inventory_count: 0, inventory_min_price: null })),
      total: fallback.length,
    }
  }

  const rows = data as unknown as Record<string, unknown>[]
  return {
    places: rows.map(normalizeSearchPlace).map(mergeFallbackImage),
    total: rows.length ? Number(rows[0].total_count ?? rows.length) : 0,
  }
}

export async function getMapPlaces(): Promise<PlaceSummary[]> {
  const places = await getPublishedPlaces()
  return places.filter((place) => place.id && place.latitude != null && place.longitude != null)
}

export async function getPlaceBySlug(slug: string): Promise<PlaceSummary | null> {
  const { data, error } = await getPublicClient().from('places').select(placeSelect).eq('slug', slug).eq('status', 'published').maybeSingle()
  if (error || !data) return fallbackPlaces.find((place) => place.slug === slug) ?? null
  return mergeFallbackImage(normalizePlace(data as unknown as Record<string, unknown>))
}

export async function getPublishedPlaceSlugs(): Promise<string[]> {
  const { data, error } = await getPublicClient().from('places').select('slug').eq('status', 'published')
  if (error || !data?.length) return fallbackPlaces.map((place) => place.slug)
  return data.map((row) => row.slug)
}

export async function getInventoryFacets(placeIds: string[]): Promise<Record<string, InventoryFacet>> {
  if (!placeIds.length) return {}
  const { data, error } = await getPublicClient()
    .from('inventory_items')
    .select('place_id,item_type,price_amount')
    .in('place_id', placeIds)
    .eq('status', 'published')
  if (error || !data) return {}

  const index: Record<string, InventoryFacet> = {}
  for (const row of data) {
    const placeId = String(row.place_id)
    const price = row.price_amount == null ? null : Number(row.price_amount)
    const current = index[placeId] ?? { itemCount: 0, minPrice: null, itemTypes: [] }
    current.itemCount += 1
    if (price != null && (current.minPrice == null || price < current.minPrice)) current.minPrice = price
    if (row.item_type && !current.itemTypes.includes(String(row.item_type))) current.itemTypes.push(String(row.item_type))
    index[placeId] = current
  }
  return index
}

export async function getPublishedInventoryForPlace(placeId: string): Promise<InventoryItem[]> {
  const { data, error } = await getPublicClient().from('inventory_items').select('id,item_type,name,slug,description,capacity,price_amount,currency,price_unit,image_url,booking_url,metadata').eq('place_id', placeId).eq('status', 'published').order('item_type').order('name')
  if (error || !data) return []
  return data.map((row) => ({ ...row, price_amount: row.price_amount == null ? null : Number(row.price_amount), metadata: (row.metadata ?? {}) as Record<string, unknown> })) as InventoryItem[]
}

export async function getPlaceSources(placeId: string): Promise<PlaceSource[]> {
  const { data, error } = await getPublicClient().from('place_sources').select('id,source_type,source_name,source_url,last_verified_at').eq('place_id', placeId).order('last_verified_at', { ascending: false })
  if (error || !data) return []
  return data as PlaceSource[]
}
