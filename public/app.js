/**
 * UI layer.
 *
 * This file owns presentation only. It imports the model as a namespace and
 * treats every export except `assumptionDefinitions` and `runModel` as
 * optional, so the interface works against today's stub and lights up on its
 * own once the real model lands.
 */
import * as model from "./model.js";
import { CHART_COLORS, renderLineChart } from "./charts.js";

// ── Model adapter ──────────────────────────────────────────────────────
//
// The ONLY place in the UI that knows the shape of `runModel()`'s result.
// When the economic model lands, update these readers and nothing else.
//
// Each reader returns null / [] when the model has not supplied a field, which
// the render layer shows as an empty state.

const read = {
  /** Has the model been connected at all? */
  isPending: (result) => !result || result.status === "pending-model",

  /** Big number at the top of the calculator, as a preformatted string. */
  headline: (result) => result.headline ?? null,

  /** Sentence under the headline. */
  explanation: (result) => result.explanation ?? null,

  /** [{ label, value, sub }] for the metric table. */
  metrics: (result) => result.metrics ?? [],

  /** Time series for one chart, as [{x, y}]. */
  points: (result, scenarioKey, field) => {
    const rows = result.series;
    if (!Array.isArray(rows) || rows.length === 0) return [];
    return rows
      .map((row) => {
        const scoped = scenarioKey ? row[scenarioKey] : row;
        if (!scoped || typeof scoped !== "object") return null;
        const x = row.year ?? row.x ?? row.t;
        const y = scoped[field];
        return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
      })
      .filter(Boolean);
  },

  /** Per-scenario summary for the comparison cards. */
  scenarioSummary: (result, key) => result.scenarios?.[key] ?? null,
};

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

const scenarios = model.SCENARIOS ?? FALLBACK_SCENARIOS;

/** Which model field each dashboard chart plots. */
const CHART_SERIES = {
  software: { field: "softwareIndex", baselineField: "softwareIndexBaseline" },
  capability: { field: "capabilityIndex", baselineField: "capabilityIndexBaseline" },
};

/**
 * Policy impact level — the brief's second dashboard parameter, independent of
 * the compute percentage. These are labels only: what Low / Medium / High mean
 * numerically is the model's to define, and the selected key is passed straight
 * through in the assumptions object as `policyImpactLevel`.
 *
 * If the model declares its own `policyImpactLevel` assumption (a definition
 * with `type: "select"` and an `options` array), that declaration wins.
 */
const IMPACT_LEVEL_KEY = "policyImpactLevel";

const FALLBACK_IMPACT_LEVELS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const impactDefinition = (model.assumptionDefinitions ?? []).find(
  (d) => d.key === IMPACT_LEVEL_KEY,
) ?? {
  key: IMPACT_LEVEL_KEY,
  label: "Policy impact level",
  help: "Severity of the policy scenario. Interpreted by the model.",
  type: "select",
  options: FALLBACK_IMPACT_LEVELS,
  value: "medium",
  declaredByModel: false,
};

/** The two parameters the brief puts alongside the charts. */
const DASHBOARD_PARAMETER_KEYS = ["computeReallocated", IMPACT_LEVEL_KEY];

const GROUP_LABELS = {
  policy: "Policy",
  industry: "Industry structure",
  technical: "Technical",
  economic: "Economic",
};

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

// ── State ──────────────────────────────────────────────────────────────

const definitions = model.assumptionDefinitions ?? [];

/**
 * Everything the UI treats as a user input. The impact level is appended when
 * the model has not declared it, so it always reaches `runModel()`.
 */
const inputs = impactDefinition.declaredByModel === false
  ? [...definitions, impactDefinition]
  : definitions;

const state = {
  assumptions: Object.fromEntries(inputs.map((d) => [d.key, d.value])),
  scenario: scenarios[scenarios.length - 1]?.key ?? "coordinated",
  dashboardScenario: scenarios[scenarios.length - 1]?.key ?? "coordinated",
};

/** Every control rendered for a given key (main panel + dashboard mirror). */
const controls = new Map();

function registerControl(key, input, output) {
  if (!controls.has(key)) controls.set(key, []);
  controls.get(key).push({ input, output });
}

// ── Controls ───────────────────────────────────────────────────────────

function isSelect(definition) {
  return definition.type === "select" && Array.isArray(definition.options);
}

function optionLabel(definition, value) {
  return definition.options?.find((o) => o.value === value)?.label ?? String(value);
}

function displayValue(definition, value) {
  if (isSelect(definition)) return optionLabel(definition, value);
  const step = Number(definition.step) || 1;
  const digits = step < 1 ? String(step).split(".")[1].length : 0;
  return `${Number(value).toFixed(digits)}${definition.suffix ?? ""}`;
}

