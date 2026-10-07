import Link from 'next/link'
import { Search as SearchIcon, SlidersHorizontal } from 'lucide-react'
import { Shell, PlaceGrid, Breadcrumbs, CategoryNav } from '@/components/mvp/Shell'
import { places, categories } from '@/lib/mvp/data'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Cari tempat di Garut', robots: { index: false, follow: true } }
export default async function Search({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams
  const q = typeof raw.q === 'string' ? raw.q.trim().slice(0, 120) : ''
  const category = typeof raw.category === 'string' && categories.some(c => c.slug === raw.category) ? raw.category : ''
  const district = typeof raw.district === 'string' ? raw.district.slice(0, 120) : ''
  const sort = raw.sort === 'latest' ? 'latest' : raw.sort === 'name' ? 'name' : 'relevant'
  const [items, all] = await Promise.all([places({ query: q, category, district, sort }), places()])
  const districts = [...new Set(all.map(p => p.district).filter(Boolean))].sort()
  const filtered = Boolean(q || category || district)
  const cat=categories.find(c=>c.slug===category)
  return <Shell><section className="vg-wrap vg-section"><Breadcrumbs items={[{ name: 'Cari tempat', path: '/search' }]}/><span className="vg-eyebrow">JELAJAHI GARUT</span><h1>Temukan pilihanmu</h1><p className="vg-intro">Cari tempat atau layanan, pilih wilayah, lalu baca informasi sebelum berangkat.</p>
    <CategoryNav active={category} query={q} district={district} sort={sort}/>
    <form className="vg-search-panel" action="/search"><label className="vg-search-field">Nama tempat, layanan, atau kata kunci<div><SearchIcon size={20}/><input name="q" defaultValue={q} placeholder="Misalnya: pantai, Papandayan, rental motor…" maxLength={120}/></div></label><div className="vg-search-filters"><label>Kategori<select name="category" defaultValue={category}><option value="">Semua kategori</option>{categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label><label>Wilayah<select name="district" defaultValue={district}><option value="">Semua wilayah</option>{district && !districts.includes(district) && <option value={district}>{district}</option>}{districts.map(d => <option key={d} value={d}>{d}</option>)}</select></label><label>Urutkan<select name="sort" defaultValue={sort}><option value="relevant">Paling sesuai</option><option value="name">Nama A–Z</option><option value="latest">Baru diperbarui</option></select></label><button className="vg-button" type="submit"><SlidersHorizontal size={17}/>Cari tempat</button></div></form>
    <div className="vg-results-heading"><p className="vg-count" role="status"><strong>{items.length} {cat?.unit||'listing'}</strong>{q ? ` untuk “${q}”` : ''}{cat ? ` · ${cat.name}` : ''}{district ? ` · ${district}` : ''}</p>{filtered && <Link href="/search">Hapus semua filter</Link>}</div>
    {items.length ? <PlaceGrid items={items}/> : <div className="vg-empty"><SearchIcon size={30}/><h2>Belum menemukan hasil yang sesuai</h2><p>Coba kata yang lebih singkat atau perluas wilayah dan kategori.</p>{cat&&<Link className="vg-button" href={`/${cat.slug}`}>Lihat semua {cat.name.toLocaleLowerCase('id-ID')}</Link>}<Link className={cat?'vg-empty-alternative':'vg-button'} href="/search">Jelajahi semua {all.length} listing</Link></div>}
  </section></Shell>
}
