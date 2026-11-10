import PracticalPanel from '@/components/visit/PracticalPanel'
import Link from 'next/link'
import SaveButton from '@/components/saved/SaveButton'
import CommunityPulse from '@/components/pulse/CommunityPulse'
import { pulseForPlace } from '@/lib/pulse/data'
import { notFound } from 'next/navigation'
import { MapPin,ExternalLink,ArrowUpRight,Ticket,Clock,MessageCircle,Phone,Mountain,BedDouble,UtensilsCrossed,Coffee,Car,Store } from 'lucide-react'
import {isAreaPhoto} from '@/lib/mvp/photo'
import PlaceNav from '@/components/place/PlaceNav'
import StickyAside from '@/components/place/StickyAside'
import ActionBar,{type BarAction} from '@/components/place/ActionBar'
import PlaceEstimator from '@/components/visit/PlaceEstimator'
import {knownTicket,shortDate} from '@/lib/mvp/format'
import {currentPractical,tariffRows,rupiah} from '@/lib/visit/practical'
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
import FaqBlock from '@/components/mvp/Faq'
import {placeFaq} from '@/lib/mvp/faq'
export const dynamic='force-dynamic'
export async function generateMetadata({params}:{params:Promise<{category:string;slug:string}>}){const {category,slug}=await params;const p=await place(slug,category);return p?{title:`${p.name}${p.district?', '+p.district:''} — ${categories.find(c=>c.slug===category)?.name||'Panduan Garut'}`,description:p.excerpt,alternates:{canonical:`/${category}/${slug}`},openGraph:{title:p.name,description:p.excerpt,url:absoluteUrl(`/${category}/${slug}`),images:[p.image_url?(p.image_url.startsWith('/')?absoluteUrl(p.image_url):p.image_url):absoluteUrl('/opengraph-image.png')]}}:{title:'Tempat tidak ditemukan',robots:{index:false}}}
export default async function Detail({params}:{params:Promise<{category:string;slug:string}>}){const {category,slug}=await params;if(!categories.some(c=>c.slug===category))notFound();const p=await place(slug,category);if(!p)notFound();const [other,guides,community]=await Promise.all([relatedPlaceSuggestions(p.id),relatedArticles(p.id),pulseForPlace(p.id)]);const rating=await ratingVisible()?await placeRating(db(),p.id,new Date()).catch(()=>null):null;const peers=rating?(await sectorPeers(db(),p.id,rating.sector,new Date()).catch(()=>[])).map(boardRow):[];const c=categories.find(x=>x.slug===category)!;const rental=category==='transportasi';const coordinateRef=publicCoordinateReference(p);const infoTitle=rental?'Layanan & pemesanan':'Info kunjungan';const schemaType=category==='wisata'?'TouristAttraction':category==='hotel'?'Hotel':category==='kuliner'?'Restaurant':category==='cafe'?'CafeOrCoffeeShop':'LocalBusiness';const ticket=knownTicket(p.practical);const checked=p.practical?.checkedAt?shortDate(p.practical.checkedAt):'';const plannable=eligibleTripPlace(p)&&(tripCategories as readonly string[]).includes(p.category)
 const info=p.practical;const fresh=currentPractical(info)
 const rows=tariffRows(info).filter(r=>r.amount!==null)
 const ticketText=!rows.length?'Belum pasti. Tanyakan ke pengelola sebelum berangkat.':rows.every(r=>r.amount===0)?'Gratis':(fresh?'':'Terakhir tercatat ')+rows.slice(0,2).map(r=>`${r.amount===0?'gratis':rupiah(r.amount!)} (${r.label.toLocaleLowerCase('id-ID').replace('hari kerja','hari biasa')})`).join(', ')+(fresh?'':'. Perlu dicek ulang.')
 const hoursRange=info?.hoursNote?.match(/\d{1,2}[.:]\d{2}\s*[-–]\s*\d{1,2}[.:]\d{2}/)?.[0]?.replace(/\s*[-–]\s*/,'–')
 const phone=p.whatsapp?p.whatsapp.replace(/\D/g,'').replace(/^0/,'62'):''
 const phoneLabel=phone?'0'+phone.replace(/^62/,'').replace(/(\d{3})(\d{4})(\d+)/,'$1-$2-$3'):''
 const askText=p.whatsapp?`WhatsApp atau telepon ${phoneLabel}`:p.website?'Lewat situs resminya':'Datang langsung atau tanya warga sekitar'
 const gist=[
  ...(category==='wisata'?[{icon:Ticket,label:'Tiket masuk dewasa',text:ticketText}]:[]),
  ...(rental||category==='hotel'?[]:[{icon:Clock,label:'Jam buka',text:hoursRange?`${hoursRange} WIB, menurut sumber. Pastikan lagi sebelum berangkat.`:'Belum pasti. Tanyakan dulu sebelum berangkat.'}]),
  {icon:MapPin,label:rental?'Kantor / area layanan':'Lokasi',text:p.address||`${p.district||'Garut'}, Kabupaten Garut`},
  ...(category==='wisata'?[]:[{icon:MessageCircle,label:rental?'Cara memesan':category==='hotel'?'Tanya harga & kamar':'Tanya menu & harga',text:askText}]),
 ]
 const routeUrl=(!rental||p.address)?`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name+(p.district?' '+p.district:'')+' Garut')}${p.google_place_id?'&query_place_id='+encodeURIComponent(p.google_place_id):''}`:''
 const waText=rental?`Halo, saya ingin menanyakan ketersediaan kendaraan dari ${p.name}. Tanggal: …, durasi: …, jumlah penumpang: …. Mohon info biaya total dan syaratnya. Terima kasih.`:category==='hotel'?`Halo, saya ingin menanyakan tarif dan ketersediaan kamar di ${p.name} untuk tanggal …. Terima kasih.`:category==='wisata'?`Halo, saya ingin berkunjung ke ${p.name}. Mohon info jam buka dan tarif terbaru. Terima kasih.`:`Halo, saya ingin menanyakan menu, harga, dan jam buka ${p.name}. Terima kasih.`
 const waUrl=p.whatsapp?`https://wa.me/${p.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(waText)}`:''
 const bar:BarAction[]=[
  ...(routeUrl?[{kind:'route' as const,href:routeUrl,label:'Rute'}]:[]),
  ...(waUrl?[{kind:'whatsapp' as const,href:waUrl,label:rental?'Tanya via WhatsApp':'WhatsApp'}]:p.website?[{kind:'website' as const,href:p.website,label:'Situs'}]:[]),
  ...(plannable?[{kind:'plan' as const,href:`/trip?add=${p.id}`,label:'Tambah ke rencana'}]:[]),
 ]
 const links=[...(category==='wisata'?[{href:'#praktis',label:'Tiket & akses'}]:[]),{href:'#info-kunjungan',label:rental?'Pemesanan':'Lokasi & kontak'},{href:'#tentang-tempat',label:rental?'Tentang penyedia':'Tentang'},{href:'#tanya-jawab',label:'Tanya jawab'},...(rating?[{href:'#rating',label:'Skor'}]:[]),{href:'#community-pulse',label:'Info & pengalaman'}]
 const HeroIcon=({wisata:Mountain,hotel:BedDouble,kuliner:UtensilsCrossed,cafe:Coffee,transportasi:Car} as Record<string,typeof Store>)[category]||Store
 const hasMap=p.latitude!==null&&p.longitude!==null
 const bbox=hasMap?[p.longitude!-0.012,p.latitude!-0.007,p.longitude!+0.012,p.latitude!+0.007].map(n=>n.toFixed(5)).join(','):''
 return <Shell><JsonLd data={{'@context':'https://schema.org','@type':schemaType,'@id':absoluteUrl(`/${category}/${slug}#place`),name:p.name,description:p.excerpt,url:absoluteUrl(`/${category}/${slug}`),address:{'@type':'PostalAddress',streetAddress:p.address,addressLocality:p.district,addressRegion:'Jawa Barat',addressCountry:'ID'},...(p.latitude!==null&&p.longitude!==null?{geo:{'@type':'GeoCoordinates',latitude:p.latitude,longitude:p.longitude}}:{}),...(p.image_url?{image:p.image_url.startsWith('/')?absoluteUrl(p.image_url):p.image_url}:{}),...(p.whatsapp?{telephone:p.whatsapp}:{}),...(category==='wisata'&&ticket===0?{isAccessibleForFree:true,publicAccess:true}:{}),...(p.website?{sameAs:[p.website]}:{}),...(ratingEnabled()&&rating&&rating.score!==null&&rating.reviewers>=3?{aggregateRating:{'@type':'AggregateRating',ratingValue:Number(rating.score.toFixed(1)),bestRating:5,worstRating:1,ratingCount:rating.reviewers}}:{}),containedInPlace:{'@type':'AdministrativeArea',name:'Kabupaten Garut, Jawa Barat'}}}/>
 <section className="vp-hero-wrap"><div className={`${p.image_url?'vp-hero':`vp-hero is-plain cat-${category}`}${p.name.length>26?' is-long':''}`}>
  {!p.image_url&&<HeroIcon className="vp-hero-icon" size={260} strokeWidth={1} aria-hidden="true"/>}
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
  {p.image_url&&isAreaPhoto(p)&&<span className="vp-area-note">{p.image_credit.split('/')[0].trim()}, bukan foto {p.name}</span>}
  {p.image_url&&p.image_credit&&<small className="vp-credit">Foto: {isAreaPhoto(p)?p.image_credit.split('/').slice(1).join('/').trim():p.image_credit}</small>}
 </div></section>
 <div className="vg-wrap vp-layout">
  <div className="vp-main">
   <section className="vp-gist" aria-labelledby="vp-gist-title"><h2 id="vp-gist-title">Intinya</h2><ul>{gist.map(g=><li key={g.label}><span className="vp-gist-icon"><g.icon size={20} aria-hidden="true"/></span><span><strong>{g.label}</strong><span>{g.text}</span></span></li>)}</ul><p>Dicek {checked||shortDate(p.updated_at)}. Info bisa berubah, jadi pastikan lagi ke pengelola.</p></section>
   {p.excerpt&&<p className="vp-lead">{p.excerpt}</p>}
   <PlaceNav links={links}/>
   <PracticalPanel place={p} research={community.research}/>
   <article className="vp-card" id="tentang-tempat"><h2>{rental?'Tentang penyedia':'Tentang tempat'}</h2><TextContent content={p.content}/>{p.source_url&&<p className="vg-source"><a href={p.source_url} target="_blank" rel="noopener noreferrer">Baca sumber informasi <ExternalLink size={14}/></a></p>}<small>Diperbarui {date(p.updated_at)}</small></article>
   <FaqBlock title="Tanya jawab" intro="Jawaban singkat dari informasi yang sudah diperiksa di halaman ini." items={placeFaq(p,{categoryName:c.name,rental,rating:ratingEnabled()&&rating?{score:rating.score,reviewers:rating.reviewers}:null})}/>
   {rating&&<><PreviewNote note={ratingPreviewNote()}/><RatingPanel rating={rating} peers={peers}/></>}
   <div className="vp-report"><strong>Info di sini tidak sesuai?</strong><p>Kirim koreksi atau pengalamanmu. Laporan diperiksa sebelum mengubah informasi yang tampil.</p><a href="#community-pulse">Laporkan perubahan</a></div>
   <CommunityPulse globeEnabled key={p.id} pulse={community.pulse} placeId={p.id} research={community.research} contents={community.contents} youtubeAvailable={community.youtubeAvailable} rental={rental}/>
  </div>
  <StickyAside>
   {category==='wisata'&&<PlaceEstimator placeId={p.id} name={p.name} practical={p.practical||null} whatsapp={p.whatsapp} plannable={plannable}/>}
   <div className="vp-card vp-info" id="info-kunjungan"><h2>{infoTitle}</h2>
    {hasMap&&<figure className="vp-map"><iframe title={`Peta lokasi ${p.name}`} src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${p.latitude},${p.longitude}`} loading="lazy" referrerPolicy="no-referrer"/>{coordinateRef&&<figcaption>Titik perkiraan kawasan, bukan pintu masuk.</figcaption>}</figure>}
    {coordinateRef&&<div className="vg-coordinate-source"><strong>Rujukan titik peta</strong><p>{coordinateRef.note}</p><a href={coordinateRef.source_url} target="_blank" rel="noopener noreferrer">{coordinateRef.publisher} ↗</a><small>Diperiksa {date(coordinateRef.checked_at)} · pemeriksaan sumber daring</small></div>}
    <p><strong>{rental?'Alamat / area layanan':'Lokasi'}</strong><br/>{p.address||(rental?'Melayani Garut. Konfirmasi titik pengambilan atau pengantaran kendaraan.':p.district+', Garut')}</p>
    {category!=='wisata'&&<p><strong>{rental?'Tarif & ketersediaan':category==='hotel'?'Tarif & ketersediaan kamar':category==='paket-wisata'?'Tarif & jadwal perjalanan':'Menu & jam buka'}</strong><br/>{rental?'Sebutkan tanggal dan durasi sewa. Tanyakan biaya total, sopir atau lepas kunci, serta syarat pemesanan.':category==='hotel'?'Tanyakan tarif dan kamar yang tersedia untuk tanggal menginapmu.':category==='paket-wisata'?'Tanyakan jadwal keberangkatan dan apa saja yang termasuk dalam harga.':'Tanyakan menu, harga, dan jam buka terbaru sebelum datang.'}</p>}
    <div className="vp-info-actions">{waUrl&&category!=='wisata'&&<a className="vg-button" href={waUrl} target="_blank" rel="noopener noreferrer">{rental?'Tanya ketersediaan via WhatsApp':category==='hotel'?'Tanya kamar via WhatsApp':'Hubungi via WhatsApp'}</a>}{!waUrl&&p.website&&category!=='wisata'&&<a className="vg-button" href={p.website} target="_blank" rel="noopener noreferrer">{rental?'Buka situs penyedia':'Buka situs resmi'} ↗</a>}{phone&&<a className="vg-button vg-secondary" href={`tel:+${phone}`}><Phone size={17} aria-hidden="true"/>Telepon {phoneLabel}</a>}{routeUrl&&<a className="vg-button vg-secondary" href={routeUrl} target="_blank" rel="noopener noreferrer">Petunjuk jalan (Google Maps)</a>}{plannable&&category!=='wisata'&&<Link className="vg-button vg-secondary" href={`/trip?start=${p.id}`}>Mulai rencana dari sini</Link>}</div>
    <div className="vp-info-links">{category==='wisata'&&<a href="#praktis">Lihat tiket, jam buka &amp; akses</a>}{routeUrl&&<a href={routeUrl} target="_blank" rel="noopener noreferrer">Lihat ulasan &amp; foto di Google Maps ↗</a>}{p.website&&(waUrl||category==='wisata')&&<a href={p.website} target="_blank" rel="noopener noreferrer">{rental?'Lihat situs penyedia':'Website pengelola'} ↗</a>}<Link href={hasCoordinates(p)?`/map?place=${p.id}`:`/map?category=${p.category}`}>{hasCoordinates(p)?'Lihat tempat di sekitar':'Lihat peta VisitGarut'} ↗</Link></div>
   </div>
  </StickyAside>
 </div>
 {guides.length>0&&<section className="vg-wrap vg-section"><div className="vg-section-heading"><div><span className="vg-eyebrow">PANDUAN</span><h2>Panduan terkait</h2></div></div><div className="vg-article-grid">{guides.map(a=><ArticleCard key={a.id} item={a}/>)}</div></section>}
 {other.length>0&&<section className="vg-wrap vg-section vp-related"><div className="vg-section-heading"><div><span className="vg-eyebrow">DI SEKITARNYA</span><h2>{rental?'Penyedia rental lainnya':'Jelajahi tempat lain'}</h2><p className="vg-heading-note">Pilihan dalam kategori yang sama, mengutamakan wilayah yang sama. Jika titik peta tersedia, urutannya mempertimbangkan kedekatan garis lurus, bukan jarak perjalanan.</p></div></div><PlaceGrid items={other}/></section>}
 <ActionBar actions={bar}/>
 </Shell>}
