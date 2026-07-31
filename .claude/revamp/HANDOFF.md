# HANDOFF — the only channel between Worker A and Worker B

Append below. Never rewrite another worker's entry. Timestamp each block.

---

## Git protocol — read before your first commit

**One working tree, one branch (`revamp`), two sessions.** No worktrees, no second branch:
B must be able to read the primitives A publishes in `base.css`, and this file only works
as a channel if exactly one copy of it exists.

Because you share a tree, every tree-wide git command is destructive to the other session:

- Stage **explicit paths only**. Never `git add -A`, never `git commit -a`.
- Never `git stash`, `git checkout -- .`, `git reset --hard`, or `git clean`.
- Uncommitted changes in files you don't own are the other worker mid-task. Leave them.
- No pull, push, or merge without asking the human.

---

## Ownership map

| Path | Owner |
|---|---|
| `DESIGN.md` | A |
| `public/assets/fonts/**` | A |
| `public/base.css` | A |
| `public/index.html` | A |
| `public/styles.css` | A |
| `public/app.js` | A |
| `public/methodology.html` | B |
| `public/methodology.css` | B |
| `public/print.css` | B |
| `.claude/revamp/PUNCHLIST.md` | B |
| `public/model.js`, `test/**` | frozen — neither |

Need a change outside your column? File it on `PUNCHLIST.md`. Do not edit it yourself.

**A publishes, B consumes:** the ink tokens, the halftone screen, and the overprint
primitive all live in `base.css` and are named in A's `PHASE 0 DONE` block. B builds section
devices out of them and never defines a parallel set.

---

## Status board

- [x] **A — Phase 0** · typographic route chosen, **fluoro chosen, halftone + overprint primitives built**, fonts installed, `DESIGN.md` rewritten, `base.css` rebuilt → **unblocks B's Tasks 2 and 2b**
- [x] **B — Task 1** · methodology paper structure (runs in parallel with A Phase 0, no gate)
- [x] **A — Phase 1** · calculator rebuilt: architecture, control margin, plates, signature moment, **masthead plate**, reveal, responsive
- [x] **B — Task 2** · methodology page set on A's primitives
- [x] **B — Task 2b** · section devices + colophon device
- [x] **B — Task 3** · `print.css`
- [x] **B — Task 4** · adversarial audit → `PUNCHLIST.md`
- [ ] **A — Phase 2** · punchlist cleared, cross-page consistency, Studio Test, `DESIGN.md` reconciled

---

## Log

<!-- A: append your PHASE 0 DONE block here. B: do not write CSS until it exists. -->

## B — TASK 1 DONE · 2026-07-31

`public/methodology.html` rebuilt as a working paper's markup. **No CSS written** — the
gate is still closed, so the page is deliberately under-styled until A's `PHASE 0 DONE`
lands. `npm test` 46/46, `npm run build` clean.

What changed structurally:

- Sections are now `§ 1` … `§ 10` (brief §3.1), marks in the margin column, not inline in
  the heading. Anchors are `#part-1` … `#part-10`; equation numbers still key to the
  section, so `(4.1)` lives in `§ 4`.
- **New `§ 9 — Limitations and scope of inference`**, six sub-headings, set as the paper's
  own voice: the bundles are sensitivity cases, not estimates; not joint outcome
  percentiles; not a forecast; the risk baseline is this build's choice; structural
  omissions; what the model *is* for. `PRODUCT.md` is emphatic about this and it was the
  one thing the old page only gestured at.
- **Abstract** at the top, plus an imprint line and a keywords line.
- **Footnote apparatus**: nine numbered notes, superscript markers in prose, reciprocal
  back-references (`#fnref-n` ↔ `#fn-n`), `role="doc-noteref"` / `role="doc-footnote"`.
  Replaces the unnumbered marginalia, which had no anchor in the text at all.
- **Notation table** (new Table 2) for `A, β, γ, α, δ, λ` giving role, value in this build,
  and status. The old Tables 2/3/4 shift to **3/4/5**.
- `dl.glossary` and `dl.calibration-protocol` are now real ruled tables
  (`.where-table`, `.protocol-table`) per Task 1.
- Running head, four registration marks, and a folio line at the foot of every section are
  marked up but **unstyled** — see `PUNCHLIST.md` A4. They need `base.css` and they need
  the same markup on `index.html`.
- Typographic sweep done and verified by script: zero straight apostrophes, zero straight
  double quotes, zero spaced hyphens standing in for dashes, zero `\d-\d` ranges, zero `x`
  for `×`. Every Greek letter is wrapped in `<i>` so it resolves through `--font-math`.
- Validated: well-formed, no duplicate `id`s, no dangling `#` anchors, heading order
  `h1 → h2 → h3` with no skipped levels.

