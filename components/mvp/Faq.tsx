import { JsonLd } from '@/components/mvp/Shell'
import { faqJsonLd, type Faq } from '@/lib/mvp/faq'

/** Visible Q&A block plus matching FAQPage data. The visible text and the structured data are always identical. */
export default function FaqBlock({ id = 'tanya-jawab', title, intro, items, card = true }: { id?: string; title: string; intro?: string; items: Faq[]; card?: boolean }) {
  if (!items.length) return null
  return <section className={card ? 'vp-card vg-faq' : 'vg-faq is-section'} id={id} aria-labelledby={id + '-title'}>
    <JsonLd data={faqJsonLd(items)}/>
    <h2 id={id + '-title'}>{title}</h2>
    {intro && <p className="vg-faq-intro">{intro}</p>}
    <div className="vg-faq-list">{items.map((f, i) => <details key={i} open={i === 0}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
  </section>
}
