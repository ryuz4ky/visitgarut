import { qrPath } from '@/lib/rating/qr'

/** Inline QR code (vector, prints sharp at any size). */
export default function Qr({ value, label, className }: { value: string; label: string; className?: string }) {
  const { d, viewBox } = qrPath(value)
  return <svg className={className} viewBox={viewBox} role="img" aria-label={label} shapeRendering="crispEdges">
    <rect width="100%" height="100%" fill="#fff"/><path d={d} fill="#0e1311"/>
  </svg>
}
