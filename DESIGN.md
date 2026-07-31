---
name: Opportunity FLOPs
description: Working Paper No. 01 — an operable offprint for inspectable AI R&D policy scenarios.
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
  verdigris: "#2e7253"
  verdigris-text: "#215940"
  ochre: "#a8791f"
  ochre-text: "#7a5610"
  fluoro-pink: "#ff48b0"
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
    fontFamily: "STIX Two Text, STIX Two Math, Times New Roman, Georgia, serif"
    fontStyle: "italic"
  body:
    fontFamily: "Fira Sans, Trebuchet MS, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontVariantNumeric: "oldstyle-nums proportional-nums"
  label:
    fontFamily: "Fira Sans, Trebuchet MS, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 600
    fontVariantCaps: "all-small-caps"
    fontVariantNumeric: "oldstyle-nums"
    letterSpacing: "0.09em"
  runninghead:
    fontFamily: "Fira Sans, Trebuchet MS, sans-serif"
    fontSize: "0.62rem"
    fontWeight: 500
    fontVariantCaps: "all-small-caps"
    letterSpacing: "0.16em"
  readout:
    fontFamily: "Fira Mono, ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "0.7rem"
    fontVariantNumeric: "tabular-nums lining-nums"
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
  button:
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
    backgroundColor: "transparent"
    borderRight: "1px solid {colors.midnight-ink}"
    padding: "32px 24px"
  plate:
    backgroundColor: "{colors.plate}"
    border: "1px solid {colors.fine-rule}"
    padding: "16px 16px 12px"
  marginalia:
    borderTop: "1px solid {colors.midnight-ink}"
    textColor: "{colors.muted-slate}"
    fontSize: "0.7rem"
  abstract:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "clamp(1.14rem, 1.7vw, 1.4rem)"
    lineHeight: 1.42
    maxWidth: "50ch"
---

# Design System: Opportunity FLOPs

## Overview

**Creative North Star: "Working Paper No. 01" — an operable offprint.**

Opportunity FLOPs is a research institute's working paper that the reader can
operate. Running head, folio line, section marks in the margin, numbered
figure plates, footnotes hung beside the text, old-style figures in prose —
except the figures are live and the controls are real.

The printing register is **risograph / two-colour offset**: warm stock, a
small set of saturated spot inks, visible overprint where they overlap,
halftone dot screens instead of smooth fills. That is a real process, which is
why it reads as made by a person, and it is the exact inverse of the
gradient-and-glow register the surrounding field defaults to.

Hierarchy comes from typography and rules. There are no drop shadows and no
cards: printed figures do not cast a shadow, and a page that leans on
elevation to separate its parts has not earned the separation typographically.

**Key characteristics:**
- A serif display and mathematics face against a humanist sans that carries a
  full typographic apparatus — real small caps, old-style figures, tabular
  lining figures, Greek.
- A warm ivory ground with cool-white plate stock inset into it, and a single
  fixed paper-grain layer over the ivory only.
- One asymmetric grid on both pages: a persistent 200px margin column beside
  the text column.
- Six numbered plates, captioned below in the printed convention.
- Controls that travel with the reader, because the results column is roughly
  three times their height.

## Colors

### The ink system

Six inks. Each carries exactly one meaning from the model, everywhere it
appears. Contrast ratios are measured against `--paper` (`#f5f1e9`).

| Ink | Value | Contrast | Job |
|---|---|---|---|
| Ink | `#101b2b` | 15.4:1 | Text, structural rules, the baseline trajectory |
| Oxidized Orange | `#c84e2f` | 4.1:1 | **Capability cost.** Firm A's trace, figure numbers |
| Cobalt | `#245b96` | 6.2:1 | **Coordination.** Firm B's trace, controls, focus, range fills |
| Verdigris | `#2e7253` | 5.1:1 | **Safety benefit.** The alignment channel |
| Ochre | `#a8791f` | 3.4:1 | **Uncertainty.** Assumption bands, hatching, sensitivity ranges |
| Fluoro Pink | `#ff48b0` | 2.7:1 | **Art only.** Masthead plate, section devices, colophon |

