import Link from 'next/link'
import {ArrowUpRight,ArrowRight,MapPin,Check,Sparkles,BadgeCheck,CircleHelp,Link2,Route,Search,Users} from 'lucide-react'
import {Shell,JsonLd,date as fmtDate} from '@/components/mvp/Shell'
import SiteHeader from '@/components/mvp/SiteHeader'
import HeroVideo from '@/components/visit/HeroVideo'
import RatingHome from '@/components/rating/RatingHome'
import {PreviewNote} from '@/components/rating/bits'
import {loadRatingHome} from '@/lib/rating/home'
import {ratingVisible,ratingPreviewNote} from '@/lib/rating/server'
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
function evidenceLabel(p:PulsePlace){return [p.videos&&`${p.videos} video`,p.experiences&&`${p.experiences} pengalaman`,p.research&&`${p.research} riset sumber`].filter(Boolean).join(' · ')}
function placeMeta(p:Place){const t=knownTicket(p.practical);return [p.district||'Garut',t!==null?(t===0?'tiket gratis':`± ${compactRupiah(t)}/org`):null].filter(Boolean).join(' · ')}

export default async function Home(){
 const visible=await ratingVisible()
 const [items,guides,pulse,rating]=await Promise.all([places(),articles(),pulsePlaces(),visible?loadRatingHome():Promise.resolve(null)])
 const ranked=[...items].sort((a,b)=>Number(b.category==='wisata')-Number(a.category==='wisata')||Number(!!b.image_url)-Number(!!a.image_url)||Number(!!b.practical)-Number(!!a.practical))
 const withImage=ranked.filter(p=>p.image_url)
 const featured=withImage[0]
 const bento=withImage.slice(0,5)
 const pills=withImage.slice(1,3)
 return <Shell overlayHeader><JsonLd data={{'@context':'https://schema.org','@graph':[{'@type':'Organization','@id':`${siteUrl}/#organization`,name:'VisitGarut',url:siteUrl,logo:{'@type':'ImageObject',url:`${siteUrl}/icon.png`,width:512,height:512},description:'Direktori independen tempat wisata, penginapan, kuliner, dan usaha lokal di Kabupaten Garut, Jawa Barat, dengan tarif bersumber dan nilai dari pengunjung yang benar-benar datang.',areaServed:{'@type':'AdministrativeArea',name:'Kabupaten Garut, Jawa Barat, Indonesia'},parentOrganization:{'@type':'Organization',name:'Sorotnamedia'}},{'@type':'WebSite','@id':`${siteUrl}/#website`,name:'VisitGarut',url:siteUrl,inLanguage:'id-ID',publisher:{'@id':`${siteUrl}/#organization`}},{'@type':'CollectionPage',url:siteUrl,name:'Rencanakan kunjungan Garut',mainEntity:{'@type':'ItemList',itemListElement:bento.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.name,url:absoluteUrl(`/${p.category}/${p.slug}`)}))}}]}}/>
 <div className="vh">
 <section className="vh-hero-wrap"><div className="vh-hero">
  <img className="vh-hero-img" src="/papandayan.jpg" alt="Lanskap kawah dan pegunungan Gunung Papandayan, Garut" width={1200} height={800} fetchPriority="high"/>
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
    <span className="vh-feature-img"><img src={featured.image_url} alt={featured.name} width={600} height={480}/>
     <span className="vh-feature-tags">{checkedLabel(featured.practical)?<span className="vh-tag-light"><i className="vh-dot" aria-hidden="true"/>{checkedLabel(featured.practical)}</span>:<span/>}{featured.district&&<span className="vh-tag-dark">{featured.district}</span>}</span>
    </span>
    <span className="vh-feature-foot"><strong>{featured.name}</strong><span className="vh-round-lime"><ArrowUpRight size={20} aria-hidden="true"/></span></span>
   </Link>}
   <Link className="vh-glass-card" href="/trip">
    <span className="vh-glass-label"><Route size={16} aria-hidden="true"/>Rencana perjalanan</span>
    <strong>Ceritakan rombonganmu. Biaya, rute, dan jam pulang dibantu susun.</strong>
    <span className="vh-glass-chips"><span>Bareng anak</span><span>Naik kereta</span><span>Hitung budget</span></span>
   </Link>
  </div>
 </div></section>

 <section className="vh-planner-wrap" aria-labelledby="vh-planner-title">
  <div className="vh-planner">
   <h2 id="vh-planner-title" className="sr-only">Mulai rencana perjalanan</h2>
   <nav className="vh-tabs" aria-label="Mulai dari">
    <span className="is-active" aria-current="true"><Route size={16} aria-hidden="true"/>Rencana</span>
    <Link href="/wisata">Wisata</Link><Link href="/hotel">Penginapan</Link><Link href="/kuliner">Kuliner</Link><Link href="/transportasi">Rental</Link><Link href="/map">Peta</Link>
   </nav>
   <form action="/trip" className="vh-plan-form">
    <label>Pergi dengan<select name="intent" defaultValue="together"><option value="together">Sendiri / teman</option><option value="family">Keluarga + anak</option><option value="train">Naik kereta</option></select></label>
    <label>Tanggal kunjungan<input name="date" type="date"/></label>
    <label>Budget rombongan (Rp)<input name="budget" inputMode="numeric" pattern="[0-9]*" placeholder="Contoh: 500000"/></label>
    <button className="vg-button vh-plan-submit" type="submit">Susun rencana<ArrowRight size={18} aria-hidden="true"/></button>
   </form>
   <form action="/search" className="vh-plan-search" role="search">
    <Search size={20} aria-hidden="true"/>
    <label className="sr-only" htmlFor="vh-q">Cari tempat di Garut</label>
    <input id="vh-q" name="q" maxLength={120} placeholder="Sudah punya tujuan? Cari tempat, rental, atau daerah…"/>
    <button type="submit">Cari</button>
   </form>
  </div>
 </section>


 <section className="vh-statement">
  <p>Pilih tempat {pills[0]&&<span className="vh-inline-pill"><img src={pills[0].image_url} alt="" width={170} height={70}/></span>} yang pas, rincikan biayanya, lalu pulang {pills[1]&&<span className="vh-inline-pill"><img src={pills[1].image_url} alt="" width={170} height={70}/></span>} tanpa drama.</p>
  <small>VisitGarut adalah direktori independen. Tarif menyebut sumber dan tanggal pemeriksaannya, dan yang belum pasti selalu ditandai.</small>
 </section>

 <section className="vh-principles" aria-label="Prinsip VisitGarut">
  <div><span><BadgeCheck size={22} aria-hidden="true"/></span><h3>Bersumber &amp; bertanggal</h3><p>Setiap tarif menyebut sumber dan kapan terakhir diperiksa.</p></div>
  <div><span><CircleHelp size={22} aria-hidden="true"/></span><h3>Yang belum pasti, ditandai</h3><p>Kamu tahu apa yang perlu ditanyakan sebelum berangkat.</p></div>
  <div><span><Link2 size={22} aria-hidden="true"/></span><h3>Sumbernya bisa dibuka</h3><p>Ringkasan pengalaman selalu menautkan ke sumber aslinya.</p></div>
 </section>

 {bento.length>0&&<section className="vh-places" aria-labelledby="vh-places-title">
  <div className="vh-places-head"><h2 id="vh-places-title">Lihat tempatnya.<br/>Periksa rinciannya.</h2>
   <nav className="vh-chips" aria-label="Kategori tempat">{categories.map(c=><Link key={c.slug} href={`/${c.slug}`}>{c.name}</Link>)}</nav></div>
  <div className={`vh-bento vh-bento-${bento.length}`}>{bento.map((p,i)=>{const checked=checkedLabel(p.practical);const unknown=p.category==='wisata'&&knownTicket(p.practical)===null;return <Link key={p.id} className={i===0?'vh-tile is-big':'vh-tile'} href={`/${p.category}/${p.slug}`}>
   <img src={p.image_url} alt={p.name} loading={i>1?'lazy':undefined} width={800} height={600}/>
   <span className="vh-tile-shade" aria-hidden="true"/>
   {unknown?<span className="vh-tag-warn">Tarif perlu konfirmasi</span>:checked?<span className="vh-tag-light vh-tile-tag"><i className="vh-dot" aria-hidden="true"/>{checked}</span>:null}
   <span className="vh-tile-foot"><span><strong>{p.name}</strong><small>{placeMeta(p)}</small></span>{i===0&&<span className="vh-round-lime"><ArrowUpRight size={22} aria-hidden="true"/></span>}</span>
  </Link>})}</div>
  <Link className="vg-pill-cta is-dark vh-center" href="/search">Lihat semua tempat<span className="vg-pill-cta-icon"><ArrowUpRight size={18} aria-hidden="true"/></span></Link>
 </section>}

 {rating&&<><PreviewNote note={ratingPreviewNote()}/><RatingHome tabs={rating.tabs} stats={rating.stats}/></>}

 <section className="vh-dark-wrap" aria-labelledby="vh-trip-title"><div className="vh-dark">
  <div className="vh-dark-glow" aria-hidden="true"/>
  <div className="vh-dark-grid">
   <div className="vh-dark-copy">
    <span className="vh-lime-chip"><Sparkles size={15} aria-hidden="true"/>Rencana perjalanan</span>
    <h2 id="vh-trip-title">Satu rencana,<br/>sampai pulang.</h2>
    <p>Pilih tempat, isi jumlah orang dan budget, lalu lihat biaya yang sudah diketahui serta waktu yang perlu disisakan untuk perjalanan kembali.</p>
    <ul>
     <li><span><Check size={16} aria-hidden="true"/></span>Biaya dipisah: tiket, parkir, makan, transport</li>
     <li><span><Check size={16} aria-hidden="true"/></span>Tarif yang belum diketahui ditandai, bukan ditebak</li>
     <li><span><Check size={16} aria-hidden="true"/></span>Rute bisa dibuka di peta dan tautannya dibagikan</li>
    </ul>
    <Link className="vg-pill-cta is-large" href="/trip">Coba susun rencanamu<span className="vg-pill-cta-icon"><ArrowUpRight size={20} aria-hidden="true"/></span></Link>
   </div>
   <div className="vh-steps">
    <div className="vh-steps-top"><span className="vh-steps-kicker">Cara kerjanya</span><strong>Atur, bandingkan,<br/>lalu cek biayanya.</strong></div>
    <ol>
     <li><span>01</span><span><strong>Atur perjalanan</strong><small>Tanggal, jumlah dewasa dan anak, budget, serta jam harus pulang.</small></span></li>
     <li><span>02</span><span><strong>Bandingkan tempat</strong><small>Tambahkan tujuan dari direktori atau simpananmu.</small></span></li>
     <li><span>03</span><span><strong>Cek biaya &amp; waktu</strong><small>Total yang sudah diketahui, yang perlu ditanyakan, dan sisa waktu pulang.</small></span></li>
    </ol>
   </div>
  </div>
 </div></section>

 <section className="vh-duo">
  <div className="vh-panel" id="pulse">
   <div className="vh-panel-head"><h2>Bisa kamu<br/>periksa sendiri</h2><Link className="vh-soft-link" href="/community-pulse">Buka Community Pulse</Link></div>
   {pulse.length>0?<ul className="vh-list">{pulse.map(p=><li key={p.id}><span><strong>{p.name}</strong><small>{evidenceLabel(p)}</small></span><Link href={`/${p.category}/${p.slug}#community-pulse`} aria-label={`Lihat sumber tentang ${p.name}`} className="vh-round-line"><ArrowUpRight size={18} aria-hidden="true"/></Link></li>)}</ul>
   :<ul className="vh-list">
     <li><span><strong>Peta hubungan antartempat</strong><small>Kenali area sebelum menentukan perjalanan.</small></span><Link href="/map" aria-label="Buka peta" className="vh-round-line"><ArrowUpRight size={18} aria-hidden="true"/></Link></li>
     <li><span><strong>Pengalaman &amp; sumber aslinya</strong><small>Cerita pengunjung yang tertaut ke sumbernya.</small></span><Link href="/community-pulse" aria-label="Buka Community Pulse" className="vh-round-line"><ArrowUpRight size={18} aria-hidden="true"/></Link></li>
     <li><span><strong>Cara kami membaca sumber</strong><small>Metode pemeriksaan sebelum menjadi ringkasan.</small></span><Link href="/community-pulse/metode" aria-label="Baca metode" className="vh-round-line"><ArrowUpRight size={18} aria-hidden="true"/></Link></li>
    </ul>}
  </div>
  <div className="vh-panel" id="panduan">
   <div className="vh-panel-head"><h2>Siapkan sebelum<br/>berangkat</h2><Link className="vh-soft-link" href="/artikel">Semua panduan</Link></div>
   {guides.length>0?<div className="vh-guides">{guides.slice(0,3).map((a,i)=>{const img=a.image_url||withImage[(i+2)%Math.max(withImage.length,1)]?.image_url;return <Link key={a.id} href={`/artikel/${a.slug}`}>{img?<span className="vh-guide-img"><img src={img} alt="" loading="lazy" width={152} height={128}/></span>:<span className="vh-guide-img is-empty" aria-hidden="true"/>}<span><strong>{a.title}</strong><small>{a.author} · {fmtDate(a.published_at||a.updated_at)}</small></span></Link>})}</div>
   :<p className="vh-muted">Panduan baru sedang disiapkan.</p>}
  </div>
 </section>

 <section className="vh-duo vh-duo-last">
  <div className="vh-color is-lime"><span className="vh-color-kicker"><Users size={16} aria-hidden="true"/>Rombongan &amp; keluarga</span><h2>Datang bersama anak atau rombongan besar?</h2><p>Hitung tiket dewasa dan anak terpisah, lalu siapkan pertanyaan untuk pengelola sebelum berangkat.</p><Link className="vg-pill-cta is-dark" href="/trip?intent=family">Susun rencana keluarga<span className="vg-pill-cta-icon"><ArrowUpRight size={18} aria-hidden="true"/></span></Link></div>
  <div className="vh-color is-sage"><span className="vh-color-kicker">Untuk pelaku usaha</span><h2>Data tempatmu kurang tepat?</h2><p>Kirim koreksi lewat halaman tempat. Setiap laporan diperiksa sebelum mengubah informasi yang tampil.</p><Link className="vg-pill-cta is-dark" href="/community-pulse/metode">Pelajari cara kami memeriksa<span className="vg-pill-cta-icon"><ArrowUpRight size={18} aria-hidden="true"/></span></Link></div>
 </section>
 </div></Shell>
}