/** Dispatches on the declared control type. Slider unless told otherwise. */
function buildControl(definition, options = {}) {
  return isSelect(definition)
    ? buildSelect(definition, options)
    : buildSlider(definition, options);
}

function buildSlider(definition, { showHelp = true } = {}) {
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
  input.addEventListener("input", () => {
    setAssumption(definition.key, Number(input.value));
  });

  row.append(title, output, input);
  appendHelp(row, definition, showHelp);
  registerControl(definition.key, input, output);
  return row;
}

function buildSelect(definition, { showHelp = true } = {}) {
  const row = document.createElement("label");
  row.className = "control is-select";

  const title = document.createElement("span");
  title.className = "control-label";
  title.textContent = definition.label;

  const select = document.createElement("select");
  select.setAttribute("aria-label", definition.label);
  for (const option of definition.options) {
    const node = document.createElement("option");
    node.value = option.value;
    node.textContent = option.label;
    select.append(node);
  }
  select.value = state.assumptions[definition.key];
  select.addEventListener("change", () => {
    setAssumption(definition.key, select.value);
  });

  row.append(title, select);
  appendHelp(row, definition, showHelp);
  // Selects carry their own label, so there is no separate output node.
  registerControl(definition.key, select, null);
  return row;
}

function appendHelp(row, definition, showHelp) {
  if (!showHelp || !definition.help) return;
  const help = document.createElement("span");
  help.className = "control-help";
  help.textContent = definition.help;
  row.append(help);
}

/** Groups sliders when the model tags them, otherwise renders one flat list. */
function mountAssumptionControls(container) {
  container.replaceChildren();

  const groups = [];
  for (const definition of inputs) {
    const key = definition.group ?? null;
    let bucket = groups.find((g) => g.key === key);
    if (!bucket) {
      bucket = { key, label: GROUP_LABELS[key] ?? null, items: [] };
      groups.push(bucket);
    }
    bucket.items.push(definition);
  }

  for (const group of groups) {
    const section = document.createElement("div");
    section.className = "control-group";
    if (group.label) {
      const legend = document.createElement("p");
      legend.className = "control-group-label";
      legend.textContent = group.label;
      section.append(legend);
    }
    for (const definition of group.items) section.append(buildControl(definition));
    container.append(section);
  }
}

function setAssumption(key, value) {
  state.assumptions[key] = value;
  const definition = inputs.find((d) => d.key === key);
  for (const { input, output } of controls.get(key) ?? []) {
    if (input.value !== String(value)) input.value = value;
    if (definition && output) output.textContent = displayValue(definition, value);
  }
  render();
}

function syncControls() {
  for (const definition of inputs) {
    const value = state.assumptions[definition.key];
    for (const { input, output } of controls.get(definition.key) ?? []) {
      input.value = value;
      if (output) output.textContent = displayValue(definition, value);
    }
  }
}

// ── Nodes ──────────────────────────────────────────────────────────────

const nodes = {
  banner: document.querySelector("#model-status"),
  headline: document.querySelector("#headline-result"),
  note: document.querySelector("#result-note"),
  metrics: document.querySelector("#metric-grid"),
  scenarioLabel: document.querySelector("#active-scenario-label"),
  scenarioCards: document.querySelector("#scenario-cards"),
  softwareChart: document.querySelector("#chart-software"),
  capabilityChart: document.querySelector("#chart-capability"),
  readout: document.querySelector("#dashboard-readout"),
};

// ── Scenario cards ─────────────────────────────────────────────────────

function mountScenarioCards(container) {
  container.replaceChildren();
  for (const scenario of scenarios) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "scenario-card";
    card.dataset.scenario = scenario.key;

    const name = document.createElement("p");
    name.className = "scenario-name";
    name.textContent = scenario.label;

    const metric = document.createElement("p");
    metric.className = "scenario-metric";
    metric.dataset.role = "metric";
    metric.textContent = EMPTY;

    const sub = document.createElement("p");
    sub.className = "scenario-sub";
    sub.dataset.role = "sub";

    const desc = document.createElement("p");
    desc.className = "scenario-desc";
    desc.textContent = scenario.description ?? "";

    card.append(name, metric, sub, desc);
    card.addEventListener("click", () => {
      state.scenario = scenario.key;
      render();
    });
    container.append(card);
  }
}

// ── Render ─────────────────────────────────────────────────────────────

function renderCalculator(result, pending) {
  const scenario = scenarios.find((s) => s.key === state.scenario);
  nodes.scenarioLabel.textContent = scenario?.short ?? scenario?.label ?? "";

  nodes.headline.textContent = pending ? EMPTY : read.headline(result) ?? EMPTY;
  nodes.note.textContent = pending
    ? "The interface is wired and waiting on the economic model. Sliders, scenarios and charts are live — every value fills in as soon as runModel() returns results."
    : read.explanation(result) ?? "";

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
    card.querySelector('[data-role="metric"]').textContent = summary?.headline ?? EMPTY;
    card.querySelector('[data-role="sub"]').textContent = summary?.sub ?? "";
  }
}

