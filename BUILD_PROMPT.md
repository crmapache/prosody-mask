# Build prompt: `prosody-mask` — an intonation/breath-group text overlay

You are building a small, dependency-free npm package that renders a translucent
"intonation mask" over ordinary flowing text. The mask shows, per breath group,
a filled shape that rises and falls with the speech melody and breaks only at
real pauses. This document is the full brief. Follow it precisely; where it
leaves a detail open, pick the simplest robust option and note it in code
comments.

A working single-file reference is provided alongside this file:
**`intonation-fill.html`**. It already contains the visual behaviour we want
(fill from floor to letter-tops, smooth Catmull-Rom top edge, breaks only at
punctuation, a live style panel). Treat it as the source of truth for the
*look*, then refactor its ideas into a real package with a clean data contract.
Read it first.

---

## 1. What the package does

Given some text (or pre-tokenised words) plus optional pitch data, it draws an
SVG overlay behind the text inside a container element. Each "breath group" (a
run of words between real pauses) becomes one continuous translucent fill:

- The fill sits **strictly inside the text's own height** — it grows from the
  floor (bottom of the letters) up to at most the letter tops, never above, so
  line spacing is unaffected.
- The fill's **top edge is a smooth curve** driven by pitch points.
- At the **start and end of each breath group the edge returns to the floor**,
  so each group reads as a rounded "hill".
- A **baseline (bottom) line** and an optional **top edge line** are drawn in a
  shared colour, each with independent width and opacity.
- **Breaks (gaps) appear only at genuine pauses** — commas and sentence ends —
  never at minor sense boundaries. Comma gaps are small; sentence-end gaps are
  larger.

The text itself stays live, selectable, and on top of the overlay. The overlay
is decorative.

---

## 2. The data contract (most important part)

The whole point of the package is a stable point format that rules, an LLM, or a
pitch tracker can all produce. Lock this down first.

### 2.1 Pitch scale

- Pitch is a **float in `0..1`**. `0` = floor (bottom of letters), `1` =
  ceiling (letter tops). Fractional values are the norm (0.3, 0.55, 0.7).
- The scale is **font- and layout-independent**. The renderer maps `0..1` into
  real pixels using measured font metrics at draw time. Producers of points must
  never think in pixels.

### 2.2 Two points per word

Each word carries **two pitch values**: one at its **onset** (start) and one at
its **offset** (end). This lets the melody slope across a single word and lets
the renderer interpolate smoothly across the group.

```ts
interface Token {
  text: string;          // the word as displayed, e.g. "decide"
  pitch: [number, number]; // [onset, offset], each 0..1
  // punctuation that trails this word, if any: "," "." "?" "!" ";" ":" or ""
  trailing?: string;
}
```

### 2.3 Breath groups and pauses

A breath group is a run of tokens with **no real pause inside it**. Pauses are
derived from `trailing` punctuation:

- `,` `;` `:` → a **soft** pause → small gap, group ends.
- `.` `?` `!` → a **hard** pause → larger gap, group ends.
- no trailing punctuation → **no** pause; the group continues (this is the
  "decide between" case — no break).

The renderer groups tokens into breath groups by scanning `trailing`. Producers
of points do **not** decide grouping; they only fill `pitch` and `trailing`.
Grouping is one deterministic function so rules and external data behave
identically.

### 2.4 The public input shapes

`createMask` accepts either raw text or ready tokens:

```ts
type MaskInput =
  | { text: string; lang?: string }          // package tokenises + computes pitch by rules
  | { text: string; tokens: Token[] };        // caller supplies tokens (pitch from anywhere)
```

- With `{ text }` only → the package tokenises and calls the rules engine to
  fill `pitch`.
- With `{ tokens }` → the caller has already produced pitch (from an LLM, from a
  pitch tracker, or by hand). The renderer uses them as-is. `text` may still be
  passed for accessibility / fallback but `tokens` win.

This is the "use it either way" requirement: rules out of the box, or precise
external points when you want better accuracy.

---

## 3. The rules engine (default pitch producer)

A pure function, no DOM, no network:

```ts
function computeTokens(text: string, opts?: { lang?: string }): Token[]
```

It must be swappable per language; ship English (`"en"`) as the only
implementation for v1 but structure it so other languages plug in. It should:

1. **Tokenise** into words + trailing punctuation. Handle contractions
   (`can't`, `you're`), hyphenated words (`multi-token`), and numbers as single
   tokens. Keep it small and readable; a regex-based splitter is fine.
