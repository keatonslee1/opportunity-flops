# PUNCHLIST — Worker B

Owner: **B**. A reads `## For A` and works from it; A does not edit this file. Anything B
needs from a file B does not own is filed here, never edited directly.

The full adversarial audit (Task 4) lands here once A reports Phase 1 done. Everything
below came out of Tasks 1 and 3.

---

## For A

Ranked most-severe first.

### A1 — Publish the `PHASE 0 DONE` block (blocking)

B cannot write `methodology.css` until `HANDOFF.md` names: the font faces and their axes,
the ink tokens (`--verdigris`, `--ochre`, `--fluoro` and the chosen fluoro hex), the
halftone screen's SVG `id` and the class that applies it, and the overprint
(`mix-blend-mode: multiply`) primitive's class name. B builds the section devices and the
colophon device out of exactly those and will not define a parallel set.

### A2 — `--measure: 68ch` renders as 83 characters, on both pages (blocking the acceptance bar)

`base.css` sets `--measure: 68ch` under the comment "62–72 characters. Never wider." A `ch`
is the advance width of `0`, and in both Fira Sans and Newsreader the digits are noticeably
wider than the average lowercase letter. Measured on the built page — a 72-character
reference string set in each element's own computed font, compared against that element's
content box:

| Surface | Was | Cap |
|---|---|---|
| Body prose | **83** | 72 |
| Abstract | **84** | 72 |
| Limitations standfirst | **90** | 72 |
| Plate caption | **89** | 72 |
| Byline | **100** | 72 |

Brief §3.1 calls the cap hard and Studio Test item 3 checks it, so as it stands **both pages
fail on measure**. Solved values: `--measure: 56ch` lands body prose at 68 characters and
`--measure-tight: 50ch` lands the display-serif abstract at 68. Display italic at lead size
needs about `42ch` for the same line — the ratio is per-face, so a single token cannot serve
every surface and the tighter surfaces need their own caps.

B has scoped the corrected values to `.paper` so the methodology page is correct now, and
left a comment saying to delete that block once the token is retuned. **The calculator has
the identical defect** — please fix `--measure` upstream and B will drop the override.

Two cascade traps that come with it, both of which bit B: a bare `.byline` (0,1,0) loses to
`.paper p` (0,1,1), so a per-surface cap silently does nothing unless its specificity beats
the generic prose rule; and `.plate figcaption` needs its cap set on the caption's *text*
column, not the whole grid, or the hanging index inflates the measured line.

### A3 — `.section-mark` stays stacked below 1020px

`base.css`'s collapse rule re-declares `display: flex` on `.section-mark` but never clears
the `flex-direction: column` set at full width. Below 1020px the mark and its status stamp
stay stacked, and the stamp lands hard against the heading with no space between them —
visible at 360px, where `§ 4` / `IMPLEMENTED` / `AI risk` come out as three cramped lines.
B has restated `flex-direction: row` in `methodology.css`; the calculator's section marks
collapse through the same rule and need the same fix at source.

### A4 — Verdigris is carrying "Implemented", which is not a model quantity

`--ready: var(--verdigris)` survives as an alias, and the status stamps were reading it. The
Semantic Ink Rule gives verdigris one job — SAFETY BENEFIT. "Implemented" is a fact about
the build, not a quantity in the model, so colouring it verdigris makes the ink mean two
things and weakens the mapping the reader is supposed to learn from the calculator.

B's stamps are now `--ink`, with the single caveat stamp in `--ochre-text` because that one
really is marking uncertainty. Status stays legible from the words either way, so nothing is
carried by colour alone. **Check anywhere `--ready` is still read on the calculator.**

### A5 — Four characters resolve to a system fallback, five more fall out of `--font-math`

**This is the highest-value thing on the list and it is cheapest to fix while you are still
choosing fonts.**

Method: decompressed every shipped `woff2`, walked the table directory, and read the `cmap`
and `GSUB` directly. Controls verified (`A a 1 .` present in the Latin subsets, absent from
`Newsreader-latin-ext`, which is the expected disjoint-subset behaviour). This is measured,
not assumed.

| Char | Codepoint | Newsreader | Fira Sans | Fira Mono | Where B uses it |
|---|---|---|---|---|---|
| `Ṡ` | U+1E60 | **no** | **no** | **no** | equations (2.1), (2.2) — the derivative notation |
| `∈` | U+2208 | **no** | **no** | **no** | equation (3.1), § 6 prose |
| `∼` | U+223C | **no** | **no** | **no** | § 4, `λ ∼ Triangular(…)` |
| `→` | U+2192 | **no** | yes | yes | Table 1, equation (6.1) |
| `≤` | U+2264 | **no** | yes | yes | § 1, the bound on `x` |
| `α β γ δ λ` | U+03B1–3BB | **no** | yes | yes | every equation, Table 2, throughout |

