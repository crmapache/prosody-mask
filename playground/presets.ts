import type { MaskStyle } from 'prosody-mask'
import { $ } from './dom'
import { wireCopy } from './clipboard'

/** Explicit key order so copied output is stable and readable. */
function orderedStyle(s: MaskStyle): MaskStyle {
  return {
    color: s.color,
    fillOpacity: s.fillOpacity,
    topWidth: s.topWidth,
    topOpacity: s.topOpacity,
    bottomWidth: s.bottomWidth,
    bottomOpacity: s.bottomOpacity,
    floorLift: s.floorLift,
    softGap: s.softGap,
    hardGap: s.hardGap,
    smoothing: s.smoothing,
  }
}

function tsSnippet(s: MaskStyle): string {
  const o = orderedStyle(s)
  const lines = Object.entries(o).map(([k, v]) => `  ${k}: ${typeof v === 'string' ? `'${v}'` : v},`)
  return `import { createMask } from 'prosody-mask'\n\ncreateMask(el, input, {\n${lines.join('\n')}\n})`
}

/** Refresh the TypeScript/JSON preset boxes from the current style. */
export function renderPresets(style: MaskStyle): void {
  $('out-ts').textContent = tsSnippet(style)
  $('out-json').textContent = JSON.stringify(orderedStyle(style), null, 2)
}

/** Wire the preset panel's copy buttons and paint the initial output. */
export function initPresets(style: MaskStyle): void {
  wireCopy('copy-ts', () => tsSnippet(style))
  wireCopy('copy-json', () => JSON.stringify(orderedStyle(style), null, 2))
  renderPresets(style)
}
