import { pauseAfter } from '../grouping'
import type { PitchPair, Token } from '../types'
import type { LanguageProfile } from './profile'

/**
 * Tunable pitch table. Everything is on the mask's `0..1` scale (0 = floor,
 * 1 = ceiling). These few numbers define the whole heuristic look; tweak here.
 */
const P = {
  entry: 0.3, // where a breath group lifts off from the floor
  bodyLow: 0.42, // start of the gentle body rise
  bodyHigh: 0.64, // pre-nuclear ceiling of the body rise
  nucleus: 0.74, // peak on the last content word (the main stress)
  functionDip: 0.14, // function words sit this much lower than content words
  contRise: 0.86, // continuation / list-item high ending
  fallLow: 0.12, // statement / wh-question resolution (fall to low)
  yesNoRise: 0.93, // yes/no question resolution (rise to high)
  min: 0.05,
  max: 1,
}

const clamp = (n: number): number => Math.max(P.min, Math.min(P.max, n))

type SentenceType = 'statement' | 'wh' | 'yesno'
type Role = 'continuation' | 'final-fall' | 'final-rise'

const isFunction = (tok: Token, profile: LanguageProfile): boolean =>
  profile.functionWords.has(tok.text.toLowerCase())

/**
 * Classify a sentence (token span `a..b`, inclusive) from its final mark and
 * opening word:
 * - ends with `?` and opens with a wh-word -> wh-question (falls)
 * - ends with `?` otherwise -> yes/no question (rises)
 * - anything else (`.`, `!`, none) -> statement (falls)
 */
function classifySentence(tokens: Token[], a: number, b: number, profile: LanguageProfile): SentenceType {
  if (tokens[b].trailing !== '?') return 'statement'
  // A wh-question starts with the wh-word; check the first couple of tokens so a
  // leading discourse marker ("So how...") still classifies as wh.
  for (let i = a; i <= Math.min(a + 1, b); i++) {
    if (profile.whWords.has(tokens[i].text.toLowerCase())) return 'wh'
  }
  return 'yesno'
}

/**
 * Assign onset/offset pitch to one breath group (token span `a..b`).
 *
 * The contour is stored as `M+1` "nodes" between/around the `M` words. Word `k`
 * reads `onset = node[k]`, `offset = node[k+1]`, so `offset[k] === onset[k+1]`
 * exactly - the chaining continuity the reference achieves with `prevEnd`.
 */
function assignGroup(tokens: Token[], a: number, b: number, role: Role, profile: LanguageProfile): void {
  const m = b - a + 1

  // Per-word target height: a gentle body rise, function words dipped.
  let lastContent = m - 1
  const h: number[] = []
  for (let k = 0; k < m; k++) {
    const t = m === 1 ? 0.5 : k / (m - 1)
    let v = P.bodyLow + (P.bodyHigh - P.bodyLow) * t
    if (isFunction(tokens[a + k], profile)) v -= P.functionDip
    else lastContent = k // nuclear stress lands on the last content word
    h.push(v)
  }

  // Contour nodes. Interior nodes blend adjacent word targets.
  const nodes = new Array<number>(m + 1)
  nodes[0] = P.entry
  for (let k = 1; k < m; k++) nodes[k] = (h[k - 1] + h[k]) / 2

  if (role === 'continuation') {
    nodes[m] = P.contRise
    nodes[lastContent] = Math.max(nodes[lastContent], P.bodyHigh)
  } else if (role === 'final-rise') {
    nodes[m] = P.yesNoRise
    nodes[lastContent] = Math.max(nodes[lastContent], P.nucleus - 0.05)
  } else {
    // final-fall: the nucleus is the pivot - high onset, then descend to low.
    nodes[lastContent] = Math.max(nodes[lastContent], P.nucleus)
    for (let k = lastContent + 1; k <= m; k++) nodes[k] = P.fallLow
  }

  for (let k = 0; k < m; k++) {
    tokens[a + k].pitch = [clamp(nodes[k]), clamp(nodes[k + 1])] as PitchPair
  }
}

/**
 * Fill every token's pitch in place. Walks the text sentence by sentence
 * (split on hard pauses), then group by group inside each sentence (split on
 * soft pauses), assigning a role: non-final groups continue high; the final
 * group resolves by sentence type.
 */
export function assignPitch(tokens: Token[], profile: LanguageProfile): void {
  const n = tokens.length
  let i = 0
  while (i < n) {
    // Extend to the end of the sentence (next hard pause, or the last token).
    let end = i
    while (end < n && pauseAfter(tokens[end].trailing) !== 'hard') end++
    if (end >= n) end = n - 1

    const type = classifySentence(tokens, i, end, profile)

    // Split the sentence into breath groups on soft pauses.
    const groups: Array<[number, number]> = []
    let start = i
    for (let k = i; k <= end; k++) {
      if (pauseAfter(tokens[k].trailing) === 'soft' || k === end) {
        groups.push([start, k])
        start = k + 1
      }
    }

    groups.forEach(([a, b], gi) => {
      const isLast = gi === groups.length - 1
      const role: Role = !isLast ? 'continuation' : type === 'yesno' ? 'final-rise' : 'final-fall'
      assignGroup(tokens, a, b, role, profile)
    })

    i = end + 1
  }
}
