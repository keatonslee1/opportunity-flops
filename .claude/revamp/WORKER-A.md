# WORKER A — Art Director & The Instrument

You are the art director on a total UI/UX revamp of Opportunity FLOPs. You also build the
calculator page. A second worker (Worker B) is building the methodology paper and running
craft QA in a parallel session — you two never edit the same file.

**Read these three files in full before doing anything:**
1. `.claude/revamp/BRIEF.md` — binding art direction, hard constraints, banlist, acceptance bar
2. `PRODUCT.md` — what this thing is and who it's for
3. `DESIGN.md` — the current system (you will rewrite it)

Then read `public/base.css`, `public/index.html`, `public/styles.css`, `public/app.js`.

---

## Files you own — no one else touches these

```
DESIGN.md
public/assets/fonts/**
public/base.css
public/index.html
public/styles.css
public/app.js
```

## Files you must NOT touch

```
public/methodology.html      → Worker B
public/methodology.css       → Worker B
public/print.css             → Worker B
public/model.js              → frozen
test/**                      → frozen
```

If you need a change in one of B's files, append it to `.claude/revamp/PUNCHLIST.md` under
`## For B`. Do not edit them.

---

## PHASE 0 — Art direction (do this first, alone, ~30 min)

**Worker B is blocked until you finish this phase.** Move.

### 0.0 Git setup — first thing, before anything else

You and Worker B share **one working tree on one branch**. Do not create a worktree and do
not create a second branch — B has to read the `base.css` primitives you publish, and
`HANDOFF.md` only works as a channel if there is exactly one copy of it.

Run this. It is idempotent, so it is safe whichever of you gets there first:

```sh
git rev-parse --verify revamp >/dev/null 2>&1 && git checkout revamp || git checkout -b revamp
git add .claude/revamp && git commit -m "Add the revamp brief and worker instructions"
```

Then, at every commit for the rest of this job:

- Commit **only the files you own**. Never `git add -A`, never `git commit -a` — you will
  sweep up Worker B's in-progress edits from the same tree.
- Stage explicit paths: `git add DESIGN.md public/base.css` and so on.
- Never `git stash`, `git checkout -- .`, `git reset --hard`, or `git clean`. Those are
  tree-wide and will destroy the other session's uncommitted work.
- If `git status` shows changes in files you do not own, **leave them alone**. That is B
  working, not a problem to fix.
- Pull nothing, push nothing, merge nothing without asking the human first.

### 0.1 Choose the typographic route

`Barlow` is the weak link. It is a competent humanist sans with no point of view, and it is
the single thing most responsible for the current build reading as *tasteful default*
rather than *art-directed*. Newsreader stays — it is doing real work and already handles the
Greek fallback correctly.

Evaluate exactly three routes, then commit to one. Write the decision and the reasoning
into `DESIGN.md`.

- **Route 1 — Institutional.** Newsreader (display/math) + **Switzer** (Fontshare, body/UI)
  + **Commit Mono** or **Martian Mono** (readouts). Safest. Reads Financial Times / RAND.
- **Route 2 — Characterful.** Newsreader + **Karrik** (Velvetyne, body/UI) +
  **Departure Mono** (readouts). Karrik's asymmetric terminals give the page a distinctly
  human, small-foundry signature. Highest differentiation, mild legibility cost at small
  sizes — test the labels before committing.
- **Route 3 — Monoline archive.** Newsreader + **Public Sans** + **Departure Mono** used
  far more heavily, for a declassified-technical-document read.

**Recommendation: Route 2 if Karrik holds up in the small-caps labels at 0.7rem; otherwise
Route 1.** Test it, don't guess.

Licensing: OFL or equivalent free-for-commercial only. Self-host `woff2` in
`public/assets/fonts/`, commit the license file, subset with `unicode-range` the way
Newsreader already is. No CDN, no `@import` from Google Fonts.

### 0.1b Commit the ink system

Read **§3.4 of the brief**. Two decisions are yours, and both need testing rather than
guessing:

1. **Pick the fluoro.** Riso Fluorescent Orange `#ff6c2f` vs. Fluorescent Pink `#ff48b0`,
   judged on the ivory ground beside oxidized orange and cobalt. Orange harmonises and is
   safer; pink is a genuine jolt and is the braver call for a room full of grey policy
   decks. Render both, look at them, commit to one. Art only — never a data mark.
2. **Build the halftone screen.** A reusable SVG dot-screen pattern plus filter in
   `base.css`, coarse enough to read as a printed screen at 100%. Worker B depends on this;
   publish its name in `HANDOFF.md`.

Also set up the **overprint primitive** — a utility that applies `mix-blend-mode: multiply`
so overlapping inks produce a real third colour. Verify orange over cobalt gives a plum and
that nothing overprints onto a figure plate (White Plate Rule).

Add tokens; never retune the frozen seven.

### 0.2 Rewrite `DESIGN.md`

Keep the existing frontmatter *shape* — it is machine-read. Update it to the new system.
Preserve every Named Rule that still applies (Frozen Plate, White Plate, Trace/Text
Separation, Color Carries State, Readout, One Instrument, Containing Block) and add rules
for anything new you introduce. The prose sections must describe the system as built, not
as aspired to.