2. **Classify each sentence**: statement, wh-question (`how/what/why/where/
   when/who/which` + no final `?` lift), yes/no question, or list (contains a
   comma series).
3. **Assign pitch** using well-known English intonation heuristics — this is the
   "simplest honest method" from our discussion, an approximation, not truth:
   - Statement → gentle rise across the body, **fall to low** on the final
     stressed word.
   - Wh-question → same falling resolution at the end.
   - Yes/no question → **rising** final.
   - List items (between commas) → each item ends **high** (continuation rise);
     the final item **falls**.
   - Nuclear stress (the main pitch peak) tends to land on the **last content
     word** of the group.
   - Across a continuous group, chain values so a word's onset ≈ the previous
     word's offset (no visual step) — the reference file does this by carrying
     `prevEnd` forward. Reproduce that.
   - Function words (the, a, of, to, and…) sit slightly lower than adjacent
     content words.

Keep the numbers in a small, well-commented table so they are easy to tune. Add
a short doc comment stating plainly that this is a heuristic and that callers who
need accuracy should pass their own `tokens`.

---

## 4. The renderer (core, vanilla)

Port the drawing logic from `intonation-fill.html` into a framework-free module.

```ts
function createMask(container: HTMLElement, input: MaskInput, style?: Partial<MaskStyle>): MaskHandle

interface MaskHandle {
  update(input?: MaskInput): void;   // re-tokenise / re-draw
  setStyle(style: Partial<MaskStyle>): void;
  redraw(): void;                    // recompute geometry (call on layout change)
  destroy(): void;                   // remove nodes + listeners
}
```

Behaviour to preserve exactly from the reference:

- Render each token as an inline `<span>` (live text, `z-index` above the SVG),
  with normal word spacing, and gap spans between breath groups sized by pause
  strength.
- One absolutely-positioned `<svg>` overlay, `pointer-events: none`,
  `aria-hidden="true"`, `overflow: visible`, behind the text.
- Measure with `getBoundingClientRect`. Group spans into **runs** by
  (breath-group id) **and** visual line, so wrapped text draws correctly.
- For each run: compute `floor` and `capTop` from font metrics
  (`half-leading = (rectHeight - fontSizePx) / 2`), map each token's two pitch
  values into y via `floor - bandH * (floorLift + (1 - floorLift) * pitch)`, and
  build the top path with the **Catmull-Rom → cubic-bezier** smoothing already
  in the reference (`smoothTop`).
- **Anchor to floor**: if a run starts a breath group, its left edge y = floor;
  if it ends one, its right edge y = floor. Interior wrap edges keep pitch
  height (a wrapped group must not dip to the floor mid-breath).
- Draw three layers per run: fill (colour + `fillOpacity`), top edge line
  (colour + `topWidth`/`topOpacity`), baseline (colour + `bottomWidth`/
  `bottomOpacity`). Any layer with width 0 or opacity 0 is skipped.
- Recompute on `resize` and after `document.fonts.ready`. Debounce with
  `requestAnimationFrame`. Clean everything up in `destroy()`.

Guardrails: no DOM work at import time (SSR-safe — only touch the DOM inside
`createMask`/`redraw`). No external dependencies. Modern evergreen browsers only.

---

## 5. Style preset (separate from data)

Style is the thing the playground exports. Keep it a plain serialisable object,
totally separate from pitch data.

```ts
interface MaskStyle {
  color: string;         // one shared colour for fill + both lines (hex)
  fillOpacity: number;   // 0..1
  topWidth: number;      // px, 0 hides
  topOpacity: number;    // 0..1
  bottomWidth: number;   // px, 0 hides
  bottomOpacity: number; // 0..1
  floorLift: number;     // 0..1 minimum fill height so low pitch never hits zero
  softGap: number;       // px gap for comma/soft pause
  hardGap: number;       // px gap for sentence-end/hard pause
  smoothing: number;     // Catmull-Rom tension knob (default the reference value)
}
```