function renderDashboard(result, pending) {
  const key = state.dashboardScenario;
  const scenario = scenarios.find((s) => s.key === key);
  const baselineKey = scenarios[0]?.key ?? "none";

  const startYear = model.MODEL_CONSTANTS?.policyStartYear ?? 2026;
  const horizon = model.MODEL_CONSTANTS?.projectionYears ?? 10;

  const durationMonths = Number(state.assumptions.durationMonths) || 0;
  const shade = {
    from: startYear,
    to: startYear + durationMonths / 12,
    label: "Policy window",
  };

  const charts = [
    {
      node: nodes.softwareChart,
      yLabel: "Software progress index S(t)",
      spec: CHART_SERIES.software,
    },
    {
      node: nodes.capabilityChart,
      yLabel: "Frontier AI capability index M(t)",
      spec: CHART_SERIES.capability,
    },
  ];

  for (const chart of charts) {
    renderLineChart(chart.node, {
      xLabel: "Year",
      yLabel: chart.yLabel,
      xDomain: [startYear, startYear + horizon],
      shade,
      placeholder: "Awaiting economic model",
      series: [
        {
          key: "baseline",
          label: "Baseline — no reallocation",
          color: CHART_COLORS.baseline,
          dashed: true,
          points: pending
            ? []
            : read.points(result, baselineKey, chart.spec.baselineField),
        },
        {
          key: "projection",
          label: `Projection — ${(scenario?.short ?? scenario?.label ?? "").toLowerCase()}`,
          color: CHART_COLORS.projection,
          points: pending ? [] : read.points(result, key, chart.spec.field),
        },
      ],
    });
  }

  // Readout mirrors the current inputs; model-derived rows fill in later.
  nodes.readout.replaceChildren();
  const rows = DASHBOARD_PARAMETER_KEYS.map((k) => inputs.find((d) => d.key === k))
    .filter(Boolean)
    .map((d) => [d.label, displayValue(d, state.assumptions[d.key])]);

  const summary = pending ? null : read.scenarioSummary(result, key);
  rows.push(["Result", summary?.headline ?? EMPTY]);

  for (const [label, value] of rows) {
    const row = document.createElement("div");
    row.className = "readout-row";
    const span = document.createElement("span");
    span.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = value;
    row.append(span, strong);
    nodes.readout.append(row);
  }
}

function render() {
  let result;
  try {
    result = model.runModel(state.assumptions);
  } catch (error) {
    console.error("runModel threw", error);
    result = null;
  }

  const pending = read.isPending(result);
  nodes.banner.hidden = !pending;

  renderCalculator(result ?? {}, pending);
  renderDashboard(result ?? {}, pending);
}

// ── Dashboard sidebar ──────────────────────────────────────────────────

/**
 * The dashboard sidebar carries the brief's two parameters — compute
 * reallocated and policy impact level — plus the scenario selector. They are
 * independent of each other: changing the impact level does not move the
 * compute slider.
 */
function mountDashboardControls() {
  const scenarioSelect = document.querySelector("#dashboard-scenario");
  scenarioSelect.replaceChildren();
  for (const scenario of scenarios) {
    const option = document.createElement("option");
    option.value = scenario.key;
    option.textContent = scenario.label;
    scenarioSelect.append(option);
  }
  scenarioSelect.value = state.dashboardScenario;
  scenarioSelect.addEventListener("change", () => {
    state.dashboardScenario = scenarioSelect.value;
    render();
  });

  const container = document.querySelector("#dashboard-controls");
  container.replaceChildren();
  for (const key of DASHBOARD_PARAMETER_KEYS) {
    const definition = inputs.find((d) => d.key === key);
    if (definition) container.append(buildControl(definition, { showHelp: false }));
  }
}

// ── Tabs ───────────────────────────────────────────────────────────────

function mountTabs() {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      for (const other of tabs) {
        const selected = other === tab;
        other.setAttribute("aria-selected", String(selected));
        document.querySelector(`#${other.getAttribute("aria-controls")}`).hidden =
          !selected;
      }
    });
  }
}

// ── Boot ───────────────────────────────────────────────────────────────

mountAssumptionControls(document.querySelector("#assumption-controls"));
mountScenarioCards(nodes.scenarioCards);
mountDashboardControls();
mountTabs();

document.querySelector("#reset-assumptions").addEventListener("click", () => {
  for (const definition of inputs) {
    state.assumptions[definition.key] = definition.value;
  }
  syncControls();
  render();
});

render();
