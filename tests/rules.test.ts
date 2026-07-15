import { describe, expect, it } from 'vitest'
import { groupTokens } from '../src/grouping'
import { computeTokens, supportedLanguages } from '../src/rules'
import type { Token } from '../src/types'

const inRange = (tokens: Token[]): boolean =>
  tokens.every((t) => t.pitch.every((p) => p >= 0 && p <= 1))

const lastOffset = (tokens: Token[]): number => tokens[tokens.length - 1].pitch[1]

describe('rules engine', () => {
  it('all pitch values stay within 0..1', () => {
    const samples = [
      'The tide came in slowly, without a sound.',
      'Did you notice the light?',
      'Why does this happen?',
      'Apples, pears, and plums.',
      'Stop.',
    ]
    for (const s of samples) expect(inRange(computeTokens(s))).toBe(true)
  })

  it('a statement falls at the end (low final offset)', () => {
    const tokens = computeTokens('The system works well.')
    expect(lastOffset(tokens)).toBeLessThan(0.3)
  })

  it('a yes/no question rises at the end (high final offset)', () => {
    const tokens = computeTokens('Did you see it?')
    expect(lastOffset(tokens)).toBeGreaterThan(0.7)
  })

  it('a wh-question falls at the end', () => {
    const tokens = computeTokens('Why did it break?')
    expect(lastOffset(tokens)).toBeLessThan(0.3)
  })

  it('list items rise (continuation) then the last item falls', () => {
    const tokens = computeTokens('Apples, pears, and plums.')
    const groups = groupTokens(tokens)
    expect(groups.length).toBeGreaterThanOrEqual(3)
    const first = groups[0].tokens
    const last = groups[groups.length - 1].tokens
    expect(lastOffset(first)).toBeGreaterThan(0.7) // continuation rise
    expect(lastOffset(last)).toBeLessThan(0.3) // final fall
  })

  it('onset chains to the previous offset within a group (no visual step)', () => {
    const tokens = computeTokens('measuring event loop lag is the workflow.')
    const groups = groupTokens(tokens)
    for (const g of groups) {
      for (let i = 1; i < g.tokens.length; i++) {
        expect(g.tokens[i].pitch[0]).toBeCloseTo(g.tokens[i - 1].pitch[1], 5)
      }
    }
  })

  it('function words sit lower than an adjacent content word', () => {
    // "the" (function) vs "system" (content) in the body
    const tokens = computeTokens('the system runs and the workers help.')
    const the = tokens.find((t) => t.text === 'the')!
    const system = tokens.find((t) => t.text === 'system')!
    const avg = (t: Token): number => (t.pitch[0] + t.pitch[1]) / 2
    expect(avg(the)).toBeLessThan(avg(system))
  })

  it('supports the shipped languages without crashing and stays in range', () => {
    expect(supportedLanguages).toEqual(expect.arrayContaining(['en', 'es', 'pt', 'ru', 'fr', 'it', 'ro']))
    expect(inRange(computeTokens('¿Viste la luz sobre el agua?', { lang: 'es' }))).toBe(true)
    expect(inRange(computeTokens('Você viu a luz sobre a água?', { lang: 'pt' }))).toBe(true)
    expect(inRange(computeTokens('Ты видел свет над водой?', { lang: 'ru' }))).toBe(true)
    expect(inRange(computeTokens('As-tu vu la lumière sur l’eau ?', { lang: 'fr' }))).toBe(true)
    expect(inRange(computeTokens('Hai visto la luce sull’acqua?', { lang: 'it' }))).toBe(true)
    expect(inRange(computeTokens('Ai văzut lumina peste apă?', { lang: 'ro' }))).toBe(true)
  })

  it('unknown language falls back to English rules', () => {
    const a = computeTokens('The system works well.', { lang: 'zz' })
    const b = computeTokens('The system works well.', { lang: 'en' })
    expect(a).toEqual(b)
  })
})
