'use client'
import { useActionState } from 'react'
import Link from 'next/link'
import { submitExperience,reportEvidence } from '@/lib/pulse/public-actions'
import { ratingDimensions } from '@/lib/pulse/contribution'
const initial={ok:false,message:''}
export function ContributionForm({placeId,rental=false}:{placeId:number;rental?:boolean}){
 const [state,action,pending]=useActionState(submitExperience,initial)
 return <details className="pulse-contribute" id={'pengalaman-form-'+placeId}><summary>{rental?'Bagikan pengalaman menyewamu':'Bagikan pengalaman kunjunganmu'}</summary><p>Ceritakan pengalaman sendiri beserta konteksnya. Hindari nomor telepon, alamat pribadi, dan identitas orang lain. Semua kontribusi diperiksa sebelum tampil.</p>
 <form action={action}><input type="hidden" name="place_id" value={placeId}/>
 <label>Nama tampilan atau pseudonim (opsional)<input name="display_name" maxLength={120}/></label>
 <label>{rental?'Tanggal sewa':'Tanggal kunjungan'}<input type="date" name="experience_date" required/></label>
 <label>Pengalaman secara keseluruhan<select name="sentiment" required><option value="">Pilih pengalaman</option><option value="positive">Positif</option><option value="neutral">Netral</option><option value="mixed">Campuran</option><option value="negative">Negatif</option></select></label>
 <label>Ceritamu<textarea name="original_text" minLength={20} maxLength={4000} rows={5} required/></label>
 <details className="pulse-rating-form"><summary>Nilai aspek yang kamu alami (opsional)</summary><p>1 sangat kurang, 2 kurang, 3 cukup, 4 baik, 5 sangat baik. Kosongkan aspek yang tidak kamu alami.</p><div>{Object.entries(ratingDimensions).map(([key,label])=><label key={key}>{label}<select name={'rating_'+key}><option value="">Tidak dinilai</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} / 5</option>)}</select></label>)}</div></details>
 <label>Link profil publik (opsional, untuk pemeriksaan admin)<input type="url" name="source_identity_reference" maxLength={500} placeholder="https://www.instagram.com/namaprofil"/></label><small>Disimpan untuk pemeriksaan identitas sumber, tidak ditampilkan pada ceritamu. Nama berbeda saja tidak membuat kontribusi dihitung sebagai pengunjung berbeda.</small>
 <label className="pulse-honeypot" aria-hidden="true">Kosongkan kolom ini<input name="website_confirmation" tabIndex={-1} autoComplete="off"/></label>
 <label className="vg-checkbox"><input name="consent" type="checkbox" value="yes" required/>Saya menulis pengalaman ini sendiri dan mengizinkan publikasi serta analisis topik oleh VisitGarut sesuai kebijakan privasi.</label><Link href="/privasi">Baca kebijakan privasi</Link><button className="vg-button" disabled={pending}>{pending?'Mengirim…':'Kirim untuk diperiksa'}</button>{state.message&&<p className="vg-alert" role={state.ok?'status':'alert'}>{state.message}</p>}
 </form></details>
}
export function ReportForm({placeId,mentionId,youtubeCommentId}:{placeId:number;mentionId?:number;youtubeCommentId?:string}){
 const [state,action,pending]=useActionState(reportEvidence,initial)
 return <details className="pulse-report"><summary>Laporkan informasi / minta penarikan kontribusi</summary><form action={action}><input type="hidden" name="place_id" value={placeId}/>{mentionId&&<input type="hidden" name="mention_id" value={mentionId}/>} {youtubeCommentId&&<input type="hidden" name="youtube_comment_id" value={youtubeCommentId}/>}<label>Bagian yang perlu diperiksa<textarea name="message" minLength={10} maxLength={2000} rows={3} required placeholder="Sertakan referensi bukti, tanggal, dan alasan. Tidak perlu mencantumkan data pribadi."/></label><button className="vg-button" disabled={pending}>{pending?'Mengirim…':'Kirim laporan'}</button>{state.message&&<p role="status">{state.message}</p>}</form></details>
}
