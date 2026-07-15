import { type LanguageProfile, wordSet } from './profile'

// English heuristics. This is an approximation of well-known intonation
// patterns, not ground truth - callers who need accuracy should pass their own
// `tokens`. Keep these tables small and readable so they are easy to tune.

const FUNCTION_WORDS = wordSet([
  'the', 'a', 'an', 'of', 'to', 'and', 'but', 'or', 'nor', 'so', 'yet',
  'in', 'on', 'at', 'by', 'for', 'with', 'from', 'into', 'onto', 'over',
  'as', 'than', 'then', 'that', 'this', 'these', 'those', 'it', 'its',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
  'do', 'does', 'did', 'has', 'have', 'had',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'our', 'their', 'if', 'not', 'no',
])

const WH_WORDS = wordSet(['how', 'what', 'why', 'where', 'when', 'who', 'whom', 'whose', 'which'])

export const en: LanguageProfile = {
  code: 'en',
  functionWords: FUNCTION_WORDS,
  whWords: WH_WORDS,
}
