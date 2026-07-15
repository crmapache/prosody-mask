import { createMask } from '../renderer'
import { toMaskInput } from '../wrapper-input'
import type { MaskHandle, MaskStyle, Token } from '../types'

export interface ProsodyMaskActionOptions {
  text?: string
  lang?: string
  tokens?: Token[]
  maskStyle?: Partial<MaskStyle>
}

/**
 * Svelte action — use on any element:
 *
 * ```svelte
 * <script lang="ts">
 *   import { prosodyMask } from 'prosody-mask/svelte'
 *   let options = { text: 'How do you decide between the options?', lang: 'en' }
 * </script>
 *
 * <div use:prosodyMask={options}></div>
 * ```
 *
 * No Svelte runtime dependency — it's a plain action returning `{ update, destroy }`.
 */
export function prosodyMask(
  node: HTMLElement,
  options: ProsodyMaskActionOptions = {},
): { update: (next?: ProsodyMaskActionOptions) => void; destroy: () => void } {
  const mask: MaskHandle = createMask(node, toMaskInput(options), options.maskStyle)
  return {
    update(next: ProsodyMaskActionOptions = {}) {
      mask.update(toMaskInput(next))
      if (next.maskStyle) mask.setStyle(next.maskStyle)
    },
    destroy() {
      mask.destroy()
    },
  }
}

export { defaultStyle } from '../style'
export type { MaskHandle, MaskInput, MaskStyle, Token } from '../types'
