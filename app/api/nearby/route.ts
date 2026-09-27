import { NextRequest, NextResponse } from 'next/server'
import { getNearbyPlaces } from '@/lib/data/nearby'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const latParam = params.get('lat')
  const lngParam = params.get('lng')

  if (latParam == null || lngParam == null) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 })
  }

  const lat = Number(latParam)
  const lng = Number(lngParam)
  const radiusInput = Number(params.get('radius') || 10000)
  const limitInput = Number(params.get('limit') || 20)
  const radius = Number.isFinite(radiusInput) ? Math.min(Math.max(radiusInput, 500), 50000) : 10000
  const limit = Number.isFinite(limitInput) ? Math.min(Math.max(Math.round(limitInput), 1), 50) : 20

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return NextResponse.json({ error: 'Invalid latitude' }, { status: 400 })
  }

  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return NextResponse.json({ error: 'Invalid longitude' }, { status: 400 })
  }

  const places = await getNearbyPlaces(lat, lng, radius, limit)

  return NextResponse.json(
    { places, meta: { radius, limit } },
    {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    }
  )
}
