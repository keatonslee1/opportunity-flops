/**
 * Side panel UI.
 *
 * Presentation only. The economic model is loaded from the deployed site and
 * executed unmodified in a sandboxed frame (see `model-bridge.js`); this file
 * never computes an economic quantity of its own.
 */

import { renderLineChart } from "./chart.js";
import {
  DEFAULT_ORIGIN,
  ModelBridge,
  loadModelSource,
  readSettings,
  writeSettings,
} from "./model-bridge.js";

// ── Model adapter ──────────────────────────────────────────────────────
//
// The ONLY place in the panel that knows the shape of `runModel()`'s result.
//
// Written against the model in `public/model.js`, which returns:
//
//   { status, assumptions, calibration, units, caveats,
//     series:  { years: [], software|softwareRate|capability:
//                  { baseline: [], firmA: [], firmB: [] } },
//     metrics: { evaluatedAtYear,
//                softwareSlowdown|softwareLevelGap|capabilityGap:
//                  { firmA, firmB } } }
//
// The scenario is an INPUT: it travels in the assumptions object, and the
// model returns firm A / firm B paths for whichever scenario was requested.
//
// Every reader returns null / [] when a field is absent, so a model that drops
// or renames something degrades to an empty state instead of throwing.

const read = {
  /** True until the model returns real output. */
  isPending: (result) =>
    !result || result.status === "pending-model" || !result.series,

  /** Shared x axis for every chart. */
  years: (result) =>
    Array.isArray(result?.series?.years)
      ? result.series.years.filter(Number.isFinite)
      : [],

  /**
   * One numeric path: `family` is software / softwareRate / capability,
   * `track` is baseline / firmA / firmB.
   */
  path: (result, family, track) => {
    const values = result?.series?.[family]?.[track];
    if (!Array.isArray(values)) return [];
    return values.every(Number.isFinite) ? values : [];
  },

  /** A single metric for one firm, as a raw fraction. */
  metric: (result, key, firm) => {
    const value = result?.metrics?.[key]?.[firm];
    return Number.isFinite(value) ? value : null;
  },

  /** The year the metrics are evaluated at. */
  evaluatedAtYear: (result) => result?.metrics?.evaluatedAtYear ?? null,

  /** Model-supplied unit strings, used verbatim for labels. */
  unit: (result, key) => result?.units?.[key] ?? null,

  /** The model's own hedging. Shown, never summarised. */
  caveats: (result) =>
    Array.isArray(result?.caveats) ? result.caveats.filter(Boolean) : [],

  /** Calibration block — horizon, preset label, whether it is empirical. */
  calibration: (result) => result?.calibration ?? null,
};

/**
 * Metric rows, in the order the panel shows them. Labels are view copy; every
 * value and unit comes from the model.
 */
const METRIC_ROWS = [
  { key: "softwareSlowdown", label: "Software progress slowdown" },
  { key: "softwareLevelGap", label: "Software level gap" },
  { key: "capabilityGap", label: "Capability gap" },
];

/** Chart id -> which series family it plots, and its caption. */
const CHART_FAMILIES = [
  { node: "softwareChart", family: "software", label: "Software progress S(t)" },
  { node: "capabilityChart", family: "capability", label: "Capability M(t)" },
];

/**
 * Formats a model fraction as a percentage. Presentation only — the number is
 * the model's, this just chooses how many digits to show.
 */
function asPercent(fraction, digits = 1) {
  return `${(fraction * 100).toFixed(digits)}%`;
}

/**
 * Scenario labels. The keys are the model's vocabulary — `runModel()` branches
 * on `assumptions.scenario`, treating "baseline" as the counterfactual and
 * "coordinated" as both firms reallocating; anything else is one firm acting
 * alone. The labels and descriptions are view copy.
 */
const FALLBACK_SCENARIOS = [
  {
    key: "baseline",
    label: "No reallocation",
    short: "Baseline",
    description: "Neither firm diverts compute. The counterfactual.",
  },
  {
    key: "unilateral",
    label: "One firm reallocates",
    short: "Unilateral",
    description: "One firm acts alone while the other keeps pushing the frontier.",
  },
  {
    key: "coordinated",
    label: "Both firms reallocate",
    short: "Coordinated",
    description: "Both firms reallocate under a common policy or commitment.",
  },
];

