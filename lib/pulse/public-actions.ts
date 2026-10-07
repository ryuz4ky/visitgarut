'use server'
import { createHash,createHmac } from 'node:crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/mvp/db'
import { siteUrl } from '@/lib/site'
import { pulseForPlace } from './data'
import { sensitivePattern,type Topic } from './core'
import { contributionRatings,publicIdentityReference } from './contribution'
export type SubmissionState={ok:boolean;message:string}
async function allowed(action:string){const h=await headers();if(h.get('origin')!==new URL(siteUrl).origin)return false;const identity=h.get('x-forwarded-for')?.split(',').at(-1)?.trim()||'unknown';const key=createHmac('sha256',process.env.SESSION_SECRET!).update(action+':'+identity).digest('hex');const r=await db().query(`INSERT INTO vg_pulse_limits(key) VALUES($1) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN vg_pulse_limits.resets_at<now() THEN 1 ELSE vg_pulse_limits.attempts+1 END,resets_at=CASE WHEN vg_pulse_limits.resets_at<now() THEN now()+interval '1 day' ELSE vg_pulse_limits.resets_at END RETURNING attempts`,[key]);return r.rows[0].attempts<=5}
const str=(f:FormData,k:string,max:number)=>Array.from(String(f.get(k)||'').trim()).slice(0,max).join('')
export async function submitExperience(_state:SubmissionState,f:FormData):Promise<SubmissionState>{
 let client
 try{
  if(str(f,'website_confirmation',100))return {ok:true,message:'Terima kasih. Kontribusi akan diperiksa sebelum ditampilkan.'}
  const id=Number(f.get('place_id')),text=str(f,'original_text',4000),name=str(f,'display_name',120),visit=str(f,'experience_date',10),sentiment=str(f,'sentiment',20)
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'})
  if(Array.from(text).length<20||!/^\d{4}-\d{2}-\d{2}$/.test(visit)||Number.isNaN(Date.parse(visit))||new Date(visit).toISOString().slice(0,10)!==visit||visit>today||f.get('consent')!=='yes'||!['positive','neutral','negative','mixed'].includes(sentiment))return {ok:false,message:'Isi pengalaman minimal 20 karakter, tanggal kunjungan yang valid, jenis pengalaman, dan persetujuan publikasi.'}
  let ratings,identity
  try{ratings=contributionRatings(f);identity=publicIdentityReference(str(f,'source_identity_reference',500))}catch{return {ok:false,message:'Periksa nilai 1–5 dan link profil publik pada platform yang didukung.'}}
  if(!await allowed('experience'))return {ok:false,message:'Batas pengiriman hari ini tercapai. Coba lagi besok.'}
  const p=(await db().query("SELECT id FROM vg_places WHERE id=$1 AND status='published'",[id])).rows[0];if(!p)return {ok:false,message:'Tempat tidak ditemukan.'}
  const fingerprint=createHash('sha256').update(text.toLowerCase().replace(/\s+/g,' ')).digest('hex')
  client=await db().connect();await client.query('BEGIN')
  const result=await client.query(`INSERT INTO vg_social_mentions(place_id,platform,source_key,original_text,display_name,fingerprint,published_at,experience_date,sentiment,rights_basis,permission_reference,analysis_allowed,is_sensitive,source_identity_reference)
  VALUES($1,'visitgarut',$2,$3,$4,$5,now(),$6,$7,'first_party','Persetujuan publikasi dan analisis formulir VisitGarut',true,$8,$9) ON CONFLICT DO NOTHING RETURNING id`,[id,'submission:'+fingerprint,text,name,fingerprint,visit,sentiment,sensitivePattern.test(text),identity])
  const mention=result.rows[0]?.id
  if(mention)for(const r of ratings){
   await client.query('INSERT INTO vg_mention_ratings(mention_id,dimension,rating) VALUES($1,$2,$3)',[mention,r.dimension,r.rating])
   if(r.dimension!=='overall'&&r.dimension!=='keamanan')await client.query('INSERT INTO vg_mention_topics(mention_id,topic,sentiment) VALUES($1,$2,$3)',[mention,r.dimension as Topic,r.rating<=2?'negative':r.rating===3?'neutral':'positive'])
  }
  await client.query('COMMIT');revalidatePath('/admin/pulse')
  return {ok:true,message:'Terima kasih. Cerita dan penilaianmu masuk antrean moderasi. Publikasi serta perhitungan menunggu pemeriksaan konteks dan identitas sumber.'}
 }catch{if(client)await client.query('ROLLBACK');return {ok:false,message:'Pengiriman belum berhasil. Coba lagi beberapa saat.'}}finally{client?.release()}
}
export async function reportEvidence(_state:SubmissionState,f:FormData):Promise<SubmissionState>{try{
 const id=Number(f.get('place_id')),mention=Number(f.get('mention_id'))||null,comment=str(f,'youtube_comment_id',20)||null,message=str(f,'message',2000)
 if(message.length<10||!await allowed('report'))return {ok:false,message:'Jelaskan laporan minimal 10 karakter. Maksimal 5 pengiriman per hari.'}
 const p=(await db().query("SELECT id FROM vg_places WHERE id=$1 AND status='published'",[id])).rows[0];if(!p)return {ok:false,message:'Tempat tidak ditemukan.'}
 if(mention&&!(await db().query("SELECT id FROM vg_social_mentions WHERE id=$1 AND place_id=$2 AND status='approved'",[mention,id])).rowCount)return {ok:false,message:'Bukti tidak ditemukan.'}
 if(comment&&(!/^\d+$/.test(comment)||!(await db().query("SELECT c.id FROM vg_youtube_comments c JOIN vg_youtube_videos v ON v.id=c.video_id WHERE c.id=$1 AND v.place_id=$2 AND c.public_status='approved' AND v.review_status='approved' AND c.expires_at>now() AND v.expires_at>now()",[comment,id])).rowCount))return {ok:false,message:'Komentar tidak ditemukan.'}
 await db().query('INSERT INTO vg_pulse_reports(place_id,mention_id,youtube_comment_id,message) VALUES($1,$2,$3,$4)',[id,mention,comment,message]);revalidatePath('/admin/pulse')
 return {ok:true,message:'Laporan diterima untuk pemeriksaan admin. Jika meminta penarikan kontribusi Anda, sertakan tanggal dan bagian teks yang relevan.'}
}catch{return {ok:false,message:'Laporan belum terkirim. Coba lagi nanti.'}}}
export async function loadYoutubePulse(placeId:number,consent:boolean){if(!consent||!process.env.YOUTUBE_DERIVED_METRICS_APPROVAL_REFERENCE)throw new Error('Consent required');const h=await headers();if(h.get('origin')!==new URL(siteUrl).origin)throw new Error('Invalid origin');if(!(await db().query("SELECT 1 FROM vg_places WHERE id=$1 AND status='published'",[placeId])).rowCount)throw new Error('Place unavailable');return (await pulseForPlace(placeId,true)).pulse}
