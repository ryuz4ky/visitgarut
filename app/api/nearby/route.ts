import { NextRequest, NextResponse } from 'next/server'
import { getNearbyPlaces } from '@/lib/data/nearby'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const lat = Number(params.get('lat'))
  const lng = Number(params.get('lng'))
  const radius = Math.min(Math.max(Number(params.get('radius') || 10000), 500), 50000)
  const limit = Math.min(Math.max(Number(params.get('limit') || 20), 1), 50)

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return NextResponse.json({ error: 'Invalid latitude' }, { status: 400 })
  }

  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return NextResponse.json({ error: 'Invalid longitude' }, { status: 400 })
  }

  const places = await getNearbyPlaces(lat, lng, radius, limit)

  return NextResponse.json(
    { places, meta: { lat, lng, radius, limit } },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  )
}
