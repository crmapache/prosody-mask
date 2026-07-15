import { type LanguageProfile, wordSet } from './profile'

// French. Same declarative-fall / yes-no-rise / list-continuation heuristics;
// only the lexical tables change. Elided forms (l'eau, qu'il, s'il, ...) are
// tokenised as one word by the apostrophe-joining rule, so they won't match
// the plain function-word list below - a known heuristic gap, not ground truth.

const FUNCTION_WORDS = wordSet([
  'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'au', 'aux',
  'et', 'ou', 'mais', 'ni', 'car', 'donc', 'or', 'que', 'qui', 'quoi',
  'se', 'sa', 'son', 'ses', 'leur', 'leurs', 'ce', 'cet', 'cette', 'ces',
  'il', 'elle', 'ils', 'elles', 'on', 'nous', 'vous', 'je', 'tu', 'me', 'te', 'lui', 'y', 'en',
  'est', 'sont', 'était', 'étaient', 'être', 'a', 'ont', 'avait', 'avaient', 'avoir',
  'ne', 'pas', 'non', 'si', 'comme', 'plus', 'très',
  'dans', 'sur', 'pour', 'avec', 'sans', 'chez', 'entre', 'par', 'vers', 'sous',
])

const WH_WORDS = wordSet([
  'qui', 'que', 'quoi', 'où', 'quand', 'comment', 'pourquoi',
  'quel', 'quelle', 'quels', 'quelles', 'combien', 'lequel', 'laquelle',
])

export const fr: LanguageProfile = {
  code: 'fr',
  functionWords: FUNCTION_WORDS,
  whWords: WH_WORDS,
}
