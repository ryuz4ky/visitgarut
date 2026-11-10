import type { Place } from '@/lib/mvp/data'
import { currentPractical } from '@/lib/visit/practical'
import { rupiah } from '@/lib/mvp/format'

export type Faq = { q: string; a: string }

const tz = 'Asia/Jakarta'
const longDate = (value: string | Date) => new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: tz })
const sentence = (s: string) => { const t = s.trim(); return t ? (/[.!?]$/.test(t) ? t : t + '.') : '' }

/** Ticket wording built only from the sourced tariff record. Old records are reported as old, never as current. */
function ticketAnswer(p: Place, now: Date) {
  const info = p.practical
  if (!info) return null
  const rates = [info.weekday, info.weekend, ...(info.calendar?.days ?? [])].filter((v): v is number => typeof v === 'number')
  if (!rates.length) return null
  const src = `${info.publisher}, diperiksa VisitGarut ${longDate(info.checkedAt)}`
  let amount: string
  if (info.weekday !== null && info.weekend !== null && info.weekday !== info.weekend) amount = `${rupiah(info.weekday)} pada hari kerja dan ${rupiah(info.weekend)} pada akhir pekan`
  else if (Math.min(...rates) === Math.max(...rates)) amount = Math.min(...rates) === 0 ? 'gratis' : rupiah(rates[0])
  else amount = `antara ${rupiah(Math.min(...rates))} dan ${rupiah(Math.max(...rates))} tergantung hari`
  const fresh = currentPractical(info, now)
  const lead = fresh ? `Tiket masuk dewasa ${p.name} tercatat ${amount}` : `Terakhir tercatat, tiket masuk dewasa ${p.name} ${amount}; catatan ini sudah lebih dari 30 hari sehingga perlu dikonfirmasi ulang`
  return `${lead} (sumber: ${src}). ${sentence(info.priceNote)}`.trim()
}

type RatingLike = { score: number | null; reviewers: number } | null

/** Short Q&A for a place page. Every answer comes from data already shown on the page; nothing is guessed. */
export function placeFaq(p: Place, opts: { categoryName: string; rental: boolean; rating?: RatingLike; now?: Date; nearby?: string[] }): Faq[] {
  const now = opts.now ?? new Date()
  const out: Faq[] = []
  const info = p.practical
  const where = p.address ? `${p.address}${p.district && !p.address.includes(p.district) ? `, ${p.district}` : ''}` : (p.district ? `${p.district}, Garut` : '')
  if (where) out.push({ q: opts.rental ? `Di mana area layanan ${p.name}?` : `Di mana lokasi ${p.name}?`, a: `${sentence(where)} ${p.district ? `Termasuk wilayah ${p.district}, Kabupaten Garut, Jawa Barat.` : 'Kabupaten Garut, Jawa Barat.'}${p.latitude !== null && p.longitude !== null ? ' Titik petanya tersedia di peta VisitGarut.' : ''}`.trim() })
  const ticket = p.category === 'wisata' ? ticketAnswer(p, now) : null
  if (ticket) out.push({ q: `Berapa harga tiket masuk ${p.name}?`, a: ticket })
  if (info?.hoursNote) out.push({ q: `Jam berapa ${p.name} buka?`, a: sentence(info.hoursNote) })
  if (info?.familyNote) out.push({ q: `Apakah ${p.name} cocok untuk keluarga dan anak?`, a: sentence(info.familyNote) })
  if (info?.accessNote) out.push({ q: `Bagaimana akses menuju ${p.name}?`, a: sentence(info.accessNote) })
  if (info?.extrasNote) out.push({ q: `Ada biaya lain selain tiket?`, a: sentence(info.extrasNote) })
  if (opts.rating && opts.rating.score !== null && opts.rating.reviewers >= 3) out.push({ q: `Berapa nilai ${p.name} dari pengunjung?`, a: `${opts.rating.score.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} dari 5, dari ${opts.rating.reviewers} pengunjung yang check-in di lokasi dalam 12 bulan terakhir. Skor ini tidak bisa dibeli oleh pemilik usaha.` })
  const contact = [p.whatsapp && 'WhatsApp', p.website && 'situs resmi'].filter(Boolean) as string[]
  if (contact.length) out.push({ q: opts.rental ? `Bagaimana cara memesan ${p.name}?` : `Bagaimana menghubungi ${p.name}?`, a: `Lewat ${contact.join(' atau ')} yang tercantum di halaman ini. ${opts.rental ? 'Sebutkan tanggal, durasi sewa, dan jumlah penumpang, lalu tanyakan biaya total.' : (p.category === 'hotel' ? 'Tanyakan tarif dan ketersediaan kamar untuk tanggal menginap.' : p.category === 'wisata' ? 'Tanyakan tarif dan jam buka terbaru sebelum berangkat.' : 'Tanyakan menu, harga, dan jam buka terbaru sebelum datang.')}` })
  const nearby = (opts.nearby || []).filter(n => n && n !== p.name).slice(0, 3)
  if (nearby.length && p.district && !opts.rental) out.push({ q: `Ada ${opts.categoryName.toLocaleLowerCase('id-ID')} lain di ${p.district} selain ${p.name}?`, a: `Ada. Di direktori VisitGarut, ${opts.categoryName.toLocaleLowerCase('id-ID')} lain di Kecamatan ${p.district} antara lain ${nearby.join(', ')}. Daftar lengkapnya ada di halaman kecamatan ${p.district}.` })
  out.push({ q: `Seberapa baru informasi ${p.name} di VisitGarut?`, a: `${info?.checkedAt ? `Tarif dan catatan kunjungan diperiksa ${longDate(info.checkedAt)} dari ${info.publisher}. ` : ''}Halaman ini terakhir diperbarui ${longDate(p.updated_at)}. Informasi operasional bisa berubah; kirim koreksi lewat bagian "Info di sini tidak sesuai?" bila menemukan perbedaan.` })
  return out
}

