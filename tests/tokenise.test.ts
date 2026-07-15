import { describe, expect, it } from 'vitest'
import { classifyPunct, tokenise } from '../src/tokenise'

describe('tokenise', () => {
  it('keeps contractions as one token', () => {
    const t = tokenise("can't you're don't")
    expect(t.map((x) => x.text)).toEqual(["can't", "you're", "don't"])
  })

  it('keeps hyphenated words as one token', () => {
    const t = tokenise('multi-token well-being')
    expect(t.map((x) => x.text)).toEqual(['multi-token', 'well-being'])
  })

  it('keeps numbers (decimals and thousands) as one token', () => {
    const t = tokenise('3.14 and 1,000 items')
    expect(t.map((x) => x.text)).toEqual(['3.14', 'and', '1,000', 'items'])
  })

  it('captures trailing punctuation and strips it from the word', () => {
    const t = tokenise('Hello, world. Really?')
    expect(t).toEqual([
      { text: 'Hello', trailing: ',' },
      { text: 'world', trailing: '.' },
      { text: 'Really', trailing: '?' },
    ])
  })

  it('normalises multi-mark runs to the strongest mark', () => {
    expect(classifyPunct('?!')).toBe('?')
    expect(classifyPunct('...')).toBe('.')
    expect(classifyPunct('!?')).toBe('?')
    expect(classifyPunct(';')).toBe(';')
    expect(classifyPunct('')).toBe('')
  })

  it('handles non-latin scripts (Russian, accented Spanish)', () => {
    expect(tokenise('¿Cómo estás?').map((x) => x.text)).toEqual(['Cómo', 'estás'])
    expect(tokenise('Привет, мир!').map((x) => ({ ...x }))).toEqual([
      { text: 'Привет', trailing: ',' },
      { text: 'мир', trailing: '!' },
    ])
  })
})
