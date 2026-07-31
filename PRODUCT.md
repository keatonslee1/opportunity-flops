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
- Katherine's reduced-form model is implemented behind the `runModel(assumptions)` boundary in `public/model.js`.
- The model holds capability-oriented R&D compute fixed, applies the policy share to that compute, propagates the change through software progress, and translates software into a capability index while holding training compute equal.
- The interface supports no-reallocation, one-firm, and two-firm comparisons using the same model equations.
- The source parameter table defines roles and statuses for `A`, `β`, `γ`, `α`, and `δ`, but does not provide numerical Low, Medium, or High calibrations. Current preset values are working placeholders and must be labeled as such.
- The baseline software path is normalized from index 100 in 2026 to 200 in 2034. Outputs describe policy divergence from that reference path, not a forecast of absolute progress.
- Model assumptions, equations, uncertainty, and sensitivity must remain inspectable as the model matures.

## Brand Commitments

- The product name is Opportunity FLOPs.
- The visual system must not use the discarded flip-flop or mascot concept.
- The voice should be analytically serious, concise, transparent about uncertainty, and approachable without becoming playful or promotional.

## Evidence on Hand

- Stable model/UI contract in `public/model.js` and `test/model-contract.test.mjs`.
- Current product and methodology copy in `public/index.html`.
- Katherine's updated model specification and parameter-role table in `Epistemic Security Ideas for Hacking the Think Tank (1).pdf`.
- No validated parameter calibration is available yet; the interface must not present sensitivity outputs as empirical estimates or forecasts.

## Product Principles

- Make assumptions as visible as outputs.
- Compare policies in one continuous analytical workspace.
- Distinguish implemented equations from unvalidated parameter calibration.
- Preserve a stable handoff boundary for the modeling work.
- Prefer interpretability and direct manipulation over decorative complexity.

## Accessibility & Inclusion

The calculator must remain keyboard-operable, readable at mobile widths, legible without color alone, and respectful of reduced-motion preferences.