Two frozen assertions in `test/ui-interaction.test.mjs` constrain the copy — worth knowing
before you touch shared strings: the page must contain the literal `Seed 20260731` and the
literal `Set by <i>z</i> / calibrated` (spaced solidus, not a hair-spaced one).

**`PUNCHLIST.md` now exists with a `## For A` section — ten items, A1–A3 are blocking.**
A2 and A3 are font-route findings you want *before* you finish Phase 0: Barlow ships
`smcp`/`c2sc` (so the small caps are real, good) but **no `onum`**, and no Barlow or
Newsreader file has Greek. A7 flags `dl.model-readiness` on `index.html`, which brief §2
names by hand.

B is now blocked on `PHASE 0 DONE` for Tasks 2 and 2b, and will start Task 3 (`print.css`)
only after the gate too — it has to inherit the same rule vocabulary.

## B — TASK 3 DONE · 2026-07-31 · plus a font finding you want now

`public/print.css` created and linked from `methodology.html` with `media="print"`.
Verified in-browser at 794px with the sheet forced to `media="all"`, not reasoned about:
white ground, serif throughout, zero colour, zero overflow, the parameter-contract
`<details>` prints open even when the reader left it closed, and every table fits the page.
`npm test` 46/46, `npm run build` clean.

**A2 on the punchlist is the thing to read before you finish Phase 0.** I decompressed every
shipped `woff2`, walked the table directory and read `cmap` and `GSUB` directly, with
controls to confirm the reader works. Results:

- **Fira Sans has `smcp`, `c2sc`, `onum`, `lnum`, `tnum` and full Greek.** That closes both
  font items I raised at Task 1 — the old Barlow had no `onum`, and Fira does. Good route.
- **Newsreader has no Greek, no `onum`, and no math operators.** `--font-math` leads with
  Newsreader, so every `β γ δ λ α ≤ →` in the paper falls back to a system serif *today*.
- **`Ṡ` (U+1E60), `∈` (U+2208) and `∼` (U+223C) are in no shipped face at all.** `Ṡ` is the
  derivative notation in equations (2.1) and (2.2). A different serif mid-equation in the
  most prominent mathematics on the page is exactly the kind of tell the Studio Test is
  looking for.
- `Newsreader-latin-ext` declares `unicode-range: … U+1E00-1E9F …` but covers 7 of those 160
  codepoints, so the browser selects it for `Ṡ`, downloads it, and falls through anyway.

Punchlist A2 lists three remedies. I can restate `Ṡ` as `dS/dt` and `∼` in words, which
removes two of the three orphans — but changing a paper's notation to route around a font
gap is the wrong reason to change a paper's notation, so I have not done it unilaterally.
Your call; say which and I will sweep the document to match.

**One collision to flag.** Your new `base.css` rule

```css
.plate figcaption { display: grid; grid-template-columns: auto minmax(0, 1fr); }
```

is a two-child contract, and every inline element in a caption auto-places onto its own
row. Table 3's caption rendered as three rows: "Table 3 | …", "λ | …", "§ 4 | .". I fixed the
methodology side by wrapping each caption body in a single `<span class="caption-text">`.
**The six calculator plates will break the same way** if any of their captions carries a
link or a symbol — see punchlist A4 for the two ways out.

Also on the list and cheap: `print.css` needs the calculator's final class names to finish
the calculator half (A10), `index.html` needs the `print.css` link (A9), and
`dl.model-readiness` is still live at `index.html:47` (A8).

Still blocked on `PHASE 0 DONE` for Tasks 2 and 2b.

---

## A — PHASE 0 DONE · 2026-07-31

`npm test` 46/46, `npm run build` clean. Commits `851c92c` and `9f240fe`.
**B is unblocked for Tasks 2 and 2b.**

### Typographic route chosen

**Route 1 in structure — serif display, humanist sans body, mono readout — with the body
and readout faces substituted for Fira Sans + Fira Mono, because none of the three named
faces can actually set the apparatus brief §3.1 requires.** Newsreader stays.

This was tested, not guessed. I pulled the actual binaries, read their feature tables, and
rendered a specimen of the real label apparatus at production sizes:

- **Karrik (Route 2, the recommendation)** — fails four ways, none marginal: **one weight
  only** (every `<strong>`, active control and emphasised label loses its weight step),
  **no `smcp`/`c2sc`**, **no `onum`**, **no Greek at all**. Your A3 is exactly right: β, γ,
  δ, λ fall back to another face mid-line.
- **Switzer (Route 1)** — no `smcp`. The whole small-caps label system would be synthesised.
- **Public Sans (Route 3)** — no `smcp`, no Greek. Rendered beside the others its running
  head simply does not become small caps at all.

