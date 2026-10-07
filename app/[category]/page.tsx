import { notFound } from 'next/navigation'
import { Shell,CategoryNav,SearchForm,PlaceGrid,Breadcrumbs } from '@/components/mvp/Shell'
import { categories,places } from '@/lib/mvp/data'
export const dynamic='force-dynamic'
export async function generateMetadata({params}:{params:Promise<{category:string}>}){const {category}=await params;const c=categories.find(x=>x.slug===category);return c?{title:`${c.name} di Garut`,description:c.description,alternates:{canonical:`/${category}`}}:{title:'Halaman tidak ditemukan',robots:{index:false}}}
export default async function Category({params}:{params:Promise<{category:string}>}){const {category}=await params;const c=categories.find(x=>x.slug===category);if(!c)notFound();const items=await places({category});return <Shell><section className="vg-wrap vg-section"><Breadcrumbs items={[{name:c.name,path:`/${category}`}]}/><span className="vg-eyebrow">JELAJAHI GARUT</span><h1>{c.name} di Garut</h1><p className="vg-intro">{c.description}</p><SearchForm category={category}/><CategoryNav active={category}/><p className="vg-count">{items.length} tempat dalam direktori</p><PlaceGrid items={items}/></section></Shell>}
