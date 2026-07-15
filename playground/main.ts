import { createMask, defaultStyle, type MaskHandle, type MaskInput, type MaskStyle, type Token } from 'prosody-mask'
import { sampleAiTokens, sampleAudioTokens, sampleText, sampleWordTimings } from './sample'

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

type Mode = 'rules' | 'ai' | 'audio'
const MODES: Mode[] = ['rules', 'ai', 'audio']
const modeBtn: Record<Mode, string> = { rules: 'mode-rules', ai: 'mode-ai', audio: 'mode-audio' }
let mode: Mode = 'rules'
let lang = 'en'

const demoInput = (): MaskInput =>
  mode === 'ai'
    ? { tokens: sampleAiTokens }
    : mode === 'audio'
      ? { tokens: sampleAudioTokens }
      : { text: sampleText, lang: 'en' }

const demoMask: MaskHandle = createMask($('demo'), demoInput(), style)
const yourMask: MaskHandle = createMask($('yourtext'), { text: '', lang }, style)
let tokensMask: MaskHandle | null = null

// Text size is a host property, not part of the mask style, so it lives outside
// the preset. It scales the reading specimens; the masks re-measure on redraw.
const DEFAULT_SIZE = 24
let textSize = DEFAULT_SIZE

function applyTextSize(): void {
  ;($('demo') as HTMLElement).style.fontSize = `${textSize}px`
  const small = `${Math.round(textSize * 0.84)}px`
  ;($('yourtext') as HTMLElement).style.fontSize = small
  ;($('tokenstext') as HTMLElement).style.fontSize = small
  demoMask.redraw()
  yourMask.redraw()
  tokensMask?.redraw()
}

function syncTextSize(): void {
  const el = $('c-fontSize') as HTMLInputElement
  el.value = String(textSize)
  $('v-fontSize').textContent = String(textSize)
  setFill(el)
}

// --- style <-> controls -----------------------------------------------------

/** Paint the filled portion of a range slider (webkit reads `--fill`). */
function setFill(input: HTMLInputElement): void {
  const min = Number(input.min || '0')
  const max = Number(input.max || '100')
  const pct = max > min ? ((Number(input.value) - min) / (max - min)) * 100 : 0
  input.style.setProperty('--fill', `${pct}%`)
}

function syncControls(): void {
  const color = $('c-color') as HTMLInputElement
  color.value = style.color
  $('c-color-hex').textContent = style.color.toUpperCase()
  for (const { key, digits } of NUM_CONTROLS) {
    const input = $(`c-${key}`) as HTMLInputElement
    input.value = String(style[key])
    $(`v-${key}`).textContent = Number(style[key]).toFixed(digits)
    setFill(input)
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
  $('c-color-hex').textContent = style.color.toUpperCase()
  applyStyle()
})

for (const { key, digits } of NUM_CONTROLS) {
  const input = $(`c-${key}`) as HTMLInputElement
  input.addEventListener('input', () => {
    ;(style as unknown as Record<string, number | string>)[key] = Number(input.value)
    $(`v-${key}`).textContent = Number(input.value).toFixed(digits)
    setFill(input)
    applyStyle()
  })
}

const sizeInput = $('c-fontSize') as HTMLInputElement
sizeInput.addEventListener('input', () => {
  textSize = Number(sizeInput.value)
  $('v-fontSize').textContent = String(textSize)
  setFill(sizeInput)
  applyTextSize()
})

$('reset').addEventListener('click', () => {
  Object.assign(style, defaultStyle)
  textSize = DEFAULT_SIZE
  syncControls()
  syncTextSize()
  applyStyle()
  applyTextSize()
})

// --- wiring: demo mode toggle ----------------------------------------------

const captions: Record<Mode, string> = {
  rules:
    'The package tokenised this passage and computed every pitch point from English intonation rules - a fast, honest approximation.',
  ai: 'Points authored by hand from the text alone - the melody you might place without hearing it. It follows the punctuation, so it misses the pauses the speaker actually makes.',
  audio:
    'Pitch measured from the audio itself - word timings from Deepgram, F0 per word, and the real held pauses. This is the melody you actually hear; press play to follow it.',
}

function setMode(next: Mode): void {
  mode = next
  for (const m of MODES) {
    const b = $(modeBtn[m])
    b.classList.toggle('is-active', m === next)
    b.setAttribute('aria-selected', String(m === next))
  }
  $('mode-caption').textContent = captions[next]
  demoMask.update(demoInput())
}

