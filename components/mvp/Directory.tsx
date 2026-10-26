import Link from 'next/link'
import {Search,SlidersHorizontal,RotateCcw} from 'lucide-react'
import {categories} from '@/lib/mvp/categories'
import {categoryHref,type DirectoryFilters} from '@/lib/mvp/categories'

/** Page head for the directory: big title, pill search, and category chips (artboard 02 / M2). */
export function DirectoryHero({title,intro,filters={},active='',placeholder}:{title:string;intro?:string;filters?:DirectoryFilters;active?:string;placeholder?:string}){
 const {query='',district='',sort=''}=filters
 return <div className="vx-hero">
  <h1>{title}</h1>
  {intro&&<p className="vx-intro">{intro}</p>}
  <form className="vx-search" action="/search" role="search">
   <Search size={20} aria-hidden="true"/>
   <label className="sr-only" htmlFor="vx-q">Cari nama tempat, layanan, atau daerah</label>
   <input id="vx-q" name="q" type="search" defaultValue={query} maxLength={120} placeholder={placeholder||'Cari tempat, rental, atau daerah…'}/>
   {active&&<input type="hidden" name="category" value={active}/>}
   {district&&<input type="hidden" name="district" value={district}/>}
   {sort&&sort!=='relevant'&&<input type="hidden" name="sort" value={sort}/>}
   <button type="submit">Cari</button>
  </form>
  <nav className="vx-chips" aria-label="Kategori tempat">
   <Link className={!active?'is-active':undefined} aria-current={!active?'page':undefined} href={categoryHref('',filters)}>Semua</Link>
   {categories.map(c=><Link key={c.slug} className={active===c.slug?'is-active':undefined} aria-current={active===c.slug?'page':undefined} href={categoryHref(c.slug,filters)}>{c.name}</Link>)}
  </nav>
 </div>
}

/** Filter card: the filters the directory actually supports (category, district, sort). */
export function FilterPanel({filters,districts}:{filters:DirectoryFilters&{category?:string};districts:string[]}){
 const {query='',category='',district='',sort='relevant'}=filters
 const active=Boolean(category||district||(sort&&sort!=='relevant'))
 return <aside className="vx-filter" aria-labelledby="vx-filter-title">
  <input className="vx-filter-toggle" type="checkbox" id="vx-filter-toggle" aria-label="Tampilkan filter"/>
  <label className="vx-filter-open" htmlFor="vx-filter-toggle"><SlidersHorizontal size={18} aria-hidden="true"/>Filter{active&&<span className="vx-filter-badge">{[category,district,sort&&sort!=='relevant'?sort:''].filter(Boolean).length}</span>}</label>
  <form action="/search">
   <div className="vx-filter-head"><h2 id="vx-filter-title"><SlidersHorizontal size={18} aria-hidden="true"/>Filter</h2>{active&&<Link href={query?`/search?q=${encodeURIComponent(query)}`:'/search'}><RotateCcw size={14} aria-hidden="true"/>Reset</Link>}</div>
   {query&&<input type="hidden" name="q" value={query}/>}
   <label>Kategori<select name="category" defaultValue={category}><option value="">Semua kategori</option>{categories.map(c=><option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
   <label>Wilayah<select name="district" defaultValue={district}><option value="">Seluruh Garut</option>{district&&!districts.includes(district)&&<option value={district}>{district}</option>}{districts.map(d=><option key={d} value={d}>{d}</option>)}</select></label>
   <label>Urutkan<select name="sort" defaultValue={sort}><option value="relevant">Paling sesuai</option><option value="name">Nama A–Z</option><option value="latest">Baru diperbarui</option></select></label>
   <button className="vg-button" type="submit">Terapkan filter</button>
   <p className="vx-filter-note">Tarif dan jam buka ditampilkan bila sumbernya sudah diperiksa. Yang belum, ditandai di setiap kartu.</p>
  </form>
 </aside>
}
