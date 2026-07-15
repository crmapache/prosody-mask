import type { BreathGroup, PauseStrength, Token } from './types'

const SOFT = new Set([',', ';', ':'])
const HARD = new Set(['.', '?', '!'])

/**
 * Map a token's trailing punctuation to the pause that follows it.
 * - `, ; :` -> `soft` (small gap, group ends)
 * - `. ? !` -> `hard` (larger gap, group ends)
 * - anything else / none -> `none` (group continues; the "decide between" case)
 */
export function pauseAfter(trailing: string | undefined): PauseStrength {
  if (!trailing) return 'none'
  if (HARD.has(trailing)) return 'hard'
  if (SOFT.has(trailing)) return 'soft'
  return 'none'
}

const RANK: Record<PauseStrength, number> = { none: 0, soft: 1, hard: 2 }

/**
 * Effective pause after a token: the stronger of its punctuation-derived pause
 * and its explicit `pause` marker. This lets measured/AI producers introduce a
 * real pause where the text carries no punctuation.
 */
export function pauseOf(token: Token): PauseStrength {
  const punct = pauseAfter(token.trailing)
  const explicit = token.pause ?? 'none'
  return RANK[explicit] > RANK[punct] ? explicit : punct
}

/**
 * Group tokens into breath groups by scanning `trailing`. This is the one
 * deterministic grouping function, so rules-produced and externally-supplied
 * tokens behave identically. Producers of points never decide grouping.
 */
export function groupTokens(tokens: Token[]): BreathGroup[] {
  const groups: BreathGroup[] = []
  let current: Token[] = []
  for (const tok of tokens) {
    current.push(tok)
    const pause = pauseOf(tok)
    if (pause !== 'none') {
      groups.push({ tokens: current, pause })
      current = []
    }
  }
  if (current.length) groups.push({ tokens: current, pause: 'none' })
  return groups
}
