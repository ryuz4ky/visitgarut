'use client'
import { useState, type CSSProperties } from 'react'
import { buildGlobeNodes, type GlobeNode } from '@/lib/pulse/globe'
import { sentimentNames, type Pulse, type Topic } from '@/lib/pulse/core'

const legend = [
  { key: 'positive', label: 'Positif' },
  { key: 'neutral', label: 'Netral' },
  { key: 'mixed', label: 'Campuran' },
  { key: 'negative', label: 'Keluhan' },
] as const

export default function PulseGlobe({
  pulse,
  onOpenTopic,
}: {
  pulse: Pulse
  onOpenTopic: (topic: Topic, trigger: HTMLButtonElement) => void
}) {
  const nodes = buildGlobeNodes(pulse)
  const [paused, setPaused] = useState(false)
  const [active, setActive] = useState<Topic | null>(null)
  const max = Math.max(1, ...nodes.map(n => n.contributors))

  function select(node: GlobeNode, button: HTMLButtonElement) {
    setActive(node.topic)
    setPaused(true)
    onOpenTopic(node.topic, button)
  }

  return <section className="pulse-globe" aria-labelledby="pulse-globe-title">
    <div className="pulse-globe-intro">
      <div>
        <span className="vg-eyebrow">COMMUNITY INTELLIGENCE</span>
        <h3 id="pulse-globe-title">Pulse Globe · Apa kata pengunjung?</h3>
        <p>Topik percakapan dalam sampel yang telah diperiksa, selama {pulse.windowDays} hari terakhir.</p>
      </div>
      {nodes.length > 0 && <button type="button" className="pulse-globe-pause" aria-pressed={paused}
        onClick={() => setPaused(p => !p)}>{paused ? '▶ Lanjutkan animasi' : 'Ⅱ Jeda animasi'}</button>}
    </div>
    <div className="pulse-globe-layout">
      <div className="pulse-globe-stage" data-paused={paused} aria-label="Visualisasi topik yang telah memenuhi persyaratan bukti">
        <div className="pulse-globe-sphere" aria-hidden="true">
          <div className="pulse-globe-equator" />
          <div className="pulse-globe-meridian" />
          <div className="pulse-globe-latitude" />
        </div>
        {nodes.length > 0 ? nodes.map(node => {
          const style = {
            left: (50 + node.x * 37) + '%',
            top: (50 - node.y * 37) + '%',
            '--pulse-scale': String(.8 + .28 * Math.sqrt(node.contributors / max)),
            '--pulse-delay': (-nodes.indexOf(node) * .35) + 's',
            opacity: Math.max(.68, .85 + node.depth * .13),
          } as CSSProperties
          return <button key={node.topic} type="button" className="pulse-globe-node"
            data-sentiment={node.sentiment} data-active={active === node.topic}
            style={style} aria-haspopup="dialog"
            aria-label={node.label + ', ' + node.contributors + ' kontributor, sentimen ' + sentimentNames[node.sentiment] + '. Baca bukti.'}
            onClick={e => select(node, e.currentTarget)}>
            <strong>{node.label}</strong><small>{node.contributors} kontributor</small>
          </button>
        }) : <div className="pulse-globe-empty">
          <strong>Pengalaman belum mencukupi</strong>
          <p>Belum ada topik yang memenuhi syarat publikasi. Baca riset tempat atau bagikan pengalamanmu.</p>
        </div>}
      </div>
      <div className="pulse-globe-side">
        <p className="pulse-globe-caption">Ringkasan pengalaman terkurasi</p>
        {nodes.length ? <>
          <strong className="pulse-globe-total">{pulse.classified} kontributor terklasifikasi</strong>
          <small>Jumlah keseluruhan bukan penjumlahan topik; satu orang dapat membahas beberapa aspek.</small>
          <div className="pulse-globe-legend" aria-label="Legenda sentimen">
            {legend.map(item => <span key={item.key} data-sentiment={item.key}>{item.label}</span>)}
          </div>
          {pulse.positivePercent !== null ? <p className="pulse-globe-stat">{pulse.positivePercent}% sentimen positif secara keseluruhan</p>
            : <p className="pulse-globe-stat">Persentase keseluruhan menunggu sampel yang mencukupi.</p>}
          <p className="pulse-globe-caption">Topik yang dapat dibuka</p>
          <div className="pulse-globe-chips">{nodes.map(node =>
            <button type="button" key={node.topic} aria-haspopup="dialog"
              onClick={e => select(node, e.currentTarget)}>{node.label} <span>{node.contributors}</span></button>)}</div>
          <p className="pulse-globe-method">Ukuran node merepresentasikan kontributor berbeda, bukan jumlah komentar mentah. Keyakinan menunjukkan kecukupan sampel, bukan kepastian sebuah klaim.</p>
        </> : <p>Belum ada hasil sentimen yang dapat disimpulkan dari sampel ini.</p>}
      </div>
    </div>
    {nodes.length > 0 && <div className="pulse-globe-seo-summary">
      <h4>Topik pengalaman yang memenuhi syarat publikasi</h4>
      <ul>{nodes.map(node => <li key={node.topic}><strong>{node.label}</strong> — {node.summary} ({node.contributors} kontributor berbeda; keyakinan {node.confidence}).</li>)}</ul>
    </div>}
  </section>
}
