import { notFound } from 'next/navigation'
import Link from 'next/link'
import DirectoryPagination from '@/components/mvp/DirectoryPagination'
import {parseDirectoryPage,directoryPageSize,directoryPageHref} from '@/lib/mvp/search'
import { Car, Bike, Compass } from 'lucide-react'
import { Shell,CategoryNav,PlaceGrid,Breadcrumbs } from '@/components/mvp/Shell'
import {DirectoryHero} from '@/components/mvp/Directory'
import { categories,directoryPlaces } from '@/lib/mvp/data'
import TopList from '@/components/rating/TopList'
import {PreviewNote} from '@/components/rating/bits'
import {ratingVisible,ratingPreviewNote} from '@/lib/rating/server'
import {boardRow,cardRatings,sectorShort} from '@/lib/rating/home'
import {topRated} from '@/lib/rating/store'
import {aspectsForSector,sectorForCategory,sectors} from '@/lib/rating/core'
import {db} from '@/lib/mvp/db'
export const dynamic='force-dynamic'
type CategoryProps={params:Promise<{category:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}
export async function generateMetadata({params,searchParams}:CategoryProps){
  const [{category},raw]=await Promise.all([params,searchParams])
  const c=categories.find(x=>x.slug===category),page=parseDirectoryPage(raw.page)
  if(!c||page===null)return {title:'Halaman tidak ditemukan',robots:{index:false}}
  const {total}=await directoryPlaces({category},1)
  // Empty categories stay reachable for visitors but are kept out of search indexes until they have listings.
  return {title:`${c.name} di Garut${page>1?` — Halaman ${page}`:''}`,description:c.seoDescription,alternates:{canonical:directoryPageHref(`/${category}`,page)},...(total===0?{robots:{index:false,follow:true}}:{})}
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
  const visible=await ratingVisible()
  const sector=sectorForCategory(category)
  const [ratings,top]=visible?await Promise.all([cardRatings(items.map(p=>p.id)),topRated(db(),sector,new Date(),5).catch(()=>[])]):[undefined,[]]
  return <Shell><section className="vg-wrap vx-page vx-page-category">
    <Breadcrumbs items={[{name:c.name,path:`/${category}`}]}/>
    <DirectoryHero title={`${c.name} di Garut.`} intro={c.description} active={category} placeholder={rental?'Cari rental mobil, motor, atau penyedia…':undefined}/>
    {rental&&<div className="vg-rental-options" aria-label="Jenis kendaraan"><Link href="/search?category=transportasi&q=mobil"><Car size={18}/>Rental mobil</Link><Link href="/search?category=transportasi&q=motor"><Bike size={18}/>Rental motor</Link><Link href="/search?category=transportasi&q=rombongan"><Compass size={18}/>Kendaraan rombongan</Link></div>}
    {visible&&(top.length?<section className="vr-sector" aria-labelledby="vr-sector-title">
     <PreviewNote note={ratingPreviewNote()}/>
     <div className="vr-sector-head"><div><span className="vg-eyebrow">NILAI PENGUNJUNG · {sectors[sector].label.toLocaleUpperCase('id-ID')}</span><h2 id="vr-sector-title">Paling disukai pengunjung</h2></div>
      <p>Dibandingkan hanya dengan sesama {sectors[sector].label.toLocaleLowerCase('id-ID')}. Yang dinilai: {aspectsForSector(sector).map(a=>a.label.toLocaleLowerCase('id-ID')).join(', ')}.</p></div>
     <TopList rows={top.map(boardRow)}/>
    </section>:<div className="vr-sector-slim"><PreviewNote note={ratingPreviewNote()}/><span><strong>Nilai pengunjung segera hadir.</strong> Skor muncul setelah 3 pengunjung menilai lewat QR di lokasi. <Link href="/rating/metode">Cara kerjanya</Link></span></div>)}
    <div className="vg-results-heading"><p className="vg-count" role="status"><strong>{total} {c.unit}</strong> dalam direktori{total>0&&<span> · Menampilkan {(page-1)*directoryPageSize+1}–{(page-1)*directoryPageSize+items.length}</span>}</p></div>
    {rental&&items.length>0&&<p className="vg-heading-note vg-rental-note">Profil dirangkum dari situs penyedia. Tarif dan ketersediaan perlu dikonfirmasi langsung.</p>}
    {items.length?<PlaceGrid items={items} ratings={ratings}/>:<div className="vg-empty"><Compass size={30}/><h2>{rental?'Belum ada penyedia rental yang dipublikasikan':`Belum ada listing ${c.name.toLocaleLowerCase('id-ID')}`}</h2><p>{rental?'Direktori rental belum terisi. Penyedia akan ditampilkan setelah informasi layanan dan sumber kontaknya diperiksa.':'Kategori ini tetap tersedia. Listing akan ditampilkan setelah informasi dan sumbernya diperiksa.'}</p><Link className="vg-button" href="/search">Jelajahi kategori lain</Link></div>}
    <DirectoryPagination path={`/${category}`} page={page} pages={pages}/>
    {rental&&<details className="vg-rental-guide"><summary>Yang perlu ditanyakan sebelum menyewa</summary><ul><li>Tanggal, durasi, jenis kendaraan, dan jumlah penumpang.</li><li>Total biaya, termasuk sopir, bahan bakar, pengantaran, dan kelebihan waktu.</li><li>Syarat lepas kunci, deposit, titik serah terima, dan ketentuan pembatalan.</li></ul></details>}
    {rental&&<div className="vg-category-followup"><h2>Jelajahi kategori lain</h2><CategoryNav active={category}/></div>}
  </section></Shell>
}
