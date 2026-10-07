import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
export async function POST(request:Request){const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)return new Response('Forbidden',{status:403});(await cookies()).delete('vg_session');return NextResponse.redirect(new URL('/admin/login',request.url),303)}
