import { assumptionDefinitions, runModel } from "./model.js";

const controls = document.querySelector("#assumption-controls");
const headline = document.querySelector("#headline-result");
const resetButton = document.querySelector("#reset-controls");
const scenarioInputs = [...document.querySelectorAll('input[name="scenario"]')];

const assumptions = Object.fromEntries(
  assumptionDefinitions.map((definition) => [definition.key, definition.value]),
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
  },
  capability: {
    baseline: document.querySelector("#capability-baseline"),
    firmA: document.querySelector("#capability-a"),
    firmB: document.querySelector("#capability-b"),
    area: document.querySelector("#capability-area"),
    sweep: document.querySelector("#capability-sweep"),
    output: document.querySelector("#capability-gap"),
  },
};

const plot = {
  left: 68,
  right: 768,
  top: 34,
  bottom: 244,
  min: 90,
  max: 225,
};

function formatValue(definition, value) {
  return `${value}${definition.suffix}`;
}

function updateRangeFill(input) {
  const progress = ((Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min))) * 100;
  input.style.setProperty("--fill", `${progress}%`);
}

function createControls() {
  for (const definition of assumptionDefinitions) {
    const row = document.createElement("label");
    row.className = "control";

    const title = document.createElement("span");
    title.className = "control-label";
    title.textContent = definition.label;

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
      renderResult();
    });

    row.append(title, value, input);
    controls.append(row);
    controlInputs.set(definition.key, { definition, input, value });
  }
}

function xPosition(index, count) {
  return plot.left + ((plot.right - plot.left) * index) / (count - 1);
}

function yPosition(value) {
  const clamped = Math.min(plot.max, Math.max(plot.min, value));
  return plot.bottom - ((clamped - plot.min) / (plot.max - plot.min)) * (plot.bottom - plot.top);
}

function pathFromSeries(series) {
  return series
    .map((value, index) => `${index === 0 ? "M" : "L"}${xPosition(index, series.length).toFixed(1)} ${yPosition(value).toFixed(1)}`)
    .join(" ");
}

function areaBetween(upper, lower) {
  const forward = upper.map((value, index) => `${index === 0 ? "M" : "L"}${xPosition(index, upper.length).toFixed(1)} ${yPosition(value).toFixed(1)}`);
  const backward = lower
    .map((value, index) => ({ value, index }))
    .reverse()
    .map(({ value, index }) => `L${xPosition(index, lower.length).toFixed(1)} ${yPosition(value).toFixed(1)}`);
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

  return { baseline, firmA, firmB };
}

function animateChart(chart) {
  for (const path of [chart.baseline, chart.firmA, chart.firmB]) {
    const length = Math.ceil(path.getTotalLength());
    path.style.setProperty("--trace-length", length);
    path.style.strokeDasharray = length;
    path.classList.remove("is-drawing");
    void path.getBoundingClientRect();
    path.classList.add("is-drawing");
  }

  chart.sweep.classList.remove("is-scanning");
  void chart.sweep.getBoundingClientRect();
  chart.sweep.classList.add("is-scanning");
}

function renderChart(kind, shouldAnimate = true) {
  const chart = charts[kind];
  const series = illustrativeSeries(kind);

  chart.baseline.setAttribute("d", pathFromSeries(series.baseline));
  chart.firmA.setAttribute("d", pathFromSeries(series.firmA));
  chart.firmB.setAttribute("d", pathFromSeries(series.firmB));

  const comparisonSeries = scenario === "coordinated"
    ? series.firmA.map((value, index) => Math.min(value, series.firmB[index]))
    : series.firmA;
  chart.area.setAttribute("d", areaBetween(series.baseline, comparisonSeries));

  chart.firmA.style.opacity = scenario === "baseline" ? "0" : "1";
  chart.firmB.style.opacity = scenario === "coordinated" ? "1" : "0";
  chart.area.style.opacity = scenario === "baseline" ? "0" : "0.42";

  const label = scenario === "baseline"
    ? "Traces coincide"
    : scenario === "unilateral"
      ? "Firm A diverges"
      : "Both firms diverge";
  chart.output.textContent = label;

  if (shouldAnimate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    animateChart(chart);
  }
}

function renderResult(shouldAnimate = true) {
  const result = runModel(assumptions);

  headline.textContent = result.status === "pending-model" ? "Awaiting model" : result.cumulativeLoss;
  renderChart("software", shouldAnimate);
  renderChart("capability", shouldAnimate);

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
    value.textContent = formatValue(definition, definition.value);
    updateRangeFill(input);
  }

  scenario = "coordinated";
  document.querySelector('input[name="scenario"][value="coordinated"]').checked = true;
  renderResult();
});

createControls();
renderResult();
