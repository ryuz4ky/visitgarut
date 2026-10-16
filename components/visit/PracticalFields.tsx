import type {PracticalInfo} from '@/lib/visit/practical'
export default function PracticalFields({value}:{value:PracticalInfo|null}){
 return <fieldset className="vg-practical-fields"><legend>Informasi praktis kunjungan</legend><p>Isi hanya fakta yang dicantumkan sumber. Kolom kosong tetap berarti belum diketahui. Tarif di bawah untuk satu dewasa; ketentuan anak ditulis terpisah.</p>
 <label>URL sumber informasi praktis<input type="url" name="visit_source" defaultValue={value?.sourceUrl||''}/></label>
 <label>Nama pengelola / penerbit sumber<input name="visit_publisher" maxLength={160} defaultValue={value?.publisher||''}/></label>
 <label>Tanggal sumber diperiksa<input type="date" name="visit_checked" defaultValue={value?.checkedAt||''}/></label>
 <div className="vg-visit-two"><label>Tiket dewasa hari kerja (Rp)<input type="number" min="0" max="100000000" step="1" name="visit_weekday" defaultValue={value?.weekday??''}/></label><label>Tiket dewasa akhir pekan (Rp)<input type="number" min="0" max="100000000" step="1" name="visit_weekend" defaultValue={value?.weekend??''}/></label></div>
 {([['priceNote','Ketentuan tarif & anak'],['extrasNote','Biaya lain: parkir, sewa, aktivitas'],['familyNote','Fasilitas keluarga & hal yang perlu ditanyakan'],['accessNote','Akses & perjalanan dari parkir'],['hoursNote','Jam operasional & pengecualian']] as const).map(([key,label])=><label key={key}>{label}<textarea name={'visit_'+key} maxLength={800} rows={2} defaultValue={value?.[key]||''}/></label>)}
 </fieldset>
}
