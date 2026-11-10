import Picture from '@/components/mvp/Picture'
import Link from 'next/link'
import {isAreaPhoto,areaPhotoTag,photoAlt} from '@/lib/mvp/photo'
import {ArrowUpRight,ArrowRight,MapPin,Check,Sparkles,BadgeCheck,CircleHelp,Link2,Route,Search,Users,Mountain,BedDouble,UtensilsCrossed,Coffee,Car,Store,ScanLine} from 'lucide-react'
import {Shell,JsonLd,date as fmtDate} from '@/components/mvp/Shell'
import SiteHeader from '@/components/mvp/SiteHeader'
import HeroVideo from '@/components/visit/HeroVideo'
import RatingHome from '@/components/rating/RatingHome'
import {PreviewNote} from '@/components/rating/bits'
import {loadRatingHome} from '@/lib/rating/home'
import {ratingVisible,ratingPreviewNote} from '@/lib/rating/server'
import {organization} from '@/lib/mvp/org'
import {places,articles,categories,type Place} from '@/lib/mvp/data'
import {db} from '@/lib/mvp/db'
import {hubExperienceCountSql,hubExperienceParams} from '@/lib/pulse/hub-query'
import {siteUrl,absoluteUrl} from '@/lib/site'
import {compactRupiah,knownTicket,checkedLabel} from '@/lib/mvp/format'
export const dynamic='force-dynamic'
export const metadata={title:'VisitGarut — Pilih tempat, hitung biaya, rencanakan pulang',description:'Rencanakan kunjungan Garut sesuai rombongan, budget, dan waktu. Bandingkan tempat, periksa sumber biaya, lalu atur perjalanan pergi-pulang.',alternates:{canonical:'/'}}

type PulsePlace={id:number;name:string;category:string;slug:string;district:string;videos:number;research:number;experiences:number}
async function pulsePlaces():Promise<PulsePlace[]>{
 if(!process.env.DATABASE_URL)return []
 try{
  const rows=(await db().query<PulsePlace>(`SELECT p.id,p.name,p.category,p.slug,p.district,
  (SELECT count(*)::int FROM vg_youtube_videos v WHERE v.place_id=p.id AND v.review_status='approved' AND v.reviewed_at IS NOT NULL AND v.expires_at>now()) AS videos,
  ${hubExperienceCountSql} AS experiences,
  (SELECT count(*)::int FROM vg_place_research r WHERE r.place_id=p.id AND r.status='approved') AS research
  FROM vg_places p WHERE p.status='published'`,[...hubExperienceParams])).rows
  return rows.filter(r=>r.videos+r.research+r.experiences>0).sort((a,b)=>(b.videos+b.research+b.experiences)-(a.videos+a.research+a.experiences)).slice(0,3)
 }catch{return []}
}
function evidenceLabel(p:PulsePlace){return [p.videos&&`${p.videos} video`,p.experiences&&`${p.experiences} pengalaman`,p.research&&`${p.research} catatan`].filter(Boolean).join(' · ')}
const catIcon:Record<string,typeof Store>={wisata:Mountain,hotel:BedDouble,kuliner:UtensilsCrossed,cafe:Coffee,transportasi:Car}
async function categoryCounts(){
 if(!process.env.DATABASE_URL)return {by:{} as Record<string,number>,total:0,districts:0,last:null as Date|null}
 try{
  const r=(await db().query<{category:string;n:number;districts:number;last:Date}>("SELECT category,count(*)::int n,count(DISTINCT NULLIF(district,''))::int districts,max(updated_at) last FROM vg_places WHERE status='published' GROUP BY ROLLUP(category)")).rows
  const all=r.find(x=>x.category===null)
  return {by:Object.fromEntries(r.filter(x=>x.category!==null).map(x=>[x.category,x.n])) as Record<string,number>,total:all?.n??0,districts:all?.districts??0,last:all?.last??null}
 }catch{return {by:{} as Record<string,number>,total:0,districts:0,last:null as Date|null}}
}
function placeMeta(p:Place){const t=knownTicket(p.practical);return [p.district||'Garut',t!==null?(t===0?'tiket gratis':`± ${compactRupiah(t)}/org`):null].filter(Boolean).join(' · ')}

