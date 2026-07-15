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
    const pause = pauseAfter(tok.trailing)
    if (pause !== 'none') {
      groups.push({ tokens: current, pause })
      current = []
    }
  }
  if (current.length) groups.push({ tokens: current, pause: 'none' })
  return groups
}