`--orange-text`, `--verdigris-text` and `--ochre-text` are the darker cuts used
when an ink has to carry small text; the mark colour and the text colour of an
ink cannot always be the same value and still clear WCAG 1.4.3.

**Why Fluorescent Pink and not Fluorescent Orange.** Both were rendered on the
ivory ground beside the frozen inks before choosing. Riso Fluorescent Orange
`#ff6c2f` sits a short step from oxidized orange `#c84e2f`; side by side they
read as two attempts at the same colour, and a reader could reasonably take a
fluoro mark for a capability-cost mark. That collision breaks the Semantic Ink
Rule. Fluorescent pink cannot be mistaken for any of the four data inks, it is
the braver call in a room of grey policy decks, and — usefully — at 2.7:1 it is
*incapable* of legibly carrying a value or bounding a control. The Loud Ink
Rule is therefore enforced by the token itself rather than by discipline.

### Named Rules

**The Frozen Plate Rule.** `--ink`, `--panel`, `--rule`, `--rule-strong`,
`--orange`, `--orange-soft` and `--blue` are read directly by the chart rules.
They keep their exact legacy values so the six plots render unchanged.
Retuning any of them silently alters the plots. If a surface needs a new
value, add a token — do not edit these.

**The White Plate Rule.** Figure plates stay near-white. No ink, screen,
grain, overprint or wash may sit on top of a plate. The frozen traces were
chosen against that ground; tinting it shifts their apparent contrast. This is
structural, not a convention: the grain is a single fixed layer behind all
content, and plates carry an opaque `--plate` background, so a plate cannot
pick it up.

**The Semantic Ink Rule.** Every ink carries one meaning from the model
everywhere it appears. Cost is always orange. Coordination is always cobalt.
Safety is always verdigris. Uncertainty is always ochre. A reader who learns
the mapping on the calculator must find it holding on the methodology page.
Colour is a legend, not a mood board. An ink used because a section looked
empty is a defect.

**The Loud Ink Rule.** Fluoro appears only in drawn imagery — the masthead
plate, section devices, the colophon. It never touches a data mark, a control,
or body text. High-energy ink in the art, sober ink in the figures.

**The Overprint Rule.** Where two inks overlap they multiply
(`mix-blend-mode: multiply` via `.overprint`), producing a genuine third
colour the way real spot inks do. Measured on this palette: fluoro over cobalt
gives `#241a68`, a deep violet; fluoro over oxidized orange gives `#c81620`;
the soft orange wash over cobalt gives `#224c77`. Two saturated *solids*
multiply to near-black — orange over cobalt is `#1c1c1c`, not the plum the
direction assumed — so overprint is applied to screens and light tints, which
is also how the real process behaves, the inks being semi-transparent. A third
colour picked in a colour picker is not earned. Never fake overprint with a
gradient.

**The Halftone Rule.** Tints are dot screens, never opacity fades and never
gradients. `.screen` with `.screen-10 / -25 / -45 / -70` masks a solid ink
through a 45° staggered dot grid on an 8px tile, coarse enough to read as a
printed screen at 100%. Because it is a mask and not an image, one drawing
serves every ink, and it applies to an HTML box and an SVG `<g>` alike.
`.hatch` is the same mechanism for ochre diagonal hatching.

**The Trace/Text Separation Rule.** Oxidized orange draws comparison geometry;
`--orange-text` carries text. Do not swap their jobs. The same split applies to
verdigris and ochre.

**The Color Carries State Rule.** Accent colour indicates scenario, status, or
direct manipulation; it is never ambient decoration. State is never signalled
by colour alone — every coloured state also carries a rule, a fill, a weight
change, or words.

## Typography

**Display:** Newsreader, self-hosted as a variable woff2 in roman and italic,
weights 200–800.
**Body / UI:** Fira Sans, self-hosted subsets at 400, 400 italic, 500, 700.
**Readout:** Fira Mono, self-hosted subsets at 400 and 500.
**Mathematics:** STIX Two Text (roman and italic) with STIX Two Math for the
operators, both self-hosted subsets.

