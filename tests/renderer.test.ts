// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { createMask } from '../src/renderer'
import { defaultStyle } from '../src/style'

// jsdom cannot measure real layout (all rects are 0), so these tests assert node
// structure, layer skipping and clean teardown - not pixel geometry.

let handle: ReturnType<typeof createMask> | null = null

afterEach(() => {
  handle?.destroy()
  handle = null
  document.body.innerHTML = ''
})

function mount(): HTMLElement {
  const el = document.createElement('div')
  document.body.appendChild(el)
  return el
}

describe('createMask (DOM structure)', () => {
  it('renders one live span per word plus an svg overlay', () => {
    const el = mount()
    handle = createMask(el, { text: 'The system works well.' })
    const svg = el.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    const spans = el.querySelectorAll('span')
    // 4 words; gap spans only appear between breath groups (none here)
    const wordSpans = Array.from(spans).filter((s) => s.getAttribute('aria-hidden') !== 'true')
    expect(wordSpans.map((s) => s.textContent)).toEqual(['The', 'system', 'works', 'well.'])
  })

  it('inserts sized gap spans between breath groups', () => {
    const el = mount()
    handle = createMask(el, { text: 'One, two.' })
    const gaps = Array.from(el.querySelectorAll('span')).filter((s) => s.getAttribute('aria-hidden') === 'true')
    expect(gaps).toHaveLength(1)
    expect(gaps[0].style.width).toBe(`${defaultStyle.softGap}px`)
  })

  it('uses supplied tokens verbatim (bring your own points)', () => {
    const el = mount()
    handle = createMask(el, {
      tokens: [
        { text: 'Hi', pitch: [0.2, 0.9], trailing: '' },
        { text: 'there', pitch: [0.9, 0.1], trailing: '.' },
      ],
    })
    const wordSpans = Array.from(el.querySelectorAll('span')).filter((s) => s.getAttribute('aria-hidden') !== 'true')
    expect(wordSpans.map((s) => s.textContent)).toEqual(['Hi', 'there.'])
  })

  it('skips layers with zero width/opacity', () => {
    const el = mount()
    handle = createMask(
      el,
      { text: 'The system works well.' },
      { fillOpacity: 0, topWidth: 0, bottomOpacity: 0 },
    )
    // all three layers disabled -> no path elements drawn
    expect(el.querySelectorAll('path')).toHaveLength(0)
  })

  it('destroy() removes every injected node and leaves the container empty', () => {
    const el = mount()
    handle = createMask(el, { text: 'One, two.' })
    expect(el.childNodes.length).toBeGreaterThan(0)
    handle.destroy()
    handle = null
    expect(el.childNodes.length).toBe(0)
  })
})
