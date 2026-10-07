import { Shell } from '@/components/mvp/Shell'
export default function Loading() {
  return <Shell><section className="vg-wrap vg-section" aria-busy="true"><p className="vg-loading-status" role="status">Memuat informasi tempat…</p><div className="vg-loading-heading" aria-hidden="true"/><div className="vg-grid" aria-hidden="true">{[0,1,2].map(i=><div className="vg-loading-card" key={i}/>)}</div></section></Shell>
}
