# drafts/ — not for review

Scratch material parked on the `draft/model-reference` branch. **Nothing here is
imported by the site, and this branch is not intended to be merged or opened as
a pull request.** It exists so the work is recoverable rather than thrown away.

## Contents

| File | What it is |
| --- | --- |
| `model-reference.js` | A speculative implementation of the compute-reallocation model. |
| `model-reference.test.mjs.txt` | Its tests. Extension is `.txt` so `node --test` ignores them. |

## Status: superseded

`model-reference.js` was written before it was clear that the economic model is
owned by the empirical-analysis workstream. **It is not the project's model and
should not be treated as a starting point unless someone explicitly decides to.**
The real model lives at `public/model.js` on `main`.

It is kept only because it may be useful as a strawman — a record of one way the
pieces could fit together, and a set of assumption keys the UI already knows how
to render. Its numbers are unvalidated and its structural choices are guesses.

Two choices in it are worth flagging as genuinely open questions rather than
settled answers:

- **Capability vs software progress.** The brief lists `S(t)` and `M(t)` as
  separate outputs but does not say how they relate. This draft has slower
  algorithmic progress feed back into capability, so the `M(t)` gap opens wider
  than `S(t)`'s. That is an assumption, not a finding.
- **Frontier aggregation.** It takes aggregate progress as the share-weighted
  average of the two firms, per the brief's wording. If instead the frontier is
  set by whichever firm is *ahead*, unilateral action buys far less — a
  materially different policy conclusion.

## If you are looking for the UI

See `feat/dashboard-and-charts`. That branch contains the interface and charts,
leaves `public/model.js` untouched, and documents the adapter the model plugs
into. It does not depend on anything in this directory.
