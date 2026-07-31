import assert from "node:assert/strict";
import test from "node:test";

import {
  assumptionDefinitions,
  impactPresets,
  monteCarloCalibration,
  runModel,
} from "../public/model.js";

function assertClose(actual, expected, tolerance = 1e-12) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
}

test("model publishes the reproducible Monte Carlo calibration contract", () => {
  assert.deepEqual(monteCarloCalibration, {
    sampleCount: 10_000,
    seed: 20_260_731,
    randomGenerator: "Mulberry32",
    drawOrder: ["beta", "gamma", "delta", "lambda"],
    quantileMethod: "linear interpolation at (n - 1)q",
    parameterSampling: "independent marginal draws",
    bundleConstruction: "rank-aligned marginal quantiles",
    distributionStatus: "working assumptions",
    quantiles: { low: 0.1, medium: 0.5, high: 0.9 },
    distributions: {
      beta: { min: 0.15, mode: 0.3, max: 0.5 },
      gamma: { min: 0.2, mode: 0.4, max: 0.6 },
      delta: { min: 0.5, mode: 0.7, max: 0.9 },
      lambda: { min: 0.2, mode: 0.4, max: 0.6 },
    },
  });
});

test("impact levels are seeded marginal P10, P50, and P90 parameter bundles", () => {
  const expected = {
    low: {
      beta: 0.2225944032791555,
      gamma: 0.28957074404343597,
      delta: 0.5886460784649494,
      lambda: 0.2881991767290228,
    },
    medium: {
      beta: 0.31261892100480526,
      gamma: 0.3999351351280472,
      delta: 0.7005358951277937,
      lambda: 0.39957768833473406,
    },
    high: {
      beta: 0.4160608485069721,
      gamma: 0.510705813410008,
      delta: 0.8096371478233727,
      lambda: 0.5093703453115629,
    },
  };

  for (const impactLevel of ["low", "medium", "high"]) {
    for (const parameter of ["beta", "gamma", "delta", "lambda"]) {
      assertClose(
        impactPresets[impactLevel][parameter],
        expected[impactLevel][parameter],
      );
    }
  }
});

test("Monte Carlo bundles remain ordered and inside every triangular support", () => {
  for (const parameter of monteCarloCalibration.drawOrder) {
    const distribution = monteCarloCalibration.distributions[parameter];
    const values = ["low", "medium", "high"].map(
      (impactLevel) => impactPresets[impactLevel][parameter],
    );

    assert.ok(distribution.min <= distribution.mode);
    assert.ok(distribution.mode <= distribution.max);
    assert.ok(values[0] >= distribution.min);
    assert.ok(values[2] <= distribution.max);
    assert.ok(values[0] < values[1]);
    assert.ok(values[1] < values[2]);
  }

  assert.ok(monteCarloCalibration.distributions.gamma.max < 1);
});

test("seeded marginal bundles track their triangular target quantiles", () => {
  const triangularQuantile = (probability, { min, mode, max }) => {
    const probabilityAtMode = (mode - min) / (max - min);
    return probability < probabilityAtMode
      ? min + Math.sqrt(probability * (max - min) * (mode - min))
      : max - Math.sqrt((1 - probability) * (max - min) * (max - mode));
  };

  for (const [impactLevel, probability] of Object.entries(
    monteCarloCalibration.quantiles,
  )) {
    for (const parameter of monteCarloCalibration.drawOrder) {
      assertClose(
        impactPresets[impactLevel][parameter],
        triangularQuantile(
          probability,
          monteCarloCalibration.distributions[parameter],
        ),
        0.005,
      );
    }
  }
});

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
        { value: "low", label: "Low", description: "P10 parameter bundle" },
        { value: "medium", label: "Medium", description: "P50 parameter bundle" },
        { value: "high", label: "High", description: "P90 parameter bundle" },
      ],
    },
  ]);

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
  assert.equal(result.calibration.label, "P50 parameter bundle");
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
      lambda: result.calibration.lambda,
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

