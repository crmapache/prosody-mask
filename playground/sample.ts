import type { Token } from 'prosody-mask'

/**
 * The demo passage. The playground shows it two ways:
 *  - "rules": the package tokenises this string and computes pitch itself.
 *  - "ai":    the points below, which are MEASURED FROM THE AUDIO render
 *             (`demo-voice.mp3`) - word timings from Deepgram speech-to-text
 *             and a per-word F0 (pitch) contour extracted with a YIN tracker,
 *             normalised to the mask's 0..1 scale. So the AI curve is the
 *             melody you actually hear.
 */
export const sampleText =
  'The tide came in slowly, without a single sound. Did you notice how the evening light shifted over the water? For a moment everything felt calm, patient, and almost unreal.'

/**
 * Pitch measured from the audio (`[onset, offset]` per word, 0..1). Two words
 * also carry an explicit `pause`, marking a real held pause the speaker makes
 * where the text has no punctuation (after "moment", before "unreal").
 */
export const sampleAiTokens: Token[] = [
  { text: 'The', pitch: [0.54, 0.54], trailing: '' },
  { text: 'tide', pitch: [0.65, 1.0], trailing: '' },
  { text: 'came', pitch: [0.97, 0.69], trailing: '' },
  { text: 'in', pitch: [0.54, 0.49], trailing: '' },
  { text: 'slowly', pitch: [0.03, 0.3], trailing: ',' },
  { text: 'without', pitch: [0.34, 0.46], trailing: '' },
  { text: 'a', pitch: [0.47, 0.45], trailing: '' },
  { text: 'single', pitch: [0.36, 0.29], trailing: '' },
  { text: 'sound', pitch: [0.29, 0.29], trailing: '.' },
  { text: 'Did', pitch: [0.33, 0.29], trailing: '' },
  { text: 'you', pitch: [0.75, 1.0], trailing: '' },
  { text: 'notice', pitch: [0.26, 0.69], trailing: '' },
  { text: 'how', pitch: [0.34, 0.31], trailing: '' },
  { text: 'the', pitch: [0.31, 0.31], trailing: '' },
  { text: 'evening', pitch: [0.24, 0.35], trailing: '' },
  { text: 'light', pitch: [0.23, 0.05], trailing: '' },
  { text: 'shifted', pitch: [0.24, 0.39], trailing: '' },
  { text: 'over', pitch: [0.27, 0.23], trailing: '' },
  { text: 'the', pitch: [0.16, 0.05], trailing: '' },
  { text: 'water', pitch: [0.03, 0.96], trailing: '?' },
  { text: 'For', pitch: [0.6, 0.55], trailing: '' },
  { text: 'a', pitch: [0.46, 0.31], trailing: '' },
  { text: 'moment', pitch: [0.38, 1.0], trailing: '', pause: 'soft' },
  { text: 'everything', pitch: [0.45, 0.84], trailing: '' },
  { text: 'felt', pitch: [0.74, 0.45], trailing: '' },
  { text: 'calm', pitch: [0.26, 0.66], trailing: ',' },
  { text: 'patient', pitch: [0.31, 0.88], trailing: ',' },
  { text: 'and', pitch: [0.3, 0.27], trailing: '' },
  { text: 'almost', pitch: [0.28, 0.43], trailing: '', pause: 'soft' },
  { text: 'unreal', pitch: [0.34, 0.25], trailing: '.' },
]

/**
 * Word spoken-time spans (seconds) in `demo-voice.mp3`, index-aligned with
 * `sampleAiTokens` (and with the rules tokens, which are the same words). Used
 * to highlight the word currently being spoken during playback.
 */
export const sampleWordTimings: Array<{ start: number; end: number }> = [
  { start: 0.08, end: 0.4 },
  { start: 0.4, end: 0.72 },
  { start: 0.72, end: 1.04 },
  { start: 1.04, end: 1.2 },
  { start: 1.2, end: 1.92 },
  { start: 1.92, end: 2.16 },
  { start: 2.16, end: 2.32 },
  { start: 2.32, end: 2.56 },
  { start: 2.56, end: 3.2 },
  { start: 3.28, end: 3.52 },
  { start: 3.52, end: 3.68 },
  { start: 3.68, end: 4.0 },
  { start: 4.0, end: 4.24 },
  { start: 4.24, end: 4.4 },
  { start: 4.4, end: 4.64 },
  { start: 4.64, end: 4.96 },
  { start: 4.96, end: 5.44 },
  { start: 5.44, end: 5.68 },
  { start: 5.68, end: 5.84 },
  { start: 5.84, end: 6.48 },
  { start: 6.64, end: 6.88 },
  { start: 6.88, end: 7.04 },
  { start: 7.04, end: 7.25 },
  { start: 7.46, end: 7.92 },
  { start: 7.92, end: 8.24 },
  { start: 8.24, end: 8.88 },
  { start: 8.88, end: 9.52 },
  { start: 9.52, end: 9.68 },
  { start: 9.68, end: 9.88 },
  { start: 10.26, end: 10.8 },
]
