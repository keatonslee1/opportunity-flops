---
name: Opportunity FLOPs
description: Flight-test telemetry workspace for inspectable AI R&D policy scenarios.
colors:
  cool-paper: "#f4f6f5"
  instrument-panel: "#fbfcfb"
  midnight-ink: "#101b2b"
  muted-slate: "#556070"
  fine-rule: "#c8d0d4"
  strong-rule: "#86919a"
  oxidized-orange: "#c84e2f"
  accessible-orange-text: "#9f381f"
  orange-wash: "#f0d5ca"
  cobalt-trace: "#245b96"
  cobalt-wash: "#d7e3ef"
  ready-green: "#2e7253"
typography:
  display:
    fontFamily: "Barlow, Trebuchet MS, sans-serif"
    fontSize: "clamp(2.65rem, 5.6vw, 5.75rem)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Barlow, Trebuchet MS, sans-serif"
    fontSize: "clamp(2rem, 3.5vw, 3.4rem)"
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Barlow, Trebuchet MS, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Barlow, Trebuchet MS, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "0.7rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.055em"
rounded:
  control: "3px"
  selection: "4px"
spacing:
  xs: "8px"
  sm: "14px"
  md: "18px"
  lg: "24px"
  xl: "28px"
components:
  reset-button:
    backgroundColor: "transparent"
    textColor: "{colors.midnight-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 11px"
    height: "36px"
  scenario-selected:
    backgroundColor: "{colors.instrument-panel}"
    textColor: "{colors.midnight-ink}"
    rounded: "{rounded.selection}"
    padding: "8px 12px"
  control-rack:
    backgroundColor: "#e9edef"
    textColor: "{colors.midnight-ink}"
    padding: "28px 26px"
  results-bay:
    backgroundColor: "{colors.instrument-panel}"
    textColor: "{colors.midnight-ink}"
    padding: "28px clamp(24px, 3.4vw, 54px) 36px"
---

# Design System: Opportunity FLOPs

## Overview

**Creative North Star: "The Flight-Test Telemetry Rack"**

Opportunity FLOPs is an analytically serious instrument workspace: cool-white equipment surfaces, midnight ink, fine plot rules, and calibrated accent traces keep assumptions and outputs in one continuous field. The composition should feel operated rather than browsed—dense enough for research, but quiet enough that state changes and caveats remain legible.

The visual hierarchy comes from typography, dividers, tonal surfaces, and synchronized plot motion. Decoration is subordinate to evidence; every bright color or animated sweep should carry status, comparison, or interaction meaning.

**Key Characteristics:**
- Continuous rack-and-results workspace rather than a card grid.
- Cool-white panels with clipped equipment-case geometry and fine rules.
- Cobalt controls and traces, oxidized-orange comparison strokes, and a darker orange reserved for readable text.
- Synchronized chart redraw and sweep motion with a reduced-motion fallback.

## Colors

The palette separates cool instrument neutrals from two functional trace colors, with darker orange text kept distinct from the brighter orange used for plotted geometry.

### Primary
- **Oxidized Orange:** Policy-comparison strokes and active visual traces.
- **Accessible Orange Text:** Warnings, result text, and disclaimers where the brighter chart orange does not provide sufficient text contrast.

### Secondary
- **Cobalt Trace:** Interactive controls, range fills, and the second-firm trajectory.

### Neutral
- **Cool Paper:** Page field beneath the instrument workspace.
- **Instrument Panel:** Primary results surface and selected-control fill.
- **Midnight Ink:** Main text and baseline trajectory.
- **Muted Slate:** Explanatory copy and secondary labels.
- **Fine Rule / Strong Rule:** Plot grid, dividers, and structural boundaries.

### Named Rules

**The Trace/Text Separation Rule.** Oxidized orange draws comparison geometry; accessible orange carries text. Do not swap their jobs.

**The Color Carries State Rule.** Accent color indicates scenario, status, or direct manipulation; it is not ambient decoration.

## Typography

**Display Font:** Barlow (with Trebuchet MS and sans-serif fallbacks)
**Body Font:** Barlow (with Trebuchet MS and sans-serif fallbacks)
**Label/Mono Font:** UI monospace (with SFMono-Regular, Menlo, Monaco, Consolas, and monospace fallbacks)

