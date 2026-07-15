import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PropType, Ref } from 'vue'
import { createMask } from '../renderer'
import { toMaskInput } from '../wrapper-input'
import type { MaskHandle, MaskStyle, Token } from '../types'

/**
 * Thin Vue 3 wrapper around the framework-agnostic {@link createMask}. Props
 * mirror `ProsodyMaskProps` (see the React wrapper); it owns no render logic,
 * just creating, updating and destroying the mask across the component
 * lifecycle.
 */
export const ProsodyMask = defineComponent({
  name: 'ProsodyMask',
  props: {
    text: { type: String, default: undefined },
    lang: { type: String, default: undefined },
    tokens: { type: Array as PropType<Token[]>, default: undefined },
    maskStyle: { type: Object as PropType<Partial<MaskStyle>>, default: undefined },
    className: { type: String, default: undefined },
  },
  setup(props) {
    const host: Ref<HTMLDivElement | null> = ref(null)
    let mask: MaskHandle | null = null

    onMounted(() => {
      if (!host.value) return
      mask = createMask(host.value, toMaskInput(props), props.maskStyle)
    })

    // Rebuilds the DOM, so it only watches the fields that actually change what's rendered.
    watch(
      () => [props.text, props.lang, props.tokens] as const,
      () => mask?.update(toMaskInput(props)),
    )
    watch(
      () => props.maskStyle,
      (next) => {
        if (next) mask?.setStyle(next)
      },
      { deep: true },
    )

    onBeforeUnmount(() => {
      mask?.destroy()
      mask = null
    })

    return () => h('div', { ref: host, class: props.className })
  },
})

export default ProsodyMask
export { defaultStyle } from '../style'
export type { MaskHandle, MaskInput, MaskStyle, Token } from '../types'
