import { createClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from '@/lib/supabase/config'

export type AvailableInventoryItem = {
  inventory_item_id: string
  place_id: string
  place_name: string
  place_slug: string
  district: string | null
  subtype: string | null
  item_type: string
  item_name: string
  capacity: number | null
  effective_price: number | null
  currency: string
  price_unit: string | null
  booking_url: string | null
  cover_image_url: string | null
  latitude: number | null
  longitude: number | null
  nights: number
}

type AvailabilitySearchOptions = {
  categorySlug: string
  startDate: string
  endDate?: string
  query?: string
  district?: string
  subtype?: string
  guests?: number
  limit?: number
}

function getPublicClient() {
  const { url, publishableKey } = getSupabaseConfig()
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

export async function searchAvailableInventory(options: AvailabilitySearchOptions): Promise<AvailableInventoryItem[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.startDate)) return []
  if (options.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(options.endDate)) return []

  const { data, error } = await getPublicClient().rpc('search_available_inventory', {
    p_category_slug: options.categorySlug,
    p_start_date: options.startDate,
    p_end_date: options.endDate || null,
    p_query: options.query?.trim() || null,
    p_district: options.district || null,
    p_subtype: options.subtype || null,
    p_guests: Math.max(1, Math.min(options.guests ?? 1, 20)),
    p_limit: Math.max(1, Math.min(options.limit ?? 24, 100)),
  })

  if (error || !data) return []

  return (data as unknown as Record<string, unknown>[]).map((row) => ({
    inventory_item_id: String(row.inventory_item_id),
    place_id: String(row.place_id),
    place_name: String(row.place_name),
    place_slug: String(row.place_slug),
    district: (row.district as string | null) ?? null,
    subtype: (row.subtype as string | null) ?? null,
    item_type: String(row.item_type),
    item_name: String(row.item_name),
    capacity: row.capacity == null ? null : Number(row.capacity),
    effective_price: row.effective_price == null ? null : Number(row.effective_price),
    currency: String(row.currency || 'IDR'),
    price_unit: (row.price_unit as string | null) ?? null,
    booking_url: (row.booking_url as string | null) ?? null,
    cover_image_url: (row.cover_image_url as string | null) ?? null,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    nights: Number(row.nights ?? 1),
  }))
}
