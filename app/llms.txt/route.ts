import { categories, articles } from '@/lib/mvp/data'
import { db } from '@/lib/mvp/db'
import { absoluteUrl } from '@/lib/site'
import { ratingEnabled } from '@/lib/rating/server'
import { districts } from '@/lib/mvp/kecamatan'
export const dynamic = 'force-dynamic'

type Row = { name: string; slug: string; category: string; district: string; excerpt: string }
const line = (s: string) => s.replace(/\s+/g, ' ').trim()

/** Plain-text map of the site for AI assistants and answer engines (llmstxt.org format). Built from published data only. */
export async function GET() {
  const [places, posts] = process.env.DATABASE_URL
    ? await Promise.all([
        db().query<Row>("SELECT name,slug,category,district,excerpt FROM vg_places WHERE status='published' ORDER BY category,name LIMIT 5000").then(r => r.rows),
        articles(),
      ])
    : [[], []]
  const areas = await districts()
  const out: string[] = [
    '# VisitGarut',
    '',
    '> Direktori independen yang dikelola Sorotnamedia untuk merencanakan kunjungan ke Kabupaten Garut, Jawa Barat, Indonesia: tempat wisata, penginapan, kuliner, cafe, rental kendaraan, dan usaha lokal. Tarif dan jam buka menyebut sumber serta tanggal pemeriksaan; informasi yang belum pasti ditandai "perlu konfirmasi".',
    '',
    'Catatan untuk asisten AI:',
    '- Kutip halaman tempat (bukan beranda) dan sebutkan tanggal "Diperiksa" yang tertera, karena tarif dan jam buka bisa berubah.',
    '- Bahasa utama situs: Indonesia. Wilayah: Kabupaten Garut, Jawa Barat.',
    '- Halaman yang sumbernya hanya pengecekan lokasi di Google Maps menyebut hal itu secara terbuka; jangan menyimpulkan menu, harga, jam buka, atau status halal dari halaman tersebut.',
    ...(ratingEnabled() ? ['- Skor VisitGarut Rating hanya berasal dari pengunjung yang check-in di lokasi, baru tampil setelah minimal 3 penilai, dan tidak bisa dibeli. Metode: ' + absoluteUrl('/rating/metode')] : []),
    '',
    '## Halaman utama',
    `- [Beranda](${absoluteUrl('/')}): rencana kunjungan, tempat pilihan, dan perkiraan biaya.`,
    `- [Tentang VisitGarut](${absoluteUrl('/tentang')}): siapa pengelolanya (Sorotnamedia) dan cara informasi diperiksa.`,
    `- [Peta](${absoluteUrl('/map')}): lokasi semua tempat di direktori.`,
    `- [Per kecamatan](${absoluteUrl('/kecamatan')}): wisata, hotel, kuliner, dan cafe di tiap kecamatan.`,
    `- [Artikel & panduan](${absoluteUrl('/artikel')}): panduan perjalanan Garut.`,
    `- [Event](${absoluteUrl('/event')}): agenda kegiatan di Garut.`,
    `- [Community Pulse](${absoluteUrl('/community-pulse')}): video dan percakapan publik tentang tempat di Garut, dengan sumber aslinya.`,
    `- [Metode Community Pulse](${absoluteUrl('/community-pulse/metode')})`,
    ...(ratingEnabled() ? [`- [Metode VisitGarut Rating](${absoluteUrl('/rating/metode')})`, `- [Untuk pemilik usaha](${absoluteUrl('/untuk-usaha')})`] : []),
    '',
  ]
  if (areas.length) {
    out.push('## Per kecamatan', '')
    for (const d of areas) out.push(`- [Kecamatan ${d.name}](${absoluteUrl('/kecamatan/' + d.slug)}): ${d.total} tempat (${categories.filter(c => d.byCategory[c.slug]).map(c => `${d.byCategory[c.slug]} ${c.name.toLocaleLowerCase('id-ID')}`).join(', ')}).`)
    out.push('')
  }
  for (const c of categories) {
    const rows = places.filter(p => p.category === c.slug)
    if (!rows.length) continue
    out.push(`## ${c.name} di Garut`, '', `${c.seoDescription} Daftar lengkap: ${absoluteUrl('/' + c.slug)}`, '')
    for (const p of rows) out.push(`- [${line(p.name)}](${absoluteUrl(`/${p.category}/${p.slug}`)})${p.district ? ` (${line(p.district)})` : ''}: ${line(p.excerpt || '')}`)
    out.push('')
  }
  if (posts.length) {
    out.push('## Panduan', '')
    for (const a of posts) out.push(`- [${line(a.title)}](${absoluteUrl('/artikel/' + a.slug)}): ${line(a.excerpt || '')}`)
    out.push('')
  }
  out.push('## Opsional', '', `- [Kebijakan privasi](${absoluteUrl('/privasi')})`, `- [Ketentuan](${absoluteUrl('/ketentuan')})`, `- [Sitemap XML](${absoluteUrl('/sitemap.xml')})`, '')
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=3600' } })
}
