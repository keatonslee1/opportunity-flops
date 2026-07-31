# WORKER B — The Paper & The Proof

You have two jobs on a total UI/UX revamp of Opportunity FLOPs. First, you rebuild the
methodology page as a genuine research paper. Second, you are the adversarial critic — the
person in the studio whose job is to find the places where it still looks generated.

Worker A is the art director, working in a parallel session on the calculator page. You
never edit the same file.

**Read these in full before doing anything:**
1. `.claude/revamp/BRIEF.md` — binding art direction, hard constraints, banlist, acceptance bar
2. `PRODUCT.md` — what this is and who it's for
3. `.claude/revamp/HANDOFF.md` — Worker A's Phase 0 output (see gate below)

Then read `public/methodology.html`, `public/methodology.css`, and `public/base.css`.

---

## Files you own — no one else touches these

```
public/methodology.html
public/methodology.css
public/print.css          (new — you create it)
.claude/revamp/PUNCHLIST.md   (new — you create it)
```

## Files you must NOT touch

```
DESIGN.md, public/base.css, public/index.html,
public/styles.css, public/app.js, public/assets/fonts/**   → Worker A
public/model.js, test/**                                    → frozen
```

Everything you need from A's files goes on `PUNCHLIST.md` under `## For A`. Never edit them
yourself — you will collide with a live session.

---

## GATE

`HANDOFF.md` must contain a `## PHASE 0 DONE` block from Worker A before you write any CSS.
That block lists the fonts, tokens, and `base.css` primitives you are allowed to build on.

**You are not blocked in the meantime.** Start with Task 1 below — it is pure HTML structure
and content, and it does not depend on A's tokens.

---

## TASK 0 — Git setup, before anything else

You and Worker A share **one working tree on one branch**. Do not create a worktree and do
not create a second branch — you need to read the `base.css` primitives A publishes, and
`HANDOFF.md` only works as a channel if there is exactly one copy of it.

Run this. It is idempotent, so it is safe whichever of you gets there first:

```sh
git rev-parse --verify revamp >/dev/null 2>&1 && git checkout revamp || git checkout -b revamp
```

Then, at every commit for the rest of this job:

- Commit **only the files you own**. Never `git add -A`, never `git commit -a` — you will
  sweep up Worker A's in-progress edits from the same tree.
- Stage explicit paths: `git add public/methodology.html public/methodology.css` and so on.
- Never `git stash`, `git checkout -- .`, `git reset --hard`, or `git clean`. Those are
  tree-wide and will destroy the other session's uncommitted work.
- If `git status` shows changes in files you do not own, **leave them alone**. That is A
  working, not a problem to fix.
- Pull nothing, push nothing, merge nothing without asking the human first.

## TASK 1 — Structure the paper (start immediately, no gate)

Rebuild `methodology.html` as a research paper's *markup*, independent of styling:

- Semantic sectioning with real heading hierarchy, each section carrying a `§ n` mark
- An **abstract** at the top, set to a 62–72 character measure
- A **footnote apparatus**: superscript markers in prose, notes with reciprocal
  back-references, ready to hang in the margin column at ≥1020px
- **Numbered display equations** with the parameter table set as a real table — ruled, not
  boxed; tabular lining figures; hairline rules only, no zebra striping, no cell borders
- A **parameter/notation table** for `A, β, γ, α, δ, λ` giving role and status for each
- An explicit, prominent **limitations section**. `PRODUCT.md` is emphatic that Monte Carlo
  output must be presented as sensitivity cases from assumed priors — **not** empirical
  estimates, **not** joint outcome percentiles, **not** a forecast. Say so in the paper's own
  voice. Honesty about uncertainty *is* the credibility signal for this audience.
- **Typographic characters throughout**: `–` in numeric ranges, unspaced `—`, `×` for
  multiplication, `≈ ≤ ≥ ±`, proper curly quotes. Sweep the entire document. Every hyphen
  standing in for a dash and every `x` standing in for `×` is a defect.
- Greek letters must resolve through `--font-math` — Newsreader ships no Greek. Do not
  route them through `--font-display`.

Commit. Then wait for the gate if A hasn't cleared it yet.

---

## TASK 2 — Set the paper (after the gate)

Rewrite `methodology.css` using **only** the primitives and tokens A published in
`HANDOFF.md`. Do not invent a parallel system — if you need something that isn't there, put
it on `PUNCHLIST.md` under `## For A` and use the nearest existing primitive meanwhile.

- Same 200px margin column and text column as the calculator. Same type scale, same rule
  vocabulary, same spacing scale. The two pages must be unmistakably the same publication.
- Running head, folio line, section marks in the margin, registration marks — all from
  `base.css`.
- Equations centered on the text measure with the equation number set flush right in the
  margin column, printed convention.
- Margin notes hang beside the paragraph that references them at ≥1020px, become inline
  asides below that. They are never dropped.
