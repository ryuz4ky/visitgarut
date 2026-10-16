import {garutStation} from '@/lib/visit/origins'
import {NextRequest,NextResponse} from 'next/server'
import {selectedTripPlaces} from '@/lib/mvp/data'
import {parseRouteIds,parseRoadResponse} from '@/lib/visit/route'
export async function GET(request:NextRequest){
 const ids=parseRouteIds(request.nextUrl.searchParams.get('ids'))
 if(!ids)return NextResponse.json({error:'Pilih titik awal dan maksimal tiga tempat berbeda.'},{status:400})
 const items=await selectedTripPlaces(ids,0)
 const points=ids.map(id=>id===-1?garutStation:items.find(p=>p.id===id))
 if(points.some(p=>!p||p.latitude===null||p.longitude===null))return NextResponse.json({error:'Koordinat belum lengkap. Isi waktu tempuh dari Maps.'},{status:422})
 const loop=[...points,points[0]]
 const coordinates=loop.map(p=>`${p!.longitude},${p!.latitude}`).join(';')
 try{
  const response=await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=false&steps=false&radiuses=${loop.map(()=>1500).join(';')}`,{signal:AbortSignal.timeout(7000),next:{revalidate:86400}})
  if(!response.ok)throw Error('route unavailable')
  const minutes=parseRoadResponse(await response.json(),loop.length)
  if(!minutes)throw Error('route incomplete')
  return NextResponse.json({minutes,source:'OSRM / OpenStreetMap',traffic:false},{headers:{'Cache-Control':'public, max-age=3600'}})
 }catch{return NextResponse.json({error:'Estimasi jalan belum tersedia. Buka Maps lalu isi waktu tempuh tiap perjalanan.'},{status:503})}
}
