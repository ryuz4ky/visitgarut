'use client'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import type { Tier } from '@/lib/rating/core'
import { ScoreRing, TierPill } from './bits'

export type BoardRow = { id: number; name: string; href: string; meta: string; image: string; tier: Tier; score: number | null; reviewers: number }
export type BoardTab = { key: string; label: string; href: string; rows: BoardRow[] }

/** Highest-ranked places per sector. Only places with 3+ independent reviewers are listed. */
export default function SectorBoard({ tabs }: { tabs: BoardTab[] }) {
  const [active, setActive] = useState(tabs.find(t => t.rows.length)?.key ?? tabs[0]?.key)
  const tab = tabs.find(t => t.key === active) ?? tabs[0]
  if (!tab) return null
  return <div className="vr-board">
    <div className="vr-board-tabs" role="tablist" aria-label="Sektor">
      {tabs.map(t => <button key={t.key} type="button" role="tab" id={`vr-tab-${t.key}`} aria-selected={t.key === tab.key} aria-controls="vr-board-panel" onClick={() => setActive(t.key)}>
        {t.label}{t.rows.length > 0 && <small>{t.rows.length}</small>}
      </button>)}
    </div>
    <div className="vr-board-panel" id="vr-board-panel" role="tabpanel" aria-labelledby={`vr-tab-${tab.key}`}>
      {tab.rows.length ? <ol className="vr-board-list">
        {tab.rows.map((r, i) => <li key={r.id}>
          <Link href={r.href}>
            <span className="vr-rank">{i + 1}</span>
            {r.image ? <img src={r.image} alt="" width={64} height={64} loading="lazy"/> : <span className="vr-thumb" aria-hidden="true">{r.name.slice(0, 1)}</span>}
            <span className="vr-board-name"><strong>{r.name}</strong><small>{r.meta} · {r.reviewers} penilai</small><span className="vr-tier-inline"><TierPill tier={r.tier}/></span></span>
            <TierPill tier={r.tier}/>
            <ScoreRing score={r.score} tier={r.tier}/>
          </Link>
        </li>)}
      </ol> : <div className="vr-board-empty">
        <strong>Belum ada {tab.label.toLocaleLowerCase('id-ID')} dengan skor.</strong>
        <p>Skor baru tampil setelah minimal 3 pengunjung independen menilai lewat plat QR di lokasi. Kami tidak mengisi angka tebakan.</p>
      </div>}
      <Link className="vr-board-more" href={tab.href}>Lihat semua {tab.label.toLocaleLowerCase('id-ID')}<ArrowUpRight size={16} aria-hidden="true"/></Link>
    </div>
  </div>
}
