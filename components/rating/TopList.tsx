import Link from 'next/link'
import type { BoardRow } from './SectorBoard'
import { ScoreRing, TierPill } from './bits'

/** Ranked list without tabs, for sector pages and "compare" boxes. */
export default function TopList({ rows, compact = false }: { rows: BoardRow[]; compact?: boolean }) {
  return <ol className={compact ? 'vr-board-list is-compact' : 'vr-board-list'}>
    {rows.map((r, i) => <li key={r.id}>
      <Link href={r.href}>
        <span className="vr-rank">{i + 1}</span>
        {r.image ? <img src={r.image} alt="" width={64} height={64} loading="lazy"/> : <span className="vr-thumb" aria-hidden="true">{r.name.slice(0, 1)}</span>}
        <span className="vr-board-name"><strong>{r.name}</strong><small>{r.meta} · {r.reviewers} pengunjung</small><span className="vr-tier-inline"><TierPill tier={r.tier}/></span></span>
        <TierPill tier={r.tier}/>
        <ScoreRing score={r.score} tier={r.tier} size={compact ? 'sm' : 'md'}/>
      </Link>
    </li>)}
  </ol>
}
