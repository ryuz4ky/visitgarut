import Link from 'next/link'
import { Mountain, BedDouble, Utensils, Coffee, Car, ArrowUpRight, MapPin, Compass, MapPinned, Orbit, BookOpenText, Route, CalendarDays } from 'lucide-react'
import { Shell, SearchForm, PlaceGrid, ArticleCard, JsonLd } from '@/components/mvp/Shell'
import { places, articles, categories } from '@/lib/mvp/data'
import { siteUrl, absoluteUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Wisata, Kuliner, Hotel & Itinerary Garut — VisitGarut',
  description: 'Jelajahi wisata, kuliner, kafe, hotel, dan rental kendaraan di Garut. Temukan informasi bersumber, peta lokasi, dan susun rencana perjalananmu.',
  alternates: { canonical: '/' },
}
const icons: Record<string, typeof Mountain> = { Mountain, BedDouble, Utensils, Coffee, Car, Compass }
const collections = [
  { slug: 'wisata', title: 'Ke alam, ke pantai, ke Garut', note: 'Temukan tujuan wisata dan baca informasi kunjungannya.' },
  { slug: 'kuliner', title: 'Singgah untuk rasa lokal', note: 'Kenali tempat makan dan kanal pengelolanya.' },
  { slug: 'cafe', title: 'Waktunya ngopi', note: 'Pilih kafe untuk rehat di sela perjalanan.' },
  { slug: 'hotel', title: 'Temukan tempat beristirahat', note: 'Jelajahi penginapan sebelum menghubungi pengelola.' },
  { slug: 'transportasi', title: 'Lanjutkan perjalananmu', note: 'Rental mobil, motor, dan kendaraan rombongan di Garut.' },
]

