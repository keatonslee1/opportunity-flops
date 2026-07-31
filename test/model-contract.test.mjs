import assert from "node:assert/strict";
import test from "node:test";

import {
  assumptionDefinitions,
  impactPresets,
  runModel,
} from "../public/model.js";

function assertClose(actual, expected, tolerance = 1e-12) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

test("model publishes range and categorical assumption definitions", () => {
  assert.deepEqual(assumptionDefinitions, [
    {
      key: "computeReallocated",
      type: "range",
      label: "R&D compute to alignment",
      min: 0,
      max: 50,
      step: 1,
      value: 20,
      suffix: "%",
    },
    {
      key: "impactLevel",
      type: "choice",
      label: "Impact sensitivity",
      value: "medium",
      options: [
        { value: "low", label: "Low", description: "Lower elasticities" },
        { value: "medium", label: "Medium", description: "Central sensitivity" },
        { value: "high", label: "High", description: "Higher elasticities" },
      ],
    },
  ]);

  assert.deepEqual(impactPresets, {
    low: { beta: 0.15, gamma: 0.2, delta: 0.5 },
    medium: { beta: 0.3, gamma: 0.4, delta: 0.7 },
    high: { beta: 0.5, gamma: 0.6, delta: 0.9 },
  });
});

test("model returns normalized defaults and quarterly normalized series", () => {
  const result = runModel({
    computeReallocated: 20,
    impactLevel: "medium",
  });

  assert.equal(result.status, "ready");
  assert.deepEqual(result.assumptions, {
    computeReallocated: 20,
    impactLevel: "medium",
    scenario: "coordinated",
  });
  assert.equal(result.calibration.startYear, 2026);
  assert.equal(result.calibration.endYear, 2034);
  assert.equal(result.calibration.horizonYears, 8);
  assert.equal(result.calibration.sampleIntervalYears, 0.25);
  assert.equal(result.calibration.initialSoftware, 1);
  assert.equal(result.calibration.baselineSoftwareAtHorizon, 2);
  assert.equal(result.calibration.presetEmpirical, false);
  assert.equal(result.calibration.label, "Central sensitivity");
  assertClose(
    result.calibration.k,
    (2 ** (1 - result.calibration.gamma) - 1)
      / ((1 - result.calibration.gamma) * 8),
  );
  assert.deepEqual(
    {
      beta: result.calibration.beta,
      gamma: result.calibration.gamma,
      delta: result.calibration.delta,
    },
    impactPresets.medium,
  );

  assert.equal(result.series.years.length, 33);
  assert.equal(result.series.years[0], 2026);
  assert.equal(result.series.years.at(-1), 2034);
  for (let index = 1; index < result.series.years.length; index += 1) {
    assert.equal(result.series.years[index] - result.series.years[index - 1], 0.25);
  }

  for (const kind of ["software", "capability"]) {
    for (const firm of ["baseline", "firmA", "firmB"]) {
      assert.equal(result.series[kind][firm].length, 33);
      assert.equal(result.series[kind][firm][0], 100);
    }
  }
  assert.ok(Math.abs(result.series.software.baseline.at(-1) - 200) < 1e-12);
});

test("all software and capability trajectories increase monotonically", () => {
  const { series } = runModel({
    computeReallocated: 20,
    impactLevel: "medium",
  });

  for (const kind of ["software", "capability"]) {
    for (const firm of ["baseline", "firmA", "firmB"]) {
      const values = series[kind][firm];
      for (let index = 1; index < values.length; index += 1) {
        assert.ok(values[index] > values[index - 1]);
      }
    }
  }
});

test("baseline scenario keeps both firms on the baseline with zero metrics", () => {
  const result = runModel({
    computeReallocated: 20,
    impactLevel: "medium",
    scenario: "baseline",
  });

  assert.deepEqual(result.series.software.firmA, result.series.software.baseline);
  assert.deepEqual(result.series.software.firmB, result.series.software.baseline);
  assert.deepEqual(result.series.capability.firmA, result.series.capability.baseline);
  assert.deepEqual(result.series.capability.firmB, result.series.capability.baseline);
  assert.deepEqual(result.metrics, {
    evaluatedAtYear: 2034,
    softwareSlowdown: { firmA: 0, firmB: 0 },
    softwareLevelGap: { firmA: 0, firmB: 0 },
    capabilityGap: { firmA: 0, firmB: 0 },
  });
});