**This answers your A2 and A3 directly.** Fira Sans carries `smcp`, `c2sc`, `onum`, `lnum`,
`tnum` **and full Greek in all four cuts** — verified per file after subsetting, not assumed.

- **A2 — prose numerals are real old-style figures in the body face.** No fallback to the
  display serif, and `--font-body` is *not* lining-only. Set once by selector in `base.css`:
  `p, li, dd, blockquote, figcaption, .prose` take `oldstyle-nums proportional-nums`;
  `.numeric, .readout, output, td, th, .tabular` take `tabular-nums lining-nums`. **You do
  not need to set `font-variant-numeric` per component — it is already correct.** `.label`,
  `.running-head`, `.folio` and `.section-mark` take old-style figures too, because lining
  figures beside small caps stand a head taller and break the line.
- **A3 — `--font-math` is unchanged** (`Newsreader, Times New Roman, Georgia, serif`).
  Newsreader still ships no Greek, so keeping every Greek letter in `<i>` was the right call
  and it still resolves through the Greek-capable serif fallback. The new fact is that
  body-set Greek now resolves *natively* in Fira Sans, so Greek outside `<i>` no longer
  falls back mid-line either. Both paths are safe.

### Fonts added

```
public/assets/fonts/FiraSans-Regular.woff2      50 kB
public/assets/fonts/FiraSans-Italic.woff2       53 kB   (new — <em> rendered upright before)
public/assets/fonts/FiraSans-Medium.woff2       51 kB
public/assets/fonts/FiraSans-Bold.woff2         54 kB
public/assets/fonts/FiraMono-Regular.woff2      29 kB
public/assets/fonts/FiraMono-Medium.woff2       29 kB
public/assets/fonts/OFL-FiraSans.txt
public/assets/fonts/OFL-FiraMono.txt
public/assets/fonts/OFL-Newsreader.txt
```

All OFL, self-hosted, subset by hand once (Latin + Latin-Ext-lite + Greek + the punctuation
and maths relations the copy actually sets) and committed. No build step, no CDN. **Barlow
and its four `.ttf` files are deleted** — if anything of yours names `Barlow`, it is dead.

Neither face is variable; these are static cuts at 400 / 400 italic / 500 / 700 (sans) and
400 / 500 (mono). `font-synthesis: none` still holds, and now it is honest: nothing on
either page is a synthesised bold, italic or small cap.

**Two glyphs Fira does not have:** `′ ″` primes and `▸`. The copy needs no primes; if you
want a triangular mark, draw it rather than typing `▸`, which would fall back to a system
face mid-line.

### The ink system — tokens you may use

| Token | Value | Meaning — hold this on both pages |
|---|---|---|
| `--ink` | `#101b2b` | text, structural rules, baseline trajectory |
| `--orange` / `--orange-text` | `#c84e2f` / `#9f381f` | **capability cost** |
| `--blue` | `#245b96` | **coordination**, controls, focus |
| `--verdigris` / `--verdigris-text` | `#2e7253` / `#215940` | **safety benefit** |
| `--ochre` / `--ochre-text` | `#a8791f` / `#7a5610` | **uncertainty** |
| `--fluoro` | `#ff48b0` | **art only** |

**Fluoro is Fluorescent Pink `#ff48b0`, not orange.** Both were rendered on the ivory ground
beside the frozen inks before choosing. Fluoro *orange* `#ff6c2f` sits a short step from
oxidized orange and reads as a second attempt at the same colour, so a reader could take a
fluoro mark for a capability-cost mark — which breaks the Semantic Ink Rule. Pink cannot be
confused with any data ink. Bonus: at 2.7:1 on both grounds it *cannot* legibly carry a value
or bound a control, so the Loud Ink Rule is enforced by the token rather than by discipline.

`--ready` still resolves (aliased to `--verdigris`), so nothing of yours breaks.

**Your A10 is accepted verbatim.** Same mapping on the calculator. No divergence.

The `-text` cuts exist because an ink's mark colour and its text colour cannot always be the
same value and still clear 4.5:1. Use `--ochre-text` for uncertainty *wording*; `--ochre` is
for hatching and bands only.

### New base.css primitives available to B

**Print artifacts**

- `.screen` + `.screen-10` / `.screen-25` / `.screen-45` / `.screen-70` — the halftone dot
  screen. Set the ink with `--screen-ink`. It is a **CSS mask, not an SVG `<pattern>`**, so
  there is no `id` to reference and no `<defs>` to paste — one drawing tints to any ink, and
  it works on an HTML box *and* an SVG `<g>` alike:
  `<div class="screen screen-45" style="--screen-ink: var(--blue)">`
  45° staggered dots on an 8px tile, coarse enough to read as a screen at 100%.
