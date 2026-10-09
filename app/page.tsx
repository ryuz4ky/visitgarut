import Link from 'next/link'
import { Mountain, BedDouble, Utensils, Coffee, Car, ArrowUpRight, MapPin, FileSearch, MessageCircle, Compass, MapPinned, Orbit, BookOpenText } from 'lucide-react'
import { Shell, SearchForm, PlaceGrid, ArticleCard, JsonLd } from '@/components/mvp/Shell'
import { places, articles, categories } from '@/lib/mvp/data'
import { siteUrl } from '@/lib/site'
export const dynamic = 'force-dynamic'
export const metadata = { alternates: { canonical: '/' } }
const icons: Record<string, typeof Mountain> = { Mountain, BedDouble, Utensils, Coffee, Car, Compass }
export default async function Home() {
  const [items, guides] = await Promise.all([places(), articles()])
  const featured = [...items.filter(p => p.image_url), ...items.filter(p => !p.image_url)].slice(0, 6)
  const districts = new Set(items.map(p => p.district).filter(Boolean)).size
  return <Shell>
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Organization', name: 'VisitGarut', url: siteUrl }}/>
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'VisitGarut', url: siteUrl }}/>
    <section className="vg-home-hero"><div className="vg-wrap vg-hero-layout">
      <div className="vg-hero-copy"><span className="vg-eyebrow">GARUT, JAWA BARAT</span><h1>Jelajahi Garut.<br/><em>Pilih dengan<br/>lebih yakin.</em></h1><p>Cari tempat wisata, penginapan, dan rental. Baca sumber serta konteks pengalamannya sebelum merencanakan perjalanan.</p><SearchForm/><div className="vg-hero-links"><span>Coba cari:</span><Link href="/search?q=Papandayan">Papandayan</Link><Link href="/search?q=pantai">Pantai</Link><Link href="/search?category=hotel">Penginapan</Link><Link href="/transportasi">Rental mobil & motor</Link></div><div className="vg-directory-stats"><span><strong>{items.length}</strong> listing dalam direktori</span><span><strong>{districts}</strong> wilayah untuk dijelajahi</span></div></div>
      <figure className="vg-hero-photo"><img src="/papandayan.jpg" alt="Lanskap pegunungan dan kawah di kawasan Papandayan" width={1200} height={800} fetchPriority="high"/><figcaption><MapPin size={16}/><span><strong>Gunung Papandayan</strong><br/>Cisurupan, Garut</span><Link href="/wisata/gunung-papandayan" aria-label="Jelajahi Gunung Papandayan"><ArrowUpRight size={23}/></Link></figcaption><span className="vg-photo-credit">Foto: Tantan Nurdiansyah · CC BY-SA 4.0</span></figure>
      <nav className="vg-quick" id="jelajahi" aria-label="Mulai dari kategori">{categories.map(c => { const Icon = icons[c.icon] || Compass; const count=items.filter(p => p.category === c.slug).length; return <Link key={c.slug} href={`/${c.slug}`}><Icon size={24}/><span>{c.shortName}<small>{count?`${count} ${c.unit}`:'Belum ada listing'}</small>{c.slug==='transportasi'&&<small>Mobil & motor</small>}</span></Link> })}</nav>
    </div></section>
    <section className="vg-wrap vg-discovery-choices" aria-labelledby="vg-discovery-title">
      <div className="vg-section-heading"><div><span className="vg-eyebrow">PILIH CARA JELAJAH</span><h2 id="vg-discovery-title">Temukan yang kamu butuhkan</h2><p className="vg-heading-note">Pilih satu langkah. Tak perlu membuka banyak menu.</p></div></div>
      <div className="vg-choice-grid">
        <Link href="/map"><MapPinned aria-hidden="true" size={25}/><strong>Cari melalui peta</strong><span>Lihat destinasi dan layanan yang sudah punya titik lokasi di Garut.</span><small>Buka peta ↗</small></Link>
        <Link href="/community-pulse"><Orbit aria-hidden="true" size={25}/><strong>Apa kata pengunjung?</strong><span>Kenali sumber pengalaman dan topik yang telah melewati pemeriksaan Community Pulse.</span><small>Pelajari Community Pulse ↗</small></Link>
        <Link href="/artikel"><BookOpenText aria-hidden="true" size={25}/><strong>Baca panduan Garut</strong><span>Temukan artikel dan rencana perjalanan sebelum menentukan tujuan.</span><small>Jelajahi panduan ↗</small></Link>
      </div>
    </section>
    <section className="vg-wrap vg-section"><div className="vg-section-heading"><div><span className="vg-eyebrow">MULAI DARI SINI</span><h2>Kenali pilihan di Garut</h2><p className="vg-heading-note">Tempat dan panduan awal untuk merencanakan kunjungan.</p></div><Link href="/search">Jelajahi semua tempat <span aria-hidden="true">↗</span></Link></div><PlaceGrid items={featured}/></section>
    <section className="pulse-home vg-wrap"><div className="vg-pulse-intro"><div><span className="vg-eyebrow">COMMUNITY PULSE</span><h2>Kenali tempatnya.<br/>Pahami pengalamannya.</h2><p>Informasi yang bisa ditelusuri membantu kamu memilih dengan lebih yakin. Baca sumber dan konteksnya, lalu bagikan pengalaman setelah berkunjung.</p><Link className="vg-button" href="/wisata/gunung-papandayan#community-pulse">Lihat contoh Community Pulse <ArrowUpRight size={17}/></Link><Link className="vg-method-link" href="/community-pulse">Bagaimana bukti diperiksa?</Link></div><ol className="vg-pulse-steps"><li><FileSearch size={21}/><div><strong>Baca riset tempat</strong><p>Catatan editorial dengan sumber dan tanggal pemeriksaan.</p></div></li><li><MessageCircle size={21}/><div><strong>Telusuri pengalaman</strong><p>Kontribusi pengunjung diperiksa sebelum masuk ringkasan.</p></div></li><li><Compass size={21}/><div><strong>Pilih dengan konteks</strong><p>Ringkasan muncul ketika jumlah bukti sudah mencukupi.</p></div></li></ol></div></section>
    <section className="vg-map-banner vg-wrap"><div><span className="vg-eyebrow">RENCANAKAN RUTEMU</span><h2>Satu peta. Banyak kemungkinan.</h2><p>Temukan lokasi yang sudah memiliki titik peta, lalu buka rute perjalanan.</p></div><Link className="vg-button" href="/map"><MapPin size={18}/> Jelajahi peta</Link></section>
    <section className="vg-wrap vg-section"><div className="vg-section-heading"><div><span className="vg-eyebrow">SEBELUM BERANGKAT</span><h2>Bekal perjalanan</h2></div><Link href="/artikel">Semua panduan ↗</Link></div><div className="vg-article-grid">{guides.slice(0, 3).map(a => <ArticleCard key={a.id} item={a}/>)}</div>{!guides.length && <p>Panduan perjalanan akan segera ditambahkan.</p>}</section>
  </Shell>
}
