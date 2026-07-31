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
// The ONLY place in the panel that knows the shape of `runModel()`'s result,
// kept deliberately identical to the site's own adapter in `public/app.js` so
// both light up from the same model change. Each reader returns null / [] when
// the model has not supplied a field, which renders as an empty state.

const read = {
  /** Has the model been connected at all? */
  isPending: (result) => !result || result.status === "pending-model",

  /** Big number at the top of the calculator, as a preformatted string. */
  headline: (result) =>
    result.headline ??
    (typeof result.cumulativeLoss === "string" ? result.cumulativeLoss : null),

  /** Sentence under the headline. */
  explanation: (result) => result.explanation ?? null,

  /** [{ label, value, sub }] for the metric list. */
  metrics: (result) => result.metrics ?? [],

  /** Per-scenario summary for the scenario rows. */
  scenarioSummary: (result, key) => result.scenarios?.[key] ?? null,

  /** Raw time-series rows. */
  rows: (result) => (Array.isArray(result?.series) ? result.series : []),

  /** X axis, taken from whichever field the model uses for time. */
  years: (result) =>
    read.rows(result)
      .map((row) => row.year ?? row.t)
      .filter(Number.isFinite),

  /**
   * Pulls one numeric field from every row for a scenario, optionally per firm.
   * Returns [] the moment a row is missing the field, so a partial series never
   * renders as a complete trace.
   */
  values: (result, scenarioKey, field, firm) => {
    const out = [];
    for (const row of read.rows(result)) {
      const scoped = row[scenarioKey];
      if (!scoped) return [];
      const source = firm ? scoped[firm] : scoped;
      const value = source?.[field];
      if (!Number.isFinite(value)) return [];
      out.push(value);
    }
    return out;
  },
};

/** Chart id -> the model fields it plots. */
const CHART_FIELDS = {
  software: { value: "softwareIndex", baseline: "softwareIndexBaseline" },
  capability: { value: "capabilityIndex", baseline: "capabilityIndexBaseline" },
};

/**
 * The scenario rows use the brief's keys; a model is likelier to call the
 * counterfactual `none` than `baseline`. Accept either rather than forcing a
 * convention on the model owner.
 */
function resolveScenarioKey(result, uiScenario) {
  const rows = read.rows(result);
  if (!rows.length) return null;
  const candidates =
    uiScenario === "none" ? ["none", "baseline"] : [uiScenario];
  return candidates.find((key) => rows[0][key]) ?? null;
}

/**
 * Scenario labels come from the project brief. These are view copy — if the
 * model publishes its own `SCENARIOS`, that wins.
 */
const FALLBACK_SCENARIOS = [
  {
    key: "none",
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

/**
 * Row labels the calculator reserves for the model's summary metrics. Purely
 * captions — values arrive via `read.metrics()`.
 */
const PLANNED_METRICS = [
  "Software progress slowdown",
  "Capability lag",
  "Delay in productivity gains",
  "Unilateral vs coordinated",
];

/**
 * Policy impact level — the brief's second dashboard parameter, independent of
 * the compute percentage. Labels only: what Low / Medium / High mean
 * numerically is the model's to define. The selected key reaches runModel() in
 * the assumptions object as `policyImpactLevel`.
 *
 * If the model declares its own `policyImpactLevel` definition, that wins.
 */
const IMPACT_KEY = "policyImpactLevel";

const FALLBACK_IMPACT = {
  key: IMPACT_KEY,
  label: "Policy impact level",
  type: "select",
  options: [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ],
  value: "medium",
  suppliedByUi: true,
};

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

function isSelect(definition) {
  return definition.type === "select" && Array.isArray(definition.options);
}

function displayValue(definition, value) {
  if (isSelect(definition)) {
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
  return isSelect(definition) ? buildSelect(definition) : buildSlider(definition);
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
    if (!isSelect(definition)) paintTrack(control.input, definition, value);
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
    if (!isSelect(definition)) paintTrack(control.input, definition, value);
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

  nodes.headline.textContent = pending ? EMPTY : (read.headline(result) ?? EMPTY);
  nodes.note.textContent = pending ? "" : (read.explanation(result) ?? "");

  const metrics = pending ? [] : read.metrics(result);
  nodes.metrics.replaceChildren();

  if (!metrics.length) {
    // Show the labelled rows the model is expected to fill, so the layout
    // reads correctly before the numbers exist.
    for (const label of PLANNED_METRICS) {
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.className = "is-empty";
      dd.textContent = EMPTY;
      nodes.metrics.append(dt, dd);
    }
  } else {
    for (const metric of metrics) {
      const dt = document.createElement("dt");
      dt.textContent = metric.label;
      const dd = document.createElement("dd");
      const strong = document.createElement("strong");
      strong.textContent = metric.value;
      dd.append(strong);
      if (metric.sub) {
        const span = document.createElement("span");
        span.textContent = metric.sub;
        dd.append(span);
      }
      nodes.metrics.append(dt, dd);
    }
  }

  for (const card of nodes.scenarioCards.children) {
    const key = card.dataset.scenario;
    card.setAttribute("aria-pressed", String(state.scenario === key));
    const summary = pending ? null : read.scenarioSummary(result, key);
    card.querySelector('[data-role="metric"]').textContent =
      summary?.headline ?? EMPTY;
  }
}

/**
 * Plots the selected scenario against the counterfactual.
 *
 * Nothing is drawn until the model supplies a real series — an empty frame is
 * shown instead. Sketching illustrative geometry here would put invented curves
 * next to a headline number in a panel too small to caveat them properly.
 */
function renderCharts(result, pending) {
  const scenarioKey = pending ? null : resolveScenarioKey(result, state.scenario);
  const xValues = pending ? [] : read.years(result);

  const charts = [
    { node: nodes.softwareChart, fields: CHART_FIELDS.software, label: "Software progress index" },
    { node: nodes.capabilityChart, fields: CHART_FIELDS.capability, label: "Capability index" },
  ];

  for (const chart of charts) {
    renderLineChart(chart.node, {
      xValues,
      yLabel: chart.label,
      placeholder: pending ? "Awaiting economic model" : "No series for this scenario",
      series: scenarioKey
        ? [
            {
              key: "baseline",
              label: "Baseline",
              color: "var(--ink)",
              dashed: true,
              values: read.values(result, scenarioKey, chart.fields.baseline),
            },
            {
              key: "projection",
              label: "Projection",
              color: "var(--orange)",
              values: read.values(result, scenarioKey, chart.fields.value),
            },
          ]
        : [],
    });
  }
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
      : `Result: ${read.headline(result) ?? EMPTY}`,
  );
  const explanation = pending ? null : read.explanation(result);
  if (explanation) lines.push(explanation);

  lines.push("", "Assumptions");
  for (const definition of state.definitions) {
    const value = displayValue(definition, state.assumptions[definition.key]);
    const suffix = definition.suppliedByUi ? "  (supplied by the interface)" : "";
    lines.push(`- ${definition.label}: ${value}${suffix}`);
  }

  const metrics = pending ? [] : read.metrics(result);
  if (metrics.length) {
    lines.push("", "Metrics");
    for (const metric of metrics) {
      lines.push(`- ${metric.label}: ${metric.value}${metric.sub ? ` (${metric.sub})` : ""}`);
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
    result = await bridge.run(state.assumptions);
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
  const declared = exports.assumptionDefinitions ?? [];
  // The impact level is appended only while the model stays silent about it.
  const impact = declared.find((d) => d.key === IMPACT_KEY) ?? FALLBACK_IMPACT;
  state.definitions = impact.suppliedByUi ? [...declared, impact] : declared;
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