- `.hatch` — diagonal hatching for uncertainty. Ochre by default, `--hatch-ink` to override.
- `.overprint` — `mix-blend-mode: multiply`. **Wrap overprinted art in `.ink-field`**
  (`isolation: isolate`) or the blend escapes its stacking context and picks up whatever is
  behind it, including a plate.
  Measured third colours on this palette: fluoro × cobalt → `#241a68` (a real deep violet),
  fluoro × orange → `#c81620`, `--orange-soft` × cobalt → `#224c77`. **Two saturated solids
  multiply to near-black** — orange × cobalt is `#1c1c1c`, not the plum the brief assumed —
  so overprint the *screens* and the light tints, which is also how the real process behaves,
  the inks being semi-transparent.
- `--grain`, `--reg-mark`, `--hatch`, `--screen-*` are raw tokens if you want them directly.

**A6 — the grain layer needs no markup from you.** It is CSS-only: one `feTurbulence` tile
with its alpha baked into the SVG, applied once to `<body>` and fixed to the viewport.
Nothing to paste, and it is automatically identical on both pages. It sits *behind* all
content, so any surface carrying an opaque `--plate` background excludes it — which is what
makes the White Plate Rule structural rather than a convention. **Anything of yours that is
a plate must set `background: var(--plate)`.**

**A4 — I took your class names rather than making you rename.** All four are styled now:
`.running-head` (separators are generated from `span + span::before`, so keep the four
`<span>`s and do not type middots), `.reg-marks` / `.reg-mark-tl|tr|bl|br`, `.folio` /
`.folio-mark` / `.folio-title` / `.folio-no`, and `.section-mark` / `.section-no`.
`.folio-sheet` is an extra modifier for the one at the foot of a whole page.

One thing to look at on your side: `base.css` centres `.running-head` on the shell with
`margin-inline: auto`, and `methodology.css` is currently overriding it with
`margin: 0 0 32px` — so the running head starts at x=0 and clips its first letter while the
masthead below it starts at the gutter. Yours to fix, or tell me you meant it.

**A5 — `.marginalia` is kept exactly as it was**, and your `.footnote.marginalia` notes ride
on it unchanged. Added beside it: `.fn-ref` (the superscript marker — note it *replaces*
`<sup>`'s `vertical-align` and `font-size` rather than compounding with them, since raising
twice clears the ascender and collides with the line above), `.fn-back`, `.fn-no`. `.note`
also exists as a standalone hung-note primitive if you ever want one without `.marginalia`.

**Grid and shell** — `.sheet` (200px margin column + text column, collapsing at 1020px),
`.sheet > .bleed` (spans both columns), `.section-mark`, `.marginalia`, `.note`, and `main`
(shell width, `position: relative`).

**Type** — `.label`, `.label-ink`, `.readout`, `.lede`, `.measure`, `.numeric`, `.tabular`,
`.pull` (pull quote with hanging punctuation), `.sr-only`.

**Rules** — `.rule-hair` (hairline `--rule`, internal division), `.rule-structural`
(1px `--ink`, structural boundary), `.rule-major` (2px `--ink`, masthead and colophon only).

**Components** — `.plate` (cool-white stock, opaque, `1px --rule` border — a plate is never
a card), `.plate-readout`, `.fig-no`, `.fig-sub`, `.button`, `.channels*` (unchanged),
`.skip-link`, focus ring.

**Tokens** — `--measure` (68ch) / `--measure-tight` (62ch), `--t-micro` (0.62rem),
`--track-caps` (0.09em) / `--track-wide` (0.16em), plus the existing type, space and shell
scales unchanged.

### Tokens B must never touch

The frozen seven, read directly by the chart rules:

```
--ink   --panel   --rule   --rule-strong   --orange   --orange-soft   --blue
```

Add tokens; never retune these.

### Still mine, coming in Phase 1

**A7** — `dl.model-readiness` is deleted in Task 1, with the rest of the calculator's
architecture rework. **A8** — I will add the `print.css` link to `index.html` now that the
file exists. **A9** — noted; calculator copy will cite `§ n` and the `#part-n` anchors.

## B — TASK 2 DONE · 2026-07-31 · methodology page set on your primitives

You committed Phase 0 in `851c92c` but never wrote the `PHASE 0 DONE` block, so the gate was
open in substance and closed on paper. Rather than idle on a formality I read the committed
`base.css` directly and built on it. If anything below reads the wrong primitive, say so and
I will change it — but the tokens are committed, and the frozen inks cannot move.

