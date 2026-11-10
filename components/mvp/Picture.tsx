import type { ImgHTMLAttributes } from 'react'
import { webpSrcSet } from '@/lib/mvp/img'

/** An <img> that offers a WebP copy at two widths when one exists. The <picture> wrapper has display:contents, so layout is unchanged. */
export default function Picture({ src, sizes, ...img }: ImgHTMLAttributes<HTMLImageElement> & { src: string; sizes: string }) {
  const set = webpSrcSet(src)
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  const el = <img src={src} decoding="async" {...img}/>
  return set ? <picture className="vg-picture"><source type="image/webp" srcSet={set} sizes={sizes}/>{el}</picture> : el
}
