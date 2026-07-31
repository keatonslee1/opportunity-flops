/**
 * Side panel UI.
 *
 * Presentation only. The economic model is loaded from the deployed site and
 * executed unmodified in a sandboxed frame (see `model-bridge.js`); this file
 * never computes an economic quantity of its own.
 */

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
  { key: "none", label: "No reallocation", short: "Baseline" },
  { key: "unilateral", label: "One firm reallocates", short: "Unilateral" },
  { key: "coordinated", label: "Both firms reallocate", short: "Coordinated" },
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

const EMPTY = "—";
const STATE_KEY = "panelState";

// ── State ──────────────────────────────────────────────────────────────

const bridge = new ModelBridge();

const state = {
  origin: DEFAULT_ORIGIN,
  definitions: [],
  scenarios: FALLBACK_SCENARIOS,
  assumptions: {},
  scenario: null,
  modelReady: false,
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
  settings: document.querySelector("#settings"),
  toggleSettings: document.querySelector("#toggle-settings"),
  originInput: document.querySelector("#origin-input"),
  reloadModel: document.querySelector("#reload-model"),
  reset: document.querySelector("#reset-assumptions"),
  openSite: document.querySelector("#open-site"),
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

function displayValue(definition, value) {
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

function mountAssumptionControls() {
  nodes.controls.replaceChildren();
  sliders.clear();
  for (const definition of state.definitions) {
    nodes.controls.append(buildSlider(definition));
  }
  nodes.controlsEmpty.hidden = state.definitions.length > 0;
}

function setAssumption(key, value) {
  state.assumptions[key] = value;
  const definition = state.definitions.find((d) => d.key === key);
  const slider = sliders.get(key);
  if (slider && definition) {
    if (Number(slider.input.value) !== value) slider.input.value = value;
    slider.output.textContent = displayValue(definition, value);
    paintTrack(slider.input, definition, value);
  }
  saveState();
  render();
}

function syncSliders() {
  for (const definition of state.definitions) {
    const value = state.assumptions[definition.key];
    const slider = sliders.get(definition.key);
    if (!slider) continue;
    slider.input.value = value;
    slider.output.textContent = displayValue(definition, value);
    paintTrack(slider.input, definition, value);
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

async function render() {
  if (!state.modelReady) {
    renderResult({}, true);
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
  renderResult(result ?? {}, pending);
}

// ── Boot ───────────────────────────────────────────────────────────────

function applyDefinitions(exports, restored) {
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
    renderResult({}, true);
    return;
  }

  try {
    const exports = await bridge.load(source.source);
    applyDefinitions(exports, await restoreState());
    state.modelReady = true;

    mountAssumptionControls();
    mountScenarioCards();

    const host = new URL(state.origin).host;
    if (source.from === "network") {
      setSourceStatus("live", `Live — ${host}`);
    } else {
      setSourceStatus("cached", `Cached ${formatTime(source.fetchedAt)} — ${host}`);
    }

    await render();
  } catch (error) {
    setSourceStatus("error", "Model failed to run");
    nodes.loadError.hidden = false;
    nodes.loadError.textContent = `The model at ${state.origin} could not be evaluated — ${error.message}`;
    renderResult({}, true);
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
  renderResult({}, true);

  await connectModel();
}

boot();
