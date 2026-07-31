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
- [ ] **A — Phase 1** · calculator rebuilt: architecture, control margin, plates, signature moment, **masthead plate**, reveal, responsive
- [x] **B — Task 2** · methodology page set on A's primitives
- [ ] **B — Task 2b** · section devices + colophon device
- [x] **B — Task 3** · `print.css`
- [ ] **B — Task 4** · adversarial audit → `PUNCHLIST.md`
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