All faces are OFL, self-hosted as `woff2` under `public/assets/fonts/` with
their licence text committed alongside. No CDN, no `@import`, no build step.
Subsetting to Latin + Latin-Ext-lite + Greek + the punctuation and maths
relations the copy actually sets was done once by hand; the resulting files are
committed.

### Why the body face changed

Barlow was the weak link — a competent humanist sans with no point of view. But
the reason it had to go is not stylistic, it is mechanical: the apparatus this
paper needs is machinery, and Barlow does not have it. Three routes were
evaluated by inspecting the actual font binaries and rendering a specimen at
production sizes, not by reading descriptions.

- **Route 1 — Institutional (Newsreader + Switzer + Commit/Martian Mono).**
  Right structure. Switzer carries no `smcp`, so the entire small-caps label
  system would be browser-synthesised or faked with `text-transform`.
- **Route 2 — Characterful (Newsreader + Karrik + Departure Mono).** The
  recommended route, conditional on Karrik holding up in small-caps labels at
  0.7rem. It does not, and the failure is not marginal. Karrik ships **one
  weight**, so every `<strong>`, active control and emphasised label loses its
  weight step; it has **no `smcp`/`c2sc`**, so there are no drawn small caps;
  **no `onum`**, so old-style figures in prose are impossible; and **no Greek
  at all**, so β, γ, δ and λ fall back to a different face mid-line in the
  parameter labels. Four independent failures against § 3.1 of the brief.
- **Route 3 — Monoline archive (Newsreader + Public Sans + Departure Mono).**
  Thematically apt — Public Sans is a real government face. It also has no
  `smcp` and no Greek; rendered beside the others, its running head simply
  fails to become small caps at all.

**Chosen: Route 1 in structure — serif display, humanist sans body, mono
readout — with the body and readout faces substituted for Fira Sans and Fira
Mono, which actually carry the apparatus.** Verified present in every shipped
cut: `smcp` + `c2sc` (drawn small caps), `onum` (old-style figures for prose),
`lnum` + `tnum` (tabular lining figures for readouts), and full Greek
lowercase. Fira Sans and Fira Mono are a designed superfamily, so the label
column and the readout column are related rather than merely adjacent, and
Fira was engineered for legibility at small sizes — which is what a 350px
control margin full of 0.7rem labels actually needs. `font-synthesis: none`
stays honest: nothing on this page is a synthesised bold, italic or small cap.

### Hierarchy

- **Running head:** Fira Sans small caps at 0.62rem, tracked 0.16em, above a
  hairline rule at the top of every page.
- **Display:** Newsreader for the first-view thesis.
- **Headline / Title:** Newsreader for section and figure headings.
- **Math:** Newsreader italic for variables and equations.
- **Body:** Fira Sans at a 24px baseline, old-style proportional figures.
- **Label:** Fira Sans small caps, tracked 0.09em, old-style figures.
- **Readout:** Uppercase Fira Mono, tabular lining figures, values only.
- **Folio:** Fira Sans small caps at 0.62rem at the foot of the sheet.

### Named Rules

**The Readout Rule.** Monospace carries values and readouts. It does not carry
narrative, subtitles, or legends — monospace used as shorthand for "technical"
is the tell of a design that has not chosen a voice.

**The Figure Style Rule.** Old-style figures in prose, tabular lining figures
in readouts, tables and any column of values. Small caps take old-style
figures too: lining figures beside small caps stand a head taller and break the
line. This is set once in `base.css` by selector, not sprinkled per component.

**The Real Character Rule.** `–` en dashes in ranges, `—` em dashes unspaced,
`×` for multiplication, `≈ ≤ ≥ ±`, proper `“ ” ‘ ’`, `§` for sections. No
hyphen standing in for a dash, no `x` standing in for `×`. Fira ships no `′ ″`
primes and no `▸`; the copy does not need primes, and UI marks are drawn rather
than borrowed from a glyph the face does not have.

