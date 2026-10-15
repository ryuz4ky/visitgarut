import Link from 'next/link'
import {notFound} from 'next/navigation'
import DirectoryPagination from '@/components/mvp/DirectoryPagination'
import {parseDirectoryFilters,parseDirectoryPage,directoryPageSize,directoryPageHref} from '@/lib/mvp/search'
import { Search as SearchIcon, SlidersHorizontal } from 'lucide-react'
import { Shell, PlaceGrid, Breadcrumbs, CategoryNav } from '@/components/mvp/Shell'
import { directoryPlaces,directorySummary, categories } from '@/lib/mvp/data'
export const dynamic = 'force-dynamic'
type SearchParams=Promise<Record<string,string|string[]|undefined>>
export async function generateMetadata({searchParams}:{searchParams:SearchParams}){
  const raw=await searchParams
  return {title:'Cari tempat di Garut',robots:{index:false,follow:true},alternates:{canonical:directoryPageHref('/search',parseDirectoryPage(raw.page)||1,parseDirectoryFilters(raw))}}
}
export default async function Search({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams
  const page=parseDirectoryPage(raw.page)
  if(page===null)notFound()
  const filters=parseDirectoryFilters(raw)
  const {query:q='',category='',district='',sort='relevant'}=filters
  const [result,summary]=await Promise.all([directoryPlaces(filters,page),directorySummary()])
  if(page>result.pages)notFound()
  const {items,total,pages}=result
  const {districts}=summary
  const filtered = Boolean(q || category || district)
  const cat=categories.find(c=>c.slug===category)
  return <Shell><section className="vg-wrap vg-section"><Breadcrumbs items={[{ name: 'Cari tempat', path: '/search' }]}/><span className="vg-eyebrow">JELAJAHI GARUT</span><h1>Temukan pilihanmu</h1><p className="vg-intro">Cari tempat atau layanan, pilih wilayah, lalu baca informasi sebelum berangkat.</p>
    <form className="vg-search-panel" action="/search"><label className="vg-search-field">Nama tempat, layanan, atau kata kunci<div><SearchIcon size={20}/><input name="q" defaultValue={q} placeholder="Misalnya: pantai, Papandayan, rental motor…" maxLength={120}/></div></label><div className="vg-search-filters"><label>Kategori<select name="category" defaultValue={category}><option value="">Semua kategori</option>{categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label><label>Wilayah<select name="district" defaultValue={district}><option value="">Semua wilayah</option>{district && !districts.includes(district) && <option value={district}>{district}</option>}{districts.map(d => <option key={d} value={d}>{d}</option>)}</select></label><label>Urutkan<select name="sort" defaultValue={sort}><option value="relevant">Paling sesuai</option><option value="name">Nama A–Z</option><option value="latest">Baru diperbarui</option></select></label><button className="vg-button" type="submit"><SlidersHorizontal size={17}/>Cari tempat</button></div></form>
    <div className="vg-results-heading"><p className="vg-count" role="status"><strong>{total} {cat?.unit||'listing'}</strong>{q ? ` untuk “${q}”` : ''}{cat ? ` · ${cat.name}` : ''}{district ? ` · ${district}` : ''}{total>0&&<span> · Menampilkan {(page-1)*directoryPageSize+1}–{(page-1)*directoryPageSize+items.length}</span>}</p>{filtered && <Link href="/search">Hapus semua filter</Link>}</div>
    {items.length ? <PlaceGrid items={items}/> : <div className="vg-empty"><SearchIcon size={30}/><h2>Belum menemukan hasil yang sesuai</h2><p>Coba kata yang lebih singkat atau perluas wilayah dan kategori.</p>{cat&&<Link className="vg-button" href={`/${cat.slug}`}>Lihat semua {cat.name.toLocaleLowerCase('id-ID')}</Link>}<Link className={cat?'vg-empty-alternative':'vg-button'} href="/search">Jelajahi semua {summary.total} listing</Link></div>}
    <DirectoryPagination path="/search" page={page} pages={pages} filters={filters}/>
    <div className="vg-category-followup"><h2>Jelajahi kategori lain</h2><CategoryNav active={category} query={q} district={district} sort={sort}/></div>
  </section></Shell>
}
