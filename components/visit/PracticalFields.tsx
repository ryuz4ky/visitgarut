import {dayNames,type PracticalInfo} from '@/lib/visit/practical'
export default function PracticalFields({value}:{value:PracticalInfo|null}){
 return <fieldset className="vg-practical-fields"><legend>Informasi praktis kunjungan</legend><p>Isi hanya fakta yang dicantumkan sumber. Kolom kosong tetap berarti belum diketahui. Tarif di bawah untuk satu dewasa; ketentuan anak ditulis terpisah.</p>
 <label>URL sumber informasi praktis<input type="url" name="visit_source" defaultValue={value?.sourceUrl||''}/></label>
 <label>Nama pengelola / penerbit sumber<input name="visit_publisher" maxLength={160} defaultValue={value?.publisher||''}/></label>
 <label>Tanggal sumber diperiksa<input type="date" name="visit_checked" defaultValue={value?.checkedAt||''}/></label>
 <div className="vg-visit-two"><label>Tiket dewasa hari kerja (Rp)<input type="number" min="0" max="100000000" step="1" name="visit_weekday" defaultValue={value?.weekday??''}/></label><label>Tiket dewasa akhir pekan (Rp)<input type="number" min="0" max="100000000" step="1" name="visit_weekend" defaultValue={value?.weekend??''}/></label></div>
 <details className="vg-calendar-fields" open={!!value?.calendar}><summary>Tarif per hari & hari libur</summary>
  <input type="hidden" name="visit_calendar_fields" value="1"/>
  <label className="vg-calendar-toggle"><input type="checkbox" name="visit_use_calendar" value="1" defaultChecked={!!value?.calendar}/>Gunakan rincian tarif per hari</label>
  <p>Jika diaktifkan, rincian ini dipakai untuk menghitung tiket. Hari yang kosong tetap belum diketahui, walaupun tarif umum di atas terisi. Libur nasional dan libur khusus mengikuti ketentuan pengelola.</p>
  <div className="vg-visit-two">{[1,2,3,4,5,6,0].map(day=><label key={day}>{dayNames[day]} (Rp)<input type="number" min="0" max="100000000" step="1" name={'visit_day_'+day} defaultValue={value?.calendar?.days[day]??''}/></label>)}<label>Libur nasional (Rp)<input type="number" min="0" max="100000000" step="1" name="visit_holiday" defaultValue={value?.calendar?.holiday??''}/></label><label>Libur khusus (Rp)<input type="number" min="0" max="100000000" step="1" name="visit_specialHoliday" defaultValue={value?.calendar?.specialHoliday??''}/></label></div>
 </details>
 {([['priceNote','Ketentuan tarif & anak'],['extrasNote','Biaya lain: parkir, sewa, aktivitas'],['familyNote','Fasilitas keluarga & hal yang perlu ditanyakan'],['accessNote','Akses & perjalanan dari parkir'],['hoursNote','Jam operasional & pengecualian']] as const).map(([key,label])=><label key={key}>{label}<textarea name={'visit_'+key} maxLength={800} rows={2} defaultValue={value?.[key]||''}/></label>)}
 </fieldset>
}
