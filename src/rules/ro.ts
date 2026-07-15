import { type LanguageProfile, wordSet } from './profile'

// Romanian. Same heuristics as the other Romance profiles; only the lexical
// tables change. Romanian marks definiteness with a suffix on the noun itself
// (omul, casa) rather than a separate article, so the function-word list
// leans on prepositions, conjunctions and pronouns instead.

const FUNCTION_WORDS = wordSet([
  'un', 'o', 'niște', 'de', 'la', 'în', 'cu', 'pe', 'pentru', 'fără', 'despre', 'între',
  'și', 'sau', 'dar', 'nici', 'că', 'să', 'se', 'își', 'său', 'sa', 'săi', 'sale', 'lor',
  'acest', 'această', 'acești', 'aceste', 'acel', 'acea', 'acei', 'acele',
  'eu', 'tu', 'el', 'ea', 'noi', 'voi', 'ei', 'ele', 'îmi', 'îți', 'îi', 'ne', 'vă', 'le',
  'este', 'sunt', 'era', 'erau', 'fi', 'are', 'au', 'avea', 'aveau',
  'nu', 'ca', 'mai', 'dacă', 'foarte', 'așa',
])

const WH_WORDS = wordSet(['cine', 'ce', 'unde', 'când', 'cum', 'care', 'cât', 'câtă', 'câți', 'câte'])

export const ro: LanguageProfile = {
  code: 'ro',
  functionWords: FUNCTION_WORDS,
  whWords: WH_WORDS,
}
