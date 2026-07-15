import { groupTokens } from './grouping'
import { computeTokens } from './rules'
import { smoothTop, type Pt } from './smoothing'
import { defaultStyle } from './style'
import type { BreathGroup, MaskHandle, MaskInput, MaskStyle, Token } from './types'

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * A breath group whose final offset sits above this holds its edge up at that
 * pitch (a rising yes/no question or a list-item continuation) instead of
 * closing down to the floor. Falling endings (statements, wh-questions) sit
 * well below it and still return to the floor as a rounded hill.
 */
const RISE_HOLD = 0.6

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n))

function resolveTokens(input: MaskInput): Token[] {
  if ('tokens' in input && input.tokens && input.tokens.length) return input.tokens
  const text = 'text' in input ? (input.text ?? '') : ''
  const lang = 'lang' in input ? input.lang : undefined
  return computeTokens(text, { lang })
}

/** One live text word, carrying its pitch and its breath-group index. */
interface WordEl {
  el: HTMLElement
  onset: number
  offset: number
  band: number
}

/** A gap span between two breath groups, remembered so its width can restyle. */
interface GapEl {
  el: HTMLElement
  hard: boolean
}

/**
 * Render a translucent intonation mask behind the flowing text inside
 * `container`. Nothing touches the DOM until this is called, so importing the
 * package is SSR-safe.
 */