test("unilateral policy slows firm A while firm B remains on baseline", () => {
  const result = runModel({
    computeReallocated: 20,
    impactLevel: "medium",
    scenario: "unilateral",
  });

  assert.ok(
    result.series.software.firmA.at(-1)
      < result.series.software.baseline.at(-1),
  );
  assert.ok(
    result.series.capability.firmA.at(-1)
      < result.series.capability.baseline.at(-1),
  );
  assert.deepEqual(result.series.software.firmB, result.series.software.baseline);
  assert.deepEqual(result.series.capability.firmB, result.series.capability.baseline);
  assert.ok(result.metrics.softwareSlowdown.firmA > 0);
  assert.ok(result.metrics.capabilityGap.firmA > 0);
  assert.equal(result.metrics.softwareSlowdown.firmB, 0);
  assert.equal(result.metrics.capabilityGap.firmB, 0);
});

test("coordinated policy gives both firms the same path below baseline", () => {
  const result = runModel({
    computeReallocated: 20,
    impactLevel: "medium",
    scenario: "coordinated",
  });

  assert.deepEqual(result.series.software.firmA, result.series.software.firmB);
  assert.deepEqual(result.series.capability.firmA, result.series.capability.firmB);
  assert.ok(
    result.series.software.firmA.at(-1)
      < result.series.software.baseline.at(-1),
  );
  assert.ok(
    result.series.capability.firmA.at(-1)
      < result.series.capability.baseline.at(-1),
  );
  assert.equal(
    result.metrics.softwareSlowdown.firmA,
    result.metrics.softwareSlowdown.firmB,
  );
  assert.equal(
    result.metrics.capabilityGap.firmA,
    result.metrics.capabilityGap.firmB,
  );
});

test("zero reallocation makes every scenario coincide with baseline", () => {
  for (const scenario of ["baseline", "unilateral", "coordinated"]) {
    const result = runModel({
      computeReallocated: 0,
      impactLevel: "medium",
      scenario,
    });

    assert.deepEqual(result.series.software.firmA, result.series.software.baseline);
    assert.deepEqual(result.series.software.firmB, result.series.software.baseline);
    assert.deepEqual(result.series.capability.firmA, result.series.capability.baseline);
    assert.deepEqual(result.series.capability.firmB, result.series.capability.baseline);
    assert.deepEqual(result.metrics, {
      evaluatedAtYear: 2034,
      softwareSlowdown: { firmA: 0, firmB: 0 },
      softwareLevelGap: { firmA: 0, firmB: 0 },
      capabilityGap: { firmA: 0, firmB: 0 },
    });
  }
});

test("high-impact sensitivity produces a larger capability gap than low-impact", () => {
  const common = {
    computeReallocated: 20,
    scenario: "coordinated",
  };
  const low = runModel({ ...common, impactLevel: "low" });
  const high = runModel({ ...common, impactLevel: "high" });

  assert.ok(
    high.metrics.capabilityGap.firmA
      > low.metrics.capabilityGap.firmA,
  );
  assert.ok(
    high.metrics.capabilityGap.firmB
      > low.metrics.capabilityGap.firmB,
  );
});

test("horizon metrics obey the capability-level and software-derivative identities", () => {
  const result = runModel({
    computeReallocated: 35,
    impactLevel: "high",
    scenario: "unilateral",
  });
  const softwareRatio = (
    result.series.software.firmA.at(-1)
    / result.series.software.baseline.at(-1)
  );
  const expectedCapabilityGap = 1 - softwareRatio ** result.calibration.delta;
  const expectedSoftwareSlowdown = 1 - (
    result.calibration.policyRateMultiplier
    * softwareRatio ** result.calibration.gamma
  );

  assertClose(result.metrics.capabilityGap.firmA, expectedCapabilityGap);
  assertClose(result.metrics.softwareSlowdown.firmA, expectedSoftwareSlowdown);
  assertClose(
    result.series.capability.firmA.at(-1)
      / result.series.capability.baseline.at(-1),
    softwareRatio ** result.calibration.delta,
  );
});

test("closed-form software solution holds at an intermediate time", () => {
  const result = runModel({
    computeReallocated: 20,
    impactLevel: "medium",
    scenario: "unilateral",
  });
  const index = result.series.years.indexOf(2027);
  const { gamma, k, policyRateMultiplier } = result.calibration;
  const levelAtOneYear = (rateMultiplier) => 100 * (
    1 + (1 - gamma) * k * rateMultiplier
  ) ** (1 / (1 - gamma));

  assert.notEqual(index, -1);
  assertClose(result.series.software.baseline[index], levelAtOneYear(1));
  assertClose(
    result.series.software.firmA[index],
    levelAtOneYear(policyRateMultiplier),
  );
  assertClose(result.series.software.firmB[index], levelAtOneYear(1));
});

