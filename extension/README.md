# Opportunity FLOPs — Chrome side panel

A Manifest V3 extension that keeps a compact Opportunity FLOPs calculator in the
Chrome side panel, so the assumptions stay on screen while you read a paper or a
policy announcement in the main window.

Zero build step and zero dependencies, matching the main project: the files in
this directory are loaded by Chrome exactly as they are committed.

## Load it unpacked

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this `extension/` directory.
4. Pin **Opportunity FLOPs** to the toolbar, then click it to open the side
   panel. The panel stays open as you browse and change tabs.

Requires Chrome 114 or newer, which is when `chrome.sidePanel` shipped.

After editing any file here, press the reload arrow on the extension's card in
`chrome://extensions`, then reopen the side panel.

## Where the numbers come from

**This extension contains no economic modelling code.** The model is owned by a
teammate and lives in the site's `public/model.js`. The panel loads that exact
file from the deployed site and runs it unmodified:

```
sidepanel.js  ──fetch──▶  https://flops.keatonlee.org/model.js
     │
     └──postMessage──▶  model-host.html  (sandboxed frame, opaque origin)
                              │
                              └─▶  import(blob)  ──▶  runModel(assumptions)
```

The sandboxed frame is what makes this possible without copying the model into
the extension, where it would immediately go stale. The frame has an opaque
origin and none of the extension's permissions, so site code cannot reach
`chrome.*` APIs, storage, or your tabs.

Consequences worth knowing:

- **The panel needs network access on first run.** The fetched source is cached
  in `chrome.storage.local`, so later opens work offline and fall back to the
  last good copy when the site is unreachable.
- **It re-checks while open.** A side panel can stay open for hours, so the
  model is revalidated every 30 minutes and when the panel regains focus after a
  five-minute gap. The swap happens only if the source actually changed, and
  current slider values are carried across — a routine check never resets your
  inputs. The status line reads `Updated` when a new model has been picked up.
- **Because it executes code fetched at runtime, this extension is intended for
  unpacked / internal use.** The Chrome Web Store's remotely-hosted-code policy
  would reject it as-is. Publishing it would mean vendoring `model.js` at
  release time — a packaging decision for whoever owns the release, not
  something this extension should do behind the model owner's back.
- **The model is still a stub.** `runModel()` currently returns
  `status: "pending-model"`, so the panel shows its empty state with the sliders
  live. It fills in on its own once the real model lands — no change needed
  here.

### Pointing at a local server

Click **Source** in the panel header and set the origin to
`http://127.0.0.1:3000`, then **Reload model**, to work against `npm run dev`
from the repository root. The choice persists.

## What the panel shows

- **Result** — the model's headline figure, explanation and metric rows. Rows
  are labelled before values exist so the layout reads correctly while pending.
- **Scenario** — no reallocation / one firm / both firms. Uses the model's own
  `SCENARIOS` export when it publishes one, otherwise the brief's labels.
- **Assumptions** — one control per entry in the model's `assumptionDefinitions`:
  a slider normally, or a select for entries declaring `type: "select"` with an
  `options` array. Nothing is hardcoded: if the model adds, removes or renames an
  assumption, the panel follows. Values persist across panel opens and reset to
  the model's own defaults.
- **Policy impact level** — the brief's second dashboard parameter. The panel
  appends a Low / Medium / High select *only while the model stays silent about
  it*; if the model declares its own `policyImpactLevel`, that declaration wins
  outright. Either way the choice reaches `runModel()` in the assumptions object.
  The labels are view copy — what each level means numerically is the model's to
  define.

## Files

| File | Role |
| --- | --- |
| `manifest.json` | MV3 manifest: side panel, action, sandbox and permissions |
| `background.js` | Service worker; opens the panel on toolbar click |
| `sidepanel.html` / `.css` / `.js` | The panel itself — presentation only |
| `model-bridge.js` | Fetches and caches `model.js`; owns the sandbox transport |
| `model-host.html` / `model-host.js` | Sandboxed frame that evaluates the model |
| `icons/` | 16/32/48/128 px, downscaled from the site's `public/favicon-512.png` |

`sidepanel.js` keeps a `read` adapter that is deliberately identical to the one
in `public/app.js`. It is the only place that knows the shape of `runModel()`'s
result, so when the model lands, both the site and this panel update from the
same field names.

## Scope

This directory is self-contained. The extension reads nothing from `public/` at
runtime and changes nothing outside `extension/` — the icons are the only thing
derived from the site, and they are committed copies.

Not included yet, in rough priority order:

- **Charts.** The site's `charts.js` renders trajectory plots; the panel shows a
  numeric readout only. Sharing that renderer needs a decision about how
  `extension/` consumes site modules, which is the same question the model
  bridge answers — worth solving once, deliberately.
- **Barlow.** The panel declares the project's font stack but does not bundle
  the TTFs, so it renders in Trebuchet MS unless Barlow is installed locally.
  Bundling means copying four font files and the OFL notice into `extension/`.
- **Page context.** Capturing the title or DOI of the paper being read alongside
  a saved assumption set.