const EMPTY = "—";
const STATE_KEY = "panelState";

/**
 * The panel is long-lived — it stays open for as long as someone is reading —
 * so a copy of the model fetched on open can go stale in place. Re-check
 * periodically, and when the panel regains focus after a gap.
 */
const REVALIDATE_MS = 30 * 60 * 1000;
const FOCUS_REVALIDATE_MS = 5 * 60 * 1000;

// ── State ──────────────────────────────────────────────────────────────

const bridge = new ModelBridge();

const state = {
  origin: DEFAULT_ORIGIN,
  definitions: [],
  scenarios: FALLBACK_SCENARIOS,
  assumptions: {},
  scenario: null,
  modelReady: false,
  lastResult: null,
  lastPending: true,
  pageContext: null,
  /** Source text currently loaded in the sandbox, for change detection. */
  modelSource: null,
  lastCheckedAt: 0,
};

/** Guards against a slow run overwriting a newer one. */
let runToken = 0;

const sliders = new Map();

const nodes = {
  sourceStatus: document.querySelector("#source-status"),
  sourceStatusText: document.querySelector("#source-status-text"),
  sourceDot: document.querySelector("#source-status .dot"),
  banner: document.querySelector("#model-status"),
  loadError: document.querySelector("#load-error"),
  headline: document.querySelector("#headline-result"),
  note: document.querySelector("#result-note"),
  metrics: document.querySelector("#metric-grid"),
  scenarioLabel: document.querySelector("#active-scenario-label"),
  scenarioCards: document.querySelector("#scenario-cards"),
  controls: document.querySelector("#assumption-controls"),
  controlsEmpty: document.querySelector("#controls-empty"),
  softwareChart: document.querySelector("#chart-software"),
  capabilityChart: document.querySelector("#chart-capability"),
  settings: document.querySelector("#settings"),
  toggleSettings: document.querySelector("#toggle-settings"),
  originInput: document.querySelector("#origin-input"),
  reloadModel: document.querySelector("#reload-model"),
  reset: document.querySelector("#reset-assumptions"),
  openSite: document.querySelector("#open-site"),
  copySummary: document.querySelector("#copy-summary"),
  metricsUnit: document.querySelector("#metrics-unit"),
  caveatsBlock: document.querySelector("#caveats-block"),
  caveats: document.querySelector("#caveats"),
  calibration: document.querySelector("#calibration-note"),
  chartLegend: document.querySelector("#chart-legend"),
  chartNote: document.querySelector("#chart-note"),
  pageContext: document.querySelector("#page-context"),
  pageContextTitle: document.querySelector("#page-context-title"),
};

// ── Persistence ────────────────────────────────────────────────────────

async function saveState() {
  await chrome.storage.local.set({
    [STATE_KEY]: { assumptions: state.assumptions, scenario: state.scenario },
  });
}

async function restoreState() {
  const stored = await chrome.storage.local.get(STATE_KEY);
  return stored[STATE_KEY] ?? null;
}

// ── Controls ───────────────────────────────────────────────────────────

/**
 * The model declares enumerated assumptions as `type: "choice"`; "select" is
 * accepted too so an older or differently-worded definition still renders.
 */
function isChoice(definition) {
  return (
    (definition.type === "choice" || definition.type === "select")
    && Array.isArray(definition.options)
  );
}

function displayValue(definition, value) {
  if (isChoice(definition)) {
    return (
      definition.options.find((o) => o.value === value)?.label ?? String(value)
    );
  }
  const step = Number(definition.step) || 1;
  const digits = step < 1 ? String(step).split(".")[1].length : 0;
  return `${Number(value).toFixed(digits)}${definition.suffix ?? ""}`;
}

/** Paints the filled portion of the track, matching the site's range styling. */
function paintTrack(input, definition, value) {
  const span = definition.max - definition.min;
  const progress = span > 0 ? ((value - definition.min) / span) * 100 : 0;
  input.style.setProperty("--fill", `${progress}%`);
}