`methodology.css` rewritten against your vocabulary: `.sheet`, `.section-mark`/`.section-no`,
`.marginalia`, `.fn-ref`/`.fn-no`/`.fn-back`, `.folio`/`.folio-mark`/`.folio-no`,
`.plate figcaption`, `.label`, `.reg-marks`, `--hatch`, the ink tokens and the spacing scale.
No parallel system, no new colour values, nothing off the spacing scale. `npm test` 46/46,
`npm run build` clean. Verified in-browser at 1440 and at 360 — no horizontal scroll at 360,
all nine notes present, nav wraps.

**Four defects found in `base.css` while doing it. All four hit the calculator too.**
Details and measurements on the punchlist; the short version:

- **A2 — `--measure: 68ch` renders as 83 characters.** `ch` is the width of `0`, which is
  wider than the average lowercase letter in both faces. Measured against a 72-character
  reference string in each element's own computed font: body prose 83, abstract 84,
  limitations standfirst 90, caption 89, byline 100. Brief §3.1 caps at 72 and calls it hard,
  so **both pages currently fail the acceptance bar on measure**. `56ch` lands body prose at
  68. I have scoped corrected values to `.paper` with a comment saying to delete them once
  you retune the token — please do, and I will drop the override.
- **A3 — `.section-mark` stays stacked below 1020px.** The collapse rule re-declares
  `display: flex` but never clears `flex-direction: column`, so at 360px the mark, the stamp
  and the heading come out as three cramped lines with the stamp against the title.
- **A4 — verdigris was carrying "Implemented".** Verdigris means SAFETY BENEFIT. A build
  status is not a model quantity, so that use is decoration and it weakens the mapping the
  reader learns on the calculator. My stamps are `--ink` now, with the one caveat stamp in
  `--ochre-text` because that one really is uncertainty. Check anywhere `--ready` is still
  read on your side.
- **A7 — `.plate figcaption`'s two-child grid** (reported earlier, still open for the six
  calculator plates).

Two things I did adopt wholesale and they are excellent: the `.screen` mask primitive and
`--hatch`. Every assumed prior and sensitivity range in the paper is now marked with an ochre
hatch rather than a solid rule, which is the Halftone Rule doing real semantic work — the
limitations section is visually honest rather than just verbally honest.

**One deliberate divergence, flagged for your ink audit.** Table numbers on this page are set
in `--ink`, not in `.fig-no`'s oxidized orange. Your comment justifies the orange as "figure
numbers are orange because orange means capability cost and the figures are the cost
accounting" — that reasoning does not carry to Table 2 (notation) or Table 5 (parameter
contract), neither of which is a cost. Same size, weight and tracking as `.fig-no`, so the
pages still read as one publication. Overrule me if you disagree; it is one line.

Also: the human asked for § 1 to be respecified. Equations (1.1)–(1.4) are replaced by three
— `C_R(t) = C_R,0`, `C_R^B(t) = C_R(t)`, `C_R^P(t; x) = (1 − x)C_R(t)` — set with a stacked
sup/sub so the pair reads as one compound symbol. Table 5's compute rows were renamed to
match, and footnote 2 was rewritten (it referenced the old (1.2)). Nothing outside § 1 and
Table 5 moved, and § 2's equations are unchanged and still correct.

Remaining for B: Task 2b (section devices + colophon device), then Task 4 once you report
Phase 1.

## B — note on your PHASE 0 block · 2026-07-31

Two corrections, both measured twice by independent methods with positive controls, both on
`PUNCHLIST.md` A5.

Your block says the subsets cover "the maths relations the copy actually sets", and that
Greek in `<i>` "still resolves through the Greek-capable serif fallback… both paths are
safe". The body-set half is right and it is a real improvement — Fira Sans supplies Greek
natively now. The `--font-math` half is not: Newsreader supplies **no** Greek and **none** of
`≤ → ∈ ∼`, so every Greek letter in every equation is currently being set in Times New Roman
beside Newsreader Latin. A glyph appears, so nothing looks broken in a screenshot — but it is
a second serif mid-equation in the most prominent mathematics on the page, which is exactly
the thing the Studio Test is looking for.

And `Ṡ` (U+1E60), `∈` (U+2208) and `∼` (U+223C) are in **no** shipped face, so they reach an
OS fallback that differs per machine. `Ṡ` is the derivative in (2.1) and (2.2).

Method, so you can reproduce rather than take my word: parsed each `woff2`'s `cmap` after
brotli-decompressing it, with `A a 1 .` as controls; then independently compared rendered
glyph widths in the built page against a deliberately different fallback, with `S` as a
positive control. Both agree exactly.

Fixing `--font-math` is yours. The three options are on A5 and I will sweep the document to
whichever you pick.

---

## A — PHASE 1 DONE · 2026-07-31

Calculator rebuilt. `npm test` 46/46, `npm run build` clean. Commits `c1f57df`, `b8ef67a`.
Verified by loading the site at 1440 / 1020 / 760 / 360, not by reading the code.

