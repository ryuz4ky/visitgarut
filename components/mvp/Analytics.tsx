import Script from 'next/script'
import AnalyticsEvents from './AnalyticsEvents'

/**
 * Site analytics, off until the owner sets an ID in the production env (read at request time, so no rebuild is needed):
 *   PLAUSIBLE_DOMAIN=visitgarut.com            cookieless; PLAUSIBLE_SRC overrides the script URL (self-hosted Plausible)
 *   GA_MEASUREMENT_ID=G-XXXXXXXXXX              Google Analytics 4
 * Both may be set. Values are validated so nothing else can be injected into the page.
 */
const plausibleDomain = () => { const v = (process.env.PLAUSIBLE_DOMAIN || '').trim(); return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(v) ? v : '' }
const plausibleSrc = () => { const v = (process.env.PLAUSIBLE_SRC || '').trim(); return /^https:\/\/[^\s"'<>]+\.js$/.test(v) ? v : 'https://plausible.io/js/script.js' }
const gaId = () => { const v = (process.env.GA_MEASUREMENT_ID || '').trim(); return /^G-[A-Z0-9]{4,20}$/.test(v) ? v : '' }

export default function Analytics() {
  const domain = plausibleDomain(), ga = gaId()
  if (!domain && !ga) return null
  return <>
    {domain && <>
      <Script id="vg-plausible-queue" strategy="afterInteractive">{'window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}'}</Script>
      <Script src={plausibleSrc()} data-domain={domain} strategy="afterInteractive"/>
    </>}
    {ga && <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive"/>
      <Script id="vg-ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}')`}</Script>
    </>}
    <AnalyticsEvents/>
  </>
}