### 0.3 Rewrite `public/base.css`

This is the shared foundation both pages load. It must contain:

- `@font-face` for the chosen faces, subset, `font-display: swap`
- The full token layer: the seven **frozen** chart tokens untouched and clearly commented as
  frozen, plus ground/text/type/scale/motion tokens
- The **page shell**: running head, folio, registration marks, grain layer
- The **`.sheet` grid**: 200px margin column + text column, collapsing at 1020px to inline
  asides
- Shared primitives: rules, small-caps labels, readouts, footnote markers + hanging notes,
  section marks, figure caption, focus ring, skip link, `@media (prefers-reduced-motion)`
  block

Worker B builds the methodology page **entirely out of these primitives**. If a primitive
belongs to both pages and it isn't in `base.css`, B can't use it. Be generous here.

### 0.4 Hand off

Commit. Then append to `.claude/revamp/HANDOFF.md`:

```
## PHASE 0 DONE — <timestamp>
Typographic route chosen: <route + one-line reason>
Fonts added: <files>
New base.css primitives available to B:
  - <class or custom property> — <what it's for>
  - ...
Tokens B may use: <list>
Tokens B must never touch: <the frozen seven>
```

Then tell the human: **"Phase 0 complete — start Worker B."**

---

## PHASE 1 — The instrument (parallel with B)

Rebuild the calculator page. Not a restyle — a re-architecture of the page against the
grid.

**Task 1 — Page architecture.** Rework `index.html` structure: running head, masthead,
abstract set to a 62–72ch measure, status rule, then the apparatus. **Delete
`dl.model-readiness` entirely** — it is a stat-tile row and it is the most AI-looking
element on the page. Fold that information into the abstract as prose or into the margin
column as a status note. Update the `<!-- THESIS / OWN-WORLD / STORY -->` comment block to
describe what you actually built.

**Task 2 — The control margin.** 350px ivory margin against the plate bay, sticky inner
wrapper, narrowing to 300px at 1020px, stacking at 760px. Scenario selectors as full-width
rows with a 2px left ink rule on the active row — state must survive greyscale. Impact
sensitivity as three cells, active cell inverting to paper-on-ink. Range controls with a
3px cobalt track and a narrow rectangular thumb. Square corners throughout, 34px minimum
target height, small-caps labels.

**Task 3 — The plates.** Six numbered figure plates on cool-white stock. Live readout on a
rule above the plot; caption below carrying `Fig. n`, title, then the plotted quantity.
Fine grey grid, dashed midnight baseline, oxidized-orange Firm A trace, cobalt Firm B
trace, soft-orange comparison area. No plate is ever a card.

**Task 4 — The signature moment (§4 of the brief).** Chart-recorder draw with a leading
tick; hover or keyboard-focus on any plate raises a synchronized vertical rule at that year
across **all six** plates with per-plate values in tabular monospace. Slider drags update
paths immediately without replaying the draw. Keyboard equivalent required — arrow keys
move the year rule. Everything disabled under reduced motion.

**Task 4b — The masthead plate.** The image people will photograph. Build it as inline SVG
in the first viewport: an Isotype-style array of unit marks standing for frontier R&D
compute. As the reader drags the policy slider, the reallocated share **flips from oxidized
orange to verdigris, mark by mark**. Halftone screen behind it, fluoro used once for the
plate's own device or number. It is the product's thesis as a picture, and it is live.

Constraints: it must be legible in greyscale (the flip is also a fill-pattern change, not
colour alone), it must not become a card, and it must degrade to a static state under
reduced motion. `aria-hidden` on the decorative parts; the live count gets a
`aria-live="polite"` text equivalent.

**Task 5 — Load reveal.** Reading-order orchestration, opacity + transform only. Obey the
Containing Block Rule: the apparatus fades, it never translates, or the sticky margin dies.

**Task 6 — Responsive.** 1440 / 1020 / 760 / 360. Navigation wraps and is never hidden.
Marginalia becomes inline asides, never disappears. Verify at 360px specifically.

Commit after each task. Update `HANDOFF.md` at the end of each.

---

## PHASE 2 — Convergence (after B reports Phase 1 done)

1. Read `.claude/revamp/PUNCHLIST.md` and fix every item under `## For A`.
2. Load both pages side by side. Any inconsistency in grid, type scale, rule weight, label
   treatment, or spacing between the two is a bug — fix it in `base.css` so it's fixed for
   both.
3. Run the full Studio Test (§5 of the brief). Verify by loading the site.
4. Paste the banlist grep output and the Studio Test results into `HANDOFF.md`.
5. Reconcile `DESIGN.md` against what actually shipped.

---

## Rules of engagement

- Verify visually. Load the site with `npm run dev` and look at it. If you have browser
  tooling available, screenshot at 1440 and 360 and actually examine the screenshots.
  Do not declare a visual result you have not seen.
- `npm test` and `npm run build` pass at every commit.
- Taste is a decision, not an average. Commit to a direction and execute it completely.
  A page that half-commits to four ideas is worse than one that fully commits to one.
- When in doubt: reach for a rule, a weight change, or a surface change — never a shadow.
