import type { MaskHandle, MaskInput, Token } from 'prosody-mask'
import { $ } from './dom'

export type Mode = 'rules' | 'ai' | 'audio'

const MODES: Mode[] = ['rules', 'ai', 'audio']
const MODE_BUTTON_ID: Record<Mode, string> = { rules: 'mode-rules', ai: 'mode-ai', audio: 'mode-audio' }

const CAPTIONS: Record<Mode, string> = {
  rules:
    'The package tokenised this passage and computed every pitch point from English intonation rules - a fast, honest approximation.',
  ai: 'Points authored by hand from the text alone - the melody you might place without hearing it. It follows the punctuation, so it misses the pauses the speaker actually makes.',
  audio:
    'Pitch measured from the audio itself - word timings from Deepgram, F0 per word, and the real held pauses. This is the melody you actually hear; press play to follow it.',
}

/** The three pitch sources the demo passage can show, keyed by mode. */
export interface ModeSource {
  text: string
  lang: string
  aiTokens: Token[]
  audioTokens: Token[]
}

/** Wire the "Rules / AI points / From audio" segmented toggle to `mask`. */
export function initModeToggle(mask: MaskHandle, source: ModeSource, initial: Mode): void {
  const inputFor = (mode: Mode): MaskInput => {
    if (mode === 'ai') return { tokens: source.aiTokens }
    if (mode === 'audio') return { tokens: source.audioTokens }
    return { text: source.text, lang: source.lang }
  }

  function setMode(next: Mode): void {
    for (const m of MODES) {
      const btn = $(MODE_BUTTON_ID[m])
      btn.classList.toggle('is-active', m === next)
      btn.setAttribute('aria-selected', String(m === next))
    }
    $('mode-caption').textContent = CAPTIONS[next]
    mask.update(inputFor(next))
  }

  for (const m of MODES) $(MODE_BUTTON_ID[m]).addEventListener('click', () => setMode(m))
  setMode(initial)
}
