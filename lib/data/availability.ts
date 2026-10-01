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

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function getPublicClient() {
  const { url, publishableKey } = getSupabaseConfig()
  return createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

export async function searchAvailableInventory(options: AvailabilitySearchOptions): Promise<AvailableInventoryItem[]> {
  if (!DATE_PATTERN.test(options.startDate)) return []
  if (options.endDate && !DATE_PATTERN.test(options.endDate)) return []

  const guests = Math.max(1, Math.min(options.guests ?? 1, 20))
  const limit = Math.max(1, Math.min(options.limit ?? 24, 100))

  const { data, error } = await getPublicClient().rpc('search_available_inventory', {
    p_category_slug: options.categorySlug,
    p_start_date: options.startDate,
    p_end_date: options.endDate || null,
    p_query: options.query?.trim() || null,
    p_district: options.district || null,
    p_subtype: options.subtype || null,
    p_guests: guests,
    p_limit: limit,
  })

  if (error || !Array.isArray(data)) return []

  return (data as Record<string, unknown>[]).map((row) => ({
    inventory_item_id: String(row.inventory_item_id),
    place_id: String(row.place_id),
    place_name: String(row.place_name),
    place_slug: String(row.place_slug),
    district: typeof row.district === 'string' ? row.district : null,
    subtype: typeof row.subtype === 'string' ? row.subtype : null,
    item_type: String(row.item_type || 'inventory'),
    item_name: String(row.item_name || 'Inventory'),
    capacity: row.capacity == null ? null : Number(row.capacity),
    effective_price: row.effective_price == null ? null : Number(row.effective_price),
    currency: String(row.currency || 'IDR'),
    price_unit: typeof row.price_unit === 'string' ? row.price_unit : null,
    booking_url: typeof row.booking_url === 'string' ? row.booking_url : null,
  }))
}