function buildSlider(definition) {
  const row = document.createElement("label");
  row.className = "control";

  const title = document.createElement("span");
  title.className = "control-label";
  title.textContent = definition.label;

  const output = document.createElement("output");
  output.textContent = displayValue(definition, state.assumptions[definition.key]);

  const input = document.createElement("input");
  input.type = "range";
  input.min = definition.min;
  input.max = definition.max;
  input.step = definition.step;
  input.value = state.assumptions[definition.key];
  input.setAttribute("aria-label", definition.label);
  paintTrack(input, definition, state.assumptions[definition.key]);
  input.addEventListener("input", () => {
    setAssumption(definition.key, Number(input.value));
  });

  row.append(title, output, input);
  sliders.set(definition.key, { input, output });
  return row;
}

/**
 * Enumerated assumptions (currently the policy impact level) render as a
 * select. The option labels are view copy; what each level means numerically
 * is the model's to define.
 */
function buildSelect(definition) {
  const row = document.createElement("label");
  row.className = "control control-choice";

  const title = document.createElement("span");
  title.className = "control-label";
  title.textContent = definition.label;

  const input = document.createElement("select");
  input.setAttribute("aria-label", definition.label);
  for (const option of definition.options) {
    const node = document.createElement("option");
    node.value = option.value;
    node.textContent = option.label;
    input.append(node);
  }
  input.value = state.assumptions[definition.key];
  input.addEventListener("change", () => {
    setAssumption(definition.key, input.value);
  });

  row.append(title, input);
  sliders.set(definition.key, { input, output: null });
  return row;
}

function buildControl(definition) {
  return isChoice(definition) ? buildSelect(definition) : buildSlider(definition);
}

function mountAssumptionControls() {
  nodes.controls.replaceChildren();
  sliders.clear();
  for (const definition of state.definitions) {
    nodes.controls.append(buildControl(definition));
  }
  nodes.controlsEmpty.hidden = state.definitions.length > 0;
}

function setAssumption(key, value) {
  state.assumptions[key] = value;
  const definition = state.definitions.find((d) => d.key === key);
  const control = sliders.get(key);
  if (control && definition) {
    if (control.input.value !== String(value)) control.input.value = value;
    if (control.output) {
      control.output.textContent = displayValue(definition, value);
    }
    if (!isChoice(definition)) paintTrack(control.input, definition, value);
  }
  saveState();
  render();
}

function syncSliders() {
  for (const definition of state.definitions) {
    const value = state.assumptions[definition.key];
    const control = sliders.get(definition.key);
    if (!control) continue;
    control.input.value = value;
    if (control.output) {
      control.output.textContent = displayValue(definition, value);
    }
    if (!isChoice(definition)) paintTrack(control.input, definition, value);
  }
}

// ── Scenario rows ──────────────────────────────────────────────────────

function mountScenarioCards() {
  nodes.scenarioCards.replaceChildren();
  for (const scenario of state.scenarios) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "scenario-card";
    card.dataset.scenario = scenario.key;

    const name = document.createElement("span");
    name.className = "scenario-name";
    name.textContent = scenario.label;

    const metric = document.createElement("span");
    metric.className = "scenario-metric";
    metric.dataset.role = "metric";
    metric.textContent = EMPTY;

    card.append(name, metric);

    // Only the selected row shows its description, which keeps three options
    // legible in a narrow panel without hiding the reasoning entirely.
    if (scenario.description) {
      const desc = document.createElement("span");
      desc.className = "scenario-desc";
      desc.textContent = scenario.description;
      card.append(desc);
    }
    card.addEventListener("click", () => {
      state.scenario = scenario.key;
      saveState();
      render();
    });
    nodes.scenarioCards.append(card);
  }
}

// ── Status ─────────────────────────────────────────────────────────────

