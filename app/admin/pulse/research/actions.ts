'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/mvp/db'
import { requireAdmin } from '@/lib/mvp/auth'
import { topics } from '@/lib/pulse/core'
import { sourceKinds,researchSourceUrl } from '@/lib/pulse/research'
const str=(f:FormData,k:string,max:number)=>String(f.get(k)||'').trim().slice(0,max)
export async function saveResearch(f:FormData){
 await requireAdmin()
 try{
  const id=Number(f.get('id'))||null,place=Number(f.get('place_id'))
  const topic=str(f,'topic',40),kind=str(f,'source_kind',20),state=str(f,'status',12)
  const title=str(f,'title',200),summary=str(f,'summary',1200),publisher=str(f,'publisher',200)
  const source=researchSourceUrl(str(f,'source_url',2000)),published=str(f,'source_published_at',10)
  if(!(topic in topics)||!(kind in sourceKinds)||!['pending','approved','withdrawn'].includes(state)||!title||summary.length<20||!publisher)throw new Error('Invalid research')
  if(published&&(!/^\d{4}-\d{2}-\d{2}$/.test(published)||!Number.isFinite(Date.parse(published))||new Date(published).toISOString().slice(0,10)!==published||Date.parse(published)>Date.now()))throw new Error('Invalid date')
  const values=[place,topic,title,summary,source,publisher,kind,published||null,str(f,'limitations',1200),state]
  if(id){const result=await db().query('UPDATE vg_place_research SET place_id=$1,topic=$2,title=$3,summary=$4,source_url=$5,publisher=$6,source_kind=$7,source_published_at=$8,limitations=$9,status=$10,checked_at=now() WHERE id=$11',[...values,id]);if(!result.rowCount)throw new Error('Not found')}
  else await db().query('INSERT INTO vg_place_research(place_id,topic,title,summary,source_url,publisher,source_kind,source_published_at,limitations,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',values)
  revalidatePath('/','layout')
 }catch{redirect('/admin/pulse/research?error=save')}
 redirect('/admin/pulse/research?saved=1')
}