test("the exact 50 percent reallocation boundary is accepted and finite", () => {
  for (const impactLevel of ["low", "medium", "high"]) {
    const result = runModel({
      computeReallocated: 50,
      impactLevel,
      scenario: "coordinated",
    });

    assert.equal(result.assumptions.computeReallocated, 50);
    assert.ok(Number.isFinite(result.calibration.policyRateMultiplier));
    for (const kind of ["software", "softwareRate", "capability"]) {
      for (const firm of ["baseline", "firmA", "firmB"]) {
        assert.ok(result.series[kind][firm].every(Number.isFinite));
      }
    }
    assert.ok(Number.isFinite(result.metrics.softwareSlowdown.firmA));
    assert.ok(Number.isFinite(result.metrics.softwareLevelGap.firmA));
    assert.ok(Number.isFinite(result.metrics.capabilityGap.firmA));
  }
});

test("invalid assumption objects, values, ranges, and enums throw", () => {
  assert.throws(() => runModel(null), /assumptions must be an object/);
  assert.throws(() => runModel([]), /assumptions must be an object/);

  for (const computeReallocated of ["20", Number.NaN, Infinity]) {
    assert.throws(
      () => runModel({ computeReallocated }),
      /computeReallocated must be a finite number/,
    );
  }
  for (const computeReallocated of [-0.01, 50.01]) {
    assert.throws(
      () => runModel({ computeReallocated }),
      /computeReallocated must be between 0 and 50/,
    );
  }

  assert.throws(
    () => runModel({ impactLevel: "extreme" }),
    /impactLevel must be one of: low, medium, high/,
  );
  assert.throws(
    () => runModel({ scenario: "duopoly" }),
    /scenario must be one of: baseline, unilateral, coordinated/,
  );
});

test("model normalizes into a new object without mutating caller input", () => {
  const input = Object.freeze({
    computeReallocated: 12,
    impactLevel: "low",
  });
  const result = runModel(input);

  assert.deepEqual(input, {
    computeReallocated: 12,
    impactLevel: "low",
  });
  assert.notEqual(result.assumptions, input);
  assert.deepEqual(result.assumptions, {
    computeReallocated: 12,
    impactLevel: "low",
    scenario: "coordinated",
  });
});

test("model exposes rate series, metric timing, units, and calibration caveats", () => {
  const result = runModel({
    computeReallocated: 20,
    impactLevel: "medium",
    scenario: "unilateral",
  });

  for (const firm of ["baseline", "firmA", "firmB"]) {
    assert.equal(result.series.softwareRate[firm].length, 33);
    assert.ok(result.series.softwareRate[firm].every((value) => value > 0));
  }
  assert.equal(result.metrics.evaluatedAtYear, 2034);
  assertClose(
    result.metrics.softwareLevelGap.firmA,
    1 - (
      result.series.software.firmA.at(-1)
      / result.series.software.baseline.at(-1)
    ),
  );
  assert.equal(result.metrics.softwareLevelGap.firmB, 0);
  assert.deepEqual(result.units, {
    years: "calendar year",
    software: "index (2026 = 100)",
    softwareRate: "software index points per year",
    capability: "training-compute-normalized index (2026 = 100)",
    metrics: "fraction of baseline at 2034",
  });
  assert.equal(result.caveats.length, 5);
  assert.match(result.caveats[0], /capability-R&D compute is fixed/i);
  assert.match(result.caveats[1], /training compute is unchanged/i);
  assert.match(result.caveats[2], /baseline is normalized/i);
  assert.match(result.caveats[3], /A is absorbed.*alpha.*cancels/i);
  assert.match(result.caveats[4], /working placeholder values/i);
});

test("initial software-rate slowdown equals one minus the policy multiplier", () => {
  const computeReallocated = 35;
  const result = runModel({
    computeReallocated,
    impactLevel: "high",
    scenario: "coordinated",
  });
  const expectedMultiplier = (
    1 - computeReallocated / 100
  ) ** result.calibration.beta;
  const initialRateSlowdown = 1 - (
    result.series.softwareRate.firmA[0]
    / result.series.softwareRate.baseline[0]
  );

  assertClose(result.calibration.policyRateMultiplier, expectedMultiplier);
  assertClose(initialRateSlowdown, 1 - expectedMultiplier);
});
