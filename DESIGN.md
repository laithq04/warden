# Warden — Design Foundations

## Point of view

**Nocturnal. Calibrated. Terse. Escalatory.**

Warden is a defensive SOC console — the thing an analyst stares at for an eight-hour shift in
a dim room. Every token below is derived from these four adjectives:

- **Nocturnal** — the surface is a deep blue-black, never pure `#000`, never bright. Light is
  rationed: if something glows, it is information. There is no light theme in phase 0 and the
  dark palette is designed as a primary, not an inversion.
- **Calibrated** — the console reads like an instrument. Hairline rules, a strict 4px spacing
  grid, tabular mono numerals, exact named durations. Nothing is approximately sized.
- **Terse** — mono caps micro-labels, dense data sizes, squared corners, no ornamental copy.
  Controls are commands ("Isolate host"), not sentences.
- **Escalatory** — visual and kinetic energy is budgeted by severity. Info barely registers;
  critical earns saturation, glow, flash, and pulse. Nothing else in the UI is allowed to
  compete with that budget — the accent is used for focus and primary action only, and
  severity is the only taxonomy that gets color.

Signature element: the **severity spine and phosphor decay**. Every alert-bearing row or card
carries a 2px severity-colored spine on its left edge, and high/critical events arrive with a
severity-tinted flash that cools off over 1.2s — a trace fading on a phosphor screen.

## Where tokens live

- `packages/client/src/index.css` — the single source of truth, as CSS custom properties in a
  Tailwind v4 `@theme` block (no `tailwind.config.js`).
- `packages/client/src/design-system/tokens.ts` — typed mirror for values components need
  programmatically (motion durations/easings for `motion` props, severity metadata, hexes for
  runtime contrast math).
- `/foundations` route — the living spec. If it isn't on that page, it isn't in the system.

## Color

### Surfaces (background layers)

| Token     | Value     | Role                                    |
| --------- | --------- | --------------------------------------- |
| `void`    | `#0A0E13` | Base layer — the room the console sits in |
| `panel`   | `#11161D` | Raised — cards, feeds, tables            |
| `shelf`   | `#171E27` | Overlay — menus, popovers, dialogs       |

Three steps, each roughly one perceptual notch apart, all with a cold blue cast (hue ~210).
Depth is communicated by surface + hairline border, not drop shadows.

### Ink (text)

| Token          | Value     | vs void | vs shelf | Role                          |
| -------------- | --------- | ------- | -------- | ----------------------------- |
| `ink`          | `#E8F0F2` | 16.75:1 | 14.53:1  | Primary text and data values  |
| `ink-secondary`| `#A9BAC3` | 9.68:1  | 8.39:1   | Prose, quieter values         |
| `ink-muted`    | `#76909C` | 5.75:1  | 4.99:1   | Labels, timestamps, metadata  |
| `ink-disabled` | `#4A5A64` | 2.71:1  | —        | Disabled controls only, never information (WCAG-exempt) |

All information-bearing ink levels clear WCAG 2.1 AA (4.5:1) on **every** surface layer;
`ink` and `ink-secondary` clear AAA. Ratios verified with WCAG relative-luminance math (script
below), and recomputed live on `/foundations`.

### Lines

`line` `#1E2833` (hairlines at rest) · `line-strong` `#2C3947` (control borders, hover).
Borders are always 1px. Context borders (focus, error, severity edges) reuse the accent or
severity hues, usually via `color-mix` at 35–45% so the edge reads as tinted, not neon.

### Accent

`trace` `#8FE6D0` (13.27:1 vs void) · `trace-dim` `#4FBFA9` (8.62:1 vs void).
A pale phosphor teal — the color of a quiet oscilloscope trace. Used for focus rings, the one
primary action per view, selection, and live markers. Never decoration, never severity.
`void` text on a `trace` fill is 13.27:1, so the filled primary button is AAA.

### Severity scale (the most important system in the app)

| Level    | Base      | Bright    | vs void | Meaning                          |
| -------- | --------- | --------- | ------- | -------------------------------- |
| info     | `#7FA8D6` | `#A9C8E8` | 7.81:1  | Context. Recorded, not raised.   |
| low      | `#57C08A` | `#8CDCB2` | 8.58:1  | Worth a look when queue is quiet |
| medium   | `#E0B33F` | `#EFCC72` | 9.85:1  | Triage this shift                |
| high     | `#F28749` | `#FFAB7D` | 7.68:1  | Triage now                       |
| critical | `#FF5C64` | `#FF959B` | 6.42:1  | Drop everything                  |

- Hues are spaced (cool slate-blue → green → amber → orange → red) so the scale scans
  peripherally; saturation and temperature both rise with severity, so ordering survives
  squinting.
- **Base** is for text, spines, borders, glows. **Bright** is for text on tinted badge fields
  (a 15% base-over-panel mix), verified 7.16–8.80:1 on those fields.
- Severity color never appears without a text label (CVD safety), and critical adds a pulsing
  dot — a non-color, non-hue second channel.
- All base values clear 4.5:1 on all three surfaces (worst case: critical on shelf, 5.57:1).

Verification: `node` script using WCAG relative luminance
(`(L1 + 0.05) / (L2 + 0.05)` over linearized sRGB) — mirrored in
`design-system/tokens.ts#contrastRatio` and rendered live on `/foundations`.

