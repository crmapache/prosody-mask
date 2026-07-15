import type { MaskHandle, MaskStyle } from 'prosody-mask'
import { $ } from './dom'

/** Every `MaskStyle` field driven by a numeric slider (all but `color`). */
type NumericStyleKey = Exclude<keyof MaskStyle, 'color'>

/** Numeric sliders, in preset key order, with display precision. */
const NUM_CONTROLS: Array<{ key: NumericStyleKey; digits: number }> = [
  { key: 'fillOpacity', digits: 2 },
  { key: 'topWidth', digits: 1 },
  { key: 'topOpacity', digits: 2 },
  { key: 'bottomWidth', digits: 1 },
  { key: 'bottomOpacity', digits: 2 },
  { key: 'floorLift', digits: 2 },
  { key: 'smoothing', digits: 1 },
  { key: 'softGap', digits: 0 },
  { key: 'hardGap', digits: 0 },
]

/** The demo passage's own font size in px. Not part of `MaskStyle` - it's a host property, not mask style. */
const DEFAULT_TEXT_SIZE = 24

/** Paint the filled portion of a range slider (webkit reads `--fill`). */
function setFill(input: HTMLInputElement): void {
  const min = Number(input.min || '0')
  const max = Number(input.max || '100')
  const pct = max > min ? ((Number(input.value) - min) / (max - min)) * 100 : 0
  input.style.setProperty('--fill', `${pct}%`)
}

/**
 * Wire the style sidebar (color, sliders, text size, reset) to `style`, driving
 * `mask` live and calling `onStyleChange` after every edit so callers (the
 * preset panel) can stay in sync.
 */
export function initStyleControls(
  mask: MaskHandle,
  style: MaskStyle,
  defaults: MaskStyle,
  onStyleChange: () => void,
): void {
  let textSize = DEFAULT_TEXT_SIZE

  function applyTextSize(): void {
    $<HTMLElement>('demo').style.fontSize = `${textSize}px`
    mask.redraw()
  }

  function syncTextSize(): void {
    const el = $<HTMLInputElement>('c-fontSize')
    el.value = String(textSize)
    $('v-fontSize').textContent = String(textSize)
    setFill(el)
  }

  function syncControls(): void {
    const color = $<HTMLInputElement>('c-color')
    color.value = style.color
    $('c-color-hex').textContent = style.color.toUpperCase()
    for (const { key, digits } of NUM_CONTROLS) {
      const input = $<HTMLInputElement>(`c-${key}`)
      input.value = String(style[key])
      $(`v-${key}`).textContent = style[key].toFixed(digits)
      setFill(input)
    }
  }

  function applyStyle(): void {
    mask.setStyle(style)
    onStyleChange()
  }

  $<HTMLInputElement>('c-color').addEventListener('input', (e) => {
    style.color = (e.target as HTMLInputElement).value
    $('c-color-hex').textContent = style.color.toUpperCase()
    applyStyle()
  })

  for (const { key, digits } of NUM_CONTROLS) {
    const input = $<HTMLInputElement>(`c-${key}`)
    input.addEventListener('input', () => {
      style[key] = Number(input.value)
      $(`v-${key}`).textContent = Number(input.value).toFixed(digits)
      setFill(input)
      applyStyle()
    })
  }

  const sizeInput = $<HTMLInputElement>('c-fontSize')
  sizeInput.addEventListener('input', () => {
    textSize = Number(sizeInput.value)
    $('v-fontSize').textContent = String(textSize)
    setFill(sizeInput)
    applyTextSize()
  })

  $('reset').addEventListener('click', () => {
    Object.assign(style, defaults)
    textSize = DEFAULT_TEXT_SIZE
    syncControls()
    syncTextSize()
    applyStyle()
    applyTextSize()
  })

  syncControls()
  syncTextSize()
  applyTextSize()
}
