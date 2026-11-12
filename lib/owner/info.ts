import 'server-only'
import { db } from '@/lib/mvp/db'

/** What a place's owner or manager told us, shown with that attribution once an admin has accepted it. */
export type OwnerInfo = { hours: string; price_note: string; description: string; reviewed_at: Date }

/** Latest accepted submission that carries visitor-facing text. Returns null when the table is not there yet. */
export async function ownerInfo(placeId: number): Promise<OwnerInfo | null> {
  try {
    const row = (await db().query<OwnerInfo>(
      `SELECT hours, price_note, description, reviewed_at FROM vg_owner_updates
       WHERE place_id=$1 AND status='diterima' AND (hours<>'' OR price_note<>'' OR description<>'')
       ORDER BY reviewed_at DESC NULLS LAST LIMIT 1`, [placeId])).rows[0]
    return row || null
  } catch { return null }
}

/** True once any submission for the place has been accepted; such a page has information of its own. */
export async function ownerVerified(placeId: number): Promise<boolean> {
  try { return (await db().query("SELECT 1 FROM vg_owner_updates WHERE place_id=$1 AND status='diterima' LIMIT 1", [placeId])).rows.length > 0 } catch { return false }
}
