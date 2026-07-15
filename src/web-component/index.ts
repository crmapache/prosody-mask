import { createMask } from '../renderer'
import { toMaskInput } from '../wrapper-input'
import type { MaskHandle, MaskInput, MaskStyle, Token } from '../types'

/** Attributes observed for plain string values; `tokens`/`maskStyle` are properties (complex values). */
const OBSERVED_ATTRIBUTES = ['text', 'lang']

/**
 * `<prosody-mask>` custom element — the universal wrapper. Works in plain
 * HTML and in any framework (Angular, Solid, Qwik, Astro, …). `text`/`lang`
 * are attributes; `tokens` and `maskStyle` are properties (set them from JS).
 *
 * ```html
 * <prosody-mask text="How do you decide between the options?" lang="en"></prosody-mask>
 * ```
 *
 * ```ts
 * import 'prosody-mask/web-component'
 *
 * const el = document.querySelector('prosody-mask')!
 * el.tokens = [{ text: 'Bring', pitch: [0.3, 0.55], trailing: '' }, /* … *\/]
 * el.maskStyle = { color: '#3b6ea5' }
 * ```
 */
export class ProsodyMaskElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return OBSERVED_ATTRIBUTES
  }

  private mask: MaskHandle | null = null
  private _tokens: Token[] | undefined
  private _maskStyle: Partial<MaskStyle> | undefined

  connectedCallback(): void {
    if (this.mask) return
    if (!this.style.display) this.style.display = 'block'
    this.mask = createMask(this, this.input(), this._maskStyle)
  }

  disconnectedCallback(): void {
    this.mask?.destroy()
    this.mask = null
  }

  attributeChangedCallback(): void {
    this.mask?.update(this.input())
  }

  get tokens(): Token[] | undefined {
    return this._tokens
  }
  set tokens(value: Token[] | undefined) {
    this._tokens = value
    this.mask?.update(this.input())
  }

  get maskStyle(): Partial<MaskStyle> | undefined {
    return this._maskStyle
  }
  set maskStyle(value: Partial<MaskStyle> | undefined) {
    this._maskStyle = value
    if (value) this.mask?.setStyle(value)
  }

  private input(): MaskInput {
    return toMaskInput({
      text: this.getAttribute('text') ?? undefined,
      lang: this.getAttribute('lang') ?? undefined,
      tokens: this._tokens,
    })
  }
}

/** Register the element (idempotent). Auto-runs on import for the common case. */
export function defineProsodyMaskElement(tag = 'prosody-mask'): void {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) {
    customElements.define(tag, ProsodyMaskElement)
  }
}

defineProsodyMaskElement()

export { defaultStyle } from '../style'
export type { MaskHandle, MaskInput, MaskStyle, Token } from '../types'
