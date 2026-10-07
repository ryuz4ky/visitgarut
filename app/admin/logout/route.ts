import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { siteUrl } from '@/lib/site'
export async function POST(request:Request){const origin=request.headers.get('origin');if(!origin||origin!==new URL(siteUrl).origin)return new Response('Forbidden',{status:403});(await cookies()).delete('vg_session');return NextResponse.redirect(new URL('/admin/login',siteUrl),303)}