export default async function Home() {
  const [items, guides] = await Promise.all([places(), articles()])
  const districts = new Set(items.map(p => p.district).filter(Boolean)).size
  const visibleCollections = collections.map(c => ({ ...c, items: items.filter(p => p.category === c.slug).sort((a, b) => Number(Boolean(b.image_url)) - Number(Boolean(a.image_url))).slice(0, 3) })).filter(c => c.items.length)
  return <Shell>
    <JsonLd data={{ '@context': 'https://schema.org', '@graph': [
      { '@type': 'Organization', '@id': `${siteUrl}/#organization`, name: 'VisitGarut', url: siteUrl },
      { '@type': 'WebSite', '@id': `${siteUrl}/#website`, name: 'VisitGarut', url: siteUrl, inLanguage: 'id-ID', publisher: { '@id': `${siteUrl}/#organization` } },
      { '@type': 'CollectionPage', '@id': `${siteUrl}/#home`, url: siteUrl, name: 'Wisata, Kuliner, Hotel & Itinerary Garut', isPartOf: { '@id': `${siteUrl}/#website` }, inLanguage: 'id-ID', mainEntity: { '@type': 'ItemList', itemListElement: visibleCollections.flatMap(c => c.items).map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, url: absoluteUrl(`/${p.category}/${p.slug}`) })) } },
    ] }}/>
    <div className="vg-travel-home">
      <section className="vg-dashboard-top vg-wrap" aria-labelledby="vg-home-title">
        <div className="vg-dashboard-greeting"><div><span className="vg-eyebrow">HALO, PENJELAJAH GARUT</span><h1 id="vg-home-title">Mau ke mana di Garut?</h1><p>Wisata, kuliner, penginapan, dan perjalanan. Mulai dari pilihanmu.</p></div><Link className="vg-dashboard-map" href="/map" aria-label="Jelajahi peta Garut"><MapPinned size={25}/></Link></div>
        <SearchForm/>
        <div className="vg-dashboard-context"><MapPin size={16} aria-hidden="true"/><span>Garut, Jawa Barat</span><span>{items.length} tempat & layanan</span><span>{districts} wilayah</span></div>
        <div className="vg-dashboard-banners">
          <Link className="vg-destination-banner" href="/wisata/gunung-papandayan"><img src="/papandayan.jpg" alt="Lanskap pegunungan dan kawah Papandayan di Garut" width={1200} height={800} fetchPriority="high"/><div><span className="vg-banner-label">JELAJAH WISATA ALAM</span><h2>Satu perjalanan.<br/>Banyak cerita.</h2><span className="vg-banner-action">Kenali Gunung Papandayan <ArrowUpRight size={18}/></span><small>Foto: Tantan Nurdiansyah · CC BY-SA 4.0</small></div></Link>
          <div className="vg-itinerary-banner"><span className="vg-itinerary-icon"><Route size={30} aria-hidden="true"/></span><span className="vg-eyebrow">RENCANA PERJALANAN</span><h2>Liburanmu,<br/>pilihanmu.</h2><p>Pilih minat, titik awal, dan durasi. Susun rencana dari tempat yang memiliki sumber dan koordinat.</p><Link className="vg-button" href="/trip">Susun itinerary <ArrowUpRight size={17}/></Link><small>Peta dan informasi tempat membantu kamu memeriksa rencana sebelum berangkat.</small></div>
        </div>
        <nav className="vg-dashboard-categories" aria-label="Mulai dari kategori">{categories.map(c => { const Icon = icons[c.icon] || Compass; return <Link key={c.slug} href={`/${c.slug}`}><Icon size={20} aria-hidden="true"/><span>{c.shortName}</span></Link> })}</nav>
      </section>

      <section className="vg-wrap vg-discovery-choices" aria-labelledby="vg-discovery-title">
        <div className="vg-section-heading"><div><span className="vg-eyebrow">PILIH CARA JELAJAH</span><h2 id="vg-discovery-title">Garut, sesuai caramu</h2></div></div>
        <div className="vg-choice-grid">
          <Link href="/map"><MapPinned aria-hidden="true" size={25}/><strong>Jelajahi lewat peta</strong><span>Temukan lokasi wisata dan layanan yang sudah punya titik peta.</span><small>Buka peta ↗</small></Link>
          <Link href="/community-pulse"><Orbit aria-hidden="true" size={25}/><strong>Kenali info & pengalaman</strong><span>Telusuri informasi tempat, sumber, dan pengalaman pengunjung melalui Community Pulse.</span><small>Jelajahi Community Pulse ↗</small></Link>
          <Link href="/artikel"><BookOpenText aria-hidden="true" size={25}/><strong>Temukan ide perjalanan</strong><span>Baca panduan untuk mengenal Garut dan merencanakan kunjungan.</span><small>Baca panduan ↗</small></Link>
        </div>
      </section>

      {visibleCollections.map(c => <section key={c.slug} className="vg-wrap vg-section vg-home-collection" aria-labelledby={`home-${c.slug}`}><div className="vg-section-heading"><div><span className="vg-eyebrow">{categories.find(x => x.slug === c.slug)?.name.toUpperCase()} GARUT</span><h2 id={`home-${c.slug}`}>{c.title}</h2><p className="vg-heading-note">{c.note}</p></div><Link href={`/${c.slug}`}>Lihat semua {categories.find(x => x.slug === c.slug)?.shortName.toLowerCase()} <span aria-hidden="true">↗</span></Link></div><PlaceGrid items={c.items}/></section>)}
      {!items.length && <section className="vg-wrap vg-section"><PlaceGrid items={[]}/></section>}

      <section className="vg-wrap vg-dashboard-event"><div className="vg-event-icon"><CalendarDays size={28} aria-hidden="true"/></div><div><span className="vg-eyebrow">ADA APA DI GARUT?</span><h2>Lengkapi perjalanan dengan kegiatan lokal</h2><p>Lihat event yang tercantum beserta waktu, lokasi, dan sumber informasinya.</p></div><Link className="vg-button" href="/event">Lihat event <ArrowUpRight size={17}/></Link></section>
      <section className="vg-wrap vg-section"><div className="vg-section-heading"><div><span className="vg-eyebrow">SEBELUM BERANGKAT</span><h2>Bekal perjalanan</h2></div><Link href="/artikel">Semua panduan ↗</Link></div><div className="vg-article-grid">{guides.slice(0, 3).map(a => <ArticleCard key={a.id} item={a}/>)}</div>{!guides.length && <p>Panduan perjalanan akan segera ditambahkan.</p>}</section>
      <section className="vg-wrap vg-home-guide" aria-labelledby="home-guide-title"><span className="vg-eyebrow">KENALI VISITGARUT</span><h2 id="home-guide-title">Panduan lokal untuk perjalananmu di Garut</h2><p>VisitGarut membantu kamu menemukan tempat wisata, hotel, kuliner, kafe, dan penyedia rental kendaraan di Kabupaten Garut, Jawa Barat. Setiap halaman tempat memuat informasi kunjungan dan sumber yang dapat ditelusuri. Globe informasi menyajikan topik praktis untuk dibaca sebelum menentukan tujuan.</p><div><h3>Bagaimana mulai merencanakan perjalanan?</h3><p>Pilih <Link href="/wisata">destinasi wisata Garut</Link>, kenali <Link href="/hotel">penginapan</Link>, lalu buka <Link href="/trip">perencana perjalanan</Link> untuk menyusun urutan tempat berdasarkan kedekatan koordinat. Periksa rute, jam buka, biaya, dan ketersediaan kepada pengelola sebelum berangkat.</p><h3>Dari mana informasi tempat berasal?</h3><p>Informasi bersumber dari pengelola, instansi, dan referensi publik yang dicantumkan pada halaman tempat. Catatan riset menyertakan tanggal pemeriksaan sumber. Pengalaman pengunjung ditampilkan melalui <Link href="/community-pulse">Community Pulse</Link> ketika bukti yang tersedia mencukupi.</p></div></section>
    </div>
  </Shell>
}
