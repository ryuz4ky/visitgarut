'use client'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { buildGlobeNodes, type GlobeNode } from '@/lib/pulse/globe'
import { clampPitch, projectGlobePoint } from '@/lib/pulse/globe-motion'
import { sentimentNames, type Pulse, type Topic } from '@/lib/pulse/core'

const legend = [
  { key: 'positive', label: 'Positif' },
  { key: 'neutral', label: 'Netral' },
  { key: 'mixed', label: 'Campuran' },
  { key: 'negative', label: 'Keluhan' },
] as const

type DragState = { id: number; x: number; y: number; startX: number; startY: number; moved: boolean }
type MotionState = {
  yaw: number
  pitch: number
  hoverYaw: number
  hoverPitch: number
  pointerX: number
  pointerY: number
  hovered: boolean
  focused: boolean
  dragging: DragState | null
  velocityYaw: number
  velocityPitch: number
  reduced: boolean
  lastFrame: number
}

export default function PulseGlobe({
  pulse,
  onOpenTopic,
}: {
  pulse: Pulse
  onOpenTopic: (topic: Topic, trigger: HTMLButtonElement) => void
}) {
  const nodes = useMemo(() => buildGlobeNodes(pulse), [pulse])
  const stageRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  const [active, setActive] = useState<Topic | null>(null)
  const suppressClick = useRef(false)
  const motion = useRef<MotionState>({
    yaw: 0, pitch: 0, hoverYaw: 0, hoverPitch: 0,
    pointerX: 0, pointerY: 0, hovered: false, focused: false,
    dragging: null, velocityYaw: 0, velocityPitch: 0,
    reduced: false, lastFrame: 0,
  })
  const max = Math.max(1, ...nodes.map(n => n.contributors))
  const mostDiscussed = nodes.reduce<GlobeNode | null>(
    (best, node) => !best || node.contributors > best.contributors ? node : best, null)

  useEffect(() => { pausedRef.current = paused }, [paused])

  // Animates only visible, rendered nodes. Do not store per-frame values in React
  // state: limiting DOM writes avoids 60 re-renders/second on low-end phones.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || !nodes.length) return
    const buttons = Array.from(stage.querySelectorAll<HTMLButtonElement>('[data-globe-topic]'))
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const state = motion.current
    state.reduced = query.matches
    const onPreferenceChange = (e: MediaQueryListEvent) => { state.reduced = e.matches }
    query.addEventListener('change', onPreferenceChange)
    let raf = 0
    let visible = false

    function tick(now: number) {
      if (!visible || document.hidden) { raf = 0; return }
      const dt = Math.min(48, Math.max(0, now - (state.lastFrame || now)))
      state.lastFrame = now
      if (!pausedRef.current && !state.reduced && !state.hovered && !state.focused && !state.dragging) {
        // One idle revolution is about 80 seconds; decelerate drag momentum.
        state.yaw += dt * (Math.PI * 2 / 80000)
        state.yaw += state.velocityYaw * dt
        state.pitch = clampPitch(state.pitch + state.velocityPitch * dt)
        const friction = Math.pow(0.9, dt / 16)
        state.velocityYaw *= friction
        state.velocityPitch *= friction
      }
      const targetYaw = state.hovered && !state.reduced ? state.pointerX * 0.45 : 0
      const targetPitch = state.hovered && !state.reduced ? -state.pointerY * 0.3 : 0
      const smoothing = Math.min(1, dt / 150)
      state.hoverYaw += (targetYaw - state.hoverYaw) * smoothing
      state.hoverPitch += (targetPitch - state.hoverPitch) * smoothing
      const yaw = state.yaw + (state.reduced ? 0 : state.hoverYaw)
      const pitch = clampPitch(state.pitch + (state.reduced ? 0 : state.hoverPitch))
      nodes.forEach((node, index) => {
        const el = buttons[index]
        if (!el) return
        const p = projectGlobePoint(node, yaw, pitch)
        el.style.left = p.left.toFixed(3) + '%'
        el.style.top = p.top.toFixed(3) + '%'
        el.style.opacity = p.opacity.toFixed(3)
        el.style.zIndex = String(Math.round((p.depth + 1) * 100))
        el.style.setProperty('--pulse-scale',
          String((0.8 + 0.28 * Math.sqrt(node.contributors / max)) * p.perspective))
        el.style.pointerEvents = p.front ? 'auto' : 'none'
      })
      raf = window.requestAnimationFrame(tick)
    }

    function onVisibility() {
      if (document.hidden) {
        window.cancelAnimationFrame(raf)
        raf = 0
        state.lastFrame = 0
      } else if (visible && !raf) {
        raf = window.requestAnimationFrame(tick)
      }
    }
    const observer = new IntersectionObserver(entries => {
      visible = Boolean(entries[0]?.isIntersecting)
      if (visible && !document.hidden && !raf) raf = window.requestAnimationFrame(tick)
      else if (!visible) { window.cancelAnimationFrame(raf); raf = 0; state.lastFrame = 0 }
    }, { threshold: 0.01 })
    observer.observe(stage)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      observer.disconnect()
      query.removeEventListener('change', onPreferenceChange)
      document.removeEventListener('visibilitychange', onVisibility)
      window.cancelAnimationFrame(raf)
      state.lastFrame = 0
    }
  }, [nodes, max])

  function select(node: GlobeNode, button: HTMLButtonElement) {
    setActive(node.topic)
    setPaused(true)
    motion.current.velocityYaw = 0
    motion.current.velocityPitch = 0
    onOpenTopic(node.topic, button)
  }

  function pointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || !nodes.length) return
    const state = motion.current
    state.dragging = {
      id: e.pointerId, x: e.clientX, y: e.clientY,
      startX: e.clientX, startY: e.clientY, moved: false,
    }
    state.velocityYaw = 0
    state.velocityPitch = 0
    suppressClick.current = false
  }

  function pointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const state = motion.current
    if (e.pointerType === 'mouse') {
      state.hovered = true
      const rect = e.currentTarget.getBoundingClientRect()
      state.pointerX = Math.max(-1, Math.min(1, (e.clientX - rect.left) * 2 / rect.width - 1))
      state.pointerY = Math.max(-1, Math.min(1, (e.clientY - rect.top) * 2 / rect.height - 1))
    }
    const drag = state.dragging
    if (!drag || drag.id !== e.pointerId) return
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y
    if (!drag.moved && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 7) {
      drag.moved = true
      suppressClick.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (drag.moved) {
      state.yaw += dx * 0.009
      state.pitch = clampPitch(state.pitch + dy * 0.009)
      state.velocityYaw = dx * 0.009 / 16
      state.velocityPitch = dy * 0.009 / 16
    }
    drag.x = e.clientX
    drag.y = e.clientY
  }

  function pointerEnd(e: ReactPointerEvent<HTMLDivElement>) {
    const state = motion.current
    if (state.dragging?.id !== e.pointerId) return
    state.dragging = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }

  return <section className="pulse-globe" aria-labelledby="pulse-globe-title">
    <div className="pulse-globe-intro">
      <div>
        <span className="vg-eyebrow">COMMUNITY INTELLIGENCE</span>
        <h3 id="pulse-globe-title">Pulse Globe · Apa kata pengunjung?</h3>
        <p>Topik percakapan dalam sampel yang telah diperiksa, selama {pulse.windowDays} hari terakhir.</p>
        <p className="pulse-globe-hint">Gerakkan mouse untuk mengarahkan globe, tarik untuk memutar, atau geser dengan jari di layar sentuh.</p>
      </div>
      {nodes.length > 0 && <button type="button" className="pulse-globe-pause" aria-pressed={paused}
        onClick={() => setPaused(p => !p)}>{paused ? '▶ Putar otomatis' : 'Ⅱ Jeda putaran otomatis'}</button>}
    </div>
    <div className="pulse-globe-layout">
      <div ref={stageRef} className="pulse-globe-stage" data-paused={paused}
        aria-label="Visualisasi topik. Gerakkan pointer atau geser untuk memutar globe; setiap topik juga tersedia di daftar tombol."
        onPointerDown={pointerDown} onPointerMove={pointerMove}
        onPointerEnter={e => { if (e.pointerType === 'mouse') motion.current.hovered = true }}
        onPointerLeave={() => { motion.current.hovered = false }}
        onPointerUp={pointerEnd} onPointerCancel={pointerEnd}
        onFocusCapture={() => { motion.current.focused = true }}
        onBlurCapture={e => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) motion.current.focused = false
        }}
        onClickCapture={e => { if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); suppressClick.current = false } }}>
        <div className="pulse-globe-sphere" aria-hidden="true">
          <div className="pulse-globe-equator" />
          <div className="pulse-globe-meridian" />
          <div className="pulse-globe-latitude" />
        </div>
        {nodes.length > 0 ? <div className="pulse-globe-rotor">{nodes.map(node => {
          const size = 0.8 + 0.28 * Math.sqrt(node.contributors / max)
          const style = {
            left: (50 + node.x * 37) + '%',
            top: (50 - node.y * 37) + '%',
            '--pulse-scale': String(size),
            opacity: Math.max(.68, .85 + node.depth * .13),
          } as CSSProperties
          return <button key={node.topic} type="button" className="pulse-globe-node"
            data-globe-topic={node.topic}
            data-sentiment={node.sentiment} data-dominant={node.topic === mostDiscussed?.topic} data-active={active === node.topic}
            style={style} aria-haspopup="dialog"
            aria-label={node.label + ', ' + node.contributors + ' kontributor, sentimen ' + sentimentNames[node.sentiment] + '. Baca bukti.'}
            onClick={e => select(node, e.currentTarget)}>
            <strong>{node.label}</strong><small>{node.contributors} kontributor</small>
          </button>
        })}</div> : <div className="pulse-globe-empty">
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
