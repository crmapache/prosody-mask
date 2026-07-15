/**
 * A per-language profile plugs word tables into the shared intonation engine.
 * Grouping and the pitch contour are language-independent; only these lexical
 * sets differ. New languages slot in by adding a profile - no engine changes.
 */
export interface LanguageProfile {
  /** ISO 639-1 code, e.g. `"en"`, `"es"`, `"pt"`, `"ru"`. */
  code: string
  /** Function words that sit slightly lower than adjacent content words. */
  functionWords: Set<string>
  /**
   * Question openers that resolve with a FALL (wh-questions), as opposed to
   * yes/no questions which resolve with a RISE.
   */
  whWords: Set<string>
}

/** Build a lowercase `Set` from a whitespace-free word list. */
export function wordSet(words: string[]): Set<string> {
  return new Set(words.map((w) => w.toLowerCase()))
}
