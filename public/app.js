import { assumptionDefinitions, runModel } from "./model.js";

const controls = document.querySelector("#assumption-controls");
const headline = document.querySelector("#headline-result");
const resetButton = document.querySelector("#reset-controls");
const scenarioInputs = [...document.querySelectorAll('input[name="scenario"]')];

// ── Model adapter ──────────────────────────────────────────────────────
//
// The only place that knows the shape of runModel()'s result. While the model
// returns `pending-model` the charts fall back to illustrative geometry, which
// stays labelled as a preview. When it returns data, the traces, the axes and
// the status readouts all switch over — no other code changes.
//
// Expected series shape:
//   result.series = [
//     {
//       year: 2026,
//       <scenarioKey>: {
//         softwareIndex, softwareIndexBaseline,
//         capabilityIndex, capabilityIndexBaseline,
//         firmA: { softwareIndex, capabilityIndex },   // optional
//         firmB: { softwareIndex, capabilityIndex },   // optional
//       },
//     },
//   ]
//
// If firmA / firmB are absent the chart draws baseline against the aggregate
// projection and hides the second firm trace.

const read = {
  isPending: (result) => !result || result.status === "pending-model",

  headline: (result) =>
    result.headline ??
    (typeof result.cumulativeLoss === "string" ? result.cumulativeLoss : null),

  rows: (result) => (Array.isArray(result?.series) ? result.series : []),

  years: (result) =>
    read.rows(result).map((row) => row.year ?? row.t).filter(Number.isFinite),

  /** Pulls one numeric field from every row for a scenario, optionally per firm. */
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
 * The participation radios use `baseline`; a model is likelier to call that
 * scenario `none`. Accept either rather than forcing a convention.
 */
function resolveScenarioKey(result, uiScenario) {
  const rows = read.rows(result);
  if (!rows.length) return null;
  const candidates = uiScenario === "baseline" ? ["none", "baseline"] : [uiScenario];
  return candidates.find((key) => rows[0][key]) ?? null;
}

/**
 * Policy impact level — the brief's second dashboard parameter, independent of
 * the compute percentage. Labels only: what Low / Medium / High mean
 * numerically is the model's to define. The selected key reaches runModel() in
 * the assumptions object as `policyImpactLevel`.
 *
 * If the model declares its own `policyImpactLevel` definition (with
 * `type: "select"` and an `options` array), that declaration wins.
 */
const IMPACT_KEY = "policyImpactLevel";

const impactDefinition = assumptionDefinitions.find((d) => d.key === IMPACT_KEY) ?? {
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

const inputDefinitions = impactDefinition.suppliedByUi
  ? [...assumptionDefinitions, impactDefinition]
  : assumptionDefinitions;

const assumptions = Object.fromEntries(
  inputDefinitions.map((definition) => [definition.key, definition.value]),
);

const controlInputs = new Map();
let scenario = "coordinated";

const charts = {
  software: {
    baseline: document.querySelector("#software-baseline"),
    firmA: document.querySelector("#software-a"),
    firmB: document.querySelector("#software-b"),
    area: document.querySelector("#software-area"),
    sweep: document.querySelector("#software-sweep"),
    output: document.querySelector("#software-gap"),
    grid: document.querySelector("#software-grid"),
    axis: document.querySelector("#software-axis"),
  },
  capability: {
    baseline: document.querySelector("#capability-baseline"),
    firmA: document.querySelector("#capability-a"),
    firmB: document.querySelector("#capability-b"),
    area: document.querySelector("#capability-area"),
    sweep: document.querySelector("#capability-sweep"),
    output: document.querySelector("#capability-gap"),
    grid: document.querySelector("#capability-grid"),
    axis: document.querySelector("#capability-axis"),
  },
};

const statusNodes = {
  chartData: document.querySelector("#status-chart-data"),
  legendNote: document.querySelector("#legend-disclaimer"),
  rackNote: document.querySelector("#rack-note-text"),
};

const RACK_NOTE = {
  preview: "Controls currently drive illustrative geometry, not validated model results.",
  live: "Controls drive the economic model. Outputs remain sensitive to the assumptions above.",
};

const plot = {
  left: 68,
  right: 768,
  top: 34,
  bottom: 244,
};

/** Fixed range used by the illustrative preview. Model data overrides it. */
const PREVIEW_SCALE = { min: 90, max: 225 };

const SVG_NS = "http://www.w3.org/2000/svg";

function isSelect(definition) {
  return definition.type === "select" && Array.isArray(definition.options);
}

function formatValue(definition, value) {
  if (isSelect(definition)) {
    return definition.options.find((o) => o.value === value)?.label ?? String(value);
  }
  return `${value}${definition.suffix ?? ""}`;
}

function updateRangeFill(input) {
  const progress = ((Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min))) * 100;
  input.style.setProperty("--fill", `${progress}%`);
}

function createControls() {
  for (const definition of inputDefinitions) {
    const row = document.createElement("label");
    row.className = isSelect(definition) ? "control control-select" : "control";

    const title = document.createElement("span");
    title.className = "control-label";
    title.textContent = definition.label;

    if (isSelect(definition)) {
      const select = document.createElement("select");
      select.className = "control-select-input";
      select.setAttribute("aria-label", definition.label);
      for (const option of definition.options) {
        const node = document.createElement("option");
        node.value = option.value;
        node.textContent = option.label;
        select.append(node);
      }
      select.value = definition.value;
      select.addEventListener("change", () => {
        assumptions[definition.key] = select.value;
        renderResult();
      });

      row.append(title, select);
      controls.append(row);
      controlInputs.set(definition.key, { definition, input: select, value: null });
      continue;
    }

    const value = document.createElement("output");
    value.textContent = formatValue(definition, definition.value);

    const input = document.createElement("input");
    input.type = "range";
    input.min = definition.min;
    input.max = definition.max;
    input.step = definition.step;
    input.value = definition.value;
    input.setAttribute("aria-label", definition.label);
    updateRangeFill(input);

    input.addEventListener("input", () => {
      assumptions[definition.key] = Number(input.value);
      value.textContent = formatValue(definition, input.value);
      updateRangeFill(input);
      renderResult(false);
    });

    row.append(title, value, input);
    controls.append(row);
    controlInputs.set(definition.key, { definition, input, value });
  }
}

function xPosition(index, count) {
  if (count <= 1) return plot.left;
  return plot.left + ((plot.right - plot.left) * index) / (count - 1);
}

function yPosition(value, scale) {
  const clamped = Math.min(scale.max, Math.max(scale.min, value));
  return plot.bottom - ((clamped - scale.min) / (scale.max - scale.min)) * (plot.bottom - plot.top);
}

function pathFromSeries(series, scale) {
  return series
    .map((value, index) => `${index === 0 ? "M" : "L"}${xPosition(index, series.length).toFixed(1)} ${yPosition(value, scale).toFixed(1)}`)
    .join(" ");
}

function areaBetween(upper, lower, scale) {
  const forward = upper.map((value, index) => `${index === 0 ? "M" : "L"}${xPosition(index, upper.length).toFixed(1)} ${yPosition(value, scale).toFixed(1)}`);
  const backward = lower
    .map((value, index) => ({ value, index }))
    .reverse()
    .map(({ value, index }) => `L${xPosition(index, lower.length).toFixed(1)} ${yPosition(value, scale).toFixed(1)}`);
  return `${forward.join(" ")} ${backward.join(" ")} Z`;
}

function illustrativeSeries(kind) {
  const count = 9;
  const computeShare = assumptions.computeReallocated / 100;
  const activeYears = Math.max(0.25, assumptions.durationMonths / 12);
  const growthSetting = assumptions.aiProductivityGrowth;
  const baseStep = kind === "software" ? 14.3 : 13.1;
  const elasticity = kind === "software" ? 0.76 : 0.58;
  const previewScale = 4.4;

  const baseline = Array.from({ length: count }, (_, index) => 100 + baseStep * index + 0.8 * index ** 2);
  const firmA = baseline.map((value, index) => {
    if (scenario === "baseline" || index === 0) return value;
    const exposure = Math.min(index, activeYears);
    const persistence = Math.max(0, index - activeYears) * 0.16;
    const gap = baseStep * computeShare * elasticity * (exposure + persistence) * (1 + growthSetting * 0.04) * previewScale;
    return value - gap;
  });
  const firmB = baseline.map((value, index) => {
    if (scenario !== "coordinated" || index === 0) return value;
    const exposure = Math.min(index, activeYears);
    const persistence = Math.max(0, index - activeYears) * 0.16;
    const gap = baseStep * computeShare * elasticity * (exposure + persistence) * (1 + growthSetting * 0.04) * previewScale * 0.92;
    return value - gap;
  });

  return { baseline, firmA, firmB, years: null, source: "illustrative" };
}

/** Real trajectories out of the model result, or null when unavailable. */
function modelSeries(kind, result) {
  const key = resolveScenarioKey(result, scenario);
  if (!key) return null;

  const fields = CHART_FIELDS[kind];
  const baseline = read.values(result, key, fields.baseline);
  if (!baseline.length) return null;

  const aggregate = read.values(result, key, fields.value);
  if (aggregate.length !== baseline.length) return null;

  const firmA = read.values(result, key, fields.value, "firmA");
  const firmB = read.values(result, key, fields.value, "firmB");

  return {
    baseline,
    firmA: firmA.length === baseline.length ? firmA : aggregate,
    firmB: firmB.length === baseline.length ? firmB : null,
    years: read.years(result),
    source: "model",
  };
}

/** Axis ticks: 1, 2, 5 x powers of ten, so labels land on readable values. */
function niceTicks(min, max, count) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return [min];
  const rawStep = (max - min) / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalised = rawStep / magnitude;
  const step = (normalised >= 5 ? 10 : normalised >= 2 ? 5 : normalised >= 1 ? 2 : 1) * magnitude;

  const ticks = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 0.001; v += step) {
    ticks.push(Number(v.toFixed(10)));
  }
  return ticks.length ? ticks : [min, max];
}

