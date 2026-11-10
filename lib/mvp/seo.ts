/** Search and answer-engine helpers shared by place, category, and kecamatan pages. Pure functions only. */

/** Listings whose only source is a Google Maps location check carry no information of their own yet. */
export const mapsOnlySourcePrefix = 'https://www.google.com/maps/search/'
export const indexableSql = `(source_url NOT LIKE '${mapsOnlySourcePrefix}%' OR website<>'' OR whatsapp<>'' OR content LIKE '%visitgarut:practical%')`

type ThinInput = { source_url?: string | null; website?: string | null; whatsapp?: string | null; practical?: unknown }

/**
 * A page is kept out of search indexes while everything on it was generated from a location check alone.
 * It stays public and linked; it becomes indexable as soon as an editor adds a real source, contact, or field data.
 */
export function isThinPlace(p: ThinInput) {
  return (p.source_url || '').startsWith(mapsOnlySourcePrefix) && !p.website && !p.whatsapp && !p.practical
}

export function districtSlug(name: string) {
  return name.toLocaleLowerCase('id-ID').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' dan ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export const clip = (s: string, max: number) => {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), 40)).replace(/[,;:\s]+$/, '') + '…'
}
const noDot = (s: string) => s.trim().replace(/[.\s]+$/, '')

const tail: Record<string, string> = {
  wisata: 'Cek tiket, jam buka, akses, dan rute sebelum berangkat.',
  hotel: 'Cek lokasi, rute, dan hal yang perlu ditanyakan sebelum memesan kamar.',
  kuliner: 'Cek lokasi, rute, dan hal yang perlu ditanyakan sebelum datang.',
  cafe: 'Cek lokasi, rute, dan hal yang perlu ditanyakan sebelum datang.',
  transportasi: 'Cek area layanan dan cara memesan sebelum menyewa.',
}

/** 120–155 character description: name, what it is, where, and what the page helps with. Ends on a full sentence. */
export function placeDescription(p: { name: string; excerpt: string; district: string; category: string }) {
  const what = noDot(p.excerpt || '')
  const where = p.district && !what.includes(p.district) ? `, ${p.district}` : ''
  const lead = what ? `${p.name}: ${what.charAt(0).toLocaleLowerCase('id-ID') + what.slice(1)}${where}, Garut.` : `${p.name}${where ? ` di${where.slice(1)}` : ''}, Kabupaten Garut.`
  for (const t of [tail[p.category] || tail.kuliner, 'Cek lokasi dan rute sebelum datang.', 'Cek sebelum datang.']) {
    const full = `${lead} ${t}`
    if (full.length <= 155) return full
  }
  return clip(lead, 155)
}

/** One quotable sentence that answers "what and where is this", with the check date. */
export function placeSummary(p: { name: string; excerpt: string; district: string; address: string }, checked: string) {
  const what = noDot(p.excerpt || '')
  const body = what ? `${p.name}: ${what.charAt(0).toLocaleLowerCase('id-ID') + what.slice(1)}` : p.name
  const where = p.district && !body.includes(p.district) ? `, Kecamatan ${p.district}` : ''
  return `${body}${where}, Kabupaten Garut, Jawa Barat.${checked ? ` Informasi di halaman ini dicek ${checked}.` : ''}`
}

/** Short orientation text for kecamatan hub pages. Only general geography, no claims about specific businesses. */
export const districtIntro: Record<string, string> = {
  'Garut Kota': 'Pusat kota Garut, tempat alun-alun, Stasiun Garut, pusat belanja, dan sentra kulit Sukaregang berada. Banyak kuliner dan penginapan berjarak dekat satu sama lain.',
  'Tarogong Kidul': 'Kawasan ramai di barat laut pusat kota yang dilalui Jalan Cimanuk, Jalan Pembangunan, dan Jalan Otista. Pilihan kuliner, kafe, dan hotel kota banyak berkumpul di sini.',
  'Tarogong Kaler': 'Wilayah utara kota Garut yang mencakup kawasan air panas Cipanas di kaki Gunung Guntur serta jalur menuju Samarang.',
  'Karangpawitan': 'Sisi timur pusat kota Garut, di jalur menuju Wanaraja dan Tasikmalaya.',
  'Samarang': 'Jalur perbukitan di barat Garut menuju Kamojang, dengan udara sejuk dan banyak tempat wisata alam.',
  'Pasirwangi': 'Dataran tinggi di jalur menuju Darajat, dikenal dengan sumber air panas dan pemandangan pegunungan.',
  'Cisurupan': 'Jalur Garut–Cikajang yang menjadi akses utama ke Gunung Papandayan.',
  'Cikajang': 'Dataran tinggi di jalur menuju Garut selatan, dikelilingi kebun dan pegunungan.',
  'Bayongbong': 'Di jalur Garut menuju Cikajang dan Papandayan, di antara Gunung Cikuray dan Papandayan.',
  'Cilawu': 'Kaki Gunung Cikuray di tenggara kota Garut, termasuk kawasan kebun teh Dayeuhmanggung.',
  'Leles': 'Jalur utara Garut dari arah Bandung, tempat Situ dan Candi Cangkuang berada.',
  'Kadungora': 'Jalur utara yang menghubungkan Garut dengan arah Bandung.',
  'Banyuresmi': 'Timur laut kota Garut, kawasan Situ Bagendit.',
  'Wanaraja': 'Timur laut kota Garut di jalur menuju Sukawening dan Malangbong.',
  'Balubur Limbangan': 'Jalur jalan nasional dari arah Nagreg menuju Garut dan Tasikmalaya.',
  'Malangbong': 'Jalur jalan nasional di bagian utara-timur Kabupaten Garut.',
  'Cibatu': 'Utara Garut, dikenal dengan stasiun kereta Cibatu.',
  'Pameungpeuk': 'Pusat kecamatan di pesisir selatan Garut, dekat Pantai Santolo dan Sayang Heulang.',
  'Cikelet': 'Pesisir selatan Garut di sekitar Pantai Santolo dan Karangpapak.',
  'Caringin': 'Pesisir barat daya Garut di sekitar Pantai Rancabuaya.',
  'Bungbulang': 'Wilayah pesisir dan perbukitan di barat daya Garut.',
}
export const districtIntroFallback = (name: string) => `Salah satu kecamatan di Kabupaten Garut, Jawa Barat.`
