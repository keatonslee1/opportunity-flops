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

// The plate each chart is drawn on, and the year rule that crosses it. Looked
// up by convention rather than listed six more times in the config above: the
// ids are already derivable from the chart svg's own id.
for (const [kind, chart] of Object.entries(charts)) {
  chart.kind = kind;
  chart.plate = chart.svg?.closest(".plate") ?? null;
  chart.yearRule = document.querySelector(`#${chart.svg.id.replace("-chart", "")}-year-rule`);
}

function formatValue(definition, value) {
  return `${value}${definition.suffix ?? ""}`;
}

function formatPercent(value) {
  return `${(Math.max(0, value) * 100).toFixed(1)}%`;
}

// The fill is a real element, not a gradient stop. --fill sizes it, and it
// lives on the wrapper so the track, the fill and the thumb all read one
// value. See the range-control note in styles.css.
function updateRangeFill(input) {
  const progress = ((Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min))) * 100;
  (input.closest(".range") ?? input).style.setProperty("--fill", `${progress}%`);
}

function createRangeControl(definition) {
  const row = document.createElement("label");
  row.className = "control";

  const title = document.createElement("span");
  title.className = "control-label";
  title.textContent = definition.label;

  const value = document.createElement("output");
  value.textContent = formatValue(definition, assumptions[definition.key]);

  const slot = document.createElement("span");
  slot.className = "range";

  const track = document.createElement("span");
  track.className = "range-track";
  const fill = document.createElement("span");
  fill.className = "range-fill";

  const input = document.createElement("input");
  input.type = "range";
  input.min = definition.min;
  input.max = definition.max;
  input.step = definition.step;
  input.value = assumptions[definition.key];
  input.setAttribute("aria-label", definition.label);

  slot.append(track, fill, input);
  updateRangeFill(input);

  input.addEventListener("input", () => {
    assumptions[definition.key] = Number(input.value);
    value.textContent = formatValue(definition, input.value);
    updateRangeFill(input);
    syncPermalink();
    // Dragging updates the paths immediately and does not replay the draw.
    // The chart-recorder animation is reserved for entry and for discrete
    // scenario changes; replaying it on every input event would make the
    // instrument feel like it was rebooting under the reader's hand.
    renderResult(false);
  });

  row.append(title, value, slot);
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

    latestResult = result;
    renderComputeBank();
    // The rule stays where the reader put it across a re-render; only the
    // numbers under it change. Moving it back to a default on every slider
    // tick would mean losing your place every time you adjusted anything.
    if (cursorIndex !== null) applyYearCursor(false);
  } catch (error) {
    modelError.textContent = `The model could not run: ${error.message}. Reset the assumptions and try again.`;
    modelError.hidden = false;
    headline.textContent = "Model error";
  }
}

// ── Plate I — the compute bank ─────────────────────────────────────────
//
// A hundred unit marks standing for frontier R&D compute, one per cent each.
// The committed share flips from capability to alignment mark by mark under
// the policy slider. The flip is a fill change as well as an ink change —
// solid bar to hollow bar with a crossbar — so the picture still reads with
// no colour at all, which is what the greyscale requirement actually needs.
//
// The marks are decorative and aria-hidden; the count beside them is the text
// equivalent, and it is the live region.

const computeMarksSvg = document.querySelector("#compute-marks");
const computePlateReadout = document.querySelector("#compute-plate-readout");

const COMPUTE_UNITS = 100;

// Fifty marks to a row, two rows. The slider tops out at 50 per cent, so a
// full commitment is exactly the top row — the control's whole range and the
// picture's top line are the same statement.
//
// That correspondence is worth a lot at desktop width and nothing at all on a
// phone: fifty marks across 360px puts each one at four pixels, where the bank
// reads as a texture rather than as a count, and a count is the entire point of
// an Isotype array. Below 560px it restacks to twenty across. The drawing is
// generated, so this is a rebuild rather than a stylesheet override — the
// geometry lives in one place either way.
const WIDE_LAYOUT = { columns: 50, width: 9, height: 20, pitchX: 15, pitchY: 26, originX: 3, originY: 4 };
const NARROW_LAYOUT = { columns: 20, width: 22, height: 20, pitchX: 37.5, pitchY: 26, originX: 7, originY: 4 };

const narrowBank = window.matchMedia("(max-width: 560px)");

const computeMarks = [];
let commitmentCaret = null;

