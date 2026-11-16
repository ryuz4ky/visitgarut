'use client'
import { useEffect } from 'react'

type Props = Record<string, string>
declare global { interface Window { plausible?: (e: string, o?: { props?: Props }) => void; gtag?: (...a: unknown[]) => void } }

/** Sends one event to whichever analytics tool is loaded. No personal data: only the event name, page path and a short label. */
export function track(name: string, props: Props = {}) {
  const p = { path: location.pathname, ...props }
  try { window.plausible?.(name, { props: p }) } catch {}
  try { window.gtag?.('event', name, p) } catch {}
}

/** Business events (KPI): plan started, search, WhatsApp/phone/Maps clicks, QR plate request, owner data update, and any element with data-vg-event. */
export default function AnalyticsEvents() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.('a,button,[data-vg-event]')
      if (!el) return
      const custom = el.getAttribute('data-vg-event')
      if (custom && el.tagName !== 'FORM') return track(custom)
      const href = el.getAttribute('href') || ''
      if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) track('whatsapp_click')
      else if (href.startsWith('tel:')) track('phone_click')
      else if (/google\.[a-z.]+\/maps|maps\.google\./.test(href)) track('maps_click')
    }
    const onSubmit = (e: SubmitEvent) => {
      const f = e.target as HTMLFormElement
      const custom = f.getAttribute('data-vg-event')
      if (custom) return track(custom)
      const action = f.getAttribute('action') || ''
      if (action === '/trip') track('plan_start', { intent: String(new FormData(f).get('intent') || '') })
      else if (action === '/search') track('search')
    }
    document.addEventListener('click', onClick, true)
    document.addEventListener('submit', onSubmit, true)
    return () => { document.removeEventListener('click', onClick, true); document.removeEventListener('submit', onSubmit, true) }
  }, [])
  return null
}
