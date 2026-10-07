import { db } from '@/lib/mvp/db'
export const dynamic='force-dynamic'
export async function GET(){try{await db().query('SELECT 1');return Response.json({status:'ok',database:'connected'})}catch{return Response.json({status:'unavailable'},{status:503})}}