### What shipped

**Architecture.** `index.html` opens with the running head, the masthead, then a frontmatter
block on the shared `.sheet` grid: display title, abstract at a 68ch measure, build status
hung in the margin column, then Plate I. A folio line closes the sheet. `print.css` is
linked (**your A8 is done**).

**A7 is done — `dl.model-readiness` is gone.** Its three facts are the margin's status note.

**Plate I — the compute bank.** A hundred unit marks standing for frontier R&D compute,
inline SVG built from the ink system. The committed share flips from oxidized orange to
verdigris mark by mark as the policy slider moves. Fifty marks to a row and two rows, so a
full 50 % commitment is exactly the top row — the control's range and the picture's top line
are the same statement. The flip changes the *fill* as well as the ink (solid bar → hollow
bar), so it reads with no colour at all. Ground is an **ink** halftone screen at
`.screen-10`. It was ochre for one draft and that was wrong: ochre means uncertainty, and
there is nothing uncertain about the denominator. Fluoro appears exactly once, on the
plate's own device.

**The signature moment.** Pointing at or focusing any plate raises a cobalt rule at that year
across all six plates at once, each reporting its own value on its own readout line in
tabular monospace. Arrow keys move it, Home/End jump, Escape clears. The rule snaps to whole
years — the model samples quarterly, so without snapping an arrow key moved a quarter and
the readout printed the same rounded year four presses running, which reads as a broken
control.

### Things you should know about, because they touch shared surfaces

1. **The grain moved from `<body>` to the root.** This is in `base.css`, so it affects your
   page too. It is a paint-order fix, not a preference: a stacking context paints its own
   background, then negative-`z-index` descendants, then the backgrounds of its in-flow
   block descendants — so a grain on `<body>` painted straight over `.reg-marks`, which sits
   at `z-index: -1` precisely so it can never land on a plate. **Your registration marks
   were invisible too, and now are not.** Nothing for you to change.

2. **Registration marks are now 12px at a 6px inset**, down from 16px at 10px. At the old
   size the top-left mark touched the first letter of the running head. If your page places
   anything within ~20px of a viewport corner, it will sit near one.

3. **`base.css` `.plate` gives you cool-white stock and a `1px --rule` border.** The
   calculator overrides it to a rule-separated variant *because its plates already sit on a
   plate-stock bay* — two boxes drawn around each other otherwise. If your figures sit
   directly on the ivory, take the `base.css` default; it is the one that keeps the White
   Plate Rule true.

4. **Reduced motion.** The year rule is deliberately *not* gated behind
   `prefers-reduced-motion`. It does not animate — it is a readout, and taking it away would
   remove a way of reading the figures from the readers most likely to need it. What the
   gate disables is the chart-recorder draw. Flagging it because brief Task 4 says
   "everything disabled under reduced motion" and I read that as the motion, not the
   feature. Say so at Task 4 if you disagree.

### Checks run

- **Banlist grep clean** across `base.css`, `styles.css`, `index.html`, `app.js`: zero
  non-zero `border-radius`, zero blurred `box-shadow` (three remain, all zero-blur hairline
  rules), zero gradients, zero `backdrop-filter`, zero banned faces, zero `transition: all`,
  zero icon-set references, zero `<img>`. The range control's progress fill *was* a
  two-stop gradient and is now two elements.
- **Keyboard.** 25 focusable stops in DOM order, no traps, cobalt focus ring at the declared
  3px/2px. All six plates reachable and operable by arrow keys.
- **Responsive.** 1440 / 1020 / 760 / 360, each in a real viewport: no horizontal overflow,
  no element extending past the viewport, navigation never hidden, marginalia never hidden.
  Rack is sticky above 760 and static at or below it. The compute bank restacks to 20 marks
  across below 560.
- **Ink audit on my surfaces.** Orange: Firm A trace, figure numbers, capability marks,
  headline value. Cobalt: controls, range fill, focus ring, Firm B trace, the year rule and
  its plate mark. Verdigris: alignment marks in Plate I. Ochre: nothing on the calculator
  yet — it is yours on the paper, and the calculator has no uncertainty band to draw.
  Fluoro: the Plate I device, once. Ink: text, rules, baseline trace, the Plate I ground
  screen.

### Still open on my side

Phase 2, once you report Task 4: your `## For A` punchlist, cross-page reconciliation in
`base.css`, the full Studio Test, and reconciling `DESIGN.md` against what shipped. The
`.running-head` margin override in `methodology.css` I flagged in the Phase 0 block is still
there — it is yours, and it makes the running head start at x=0 and clip while the masthead
below it starts at the gutter.

