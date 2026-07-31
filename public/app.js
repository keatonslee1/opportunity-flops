import { assumptionDefinitions, runModel } from "./model.js";
import { buildUrl, decodeState, encodeState } from "./permalink.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const controls = document.querySelector("#assumption-controls");
const headline = document.querySelector("#headline-result");
const modelError = document.querySelector("#model-error");
const resetButton = document.querySelector("#reset-controls");
const copyLinkButton = document.querySelector("#copy-link");
const scenarioInputs = [...document.querySelectorAll('input[name="scenario"]')];

const DEFAULT_SCENARIO =
  document.querySelector('input[name="scenario"]:checked')?.value ?? "coordinated";

const permalinkConfig = {
  definitions: assumptionDefinitions,
  scenarioKeys: scenarioInputs.map((input) => input.value),
  defaultScenario: DEFAULT_SCENARIO,
};

// A shared link restores the whole configuration. Values are validated against
// the declared ranges on the way in, so a hand-edited URL cannot put a control
// somewhere it could not otherwise go.
const initialState = decodeState(window.location.search, permalinkConfig);

const assumptions = initialState.assumptions;

const controlInputs = new Map();
let scenario = initialState.scenario;

const charts = {
  software: {
    seriesKey: "software",
    domainKind: "level",
    areaMode: "min",
    metricKey: "softwareLevelGap",
    descriptionKind: "softwareLevel",
    zeroLabel: "level gap",
    resultLabel: "lower",
    svg: document.querySelector("#software-chart"),
    axes: document.querySelector("#software-axes"),
    grid: document.querySelector("#software-grid"),
    description: document.querySelector("#software-svg-desc"),
    baseline: document.querySelector("#software-baseline"),
    firmA: document.querySelector("#software-a"),
    firmB: document.querySelector("#software-b"),
    area: document.querySelector("#software-area"),
    sweep: document.querySelector("#software-sweep"),
    output: document.querySelector("#software-gap"),
  },
  softwareSlowdown: {
    seriesKey: "softwareSlowdown",
    domainKind: "fraction",
    areaMode: "max",
    metricKey: "softwareSlowdown",
    descriptionKind: "softwareSlowdown",
    zeroLabel: "rate slowdown",
    resultLabel: "rate slowdown",
    svg: document.querySelector("#slowdown-chart"),
    axes: document.querySelector("#slowdown-axes"),
    grid: document.querySelector("#slowdown-grid"),
    description: document.querySelector("#slowdown-svg-desc"),
    baseline: document.querySelector("#slowdown-baseline"),
    firmA: document.querySelector("#slowdown-a"),
    firmB: document.querySelector("#slowdown-b"),
    area: document.querySelector("#slowdown-area"),
    sweep: document.querySelector("#slowdown-sweep"),
    output: document.querySelector("#slowdown-gap"),
  },
  capability: {
    seriesKey: "capability",
    domainKind: "level",
    areaMode: "min",
    metricKey: "capabilityGap",
    descriptionKind: "capability",
    zeroLabel: "capability gap",
    resultLabel: "lower",
    svg: document.querySelector("#capability-chart"),
    axes: document.querySelector("#capability-axes"),
    grid: document.querySelector("#capability-grid"),
    description: document.querySelector("#capability-svg-desc"),
    baseline: document.querySelector("#capability-baseline"),
    firmA: document.querySelector("#capability-a"),
    firmB: document.querySelector("#capability-b"),
    area: document.querySelector("#capability-area"),
    sweep: document.querySelector("#capability-sweep"),
    output: document.querySelector("#capability-gap"),
  },
  capabilityGap: {
    seriesKey: "capabilityGap",
    domainKind: "fraction",
    areaMode: "max",
    metricKey: "capabilityGap",
    descriptionKind: "capabilityGap",
    zeroLabel: "capability gap",
    resultLabel: "capability gap",
    svg: document.querySelector("#capability-gap-chart"),
    axes: document.querySelector("#capability-gap-axes"),
    grid: document.querySelector("#capability-gap-grid"),
    description: document.querySelector("#capability-gap-svg-desc"),
    baseline: document.querySelector("#capability-gap-baseline"),
    firmA: document.querySelector("#capability-gap-a"),
    firmB: document.querySelector("#capability-gap-b"),
    area: document.querySelector("#capability-gap-area"),
    sweep: document.querySelector("#capability-gap-sweep"),
    output: document.querySelector("#capability-gap-series-output"),
  },
  risk: {
    seriesKey: "risk",
    domainKind: "risk",
    areaMode: "min",
    metricKey: "safetyBenefit",
    descriptionKind: "risk",
    zeroLabel: "lower risk",
    resultLabel: "lower risk",
    projectionOnly: true,
    svg: document.querySelector("#risk-chart"),
    axes: document.querySelector("#risk-axes"),
    grid: document.querySelector("#risk-grid"),
    description: document.querySelector("#risk-svg-desc"),
    baseline: document.querySelector("#risk-baseline"),
    firmA: document.querySelector("#risk-projection"),
    firmB: document.querySelector("#risk-unused"),
    area: document.querySelector("#risk-area"),
    sweep: document.querySelector("#risk-sweep"),
    output: document.querySelector("#risk-output"),
  },
  safetyBenefit: {
    seriesKey: "safetyBenefit",
    domainKind: "fraction",
    areaMode: "max",
    metricKey: "safetyBenefit",
    descriptionKind: "safetyBenefit",
    zeroLabel: "safety benefit",
    resultLabel: "safety benefit",
    projectionOnly: true,
    svg: document.querySelector("#safety-benefit-chart"),
    axes: document.querySelector("#safety-benefit-axes"),
    grid: document.querySelector("#safety-benefit-grid"),
    description: document.querySelector("#safety-benefit-svg-desc"),
    baseline: document.querySelector("#safety-benefit-baseline"),
    firmA: document.querySelector("#safety-benefit-projection"),
    firmB: document.querySelector("#safety-benefit-unused"),
    area: document.querySelector("#safety-benefit-area"),
    sweep: document.querySelector("#safety-benefit-sweep"),
    output: document.querySelector("#safety-benefit-output"),
  },
};

