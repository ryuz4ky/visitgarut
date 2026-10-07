'use server'
import { createHash,createHmac } from 'node:crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/mvp/db'
import { siteUrl } from '@/lib/site'
import { pulseForPlace } from './data'
import { sensitivePattern } from './core'
export type SubmissionState={ok:boolean;message:string}
async function allowed(action:string){const h=await headers();if(h.get('origin')!==new URL(siteUrl).origin)return false;const identity=h.get('x-forwarded-for')?.split(',').at(-1)?.trim()||'unknown';const key=createHmac('sha256',process.env.SESSION_SECRET!).update(action+':'+identity).digest('hex');const r=await db().query(`INSERT INTO vg_pulse_limits(key) VALUES($1) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN vg_pulse_limits.resets_at<now() THEN 1 ELSE vg_pulse_limits.attempts+1 END,resets_at=CASE WHEN vg_pulse_limits.resets_at<now() THEN now()+interval '1 day' ELSE vg_pulse_limits.resets_at END RETURNING attempts`,[key]);return r.rows[0].attempts<=5}
const str=(f:FormData,k:string,max:number)=>String(f.get(k)||'').trim().slice(0,max)
export async function submitExperience(_state:SubmissionState,f:FormData):Promise<SubmissionState>{try{
 if(str(f,'website_confirmation',100))return {ok:true,message:'Terima kasih. Kontribusi akan diperiksa sebelum ditampilkan.'}
 const id=Number(f.get('place_id'));const text=str(f,'original_text',4000);const name=str(f,'display_name',120);const visit=str(f,'experience_date',10);const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'});const sentiment=str(f,'sentiment',20)
 if(text.length<20||!/^\d{4}-\d{2}-\d{2}$/.test(visit)||Number.isNaN(Date.parse(visit))||new Date(visit).toISOString().slice(0,10)!==visit||visit>today||f.get('consent')!=='yes'||!['positive','neutral','negative','mixed'].includes(sentiment))return {ok:false,message:'Isi pengalaman minimal 20 karakter, tanggal kunjungan yang valid, jenis pengalaman, dan persetujuan publikasi.'}
 if(!await allowed('experience'))return {ok:false,message:'Batas pengiriman hari ini tercapai. Coba lagi besok.'}
 const p=(await db().query("SELECT id,category,slug FROM vg_places WHERE id=$1 AND status='published'",[id])).rows[0];if(!p)return {ok:false,message:'Tempat tidak ditemukan.'}
 const fingerprint=createHash('sha256').update(text.toLowerCase().replace(/\s+/g,' ')).digest('hex');const sourceKey='submission:'+fingerprint
 await db().query(`INSERT INTO vg_social_mentions(place_id,platform,source_key,original_text,display_name,fingerprint,published_at,experience_date,sentiment,rights_basis,permission_reference,analysis_allowed,is_sensitive) VALUES($1,'visitgarut',$2,$3,$4,$5,now(),$6,$7::varchar,'first_party','Persetujuan publikasi dan analisis formulir VisitGarut',true,$8) ON CONFLICT DO NOTHING`,[id,sourceKey,text,name,fingerprint,visit,sentiment,sensitivePattern.test(text)]);
 revalidatePath('/admin/pulse');return {ok:true,message:'Terima kasih. Pengalaman masuk antrean moderasi. Nama dan isi baru tampil setelah disetujui; pengiriman ini belum menjadi kesimpulan Community Pulse.'}
 }catch{return {ok:false,message:'Pengiriman belum berhasil. Coba lagi beberapa saat.'}}}
export async function reportEvidence(_state:SubmissionState,f:FormData):Promise<SubmissionState>{try{const id=Number(f.get('place_id'));const mention=Number(f.get('mention_id'))||null;const message=str(f,'message',2000);if(message.length<10||!await allowed('report'))return {ok:false,message:'Jelaskan laporan minimal 10 karakter. Maksimal 5 pengiriman per hari.'};const p=(await db().query("SELECT id FROM vg_places WHERE id=$1 AND status='published'",[id])).rows[0];if(!p)return {ok:false,message:'Tempat tidak ditemukan.'};if(mention&&!(await db().query('SELECT id FROM vg_social_mentions WHERE id=$1 AND place_id=$2',[mention,id])).rowCount)return {ok:false,message:'Bukti tidak ditemukan.'};await db().query('INSERT INTO vg_pulse_reports(place_id,mention_id,message) VALUES($1,$2,$3)',[id,mention,message]);revalidatePath('/admin/pulse');return {ok:true,message:'Laporan diterima untuk pemeriksaan admin. Jika meminta penarikan kontribusi Anda, sertakan tanggal dan bagian teks yang relevan.'}}catch{return {ok:false,message:'Laporan belum terkirim. Coba lagi nanti.'}}}

export async function loadYoutubePulse(placeId:number,consent:boolean){if(!consent||!process.env.YOUTUBE_DERIVED_METRICS_APPROVAL_REFERENCE)throw new Error('Consent required');const h=await headers();if(h.get('origin')!==new URL(siteUrl).origin)throw new Error('Invalid origin');if(!(await db().query("SELECT 1 FROM vg_places WHERE id=$1 AND status='published'",[placeId])).rowCount)throw new Error('Place unavailable');return (await pulseForPlace(placeId,true)).pulse}
