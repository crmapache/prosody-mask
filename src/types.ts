/**
 * Public data contract for prosody-mask.
 *
 * The whole point of the package is a stable, pixel-free point format that
 * rules, an LLM, or a real pitch tracker can all produce identically.
 */

/** A word's pitch as `[onset, offset]`, each a float in `0..1`. */
export type PitchPair = [number, number]

/**
 * One displayed word plus its melody.
 *
 * `pitch` is font- and layout-independent: `0` = floor (bottom of the letters),
 * `1` = ceiling (letter tops). The renderer maps `0..1` into real pixels at draw
 * time using measured font metrics. Producers of points must never think in
 * pixels.
 */
export interface Token {
  /** The word exactly as displayed, e.g. `"decide"`. */
  text: string
  /** `[onset, offset]`, each `0..1`. Lets the melody slope across one word. */
  pitch: PitchPair
  /** Trailing punctuation, one of `, . ? ! ; :` or `""`. Drives pause/grouping. */
  trailing?: string
  /**
   * An explicit prosodic pause after this word, independent of punctuation.
   * Lets measured/AI producers mark a real pause where the text has no comma or
   * full stop (e.g. a held, dramatic pause a speaker actually makes). Grouping
   * uses the stronger of this and the `trailing` punctuation.
   */
  pause?: 'soft' | 'hard'
}

/** Pause that follows a breath group. */
export type PauseStrength = 'none' | 'soft' | 'hard'

/** A run of tokens with no real pause inside it. */
export interface BreathGroup {
  tokens: Token[]
  /** The pause that follows this group (`none` for the final group). */
  pause: PauseStrength
}

/**
 * Input to `createMask`.
 *
 * - `{ text }` (optionally `lang`) → the package tokenises and fills pitch by
 *   rules.
 * - `{ tokens }` → the caller supplies pitch (LLM, pitch tracker, or by hand)
 *   and the renderer uses it verbatim. `text` may still be passed for fallback
 *   but `tokens` win.
 */
export type MaskInput = { text: string; lang?: string } | { text?: string; tokens: Token[] }

/**
 * A serialisable style preset. This is the object the playground exports.
 * A single shared `color` drives fill + both lines; each layer has its own
 * opacity/width. Pitch data lives entirely outside this object.
 */
export interface MaskStyle {
  /** One shared colour for fill + both lines (hex, `#rgb` or `#rrggbb`). */
  color: string
  /** Fill opacity, `0..1`. */
  fillOpacity: number
  /** Top edge line width in px; `0` hides it. */
  topWidth: number
  /** Top edge line opacity, `0..1`. */
  topOpacity: number
  /** Baseline width in px; `0` hides it. */
  bottomWidth: number
  /** Baseline opacity, `0..1`. */
  bottomOpacity: number
  /** Minimum fill height (`0..1`) so low pitch never collapses to the floor. */
  floorLift: number
  /** Soft-pause gap (comma / `;` / `:`) in spaces (× the font's space width). */
  softGap: number
  /** Hard-pause gap (`.` / `?` / `!`) in spaces (× the font's space width). */
  hardGap: number
  /** Catmull-Rom tension knob; `1` = reference smoothing, `0` = straight lines. */
  smoothing: number
}

/** Live handle returned by `createMask`. */
export interface MaskHandle {
  /** Re-tokenise / re-draw with new input (or the same input if omitted). */
  update(input?: MaskInput): void
  /** Merge a partial style and redraw live. */
  setStyle(style: Partial<MaskStyle>): void
  /** Recompute geometry (call after a layout change the observer can't see). */
  redraw(): void
  /** Remove all injected nodes and listeners. */
  destroy(): void
}