- Old-style figures in prose, tabular lining figures in tables and readouts.
- Zero cards. Zero shadows. Zero radius. The parameter table is ruled, never boxed.

---

## TASK 2b — Section devices and the colophon

Read **§3.4 and §3.5 of the brief**. The paper needs pictures, and every one is drawn —
inline SVG built from A's ink tokens and A's halftone screen. No image files, no icon sets,
no stock, no renders.

- **One section device per section**, carrying a link in the causal chain:
  compute → software progress → frontier capability → risk. Hairline construction plus one
  spot ink each, sized to sit in the margin column or run in above the section rule. Small
  and precise. If it looks like an icon, it's wrong — it should look like a plate from a
  scientific atlas.
- **Ink semantics hold across the paper** (The Semantic Ink Rule): cost is orange,
  coordination is cobalt, safety is verdigris, uncertainty is ochre. Use ochre with a
  halftone or hatch for every assumed-prior and sensitivity range in the text — this makes
  the limitations section *visually* honest, which is the credibility signal for this
  audience.
- **The colophon device** at the foot of the paper: a printer's mark, fluoro, small,
  confident. Fluoro appears nowhere else in your files.
- Overprint where inks cross, via A's multiply primitive. Never onto a figure plate.

## TASK 3 — `print.css`

A real working paper prints. Create `public/print.css`, linked with `media="print"` from
methodology.html (and add the same link to index.html on the punchlist for A).

Black on white, serif throughout, controls and navigation hidden, `a[href]::after`
expanding external URLs, page-break control so equations and tables never split across
pages, plates sized to fit. This costs twenty minutes and it is exactly the kind of detail
that reads as "a studio made this."

---

## TASK 4 — The adversarial audit (your most important job)

Once A reports Phase 1 done, run the site and attack it. Write findings to
`.claude/revamp/PUNCHLIST.md`, split into `## For A` and `## For B`, ranked most-severe
first. Be specific: file, line, what's wrong, what it should be.

**4.1 — Banlist grep.** Run it and paste the raw output into the punchlist:

```sh
grep -rnE "border-radius|box-shadow|linear-gradient|radial-gradient|backdrop-filter|transition: ?all|Inter|Roboto|Open Sans|Poppins|Montserrat" public/*.css public/*.html
```

Every hit is a defect until justified in a comment. Zero-blur `box-shadow` used to draw a
hairline rule is legitimate — check the blur value before reporting.

**4.2 — The generated-look sweep.** Go surface by surface and name every element that still
reads as machine-made. Specifically hunt: cards, stat tiles, symmetric 3-up grids, centered
hero composition, generic UI copy, decorative color, anything where hierarchy comes from a
box instead of from typography, and any place where the spacing is "even" rather than
composed.

**4.3 — Typographic audit.** Wrong figure style. Hyphens doing an en dash's job. `x` for
`×`. Straight quotes. Measure wider than 72ch. Orphans and widows in headings. Small caps
faked with `text-transform: uppercase` where the face has real caps available. Greek
falling back to the wrong stack. Inconsistent tracking on small-caps labels between pages.

**4.3b — Ink and imagery audit.** Point at every use of every ink on both pages and name the
meaning it carries. Anything you can't justify semantically is decoration — report it.
Check specifically: fluoro anywhere near a data mark or control (violation of The Loud Ink
Rule), tints done with opacity or gradients instead of halftone screens, a plum or blend
faked with a colour value instead of earned by overprint, any screen or overprint sitting on
top of a figure plate, and any ink whose meaning drifts between the two pages. Then confirm
every image is drawn vector — one stock photo, render, or generated image fails the build.

**4.4 — Accessibility.** Full keyboard traverse of both pages — every control reachable and
operable, visible 3px cobalt focus ring at 2px offset, no traps. Contrast: the brighter
chart orange must never carry text; that's `--orange-text`'s job. Any state signalled by
color alone. Screenshot at `prefers-reduced-motion: reduce` and confirm nothing is broken
or left invisible.

**4.5 — Responsive.** 1440 / 1020 / 760 / **360**. At 360: nothing clipped, nothing
horizontally scrolling, navigation wrapped rather than hidden, marginalia inline rather than
gone. 360 is where this class of layout dies — test it hardest.

**4.6 — The Studio Test.** Screenshot the first viewport of both pages at 1440px. For each,
answer in one sentence: *would a policy researcher assume a human designed this?* If the
answer is anything short of yes, say precisely what gives it away.

Then fix everything under `## For B` yourself. Tell A the punchlist is ready.

---

## Rules of engagement

- Verify visually. `npm run dev`, load both pages, look at them. If you have browser tooling
  available, screenshot and actually examine the screenshots. Never report a visual result
  you have not seen.
- `npm test` and `npm run build` pass at every commit.
- Be genuinely adversarial in Task 4. A punchlist that says "looks good" is a failed audit —
  your value is finding what A is too close to the work to see. But report only real
  defects; padding the list with nitpicks buries the ones that matter.
- Update `HANDOFF.md` at the end of each task.
