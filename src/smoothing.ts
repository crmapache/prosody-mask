export interface Pt {
  x: number
  y: number
}

const f = (n: number): string => n.toFixed(1)

/**
 * Build a smooth SVG path through `pts` using a Catmull-Rom -> cubic-bezier
 * conversion (ported from the reference prototype). `smoothing` scales the
 * control-point reach: `1` reproduces the reference's `1/6` factor, `0` yields
 * straight line segments, higher values loosen the curve.
 */
export function smoothTop(pts: Pt[], smoothing = 1): string {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M ${f(pts[0].x)} ${f(pts[0].y)}`
  const k = smoothing / 6
  let d = `M ${f(pts[0].x)} ${f(pts[0].y)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) * k
    const c1y = p1.y + (p2.y - p0.y) * k
    const c2x = p2.x - (p3.x - p1.x) * k
    const c2y = p2.y - (p3.y - p1.y) * k
    d += ` C ${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2.x)} ${f(p2.y)}`
  }
  return d
}
