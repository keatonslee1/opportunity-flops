---
name: Opportunity FLOPs
description: Scientific monograph for inspectable AI R&D policy scenarios.
colors:
  paper: "oklch(96% 0.012 88)"
  plate: "#fbfcfb"
  midnight-ink: "#101b2b"
  muted-slate: "#556070"
  fine-rule: "#c8d0d4"
  strong-rule: "#86919a"
  oxidized-orange: "#c84e2f"
  accessible-orange-text: "#9f381f"
  orange-wash: "#f0d5ca"
  cobalt-trace: "#245b96"
  ready-green: "#2e7253"
typography:
  display:
    fontFamily: "Newsreader, Iowan Old Style, Charter, Georgia, serif"
    fontSize: "clamp(2.6rem, 5.2vw, 4.75rem)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Newsreader, Iowan Old Style, Charter, Georgia, serif"
    fontSize: "clamp(1.9rem, 3.2vw, 2.9rem)"
    fontWeight: 400
    lineHeight: 1.05
  title:
    fontFamily: "Newsreader, Iowan Old Style, Charter, Georgia, serif"
    fontSize: "1.3rem"
    fontWeight: 500
    lineHeight: 1.15
  math:
    fontFamily: "Newsreader, Times New Roman, Georgia, serif"
    fontStyle: "italic"
  body:
    fontFamily: "Barlow, Trebuchet MS, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Barlow, Trebuchet MS, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 600
    fontVariantCaps: "all-small-caps"
    letterSpacing: "0.09em"
  readout:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "0.7rem"
    fontVariantNumeric: "tabular-nums"
    letterSpacing: "0.055em"
    textTransform: "uppercase"
spacing:
  s1: "8px"
  s2: "12px"
  s3: "16px"
  s4: "24px"
  s5: "32px"
  s6: "48px"
  s7: "72px"
  s8: "96px"
  s9: "144px"
components:
  reset-button:
    backgroundColor: "transparent"
    textColor: "{colors.midnight-ink}"
    typography: "{typography.label}"
    border: "1px solid {colors.midnight-ink}"
    padding: "0 12px"
    height: "34px"
  scenario-selected:
    backgroundColor: "{colors.plate}"
    borderLeft: "2px solid {colors.midnight-ink}"
    padding: "8px 12px 8px 14px"
  control-rack:
    backgroundColor: "{colors.paper}"
    borderRight: "1px solid {colors.midnight-ink}"
    padding: "32px 24px"
  results-bay:
    backgroundColor: "{colors.plate}"
    padding: "28px clamp(24px, 3.4vw, 54px) 36px"
---

# Design System: Opportunity FLOPs

## Overview

**Creative North Star: "The Scientific Monograph"**

Opportunity FLOPs is a printed research paper you can operate. Ivory stock,
printer's ink, numbered figure plates, and caveats hung in the margin. The
composition should feel *read* as much as used — the calculator is the
instrument, and `/methodology` is the paper it belongs to.

Hierarchy comes from typography and rules. There are no drop shadows and no
cards: printed figures do not cast a shadow, and a page that leans on
elevation to separate its parts has not earned the separation typographically.

**Key Characteristics:**
- Serif display and mathematics against a humanist sans body — contrast on
  structure, not on two near-identical sans faces.
- A warm ivory ground with cool-white plate stock inset into it. The two
  surfaces must stay visibly distinct; the pre-redesign pair differed by about
  two percent lightness and read as washed out.
- Six numbered plates, captioned below in the printed convention.
- Controls that travel with the reader, because the results column is roughly
  three times their height.

## Colors

Cool instrument neutrals against a warm ground, with two functional trace
colors and a darker orange reserved for text.

### Primary
- **Oxidized Orange:** Policy-comparison strokes, figure numbers, active traces.
- **Accessible Orange Text:** Warnings, result text, and disclaimers where the
  brighter chart orange lacks text contrast.

### Secondary
- **Cobalt Trace:** Interactive controls, range fills, focus rings, and the
  second-firm trajectory.

### Neutral
- **Paper:** Warm ivory ground for the page and the control margin.
- **Plate:** Cool-white stock for the results bay and figure plates.
- **Midnight Ink:** Body text, structural rules, and the baseline trajectory.
- **Muted Slate:** Explanatory copy and secondary labels.
- **Fine Rule / Strong Rule:** Plot grid, dividers, and internal boundaries.

### Named Rules

**The Frozen Plate Rule.** `--ink`, `--panel`, `--rule`, `--rule-strong`,
`--orange`, `--orange-soft` and `--blue` are read directly by the chart rules.
They keep their exact legacy values so the six plots render unchanged.
Retuning any of them silently alters the plots. If a surface needs a new
value, add a token — do not edit these.

**The White Plate Rule.** Figure plates stay near-white. The frozen traces were
chosen against that ground; tinting it shifts their apparent contrast.

**The Trace/Text Separation Rule.** Oxidized orange draws comparison geometry;
accessible orange carries text. Do not swap their jobs.

**The Color Carries State Rule.** Accent color indicates scenario, status, or
direct manipulation; it is never ambient decoration.

