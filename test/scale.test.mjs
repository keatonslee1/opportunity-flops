import assert from "node:assert/strict";
import test from "node:test";

import { runModel } from "../public/model.js";
import {
  chartDomain,
  formatTickValue,
  fractionDecimals,
  niceStep,
  ticksWithin,
} from "../public/scale.js";

// Mirrors the chart configuration in app.js. Only the fields the scale reads.
const CHARTS = [
  { key: "software", domainKind: "level" },
  { key: "softwareSlowdown", domainKind: "fraction" },
  { key: "capability", domainKind: "level" },
  { key: "capabilityGap", domainKind: "fraction" },
  { key: "risk", domainKind: "risk", projectionOnly: true },
  { key: "safetyBenefit", domainKind: "fraction", projectionOnly: true },
];

/** Every domain the interface can actually be driven into. */
function* everyDomain() {
  for (const scenario of ["baseline", "unilateral", "coordinated"]) {
    for (const impactLevel of ["low", "medium", "high"]) {
      for (let computeReallocated = 0; computeReallocated <= 50; computeReallocated += 1) {
        const result = runModel({ computeReallocated, impactLevel, scenario });
        for (const chart of CHARTS) {
          const series = result.series[chart.key];
          yield {
            chart,
            series,
            domain: chartDomain(series, chart),
            where: `${chart.key} x=${computeReallocated} ${impactLevel} ${scenario}`,
          };
        }
      }
    }
  }
}

test("nice steps are 1/2/2.5/5 times a power of ten", () => {
  for (const span of [0.0004, 0.01, 0.24, 1, 3.9, 47.2, 100, 862]) {
    const step = niceStep(span);
    const mantissa = step / 10 ** Math.floor(Math.log10(step));
    assert.ok(
      [1, 2, 2.5, 5, 10].some((allowed) => Math.abs(mantissa - allowed) < 1e-9),
      `span ${span} produced step ${step} with mantissa ${mantissa}`,
    );
  }
});

test("a degenerate span never produces an unusable step", () => {
  for (const span of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.ok(niceStep(span) > 0, `span ${span} produced a non-positive step`);
  }
  assert.deepEqual(ticksWithin(0, 1, 0), [0, 1]);
});

test("ticks land on the step grid and stay inside the domain", () => {
  for (const { domain, where } of everyDomain()) {
    assert.ok(domain.ticks.length >= 2, `${where}: only ${domain.ticks.length} tick(s)`);
    assert.ok(domain.ticks.length <= 9, `${where}: ${domain.ticks.length} ticks is crowded`);
    for (const tick of domain.ticks) {
      assert.ok(
        tick >= domain.min - 1e-9 && tick <= domain.max + 1e-9,
        `${where}: tick ${tick} outside ${domain.min}..${domain.max}`,
      );
      const offGrid = Math.abs(tick / domain.step - Math.round(tick / domain.step));
      assert.ok(offGrid < 1e-6, `${where}: tick ${tick} is off the ${domain.step} grid`);
    }
  }
});

test("every domain has a positive, finite span", () => {
  for (const { domain, where } of everyDomain()) {
    assert.ok(Number.isFinite(domain.min) && Number.isFinite(domain.max), `${where}: non-finite`);
    assert.ok(domain.max > domain.min, `${where}: empty span ${domain.min}..${domain.max}`);
  }
});

// The point of the whole change: an axis that reframes to its data.
test("difference charts stay pinned to zero", () => {
  for (const { chart, domain, where } of everyDomain()) {
    if (chart.domainKind !== "fraction") continue;
    assert.equal(domain.min, 0, `${where}: zero is "no effect" and must stay the floor`);
  }
});

test("the risk axis always keeps the normalized baseline of 100 on screen", () => {
  for (const { chart, domain, where } of everyDomain()) {
    if (chart.domainKind !== "risk") continue;
    assert.equal(domain.max, 100, `${where}: baseline risk left the plot`);
    assert.ok(domain.min >= 0, `${where}: risk index went negative`);
  }
});

test("plots are framed to their data rather than to a fixed multiple", () => {
  for (const { chart, series, domain, where } of everyDomain()) {
    if (chart.domainKind !== "level") continue;
    const values = [series.baseline, series.firmA, series.firmB].filter(Array.isArray).flat();
    // A level chart wastes no headroom: the frame is the data.
    assert.ok(Math.abs(Math.min(...values) - domain.min) < 1e-9, `${where}: floor is not the data`);
    assert.ok(Math.abs(Math.max(...values) - domain.max) < 1e-9, `${where}: ceiling is not the data`);
  }
});

test("tick labels are distinct and print their step exactly", () => {
  for (const { chart, domain, where } of everyDomain()) {
    const labels = domain.ticks.map((tick) => formatTickValue(tick, chart, domain.step));
    assert.equal(
      new Set(labels).size,
      labels.length,
      `${where}: duplicate labels ${labels.join(" ")}`,
    );
  }
});

test("percentage precision follows the step, not its magnitude", () => {
  // A 2.5-point step printed without decimals turns evenly spaced gridlines
  // into unevenly spaced labels: 0, 3, 5, 8, 10, 13.
  assert.equal(fractionDecimals(0.1), 0);
  assert.equal(fractionDecimals(0.01), 0);
  assert.equal(fractionDecimals(0.025), 1);
  assert.equal(fractionDecimals(0.0025), 2);

  const chart = { domainKind: "fraction" };
  assert.equal(formatTickValue(0.025, chart, 0.025), "2.5%");
  assert.equal(formatTickValue(0.075, chart, 0.025), "7.5%");
  assert.equal(formatTickValue(0.002, chart, 0.0025), "0.20%");
  assert.equal(formatTickValue(0.2, chart, 0.1), "20%");
});

test("a small policy is not crushed into a window sized for a large one", () => {
  // The defect this change exists to fix: at a 3% reallocation the capability
  // gap is a few tenths of a percent, and the old fixed 0-3% window drew it
  // using about an eighth of the plot with every label rounded to "0%".
  const result = runModel({ computeReallocated: 3, impactLevel: "medium", scenario: "coordinated" });
  const chart = { domainKind: "fraction" };
  const domain = chartDomain(result.series.capabilityGap, chart);
  const peak = Math.max(...[result.series.capabilityGap.baseline, result.series.capabilityGap.firmA, result.series.capabilityGap.firmB].filter(Array.isArray).flat());

  assert.ok(domain.max <= 0.011, `expected a window near the data, got 0..${domain.max}`);
  assert.ok(peak / domain.max > 0.35, `data fills only ${((peak / domain.max) * 100).toFixed(1)}% of the plot`);

  const labels = domain.ticks.map((tick) => formatTickValue(tick, chart, domain.step));
  assert.ok(labels.filter((label) => label === "0%").length <= 1, `labels collapsed: ${labels.join(" ")}`);
});
