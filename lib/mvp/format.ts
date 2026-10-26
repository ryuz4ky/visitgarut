import { currentPractical, type PracticalInfo } from '@/lib/visit/practical'

const tz = 'Asia/Jakarta'

/** "Rp35rb", "Rp1,2 jt" — compact rupiah for chips and cards. */
export function compactRupiah(value: number) {
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`
  if (value >= 1_000) return `Rp${Math.round(value / 1_000).toLocaleString('id-ID')}rb`
  return `Rp${value.toLocaleString('id-ID')}`
}

export function rupiah(value: number) {
  return `Rp${value.toLocaleString('id-ID')}`
}

/** "12 Okt" — the date a fact was last checked. */
export function shortDate(value: string | Date) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: tz }).replace('.', '')
}

/** Lowest known adult ticket from a sourced practical record, or null when not yet known. */
export function knownTicket(practical?: PracticalInfo | null) {
  // Stale tariffs (older than the 30-day window) are treated as unknown, matching the trip planner.
  if (!practical || !currentPractical(practical)) return null
  const values = [practical.weekday, practical.weekend, ...(practical.calendar?.days ?? [])].filter((v): v is number => typeof v === 'number' && v >= 0)
  return values.length ? Math.min(...values) : null
}

export function checkedLabel(practical?: PracticalInfo | null) {
  if (!practical?.checkedAt) return ''
  const date = shortDate(practical.checkedAt)
  return date ? `Dicek ${date}` : ''
}
