'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { platforms, sentimentNames, type Platform, type Pulse, type Sentiment, type Topic } from '@/lib/pulse/core'
import { evidenceForTopic, evidenceSentiment, filterPublicEvidence, platformEvidenceCounts, safeEvidenceSource, type EvidenceFilters } from '@/lib/pulse/evidence-view'
import { ReportForm } from './ContributionForm'

export type EvidenceOpenRequest = { token: number; topic: Topic | null; trigger: HTMLButtonElement; evidenceId?: number }
const pageSize = 20
const date = (v: string) => new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })
const platformMarks: Record<Platform,string> = {youtube:'▶',instagram:'◎',tiktok:'♪',threads:'@',x:'𝕏',visitgarut:'✦',google:'G'}
const defaults: EvidenceFilters = {platform:'', sentiment:'', sort:'newest'}

export default function EvidencePanel({
  pulse, placeId, rental = false, demo = false, request, onDismiss,
}: {
  pulse: Pulse
  placeId: number
  rental?: boolean
  demo?: boolean
  request: EvidenceOpenRequest | null
  onDismiss: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const handledToken = useRef<number | null>(null)
  const previousTopic = useRef<Topic | null | undefined>(undefined)
  const scrollArea = useRef<HTMLDivElement>(null)
  const [topic, setTopic] = useState<Topic | null>(null)
  const [focusedId, setFocusedId] = useState<number | null>(null)
  const [filters, setFilters] = useState<EvidenceFilters>(defaults)
  const [visibleCount, setVisibleCount] = useState(pageSize)

  useEffect(() => {
    if (!request || request.token === handledToken.current) return
    handledToken.current = request.token
    // Reject withheld sensitive topics before touching the dialog state.
    const status = request.topic === null ? null : pulse.topicStatuses.find(s => s.topic === request.topic)
    if (request.topic !== null && !status) return
    trigger.current = request.trigger
    if (previousTopic.current !== request.topic) {
      setFilters(defaults)
      setVisibleCount(pageSize)
      scrollArea.current?.scrollTo({ top: 0 })
    }
    previousTopic.current = request.topic
    setTopic(request.topic)
    setFocusedId(request.evidenceId ?? null)
    // Native modal handles ESC, focus trapping, and backdrop interaction.
    if (!dialog.current?.open) dialog.current?.showModal()
  }, [request, pulse.topicStatuses])

  const status = topic === null ? null : pulse.topicStatuses.find(s => s.topic === topic)
  const insight = topic === null ? null : pulse.insights.find(i => i.topic === topic)
  const related = useMemo(() => evidenceForTopic(pulse, topic), [pulse, topic])
  const counts = useMemo(() => platformEvidenceCounts(related), [related])
  const shown = useMemo(() => {
    const results = filterPublicEvidence(related, topic, filters)
    if (focusedId !== null) {
      const focus = results.find(item => item.id === focusedId)
      if (focus) return [focus, ...results.filter(item => item.id !== focusedId)]
    }
    return results
  }, [related, topic, filters, focusedId])
  const visible = shown.slice(0, visibleCount)

  const setFilter = (key: keyof EvidenceFilters, value: string) => {
    setFilters(previous => ({...previous,[key]:value}))
    setVisibleCount(pageSize)
    scrollArea.current?.scrollTo({ top: 0, behavior: 'auto' })
  }
  function close() { dialog.current?.close() }

  return <dialog ref={dialog} className="pulse-dialog pulse-evidence-drawer"
    aria-labelledby={'pulse-evidence-drawer-title-' + placeId}
    onClose={() => { trigger.current?.focus(); onDismiss() }}>
    <header className="pulse-drawer-header">
      <div>
        <span className="vg-eyebrow">COMMUNITY PULSE · BUKTI TERKURASI</span>
        <h2 id={'pulse-evidence-drawer-title-'+placeId}>{status ? 'Komentar tentang ' + status.label : 'Semua komentar & post'}</h2>
        <p>{related.length} komentar/post publikasi dalam sampel · {pulse.windowDays} hari</p>
      </div>
      <button type="button" onClick={close} aria-label="Tutup panel komentar">✕</button>
    </header>
    <div className="pulse-drawer-scroll" ref={scrollArea}>
      {insight && <section className="pulse-drawer-overview" aria-label="Ringkasan topik">
        <p>{insight.summary}</p>
        <p><strong>{insight.count}</strong> kontributor independen · {insight.sourceCount} sumber konten · {insight.platformCount} platform · Keyakinan {insight.confidence}</p>
        <div className="pulse-drawer-sentiments" aria-label="Distribusi sentimen topik">
          {(['positive','mixed','neutral','negative'] as const).map(s => <span key={s} data-sentiment={s}>{sentimentNames[s]}: {insight[s]}</span>)}
        </div>
      </section>}
      {!insight && topic !== null && <p className="pulse-insight-pending">
        {status?.sensitive ? 'Bukti topik sensitif belum dapat ditampilkan sampai pemeriksaan sumber, identitas, dan konteks selesai.' :
          'Topik ini belum memenuhi syarat ringkasan sentimen. Kontribusi individu yang boleh dipublikasikan tidak mewakili kondisi seluruh pengunjung.'}
      </p>}
      {topic === null && <p className="pulse-disclosure">Daftar ini menampilkan seluruh bukti yang tersedia dalam sampel Community Pulse, bukan seluruh komentar di internet. Komentar yang tidak lolos kurasi tidak disertakan.</p>}
      {pulse.limited && <p className="pulse-drawer-limited">Sampel backend dibatasi pada 1.000 kontribusi terbaru. Seluruh hasil yang tersedia dalam sampel ini dapat dilihat melalui tombol Muat lainnya.</p>}
      <div className="pulse-drawer-platforms" role="group" aria-label="Filter berdasarkan platform">
        <button type="button" aria-pressed={!filters.platform} onClick={() => setFilter('platform','')}>Semua <span>{related.length}</span></button>
        {counts.map(({platform,count,label}) => <button key={platform} type="button" disabled={count === 0}
          aria-pressed={filters.platform === platform}
          onClick={() => setFilter('platform',platform)}>
          <span className={'pulse-channel-icon channel-'+platform} aria-hidden="true">{platformMarks[platform]}</span>
          {label} <span>{count}</span>
        </button>)}
      </div>
      <div className="pulse-drawer-selects">
        <label>Sentimen
          <select value={filters.sentiment} onChange={e=>setFilter('sentiment',e.target.value)}>
            <option value="">Semua sentimen</option>
            {(Object.keys(sentimentNames) as Sentiment[]).map(s=><option key={s} value={s}>{sentimentNames[s]}</option>)}
          </select>
        </label>
        <label>Urutkan
          <select value={filters.sort} onChange={e=>setFilter('sort',e.target.value)}>
            <option value="newest">Terbaru</option><option value="oldest">Terlama</option>
            <option value="engagement">Interaksi sumber tertinggi</option>
          </select>
        </label>
      </div>
      <p className="pulse-drawer-count" role="status">{shown.length} hasil sesuai filter · menampilkan {visible.length}</p>
      <div className="pulse-drawer-list">
        {visible.map(item => {
          const source = safeEvidenceSource(item.source_url, item.platform)
          const sentiment = evidenceSentiment(item,topic)
          return <article key={item.id} className="pulse-drawer-comment" data-selected={focusedId === item.id}
            id={'pulse-drawer-evidence-'+item.id}>
            <div className="pulse-drawer-comment-top">
              <span className={'pulse-channel-icon channel-'+item.platform} aria-hidden="true">{platformMarks[item.platform]}</span>
              <div><strong>{item.display_name || 'Kontributor anonim'}</strong>
                <small>{item.platform === 'threads' || item.platform === 'x' ? 'Post ' : 'Komentar / pengalaman · '}{platforms[item.platform]} · {date(item.published_at)}</small>
              </div>
              {sentiment !== 'unclassified' && <span className={'pulse-comment-sentiment is-'+sentiment}>{sentimentNames[sentiment]}</span>}
            </div>
            <p className="pulse-drawer-comment-text">{item.original_text}</p>
            {item.experience_date && <small>Pengalaman tanggal {date(item.experience_date)}</small>}
            {!!item.topics.length && <div className="pulse-drawer-tags" aria-label="Topik terkait">
              {item.topics.map(t=><span key={t.topic}>{t.topic.replaceAll('_',' ')}</span>)}
            </div>}
            <div className="pulse-drawer-actions">
              {source ? <a href={source} target="_blank" rel="noopener noreferrer">Buka sumber asli ↗</a> :
                <span>Sumber langsung tidak tersedia untuk dibuka</span>}
              {!demo && <ReportForm placeId={placeId} mentionId={item.id}/>}
            </div>
          </article>
        })}
        {!shown.length && <div className="pulse-drawer-empty">
          <p>Tidak ada komentar yang memenuhi filter ini.</p>
          <button type="button" onClick={()=>{setFilters(defaults);setVisibleCount(pageSize)}}>Reset filter</button>
        </div>}
        {shown.length > visibleCount && <button type="button" className="pulse-drawer-load"
          onClick={()=>setVisibleCount(n=>n+pageSize)}>
          Muat {Math.min(pageSize,shown.length-visibleCount)} komentar lainnya
          <small>{Math.max(0,shown.length-visibleCount)} belum ditampilkan</small>
        </button>}
      </div>
      <footer className="pulse-drawer-footer">
        <p>Jumlah komentar/post dan jumlah kontributor independen adalah metrik berbeda. Komentar yang membahas beberapa topik dapat muncul di lebih dari satu daftar.</p>
        {!demo && <a href={'#pengalaman-form-'+placeId} onClick={close}>Bagikan pengalaman{rental?' menyewamu':' kunjunganmu'}</a>}
        <a href="/community-pulse/metode">Baca metodologi Community Pulse</a>
      </footer>
    </div>
  </dialog>
}
