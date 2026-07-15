import { type LanguageProfile, wordSet } from './profile'

// Russian. Not Romance, but the same three-way contour heuristic (statement
// falls, yes/no rises, list items continue high) reads well. A Russian yes/no
// question has no wh-word and typically ends with `?`, so it rises - which the
// shared engine already produces.

const FUNCTION_WORDS = wordSet([
  'и', 'в', 'во', 'не', 'на', 'я', 'с', 'со', 'а', 'то', 'все', 'всё',
  'он', 'она', 'оно', 'они', 'так', 'его', 'но', 'да', 'ты', 'к', 'у', 'же',
  'вы', 'за', 'бы', 'по', 'только', 'её', 'ее', 'мне', 'было', 'вот', 'от',
  'меня', 'о', 'из', 'ему', 'для', 'мы', 'был', 'до', 'вас', 'при', 'об',
  'уже', 'или', 'ни', 'быть', 'него', 'вам', 'это', 'этот', 'эта', 'эти',
  'ли', 'бы', 'же', 'ведь', 'вон', 'нет',
])

const WH_WORDS = wordSet([
  'как', 'что', 'почему', 'где', 'когда', 'кто', 'кого', 'кому', 'зачем',
  'какой', 'какая', 'какое', 'какие', 'чей', 'откуда', 'куда', 'сколько', 'чем',
])

export const ru: LanguageProfile = {
  code: 'ru',
  functionWords: FUNCTION_WORDS,
  whWords: WH_WORDS,
}