export default async function Home(){
 const visible=await ratingVisible()
 const [items,guides,pulse,rating]=await Promise.all([places(),articles(),pulsePlaces(),visible?loadRatingHome():Promise.resolve(null)])
 const ranked=[...items].sort((a,b)=>Number(b.category==='wisata')-Number(a.category==='wisata')||Number(!!b.image_url)-Number(!!a.image_url)||Number(knownTicket(b.practical)!==null)-Number(knownTicket(a.practical)!==null)||Number(!!b.practical)-Number(!!a.practical))
 const withImage=ranked.filter(p=>p.image_url&&!isAreaPhoto(p))
 const featured=withImage[0]
 const bento=withImage.slice(0,5)
 const counts=await categoryCounts()
 const live=categories.filter(c=>counts.by[c.slug])
 const shown=new Set(bento.map(p=>p.id))
 const panels=live.map(c=>({c,n:counts.by[c.slug],items:ranked.filter(p=>p.category===c.slug&&!shown.has(p.id)).slice(0,4)})).filter(x=>x.items.length)
 const noScores=!!rating&&rating.stats.scoredPlaces===0
 return <Shell overlayHeader><JsonLd data={{'@context':'https://schema.org','@graph':[organization(),{'@type':'WebSite','@id':`${siteUrl}/#website`,name:'VisitGarut',url:siteUrl,inLanguage:'id-ID',publisher:{'@id':`${siteUrl}/#organization`}},{'@type':'CollectionPage',url:siteUrl,name:'Rencanakan kunjungan Garut',mainEntity:{'@type':'ItemList',itemListElement:bento.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.name,url:absoluteUrl(`/${p.category}/${p.slug}`)}))}}]}}/>
 <div className="vh">
 <section className="vh-hero-wrap"><div className="vh-hero">
  <Picture className="vh-hero-img" src="/papandayan.jpg" sizes="100vw" alt="Lanskap kawah dan pegunungan Gunung Papandayan, Garut" width={1200} height={800} fetchPriority="high"/>
  <HeroVideo/>
  <div className="vh-hero-word" aria-hidden="true">GARUT</div>
  <div className="vh-hero-shade" aria-hidden="true"/>
  <SiteHeader overlay/>
  <div className="vh-hero-space"/>
  <div className="vh-hero-bottom">
   <div className="vh-hero-copy">
    <span className="vh-glass-chip"><MapPin size={14} aria-hidden="true"/>Garut, Jawa Barat</span>
    <h1>Ke Garut,<br/>lebih jelas.</h1>
    <p>Pilih tempat yang pas, ketahui biayanya, dan atur perjalanan sampai pulang — dari informasi yang menyebut sumbernya.</p>
    <Link className="vg-pill-cta is-large" href="/search">Jelajahi Garut<span className="vg-pill-cta-icon"><ArrowUpRight size={20} aria-hidden="true"/></span></Link>
   </div>
   {featured&&<Link className="vh-feature" href={`/${featured.category}/${featured.slug}`}>
    <span className="vh-feature-img"><Picture src={featured.image_url} sizes="(max-width: 700px) 92vw, 600px" alt={photoAlt(featured)} width={600} height={480}/>
     <span className="vh-feature-tags">{checkedLabel(featured.practical)?<span className="vh-tag-light"><i className="vh-dot" aria-hidden="true"/>{checkedLabel(featured.practical)}</span>:<span/>}{featured.district&&<span className="vh-tag-dark">{featured.district}</span>}</span>
    </span>
    <span className="vh-feature-foot"><strong>{featured.name}</strong><span className="vh-round-lime"><ArrowUpRight size={20} aria-hidden="true"/></span></span>
   </Link>}
   <Link className="vh-glass-card" href="/trip">
    <span className="vh-glass-label"><Route size={16} aria-hidden="true"/>Rencana perjalanan</span>
    <strong>Ceritakan rombonganmu. Biaya, rute, dan jam pulang dibantu susun.</strong>
    <span className="vh-glass-chips"><span>Bareng anak</span><span>Naik kereta</span><span>Hitung biaya</span></span>
   </Link>
  </div>
 </div></section>

 <section className="vh-planner-wrap" aria-labelledby="vh-find-title">
  <div className="vh-planner vh-finder">
   <h2 id="vh-find-title" className="sr-only">Cari tempat di Garut</h2>
   <form action="/search" className="vh-plan-search vh-find-search" role="search">
    <Search size={20} aria-hidden="true"/>
    <label className="sr-only" htmlFor="vh-q">Cari tempat di Garut</label>
    <input id="vh-q" name="q" maxLength={120} placeholder="Cari tempat, penginapan, rental, atau daerah…"/>
    <button type="submit">Cari</button>
   </form>
   <div className="vh-find-row">
    <nav className="vh-cat-chips" aria-label="Kategori tempat">{live.map(c=>{const Icon=catIcon[c.slug]||Store;return <Link key={c.slug} href={`/${c.slug}`}><Icon size={16} aria-hidden="true"/>{c.name}<b>{counts.by[c.slug]}</b></Link>})}<Link href="/map"><MapPin size={16} aria-hidden="true"/>Peta</Link></nav>
    <Link className="vh-find-plan" href="/trip"><Route size={16} aria-hidden="true"/>Susun rencana perjalanan<ArrowRight size={16} aria-hidden="true"/></Link>
   </div>
   {counts.total>0&&<p className="vh-find-meta"><i className="vh-dot" aria-hidden="true"/>{counts.total} tempat di {counts.districts} kecamatan{counts.last?<> · terakhir diperbarui {fmtDate(counts.last)}</>:null} · setiap tarif menyebut sumbernya</p>}
  </div>
 </section>

 {bento.length>0&&<section className="vh-places" aria-labelledby="vh-places-title">
  <div className="vh-places-head"><h2 id="vh-places-title">Lihat tempatnya.<br/>Periksa rinciannya.</h2>
   <p className="vh-places-note">Tempat dengan foto lebih dulu. Semua tempat menyebut sumber dan tanggal pemeriksaannya.</p></div>
  <div className={`vh-bento vh-bento-${bento.length}`}>{bento.map((p,i)=>{const checked=checkedLabel(p.practical);const unknown=p.category==='wisata'&&knownTicket(p.practical)===null;return <Link key={p.id} className={i===0?'vh-tile is-big':'vh-tile'} href={`/${p.category}/${p.slug}`}>
   <Picture src={p.image_url!} sizes={i===0?'(max-width: 700px) 92vw, 60vw':'(max-width: 700px) 92vw, 30vw'} alt={photoAlt(p)} loading={i>1?'lazy':undefined} width={800} height={600}/>
   <span className="vh-tile-shade" aria-hidden="true"/>
   {isAreaPhoto(p)?<span className="vh-tag-light vh-tile-tag">{areaPhotoTag(p)}</span>:unknown?<span className="vh-tag-warn">Tarif perlu konfirmasi</span>:checked?<span className="vh-tag-light vh-tile-tag"><i className="vh-dot" aria-hidden="true"/>{checked}</span>:null}
   <span className="vh-tile-foot"><span><strong>{p.name}</strong><small>{placeMeta(p)}</small></span>{i===0&&<span className="vh-round-lime"><ArrowUpRight size={22} aria-hidden="true"/></span>}</span>
  </Link>})}</div>
  {panels.length>0&&<div className="vh-cat-panels">{panels.map(({c,n,items})=>{const Icon=catIcon[c.slug]||Store;return <section key={c.slug} className="vh-cat-panel" aria-labelledby={`vh-cat-${c.slug}`}>
   <div className="vh-cat-head"><span className="vh-cat-icon"><Icon size={18} aria-hidden="true"/></span><h3 id={`vh-cat-${c.slug}`}>{c.name}</h3><Link href={`/${c.slug}`}>Semua {n}<ArrowUpRight size={14} aria-hidden="true"/></Link></div>
   <ul>{items.map(p=>{const ck=checkedLabel(p.practical);return <li key={p.id}><Link href={`/${p.category}/${p.slug}`}><span><strong>{p.name}</strong><small>{placeMeta(p)}{ck?` · ${ck}`:''}</small></span><ArrowUpRight size={16} aria-hidden="true"/></Link></li>})}</ul>
  </section>})}</div>}
  <Link className="vg-pill-cta is-dark vh-center" href="/search">Lihat semua tempat<span className="vg-pill-cta-icon"><ArrowUpRight size={18} aria-hidden="true"/></span></Link>
 </section>}

 <section className="vh-principles vh-principles-strip" aria-label="Prinsip VisitGarut">
  <div><span><BadgeCheck size={18} aria-hidden="true"/></span><p><strong>Bersumber &amp; bertanggal.</strong> Setiap tarif menyebut sumber dan kapan terakhir diperiksa.</p></div>
  <div><span><CircleHelp size={18} aria-hidden="true"/></span><p><strong>Yang belum pasti, ditandai.</strong> Kamu tahu apa yang perlu ditanyakan sebelum berangkat.</p></div>
  <div><span><Link2 size={18} aria-hidden="true"/></span><p><strong>Sumbernya bisa dibuka.</strong> Ringkasan pengalaman selalu menautkan ke sumber aslinya.</p></div>
 </section>

 {rating&&!noScores&&<><PreviewNote note={ratingPreviewNote()}/><RatingHome tabs={rating.tabs} stats={rating.stats}/></>}

 <section className="vh-dark-wrap" aria-labelledby="vh-trip-title"><div className="vh-dark">
  <div className="vh-dark-glow" aria-hidden="true"/>
  <div className="vh-dark-grid">
   <div className="vh-dark-copy">
    <span className="vh-lime-chip"><Sparkles size={15} aria-hidden="true"/>Rencana perjalanan</span>
    <h2 id="vh-trip-title">Satu rencana,<br/>sampai pulang.</h2>
    <p>Pilih tempat, isi jumlah orang dan dana, lalu lihat biaya yang sudah diketahui serta waktu yang perlu disisakan untuk perjalanan kembali.</p>
    <ul>
     <li><span><Check size={16} aria-hidden="true"/></span>Biaya dipisah: tiket, parkir, makan, transport</li>
     <li><span><Check size={16} aria-hidden="true"/></span>Tarif yang belum diketahui ditandai, bukan ditebak</li>
     <li><span><Check size={16} aria-hidden="true"/></span>Rute bisa dibuka di peta dan tautannya dibagikan</li>
    </ul>
    <nav className="vh-intents" aria-label="Mulai rencana untuk"><Link href="/trip?intent=together">Sendiri / teman</Link><Link href="/trip?intent=family"><Users size={15} aria-hidden="true"/>Keluarga + anak</Link><Link href="/trip?intent=train">Naik kereta</Link></nav>
    <Link className="vg-pill-cta is-large" href="/trip">Coba susun rencanamu<span className="vg-pill-cta-icon"><ArrowUpRight size={20} aria-hidden="true"/></span></Link>
   </div>
   <div className="vh-steps">
    <div className="vh-steps-top"><span className="vh-steps-kicker">Cara kerjanya</span><strong>Atur, bandingkan,<br/>lalu cek biayanya.</strong></div>
    <ol>
     <li><span>01</span><span><strong>Atur perjalanan</strong><small>Tanggal, jumlah dewasa dan anak, dana, serta jam harus pulang.</small></span></li>
     <li><span>02</span><span><strong>Bandingkan tempat</strong><small>Tambahkan tujuan dari direktori atau simpananmu.</small></span></li>
     <li><span>03</span><span><strong>Cek biaya &amp; waktu</strong><small>Total yang sudah diketahui, yang perlu ditanyakan, dan sisa waktu pulang.</small></span></li>
    </ol>
   </div>
  </div>
 </div></section>

 <section className="vh-duo">
  <div className="vh-panel" id="pulse">
   <div className="vh-panel-head"><h2>Bisa kamu<br/>periksa sendiri</h2><Link className="vh-soft-link" href="/community-pulse">Lihat cerita & video</Link></div>
   {pulse.length>0?<ul className="vh-list">{pulse.map(p=><li key={p.id}><span><strong>{p.name}</strong><small>{evidenceLabel(p)}</small></span><Link href={`/${p.category}/${p.slug}#community-pulse`} aria-label={`Lihat sumber tentang ${p.name}`} className="vh-round-line"><ArrowUpRight size={18} aria-hidden="true"/></Link></li>)}</ul>
   :<ul className="vh-list">
     <li><span><strong>Peta hubungan antartempat</strong><small>Kenali area sebelum menentukan perjalanan.</small></span><Link href="/map" aria-label="Buka peta" className="vh-round-line"><ArrowUpRight size={18} aria-hidden="true"/></Link></li>
     <li><span><strong>Pengalaman &amp; sumber aslinya</strong><small>Cerita pengunjung yang tertaut ke sumbernya.</small></span><Link href="/community-pulse" aria-label="Buka Community Pulse" className="vh-round-line"><ArrowUpRight size={18} aria-hidden="true"/></Link></li>
     <li><span><strong>Cara kami membaca sumber</strong><small>Metode pemeriksaan sebelum menjadi ringkasan.</small></span><Link href="/community-pulse/metode" aria-label="Baca metode" className="vh-round-line"><ArrowUpRight size={18} aria-hidden="true"/></Link></li>
    </ul>}
  </div>
  <div className="vh-panel" id="panduan">
   <div className="vh-panel-head"><h2>Siapkan sebelum<br/>berangkat</h2><Link className="vh-soft-link" href="/artikel">Semua panduan</Link></div>
   {guides.length>0?<div className="vh-guides">{guides.slice(0,3).map((a,i)=>{const img=a.image_url||withImage[(i+2)%Math.max(withImage.length,1)]?.image_url;return <Link key={a.id} href={`/artikel/${a.slug}`}>{img?<span className="vh-guide-img"><Picture src={img} sizes="152px" alt="" loading="lazy" width={152} height={128}/></span>:<span className="vh-guide-img is-empty" aria-hidden="true"/>}<span><strong>{a.title}</strong><small>{a.author} · {fmtDate(a.published_at||a.updated_at)}</small></span></Link>})}</div>
   :<p className="vh-muted">Panduan baru sedang disiapkan.</p>}
  </div>
 </section>

 <section className={noScores?"vh-duo vh-duo-last":"vh-duo vh-duo-last is-single"}>
  {noScores&&<div className="vh-color is-lime"><span className="vh-color-kicker"><ScanLine size={16} aria-hidden="true"/>Untuk pelaku usaha · VisitGarut Rating</span><h2>Nilai dari tamu yang benar-benar datang.</h2><p>Kami sedang memasang plat QR di warung, kafe, penginapan, dan tempat wisata. Begitu 3 pengunjung menilai sebuah tempat, skornya tampil. Skor tidak bisa dibeli.</p><div className="vh-color-ctas"><Link className="vg-pill-cta is-dark" href="/untuk-usaha">Minta plat QR gratis<span className="vg-pill-cta-icon"><ArrowUpRight size={18} aria-hidden="true"/></span></Link><Link className="vh-color-link" href="/rating/metode">Cara skor dihitung</Link></div></div>}
  <div className="vh-color is-sage"><span className="vh-color-kicker">Untuk pelaku usaha</span><h2>Data tempatmu kurang tepat?</h2><p>Kirim koreksi lewat halaman tempat. Setiap laporan diperiksa sebelum mengubah informasi yang tampil.</p><Link className="vg-pill-cta is-dark" href="/community-pulse/metode">Pelajari cara kami memeriksa<span className="vg-pill-cta-icon"><ArrowUpRight size={18} aria-hidden="true"/></span></Link></div>
 </section>
 </div></Shell>
}