function buildComputeBank() {
  if (!computeMarksSvg) return;

  const layout = narrowBank.matches ? NARROW_LAYOUT : WIDE_LAYOUT;
  const rows = Math.ceil(COMPUTE_UNITS / layout.columns);

  computeMarksSvg.replaceChildren();
  computeMarks.length = 0;
  computeMarksSvg.setAttribute(
    "viewBox",
    `0 0 750 ${layout.originY * 2 + (rows - 1) * layout.pitchY + layout.height}`,
  );

  const fragment = document.createDocumentFragment();

  for (let index = 0; index < COMPUTE_UNITS; index += 1) {
    const column = index % layout.columns;
    const row = Math.floor(index / layout.columns);
    const x = layout.originX + column * layout.pitchX;
    const y = layout.originY + row * layout.pitchY;

    const unit = svgElement("g", { class: "unit", "data-role": "capability" });
    unit.append(
      svgElement("rect", {
        class: "mark-capability", x, y, width: layout.width, height: layout.height,
      }),
      // Inset by half the stroke so the hollow mark occupies exactly the same
      // footprint as the solid one and the bank does not shimmer on flip.
      svgElement("rect", {
        class: "mark-alignment",
        x: x + 1, y: y + 1, width: layout.width - 2, height: layout.height - 2,
      }),
    );
    fragment.append(unit);
    computeMarks.push(unit);
  }

  computeMarksSvg.append(fragment);

  // Appended last so it draws over the marks. Fluoro, drawn, and the only
  // place the loud ink appears on this page.
  commitmentCaret = svgElement("path", { class: "commitment-caret" });
  computeMarksSvg.append(commitmentCaret);
}

// Marks where the commitment ends — the boundary between the last alignment
// mark and the first capability mark. Positioned from the same layout the
// marks are drawn from, so it lands correctly in either arrangement.
function renderCommitmentCaret(reallocated) {
  if (!commitmentCaret) return;

  if (reallocated <= 0 || reallocated >= COMPUTE_UNITS) {
    commitmentCaret.setAttribute("d", "");
    return;
  }

  const layout = narrowBank.matches ? NARROW_LAYOUT : WIDE_LAYOUT;
  const last = reallocated - 1;
  const x = layout.originX + (last % layout.columns) * layout.pitchX + layout.width;
  const y = layout.originY + Math.floor(last / layout.columns) * layout.pitchY + layout.height;
  const w = 4;
  commitmentCaret.setAttribute(
    "d",
    `M${(x - w).toFixed(1)} ${(y + 2).toFixed(1)}H${(x + w).toFixed(1)}L${x.toFixed(1)} ${(y + 7).toFixed(1)}Z`,
  );
}

// Rebuild on the breakpoint itself, not on every resize event: crossing 560px
// is the only width that changes the drawing.
narrowBank.addEventListener("change", () => {
  buildComputeBank();
  renderComputeBank();
});

function renderComputeBank() {
  if (!computeMarks.length) return;

  // The slider is a percentage and there are a hundred marks, so one step of
  // the control is exactly one mark. That correspondence is the whole reason
  // the bank is a hundred units and not fifty.
  const reallocated = scenario === "baseline"
    ? 0
    : Math.round(Math.min(100, Math.max(0, assumptions.computeReallocated)));

  for (const [index, unit] of computeMarks.entries()) {
    unit.dataset.role = index < reallocated ? "alignment" : "capability";
  }

  renderCommitmentCaret(reallocated);

  computePlateReadout.textContent = reallocated === 0
    ? "Frontier R&D compute · 100 units to capability"
    : `Frontier R&D compute · ${reallocated} to alignment · ${100 - reallocated} to capability`;
}

// ── The year cursor ────────────────────────────────────────────────────
//
// The signature moment. Pointing at or focusing any plate raises a vertical
// rule at that year across all six at once, and every plate reports its own
// value for that year on its own readout line.
//
// Deliberately not gated behind prefers-reduced-motion. The rule does not
// animate — it is a readout, and the reduced-motion gate is for motion. Taking
// it away would remove a way of reading the figures from exactly the readers
// most likely to depend on it. What the gate does disable, in renderChart, is
// the chart-recorder draw.

const plateBay = document.querySelector("#plate-bay");
const yearAnnounce = document.querySelector("#year-cursor-announce");

let latestResult = null;
let cursorIndex = null;

function yearCount() {
  return latestResult?.series.years.length ?? 0;
}

// The model samples quarterly, but the axis is labelled in whole years and the
// reader thinks in whole years. Without this the rule moved a quarter at a
// time and the readout printed "2034" for four consecutive presses, so an
// arrow key looked broken. Derived from the data rather than hardcoded to 4,
// because the sampling interval belongs to the model, not to this file.
function yearStep() {
  const years = latestResult?.series.years;
  if (!years || years.length < 2) return 1;
  return Math.max(1, Math.round(1 / (years[1] - years[0])));
}

function formatAt(chart, value) {
  return chart.domainKind === "fraction"
    ? `${(value * 100).toFixed(1)}%`
    : value.toFixed(1);
}

function cursorReadout(chart, index) {
  const series = latestResult.series[chart.seriesKey];
  const year = Math.round(latestResult.series.years[index]);
  const at = (values) => formatAt(chart, values[index]);

  if (chart.projectionOnly) {
    return `${year} · ${at(series.policy)} · base ${at(series.baseline)}`;
  }
  if (scenario === "baseline") {
    return `${year} · ${at(series.baseline)}`;
  }
  if (scenario === "unilateral") {
    return `${year} · A ${at(series.firmA)} · base ${at(series.baseline)}`;
  }
  return `${year} · A/B ${at(series.firmA)} · base ${at(series.baseline)}`;
}

