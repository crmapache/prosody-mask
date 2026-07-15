import { createMask, defaultStyle, type MaskHandle, type MaskInput, type MaskStyle, type Token } from 'prosody-mask'
import { sampleAiTokens, sampleText } from './sample'

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T

// --- style state -----------------------------------------------------------

const style: MaskStyle = { ...defaultStyle }

/** Numeric sliders, in preset key order, with display precision. */
const NUM_CONTROLS: Array<{ key: keyof MaskStyle; digits: number }> = [
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

// --- masks ------------------------------------------------------------------

let mode: 'rules' | 'ai' = 'rules'
let lang = 'en'

const demoInput = (): MaskInput => (mode === 'ai' ? { tokens: sampleAiTokens } : { text: sampleText, lang: 'en' })

const demoMask: MaskHandle = createMask($('demo'), demoInput(), style)
const yourMask: MaskHandle = createMask($('yourtext'), { text: '', lang }, style)
let tokensMask: MaskHandle | null = null

// --- style <-> controls -----------------------------------------------------

function syncControls(): void {
  ;($('c-color') as HTMLInputElement).value = style.color
  for (const { key, digits } of NUM_CONTROLS) {
    const input = $(`c-${key}`) as HTMLInputElement
    const val = $(`v-${key}`)
    input.value = String(style[key])
    val.textContent = Number(style[key]).toFixed(digits)
  }
}

function applyStyle(): void {
  demoMask.setStyle(style)
  yourMask.setStyle(style)
  tokensMask?.setStyle(style)
  renderPresets()
}

// --- presets ----------------------------------------------------------------

function orderedStyle(s: MaskStyle): MaskStyle {
  // Explicit key order so copied output is stable and readable.
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

function renderPresets(): void {
  $('out-ts').textContent = tsSnippet(style)
  $('out-json').textContent = JSON.stringify(orderedStyle(style), null, 2)
}

// --- wiring: colour + sliders ----------------------------------------------

;($('c-color') as HTMLInputElement).addEventListener('input', (e) => {
  style.color = (e.target as HTMLInputElement).value
  applyStyle()
})

for (const { key, digits } of NUM_CONTROLS) {
  const input = $(`c-${key}`) as HTMLInputElement
  input.addEventListener('input', () => {
    ;(style as unknown as Record<string, number | string>)[key] = Number(input.value)
    $(`v-${key}`).textContent = Number(input.value).toFixed(digits)
    applyStyle()
  })
}

$('reset').addEventListener('click', () => {
  Object.assign(style, defaultStyle)
  syncControls()
  applyStyle()
})

// --- wiring: demo mode toggle ----------------------------------------------

const captions: Record<'rules' | 'ai', string> = {
  rules: 'The package tokenised this passage and computed every pitch point from English intonation rules - a fast, honest approximation.',
  ai: 'The same passage, but drawn from hand-authored points (standing in for an LLM or pitch tracker). Notice the livelier melody and the clearer rise into "water?".',
}

function setMode(next: 'rules' | 'ai'): void {
  mode = next
  $('mode-rules').classList.toggle('is-active', next === 'rules')
  $('mode-ai').classList.toggle('is-active', next === 'ai')
  $('mode-rules').setAttribute('aria-selected', String(next === 'rules'))
  $('mode-ai').setAttribute('aria-selected', String(next === 'ai'))
  $('mode-caption').textContent = captions[next]
  demoMask.update(demoInput())
}

$('mode-rules').addEventListener('click', () => setMode('rules'))
$('mode-ai').addEventListener('click', () => setMode('ai'))

// --- wiring: your own text --------------------------------------------------

const yourTextEl = $('your-text') as HTMLTextAreaElement
yourTextEl.value = 'Where does the light go when the day is over? It waits, quiet, and comes back.'

function updateYourText(): void {
  yourMask.update({ text: yourTextEl.value, lang })
}

yourTextEl.addEventListener('input', updateYourText)
;($('lang') as HTMLSelectElement).addEventListener('change', (e) => {
  lang = (e.target as HTMLSelectElement).value
  updateYourText()
})

// --- wiring: external tokens JSON ------------------------------------------

const tokensEl = $('tokens-json') as HTMLTextAreaElement
tokensEl.value = JSON.stringify(
  [
    { text: 'Bring', pitch: [0.3, 0.55], trailing: '' },
    { text: 'your', pitch: [0.55, 0.5], trailing: '' },
    { text: 'own', pitch: [0.5, 0.68], trailing: '' },
    { text: 'points', pitch: [0.74, 0.1], trailing: '.' },
  ] satisfies Token[],
  null,
  2,
)

function isTokenArray(value: unknown): value is Token[] {
  return (
    Array.isArray(value) &&
    value.every(
      (t) =>
        t &&
        typeof t.text === 'string' &&
        Array.isArray(t.pitch) &&
        t.pitch.length === 2 &&
        t.pitch.every((n: unknown) => typeof n === 'number'),
    )
  )
}

function updateTokens(): void {
  const err = $('tokens-err')
  const raw = tokensEl.value.trim()
  if (!raw) {
    err.textContent = ''
    return
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    err.textContent = 'Invalid JSON.'
    return
  }
  if (!isTokenArray(parsed)) {
    err.textContent = 'Expected an array of { text, pitch: [onset, offset], trailing }.'
    return
  }
  err.textContent = ''
  const input: MaskInput = { tokens: parsed }
  if (tokensMask) tokensMask.update(input)
  else tokensMask = createMask($('tokenstext'), input, style)
}

tokensEl.addEventListener('input', updateTokens)

// --- init -------------------------------------------------------------------

syncControls()
renderPresets()
setMode('rules')
updateYourText()
updateTokens()
wireCopy('copy-ts', () => tsSnippet(style))
wireCopy('copy-json', () => JSON.stringify(orderedStyle(style), null, 2))

function wireCopy(id: string, get: () => string): void {
  const btn = $(id)
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(get())
      const prev = btn.textContent
      btn.textContent = 'Copied'
      setTimeout(() => {
        btn.textContent = prev
      }, 1200)
    } catch {
      /* clipboard unavailable */
    }
  })
}
