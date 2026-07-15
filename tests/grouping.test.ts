import { describe, expect, it } from 'vitest'
import { groupTokens, pauseAfter } from '../src/grouping'
import { computeTokens } from '../src/rules'
import type { Token } from '../src/types'

const tok = (text: string, trailing = ''): Token => ({ text, pitch: [0.5, 0.5], trailing })

describe('pauseAfter', () => {
  it('classifies soft vs hard pauses', () => {
    expect(pauseAfter(',')).toBe('soft')
    expect(pauseAfter(';')).toBe('soft')
    expect(pauseAfter(':')).toBe('soft')
    expect(pauseAfter('.')).toBe('hard')
    expect(pauseAfter('?')).toBe('hard')
    expect(pauseAfter('!')).toBe('hard')
    expect(pauseAfter('')).toBe('none')
    expect(pauseAfter(undefined)).toBe('none')
  })
})

describe('groupTokens', () => {
  it('keeps a no-punctuation run in one breath group', () => {
    const groups = groupTokens([tok('how'), tok('do'), tok('you'), tok('decide'), tok('between')])
    expect(groups).toHaveLength(1)
    expect(groups[0].tokens.map((t) => t.text)).toEqual(['how', 'do', 'you', 'decide', 'between'])
    expect(groups[0].pause).toBe('none')
  })

  it('splits on commas (soft) and periods (hard) with the right strength', () => {
    const groups = groupTokens([tok('one', ','), tok('two', '.'), tok('three')])
    expect(groups).toHaveLength(3)
    expect(groups[0].pause).toBe('soft')
    expect(groups[1].pause).toBe('hard')
    expect(groups[2].pause).toBe('none')
  })

  it('"decide between" stays unbroken through the real text path', () => {
    const tokens = computeTokens('In production, how do you decide between replicas and threads.')
    const groups = groupTokens(tokens)
    const withDecide = groups.find((g) => g.tokens.some((t) => t.text === 'decide'))
    const words = withDecide?.tokens.map((t) => t.text) ?? []
    expect(words).toContain('decide')
    expect(words).toContain('between')
    // no break lands between "decide" and "between"
    expect(words.indexOf('between')).toBe(words.indexOf('decide') + 1)
  })
})
