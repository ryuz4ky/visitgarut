import { Shell,Breadcrumbs,ArticleCard } from '@/components/mvp/Shell'
import { articles } from '@/lib/mvp/data'
export const dynamic='force-dynamic'
export const metadata={title:'Artikel & Panduan Perjalanan Garut',description:'Rencanakan perjalanan ke Garut dengan panduan tempat, wilayah, dan persiapan kunjungan.',alternates:{canonical:'/artikel'}}
export default async function Articles(){const items=await articles();return <Shell><section className="vg-wrap vg-section"><Breadcrumbs items={[{name:'Artikel',path:'/artikel'}]}/><span className="vg-eyebrow">BEKAL PERJALANAN</span><h1>Kenali Garut sebelum berangkat.</h1><p className="vg-intro">Panduan untuk memilih tempat dan merencanakan perjalanan.</p><div className="vg-article-grid">{items.map(a=><ArticleCard key={a.id} item={a}/>)}</div>{!items.length&&<p>Panduan akan segera tersedia.</p>}</section></Shell>}
