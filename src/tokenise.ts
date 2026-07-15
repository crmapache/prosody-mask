/**
 * Text -> raw word + trailing-punctuation tokens.
 *
 * Language-agnostic: uses Unicode letter/number classes so it works for
 * English, Spanish, Portuguese, Russian, etc. The rules engine turns these raw
 * tokens into pitched `Token`s.
 */

export interface RawToken {
  text: string
  /** Normalised trailing punctuation: one of `, . ? ! ; :` or `""`. */
  trailing: string
}

/**
 * A word core: letters/digits, allowing internal `. , ' ’ -` **only between**
 * word characters. This keeps contractions (`can't`, `you're`), hyphenates
 * (`multi-token`) and numbers (`3.14`, `1,000`) as single tokens, while a
 * sentence-final `.` (followed by space/end) is left for the trailing group.
 * The trailing group then captures any run of `, . ? ! ; :`.
 */
const TOKEN_RE = /([\p{L}\p{N}]+(?:[.,'’-][\p{L}\p{N}]+)*)([.,!?;:]*)/gu

/**
 * Reduce a raw punctuation run to a single normalised mark, strongest first,
 * so `"really?!"` -> `"?"` and `"wait..."` -> `"."`.
 */
export function classifyPunct(raw: string): string {
  if (!raw) return ''
  if (raw.includes('?')) return '?'
  if (raw.includes('!')) return '!'
  if (raw.includes('.')) return '.'
  if (raw.includes(';')) return ';'
  if (raw.includes(':')) return ':'
  if (raw.includes(',')) return ','
  return ''
}

export function tokenise(text: string): RawToken[] {
  const out: RawToken[] = []
  for (const m of text.matchAll(TOKEN_RE)) {
    const word = m[1]
    if (!word) continue
    out.push({ text: word, trailing: classifyPunct(m[2] ?? '') })
  }
  return out
}
