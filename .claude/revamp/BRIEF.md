# REVAMP BRIEF — "Working Paper No. 01"

**Both workers read this file first and treat it as binding. Do not renegotiate it.**

---

## 0. The mission

Opportunity FLOPs must look like it was art-directed by a prestige design studio for a
research institution — not generated. A policy researcher should assume a human
typographer spent a week on it. At a hackathon where every other demo is a dark-mode
Tailwind dashboard with a purple gradient, indistinguishability from *a real printed
working paper* is the entire competitive advantage.

The direction is **not** new. `DESIGN.md` already commits to "The Scientific Monograph"
and that commitment is correct. What is missing is **craft density**: the accumulation
of small, deliberate, unmistakably-human typographic decisions that no model produces
by default.

**Creative north star:** an *operable offprint*. A working paper from a research
institute — running heads, folio rules, section marks, numbered plates, hanging
marginalia, footnote apparatus, old-style figures in prose — except the figures are
live and the reader can operate them.

Reference altitude (do not copy, match the *level of care*): Edward Tufte's books,
Werkplaats Typografie, *Works in Progress*, *Asterisk*, Bureau of Land Management
survey atlases, Financial Times graphics desk, Criterion Collection liner notes.

---

## 1. Hard constraints — violating these is a build failure

1. **The Frozen Plate Rule.** `--ink`, `--panel`, `--rule`, `--rule-strong`, `--orange`,
   `--orange-soft`, `--blue` keep their exact current hex values. The six plots read them
   directly. You may *add* tokens. You may not retune these.
2. **The White Plate Rule.** Figure plates stay near-white. No grain, tint, texture, or
   overlay may sit on top of a plate.
3. **Spot inks, not a color scheme.** The palette is a small set of named printing inks
   (§3.4), each with a fixed semantic job. Color is allowed to be loud — but every ink must
   *mean* something. An ink used because a section looked empty is a defect.
4. **`public/model.js` and `test/` are untouchable.** Not one character. `npm test` must
   pass at every commit.
5. **Accessibility is not optional** (`PRODUCT.md`): keyboard-operable, legible at 360px
   width, state never signalled by color alone, `prefers-reduced-motion` respected.
6. **Voice:** analytically serious, concise, transparent about uncertainty. Never playful,
   never promotional. No mascot, no flip-flop, no character illustration, ever.
7. **Zero runtime dependencies.** Static files served by `server.mjs`. No npm packages,
   no CDN links, no build step. Fonts are self-hosted `woff2` under
   `public/assets/fonts/` with their OFL license committed alongside.

---

## 2. The banlist — grep for these before you claim done

Any hit is a defect unless explicitly justified in a code comment:

- `border-radius` with a non-zero value **anywhere** (the sweep marker is the sole exemption)
- `box-shadow` with a non-zero blur (zero-blur hairline rules are allowed)
- `linear-gradient`, `radial-gradient`, `conic-gradient`, `backdrop-filter`
- `Inter`, `Roboto`, `Open Sans`, `Lato`, `Poppins`, `Montserrat`, `system-ui` as a *primary* face
- Emoji anywhere in the UI
- Any element that reads as a **card**: a bordered/filled rectangle with internal padding
  floating on a contrasting ground, arranged in a 2/3/4-up grid
- "Stat tiles" / KPI chip rows (**this includes the current `dl.model-readiness`** — delete it)
- Centered symmetric hero → three feature blocks → CTA
- Generic UI copy: "Get Started", "Powerful", "Seamless", "Unlock", "Supercharge"
- `transition: all`
- Icon fonts and off-the-shelf SVG icon sets (Feather, Lucide, Heroicons, Font Awesome).
  Bespoke drawn marks are encouraged — see §3.5.
- Stock photography, 3D renders, glowing orbs, neural-network-node illustrations,
  AI-generated images. These are the single fastest tell. All imagery is drawn (§3.5).

---

## 3. The craft mandate — what actually produces the prestige read

These are the deliverables that create the difference. Ship as many as apply to your
surface.

### 3.1 Typographic apparatus
- **Running head** at the top of every page, above a hairline rule, in tracked small caps:
  `OPPORTUNITY FLOPS · WORKING PAPER 01 · REALLOCATION OF CAPABILITY COMPUTE · JULY 2026`
- **Folio line** at the foot of every page: section mark, short title, and a page/section
  ordinal in the printed convention.