for (const m of MODES) $(modeBtn[m]).addEventListener('click', () => setMode(m))

// --- wiring: your own text --------------------------------------------------

const yourTextEl = $('your-text') as HTMLTextAreaElement
yourTextEl.value = 'Where does the light go when the day is over? It waits, quiet, and comes back.'

function updateYourText(): void {
  yourMask.update({ text: yourTextEl.value, lang })
}

yourTextEl.addEventListener('input', updateYourText)

/** Wire the custom language dropdown (button + listbox, keyboard accessible). */
function initSelect(onChange: (value: string) => void): void {
  const root = $('lang-select')
  const trigger = $('lang-trigger')
  const menu = $('lang-menu')
  const label = $('lang-label')
  const options = Array.from(menu.querySelectorAll<HTMLElement>('.select-option'))
  let highlight = Math.max(
    0,
    options.findIndex((o) => o.classList.contains('is-selected')),
  )

  const isOpen = (): boolean => root.classList.contains('open')
  const paint = (): void => options.forEach((o, i) => o.classList.toggle('is-active', isOpen() && i === highlight))
  const open = (): void => {
    root.classList.add('open')
    trigger.setAttribute('aria-expanded', 'true')
    highlight = Math.max(
      0,
      options.findIndex((o) => o.classList.contains('is-selected')),
    )
    paint()
  }
  const close = (): void => {
    root.classList.remove('open')
    trigger.setAttribute('aria-expanded', 'false')
    paint()
  }
  const choose = (opt: HTMLElement): void => {
    options.forEach((o) => {
      const on = o === opt
      o.classList.toggle('is-selected', on)
      o.setAttribute('aria-selected', String(on))
    })
    label.textContent = opt.textContent
    onChange(opt.dataset.value ?? 'en')
  }

  trigger.addEventListener('click', () => (isOpen() ? close() : open()))
  options.forEach((opt) => {
    opt.addEventListener('click', () => {
      choose(opt)
      close()
      trigger.focus()
    })
    opt.addEventListener('mouseenter', () => {
      highlight = options.indexOf(opt)
      paint()
    })
  })
  document.addEventListener('click', (e) => {
    if (!root.contains(e.target as Node)) close()
  })
  trigger.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen()) open()
        else {
          highlight = Math.min(options.length - 1, highlight + 1)
          paint()
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!isOpen()) open()
        else {
          highlight = Math.max(0, highlight - 1)
          paint()
        }
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (!isOpen()) open()
        else {
          choose(options[highlight])
          close()
        }
        break
      case 'Escape':
        close()
        break
    }
  })
}

