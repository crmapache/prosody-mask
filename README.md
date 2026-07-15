# prosody-mask

Render a translucent **intonation mask** over ordinary flowing text. Each breath
group (a run of words between real pauses) becomes one continuous soft fill that
rises and falls with the speech melody and returns to the floor at every pause -
a rounded "hill" per breath group. The text stays live, selectable and on top;
the overlay is purely decorative.

- **Zero runtime dependencies.** Framework-free, SSR-safe import.
- **Stable, pixel-free data contract.** Pitch is `0..1`, two points per word.
  Rules, an LLM, or a real pitch tracker all produce the same shape.
- **Use it either way:** rules out of the box, or bring your own points for
  accuracy.
- Built-in rules for **English, Spanish, Portuguese and Russian**.

> The built-in pitch is an intonation **heuristic**, an approximation, not
> ground truth. When you need accuracy, produce your own `Token[]` (LLM or pitch
> tracker) and pass them in - the renderer uses them verbatim.

## Install

```sh
npm install prosody-mask
```

## Quick start (rules path)

```ts
import { createMask } from 'prosody-mask'

const el = document.getElementById('passage')!
const mask = createMask(el, { text: 'How do you decide between the options?' })
// ... later, on teardown:
mask.destroy()
```

That's it: the package tokenises the text, computes pitch from intonation rules,
groups by pauses and draws the overlay behind the words.

Pick a language with `lang` (`en` default, plus `es`, `pt`, `ru`):

```ts
createMask(el, { text: '¿Viste la luz sobre el agua?', lang: 'es' })
```

## Bring your own points

When you have real melody (from an LLM or a pitch tracker), skip the rules and
supply tokens directly. They are used exactly as given:

```ts
import { createMask, type Token } from 'prosody-mask'

const tokens: Token[] = [
  { text: 'Bring', pitch: [0.30, 0.55], trailing: '' },
  { text: 'your', pitch: [0.55, 0.50], trailing: '' },
  { text: 'own', pitch: [0.50, 0.68], trailing: '' },
  { text: 'points', pitch: [0.74, 0.10], trailing: '.' },
]

createMask(el, { tokens })
```

You can also precompute the rules tokens, tweak them, then pass them back:

```ts
import { computeTokens } from 'prosody-mask'

const tokens = computeTokens('The tide came in slowly.', { lang: 'en' })
```

## The pitch contract

The whole point of the package is one stable point format.

- **Pitch is a float in `0..1`.** `0` = floor (bottom of the letters), `1` =
  ceiling (letter tops). Fractional values are the norm. The scale is font- and
  layout-independent; the renderer maps it into pixels at draw time. Producers of
  points never think in pixels.
- **Two points per word:** `pitch: [onset, offset]`. This lets the melody slope
  across a single word and interpolate smoothly across the group.
- **`trailing`** is the punctuation that follows the word, one of
  `, . ? ! ; :` or `""`. It drives grouping:
  - `, ; :` → a **soft** pause (small gap, group ends)
  - `. ? !` → a **hard** pause (larger gap, group ends)
  - none → **no** pause; the breath group continues

```ts
interface Token {
  text: string // the word as displayed, e.g. "decide"
  pitch: [number, number] // [onset, offset], each 0..1
  trailing?: string // "," "." "?" "!" ";" ":" or ""
}
```

Grouping is one deterministic function, so rules-produced and externally-supplied
tokens behave identically. Producers only fill `pitch` and `trailing` - they never
decide grouping.

## Style preset

Style is a plain, serialisable object, kept entirely separate from pitch data.
A single shared `color` drives the fill and both lines; each layer has its own
opacity/width.

```ts
import { createMask, defaultStyle } from 'prosody-mask'

createMask(el, { text }, { ...defaultStyle, color: '#3b6ea5', fillOpacity: 0.2 })
```

| Field           | Type   | Default   | Meaning                                                        |
| --------------- | ------ | --------- | -------------------------------------------------------------- |
| `color`         | string | `#C6851C` | Shared colour for fill + both lines (`#rgb` or `#rrggbb`).     |
| `fillOpacity`   | number | `0.16`    | Fill opacity, `0..1` (`0` hides the fill).                     |
| `topWidth`      | number | `1.5`     | Top edge line width in px (`0` hides it).                      |
| `topOpacity`    | number | `0.45`    | Top edge line opacity, `0..1`.                                 |
| `bottomWidth`   | number | `2.5`     | Baseline width in px (`0` hides it).                           |
| `bottomOpacity` | number | `0.85`    | Baseline opacity, `0..1`.                                      |
| `floorLift`     | number | `0.38`    | Minimum fill height so low pitch never collapses to the floor. |
| `softGap`       | number | `10`      | Gap in px for a soft pause (comma / `;` / `:`).                |
| `hardGap`       | number | `22`      | Gap in px for a hard pause (`.` / `?` / `!`).                  |
| `smoothing`     | number | `1`       | Catmull-Rom tension; `1` = reference, `0` = straight lines.    |

Tune a look in the [playground](#playground) and copy it as a preset.

## API

```ts
function createMask(container: HTMLElement, input: MaskInput, style?: Partial<MaskStyle>): MaskHandle

type MaskInput = { text: string; lang?: string } | { text?: string; tokens: Token[] }

interface MaskHandle {
  update(input?: MaskInput): void // re-tokenise / re-draw
  setStyle(style: Partial<MaskStyle>): void // merge style and redraw live
  redraw(): void // recompute geometry (call on a layout change)
  destroy(): void // remove all nodes and listeners
}
```

Also exported: `computeTokens`, `defaultStyle`, `groupTokens`, `pauseAfter`,
`tokenise`, `classifyPunct`, `smoothTop`, `getProfile`, `supportedLanguages`, and
all types.

The renderer recomputes automatically on window resize, container resize
(`ResizeObserver`) and after `document.fonts.ready`, debounced with
`requestAnimationFrame`.

## Accessibility

- The text stays live, selectable and keyboard-reachable; the SVG overlay is
  `aria-hidden="true"` and `pointer-events: none`, so it never intercepts
  selection or clicks.
- The overlay grows only inside the text's own height (from the letter floor to
  at most the letter tops), so line spacing is identical to plain text.
- Gap spans between breath groups are `aria-hidden` spacing only.

## Adding a language

Each language is a small profile (function words + wh-question openers) plugged
into a shared intonation engine - the grouping and contour are language-agnostic.
Copy `src/rules/en.ts`, swap the word tables, and register it in
`src/rules/index.ts`.

## Playground

A standalone Vite page under `playground/` lets you dial in a style, copy it as a
preset (TypeScript or JSON), type your own text (rules, any supported language),
and paste external `Token[]` to preview measured/AI melody. It also toggles the
same passage between rules-computed pitch and hand-authored "AI" points.

```sh
npm run dev              # playground dev server
npm run build:playground # static build -> playground/dist
```

The playground exports **style only** - pitch points are a separate flow and are
never frozen into a preset.

## Development

```sh
npm run build      # bundle ESM + CJS + .d.ts (tsup)
npm test           # unit tests (vitest)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

## License

MIT © Maksim Zolotoi
