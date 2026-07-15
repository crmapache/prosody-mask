import { useEffect, useRef } from 'react'
import type { CSSProperties, ReactElement } from 'react'
import { createMask } from '../renderer'
import { toMaskInput } from '../wrapper-input'
import type { MaskHandle, MaskStyle, Token } from '../types'

export interface ProsodyMaskProps {
  /** Plain text; tokenised and pitched by the built-in rules. Ignored when `tokens` is set. */
  text?: string
  /** Rules language for `text` (`en` default, plus `es`, `fr`, `it`, `pt`, `ro`, `ru`). */
  lang?: string
  /** Pre-pitched tokens (from an LLM or a pitch tracker) — used verbatim, wins over `text`. */
  tokens?: Token[]
  /** Partial style, merged over `defaultStyle`. */
  maskStyle?: Partial<MaskStyle>
  /** Class for the host element. */
  className?: string
  /** Inline style for the host element. */
  style?: CSSProperties
}

/**
 * Thin React wrapper around the framework-agnostic {@link createMask}. It owns
 * no render logic: it creates the mask on mount, pushes prop changes through
 * `update()` / `setStyle()`, and tears it down on unmount.
 *
 * `text`/`lang`/`tokens` and `maskStyle` sync on separate effects, keyed on
 * their own values — not on every render — because `update()` rebuilds the
 * DOM from scratch and must not run for an unrelated re-render (e.g. a
 * `className` change).
 */
export function ProsodyMask(props: ProsodyMaskProps): ReactElement {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const maskRef = useRef<MaskHandle | null>(null)
  const initialProps = useRef(props)
  initialProps.current = props

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const { text, lang, tokens, maskStyle } = initialProps.current
    const mask = createMask(host, toMaskInput({ text, lang, tokens }), maskStyle)
    maskRef.current = mask
    return () => {
      mask.destroy()
      maskRef.current = null
    }
  }, [])

  useEffect(() => {
    maskRef.current?.update(toMaskInput({ text: props.text, lang: props.lang, tokens: props.tokens }))
  }, [props.text, props.lang, props.tokens])

  useEffect(() => {
    if (props.maskStyle) maskRef.current?.setStyle(props.maskStyle)
  }, [props.maskStyle])

  return <div ref={hostRef} className={props.className} style={props.style} />
}

export { defaultStyle } from '../style'
export type { MaskHandle, MaskInput, MaskStyle, Token } from '../types'