- **Section marks**: `§ 1`, `§ 2` … set in the margin column, not inline in the heading.
- **Figure numbering**: `Fig. 1` … `Fig. 6` in oxidized-orange tracked small caps, with the
  caption *below* the plate — figure number, then title, then the plotted quantity.
- **Footnote apparatus**: superscript markers in prose, notes hung in the margin column at
  ≥1020px, collapsing to inline asides below that. Never dropped.
- **Old-style (text) figures in prose**, lining tabular figures in readouts and tables.
  `font-variant-numeric: oldstyle-nums` / `tabular-nums lining-nums`.
- **Real typographic characters**: `–` en dashes in ranges, `—` em dashes unspaced,
  `×` for multiplication, `′ ″` for primes, `≈ ≤ ≥ ±`, proper `“ ” ‘ ’`. No hyphens
  standing in for dashes. No `x` standing in for `×`.
- **Hanging punctuation** on pull quotes and margin notes where the browser allows.
- **Optical margin discipline**: the text measure is 62–72 characters. Never wider.

### 3.2 Grid
One grid, used identically on both pages: a centered container capped at 1460px with a
persistent **200px margin column** to the left of the text/instrument column. The margin
column carries section marks, figure numbers, footnotes, and status. It collapses below
1020px into inline asides. Asymmetry is the point — a centered single column is the
default everyone else ships.

Vertical rhythm on the existing `8 / 12 / 16 / 24 / 32 / 48 / 72 / 96 / 144` scale. Nothing
off-scale.

### 3.3 Print artifacts
- **Registration marks** in the four page corners — hairline CSS, `aria-hidden`, purely
  structural. Small. If they read as decoration, they're too big.
- **Paper grain**: one inline SVG `feTurbulence` layer at ≤4% opacity over the ivory
  ground only, `pointer-events: none`, `aria-hidden`. Must not cover the plates
  (White Plate Rule). Must be a single fixed-position layer, not repeated per section.
- **Rules do all structural work.** Hairline `--rule` for internal division, 1px `--ink`
  for structural boundary, 2px `--ink` for masthead and colophon. There is no elevation
  in this system and there never will be.

### 3.4 The ink system

The register is **risograph / two-colour offset**: warm stock, a handful of saturated spot
inks, visible overprint where they overlap, halftone screens instead of smooth fills. This
is a real printing process. That is why it reads as human — and it is the exact inverse of
the gradient-and-glow register every other demo will be in.

**The inks.** Three are already frozen by the charts. Two are new.

| Ink | Value | Job |
|---|---|---|
| Ink | `#101b2b` *(frozen)* | Text, structural rules, the baseline trajectory |
| Oxidized Orange | `#c84e2f` *(frozen)* | **Capability cost.** Firm A's trace, figure numbers |
| Cobalt | `#245b96` *(frozen)* | **Coordination.** Firm B's trace, controls, focus, range fills |
| Verdigris | `#2e7253` *(existing `--ready`)* | **Safety benefit.** Promote to a full ink |
| Ochre | `#a8791f` *(new)* | **Uncertainty.** Assumption bands, hatching, sensitivity ranges |
| Fluoro | *(new — A chooses)* | **Art only.** Masthead plate, section devices, colophon |

**Named rules — these are what keep it prestige rather than a rainbow dashboard:**

**The Semantic Ink Rule.** Every ink carries one meaning from the model, everywhere it
appears. Cost is always orange. Coordination is always cobalt. Safety is always verdigris.
Uncertainty is always ochre. A reader who learns the mapping on the calculator must find it
holding on the methodology page. Color is a legend, not a mood board.

**The Loud Ink Rule.** Fluoro appears **only in drawn imagery** — the masthead plate,
section devices, the colophon. It never touches a data mark, a control, or body text. This
is how a studio actually does it: high-energy ink in the art, sober ink in the figures.
Worker A tests Riso Fluorescent Orange `#ff6c2f` against Fluorescent Pink `#ff48b0` on the
ivory ground and commits to one.

**The Overprint Rule.** Where two inks overlap, they **multiply** —
`mix-blend-mode: multiply` — producing a genuine third colour the way real spot inks do.
Orange over cobalt gives a deep plum. That plum is earned, so it is allowed. A plum you
picked in a colour picker is not. Never fake overprint with a gradient.

**The Halftone Rule.** Tints are dot screens, never opacity fades and never gradients. An
SVG pattern or filter, coarse enough to be visibly a screen. This single decision does more
anti-slop work than anything else in this section.

