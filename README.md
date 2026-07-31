# Opportunity FLOPs

A small, model-driven policy calculator for exploring the economic opportunity
cost of reallocating frontier AI compute from capabilities R&D to alignment.

## Local development

```sh
npm run dev     # static server on http://127.0.0.1:3000
npm test        # model contract test
npm run build   # syntax check (what Vercel runs)
```

The site has no runtime dependencies. The economic model lives in `public/model.js` and
exposes a single `runModel(assumptions)` function. Its assumption definitions
drive the slider interface, allowing the model and UI to evolve independently.

## Layout

| File | Owns |
| --- | --- |
| `public/model.js` | The economic model. Owned by the modelling work. |
| `public/charts.js` | Dependency-free SVG line charts. Pure rendering, no model knowledge. |
| `public/app.js` | Presentation: builds controls, holds view state, feeds the charts. |
| `public/index.html` | Two tab panels — calculator and empirical dashboard. |
| `public/styles.css` | Presentation. |

`model.js` and `charts.js` never import each other, and neither `charts.js` nor
`styles.css` knows anything about economics — so the model and the interface can
be worked on at the same time without conflicts.

## How the UI connects to the model

The interface is built and working ahead of the model. While `runModel()` returns
`status: "pending-model"`, the page shows a "model not yet connected" banner,
live sliders, and charts drawn with axes, labels and legends but no lines. Every
value fills in on its own once the model returns results — no UI changes needed.

`app.js` imports the model as a namespace and treats everything except
`assumptionDefinitions` and `runModel` as optional, so it degrades cleanly.

### The adapter

One block at the top of `app.js` — `const read = { ... }` — is the only place
that knows the shape of `runModel()`'s result. To connect a model, either return
these fields or update the readers:

| Reader | Expects |
| --- | --- |
| `result.status` | anything other than `"pending-model"` |
| `result.headline` | preformatted string for the big number |
| `result.explanation` | sentence under the headline |
| `result.metrics` | `[{ label, value, sub }]` |
| `result.scenarios[key]` | `{ headline, sub }` for each comparison card |
| `result.series` | `[{ year, <scenarioKey>: { softwareIndex, softwareIndexBaseline, capabilityIndex, capabilityIndexBaseline } }]` |

### Optional model exports

Supply these and the UI picks them up automatically; omit them and it falls back
to view-level defaults.

- `SCENARIOS` — `[{ key, label, short, description }]`; otherwise the three
  scenarios from the brief are used as labels only.
- `POLICY_PRESETS` — `[{ key, label, ...assumptionValues }]` for the Low /
  Medium / High selector; otherwise levels are taken as fractions of each
  slider's own declared range.
- `MODEL_CONSTANTS.policyStartYear` / `.projectionYears` — chart x-axis domain;
  defaults to 2026 and 10 years.
- Per-assumption `group` (`policy` / `industry` / `technical` / `economic`) and
  `help` — sliders are grouped under headings and get a one-line description.
  Without them the sliders render as a single flat list.

## Deployment

The project is designed as a static Vercel deployment. The intended public URL
is `flops.keatonlee.org`.