function formatTick(value) {
  if (Math.abs(value) >= 1000) return value.toFixed(0);
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/**
 * Redraws gridlines and axis labels for the chart's current scale, so the
 * numbers on the axis always describe the lines actually drawn. Previously
 * these were static markup tuned to the preview's fixed range.
 */
function renderAxes(chart, scale, years) {
  if (!chart.grid || !chart.axis) return;

  const yTicks = niceTicks(scale.min, scale.max, 4).filter(
    (tick) => tick >= scale.min && tick <= scale.max,
  );

  const columns = 5;
  const horizontal = yTicks.map(
    (tick) => `M${plot.left} ${yPosition(tick, scale).toFixed(1)}H${plot.right}`,
  );
  const vertical = Array.from({ length: columns }, (_, i) => {
    const x = (plot.left + ((plot.right - plot.left) * i) / (columns - 1)).toFixed(1);
    return `M${x} ${plot.top}V${plot.bottom}`;
  });

  chart.grid.replaceChildren();
  const gridPath = document.createElementNS(SVG_NS, "path");
  gridPath.setAttribute("d", [...horizontal, ...vertical].join(""));
  chart.grid.append(gridPath);

  chart.axis.replaceChildren();

  for (const tick of yTicks) {
    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("x", String(plot.left - 18));
    text.setAttribute("y", (yPosition(tick, scale) + 5).toFixed(1));
    text.setAttribute("text-anchor", "end");
    text.textContent = formatTick(tick);
    chart.axis.append(text);
  }

  for (let i = 0; i < columns; i += 1) {
    const x = plot.left + ((plot.right - plot.left) * i) / (columns - 1);
    const label = years?.length
      ? Math.round(years[Math.round((years.length - 1) * (i / (columns - 1)))])
      : 2026 + i * 2;

    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("x", x.toFixed(1));
    text.setAttribute("y", "270");
    if (i === columns - 1) text.setAttribute("text-anchor", "end");
    text.textContent = String(label);
    chart.axis.append(text);
  }
}

function stopChartAnimation(chart) {
  for (const path of [chart.baseline, chart.firmA, chart.firmB]) {
    path.classList.remove("is-drawing");
    path.style.removeProperty("--trace-length");
    path.style.removeProperty("stroke-dasharray");
  }

  chart.sweep.classList.remove("is-scanning");
}

function animateChart(chart) {
  stopChartAnimation(chart);

  for (const path of [chart.baseline, chart.firmA, chart.firmB]) {
    const length = Math.ceil(path.getTotalLength());
    path.style.setProperty("--trace-length", length);
    path.style.strokeDasharray = length;
    path.addEventListener("animationend", () => {
      path.classList.remove("is-drawing");
      path.style.removeProperty("--trace-length");
      path.style.removeProperty("stroke-dasharray");
    }, { once: true });
    void path.getBoundingClientRect();
    path.classList.add("is-drawing");
  }

  chart.sweep.addEventListener("animationend", () => {
    chart.sweep.classList.remove("is-scanning");
  }, { once: true });
  void chart.sweep.getBoundingClientRect();
  chart.sweep.classList.add("is-scanning");
}

/** Pads the observed range so traces do not touch the plot edges. */
function scaleFor(series) {
  const all = [...series.baseline, ...series.firmA, ...(series.firmB ?? [])];
  const min = Math.min(...all);
  const max = Math.max(...all);
  if (min === max) return { min: min - 1, max: max + 1 };
  const pad = (max - min) * 0.08;
  return { min: min - pad, max: max + pad };
}

function describeGap(series) {
  const last = series.baseline.length - 1;
  const reference = series.baseline[last];
  const gap = reference - series.firmA[last];
  if (!Number.isFinite(gap) || Math.abs(gap) < 1e-9 || reference === 0) {
    return "No divergence";
  }
  return `${((gap / reference) * 100).toFixed(1)}% below baseline`;
}

function renderChart(kind, result, shouldAnimate = true) {
  const chart = charts[kind];
  const series = modelSeries(kind, result) ?? illustrativeSeries(kind);
  const fromModel = series.source === "model";

  if (!shouldAnimate) {
    stopChartAnimation(chart);
  }

  const scale = fromModel ? scaleFor(series) : PREVIEW_SCALE;
  renderAxes(chart, scale, series.years);

  chart.baseline.setAttribute("d", pathFromSeries(series.baseline, scale));
  chart.firmA.setAttribute("d", pathFromSeries(series.firmA, scale));
  chart.firmB.setAttribute("d", pathFromSeries(series.firmB ?? series.firmA, scale));

  const hasFirmB = Boolean(series.firmB);
  const comparisonSeries = hasFirmB && scenario === "coordinated"
    ? series.firmA.map((value, index) => Math.min(value, series.firmB[index]))
    : series.firmA;
  chart.area.setAttribute("d", areaBetween(series.baseline, comparisonSeries, scale));

  chart.firmA.style.opacity = scenario === "baseline" ? "0" : "1";
  chart.firmB.style.opacity = hasFirmB && scenario === "coordinated" ? "1" : "0";
  chart.area.style.opacity = scenario === "baseline" ? "0" : "0.42";

  chart.output.textContent = fromModel
    ? describeGap(series)
    : scenario === "baseline"
      ? "Traces coincide"
      : scenario === "unilateral"
        ? "Firm A diverges"
        : "Both firms diverge";

  if (shouldAnimate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    animateChart(chart);
  }

  return fromModel;
}

function renderResult(shouldAnimate = true) {
  let result;
  try {
    result = runModel(assumptions);
  } catch (error) {
    console.error("runModel threw", error);
    result = null;
  }

  const pending = read.isPending(result);
  const safeResult = result ?? {};

  headline.textContent = pending
    ? "Awaiting model"
    : read.headline(safeResult) ?? "Awaiting model";

  const softwareLive = renderChart("software", safeResult, shouldAnimate);
  renderChart("capability", safeResult, shouldAnimate);

  // The interface only claims to be illustrative while it actually is.
  if (statusNodes.chartData) {
    statusNodes.chartData.textContent = softwareLive ? "Model output" : "Illustrative";
  }
  if (statusNodes.legendNote) {
    statusNodes.legendNote.textContent = softwareLive ? "Model output" : "Illustrative preview";
    statusNodes.legendNote.classList.toggle("is-live", softwareLive);
  }
  if (statusNodes.rackNote) {
    statusNodes.rackNote.textContent = softwareLive ? RACK_NOTE.live : RACK_NOTE.preview;
  }

  document.querySelector("#unilateral-status").textContent = scenario === "baseline" ? "Not selected" : "Firm A diverges";
  document.querySelector("#coordinated-status").textContent = scenario === "coordinated" ? "Both firms diverge" : "Not selected";
}

for (const input of scenarioInputs) {
  input.addEventListener("change", () => {
    scenario = input.value;
    renderResult();
  });
}

resetButton.addEventListener("click", () => {
  for (const [key, { definition, input, value }] of controlInputs) {
    assumptions[key] = definition.value;
    input.value = definition.value;
    if (value) {
      value.textContent = formatValue(definition, definition.value);
      updateRangeFill(input);
    }
  }

  scenario = "coordinated";
  document.querySelector('input[name="scenario"][value="coordinated"]').checked = true;
  renderResult();
});

createControls();
renderResult();
