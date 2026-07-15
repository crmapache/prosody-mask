import { type LanguageProfile, wordSet } from './profile'

// Portuguese (EU/BR neutral). Same heuristics, Portuguese word tables.

const FUNCTION_WORDS = wordSet([
  'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
  'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
  'ao', 'aos', 'à', 'às', 'com', 'por', 'para', 'sem', 'sobre', 'entre',
  'e', 'ou', 'nem', 'que', 'se', 'seu', 'sua', 'seus', 'suas',
  'me', 'te', 'lhe', 'nos', 'meu', 'teu', 'é', 'são', 'era', 'foi', 'ser', 'estar',
  'está', 'estão', 'como', 'mais', 'mas', 'não', 'eu', 'ele', 'ela', 'eles',
])

const WH_WORDS = wordSet([
  'que', 'quê', 'como', 'onde', 'quando', 'quem', 'qual', 'quais',
  'quanto', 'quanta', 'quantos', 'quantas', 'por', 'porque', 'porquê',
])

export const pt: LanguageProfile = {
  code: 'pt',
  functionWords: FUNCTION_WORDS,
  whWords: WH_WORDS,
}
