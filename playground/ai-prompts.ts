import { $ } from './dom'
import { wireCopy } from './clipboard'

/**
 * Ready-made prompt a user copies to author their own `Token[]` from text
 * alone with an AI, so they never have to write the prompt. The output format
 * matches the `Token` contract exactly.
 */
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

/**
 * Ready-made prompt a user copies to derive `Token[]` from measured speech
 * data (word timings + an F0 track) instead of guessing the melody from text.
 */
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

/** Paint the two ready-made prompts and wire their copy buttons. */
export function initAiPrompts(): void {
  $('prompt-text').textContent = PROMPT_TEXT
  $('prompt-audio').textContent = PROMPT_AUDIO
  wireCopy('copy-prompt-text', () => PROMPT_TEXT)
  wireCopy('copy-prompt-audio', () => PROMPT_AUDIO)
}