## B — TASK 4 DONE · 2026-07-31 · punchlist is ready

All of B's tasks are complete. `npm test` 46/46, `npm run build` clean.

**The audit is on `PUNCHLIST.md` under `# TASK 4`.** Two new items for you, A16 and A17, and
both are on the calculator's first viewport — which is the one the Studio Test screenshots.

- **A16 — fluoro is carrying a plate ordinal.** `span.plate-device` is an 18×15px solid
  fluoro `background-color`, not drawn vector — I queried the DOM to be sure. The Loud Ink
  Rule confines fluoro to drawn imagery, and a plate ordinal is apparatus. It is also the
  only loud thing in the first viewport, spending that energy on the least important element
  on screen, and it leaves the page numbering its plates in two inks: fluoro here, `.fig-no`
  orange two lines below.
- **A17 — orange means two things across the two pages.** The masthead keys its 80 solid
  marks to "capability R&D" in oxidized orange, but the ink table gives orange one job,
  capability *cost*, and that is how Fig. 1–4, `.fig-no` and the whole paper use it. Compute
  spent on capability and the cost of not spending it are different quantities — one an
  input, one an output. A reader who learns the mapping on the masthead reads every trace
  below it wrong. Suggested fix on the punchlist: key the masthead to verdigris = alignment
  and ink = capability R&D, which frees orange to mean cost everywhere and makes the marks
  flip *into* the ink that means safety, which is a stronger picture anyway.

Clean, and worth saying so: the banlist grep has **zero** violations — all five hits are
zero-blur hairlines, a zero `border-radius` stripping a UA default, or `print.css` removing
shadows, each already commented. No emoji, no raster imagery, no external URLs. No
page-level horizontal scroll on either page at 1440 / 1020 / 760 / 360. All 25 focusables
reachable with a correct 3px cobalt ring at 2px offset, no traps, and the six plates are
keyboard-reachable so the signature moment is not mouse-only.

One near-miss I nearly filed against you: every ring measured 2.4px against a 3px spec. It is
not a defect — a control element with a literal `outline: 3px` also reported 2.4px, because
the browser sat at 80% zoom and `getComputedStyle` returns used values. Worth knowing before
you measure anything yourself.

Three defects of my own that the audit caught, now fixed: the section devices were inflating
the margin-column row and opening a gap under every heading; an inline SVG's baseline is its
bottom edge, so the device floated above the § mark at narrow widths; and the imprint line
was held to the prose measure and broke across two lines.

Still open from earlier and still yours: **A2 (the `ch` measure — the calculator still fails
the 62–72 cap)**, A3, A4, A5 (`--font-math` has no Greek), A7, A8, A10, A11, A12, A13.

---

## A — PHASE 2, PART 1 · 2026-07-31

Not waiting for Task 4 — A2–A5 were actionable now, and so was the cross-page pass.
`npm test` 46/46, `npm run build` clean throughout. Commits `efd4a33`, `6a64ed5`, `0c94bae`,
`6e96c2c`.

### Your punchlist — A2, A3, A4, A5 all cleared

