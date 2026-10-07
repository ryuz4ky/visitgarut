import Link from 'next/link'
import { Shell } from '@/components/mvp/Shell'
import { db } from '@/lib/mvp/db'
import { categories } from '@/lib/mvp/categories'
export const dynamic='force-dynamic'
export const metadata={title:'Community Pulse — Telusuri Cerita dan Sumber Garut',description:'Periksa video, percakapan asli, riset tempat, serta pengalaman yang dikirim pengunjung sebelum merencanakan perjalanan ke Garut.',alternates:{canonical:'/community-pulse'}}
export default async function PulseHub({searchParams}:{searchParams:Promise<{q?:string;category?:string}>}){
 const params=await searchParams,q=(params.q||'').trim().slice(0,120),category=categories.some(c=>c.slug===params.category)?params.category!:''
 const rows=(await db().query(`SELECT p.id,p.name,p.category,p.slug,p.district,
 (SELECT count(*)::int FROM vg_youtube_videos v WHERE v.place_id=p.id AND v.review_status='approved' AND v.reviewed_at IS NOT NULL AND v.expires_at>now()) AS videos,
 EXISTS(SELECT 1 FROM vg_youtube_comments c JOIN vg_youtube_videos v ON v.id=c.video_id WHERE v.place_id=p.id AND v.review_status='approved' AND v.reviewed_at IS NOT NULL AND v.expires_at>now() AND c.public_status='approved' AND c.reviewed_at IS NOT NULL AND c.expires_at>now() AND c.parent_key IS NULL) AS comments,
 (SELECT count(*)::int FROM vg_social_mentions m WHERE m.place_id=p.id AND m.status='approved' AND m.platform='visitgarut' AND m.published_at>=now()-interval '90 days') AS experiences,
 (SELECT count(*)::int FROM vg_place_research r WHERE r.place_id=p.id AND r.status='approved') AS research
 FROM vg_places p WHERE p.status='published' ORDER BY comments DESC,videos DESC,p.name`)).rows
 const shown=rows.filter(p=>(!category||p.category===category)&&(!q||(p.name+' '+p.district).toLocaleLowerCase('id').includes(q.toLocaleLowerCase('id'))))
 const withVideos=rows.filter(p=>p.videos>0).length
 return <Shell><section className="vg-wrap vg-section pulse-hub"><div className="pulse-hub-hero"><span className="vg-eyebrow">COMMUNITY PULSE · GARUT</span><h1>Telusuri cerita.<br/>Periksa sumbernya.</h1><p className="vg-intro">Pilih tempat, lihat video dari berbagai pembuat, dan baca percakapan aslinya. Pengalaman yang dikirim ke VisitGarut diperiksa sebelum menjadi ringkasan.</p><div className="pulse-hub-facts"><span><strong>{rows.length}</strong> tempat untuk ditelusuri</span><span><strong>{withVideos}</strong> tempat dengan video yang diperiksa</span><Link href="/community-pulse/metode">Cara membaca bukti ↗</Link></div></div>
 <form method="get" className="pulse-hub-search"><label>Tempat yang ingin kamu periksa<input type="search" name="q" defaultValue={q} placeholder="Papandayan, pantai, hotel…"/></label><label>Kategori tempat<select name="category" defaultValue={category}><option value="">Semua kategori</option>{categories.map(c=><option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label><button className="vg-button">Cari sumber</button></form>
 <p className="pulse-disclosure">Video dan komentar penonton dibaca per sumber, tanpa digabung menjadi rating tempat. Riset pengelola dan liputan juga diberi sumber. Rating Google Maps dapat dilihat langsung di Google Maps.</p>
 <div className="vg-section-heading"><h2>Pilih tempat untuk membaca konteksnya</h2><span>{shown.length} tempat{q?' untuk “'+q+'”':''}</span></div>
 <div className="pulse-hub-grid">{shown.map(p=><article className="pulse-hub-place" key={p.id}><span className="vg-eyebrow">{categories.find(c=>c.slug===p.category)?.shortName} · {p.district||'Garut'}</span><h3><Link href={'/'+p.category+'/'+p.slug+'#community-pulse'}>{p.name}</Link></h3><div className="pulse-hub-tags">{p.videos>0&&<span>{p.videos>1?'Video dari beberapa sumber tersedia':'Video sumber tersedia'}</span>}{p.comments&&<span>Komentar asli bisa dibaca</span>}{p.research>0&&<span>Riset dengan tautan sumber</span>}{p.experiences>0&&<span>Pengalaman VisitGarut telah diperiksa</span>}</div>{!p.videos&&<p>Mulai dari riset sumber dan bagikan pengalamanmu. Video yang cocok masih diperiksa.</p>}<Link className="pulse-hub-link" href={'/'+p.category+'/'+p.slug+'#community-pulse'}>Telusuri sumber & pengalaman ↗</Link></article>)}</div>
 {!shown.length&&<div className="vg-empty"><h3>Belum ada tempat yang cocok.</h3><p>Coba nama tempat lain atau gunakan semua kategori.</p><Link className="vg-button vg-secondary" href="/community-pulse">Tampilkan semua tempat</Link></div>}
 <div className="pulse-hub-note"><h2>Ceritamu juga bisa membantu.</h2><p>Bagikan pengalaman yang kamu alami sendiri, tanggal kunjungan, serta aspek yang ingin kamu nilai. Identitas sumber dan konteks diperiksa admin. Ringkasan muncul setelah kontribusi independen mencukupi.</p><Link href="/community-pulse/metode">Lihat ambang bukti dan pemeriksaan</Link></div>
 </section></Shell>
}