const plot = {
  left: 68,
  right: 768,
  top: 34,
  bottom: 244,
};

function formatValue(definition, value) {
  return `${value}${definition.suffix ?? ""}`;
}

function formatPercent(value) {
  return `${(Math.max(0, value) * 100).toFixed(1)}%`;
}

function updateRangeFill(input) {
  const progress = ((Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min))) * 100;
  input.style.setProperty("--fill", `${progress}%`);
}

function createRangeControl(definition) {
  const row = document.createElement("label");
  row.className = "control";

  const title = document.createElement("span");
  title.className = "control-label";
  title.textContent = definition.label;

  const value = document.createElement("output");
  value.textContent = formatValue(definition, assumptions[definition.key]);

  const input = document.createElement("input");
  input.type = "range";
  input.min = definition.min;
  input.max = definition.max;
  input.step = definition.step;
  input.value = assumptions[definition.key];
  input.setAttribute("aria-label", definition.label);
  updateRangeFill(input);

  input.addEventListener("input", () => {
    assumptions[definition.key] = Number(input.value);
    value.textContent = formatValue(definition, input.value);
    updateRangeFill(input);
    syncPermalink();
    renderResult(false);
  });

  row.append(title, value, input);
  controls.append(row);
  controlInputs.set(definition.key, { definition, input, value, type: "range" });
}

function createChoiceControl(definition) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "control choice-control";

  const legend = document.createElement("legend");
  legend.className = "control-label";
  legend.textContent = definition.label;

  const options = document.createElement("div");
  options.className = "choice-options";
  const inputs = [];

  for (const option of definition.options) {
    const label = document.createElement("label");
    label.className = "choice-option";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = definition.key;
    input.value = option.value;
    input.checked = option.value === assumptions[definition.key];

    const labelText = document.createElement("span");
    labelText.innerHTML = `<strong>${option.label}</strong><small>${option.description}</small>`;

    input.addEventListener("change", () => {
      if (!input.checked) return;
      assumptions[definition.key] = input.value;
      syncPermalink();
      renderResult();
    });

    label.append(input, labelText);
    options.append(label);
    inputs.push(input);
  }

  fieldset.append(legend, options);
  controls.append(fieldset);
  controlInputs.set(definition.key, { definition, inputs, type: "choice" });
}