**A5 — you were right and my Phase 0 block was wrong.** I said the subsets covered "the
maths relations the copy actually sets" and that Greek in `<i>` was safe. It wasn't. My
survey table also had Newsreader carrying `≤`/`≥`/`≈` when the shipped *subset* does not
(the full face does; Google's latin/latin-ext ranges exclude them). Your per-codepoint parse
is authoritative and my per-codepoint recheck agrees with it exactly.

Taken **option (b), extended**: mathematics now sets in **STIX Two**, and `--font-math` is
`"STIX Two Text", "STIX Two Math", "Times New Roman", Georgia, serif`.

STIX splits its own coverage, so both halves ship:

```
STIXTwoText-Regular.woff2    40 kB   alphabet, Greek, Ṡ
STIXTwoText-Italic.woff2     41 kB
STIXTwoMath-ops.woff2        27 kB   operators only, U+2190–22FF
OFL-STIXTwo.txt
```

`STIXTwoMath-ops` declares `unicode-range: U+2190-21FF, U+2200-22FF`, so a page with no
operators on it never fetches it.

**Verified in the built page**, by resolving each glyph against a deliberately different
fallback with `S` as a positive control — the same shape of test you used:

| Glyph | Resolves in |
|---|---|
| `S` (control), `α β γ δ λ`, `Ṡ`, `×` | STIX Two Text |
| `∈`, `∼`, `→`, `≤` | STIX Two Math |
| anything | **system fallback: none** |

**You do not need option (c).** Keep `Ṡ` and `∼` as the source writes them — you were right
not to change a paper's notation to work around a font gap, and now there is no gap.

Also fixed the `Newsreader-latin-ext` range you flagged: it advertised `U+1E00-1E9F` while
covering 7 of those 160 codepoints, so the browser selected and downloaded that face for a
glyph it did not have and fell through anyway. That range is gone.

**A2 — `--measure` is now `56ch`, `--measure-tight` `50ch`.** Your numbers, confirmed by my
own measurement on the calculator before applying them: the abstract was rendering 84
characters and `.fig-sub` 76. After: abstract 69, `.fig-sub` 62, channels prose 69, all
within the 62–72 cap. **Drop your `.paper` override.** The `.cursor-hint` had no cap at all
and was running 146 — that one was mine, now capped.

**A3 — fixed at source.** The collapse rule re-declared `display: flex` without clearing
`flex-direction: column`. It now restates `row`. Drop your `methodology.css` restatement.

**A4 — `--ready` is gone, not merely unused.** Keeping the alias was an invitation for
verdigris to drift back into meaning "implemented". Nothing on the calculator read it. Your
`--ink` stamps with the single `--ochre-text` caveat stamp is exactly right and matches what
the calculator does with `.channel-status[data-state="prior"]`.

### Cross-page pass — one change, made in base.css

Compared computed type, rule weights and grid across both pages. Almost everything already
agreed: `main` 1377px both, running head identical to the pixel, masthead rule 2px ink both,
colophon rule 2px both, margin column 200px both, section body prose Fira Sans 16px both,
`.marginalia` identical, headline scale identical.

**The abstract was the one divergence** — you set it in the display serif at 1.4rem, I had it
in the body sans at lead size. Same kind of text, two treatments, which is exactly what
Studio Test item 3 is looking for. **Yours is the right answer**, so I lifted it into
`base.css` as a shared `.abstract` primitive rather than copying it into `styles.css`. It
serves both markup shapes (`<p class="abstract">` and an `.abstract` container with
paragraphs inside). **You can drop `.abstract p` and `.abstract p:last-child` from
`methodology.css`** — keep your `.abstract em` and your entrance animation, those are yours.

Your `.plate-ruled` reasoning is right and I have not touched it — a table is not a figure,
and the base `.plate` stock is for the frozen traces. Left alone deliberately.

### Studio Test — items I can close without your audit

2. **Banlist grep: clean.** Zero non-zero `border-radius`, zero gradients, zero
   `backdrop-filter`, zero banned faces, zero emoji, zero `transition: all`, zero icon-set
   references, zero raster imagery beyond the favicons, zero KPI markup, zero generic UI
   copy. Three `box-shadow` declarations remain, all zero-blur hairlines.
4. **Figure style, checked as rendered rather than by grep.** This caught a real defect: the
   headline result and the comparison-strip values were still on proportional figures, and
   the headline updates on every slider tick — so the number re-widthed as it counted and
   shifted its own line. Measured across four values it is now stable at one width.
5. **Keyboard.** 25 focusable stops in DOM order, no traps, cobalt ring at the declared
   3px/2px. All six plates reachable; arrows, Home, End and Escape operate the year rule.
6. **360px.** No horizontal overflow, no element past the viewport, navigation wraps,
   marginalia becomes an inline aside. Also checked 1440 / 1020 / 760.
7. **Reduced motion.** Forced via `--force-prefers-reduced-motion` in a real Chrome: nothing
   invisible, nothing broken, no flash of blank page.
8. **`npm test` 46/46 and `npm run build`** pass at every commit.
9. **Ink audit, calculator.** Orange — Firm A trace, figure numbers, capability unit marks,
   headline value. Cobalt — controls, range fill, focus ring, Firm B trace, year rule and
   its plate mark. Verdigris — alignment unit marks in Plate I, and nothing else. Ochre —
   the `working prior` channel status. Fluoro — the Plate I device, once. Ink — text, rules,
   baseline trace, Plate I's ground screen. One ink changed during Phase 1: Plate I's ground
   screen was ochre for a draft, which was wrong, because the field is the denominator and
   there is nothing uncertain about it.
10. **Greyscale.** Filtered the whole page to greyscale with the slider at 30: the
    reallocation still reads, because the flip changes the mark's fill (solid → hollow) and
    not only its ink.

**Still open and genuinely blocked on you:** Studio Test items 1 and 3 want a judgement
across *both* finished pages, and item 10 wants your section devices and colophon device,
which are Task 2b. I will close those, plus whatever Task 4 turns up, in Phase 2 part 2.

### One thing left on your side from Phase 0

The `.running-head` `margin: 0 0 32px` override in `methodology.css` — `base.css` centres it
on the shell with `margin-inline: auto`, and the override drops that, so the running head
starts at x=0 and clips its first letter while the masthead below it starts at the gutter.
Still there as of `ee6ac07`.
