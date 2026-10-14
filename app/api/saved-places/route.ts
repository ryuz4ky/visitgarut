import {NextRequest,NextResponse} from 'next/server'
import {db} from '@/lib/mvp/db'
import type {Place} from '@/lib/mvp/data'
import {parseSelectedIds,type SavedPlaceCard} from '@/lib/mvp/saved'
import {eligibleTripPlace,tripCategories} from '@/lib/trip/planner'
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}
export async function GET(request:NextRequest){
 const ids=parseSelectedIds(request.nextUrl.searchParams.get('ids')||'')
 if(ids===null)return NextResponse.json({error:'Pilihan tempat tidak valid.'},{status:400,headers})
 if(!ids.length)return NextResponse.json({items:[]},{headers})
 if(!process.env.DATABASE_URL)return NextResponse.json({error:'Daftar tempat belum dapat dimuat.'},{status:503,headers})
 try{
  const rows=(await db().query<Place>("SELECT id,slug,name,category,district,excerpt,image_url,latitude,longitude,source_url,status FROM vg_places WHERE id=ANY($1::int[]) AND status='published' ORDER BY array_position($1::int[],id)",[ids])).rows
  const items:SavedPlaceCard[]=rows.map(p=>({id:p.id,slug:p.slug,name:p.name,category:p.category,district:p.district,excerpt:p.excerpt,image_url:p.image_url,canPlan:eligibleTripPlace(p)&&(tripCategories as readonly string[]).includes(p.category)}))
  return NextResponse.json({items},{headers})
 }catch{console.error('Saved place lookup failed');return NextResponse.json({error:'Daftar tempat belum dapat dimuat. Coba lagi.'},{status:503,headers})}
}
