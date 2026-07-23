// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { createMask } from '../src/renderer'

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

  it('sizes a pause as margin on the last word of the breath group, not a standalone box', () => {
    const el = mount()
    handle = createMask(el, { text: 'One, two.' })
    // No standalone gap element: a separate inline-block has no whitespace
    // around it to collapse, so it can wrap onto the next line on its own and
    // strand an invisible indent in front of the following word.
    expect(el.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(0)
    const wordSpans = Array.from(el.querySelectorAll('span')).filter((s) => s.getAttribute('aria-hidden') !== 'true')
    expect(wordSpans.map((s) => s.textContent)).toEqual(['One,', 'two.'])
    // The pause lives as margin on the word before it, proportional to font
    // size (× the font's space width), not a fixed number.
    expect(wordSpans[0].style.marginRight).toMatch(/px$/)
    expect(parseFloat(wordSpans[0].style.marginRight)).toBeGreaterThan(0)
    expect(wordSpans[1].style.marginRight).toBe('')
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
