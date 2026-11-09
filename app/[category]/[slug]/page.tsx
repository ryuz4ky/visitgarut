import PracticalPanel from '@/components/visit/PracticalPanel'
import Link from 'next/link'
import SaveButton from '@/components/saved/SaveButton'
import CommunityPulse from '@/components/pulse/CommunityPulse'
import { pulseForPlace } from '@/lib/pulse/data'
import { notFound } from 'next/navigation'
import { MapPin,ExternalLink,ArrowUpRight } from 'lucide-react'
import PlaceEstimator from '@/components/visit/PlaceEstimator'
import {compactRupiah,knownTicket,shortDate} from '@/lib/mvp/format'
import { Shell,Breadcrumbs,TextContent,JsonLd,PlaceGrid,ArticleCard,date } from '@/components/mvp/Shell'
import { place,relatedPlaceSuggestions,relatedArticles,categories } from '@/lib/mvp/data'
import { absoluteUrl } from '@/lib/site'
import {eligibleTripPlace,tripCategories} from '@/lib/trip/planner'
import {hasCoordinates} from '@/lib/mvp/nearby'
import {publicCoordinateReference} from '@/lib/mvp/coordinate-reference'
import RatingPanel from '@/components/rating/RatingPanel'
import {placeRating} from '@/lib/rating/store'
import {ratingVisible,ratingPreviewNote,ratingEnabled} from '@/lib/rating/server'
import {sectorPeers} from '@/lib/rating/store'
import {boardRow} from '@/lib/rating/home'
import {ScoreRing,PreviewNote} from '@/components/rating/bits'
import {tierLabels} from '@/lib/rating/core'
import {db} from '@/lib/mvp/db'
export const dynamic='force-dynamic'
export async function generateMetadata({params}:{params:Promise<{category:string;slug:string}>}){const {category,slug}=await params;const p=await place(slug,category);return p?{title:`${p.name}${p.district?', '+p.district:''} — ${categories.find(c=>c.slug===category)?.name||'Panduan Garut'}`,description:p.excerpt,alternates:{canonical:`/${category}/${slug}`},openGraph:{title:p.name,description:p.excerpt,url:absoluteUrl(`/${category}/${slug}`),images:[p.image_url?(p.image_url.startsWith('/')?absoluteUrl(p.image_url):p.image_url):absoluteUrl('/opengraph-image.png')]}}:{title:'Tempat tidak ditemukan',robots:{index:false}}}
export default async function Detail({params}:{params:Promise<{category:string;slug:string}>}){const {category,slug}=await params;if(!categories.some(c=>c.slug===category))notFound();const p=await place(slug,category);if(!p)notFound();const [other,guides,community]=await Promise.all([relatedPlaceSuggestions(p.id),relatedArticles(p.id),pulseForPlace(p.id)]);const rating=await ratingVisible()?await placeRating(db(),p.id,new Date()).catch(()=>null):null;const peers=rating?(await sectorPeers(db(),p.id,rating.sector,new Date()).catch(()=>[])).map(boardRow):[];const c=categories.find(x=>x.slug===category)!;const rental=category==='transportasi';const coordinateRef=publicCoordinateReference(p);const infoTitle=rental?'Layanan & pemesanan':'Info kunjungan';const schemaType=category==='wisata'?'TouristAttraction':category==='hotel'?'Hotel':category==='kuliner'?'Restaurant':category==='cafe'?'CafeOrCoffeeShop':'LocalBusiness';const ticket=knownTicket(p.practical);const checked=p.practical?.checkedAt?shortDate(p.practical.checkedAt):'';const plannable=eligibleTripPlace(p)&&(tripCategories as readonly string[]).includes(p.category)
 const facts=[
  category==='wisata'?{label:'Tiket dewasa',value:ticket===null?'Perlu konfirmasi':ticket===0?'Gratis':`mulai ${compactRupiah(ticket)}`,warn:ticket===null}:{label:'Kategori',value:c.name,warn:false},
  {label:'Wilayah',value:p.district||'Garut',warn:false},
  {label:'Jam buka',value:p.practical?.hoursNote?'Lihat catatan':'Perlu konfirmasi',warn:!p.practical?.hoursNote},
  {label:'Diperiksa',value:checked||shortDate(p.updated_at),warn:false},
 ]
 return <Shell><JsonLd data={{'@context':'https://schema.org','@type':schemaType,'@id':absoluteUrl(`/${category}/${slug}#place`),name:p.name,description:p.excerpt,url:absoluteUrl(`/${category}/${slug}`),address:{'@type':'PostalAddress',streetAddress:p.address,addressLocality:p.district,addressRegion:'Jawa Barat',addressCountry:'ID'},...(p.latitude!==null&&p.longitude!==null?{geo:{'@type':'GeoCoordinates',latitude:p.latitude,longitude:p.longitude}}:{}),...(p.image_url?{image:p.image_url.startsWith('/')?absoluteUrl(p.image_url):p.image_url}:{}),...(p.whatsapp?{telephone:p.whatsapp}:{}),...(category==='wisata'&&ticket===0?{isAccessibleForFree:true,publicAccess:true}:{}),...(p.website?{sameAs:[p.website]}:{}),...(ratingEnabled()&&rating&&rating.score!==null&&rating.reviewers>=3?{aggregateRating:{'@type':'AggregateRating',ratingValue:Number(rating.score.toFixed(1)),bestRating:5,worstRating:1,ratingCount:rating.reviewers}}:{}),containedInPlace:{'@type':'AdministrativeArea',name:'Kabupaten Garut, Jawa Barat'}}}/>
 <section className="vp-hero-wrap"><div className={p.image_url?'vp-hero':'vp-hero is-plain'}>
  {p.image_url&&<img className="vp-hero-img" src={p.image_url} alt={p.name} width={1600} height={900} fetchPriority="high"/>}
  <div className="vp-hero-shade" aria-hidden="true"/>
  <div className="vp-hero-top"><Breadcrumbs items={[{name:c.name,path:`/${category}`},{name:p.name,path:`/${category}/${slug}`}]}/></div>
  <div className="vp-hero-bottom">
   <div className="vp-hero-copy">
    <h1>{p.name}</h1>
    <div className="vp-badges">{checked&&<span className="vp-badge is-light"><i aria-hidden="true"/>Dicek {checked}</span>}<span className="vp-badge"><MapPin size={14} aria-hidden="true"/>{p.district?p.district+', Garut':'Melayani Garut'}</span><span className="vp-badge">{c.name}</span>{rating&&rating.score!==null&&<a className="vp-badge vp-badge-rating" href="#rating"><ScoreRing score={rating.score} tier={rating.tier} size="sm"/>{tierLabels[rating.tier]} · {rating.reviewers} pengunjung</a>}</div>
   </div>
   <div className="vp-hero-actions"><SaveButton id={p.id} name={p.name}/>{plannable&&<Link className="vg-pill-cta" href={`/trip?add=${p.id}`}>Tambah ke rencana<span className="vg-pill-cta-icon"><ArrowUpRight size={18} aria-hidden="true"/></span></Link>}</div>
  </div>
  {p.image_url&&p.image_credit&&<small className="vp-credit">Foto: {p.image_credit}</small>}
 </div></section>
 <div className="vg-wrap vp-layout">
  <div className="vp-main">
   <section className="vp-facts" aria-label="Ringkasan">{facts.map(f=><div key={f.label}><span>{f.label}</span><strong className={f.warn?'is-warn':undefined}>{f.value}</strong></div>)}</section>
   {p.excerpt&&<p className="vp-lead">{p.excerpt}</p>}
   <nav className="vg-detail-nav" aria-label="Bagian informasi tempat">{category==='wisata'&&<a href="#praktis">Sebelum memilih</a>}<a href="#tentang-tempat">{rental?'Tentang penyedia':'Tentang tempat'}</a><a href="#info-kunjungan">{infoTitle}</a>{rating&&<a href="#rating">Skor &amp; ulasan</a>}<a href="#community-pulse">Info &amp; pengalaman</a></nav>
   <PracticalPanel place={p} research={community.research}/>
   <article className="vp-card" id="tentang-tempat"><h2>{rental?'Tentang penyedia':'Tentang tempat'}</h2><TextContent content={p.content}/>{p.source_url&&<p className="vg-source"><a href={p.source_url} target="_blank" rel="noopener noreferrer">Baca sumber informasi <ExternalLink size={14}/></a></p>}<small>Diperbarui {date(p.updated_at)}</small></article>
   {rating&&<><PreviewNote note={ratingPreviewNote()}/><RatingPanel rating={rating} peers={peers}/></>}
   <CommunityPulse globeEnabled key={p.id} pulse={community.pulse} placeId={p.id} research={community.research} contents={community.contents} youtubeAvailable={community.youtubeAvailable} rental={rental}/>
  </div>
  <aside className="vp-aside">
   {category==='wisata'&&<PlaceEstimator placeId={p.id} name={p.name} practical={p.practical||null} whatsapp={p.whatsapp} plannable={plannable}/>}
   <div className="vp-card vp-info" id="info-kunjungan"><h2>{infoTitle}</h2>{coordinateRef&&<div className="vg-coordinate-source"><strong>Rujukan titik peta</strong><p>{coordinateRef.note}</p><a href={coordinateRef.source_url} target="_blank" rel="noopener noreferrer">{coordinateRef.publisher} ↗</a><small>Diperiksa {date(coordinateRef.checked_at)} · pemeriksaan sumber daring</small></div>}<p><strong>{rental?'Alamat / area layanan':'Lokasi'}</strong><br/>{p.address||(rental?'Melayani Garut. Konfirmasi titik pengambilan atau pengantaran kendaraan.':p.district+', Garut')}</p><p><strong>{rental?'Tarif & ketersediaan':category==='hotel'?'Tarif & ketersediaan kamar':category==='paket-wisata'?'Tarif & jadwal perjalanan':category==='wisata'?'Tiket & jam buka':'Menu & jam buka'}</strong><br/>{rental?'Sebutkan tanggal dan durasi sewa. Tanyakan biaya total, sopir atau lepas kunci, serta syarat pemesanan.':'Konfirmasi informasi terbaru kepada pengelola.'}</p>
    <div className="vp-info-actions">{p.whatsapp&&category!=='wisata'&&<a className="vg-button" href={`https://wa.me/${p.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer">{rental?'Tanya ketersediaan via WhatsApp':'Hubungi via WhatsApp'}</a>}{(!rental||p.address)&&<a className="vg-button vg-secondary" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name+' Garut')}${p.google_place_id?'&query_place_id='+encodeURIComponent(p.google_place_id):''}`} target="_blank" rel="noopener noreferrer">Cari rute ke lokasi</a>}{plannable&&category!=='wisata'&&<Link className="vg-button" href={`/trip?start=${p.id}`}>Mulai itinerary dari sini</Link>}</div>
    <div className="vp-info-links">{p.website&&<a href={p.website} target="_blank" rel="noopener noreferrer">{rental?'Lihat situs penyedia':'Website pengelola'} ↗</a>}<Link href={hasCoordinates(p)?`/map?place=${p.id}`:`/map?category=${p.category}`}>{hasCoordinates(p)?'Lihat tempat di sekitar':'Lihat peta VisitGarut'} ↗</Link></div>
   </div>
   <div className="vp-report"><strong>Info di sini tidak sesuai?</strong><p>Kirim koreksi atau pengalamanmu. Laporan diperiksa sebelum mengubah informasi yang tampil.</p><a href="#community-pulse">Laporkan perubahan</a></div>
  </aside>
 </div>
 {guides.length>0&&<section className="vg-wrap vg-section"><div className="vg-section-heading"><div><span className="vg-eyebrow">PANDUAN</span><h2>Panduan terkait</h2></div></div><div className="vg-article-grid">{guides.map(a=><ArticleCard key={a.id} item={a}/>)}</div></section>}
 {other.length>0&&<section className="vg-wrap vg-section"><div className="vg-section-heading"><div><span className="vg-eyebrow">DI SEKITARNYA</span><h2>{rental?'Penyedia rental lainnya':'Jelajahi tempat lain'}</h2><p className="vg-heading-note">Pilihan dalam kategori yang sama, mengutamakan wilayah yang sama. Jika titik peta tersedia, urutannya mempertimbangkan kedekatan garis lurus, bukan jarak perjalanan.</p></div></div><PlaceGrid items={other}/></section>}
 </Shell>}