**The White Plate Rule still binds.** No ink, screen, grain, or overprint may sit on top of
a figure plate. The frozen traces were chosen against near-white.

### 3.5 Imagery

The page needs pictures, and every one of them is **drawn** — inline SVG, built from the ink
system, keyed to the ivory ground. Zero dependencies, zero image files where a vector will
do. Reference register: Otto Neurath's Isotype, mid-century scientific atlases, ordnance
survey plates, printer's devices.

Four pieces to build:

1. **The masthead plate** *(A — calculator, first viewport).* An Isotype-style array of unit
   marks standing for frontier R&D compute. The share reallocated to alignment visibly
   flips from oxidized orange to verdigris **as the reader drags the policy slider**. It is
   the product's entire thesis as a picture, and it is live. This is the image people
   photograph.
2. **Section devices** *(B — methodology).* One bespoke diagram per section carrying the
   causal chain: compute → software progress → frontier capability → risk. Hairline
   construction plus one spot ink each. Small, precise, unmistakably drawn.
3. **The halftone screen** *(A — in `base.css`, used by both).* A reusable SVG dot-screen
   pattern and filter, so any surface or drawn shape can take a printed tint.
4. **The colophon device** *(B — foot of the paper).* A printer's mark. Fluoro, small,
   confident. The kind of detail that only exists when a person cared.

**Never:** stock photos, 3D renders, glowing orbs, abstract "AI" node-graphs, generated
imagery of any kind.

### 3.6 Motion
- One orchestrated page-load reveal in *reading order*: running head → title → abstract →
  status rule → apparatus. Opacity and transform only, `--ease-out`.
- **The Containing Block Rule:** the apparatus fades but never translates. Any `transform`
  — including an identity matrix — creates a containing block and breaks the sticky
  control margin inside it.
- All motion gated behind `@media (prefers-reduced-motion: reduce)`.

---

## 4. The signature moment

Every prestige site has one interaction people remember. Ours is the **synchronized
chart-recorder read**.

1. Traces draw left-to-right over ~720ms behind a 1px leading tick, like a pen plotter.
2. Hovering or keyboard-focusing *any* plate raises a **vertical rule at that year across
   all six plates simultaneously**, with each plate's value for that year in tabular
   monospace on its own readout line.
3. Dragging a slider updates all six paths immediately and does **not** replay the draw
   animation. The draw is reserved for entry and discrete scenario changes.

This is the thing that makes it read as an *instrument* rather than a page with charts on
it. Worker A owns it. It is not optional.

---

## 5. Acceptance bar — "The Studio Test"

Do not report done until all eight pass. Verify by loading the site, not by reasoning
about the code.

1. Screenshot the first viewport at 1440px. Could it be a real research institute's
   working paper? If a judge would guess "AI-generated," it fails.
2. Zero banlist hits (§2). Grep and paste the output.
3. Both pages share one grid, one type scale, one rule vocabulary. No surface looks
   like it came from a different project.
4. Every number on screen is set in the correct figure style (old-style in prose,
   tabular lining in readouts).
5. Full keyboard traverse of the calculator: reach and operate every control, visible
   3px cobalt focus ring at 2px offset, no traps.
6. 360px width: nothing clipped, nothing hidden, navigation wraps rather than disappears,
   marginalia becomes inline asides rather than vanishing.
7. `prefers-reduced-motion: reduce` — all motion off, nothing broken, nothing invisible.
8. `npm test` and `npm run build` both pass.
9. **Ink audit.** Point at every use of every ink and name the meaning it carries (§3.4). Any
   use you cannot justify semantically is decoration — remove it. Fluoro appears in drawn
   imagery only, never on a data mark or a control.
10. **Imagery audit.** Every image on the site is drawn vector built from the ink system. Zero
   stock, zero renders, zero generated imagery. The masthead plate responds live to the
   policy slider.

---

## 6. Working agreement

- **File ownership is exclusive.** Your worker file names the paths you own. Do not edit a
  file you do not own — file it on `PUNCHLIST.md` instead.
- **Commit small and often**, one concern per commit, on the branch you were told to use.
- **Update `HANDOFF.md`** whenever you complete a phase or need something from the other
  worker. That file is the only channel between the two chats.
- If you believe a constraint in this brief is wrong, say so once in `HANDOFF.md`, then
  follow it anyway.
