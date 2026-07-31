# PUNCHLIST — Worker B

Owner: **B**. A reads `## For A` and works from it; A does not edit this file. Anything B
needs from a file B does not own is filed here, never edited directly.

The full adversarial audit (Task 4) lands here once A reports Phase 1 done. Everything
below is what Task 1 turned up while structuring the paper.

---

## For A

Ranked most-severe first. Items 1–3 block B's Tasks 2 and 2b.

### A1 — Publish the `PHASE 0 DONE` block (blocking)

B cannot write a line of CSS until `HANDOFF.md` names: the two font faces and their
variable-font axes, the ink tokens (`--verdigris`, `--ochre`, `--fluoro` and whatever the
chosen fluoro hex is), the halftone screen's SVG `id` and the class that applies it, and
the overprint (`mix-blend-mode: multiply`) primitive's class name. B builds the section
devices and the colophon device out of exactly those and will not define a parallel set.

### A2 — Body face has no old-style figures

Verified against the shipped files: `Barlow-{Regular,Medium,SemiBold,Bold}.ttf` expose
`smcp`, `c2sc`, `tnum`, `pnum` — and **no `onum`**. Brief §3.1 requires old-style figures
in prose. So one of:

- Phase 0's text face ships real `onum` (preferred), or
- prose numerals are set in the display serif and `--font-body` is documented as
  lining-only.

Whichever, name the decision in `PHASE 0 DONE` so both pages set numerals the same way.
Related good news: Barlow's `smcp`/`c2sc` are real, so `font-variant-caps: all-small-caps`
is not being synthesised — that part of the current system is sound and worth keeping.

### A3 — Greek still has no home in the display stack

Confirmed: no Greek glyph names in any Barlow file, and Newsreader ships none either. B has
wrapped **every** Greek letter on the methodology page in `<i>` so it resolves through
`--font-math` rather than `--font-body`. If Phase 0 changes `--font-math`, the replacement
must have Greek, or the entire notation table and every equation falls back to a system
serif mid-line.

### A4 — Shared chrome B has marked up but cannot style

`methodology.html` now carries the apparatus markup below. It is inert until `base.css`
styles it, and it must appear on the calculator page too or the two pages stop being one
publication. **A owns both the CSS and `index.html`.**

Running head (brief §3.1), directly above `.topbar`:

```html
<p class="running-head" aria-hidden="true">
  <span>Opportunity FLOPs</span>
  <span>Working Paper 01</span>
  <span>Reallocation of capability compute</span>
  <span>July 2026</span>
</p>
```

Registration marks (brief §3.3), first child of `<body>`:

```html
<div class="reg-marks" aria-hidden="true">
  <span class="reg-mark reg-mark-tl"></span>
  <span class="reg-mark reg-mark-tr"></span>
  <span class="reg-mark reg-mark-bl"></span>
  <span class="reg-mark reg-mark-br"></span>
</div>
```

Folio line (brief §3.1) — B sets one at the foot of every section, since a scrolling
document's section is the analogue of a printed page:

```html
<p class="folio" aria-hidden="true">
  <span class="folio-mark">§ 4</span>
  <span class="folio-title">AI risk</span>
  <span class="folio-no numeric">4/10</span>
</p>
```

If `.running-head` / `.reg-mark` / `.folio` are not the class names you want, say so in
`PHASE 0 DONE` and B will rename — but B needs one vocabulary, not two.

### A5 — Keep the `.marginalia` hanging primitive through the `base.css` rebuild

The paper's footnote apparatus is nine notes hung in the margin column, each with a
reciprocal back-reference. They ride on the current `.sheet` grid + `.marginalia`
(`grid-column: 1`, inline aside below 1020px). If the rebuild renames or drops that
primitive, name the replacement in `PHASE 0 DONE`. Brief §3.1: notes are *never* dropped.

### A6 — Paper grain layer is A's to place

Brief §3.3 wants **one** fixed-position `feTurbulence` layer, ≤4% opacity, over the ivory
ground only. B deliberately did **not** add the SVG to `methodology.html`: an inline
`<svg>` with no CSS renders as a visible block, and the layer must be identical on both
pages. Publish the exact markup in `PHASE 0 DONE` and B will paste it verbatim.

### A7 — Banlist item still live on the calculator

`public/index.html` line 47: `<dl class="model-readiness">` — brief §2 names this
explicitly ("this includes the current `dl.model-readiness` — delete it"). Three
`<dt>`/`<dd>` pairs reading Equations / Calibration / Outputs is a KPI chip row.

### A8 — `print.css` link for the calculator

B creates `public/print.css` in Task 3 and links it from `methodology.html`. Add the same
line to `index.html` once the file exists:

```html
<link rel="stylesheet" href="/print.css" media="print" />
```

### A9 — Section numbering changed to `§ n`

Per brief §3.1 the paper's sections are now `§ 1` … `§ 10`, not Roman `I`–`IX`. Equation
numbers still key to the section (`(4.1)` is in `§ 4`). Nothing in `index.html` references
the old numbering today — checked — but any calculator copy that comes to cite the paper
should use `§ n` and the anchors `#part-1` … `#part-10`.

### A10 — Ink semantics B is committing to, for cross-page agreement

B will use, per brief §3.4: orange = capability cost, cobalt = coordination/controls,
verdigris = safety benefit, ochre = uncertainty (every assumed prior and sensitivity range
in the paper), fluoro = the colophon device only. If the calculator diverges on any of
these, the Semantic Ink Rule breaks across the two pages — flag it now rather than at
Task 4.

---

## For B

Work B owes itself. Cleared before Task 4 is reported.

- **B1** — Task 2: set the paper on A's primitives. Blocked on A1.
- **B2** — Task 2b: nine section devices + the colophon device. Blocked on A1.
- **B3** — Task 3: `public/print.css`.
- **B4** — The abstract, the limitations section and every `where` table are new copy.
  Re-read them cold for measure (62–72ch), orphans, and widows once they are set.
- **B5** — `.status.is-caveat` is a new state (on `§ 9`, reading "Read first"). Confirm it
  is distinguishable from `.is-live` without colour — it currently differs in wording,
  which satisfies the rule, but check the stamp's weight against `is-live` at 360px.
- **B6** — Table renumbering: the notation table is new, so the old Tables 2/3/4 are now
  Tables 3/4/5. Sweep for any stale "Table 2" reference once the page is set.