## Typography

- **Chivo Mono** (variable, self-hosted via `@fontsource-variable/chivo-mono`) — identity,
  headings, all data, labels, timestamps, buttons. A grotesque mono with character that
  doesn't read as a code editor default.
- **Atkinson Hyperlegible Next** (variable, `@fontsource-variable/atkinson-hyperlegible-next`)
  — prose. Designed by the Braille Institute for character disambiguation (O/0, l/1/I),
  which is a genuine operational property at hour eight of a shift.

Scale (px / line-height):

| Step       | Face          | Size | LH   | Weight | Tracking | Use                    |
| ---------- | ------------- | ---- | ---- | ------ | -------- | ---------------------- |
| `mast`     | Chivo Mono    | 44   | 1.05 | 600    | -0.02em  | Wordmark moments       |
| `display`  | Chivo Mono    | 33   | 1.15 | 500    | -0.01em  | Big numbers            |
| `headline` | Atkinson Next | 25   | 1.25 | 650    | —        | Page headings          |
| `title`    | Atkinson Next | 19   | 1.35 | 600    | —        | Card/alert titles      |
| `body-lg`  | Atkinson Next | 16   | 1.6  | 400    | —        | Lead prose             |
| `body`     | Atkinson Next | 14   | 1.6  | 400    | —        | Default prose          |
| `data`     | Chivo Mono    | 13   | 1.55 | 400    | —        | Event data, values     |
| `caption`  | Chivo Mono    | 12   | 1.5  | 400    | —        | Timestamps, metadata   |
| `micro`    | Chivo Mono    | 11   | 1.45 | 500    | +0.08em caps | Structural labels  |

The scale is data-dense at the bottom (11–14, 1px steps where analysts live) and opens up
fast at the top (~1.3 ratio) so headings are rare and loud.

## Spacing

Base unit **4px** (`--spacing: 0.25rem`); everything sits on multiples (4/8/12/16/20/24/32/
40/48/64/80). Density is a feature: rows are 40–44px tall, cards pad at 16–20px.

## Radii

| Token   | Value  | Use                                   |
| ------- | ------ | ------------------------------------- |
| `tick`  | 2px    | Badges, tags, swatch chips — stamps   |
| `ctrl`  | 4px    | Buttons, inputs, menu surfaces        |
| `card`  | 6px    | Cards, panels, feed containers        |
| `full`  | 9999px | Status dots only                      |

Deliberately squared. Pills are not lozenges here; they are ledger stamps.

## Elevation

No heavy drop shadows. Elevation = **surface step + 1px hairline + a whisper of inner light**
at the top edge (`--shadow-raise`), plus a deep, tight ambient (`32px blur, -20px spread`) so
panels sit *in* the dark rather than floating over it. **Glow is semantic**: it appears only
on focus (trace), hover of armed/destructive controls, and severity edges — never as
decoration.

## Borders

1px everywhere. Rest: `line`. Interactive rest: `line-strong`. Hover: warms toward context
(trace for neutral controls, severity hue for alert surfaces via 35–45% `color-mix`).
Focus: 1px solid `trace` outline at 2px offset — a consistent ring on every focusable
element, replacing (never merely removing) the browser default. Error: `sev-critical`.

## Motion

Durations: `instant` 80ms · `fast` 140ms · `base` 220ms · `slow` 400ms · `decay` 1200ms.

Easings (with intent):

- `snap` — `cubic-bezier(0.3, 0, 0, 1)` — state changes. Decisive, zero bounce.
- `settle` — `cubic-bezier(0.22, 1, 0.36, 1)` — entrances. Arrives fast, lands soft.
- `decay` — `cubic-bezier(0.05, 0.7, 0.1, 1)` — glow fade. Burns bright, cools long.

Choreography rules:

1. **Motion energy is budgeted by severity.** Info/low rows arrive with a plain 220ms
   `settle` unfold. High/critical rows add the phosphor flash: a severity-tinted background
   that decays to transparent over 1200ms on `decay`. Critical badges pulse (box-shadow ring,
   2.4s period, two-beat attack/release). Nothing routine is allowed to pulse.
2. **Lists stagger at 40ms per item, capped at 6** — enough to read as a sweep, never a
   parade.
3. **New live-feed rows enter from the top by unfolding height** (no slide-in from the side —
   the feed is a ledger, new lines are written, not delivered).
4. **Hover is instant-adjacent** (80–140ms, `snap`); it should feel like touching an
   instrument, not starting an animation.
5. **`prefers-reduced-motion`**: a global CSS clamp kills CSS transitions/animations, and
   every `motion` component checks `useReducedMotion()` and degrades to instant opacity — the
   flash, pulse, lift, and unfold all disappear; information order is unchanged.

## Accessibility commitments (phase 0)

- WCAG 2.1 AA verified by computation for every ink level, accent, and severity hue against
  every surface it appears on (numbers above; live on `/foundations`).
- Visible focus on everything: global `:focus-visible` trace ring, 2px offset.
- Severity is never color-alone: label always present, critical adds pulse.
- Full keyboard navigation on `/foundations` (buttons, inputs, Radix Select, alert cards,
  feed hold are all real focusable controls).
- `prefers-reduced-motion` honored globally (CSS clamp + `useReducedMotion` in components).