## Typography

**Display / Math:** Newsreader, self-hosted as a variable woff2 in roman and
italic, weights 200–800.
**Body / UI:** Barlow, self-hosted in 400, 500, 600, 700.
**Readout:** UI monospace.

**Character:** Newsreader carries the thesis, section headings, figure titles
and all mathematics. Barlow carries body copy, controls and small-caps labels.

**Newsreader has no Greek.** β, γ, δ and α resolve through `--font-math`, whose
fallback deliberately leads with a Greek-capable serif. Do not point
`--font-math` at `--font-display`.

### Hierarchy
- **Display:** Newsreader for the first-view thesis.
- **Headline / Title:** Newsreader for section and figure headings.
- **Math:** Newsreader italic for variables and equations.
- **Body:** Barlow at a 24px baseline.
- **Label:** Barlow small-caps with open tracking for descriptive labels.
- **Readout:** Uppercase tabular monospace for values only.

### Named Rules

**The Readout Rule.** Monospace carries values and readouts. It does not carry
narrative, subtitles, or legends — monospace used as shorthand for "technical"
is the tell of a design that has not chosen a voice.

## Layout

A centered container capped at 1460px with 24px gutters. `base.css` provides a
`.sheet` grid — a 200px margin column beside the text column — which collapses
below 1020px, where hanging notes become inline asides rather than disappearing.

The calculator is one apparatus: a 350px control margin beside a flexible
results bay, narrowing to 300px at 1020px and stacking at 760px. Internal
rhythm uses the 8/12/16/24/32/48/72/96/144 scale.

## Elevation & Depth

**There is no elevation.** Depth comes from the ivory/white surface change and
from rule weight — hairline `--rule` for internal divisions, 1px `--ink` for
structural boundaries, 2px `--ink` for the masthead and colophon. The only
remaining `box-shadow` declarations are zero-blur hairlines used to draw crisp
rules, not to lift anything.

### Named Rules

**The One Instrument Rule.** The calculator is one apparatus. Do not turn its
margin, plates, or comparison cells into floating cards.

## Shapes

Rectilinear throughout. Controls are square-cornered; plot lines terminate
square; structure is expressed with 1px rules. Circular geometry is reserved
for the sweep marker.

## Components

### Buttons
- **Shape:** Square-cornered, 34px minimum height, small-caps label.
- **Reset / Copy link:** Ink rule at rest, inverting to ink-on-paper on hover.
- **Focus:** 3px solid cobalt outline at 2px offset.

### Scenario Selectors
- **Style:** Full-width rows; the active row takes a 2px left ink rule, a plate
  fill, and bolder label weight. State survives greyscale.

### Impact Sensitivity
- **Style:** Three cells; the active cell inverts to paper-on-ink.

### Range Controls
- **Style:** 3px cobalt progress track with a narrow rectangular thumb.
- **Behavior:** Value output is uppercase monospace; fill and all six plates
  update from the same input event.

### Figure Plates
- **Structure:** Live readout on a rule above the plot; caption below carrying
  figure number, title, then the plotted quantity.
- **Numbering:** Fig. 1–4 in oxidized orange small-caps.

### Control Margin
- **Behavior:** The margin keeps full-height ivory; an inner wrapper sticks to
  the viewport and scrolls independently when it exceeds the window. Disabled
  below 761px, where the layout stacks.

### Navigation
- **Style:** Small-caps links; the current page is underlined via
  `aria-current`. Hover and focus shift to orange. Navigation **wraps** at
  mobile widths — it must never be hidden.

### Trajectory Plots
- **Style:** Fine gray grid, dashed midnight baseline, oxidized-orange Firm A
  trace, cobalt Firm B trace, soft orange comparison area.
- **Motion:** Traces redraw over 720ms with a synchronized 760ms sweep on entry
  and discrete scenario changes. Continuous slider input updates paths
  immediately without replaying either. Disabled under reduced motion.

## Motion

One orchestrated page-load reveal in reading order — title, lead, status rule,
apparatus — using opacity and transform only, on `--ease-out`.

**The Containing Block Rule.** The apparatus fades but never translates. Any
transform value creates a containing block, identity matrices included, which
breaks the sticky control margin inside it.

## Do's and Don'ts

### Do:
- **Do** keep assumptions, plates, statuses, and caveats in one continuous
  analytical field.
- **Do** preserve the orange text/chart-stroke distinction and label Monte
  Carlo output as non-empirical.
- **Do** reach for a rule, a weight change, or a surface change before reaching
  for a shadow.
- **Do** respect reduced-motion preferences.

### Don't:
- **Don't** retune the frozen chart tokens or tint the figure plates.
- **Don't** add drop shadows or wrap sections in cards.
- **Don't** use monospace for narrative text.
- **Don't** use accent color as decoration or rely on color alone for state.
- **Don't** hide navigation or functionality at mobile widths.
- **Don't** introduce playful mascot, flip-flop, or character illustration.
- **Don't** present sensitivity output as an empirical estimate or forecast.
- **Don't** assert liveness the system does not have. The model is synchronous
  arithmetic; it is never "online".