**Mathematics does not set in the display face.** Newsreader ships no Greek and
no mathematical operators, so pointing `--font-math` at it meant every β, γ, δ,
λ and ∈ resolved through the *fallback* — a second serif mid-equation, and a
different one on every reader's machine. `Ṡ`, `∈` and `∼` reached no shipped
face at all. `--font-math` is therefore STIX Two, which is built for this:
STIX Two Text carries the alphabet, Greek and accented Latin; STIX Two Math
carries the operators and is subset to `U+2190–22FF` with a matching
`unicode-range`, so a page with no operators never fetches it. Display and
mathematics being different faces is the scientific-publishing norm, not a
compromise. Body-set Greek in the parameter labels resolves natively in Fira
Sans. Verified by resolving each glyph against a deliberately different
fallback: nothing mathematical falls through to a system font.

**Do not restore `--ready`.** It was an alias for verdigris, and status stamps
read it — which made verdigris mean "safety benefit" in the figures and
"implemented" in the margins. Build status is `--ink`; a caveat stamp is
`--ochre-text`, because that one is genuinely marking uncertainty.

**Optical margin discipline.** The text measure is 62–72 characters. Never
wider — `--measure` is **56ch** and `--measure-tight` **50ch**, not 68 and 62.
A `ch` is the advance width of `0`, and the digits in every face here are
appreciably wider than the average lowercase letter, so `68ch` of Fira Sans
prose renders about 83 characters. The ratio is roughly 1.23 characters per
`ch` for Fira Sans and differs per face, which is why the display-serif
surfaces carry their own caps rather than sharing one token. Measured on the
built page against a reference string set in each element's own computed font,
not assumed from the token.

## Layout

One grid, used identically on both pages. A centered container capped at
1460px with 24px gutters, and a `.sheet` grid inside it: a persistent **200px
margin column** beside the text column, 48px apart. The margin column carries
section marks, figure numbers, footnotes and status. It collapses below 1020px,
where hanging notes become inline asides rather than disappearing. Asymmetry is
the point; a centered single column is the default everyone else ships.

The calculator is one apparatus: a 350px control margin beside a flexible plate
bay, narrowing to 300px at 1020px and stacking at 760px. Internal rhythm uses
the 8/12/16/24/32/48/72/96/144 scale. Nothing off-scale.

### Page shell

Every page carries, in order: running head over a hairline rule → masthead over
a 2px ink rule → `<main>` → folio line → colophon over a 2px ink rule.
Registration marks print at the four corners of `<main>`, in the trim margin
outside the type area, and are removed below 1020px where there is no margin
left to print them in.

## Print artifacts

- **Paper grain.** One `feTurbulence` tile, alpha baked into the SVG, applied
  once to the **root** and fixed to the viewport. Not repeated per section. It
  sits behind all content, so opaque plate surfaces exclude it automatically.
  It is on the root and not on `<body>` for a reason: a stacking context paints
  its own background, then its negative-`z-index` descendants, then the
  backgrounds of its in-flow block descendants — so a grain on `<body>` painted
  straight over the registration marks and they vanished on both pages.
- **Registration marks.** A rotationally symmetric press target, hairline,
  `aria-hidden`, 12px at a 6px inset, `z-index: -1` so it sits behind all
  content and can never land on a plate. Removed below 1020px, where there is
  no trim margin to print them in. If they read as decoration, they are too
  big — at 16px the top-left mark touched the first letter of the running head,
  which is a mark in the type area rather than in the margin.
- **Rules do the structural work.** Hairline `--rule` for internal division,
  1px `--ink` for structural boundary, 2px `--ink` for masthead and colophon.

## Imagery

Every image on the site is **drawn** — inline SVG built from the ink system and
keyed to the ivory ground. Reference register: Otto Neurath's Isotype,
mid-century scientific atlases, ordnance survey plates, printer's devices.

- **The masthead plate** (calculator, first viewport): an Isotype-style array
  of unit marks standing for frontier R&D compute. The share reallocated to
  alignment flips from oxidized orange to verdigris, mark by mark, as the
  reader drags the policy slider. The flip is also a fill-pattern change, so it
  survives greyscale. Decorative parts are `aria-hidden`; the live count has an
  `aria-live="polite"` text equivalent.
