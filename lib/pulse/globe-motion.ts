/** Pure 3D geometry used by Pulse Globe's pointer-driven projection. */
export type SpherePoint = { x: number; y: number; depth: number }
export type GlobeProjection = {
  left: number
  top: number
  depth: number
  perspective: number
  opacity: number
  front: boolean
}
export function clampPitch(value: number): number {
  return Math.max(-Math.PI * 0.42, Math.min(Math.PI * 0.42, value))
}
export function projectGlobePoint(point: SpherePoint, yaw: number, pitch: number): GlobeProjection {
  const cy=Math.cos(yaw),sy=Math.sin(yaw),cx=Math.cos(pitch),sx=Math.sin(pitch)
  const x=point.x*cy+point.depth*sy
  const depthY=-point.x*sy+point.depth*cy
  const y=point.y*cx-depthY*sx
  const depth=point.y*sx+depthY*cx
  const normalized=Math.max(0,Math.min(1,(depth+1)/2))
  return {
    left:50+x*37,
    top:50-y*37,
    depth,
    perspective:0.78+0.3*normalized,
    opacity:0.4+0.6*normalized,
    front:depth>=-0.18,
  }
}
