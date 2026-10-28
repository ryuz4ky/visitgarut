import Link from 'next/link'
import {notFound} from 'next/navigation'
import DirectoryPagination from '@/components/mvp/DirectoryPagination'
import {parseDirectoryFilters,parseDirectoryPage,directoryPageSize,directoryPageHref} from '@/lib/mvp/search'
import { Search as SearchIcon } from 'lucide-react'
import {DirectoryHero,FilterPanel} from '@/components/mvp/Directory'
import { Shell, PlaceGrid, Breadcrumbs } from '@/components/mvp/Shell'
import { directoryPlaces,directorySummary, categories } from '@/lib/mvp/data'
import {ratingVisible} from '@/lib/rating/server'
import {cardRatings} from '@/lib/rating/home'
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
  const ratings=await ratingVisible()?await cardRatings(items.map(p=>p.id)):undefined
  const {districts}=summary
  const filtered = Boolean(q || category || district)
  const cat=categories.find(c=>c.slug===category)
  return <Shell><section className="vg-wrap vx-page"><Breadcrumbs items={[{ name: 'Jelajahi', path: '/search' }]}/>
    <DirectoryHero title={cat?`${cat.name} di Garut.`:'Jelajahi Garut.'} filters={{query:q,district,sort}} active={category} placeholder="Misalnya: pantai, Papandayan, rental motor…"/>
    <div className="vx-layout">
     <FilterPanel filters={filters} districts={districts}/>
     <div className="vx-results">
      <div className="vx-results-head"><p className="vx-count" role="status"><strong>{total} {cat?.unit||'tempat'}</strong>{q ? ` untuk “${q}”` : ''}{cat ? ` · ${cat.name}` : ''}{district ? ` · ${district}` : ''}{total>0&&<span> · menampilkan {(page-1)*directoryPageSize+1}–{(page-1)*directoryPageSize+items.length}</span>}</p>{filtered && <Link className="vx-clear" href="/search">Hapus semua filter</Link>}</div>
      {items.length ? <PlaceGrid items={items} ratings={ratings}/> : <div className="vg-empty"><SearchIcon size={30}/><h2>Belum menemukan hasil yang sesuai</h2><p>Coba kata yang lebih singkat atau perluas wilayah dan kategori.</p>{cat&&<Link className="vg-button" href={`/${cat.slug}`}>Lihat semua {cat.name.toLocaleLowerCase('id-ID')}</Link>}<Link className={cat?'vg-empty-alternative':'vg-button'} href="/search">Jelajahi semua {summary.total} listing</Link></div>}
      <DirectoryPagination path="/search" page={page} pages={pages} filters={filters}/>
     </div>
    </div>
  </section></Shell>
}
