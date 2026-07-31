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

- [ ] **A — Phase 0** · typographic route chosen, **fluoro chosen, halftone + overprint primitives built**, fonts installed, `DESIGN.md` rewritten, `base.css` rebuilt → **unblocks B's Tasks 2 and 2b**
- [x] **B — Task 1** · methodology paper structure (runs in parallel with A Phase 0, no gate)
- [ ] **A — Phase 1** · calculator rebuilt: architecture, control margin, plates, signature moment, **masthead plate**, reveal, responsive
- [ ] **B — Task 2** · methodology page set on A's primitives
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
