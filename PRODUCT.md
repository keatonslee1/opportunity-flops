# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Policy researchers, technical governance researchers, and adjacent decision-makers who need to explore how reallocating frontier AI R&D compute to alignment could affect software progress and frontier capability timelines.

## Product Purpose

Opportunity FLOPs is an interactive calculator for comparing no reallocation, unilateral reallocation, and coordinated reallocation scenarios. It makes the assumptions and tradeoffs inspectable through controls, charts, and concise explanations.

Success means a user can configure a scenario, understand the direction and scale of the modeled effect, compare unilateral and coordinated policies, and identify which assumptions drive the result.

## Positioning

The product turns a reduced-form research model into an explorable policy instrument: inputs, scenario structure, trajectories, and caveats remain visible together instead of being split across a paper and a static figure.

## Operating Context

The tool is used during policy analysis, research discussion, presentations, and early-stage scenario comparison. Users adjust model assumptions and inspect charted trajectories over time.

## Capabilities and Constraints

- The existing application is a dependency-light static web interface served by Node.
- The economic model is being developed separately behind the existing `runModel(assumptions)` boundary in `public/model.js`.
- The interface must support one-firm and two-firm comparisons without coupling presentation logic to unfinished equations.
- Interim chart values must be explicitly labeled as illustrative and must not be presented as model findings.
- Model assumptions, equations, uncertainty, and sensitivity should remain inspectable as the model matures.

## Brand Commitments

- The product name is Opportunity FLOPs.
- The visual system must not use the discarded flip-flop or mascot concept.
- The voice should be analytically serious, concise, transparent about uncertainty, and approachable without becoming playful or promotional.

## Evidence on Hand

- Stable model/UI contract in `public/model.js` and `test/model-contract.test.mjs`.
- Current product and methodology copy in `public/index.html`.
- No validated numerical model output is available yet; the interface must not fabricate empirical results.

## Product Principles

- Make assumptions as visible as outputs.
- Compare policies in one continuous analytical workspace.
- Distinguish illustrative interface data from validated model results.
- Preserve a stable handoff boundary for the modeling work.
- Prefer interpretability and direct manipulation over decorative complexity.

## Accessibility & Inclusion

The calculator must remain keyboard-operable, readable at mobile widths, legible without color alone, and respectful of reduced-motion preferences.
