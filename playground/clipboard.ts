import { $ } from './dom'

/** How long a "Copy" button reads "Copied" before reverting its label. */
const COPIED_LABEL_MS = 1200

/** Wire a button to copy the string `get()` returns, with a transient "Copied" label. */
export function wireCopy(id: string, get: () => string): void {
  const btn = $(id)
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(get())
      const prev = btn.textContent
      btn.textContent = 'Copied'
      setTimeout(() => {
        btn.textContent = prev
      }, COPIED_LABEL_MS)
    } catch {
      /* clipboard unavailable */
    }
  })
}
