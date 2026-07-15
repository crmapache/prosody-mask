import type { MaskInput, Token } from './types'

/**
 * The subset of framework-wrapper props that describe *what to render* (as
 * opposed to `maskStyle`, which describes how it looks). Shared by every
 * wrapper so the text-vs-tokens decision is made in exactly one place.
 */
export interface WrapperInputProps {
  text?: string
  lang?: string
  tokens?: Token[]
}

/**
 * Build a `MaskInput` from wrapper props. `tokens`, when passed at all (even
 * empty), takes the `{ tokens }` branch so the renderer's own fallback-to-text
 * behaviour still applies; otherwise falls back to `{ text, lang }`.
 */
export function toMaskInput(props: WrapperInputProps): MaskInput {
  return props.tokens ? { text: props.text, tokens: props.tokens } : { text: props.text ?? '', lang: props.lang }
}