test("model returns the selected Monte Carlo bundle with its provenance", () => {
  const result = runModel({ impactLevel: "medium" });

  assert.equal(result.calibration.calibrationMethod, "assumed-prior Monte Carlo");
  assert.equal(result.calibration.presetEmpirical, false);
  assert.deepEqual(result.calibration.monteCarlo, {
    sampleCount: 10_000,
    seed: 20_260_731,
    randomGenerator: "Mulberry32",
    quantileMethod: "linear interpolation at (n - 1)q",
    parameterSampling: "independent marginal draws",
    bundleConstruction: "rank-aligned marginal quantiles",
    selectedQuantile: 0.5,
    selectedQuantileLabel: "P50",
    distributionStatus: "working assumptions",
    distributions: monteCarloCalibration.distributions,
  });
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
    safetyBenefit: { policy: 0 },
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
      safetyBenefit: { policy: 0 },
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
    assert.ok(Number.isFinite(result.metrics.safetyBenefit.policy));
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
    softwareSlowdown: "fractional reduction from baseline software progress rate",
    capability: "training-compute-normalized index (2026 = 100)",
    capabilityGap: "fractional reduction from baseline capability",
    risk: "normalized AI risk index (baseline = 100)",
    safetyBenefit: "fractional reduction from baseline AI risk",
    metrics: "fraction of baseline at 2034",
  });
  assert.equal(result.caveats.length, 8);
  assert.match(result.caveats[0], /capability-R&D compute is fixed/i);
  assert.match(result.caveats[1], /training compute is unchanged/i);
  assert.match(result.caveats[2], /baseline is normalized/i);
  assert.match(result.caveats[3], /A is absorbed.*alpha.*cancels/i);
  assert.match(result.caveats[4], /10,000.*triangular.*working assumptions/i);
  assert.match(result.caveats[5], /rank-aligned.*P10.*P50.*P90.*not joint outcome/i);
  assert.match(result.caveats[6], /baseline AI risk path.*normalized.*100/i);
  assert.match(result.caveats[7], /Lambda.*triangular.*working prior/i);
});

test("model exposes software progress slowdown at every charted time", () => {
  const result = runModel({
    computeReallocated: 20,
    impactLevel: "medium",
    scenario: "unilateral",
  });

  for (const firm of ["baseline", "firmA", "firmB"]) {
    assert.equal(
      result.series.softwareSlowdown[firm].length,
      result.series.years.length,
    );
  }

  for (let index = 0; index < result.series.years.length; index += 1) {
    assert.equal(result.series.softwareSlowdown.baseline[index], 0);
    assert.equal(result.series.softwareSlowdown.firmB[index], 0);
    assertClose(
      result.series.softwareSlowdown.firmA[index],
      1 - (
        result.series.softwareRate.firmA[index]
        / result.series.softwareRate.baseline[index]
      ),
    );
  }

  assertClose(
    result.metrics.softwareSlowdown.firmA,
    result.series.softwareSlowdown.firmA.at(-1),
  );
});

test("model exposes AI capability gap at every charted time", () => {
  const result = runModel({
    computeReallocated: 20,
    impactLevel: "medium",
    scenario: "coordinated",
  });

  for (const firm of ["baseline", "firmA", "firmB"]) {
    assert.equal(
      result.series.capabilityGap[firm].length,
      result.series.years.length,
    );
  }

  for (let index = 0; index < result.series.years.length; index += 1) {
    assert.equal(result.series.capabilityGap.baseline[index], 0);
    for (const firm of ["firmA", "firmB"]) {
      assertClose(
        result.series.capabilityGap[firm][index],
        1 - (
          result.series.capability[firm][index]
          / result.series.capability.baseline[index]
        ),
      );
    }
  }

  assertClose(
    result.metrics.capabilityGap.firmA,
    result.series.capabilityGap.firmA.at(-1),
  );
  assertClose(
    result.metrics.capabilityGap.firmB,
    result.series.capabilityGap.firmB.at(-1),
  );
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

test("policy risk follows Part IV and safety benefit follows Part V", () => {
  const result = runModel({
    computeReallocated: 20,
    impactLevel: "medium",
    scenario: "unilateral",
  });

  for (const seriesKey of ["risk", "safetyBenefit"]) {
    assert.equal(result.series[seriesKey].baseline.length, result.series.years.length);
    assert.equal(result.series[seriesKey].policy.length, result.series.years.length);
  }

  for (let index = 0; index < result.series.years.length; index += 1) {
    const elapsedYears = result.series.years[index] - result.calibration.startYear;
    const expectedRiskRatio = Math.exp(
      -result.calibration.lambda
      * (result.assumptions.computeReallocated / 100)
      * elapsedYears,
    );

    assert.equal(result.series.risk.baseline[index], 100);
    assertClose(result.series.risk.policy[index], 100 * expectedRiskRatio);
    assert.equal(result.series.safetyBenefit.baseline[index], 0);
    assertClose(result.series.safetyBenefit.policy[index], 1 - expectedRiskRatio);
  }

  assertClose(
    result.metrics.safetyBenefit.policy,
    result.series.safetyBenefit.policy.at(-1),
  );
});