initSelect((value) => {
  lang = value
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
syncTextSize()
renderPresets()
setMode('rules')
updateYourText()
updateTokens()
applyTextSize()
wireCopy('copy-ts', () => tsSnippet(style))
wireCopy('copy-json', () => JSON.stringify(orderedStyle(style), null, 2))
initAudio()

// --- AI prompts -------------------------------------------------------------
// Ready-made prompts a user copies to make their own Token[] with an AI, so they
// never have to write the prompt. The output format matches the Token contract.

const PROMPT_TEXT = `You are a prosody expert. I will give you a passage of text. Return the intonation (pitch melody) of the passage as a JSON array of tokens, one object per word, for the prosody-mask renderer.

Output ONLY the JSON array, nothing else. Each token has this shape:

  {
    "text": string,             // the word exactly as written
    "pitch": [number, number],  // [onset, offset], each 0..1  (0 = low / floor, 1 = high / ceiling)
    "trailing": string,         // trailing punctuation: one of  , . ? ! ; :  or ""  (empty)
    "pause": "soft" | "hard"    // OPTIONAL: only where a speaker would pause with no punctuation
  }

Assign pitch (0..1) using English intonation:
- Statement: the last content word falls to a low offset (~0.1).
- Yes/no question: the final word rises to the ceiling (~1.0).
- Wh-question (how/what/why/where/when/who/which): falls at the end, like a statement.
- Comma list: each item ends high (continuation rise); the final item falls.
- Put the main pitch peak (nuclear stress) on the last content word of each breath group.
- Chain the line: a word's onset should about equal the previous word's offset within the same breath group.
- Function words (the, a, of, to, and, is, you, ...) sit a little lower than nearby content words.
- Keep every value inside 0..1.

Tokenise the text yourself: keep contractions (can't) and hyphenated words (multi-token) as single tokens, and put trailing punctuation in "trailing", not in "text". No commentary.

TEXT:
[paste your passage here]`

const PROMPT_AUDIO = `You convert measured speech data into prosody-mask tokens. Do not guess the melody - derive it from the numbers I give you.

I will provide:
1. A transcript with word-level timestamps (from Deepgram, Whisper, etc.): each word with a start and end time in seconds.
2. A fundamental-frequency (F0) track: pitch in Hz over time (from a YIN / pYIN / CREPE tracker), with unvoiced frames marked.

Return ONLY a JSON array of tokens, one per transcript word:

  {
    "text": string,             // the word as written
    "pitch": [number, number],  // [onset, offset], each 0..1
    "trailing": string,         // trailing punctuation  , . ? ! ; :  or ""
    "pause": "soft" | "hard"    // OPTIONAL
  }

Compute each field:
- Take the voiced F0 samples inside the word's [start, end]. onset = median F0 of the first third of the word; offset = median F0 of the last third. If the word is fully unvoiced, reuse the previous word's offset.
- Normalise Hz to 0..1 across the WHOLE utterance with one shared mapping: 5th percentile of voiced F0 -> ~0.06, 95th percentile -> ~1.0, then clamp to 0..1.
- "trailing": the word's own punctuation.
- "pause": add "soft" (or "hard" for a long one) where there is an audible silence between two words with NO punctuation between them - a real held pause. Find it from a gap in the word timings or a silent stretch in the audio. Never add a pause where a comma or period already is.

Output only the JSON array, no commentary.

TRANSCRIPT + F0 DATA:
[paste your word timings and F0 track here]`

$('prompt-text').textContent = PROMPT_TEXT
$('prompt-audio').textContent = PROMPT_AUDIO
wireCopy('copy-prompt-text', () => PROMPT_TEXT)
wireCopy('copy-prompt-audio', () => PROMPT_AUDIO)

/** Wire the custom audio player under the demo passage (Deepgram TTS render). */
function initAudio(): void {
  const audio = $('audio') as HTMLAudioElement
  const wrap = $('audio-player')
  const btn = $('audio-btn')
  const fill = $('audio-fill')
  const time = $('audio-time')
  const track = $('audio-track')

  const fmt = (s: number): string => {
    if (!Number.isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  // Karaoke highlight: light up the demo word currently spoken. Query the mask's
  // word spans fresh each frame (they are rebuilt on a mode toggle) and skip the
  // aria-hidden gap spans; order matches sampleWordTimings by index.
  const demoEl = $('demo')
  const wordSpans = (): HTMLElement[] =>
    Array.from(demoEl.querySelectorAll<HTMLElement>('span')).filter((s) => s.getAttribute('aria-hidden') !== 'true')
  let hiRaf = 0
  const clearHighlight = (): void => {
    for (const s of wordSpans()) s.classList.remove('speaking')
  }
  const highlightLoop = (): void => {
    const t = audio.currentTime
    let idx = -1
    for (let i = 0; i < sampleWordTimings.length; i++) {
      if (t >= sampleWordTimings[i].start && t < sampleWordTimings[i].end) {
        idx = i
        break
      }
    }
    const spans = wordSpans()
    spans.forEach((s, i) => s.classList.toggle('speaking', i === idx))
    if (!audio.paused && !audio.ended) hiRaf = requestAnimationFrame(highlightLoop)
  }

  btn.addEventListener('click', () => {
    if (audio.paused) void audio.play()
    else audio.pause()
  })
  audio.addEventListener('play', () => {
    wrap.classList.add('is-playing')
    btn.setAttribute('aria-label', 'Pause')
    cancelAnimationFrame(hiRaf)
    hiRaf = requestAnimationFrame(highlightLoop)
  })
  audio.addEventListener('pause', () => {
    wrap.classList.remove('is-playing')
    btn.setAttribute('aria-label', 'Play')
    cancelAnimationFrame(hiRaf)
    clearHighlight()
  })
  audio.addEventListener('loadedmetadata', () => {
    time.textContent = fmt(audio.duration)
  })
  audio.addEventListener('timeupdate', () => {
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0
    fill.style.width = `${pct}%`
    time.textContent = fmt(audio.currentTime)
  })
  audio.addEventListener('ended', () => {
    fill.style.width = '0%'
    time.textContent = fmt(audio.duration)
    cancelAnimationFrame(hiRaf)
    clearHighlight()
  })
  track.addEventListener('click', (e) => {
    const rect = track.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, ((e as MouseEvent).clientX - rect.left) / rect.width))
    if (audio.duration) audio.currentTime = ratio * audio.duration
  })
}

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
