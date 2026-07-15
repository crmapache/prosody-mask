import { tokenise } from '../tokenise'
import type { PitchPair, Token } from '../types'
import { assignPitch } from './engine'
import { en } from './en'
import { es } from './es'
import { fr } from './fr'
import { it } from './it'
import type { LanguageProfile } from './profile'
import { pt } from './pt'
import { ro } from './ro'
import { ru } from './ru'

const PROFILES: Record<string, LanguageProfile> = { en, es, pt, ru, fr, it, ro }

/** Languages with a built-in rules profile. */
export const supportedLanguages: string[] = Object.keys(PROFILES)

/** Resolve a `lang` string to a profile, falling back to English. */
export function getProfile(lang?: string): LanguageProfile {
  const code = (lang ?? 'en').toLowerCase().slice(0, 2)
  return PROFILES[code] ?? en
}

/**
 * The default pitch producer: pure, no DOM, no network. Tokenises `text` and
 * fills each token's `pitch` from language intonation heuristics.
 *
 * This is a heuristic approximation, not ground truth. Callers who need
 * accuracy should build `Token[]` themselves (from an LLM or a pitch tracker)
 * and pass them to `createMask` as `{ tokens }`.
 */
export function computeTokens(text: string, opts?: { lang?: string }): Token[] {
  const profile = getProfile(opts?.lang)
  const tokens: Token[] = tokenise(text).map((r) => ({
    text: r.text,
    pitch: [0.5, 0.5] as PitchPair,
    trailing: r.trailing,
  }))
  assignPitch(tokens, profile)
  return tokens
}
