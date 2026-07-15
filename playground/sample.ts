import type { Token } from 'prosody-mask'

/**
 * The demo passage. The playground shows it two ways:
 *  - "rules": the package tokenises this string and computes pitch itself.
 *  - "ai":    the hand-authored `sampleAiTokens` below (a stand-in for what an
 *             LLM or pitch tracker would emit) are used verbatim.
 *
 * Same words, same punctuation - only the melody differs, which is exactly the
 * separation the package is built around.
 */
export const sampleText =
  'The tide came in slowly, without a single sound. Did you notice how the evening light shifted over the water? For a moment everything felt calm, patient, and almost unreal.'

/**
 * Curated "AI" points for `sampleText`. The word split and trailing punctuation
 * match the tokeniser exactly; the pitch values are tuned by hand to read as a
 * more expressive, human contour than the flat heuristic - a gentle descriptive
 * wave, a clear questioning rise on "water?", and a soft list resolution.
 */
export const sampleAiTokens: Token[] = [
  { text: 'The', pitch: [0.3, 0.36], trailing: '' },
  { text: 'tide', pitch: [0.36, 0.58], trailing: '' },
  { text: 'came', pitch: [0.58, 0.52], trailing: '' },
  { text: 'in', pitch: [0.52, 0.55], trailing: '' },
  { text: 'slowly', pitch: [0.55, 0.82], trailing: ',' },
  { text: 'without', pitch: [0.4, 0.44], trailing: '' },
  { text: 'a', pitch: [0.44, 0.42], trailing: '' },
  { text: 'single', pitch: [0.42, 0.66], trailing: '' },
  { text: 'sound', pitch: [0.72, 0.1], trailing: '.' },
  { text: 'Did', pitch: [0.32, 0.34], trailing: '' },
  { text: 'you', pitch: [0.34, 0.4], trailing: '' },
  { text: 'notice', pitch: [0.4, 0.6], trailing: '' },
  { text: 'how', pitch: [0.55, 0.5], trailing: '' },
  { text: 'the', pitch: [0.5, 0.48], trailing: '' },
  { text: 'evening', pitch: [0.48, 0.62], trailing: '' },
  { text: 'light', pitch: [0.66, 0.72], trailing: '' },
  { text: 'shifted', pitch: [0.68, 0.58], trailing: '' },
  { text: 'over', pitch: [0.56, 0.52], trailing: '' },
  { text: 'the', pitch: [0.52, 0.6], trailing: '' },
  { text: 'water', pitch: [0.66, 0.96], trailing: '?' },
  { text: 'For', pitch: [0.3, 0.34], trailing: '' },
  { text: 'a', pitch: [0.34, 0.38], trailing: '' },
  { text: 'moment', pitch: [0.4, 0.56], trailing: '' },
  { text: 'everything', pitch: [0.56, 0.62], trailing: '' },
  { text: 'felt', pitch: [0.6, 0.58], trailing: '' },
  { text: 'calm', pitch: [0.62, 0.84], trailing: ',' },
  { text: 'patient', pitch: [0.58, 0.8], trailing: ',' },
  { text: 'and', pitch: [0.34, 0.4], trailing: '' },
  { text: 'almost', pitch: [0.44, 0.66], trailing: '' },
  { text: 'unreal', pitch: [0.7, 0.08], trailing: '.' },
]
