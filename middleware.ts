import { NextResponse, type NextRequest } from 'next/server'
export function middleware(request: NextRequest) {
 const path=request.nextUrl.pathname
 const aliases: Record<string,string>={'/explore':'/wisata','/stay':'/hotel','/eat':'/kuliner','/transport':'/transportasi','/rental':'/transportasi','/events':'/event'}
 if(aliases[path]) { const url=request.nextUrl.clone();url.pathname=aliases[path];return NextResponse.redirect(url,308) }
 if(path.startsWith('/explore/')) { const url=request.nextUrl.clone();url.pathname=path.replace('/explore/','/wisata/');return NextResponse.redirect(url,308) }
 if(/^\/(account|login|partner|trip|claim|auth)(\/|$)/.test(path)) return new NextResponse('Fitur ini belum tersedia pada versi awal VisitGarut.',{status:404})
 if(path==='/api/nearby') return NextResponse.json({error:'Gunakan peta VisitGarut.'},{status:404})
 return NextResponse.next()
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']}