export function createMask(container: HTMLElement, input: MaskInput, style?: Partial<MaskStyle>): MaskHandle {
  let st: MaskStyle = { ...defaultStyle, ...style }
  let current: MaskInput = input
  let groups: BreathGroup[] = []
  let words: WordEl[] = []
  let gaps: GapEl[] = []
  let svg: SVGSVGElement | null = null
  let raf = 0

  const scheduleDraw = (): void => {
    if (raf) return
    raf = requestAnimationFrame(() => {
      raf = 0
      draw()
    })
  }

  const onResize = (): void => scheduleDraw()
  const ro: ResizeObserver | null = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => scheduleDraw()) : null

  function build(): void {
    container.textContent = ''
    words = []
    gaps = []

    // The SVG is absolutely positioned inside the container, so the container
    // must be a positioning context.
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative'

    svg = document.createElementNS(SVG_NS, 'svg')
    svg.setAttribute('aria-hidden', 'true')
    const s = svg.style
    s.position = 'absolute'
    s.left = '0'
    s.top = '0'
    s.width = '100%'
    s.height = '100%'
    s.pointerEvents = 'none'
    s.overflow = 'visible'
    s.zIndex = '0'
    container.appendChild(svg)

    groups = groupTokens(resolveTokens(current))
    groups.forEach((group, gi) => {
      group.tokens.forEach((tok, ti) => {
        const span = document.createElement('span')
        span.textContent = tok.text + (tok.trailing ?? '')
        span.style.position = 'relative'
        span.style.zIndex = '1'
        container.appendChild(span)
        words.push({ el: span, onset: tok.pitch[0], offset: tok.pitch[1], band: gi })
        if (ti < group.tokens.length - 1) container.appendChild(document.createTextNode(' '))
      })
      if (gi < groups.length - 1) {
        const gap = document.createElement('span')
        const hard = group.pause === 'hard'
        gap.setAttribute('aria-hidden', 'true')
        gap.style.display = 'inline-block'
        gap.style.width = `${hard ? st.hardGap : st.softGap}px`
        container.appendChild(gap)
        gaps.push({ el: gap, hard })
      }
    })
  }

  function applyGapWidths(): void {
    for (const g of gaps) g.el.style.width = `${g.hard ? st.hardGap : st.softGap}px`
  }

  function draw(): void {
    if (!svg) return
    svg.textContent = ''
    const rb = container.getBoundingClientRect()
    const fontPx = parseFloat(getComputedStyle(container).fontSize) || 16
    const lineThreshold = Math.max(8, fontPx * 0.5)

    // Group words into runs by (breath group) AND visual line, so wrapped text
    // draws as separate hills per line.
    interface Run {
      band: number
      top: number
      items: Array<{ w: WordEl; b: DOMRect }>
    }
    const runs: Run[] = []
    let cur: Run | null = null
    for (const w of words) {
      const b = w.el.getBoundingClientRect()
      const top = Math.round(b.top - rb.top)
      if (!cur || cur.band !== w.band || Math.abs(cur.top - top) > lineThreshold) {
        cur = { band: w.band, top, items: [] }
        runs.push(cur)
      }
      cur.items.push({ w, b })
    }

    runs.forEach((run, ri) => {
      const items = run.items
      const startsBand = ri === 0 || runs[ri - 1].band !== run.band
      const endsBand = ri === runs.length - 1 || runs[ri + 1].band !== run.band

      let rectTop = Infinity
      let rectBottom = -Infinity
      for (const o of items) {
        rectTop = Math.min(rectTop, o.b.top - rb.top)
        rectBottom = Math.max(rectBottom, o.b.bottom - rb.top)
      }
      // Keep the fill strictly inside the letters: strip the half-leading so it
      // grows from the letter floor to at most the letter tops.
      const halfLeading = Math.max(0, (rectBottom - rectTop - fontPx) / 2)
      const floor = rectBottom - halfLeading
      const capTop = rectTop + halfLeading
      const bandH = floor - capTop

      const leftX = items[0].b.left - rb.left
      const rightX = items[items.length - 1].b.right - rb.left
      const yAt = (pitch: number): number => floor - bandH * (st.floorLift + (1 - st.floorLift) * clamp01(pitch))

      // Build the top edge. Two points per word (onset, offset) placed inside
      // the word box so the melody can slope across it. A breath-group edge
      // returns to the floor to close the hill - EXCEPT when the group ends on a
      // rise (a yes/no question or a list-item continuation): a rising voice
      // stays up, so we hold the edge at its final pitch instead of forcing a
      // plunge to the floor. Interior wrap edges always keep their pitch.
      const lastOffset = items[items.length - 1].w.offset
      const endsHigh = lastOffset > RISE_HOLD
      const pts: Pt[] = []
      pts.push({ x: leftX, y: startsBand ? floor : yAt(items[0].w.onset) })
      for (const o of items) {
        const L = o.b.left - rb.left
        const R = o.b.right - rb.left
        const w = R - L
        pts.push({ x: L + 0.25 * w, y: yAt(o.w.onset) })
        pts.push({ x: R - 0.25 * w, y: yAt(o.w.offset) })
      }
      pts.push({ x: rightX, y: endsBand && !endsHigh ? floor : yAt(lastOffset) })

      const topD = smoothTop(pts, st.smoothing)
      const fillD = `${topD} L ${rightX.toFixed(1)} ${floor.toFixed(1)} L ${leftX.toFixed(1)} ${floor.toFixed(1)} Z`

      if (st.fillOpacity > 0) {
        const fill = document.createElementNS(SVG_NS, 'path')
        fill.setAttribute('d', fillD)
        fill.setAttribute('fill', rgba(st.color, st.fillOpacity))
        svg!.appendChild(fill)
      }
      if (st.topWidth > 0 && st.topOpacity > 0) {
        const edge = document.createElementNS(SVG_NS, 'path')
        edge.setAttribute('d', topD)
        edge.setAttribute('fill', 'none')
        edge.setAttribute('stroke', rgba(st.color, st.topOpacity))
        edge.setAttribute('stroke-width', String(st.topWidth))
        edge.setAttribute('stroke-linecap', 'round')
        edge.setAttribute('stroke-linejoin', 'round')
        svg!.appendChild(edge)
      }
      if (st.bottomWidth > 0 && st.bottomOpacity > 0) {
        const base = document.createElementNS(SVG_NS, 'path')
        base.setAttribute('d', `M ${leftX.toFixed(1)} ${floor.toFixed(1)} L ${rightX.toFixed(1)} ${floor.toFixed(1)}`)
        base.setAttribute('fill', 'none')
        base.setAttribute('stroke', rgba(st.color, st.bottomOpacity))
        base.setAttribute('stroke-width', String(st.bottomWidth))
        base.setAttribute('stroke-linecap', 'round')
        svg!.appendChild(base)
      }
    })
  }

  // Wire up live redraw on layout changes.
  if (typeof window !== 'undefined') window.addEventListener('resize', onResize)
  ro?.observe(container)
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    document.fonts.ready.then(() => scheduleDraw()).catch(() => {})
  }

  build()
  scheduleDraw()

  return {
    update(next?: MaskInput): void {
      if (next) current = next
      build()
      scheduleDraw()
    },
    setStyle(next: Partial<MaskStyle>): void {
      st = { ...st, ...next }
      applyGapWidths()
      scheduleDraw()
    },
    redraw(): void {
      scheduleDraw()
    },
    destroy(): void {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      if (typeof window !== 'undefined') window.removeEventListener('resize', onResize)
      ro?.disconnect()
      container.textContent = ''
      svg = null
      words = []
      gaps = []
      groups = []
    },
  }
}