function createControls() {
  for (const definition of assumptionDefinitions) {
    if (definition.type === "choice") {
      createChoiceControl(definition);
    } else {
      createRangeControl(definition);
    }
  }
}

function xPosition(index, count) {
  if (count <= 1) return plot.left;
  return plot.left + ((plot.right - plot.left) * index) / (count - 1);
}

function yPosition(value, domain) {
  const clamped = Math.min(domain.max, Math.max(domain.min, value));
  return plot.bottom - ((clamped - domain.min) / (domain.max - domain.min)) * (plot.bottom - plot.top);
}

function chartDomain(series, chart) {
  const comparisonSeries = chart.projectionOnly
    ? [series.baseline, series.policy]
    : [series.baseline, series.firmA, series.firmB];
  const maximum = Math.max(...comparisonSeries.flat());

  if (chart.domainKind === "fraction") {
    const fallbackMaximum = 0.03;
    const niceMaximum = Math.max(
      fallbackMaximum,
      Math.ceil((maximum * 100) / 3) * 3 / 100,
    );
    return { min: 0, max: niceMaximum };
  }

  if (chart.domainKind === "risk") {
    const minimum = Math.min(...comparisonSeries.flat());
    return {
      min: Math.max(0, Math.floor((minimum - 5) / 10) * 10),
      max: 100,
    };
  }

  const niceMaximum = Math.max(110, Math.ceil((maximum + 4) / 10) * 10);
  return { min: 100, max: niceMaximum };
}

function pathFromSeries(series, domain) {
  return series
    .map((value, index) => `${index === 0 ? "M" : "L"}${xPosition(index, series.length).toFixed(1)} ${yPosition(value, domain).toFixed(1)}`)
    .join(" ");
}

function areaBetween(upper, lower, domain) {
  const forward = upper.map((value, index) => `${index === 0 ? "M" : "L"}${xPosition(index, upper.length).toFixed(1)} ${yPosition(value, domain).toFixed(1)}`);
  const backward = lower
    .map((value, index) => ({ value, index }))
    .reverse()
    .map(({ value, index }) => `L${xPosition(index, lower.length).toFixed(1)} ${yPosition(value, domain).toFixed(1)}`);
  return `${forward.join(" ")} ${backward.join(" ")} Z`;
}

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  return element;
}