- **Section devices** (methodology): one bespoke diagram per section carrying
  the causal chain — compute → software progress → frontier capability → risk.
  Hairline construction plus one spot ink each.
- **The colophon device**: a printer's mark, in fluoro, small.

**Never:** stock photography, 3D renders, glowing orbs, abstract "AI"
node-graph illustrations, or generated imagery of any kind. These are the
single fastest tell.

## Elevation & Depth

**There is no elevation.** Depth comes from the ivory/white surface change and
from rule weight. The only remaining `box-shadow` declarations are zero-blur
hairlines used to draw crisp rules, not to lift anything.

### Named Rules

**The One Instrument Rule.** The calculator is one apparatus. Do not turn its
margin, plates, or comparison cells into floating cards.

## Shapes

Rectilinear throughout. Controls are square-cornered; plot lines terminate
square; structure is expressed with 1px rules. Circular geometry is reserved
for the sweep marker and for halftone dots.

## Components

### Buttons
- **Shape:** Square-cornered, 34px minimum height, small-caps label.
- **Reset / Copy link:** Ink rule at rest, inverting to paper-on-ink on hover.
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
- **Structure:** Cool-white stock inset into the ivory page. Live readout on a
  rule above the plot; caption below carrying figure number, title, then the
  plotted quantity.
- **Numbering:** `Fig. 1`–`Fig. 6` in oxidized-orange small caps — orange
  because orange means capability cost, and the figures are the cost
  accounting.

### Footnote apparatus
- **Marker:** `.fn-ref` superscript in prose, in `--orange-text`.
- **Note:** `.note` hung in the margin column at ≥1020px, becoming an inline
  aside below that. Never dropped.

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
- **Motion:** Traces draw left-to-right over 720ms behind a leading tick, like
  a pen plotter, on entry and on discrete scenario changes. Continuous slider
  input updates paths immediately without replaying the draw.

## Motion

One orchestrated page-load reveal in reading order — running head, title,
abstract, status rule, then the apparatus — using opacity and transform only,
on `--ease-out`.

**The Signature Moment.** Hovering or keyboard-focusing any plate raises a
vertical rule at that year across **all six** plates simultaneously, with each
plate's value for that year on its own readout line in tabular monospace. Arrow
keys move the year rule. This is what makes the page read as an instrument
rather than a page with charts on it.

**The Containing Block Rule.** The apparatus fades but never translates. Any
transform value creates a containing block, identity matrices included, which
breaks the sticky control margin inside it.

All motion is gated behind `@media (prefers-reduced-motion: reduce)`, and the
gate zeroes delays as well as durations — a stagger with `animation-fill-mode:
both` and its delay intact leaves elements invisible for the length of the
delay.

## Do's and Don'ts

### Do:
- **Do** keep assumptions, plates, statuses, and caveats in one continuous
  analytical field.
- **Do** give every ink one meaning and hold it on both pages.
- **Do** set tints as dot screens and overlaps as real multiply overprint.
- **Do** preserve the mark/text ink distinction and label Monte Carlo output as
  non-empirical.
- **Do** reach for a rule, a weight change, or a surface change before reaching
  for a shadow.
- **Do** respect reduced-motion preferences.

### Don't:
- **Don't** retune the frozen chart tokens or tint the figure plates.
- **Don't** put fluoro on a data mark, a control, or body text.
- **Don't** add drop shadows, rounded corners, gradients, or wrap sections in
  cards.
- **Don't** ship stat-tile rows, KPI chips, or a 2/3/4-up grid of bordered
  boxes.
- **Don't** use monospace for narrative text.
- **Don't** use accent color as decoration or rely on color alone for state.
- **Don't** hide navigation or functionality at mobile widths.
- **Don't** introduce playful mascot, flip-flop, or character illustration.
- **Don't** use stock photography, renders, or generated imagery. Everything is
  drawn.
- **Don't** present sensitivity output as an empirical estimate or forecast.
- **Don't** assert liveness the system does not have. The model is synchronous
  arithmetic; it is never "online".
