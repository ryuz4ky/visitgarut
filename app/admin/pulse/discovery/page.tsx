import Link from 'next/link'
import { Shell } from '@/components/mvp/Shell'
import { requireAdmin } from '@/lib/mvp/auth'
import { db } from '@/lib/mvp/db'
import { platforms } from '@/lib/pulse/core'
import { runDiscovery,reviewDiscovery } from './actions'

export const dynamic='force-dynamic'
export const metadata={title:'Discovery sumber publik',robots:{index:false,follow:false}}

export default async function DiscoveryAdmin({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 await requireAdmin();const params=await searchParams;const selected=Number(params.place)||0
 const places=(await db().query("SELECT id,name FROM vg_places WHERE status='published' ORDER BY name")).rows
 const rows=(await db().query(`SELECT d.*,p.name AS place_name FROM vg_discovery_sources d JOIN vg_places p ON p.id=d.place_id WHERE ($1::int=0 OR d.place_id=$1) ORDER BY d.discovered_at DESC,d.relevance_score DESC LIMIT 300`,[selected])).rows
 const message:Record<string,string>={place:'Tempat tidak ditemukan.',limit:'Batas aman discovery untuk tempat ini hari ini sudah tercapai.',search:'Pencarian publik gagal dijalankan.',missing:'Kandidat tidak ditemukan.',decision:'Keputusan tidak valid.'}
 return <Shell><section className="vg-wrap vg-section"><div className="vg-section-heading"><div><span className="vg-eyebrow">ADMIN VISITGARUT</span><h1>Discovery sumber publik</h1></div><Link href="/admin/pulse">Kembali ke Community Pulse</Link></div>
 <p>Menemukan URL post/video publik dari Instagram, TikTok, Threads, dan X melalui hasil pencarian web publik. Kandidat yang lolos validasi URL dan skor relevansi minimal 70 langsung masuk sebagai konten sosial tanpa approval manual.</p>
 <p><strong>Penting:</strong> auto-ingest hanya membuat <code>vg_social_contents</code>. Judul/snippet pencarian tidak pernah dianggap review, sentimen, atau bukti Community Pulse, dan tidak membuat <code>vg_social_mentions</code> otomatis.</p>
 {params.ingested&&<p role="status" className="vg-alert success">Discovery selesai. {Number(params.ingested)||0} sumber langsung masuk konten sosial.</p>}{params.skipped&&<p className="vg-alert">{Number(params.skipped)||0} kandidat dilewati karena skor rendah atau validasi gagal.</p>}{params.saved&&<p role="status" className="vg-alert success">Sumber ditarik dari konten sosial.</p>}{params.error&&<p role="alert" className="vg-alert">{message[params.error]||'Terjadi kesalahan.'}</p>}{params.warnings&&<p className="vg-alert">Sebagian pencarian gagal: {params.warnings}</p>}
 <form className="vg-editor" action={runDiscovery}><label>Tempat<select name="place_id" required defaultValue={selected||places[0]?.id}>{places.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button className="vg-button">Cari & masukkan sumber publik</button><small>Maksimal 5 proses discovery per tempat per hari. Satu proses menjalankan maksimal 12 query dan memproses maksimal 60 URL unik.</small></form>
 <div className="vg-admin-tabs"><Link href="/admin/pulse/discovery" className={!selected?'active':''}>Semua</Link>{places.slice(0,12).map(p=><Link key={p.id} className={selected===p.id?'active':''} href={`/admin/pulse/discovery?place=${p.id}`}>{p.name}</Link>)}</div>
 <div className="pulse-reports">{!rows.length&&<p>Belum ada hasil discovery.</p>}{rows.map(r=><article className="pulse-evidence" key={r.id}><small>{r.place_name} · {platforms[r.platform as keyof typeof platforms]} · skor {r.relevance_score}/100 · {r.status}</small><h2>{r.source_title||'Tanpa judul'}</h2><p><a href={r.source_url} target="_blank" rel="noreferrer">Buka sumber asli</a></p><small>Query: {r.search_query}</small>{r.content_id&&r.status==='approved'&&<><p><Link href={`/admin/pulse?tab=content&edit=${r.content_id}`}>Buka konten sosial #{r.content_id}</Link></p><form action={reviewDiscovery}><input type="hidden" name="id" value={r.id}/><button className="vg-button vg-secondary" name="decision" value="reject">Tarik / tolak sumber ini</button></form></>}{r.status==='rejected'&&<p><small>Sumber sudah ditolak dan tidak aktif sebagai konten sosial.</small></p>}</article>)}</div>
 </section></Shell>
}