function renderAxes(chart, years, domain) {
  chart.axes.replaceChildren();

  const horizontalLines = [];
  const verticalLines = [];
  const yTickCount = 4;
  const xIndices = [0, Math.round((years.length - 1) * 0.25), Math.round((years.length - 1) * 0.5), Math.round((years.length - 1) * 0.75), years.length - 1];

  for (let index = 0; index < yTickCount; index += 1) {
    const ratio = index / (yTickCount - 1);
    const value = domain.max - (domain.max - domain.min) * ratio;
    const y = plot.top + (plot.bottom - plot.top) * ratio;
    horizontalLines.push(`M${plot.left} ${y.toFixed(1)}H${plot.right}`);

    const label = svgElement("text", {
      x: 50,
      y: (y + 5).toFixed(1),
      "text-anchor": "end",
    });
    label.textContent = chart.domainKind === "fraction"
      ? `${(value * 100).toFixed(0)}%`
      : Math.round(value);
    chart.axes.append(label);
  }

  for (const [position, seriesIndex] of xIndices.entries()) {
    const x = xPosition(seriesIndex, years.length);
    verticalLines.push(`M${x.toFixed(1)} ${plot.top}V${plot.bottom}`);

    const label = svgElement("text", {
      x: x.toFixed(1),
      y: 270,
      "text-anchor": position === 0 ? "start" : position === xIndices.length - 1 ? "end" : "middle",
    });
    label.textContent = Math.round(years[seriesIndex]);
    chart.axes.append(label);
  }

  chart.grid.setAttribute("d", `${horizontalLines.join(" ")} ${verticalLines.join(" ")}`);
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
    if (path.style.opacity === "0") continue;
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

function chartDescription(chart, result, metric) {
  const startYear = Math.round(result.series.years[0]);
  const endYear = Math.round(result.series.years.at(-1));
  const endValue = formatPercent(
    chart.projectionOnly ? metric.policy : metric.firmA,
  );

  if (chart.descriptionKind === "risk") {
    const scenarioDescription = scenario === "baseline"
      ? "The policy projection coincides with the normalized baseline."
      : `The policy projection ends ${endValue} below the normalized baseline in ${endYear}.`;
    return `Modeled AI risk indices from ${startYear} through ${endYear}. ${scenarioDescription}`;
  }

  if (chart.descriptionKind === "safetyBenefit") {
    const scenarioDescription = scenario === "baseline"
      ? "The policy projection remains at zero safety benefit."
      : `The policy projection reaches ${endValue} safety benefit in ${endYear}.`;
    return `Modeled safety benefit percentages from ${startYear} through ${endYear}. ${scenarioDescription}`;
  }

  if (chart.descriptionKind === "softwareLevel") {
    const scenarioDescription = scenario === "baseline"
      ? "Both firms follow the baseline level path."
      : scenario === "unilateral"
        ? `Firm A follows the policy level path while Firm B remains on the baseline, ending ${endValue} lower.`
        : `Both firms follow the same policy level path, ending ${endValue} lower.`;
    return `Modeled software-efficiency level indices from ${startYear} through ${endYear}. ${scenarioDescription}`;
  }

  if (chart.descriptionKind === "softwareSlowdown") {
    const scenarioDescription = scenario === "baseline"
      ? "Both firms remain at zero slowdown relative to baseline."
      : scenario === "unilateral"
        ? `Firm A reaches ${endValue} rate slowdown in ${endYear}; Firm B remains at zero.`
        : `Both firms follow the same slowdown path, reaching ${endValue} in ${endYear}.`;
    return `Modeled software progress slowdown percentages from ${startYear} through ${endYear}. ${scenarioDescription}`;
  }

  if (chart.descriptionKind === "capabilityGap") {
    const scenarioDescription = scenario === "baseline"
      ? "Both firms remain at zero capability gap relative to baseline."
      : scenario === "unilateral"
        ? `Firm A reaches a ${endValue} capability gap in ${endYear}; Firm B remains at zero.`
        : `Both firms follow the same gap path, reaching ${endValue} in ${endYear}.`;
    return `Modeled AI capability gap percentages from ${startYear} through ${endYear}. ${scenarioDescription}`;
  }

  const scenarioDescription = scenario === "baseline"
    ? "Both firms follow the baseline."
    : scenario === "unilateral"
      ? `Firm A follows the policy path while Firm B remains on the baseline, ending ${endValue} lower.`
      : `Both firms follow the same policy path, ending ${endValue} lower.`;
  return `Modeled frontier capability indices from ${startYear} through ${endYear}. ${scenarioDescription}`;
}

function renderChart(kind, result, shouldAnimate = true) {
  const chart = charts[kind];
  const series = result.series[chart.seriesKey];
  const domain = chartDomain(series, chart);

  if (!shouldAnimate) stopChartAnimation(chart);

  renderAxes(chart, result.series.years, domain);
  const firmASeries = chart.projectionOnly ? series.policy : series.firmA;
  const firmBSeries = chart.projectionOnly ? series.policy : series.firmB;

  chart.baseline.setAttribute("d", pathFromSeries(series.baseline, domain));
  chart.firmA.setAttribute("d", pathFromSeries(firmASeries, domain));
  chart.firmB.setAttribute(
    "d",
    chart.projectionOnly ? "" : pathFromSeries(firmBSeries, domain),
  );

  const comparisonSeries = chart.projectionOnly
    ? firmASeries
    : firmASeries.map((value, index) => (
      chart.areaMode === "max"
        ? Math.max(value, firmBSeries[index])
        : Math.min(value, firmBSeries[index])
    ));
  const areaUpper = chart.areaMode === "max" ? comparisonSeries : series.baseline;
  const areaLower = chart.areaMode === "max" ? series.baseline : comparisonSeries;
  chart.area.setAttribute("d", areaBetween(areaUpper, areaLower, domain));

  chart.firmA.style.opacity = scenario === "baseline" ? "0" : "1";
  chart.firmB.style.opacity = chart.projectionOnly
    ? "0"
    : scenario === "coordinated" ? "1" : "0";
  chart.firmB.classList.toggle(
    "is-overlapping",
    !chart.projectionOnly && scenario === "coordinated",
  );
  chart.area.style.opacity = scenario === "baseline" ? "0" : "0.42";

  const metric = result.metrics[chart.metricKey];
  chart.output.textContent = scenario === "baseline"
    ? `0.0% ${chart.zeroLabel}`
    : chart.projectionOnly
      ? `${formatPercent(metric.policy)} ${chart.resultLabel}`
      : scenario === "unilateral"
        ? `Firm A · ${formatPercent(metric.firmA)} ${chart.resultLabel}`
        : `Both firms · ${formatPercent(metric.firmA)} ${chart.resultLabel}`;

  chart.description.textContent = chartDescription(chart, result, metric);

  if (shouldAnimate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    animateChart(chart);
  }
}

function updateCalibrationReadout(calibration) {
  document.querySelector("#beta-value").textContent = calibration.beta.toFixed(3);
  document.querySelector("#gamma-value").textContent = calibration.gamma.toFixed(3);
  document.querySelector("#delta-value").textContent = calibration.delta.toFixed(3);
  document.querySelector("#lambda-value").textContent = calibration.lambda.toFixed(3);
  document.querySelector("#preset-name").textContent = calibration.label;
}

function updateComparisonStrip(result) {
  const comparisonAssumptions = { ...result.assumptions };
  const unilateral = runModel({ ...comparisonAssumptions, scenario: "unilateral" });
  const coordinated = runModel({ ...comparisonAssumptions, scenario: "coordinated" });

  document.querySelector("#baseline-status").textContent = "0.0% capability gap";
  document.querySelector("#unilateral-status").textContent = `Firm A ${formatPercent(unilateral.metrics.capabilityGap.firmA)} lower`;
  document.querySelector("#coordinated-status").textContent = `Both ${formatPercent(coordinated.metrics.capabilityGap.firmA)} lower`;

  for (const item of document.querySelectorAll(".comparison-strip [data-scenario]")) {
    const isActive = item.dataset.scenario === scenario;
    item.classList.toggle("is-active", isActive);
    if (isActive) {
      item.setAttribute("aria-current", "true");
    } else {
      item.removeAttribute("aria-current");
    }
  }
}

function renderResult(shouldAnimate = true) {
  try {
    const result = runModel({ ...assumptions, scenario });
    const capabilityGap = result.metrics.capabilityGap.firmA;

    modelError.hidden = true;
    headline.textContent = scenario === "baseline" ? "No divergence" : `${formatPercent(capabilityGap)} lower`;
    updateCalibrationReadout(result.calibration);
    renderChart("software", result, shouldAnimate);
    renderChart("softwareSlowdown", result, shouldAnimate);
    renderChart("capability", result, shouldAnimate);
    renderChart("capabilityGap", result, shouldAnimate);
    renderChart("risk", result, shouldAnimate);
    renderChart("safetyBenefit", result, shouldAnimate);
    updateComparisonStrip(result);
  } catch (error) {
    modelError.textContent = `The model could not run: ${error.message}. Reset the assumptions and try again.`;
    modelError.hidden = false;
    headline.textContent = "Model error";
  }
}

// ── Figure carousel ────────────────────────────────────────────────────

/**
 * Moves the plate track and keeps the selector, the position readout and the
 * accessibility tree in step.
 *
 * The carousel deliberately owns none of the rendering. All six plates are
 * drawn on every `renderResult`, exactly as they were when they were stacked;
 * this only decides which one you are looking at. That keeps the model wiring
 * and the chart tests independent of the presentation, and it means switching
 * figures costs a transform rather than a redraw.
 */
function initCarousel() {
  const track = document.querySelector("#carousel-track");
  const tabs = [...document.querySelectorAll(".carousel-tab")];
  const slides = [...document.querySelectorAll(".carousel-slide")];
  const previous = document.querySelector("#carousel-prev");
  const next = document.querySelector("#carousel-next");
  const position = document.querySelector("#carousel-position");

  if (!track || !slides.length || !tabs.length) return;

  let current = 0;

  function show(index, moveFocus = false) {
    current = Math.min(Math.max(index, 0), slides.length - 1);
    track.style.transform = `translateX(${current * -100}%)`;
    position.textContent = `Figure ${current + 1} of ${slides.length}`;

    slides.forEach((slide, slideIndex) => {
      slide.setAttribute("aria-hidden", String(slideIndex !== current));
    });

    tabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === current;
      tab.setAttribute("aria-selected", String(selected));
      // Roving tabindex: the selector is one tab stop, and the arrow keys
      // move within it. Six separate stops would push the comparison strip
      // six presses further away for anyone using the keyboard.
      tab.tabIndex = selected ? 0 : -1;
    });

    // The track does not wrap, so the ends are real stops.
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;

    if (moveFocus) tabs[current].focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => show(index));
  });

  document.querySelector("#carousel-tabs").addEventListener("keydown", (event) => {
    const steps = { ArrowRight: 1, ArrowLeft: -1, Home: -slides.length, End: slides.length };
    const step = steps[event.key];
    if (step === undefined) return;
    event.preventDefault();
    show(Math.min(Math.max(current + step, 0), slides.length - 1), true);
  });

  previous.addEventListener("click", () => show(current - 1));
  next.addEventListener("click", () => show(current + 1));

  show(0);
}