Two separate problems:

1. **`Ṡ`, `∈` and `∼` are in no shipped face at all.** They render from whatever serif the
   OS supplies — a different face, mid-equation, in the most prominent mathematics on the
   page. On a judge's machine that is a visible tell.
2. **Newsreader has no Greek and no math operators**, and `--font-math` leads with
   Newsreader. So every `β`, `γ`, `δ`, `λ`, `α`, `≤` and `→` in the paper is *already*
   falling back today.

`Newsreader-latin-ext` also declares `unicode-range: … U+1E00-1E9F …` while covering **7 of
those 160 codepoints**. That range hint makes the browser select and download that face for
`Ṡ`, fail to find the glyph, and fall through anyway — a wasted request on top of the wrong
face.

Options, in B's order of preference:

- **(a)** Ship a Newsreader subset that actually covers Greek + `U+2190–22FF` + `U+1E60`.
  Fixes it everywhere at once and keeps one serif.
- **(b)** Point `--font-math` at a serif with real math coverage and leave `--font-display`
  as Newsreader. Two serifs is a legitimate choice — mathematics is usually set in a
  different face from display anyway.
- **(c)** B restates `Ṡ` as `dS/dt` and `∼` as "drawn from", which removes two of the three
  orphans and costs nothing but fidelity to the source's notation. **B will do this on
  request but will not do it unilaterally** — changing a paper's notation to work around a
  font gap is the wrong reason to change a paper's notation.

**Re-verified after your Phase 0 subsetting, by a second and independent method.** Your
block says the subsets cover "the maths relations the copy actually sets" and that keeping
Greek in `<i>` "still resolves through the Greek-capable serif fallback… both paths are
safe". Measured in the built page by comparing rendered glyph widths against a deliberately
different fallback — a family that supplies a glyph produces a different width than one that
does not — with `S` as a positive control:

| Glyph | Newsreader supplies it | Fira Sans supplies it |
|---|---|---|
| `S` (control) | **yes** | yes |
| `β` `λ` `α` `γ` `δ` | **no** | yes |
| `≤` `→` | **no** | yes |
| `Ṡ` `∈` `∼` | **no** | **no** |

This agrees exactly with the `cmap` parse. So: `--font-math` leads with Newsreader, which
supplies **none** of the Greek and **none** of the relations, which means every Greek letter
in every equation is currently set in Times New Roman beside Newsreader Latin — a second
serif, mid-equation, in the most prominent mathematics on the page. That is a rendering
fallback working correctly, not a typographic result. And `Ṡ`, `∈` and `∼` reach no shipped
face at all, so they land on whatever the OS supplies, which differs per machine.

Body-set Greek in Fira Sans is genuinely fixed, and that part of your block is right. The
open half is `--font-math`. Options (a), (b) and (c) above still stand.

Tell B which, and B will sweep the document to match.

### A6 — Fira Sans and Fira Mono are a good route — confirmed, not assumed

Same method. Recording it so the decision is documented rather than folk knowledge:

| Face | `smcp` | `c2sc` | `onum` | `lnum` | `tnum` | Greek |
|---|---|---|---|---|---|---|
| Fira Sans (all 4 weights) | yes | yes | **yes** | yes | yes | **yes** |
| Fira Mono (both weights) | — | — | yes | — | yes | yes |
| Newsreader (4 subsets) | no | no | **no** | no | yes | **no** |

This **closes the two items B raised at Task 1**: the outgoing Barlow had `smcp`/`c2sc` but
no `onum`, and Fira Sans has all three plus Greek. Brief §3.1's old-style-figures-in-prose
requirement is satisfiable with the faces you have installed. Note Newsreader has **no
`onum`** — so if prose is set in the display serif anywhere, its numerals will be lining.

### A7 — `.plate figcaption` is a two-child contract, and it broke on contact

Your new `base.css` rule:

```css
.plate figcaption { display: grid; grid-template-columns: auto minmax(0, 1fr); }
```

Every inline element in the caption auto-places onto its own grid row. B's captions carry a
cross-reference link, an `<i>λ</i>` and a footnote marker, so Table 3's caption rendered as
three separate rows reading "Table 3 | …", "λ | …", "§ 4 | .".

B has fixed it on the methodology side by wrapping each caption body in a single
`<span class="caption-text">`, so the grid gets exactly the two children it wants. **The six
calculator plates need the same discipline** — any caption with an inline link or symbol in
it will break the same way. Either keep the two-child contract and enforce it in the markup,
or make the rule robust (hanging indent via `text-indent`, or `.caption-index { float: left }`).

### A8 — Shared chrome B has marked up but cannot style

`methodology.html` carries the apparatus markup below. It is inert until `base.css` styles
it, and it must appear on the calculator page too or the two pages stop being one
publication. **A owns both the CSS and `index.html`.**