**Character:** Self-hosted Barlow in weights 400, 500, 600, and 700 keeps prose and headings compact and technical without becoming austere. Tabular readouts and plot labels switch to monospace, uppercase, and measured tracking.

### Hierarchy
- **Display:** Large, tightly tracked Barlow for the first-view thesis.
- **Headline:** Compact responsive Barlow for major explanatory sections.
- **Title:** Semibold Barlow for rack, results, and methodology headings.
- **Body:** Regular Barlow for explanations and assumptions.
- **Label:** Uppercase monospace for telemetry, legends, outputs, and chart metadata.

### Named Rules

**The Readout Rule.** Use monospace only for values, legends, status, and axis metadata; narrative remains in Barlow.

## Layout

The page uses a centered fluid container capped at 1460px with 24px outer gutters. The calculator is a single bordered workspace: a 350px control rack beside a flexible results bay, narrowing to 300px at 1020px and stacking at 760px. Major explanatory sections use asymmetric two-column grids, while internal rhythm repeatedly uses 8px, 14px, 18px, 24px, and 28px steps. Mobile removes the clipped corner, stacks comparison rows, and expands axis labels for legibility without introducing horizontal page overflow.

## Elevation & Depth

The system is flat by default. Depth comes from cool tonal layering and rule hierarchy; one broad, low-contrast shadow lifts the complete calculator workspace, while selected scenario rows use a smaller state shadow.

### Shadow Vocabulary
- **Workspace Lift:** A diffuse shadow under the unified calculator, never under every subsection.
- **Selection Lift:** A restrained shadow for the active scenario row.

### Named Rules

**The One Instrument Rule.** Elevate the calculator as one apparatus; do not turn its internal rack, charts, or comparison cells into floating cards.

## Shapes

Form language is rectilinear and equipment-like. The calculator uses a single 22px clipped top-right corner at desktop widths; controls use only 2–4px rounding, plot lines terminate square, and most structure is expressed with 1px rules. Circular geometry is reserved for the small readiness light and sweep marker.

## Components

### Buttons
- **Shape:** Compact rectangular control with a 3px radius and 36px minimum height.
- **Reset:** Transparent at rest with a strong rule; fills with the panel tone on hover.
- **Focus:** A 3px translucent cobalt outline with a 2px offset.

### Scenario Selectors
- **Style:** Full-width rows with transparent borders at rest and a cool-white fill, strong border, and low state shadow when selected.
- **Content:** Short bold option label paired with muted explanatory copy; state is conveyed by more than color alone.

### Range Controls
- **Style:** Three-pixel cobalt progress track with a narrow rectangular thumb edged by the panel tone.
- **Behavior:** Value output is uppercase monospace; fill and both charts update from the same input event.

### Cards / Containers
- **Corner Style:** Near-square internal corners and one clipped outer workspace corner.
- **Background:** Tonal separation between the pale rack and cool-white results bay.
- **Shadow Strategy:** Only the complete workspace and selected scenario receive elevation.
- **Border:** Fine internal rules and stronger perimeter rules.

### Navigation
- **Style:** Quiet Barlow links in dark slate; hover and keyboard focus shift to orange and add an offset underline. Desktop navigation hides at the mobile breakpoint.

### Trajectory Plots
- **Style:** Fine gray grid, dashed midnight baseline, oxidized-orange Firm A trace, cobalt Firm B trace, and a soft orange comparison area.
- **Motion:** All traces redraw over 720ms while a synchronized sweep crosses over 760ms using the same easing curve. Motion is effectively disabled when reduced motion is requested.

## Do's and Don'ts

### Do:
- **Do** keep assumptions, plots, statuses, and caveats in one continuous analytical workspace.
- **Do** preserve the orange text/chart-stroke distinction and label illustrative geometry explicitly.
- **Do** pair every chart update with synchronized trace and sweep behavior, while respecting reduced-motion preferences.
- **Do** use rules, typography, and tonal changes before adding elevation.

### Don't:
- **Don't** split the calculator into a grid of individually elevated cards.
- **Don't** use accent color as decoration or rely on color alone to communicate state.
- **Don't** introduce playful mascot, flip-flop, or character illustration into the instrument world.
- **Don't** present illustrative chart geometry as validated output or empirical results.
