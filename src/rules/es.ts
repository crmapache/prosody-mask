import { type LanguageProfile, wordSet } from './profile'

// Spanish. Same declarative-fall / yes-no-rise / list-continuation heuristics;
// only the lexical tables change. Accented forms are kept verbatim.

const FUNCTION_WORDS = wordSet([
  'el', 'la', 'los', 'las', 'lo', 'un', 'una', 'unos', 'unas',
  'de', 'del', 'a', 'al', 'en', 'con', 'por', 'para', 'sin', 'sobre', 'entre',
  'y', 'e', 'o', 'u', 'ni', 'que', 'se', 'su', 'sus', 'le', 'les',
  'me', 'te', 'nos', 'os', 'mi', 'tu', 'es', 'son', 'era', 'fue', 'ser', 'estar',
  'está', 'están', 'como', 'si', 'no', 'más', 'pero', 'yo', 'él', 'ella', 'ellos',
])

const WH_WORDS = wordSet([
  'qué', 'que', 'cómo', 'como', 'dónde', 'donde', 'cuándo', 'cuando',
  'quién', 'quien', 'quiénes', 'cuál', 'cual', 'cuáles', 'cuánto', 'cuanto',
  'cuánta', 'cuántos', 'cuántas', 'por',
])

export const es: LanguageProfile = {
  code: 'es',
  functionWords: FUNCTION_WORDS,
  whWords: WH_WORDS,
}
