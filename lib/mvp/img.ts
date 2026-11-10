/**
 * Smaller WebP copies of the site's own photos (written at build time by scripts/image-variants.cjs).
 * NEXT_PUBLIC_VG_WEBP lists the photos that have copies; anything else falls back to the original JPEG.
 */
const available = new Set((process.env.NEXT_PUBLIC_VG_WEBP || '').split(',').filter(Boolean))

export function webpSrcSet(src?: string | null) {
  if (!src || !src.startsWith('/') || !/\.jpe?g$/i.test(src)) return ''
  const base = src.replace(/\.jpe?g$/i, '')
  return available.has(base) ? `${base}-640.webp 640w, ${base}-1280.webp 1280w` : ''
}