export type CategoryStats = { total: number; districts: { name: string; n: number }[]; ticketed: { name: string; slug: string; amount: number; checkedAt: string }[]; free: number }

/** Category Q&A from live directory counts. */
export function categoryFaq(c: { slug: string; name: string; unit: string }, s: CategoryStats): Faq[] {
  if (!s.total) return []
  const label = c.name.toLocaleLowerCase('id-ID')
  const out: Faq[] = []
  const top = s.districts.slice(0, 6).map(d => `${d.name} (${d.n})`)
  out.push({ q: `Ada berapa ${c.unit} ${label} di Garut yang tercatat di VisitGarut?`, a: `Saat ini ${s.total} ${c.unit} ${label} sudah terbit di direktori VisitGarut${s.districts.length ? `, tersebar di ${s.districts.length} kecamatan${top.length ? `: ${top.join(', ')}${s.districts.length > top.length ? ', dan lainnya' : ''}` : ''}` : ''}. Daftar ini terus bertambah setelah setiap tempat diperiksa.` })
  if (c.slug === 'wisata' && s.ticketed.length) {
    const list = s.ticketed.slice(0, 5).map(t => `${t.name} (${t.amount === 0 ? 'gratis' : 'mulai ' + rupiah(t.amount)}, dicek ${longDate(t.checkedAt)})`)
    out.push({ q: 'Tempat wisata mana yang tarifnya sudah dicek?', a: `${list.join('; ')}. Tarif yang lebih dari 30 hari ditandai perlu konfirmasi ulang.` })
  }
  out.push({ q: `Bagaimana VisitGarut memeriksa informasi ${label}?`, a: 'Setiap halaman tempat menyebut sumber informasinya dan tanggal pemeriksaan. Tarif, jam buka, dan titik peta yang belum pasti ditandai "perlu konfirmasi", bukan ditebak.' })
  out.push({ q: 'Apakah urutan tempat di VisitGarut bisa dibayar?', a: 'Tidak. Urutan di direktori dan skor dari pengunjung tidak bisa dibeli oleh pemilik usaha.' })
  return out
}

export function faqJsonLd(items: Faq[]) {
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }
}
