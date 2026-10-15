import { notFound } from 'next/navigation'
import Link from 'next/link'
import DirectoryPagination from '@/components/mvp/DirectoryPagination'
import {parseDirectoryPage,directoryPageSize,directoryPageHref} from '@/lib/mvp/search'
import { Car, Bike, Compass } from 'lucide-react'
import { Shell,CategoryNav,SearchForm,PlaceGrid,Breadcrumbs } from '@/components/mvp/Shell'
import { categories,directoryPlaces } from '@/lib/mvp/data'
export const dynamic='force-dynamic'
type CategoryProps={params:Promise<{category:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}
export async function generateMetadata({params,searchParams}:CategoryProps){
  const [{category},raw]=await Promise.all([params,searchParams])
  const c=categories.find(x=>x.slug===category),page=parseDirectoryPage(raw.page)
  return c&&page!==null?{title:`${c.name} di Garut${page>1?` — Halaman ${page}`:''}`,description:c.description,alternates:{canonical:directoryPageHref(`/${category}`,page)}}:{title:'Halaman tidak ditemukan',robots:{index:false}}
}
export default async function Category({params,searchParams}:CategoryProps) {
  const {category}=await params
  const c=categories.find(x=>x.slug===category)
  if(!c)notFound()
  const page=parseDirectoryPage((await searchParams).page)
  if(page===null)notFound()
  const {items,total,pages}=await directoryPlaces({category},page)
  if(page>pages)notFound()
  const rental=category==='transportasi'
  return <Shell><section className="vg-wrap vg-section">
    <Breadcrumbs items={[{name:c.name,path:`/${category}`}]}/><span className="vg-eyebrow">JELAJAHI GARUT</span><h1>{c.name} di Garut</h1><p className="vg-intro">{c.description}</p>
    {!rental&&<CategoryNav active={category}/>}<SearchForm category={category}/>
    {rental&&<div className="vg-rental-options" aria-label="Jenis kendaraan"><Link href="/search?category=transportasi&q=mobil"><Car size={18}/>Rental mobil</Link><Link href="/search?category=transportasi&q=motor"><Bike size={18}/>Rental motor</Link><Link href="/search?category=transportasi&q=rombongan"><Compass size={18}/>Kendaraan rombongan</Link></div>}
    <div className="vg-results-heading"><p className="vg-count" role="status"><strong>{total} {c.unit}</strong> dalam direktori{total>0&&<span> · Menampilkan {(page-1)*directoryPageSize+1}–{(page-1)*directoryPageSize+items.length}</span>}</p></div>
    {rental&&items.length>0&&<p className="vg-heading-note vg-rental-note">Profil dirangkum dari situs penyedia. Tarif dan ketersediaan perlu dikonfirmasi langsung.</p>}
    {items.length?<PlaceGrid items={items}/>:<div className="vg-empty"><Compass size={30}/><h2>{rental?'Belum ada penyedia rental yang dipublikasikan':`Belum ada listing ${c.name.toLocaleLowerCase('id-ID')}`}</h2><p>{rental?'Direktori rental belum terisi. Penyedia akan ditampilkan setelah informasi layanan dan sumber kontaknya diperiksa.':'Kategori ini tetap tersedia. Listing akan ditampilkan setelah informasi dan sumbernya diperiksa.'}</p><Link className="vg-button" href="/search">Jelajahi kategori lain</Link></div>}
    <DirectoryPagination path={`/${category}`} page={page} pages={pages}/>
    {rental&&<details className="vg-rental-guide"><summary>Yang perlu ditanyakan sebelum menyewa</summary><ul><li>Tanggal, durasi, jenis kendaraan, dan jumlah penumpang.</li><li>Total biaya, termasuk sopir, bahan bakar, pengantaran, dan kelebihan waktu.</li><li>Syarat lepas kunci, deposit, titik serah terima, dan ketentuan pembatalan.</li></ul></details>}
    {rental&&<div className="vg-category-followup"><h2>Jelajahi kategori lain</h2><CategoryNav active={category}/></div>}
  </section></Shell>
}