Provide a `defaultStyle` matching the reference's current look (shared warm
colour, soft translucent fill, thin top line, solid-ish baseline). `floorLift`
default ≈ `0.38` (the reference's current low-tone floor).

The single shared `color` with per-layer opacity is a firm decision from the
brief — do not add per-layer colours.

---

## 6. Playground page

A standalone page (built with the package from source) that lets a user dial in
a look and copy it as a preset.

- Live preview using the sample passage from the reference file (the Node.js /
  event-loop text) so behaviour matches what we've been testing.
- Controls for **every** `MaskStyle` field: colour picker (shared), and sliders
  for fill opacity, top width, top opacity, bottom width, bottom opacity,
  floorLift, soft gap, hard gap, smoothing. Show the live numeric value beside
  each slider. Include a "reset to defaults" button.
- A **"Copy preset"** action that outputs the current `MaskStyle` as a small,
  paste-ready object (both a JS/TS snippet and raw JSON). This is the whole
  point: tune here, paste into code.
- A textarea to swap in **your own text** and see rules-based pitch applied
  live, plus a toggle/second textarea to paste **external tokens JSON** (the
  `Token[]` contract) to preview AI/measured points. This demonstrates both
  paths in one screen.
- Keep the styling clean and calm; the reference's warm, minimal aesthetic is a
  good baseline. The playground styles are not part of the shipped library.

The playground exports **style only**. Pitch points are a separate flow and are
never frozen into the preset — make that separation obvious in the UI copy.

---

## 7. Package shape and tooling

- Package name: `prosody-mask` (adjust if taken on npm).
- Language: **TypeScript**, shipped as ESM + CJS with `.d.ts` types. Use
  **tsup** (or unbuild) for bundling; keep config minimal.
- Zero runtime dependencies.
- Suggested layout:

```
src/
  index.ts            // public exports
  types.ts            // Token, PitchPoint, MaskStyle, MaskInput, MaskHandle
  tokenise.ts         // text → raw word+punct tokens
  rules/
    index.ts          // computeTokens dispatcher by lang
    en.ts             // English heuristics + tunable pitch table
  grouping.ts         // tokens → breath groups (pause logic)
  smoothing.ts        // Catmull-Rom → bezier path builder
  renderer.ts         // createMask + geometry/measurement/draw
  style.ts            // defaultStyle
playground/
  index.html
  main.ts
tests/
  ...
README.md
```

- Public API from `index.ts`: `createMask`, `computeTokens`, `defaultStyle`,
  and all types.
- `package.json`: proper `exports`, `module`, `main`, `types`, `sideEffects:
  false`, `files`, an MIT licence, and scripts: `build`, `dev` (playground),
  `test`, `typecheck`.

---

## 8. Tests

Unit tests (vitest) for the pure logic — this is where the value is, and it runs
without a DOM:

- **Tokeniser**: contractions, hyphenates, numbers, trailing punctuation
  captured correctly.
- **Grouping**: "decide between" stays in one group; commas and periods split;
  soft vs hard pause classified right.
- **Rules**: statement falls at the end; yes/no question rises; list items rise
  then the last falls; onset≈previous offset continuity holds within a group;
  all pitch values stay within `0..1`.

DOM/render tests can be light (jsdom can't measure real layout) — assert node
structure, that layers are skipped at 0 width/opacity, and that `destroy()`
removes everything.

---

## 9. README

Cover: install; a 5-line quick start (rules path); the "bring your own points"
path with a `Token[]` example; the pitch contract (`0..1`, two per word)
explained clearly; the full `MaskStyle` table; a note that the built-in rules
are an English heuristic and how to plug better points (LLM or pitch tracker);
accessibility notes; and a link/pointer to the playground.

---

## 10. Acceptance criteria

1. `createMask(el, { text })` renders the reference look with zero config.
2. `createMask(el, { text, tokens })` uses supplied pitch verbatim.
3. Breaks appear only at commas/sentence ends; "decide between" is unbroken.
4. Fill stays within letter height; line spacing matches plain text.
5. Each breath group rises from the floor and returns to it at both ends.
6. `setStyle` and the playground sliders update live; "Copy preset" yields a
   valid `MaskStyle` that, pasted back, reproduces the look.
7. Pitch scale is `0..1` everywhere; no pixel values leak into the data layer.
8. No runtime deps; SSR-safe import; `destroy()` leaves no nodes or listeners.

---

## 11. Scope for v1 vs later

**v1 (this build):** vanilla core, English rules, grouping, renderer, style
preset, playground with preset export and both point paths, tests, README.

**Later (do not build now, but don't foreclose):** framework wrappers (React
first) as separate entry points over the same core; additional languages in
`rules/`; an audio/pitch-tracker adapter that emits the same `Token[]`; syllable
-level points as an optional finer contract. Design v1 so these slot in without
reworking the data contract.

---

## 12. Working method

Read `intonation-fill.html` fully before coding. Build the data contract and
pure functions first (with tests), then port the renderer, then the playground.
Keep commits small and logical. Where the reference and this brief agree, match
the reference's exact numbers as defaults. Where you must choose, prefer the
simplest robust option and leave a one-line comment explaining the choice.
