import { type LanguageProfile, wordSet } from './profile'

// Italian. Same heuristics, Italian word tables. Elided forms (l'acqua,
// dell'anno, un'idea, ...) are tokenised as one word by the apostrophe-joining
// rule, so they won't match the plain function-word list - a known heuristic
// gap, not ground truth.

const FUNCTION_WORDS = wordSet([
  'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una',
  'di', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'del', 'dello', 'della',
  'e', 'o', 'ma', 'né', 'anche', 'che', 'chi', 'cui', 'si', 'ci', 'vi',
  'suo', 'sua', 'suoi', 'sue', 'loro', 'mio', 'mia', 'miei', 'mie', 'tuo', 'tua',
  'questo', 'questa', 'questi', 'queste', 'quello', 'quella', 'quelli', 'quelle',
  'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'essi', 'esse', 'mi', 'ti',
  'è', 'sono', 'era', 'erano', 'essere', 'ha', 'hanno', 'aveva', 'avevano', 'avere',
  'non', 'come', 'più', 'se', 'già', 'ancora',
])

const WH_WORDS = wordSet([
  'chi', 'che', 'cosa', 'dove', 'quando', 'come', 'perché',
  'quale', 'quali', 'quanto', 'quanta', 'quanti', 'quante',
])

export const it: LanguageProfile = {
  code: 'it',
  functionWords: FUNCTION_WORDS,
  whWords: WH_WORDS,
}