function setSourceStatus(stateName, text) {
  nodes.sourceDot.dataset.state = stateName;
  nodes.sourceStatusText.textContent = text;
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ── Render ─────────────────────────────────────────────────────────────

function renderResult(result, pending) {
  const scenario = state.scenarios.find((s) => s.key === state.scenario);
  nodes.scenarioLabel.textContent = scenario?.short ?? scenario?.label ?? "";

  // The model publishes no headline string, so the panel promotes the metric
  // that answers the brief's question: how far behind the frontier firm ends up.
  const headline = pending ? null : read.metric(result, "capabilityGap", "firmA");
  nodes.headline.textContent = headline === null ? EMPTY : asPercent(headline);

  const year = read.evaluatedAtYear(result);
  nodes.note.textContent =
    pending || headline === null
      ? ""
      : `Frontier-firm capability shortfall against baseline${year ? ` at ${year}` : ""}.`;

  // Metric rows: firm A and firm B side by side.
  nodes.metrics.replaceChildren();
  for (const row of METRIC_ROWS) {
    const a = pending ? null : read.metric(result, row.key, "firmA");
    const b = pending ? null : read.metric(result, row.key, "firmB");

    const dt = document.createElement("dt");
    dt.textContent = row.label;

    const dd = document.createElement("dd");
    if (a === null && b === null) {
      dd.className = "is-empty";
      dd.textContent = EMPTY;
    } else {
      const strong = document.createElement("strong");
      strong.textContent = a === null ? EMPTY : asPercent(a);
      dd.append(strong);
      // Only worth showing firm B separately when the two actually differ.
      if (b !== null && a !== null && Math.abs(a - b) > 1e-9) {
        const span = document.createElement("span");
        span.textContent = `firm B ${asPercent(b)}`;
        dd.append(span);
      }
    }
    nodes.metrics.append(dt, dd);
  }

  const unit = read.unit(result, "metrics");
  nodes.metricsUnit.textContent = pending || !unit ? "" : unit;
  nodes.metricsUnit.hidden = pending || !unit;

  for (const card of nodes.scenarioCards.children) {
    const key = card.dataset.scenario;
    card.setAttribute("aria-pressed", String(state.scenario === key));
    // The model answers for one scenario at a time, so per-row figures would
    // mean three extra runs; the row shows its description instead.
    card.querySelector('[data-role="metric"]').textContent =
      state.scenario === key && !pending && headline !== null
        ? asPercent(headline)
        : "";
  }

  renderCaveats(result, pending);
}

/**
 * The model ships its own hedging — that the baseline is normalised rather
 * than forecast, that the presets are working assumptions. Showing its numbers
 * without them would overstate what the panel knows.
 */
function renderCaveats(result, pending) {
  const caveats = pending ? [] : read.caveats(result);
  nodes.caveats.replaceChildren();
  nodes.caveatsBlock.hidden = caveats.length === 0;

  for (const caveat of caveats) {
    const li = document.createElement("li");
    li.textContent = caveat;
    nodes.caveats.append(li);
  }

  const calibration = pending ? null : read.calibration(result);
  if (calibration) {
    const bits = [];
    if (calibration.label) bits.push(calibration.label);
    if (calibration.presetEmpirical === false) bits.push("working placeholder values");
    nodes.calibration.textContent = bits.join(" · ");
    nodes.calibration.hidden = bits.length === 0;
  } else {
    nodes.calibration.hidden = true;
  }
}

/** Do two paths coincide? Used to avoid drawing a line twice. */
function samePath(a, b) {
  return (
    a.length > 0
    && a.length === b.length
    && a.every((value, i) => Math.abs(value - b[i]) < 1e-9)
  );
}

/**
 * Decides which traces a chart actually needs, from the numbers rather than
 * from the scenario's name.
 *
 * The model collapses firms depending on the scenario — under the
 * counterfactual both track the baseline, under coordination both take the
 * same path. Drawing a line per firm regardless would put two identical
 * strokes on top of each other and imply a difference that is not there.
 */
function tracksFor(baseline, firmA, firmB) {
  const tracks = [
    { key: "baseline", label: "Baseline", color: "var(--ink)", dashed: true, values: baseline },
  ];
  if (!firmA.length) return tracks;

  const aIsBaseline = samePath(firmA, baseline);
  const bIsBaseline = samePath(firmB, baseline);

  if (samePath(firmA, firmB)) {
    // Both firms on one path: draw it once, named for what it represents.
    if (!aIsBaseline) {
      tracks.push({ key: "both", label: "Both firms", color: "var(--orange)", values: firmA });
    }
    return tracks;
  }

  if (!aIsBaseline) {
    tracks.push({ key: "firmA", label: "Firm A", color: "var(--orange)", values: firmA });
  }
  if (firmB.length && !bIsBaseline) {
    tracks.push({ key: "firmB", label: "Firm B", color: "var(--blue)", values: firmB });
  }
  return tracks;
}

/**
 * Plots the selected scenario against the baseline. The model returns
 * baseline / firm A / firm B paths for whichever scenario it was asked about.
 */
function renderCharts(result, pending) {
  const xValues = pending ? [] : read.years(result);
  let legendTracks = [];

  for (const chart of CHART_FAMILIES) {
    const unit = read.unit(result, chart.family);
    const tracks = pending
      ? [{ key: "baseline", label: "Baseline", color: "var(--ink)", dashed: true, values: [] }]
      : tracksFor(
          read.path(result, chart.family, "baseline"),
          read.path(result, chart.family, "firmA"),
          read.path(result, chart.family, "firmB"),
        );
    if (tracks.length > legendTracks.length) legendTracks = tracks;

    renderLineChart(nodes[chart.node], {
      xValues,
      yLabel: unit ? `${chart.label} — ${unit}` : chart.label,
      placeholder: pending ? "Awaiting economic model" : "No series for this scenario",
      series: tracks,
    });
  }

  // Legend mirrors exactly what got drawn.
  nodes.chartLegend.replaceChildren();
  for (const track of legendTracks) {
    const item = document.createElement("span");
    const line = document.createElement("span");
    line.className = `legend-line${track.dashed ? " baseline" : ""}`;
    if (!track.dashed) line.style.borderColor = track.color;
    item.append(line, document.createTextNode(track.label));
    nodes.chartLegend.append(item);
  }

  const scenario = state.scenarios.find((s) => s.key === state.scenario);
  const onlyBaseline = !pending && legendTracks.length === 1;
  nodes.chartNote.textContent = pending
    ? ""
    : onlyBaseline
      ? "Both firms track the baseline under this scenario."
      : (scenario?.description ?? "");
}

/** Single entry point for every view, so no caller can update one and not the other. */
function paint(result, pending) {
  state.lastResult = result;
  state.lastPending = pending;
  renderResult(result, pending);
  renderCharts(result, pending);
}

/**
 * Plain-text summary for pasting into notes alongside whatever is being read.
 * Reports the pending state honestly rather than emitting blank rows.
 */
function summaryText() {
  const result = state.lastResult ?? {};
  const pending = state.lastPending;
  const scenario = state.scenarios.find((s) => s.key === state.scenario);
  const lines = [];

  lines.push(`Opportunity FLOPs — ${scenario?.label ?? "scenario"}`);
  lines.push(
    pending
      ? "Result: awaiting economic model (runModel() has not returned results)"
      : `Capability gap, firm A: ${
          read.metric(result, "capabilityGap", "firmA") === null
            ? EMPTY
            : asPercent(read.metric(result, "capabilityGap", "firmA"))
        }${read.evaluatedAtYear(result) ? ` at ${read.evaluatedAtYear(result)}` : ""}`,
  );

  lines.push("", "Assumptions");
  for (const definition of state.definitions) {
    lines.push(`- ${definition.label}: ${displayValue(definition, state.assumptions[definition.key])}`);
  }
  lines.push(`- Scenario: ${scenario?.label ?? state.scenario}`);

  if (!pending) {
    const unit = read.unit(result, "metrics");
    lines.push("", `Metrics${unit ? ` (${unit})` : ""}`);
    for (const row of METRIC_ROWS) {
      const a = read.metric(result, row.key, "firmA");
      const b = read.metric(result, row.key, "firmB");
      if (a === null && b === null) continue;
      const parts = [`firm A ${a === null ? EMPTY : asPercent(a)}`];
      if (b !== null) parts.push(`firm B ${asPercent(b)}`);
      lines.push(`- ${row.label}: ${parts.join(", ")}`);
    }

    // A pasted summary carries the model's hedging with it.
    const caveats = read.caveats(result);
    if (caveats.length) {
      lines.push("", "Model caveats");
      for (const caveat of caveats) lines.push(`- ${caveat}`);
    }
  }

  if (state.pageContext) {
    lines.push("", `Reading: ${state.pageContext.title || state.pageContext.url}`);
    if (state.pageContext.title) lines.push(state.pageContext.url);
  }

  lines.push("", `Model source: ${state.origin}`, `Captured: ${formatTime(Date.now())}`);
  return lines.join("\n");
}

// ── Page context ───────────────────────────────────────────────────────

/** Pages that are never the thing someone is "reading". */
const OPAQUE_SCHEMES = /^(chrome|chrome-extension|edge|about|devtools|view-source):/;

/**
 * Tracks the active tab so a copied summary can record what prompted it.
 *
 * Read-only and local: the title and URL are shown in the panel and included
 * in a summary you explicitly copy. Nothing is stored or transmitted.
 */
async function refreshPageContext() {
  let tab = null;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch {
    // No tabs permission, or nothing queryable — the feature just stays off.
  }

  const usable = tab?.url && !OPAQUE_SCHEMES.test(tab.url);
  state.pageContext = usable ? { title: tab.title ?? "", url: tab.url } : null;

  nodes.pageContext.hidden = !state.pageContext;
  if (state.pageContext) {
    const { title, url } = state.pageContext;
    nodes.pageContextTitle.textContent = title || url;
    nodes.pageContext.title = url;
  }
}

function watchPageContext() {
  if (!chrome.tabs?.onActivated) return;
  chrome.tabs.onActivated.addListener(refreshPageContext);
  chrome.tabs.onUpdated.addListener((_id, change, tab) => {
    // Only the active tab's own title/URL changes matter here.
    if (tab.active && (change.title || change.url)) refreshPageContext();
  });
  chrome.windows?.onFocusChanged?.addListener(refreshPageContext);
  refreshPageContext();
}

async function copySummary() {
  const button = nodes.copySummary;
  try {
    await navigator.clipboard.writeText(summaryText());
    button.textContent = "Copied";
  } catch (error) {
    console.error("clipboard write failed", error);
    button.textContent = "Failed";
  }
  setTimeout(() => {
    button.textContent = "Copy";
  }, 1600);
}

async function render() {
  if (!state.modelReady) {
    paint({}, true);
    return;
  }

  const token = ++runToken;
  let result;
  try {
    // The scenario is an input, not a view filter — the model branches on it.
    result = await bridge.run({ ...state.assumptions, scenario: state.scenario });
  } catch (error) {
    console.error("runModel failed", error);
    result = null;
  }
  // A newer run started while this one was in flight.
  if (token !== runToken) return;

  const pending = read.isPending(result);
  nodes.banner.hidden = !pending;
  paint(result ?? {}, pending);
}

// ── Boot ───────────────────────────────────────────────────────────────

function applyDefinitions(exports, restored) {
  // The model owns its assumptions outright — the panel appends nothing.
  state.definitions = exports.assumptionDefinitions ?? [];
  state.scenarios = exports.SCENARIOS ?? FALLBACK_SCENARIOS;

  const defaults = Object.fromEntries(
    state.definitions.map((d) => [d.key, d.value]),
  );
  // Restored values only survive if the model still declares that assumption.
  const restoredAssumptions = restored?.assumptions ?? {};
  state.assumptions = Object.fromEntries(
    Object.keys(defaults).map((key) => [
      key,
      key in restoredAssumptions ? restoredAssumptions[key] : defaults[key],
    ]),
  );

  const fallbackScenario =
    state.scenarios[state.scenarios.length - 1]?.key ?? null;
  state.scenario = state.scenarios.some((s) => s.key === restored?.scenario)
    ? restored.scenario
    : fallbackScenario;
}

async function connectModel({ announce = true } = {}) {
  if (announce) setSourceStatus("loading", "Loading model…");
  nodes.loadError.hidden = true;
  state.modelReady = false;

  let source;
  try {
    source = await loadModelSource(state.origin);
  } catch (error) {
    setSourceStatus("error", "Model unavailable");
    nodes.loadError.hidden = false;
    nodes.loadError.textContent = `Could not load ${state.origin}/model.js — ${error.message}. Check the model source, then reload.`;
    nodes.banner.hidden = true;
    state.definitions = [];
    mountAssumptionControls();
    paint({}, true);
    return;
  }

  try {
    const exports = await bridge.load(source.source);
    applyDefinitions(exports, await restoreState());
    state.modelReady = true;
    state.modelSource = source.source;
    state.lastCheckedAt = Date.now();

    mountAssumptionControls();
    mountScenarioCards();
    showSourceState(source);

    await render();
  } catch (error) {
    setSourceStatus("error", "Model failed to run");
    nodes.loadError.hidden = false;
    nodes.loadError.textContent = `The model at ${state.origin} could not be evaluated — ${error.message}`;
    paint({}, true);
  }
}

function showSourceState(source, { updated = false } = {}) {
  const host = new URL(state.origin).host;
  if (source.from === "network") {
    setSourceStatus("live", updated ? `Updated — ${host}` : `Live — ${host}`);
  } else {
    setSourceStatus("cached", `Cached ${formatTime(source.fetchedAt)} — ${host}`);
  }
}

/**
 * Re-fetches the model and swaps it in only when the source actually changed,
 * so a routine check never disturbs the panel or resets someone's inputs.
 */
async function revalidate() {
  if (!state.modelReady) return;
  state.lastCheckedAt = Date.now();

  let source;
  try {
    source = await loadModelSource(state.origin);
  } catch {
    // Offline mid-session is not worth interrupting a reader for; the panel
    // keeps running the model it already has.
    return;
  }

  if (source.from !== "network" || source.source === state.modelSource) return;

  try {
    const exports = await bridge.load(source.source);
    // Current values are carried across, not the values from the last save.
    applyDefinitions(exports, {
      assumptions: state.assumptions,
      scenario: state.scenario,
    });
    state.modelSource = source.source;

    mountAssumptionControls();
    mountScenarioCards();
    showSourceState(source, { updated: true });

    await render();
  } catch (error) {
    console.error("revalidate failed", error);
  }
}

async function boot() {
  const settings = await readSettings();
  state.origin = settings.origin;
  nodes.originInput.value = state.origin;
  nodes.openSite.href = state.origin;

  nodes.toggleSettings.addEventListener("click", () => {
    const open = nodes.settings.hidden;
    nodes.settings.hidden = !open;
    nodes.toggleSettings.setAttribute("aria-expanded", String(open));
  });

  nodes.reloadModel.addEventListener("click", async () => {
    const candidate = nodes.originInput.value.trim() || DEFAULT_ORIGIN;
    try {
      state.origin = new URL(candidate).origin;
    } catch {
      setSourceStatus("error", "That is not a valid origin");
      nodes.loadError.hidden = false;
      nodes.loadError.textContent = `“${candidate}” is not a valid origin. Use a full origin such as ${DEFAULT_ORIGIN}.`;
      return;
    }
    nodes.originInput.value = state.origin;
    nodes.openSite.href = state.origin;
    await writeSettings({ origin: state.origin });
    await connectModel();
  });

  nodes.copySummary.addEventListener("click", copySummary);

  nodes.reset.addEventListener("click", () => {
    for (const definition of state.definitions) {
      state.assumptions[definition.key] = definition.value;
    }
    syncSliders();
    saveState();
    render();
  });

  // Paint the empty layout immediately so the panel never flashes blank.
  mountScenarioCards();
  paint({}, true);

  await connectModel();

  watchPageContext();

  setInterval(revalidate, REVALIDATE_MS);
  window.addEventListener("focus", () => {
    if (Date.now() - state.lastCheckedAt > FOCUS_REVALIDATE_MS) revalidate();
  });
}

boot();