// ── Permalink ──────────────────────────────────────────────────────────

/**
 * Keeps the address bar in step with the controls. replaceState rather than
 * pushState: dragging a slider should not bury the back button under a hundred
 * history entries.
 */
function syncPermalink() {
  const query = encodeState({ assumptions, scenario }, permalinkConfig);
  window.history.replaceState(
    null,
    "",
    query ? `${window.location.pathname}?${query}` : window.location.pathname,
  );
}

if (copyLinkButton) {
  const idleLabel = copyLinkButton.textContent;
  let restoreLabel;

  copyLinkButton.addEventListener("click", async () => {
    const url = buildUrl({ assumptions, scenario }, permalinkConfig, window.location);

    try {
      await navigator.clipboard.writeText(url);
      copyLinkButton.textContent = "Copied";
    } catch {
      // Clipboard access can be refused, or unavailable over plain http. Say
      // so rather than failing silently; the URL is in the address bar anyway.
      syncPermalink();
      copyLinkButton.textContent = "Copy failed";
    }

    clearTimeout(restoreLabel);
    restoreLabel = setTimeout(() => {
      copyLinkButton.textContent = idleLabel;
    }, 1600);
  });
}

for (const input of scenarioInputs) {
  input.addEventListener("change", () => {
    if (!input.checked) return;
    scenario = input.value;
    syncPermalink();
    renderResult();
  });
}

resetButton.addEventListener("click", () => {
  for (const [key, control] of controlInputs) {
    assumptions[key] = control.definition.value;

    if (control.type === "range") {
      control.input.value = control.definition.value;
      control.value.textContent = formatValue(control.definition, control.definition.value);
      updateRangeFill(control.input);
    } else {
      for (const input of control.inputs) {
        input.checked = input.value === control.definition.value;
      }
    }
  }

  scenario = DEFAULT_SCENARIO;
  document.querySelector(`input[name="scenario"][value="${DEFAULT_SCENARIO}"]`).checked = true;
  syncPermalink();
  renderResult();
});

createControls();

// Reflect a scenario restored from the URL in the participation radios.
const restoredScenario = scenarioInputs.find((input) => input.value === scenario);
if (restoredScenario) restoredScenario.checked = true;

// Normalise the address bar on load, so a link carrying out-of-range or junk
// parameters becomes the configuration actually being displayed.
syncPermalink();
renderResult();
initCarousel();