function applyYearCursor(announce) {
  const count = yearCount();

  for (const chart of Object.values(charts)) {
    if (cursorIndex === null || !count) {
      chart.yearRule.hidden = true;
      chart.plate?.classList.remove("is-cursored");
      chart.output.classList.remove("is-cursored");
      continue;
    }

    const x = xPosition(cursorIndex, count);
    chart.yearRule.setAttribute("transform", `translate(${(x - plot.left).toFixed(1)} 0)`);
    chart.yearRule.hidden = false;
    chart.plate?.classList.add("is-cursored");
    chart.output.classList.add("is-cursored");
    chart.output.textContent = cursorReadout(chart, cursorIndex);
  }

  if (cursorIndex === null) {
    // Put the summary values back; they are what the plate says at rest.
    if (latestResult) {
      for (const kind of Object.keys(charts)) renderChart(kind, latestResult, false);
    }
    yearAnnounce.textContent = "";
    return;
  }

  if (announce) {
    const year = Math.round(latestResult.series.years[cursorIndex]);
    yearAnnounce.textContent = `Year ${year}. ${
      Object.values(charts)
        .map((chart) => `${chart.plate?.querySelector("figcaption h3")?.textContent ?? chart.kind}, ${chart.output.textContent}`)
        .join(". ")
    }.`;
  }
}

function setYearCursor(index, { announce = false } = {}) {
  const count = yearCount();
  if (!count) return;

  const step = yearStep();
  const next = index === null
    ? null
    : Math.min(count - 1, Math.max(0, Math.round(index / step) * step));

  if (next === cursorIndex) {
    // Re-announcing an unchanged year still matters: a keyboard reader who
    // holds ArrowLeft at the start of the series needs to hear that it did
    // not move, rather than silence.
    if (announce && next !== null) applyYearCursor(true);
    return;
  }
  cursorIndex = next;
  applyYearCursor(announce);
}

// Maps a client x onto a year index using the plot's own geometry, so the
// rule lands on a sampled year rather than wherever the pointer happens to be.
function indexFromPointer(chartSvg, clientX) {
  const count = yearCount();
  if (!count) return null;

  const rect = chartSvg.getBoundingClientRect();
  if (!rect.width) return null;

  const viewBoxX = ((clientX - rect.left) / rect.width) * 800;
  const ratio = (viewBoxX - plot.left) / (plot.right - plot.left);
  return Math.round(Math.min(1, Math.max(0, ratio)) * (count - 1));
}

function chartFromEvent(event) {
  const plate = event.target.closest?.(".plate");
  if (!plate) return null;
  return charts[plate.dataset.chart] ?? null;
}

if (plateBay) {
  plateBay.addEventListener("pointermove", (event) => {
    // Touch drags are scrolls. Tapping still works, via click below.
    if (event.pointerType === "touch") return;
    const chart = chartFromEvent(event);
    if (!chart) return;
    setYearCursor(indexFromPointer(chart.svg, event.clientX));
  });

  plateBay.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "touch") return;
    setYearCursor(null);
  });

  plateBay.addEventListener("click", (event) => {
    const chart = chartFromEvent(event);
    if (!chart) return;
    setYearCursor(indexFromPointer(chart.svg, event.clientX), { announce: true });
  });

  // Focusing a plate puts the rule on the horizon year — the one the headline
  // quotes — so a keyboard reader lands somewhere meaningful rather than at
  // the left edge where every series is still identical.
  plateBay.addEventListener("focusin", (event) => {
    if (!event.target.classList?.contains("plate")) return;
    if (cursorIndex === null) setYearCursor(yearCount() - 1, { announce: true });
  });

  plateBay.addEventListener("keydown", (event) => {
    if (!event.target.classList?.contains("plate")) return;

    const count = yearCount();
    if (!count) return;
    const from = cursorIndex ?? count - 1;
    const step = yearStep();

    switch (event.key) {
      case "ArrowLeft":
        setYearCursor(from - step, { announce: true });
        break;
      case "ArrowRight":
        setYearCursor(from + step, { announce: true });
        break;
      case "Home":
        setYearCursor(0, { announce: true });
        break;
      case "End":
        setYearCursor(count - 1, { announce: true });
        break;
      case "Escape":
        setYearCursor(null);
        return;
      default:
        return;
    }

    // Arrow keys would otherwise scroll the plate bay out from under the rule.
    event.preventDefault();
  });
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
buildComputeBank();

// Reflect a scenario restored from the URL in the participation radios.
const restoredScenario = scenarioInputs.find((input) => input.value === scenario);
if (restoredScenario) restoredScenario.checked = true;

// Normalise the address bar on load, so a link carrying out-of-range or junk
// parameters becomes the configuration actually being displayed.
syncPermalink();
renderResult();