```html
<p class="running-head" aria-hidden="true">
  <span>Opportunity FLOPs</span><span>Working Paper 01</span>
  <span>Reallocation of capability compute</span><span>July 2026</span>
</p>

<div class="reg-marks" aria-hidden="true">
  <span class="reg-mark reg-mark-tl"></span><span class="reg-mark reg-mark-tr"></span>
  <span class="reg-mark reg-mark-bl"></span><span class="reg-mark reg-mark-br"></span>
</div>

<p class="folio" aria-hidden="true">
  <span class="folio-mark">§ 4</span>
  <span class="folio-title">AI risk</span>
  <span class="folio-no numeric">4/10</span>
</p>
```

B sets a folio at the foot of every section — a scrolling document's section is the
analogue of a printed page, and it is already the best-looking thing on the printed sheet.
If these are not the class names you want, say so and B will rename; B needs one vocabulary,
not two.

### A9 — Keep the `.marginalia` hanging primitive through the `base.css` rebuild

Nine footnotes hang in the margin column with reciprocal back-references, riding on
`.sheet` + `.marginalia` (`grid-column: 1`, inline aside below 1020px). If the rebuild
renames or drops it, name the replacement. Brief §3.1: notes are *never* dropped.

### A10 — Paper grain layer is A's to place

Brief §3.3 wants **one** fixed `feTurbulence` layer, ≤4% opacity, over the ivory ground
only. B deliberately did not add the SVG to `methodology.html`: an inline `<svg>` with no
CSS renders as a visible block, and the layer must be identical on both pages. Publish the
markup and B will paste it verbatim. `print.css` already hides `.grain` and `.paper-grain`
speculatively — tell B the real class name.

### A11 — Banlist item still live on the calculator

`public/index.html` line 47, `<dl class="model-readiness">` — brief §2 names this by hand
("this includes the current `dl.model-readiness` — delete it"). Three `<dt>`/`<dd>` pairs
reading Equations / Calibration / Outputs is a KPI chip row.

### A12 — Add the `print.css` link to `index.html`

`public/print.css` now exists and is linked from `methodology.html`. Add to `index.html`:

```html
<link rel="stylesheet" href="/print.css" media="print" />
```

### A13 — `print.css` needs the calculator's final class names

The print sheet hides `input`, `select`, `button`, `[role="tablist"]`, `.controls` and
`.control-margin` defensively, but those last two are guesses. Once Phase 1 settles the
calculator's architecture, give B the class names for the control margin, the plate
wrapper, the readout lines and the masthead plate, and B will finish the calculator half of
the print sheet. Plates should print at a sensible size rather than being hidden.

### A14 — Section numbering is now `§ n`

Per brief §3.1 the paper's sections are `§ 1` … `§ 10`, not Roman `I`–`IX`; equation numbers
still key to the section. Nothing in `index.html` references the old numbering today —
checked — but any calculator copy that cites the paper should use `§ n` and the anchors
`#part-1` … `#part-10`.

### A15 — Ink semantics B is committing to, for cross-page agreement

Per brief §3.4: orange = capability cost, cobalt = coordination/controls, verdigris =
safety benefit, ochre = uncertainty (every assumed prior and sensitivity range in the
paper), fluoro = the colophon device only. If the calculator diverges on any of these the
Semantic Ink Rule breaks across the two pages — flag it now rather than at Task 4.

---

## For B

Work B owes itself. Cleared before Task 4 is reported.

- **B1** — Task 2: set the paper on A's primitives. Blocked on A1.
- **B2** — Task 2b: ten section devices + the colophon device. Blocked on A1.
- **B3** — ~~Task 3: `print.css`~~ **done**, verified in-browser at 794px with the sheet
  forced to `media="all"`: white ground, serif throughout, no colour, no overflow, contract
  `<details>` prints open, captions hang correctly, no element wider than the page.
- **B4** — **Footnote order in print.** The margin column collapses on paper, so a note set
  immediately *before* the paragraph that cites it now reads *above* its own marker. On
  screen that source order is what puts the note on the right line; in print it is
  backwards. Fix in Task 2 by placing the aside after the citing paragraph and pulling it
  up with explicit grid row placement — which also fixes the screen-reader order, where the
  note currently arrives before the marker that introduces it.
- **B5** — The abstract, § 9 and every `where` table are new copy. Re-read cold for measure,
  orphans and widows once set.
- **B6** — `.status.is-caveat` is a new state (§ 9, "Read first"). It differs from
  `.is-live` in wording, so it does not signal by colour alone, but check the stamp weight
  at 360px.
- **B7** — `print.css` sets `@page { margin: 18mm 16mm 20mm }` with no `size`. Confirm
  against a real print preview at Letter as well as A4 before Task 4 is reported.
- **B8** — Table renumbering: the notation table is new, so old Tables 2/3/4 are now 3/4/5.
  Sweep for stale references once the page is set.
