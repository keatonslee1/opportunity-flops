/**
 * Stable handoff boundary for the reduced-form capability model.
 *
 * The assumption definitions drive the UI, and `runModel(assumptions)` returns
 * the model-owned paths, rate series, gaps, units, and calibration caveats.
 */
function deepFreeze(value) {
  for (const nestedValue of Object.values(value)) {
    if (nestedValue && typeof nestedValue === "object") {
      deepFreeze(nestedValue);
    }
  }

  return Object.freeze(value);
}

export const assumptionDefinitions = [
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
];

export const monteCarloCalibration = deepFreeze({
  sampleCount: 10_000,
  seed: 20_260_731,
  randomGenerator: "Mulberry32",
  drawOrder: ["beta", "gamma", "delta"],
  quantileMethod: "linear interpolation at (n - 1)q",
  parameterSampling: "independent marginal draws",
  bundleConstruction: "rank-aligned marginal quantiles",
  distributionStatus: "working assumptions",
  quantiles: { low: 0.1, medium: 0.5, high: 0.9 },
  distributions: {
    beta: { min: 0.15, mode: 0.3, max: 0.5 },
    gamma: { min: 0.2, mode: 0.4, max: 0.6 },
    delta: { min: 0.5, mode: 0.7, max: 0.9 },
  },
});

function createSeededRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function sampleTriangular(randomValue, { min, mode, max }) {
  const modeCumulativeProbability = (mode - min) / (max - min);

  if (randomValue < modeCumulativeProbability) {
    return min + Math.sqrt(
      randomValue * (max - min) * (mode - min),
    );
  }

  return max - Math.sqrt(
    (1 - randomValue) * (max - min) * (max - mode),
  );
}

function empiricalQuantile(sortedValues, probability) {
  const position = (sortedValues.length - 1) * probability;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  const interpolationWeight = position - lowerIndex;

  return sortedValues[lowerIndex]
    + interpolationWeight
      * (sortedValues[upperIndex] - sortedValues[lowerIndex]);
}

function calibrateImpactPresets() {
  const random = createSeededRandom(monteCarloCalibration.seed);
  const samplesByParameter = Object.fromEntries(
    monteCarloCalibration.drawOrder.map((parameter) => [parameter, []]),
  );
  const quantilesByParameter = {};

  for (let drawIndex = 0; drawIndex < monteCarloCalibration.sampleCount; drawIndex += 1) {
    for (const parameter of monteCarloCalibration.drawOrder) {
      samplesByParameter[parameter].push(sampleTriangular(
        random(),
        monteCarloCalibration.distributions[parameter],
      ));
    }
  }

  for (const parameter of monteCarloCalibration.drawOrder) {
    const samples = samplesByParameter[parameter].sort(
      (left, right) => left - right,
    );
    quantilesByParameter[parameter] = Object.fromEntries(
      Object.entries(monteCarloCalibration.quantiles).map(
        ([impactLevel, probability]) => [
          impactLevel,
          empiricalQuantile(samples, probability),
        ],
      ),
    );
  }

  return Object.fromEntries(
    Object.keys(monteCarloCalibration.quantiles).map((impactLevel) => [
      impactLevel,
      Object.fromEntries(
        monteCarloCalibration.drawOrder.map((parameter) => [
          parameter,
          quantilesByParameter[parameter][impactLevel],
        ]),
      ),
    ]),
  );
}

export const impactPresets = deepFreeze(calibrateImpactPresets());

const START_YEAR = 2026;
const HORIZON_YEARS = 8;
const SAMPLE_INTERVAL_YEARS = 0.25;
const INITIAL_SOFTWARE = 1;
const BASELINE_SOFTWARE_AT_HORIZON = 2;

function softwareLevelAt(time, k, gamma, rateMultiplier = 1) {
  return (
    INITIAL_SOFTWARE ** (1 - gamma)
    + (1 - gamma) * k * rateMultiplier * time
  ) ** (1 / (1 - gamma));
}

function normalizeAssumptions(inputAssumptions) {
  if (
    inputAssumptions === null
    || typeof inputAssumptions !== "object"
    || Array.isArray(inputAssumptions)
  ) {
    throw new TypeError("assumptions must be an object");
  }

  const computeReallocated = inputAssumptions.computeReallocated === undefined
    ? 20
    : inputAssumptions.computeReallocated;
  const impactLevel = inputAssumptions.impactLevel === undefined
    ? "medium"
    : inputAssumptions.impactLevel;
  const scenario = inputAssumptions.scenario === undefined
    ? "coordinated"
    : inputAssumptions.scenario;

  if (typeof computeReallocated !== "number" || !Number.isFinite(computeReallocated)) {
    throw new TypeError("computeReallocated must be a finite number");
  }
  if (computeReallocated < 0 || computeReallocated > 50) {
    throw new RangeError("computeReallocated must be between 0 and 50");
  }
  if (!Object.hasOwn(impactPresets, impactLevel)) {
    throw new RangeError("impactLevel must be one of: low, medium, high");
  }
  if (!["baseline", "unilateral", "coordinated"].includes(scenario)) {
    throw new RangeError(
      "scenario must be one of: baseline, unilateral, coordinated",
    );
  }

  return { computeReallocated, impactLevel, scenario };
}

export function runModel(inputAssumptions = {}) {
  const assumptions = normalizeAssumptions(inputAssumptions);
  const { beta, gamma, delta } = impactPresets[assumptions.impactLevel];
  const impactDefinition = assumptionDefinitions.find(
    ({ key }) => key === "impactLevel",
  );
  const calibrationLabel = impactDefinition.options.find(
    ({ value }) => value === assumptions.impactLevel,
  ).description;
  const k = (
    BASELINE_SOFTWARE_AT_HORIZON ** (1 - gamma)
    - INITIAL_SOFTWARE ** (1 - gamma)
  ) / ((1 - gamma) * HORIZON_YEARS);
  const policyRateMultiplier = (1 - assumptions.computeReallocated / 100) ** beta;
  const sampleCount = HORIZON_YEARS / SAMPLE_INTERVAL_YEARS + 1;
  const years = Array.from(
    { length: sampleCount },
    (_, index) => START_YEAR + index * SAMPLE_INTERVAL_YEARS,
  );
  const baselineSoftware = years.map((year) => (
    100 * softwareLevelAt(year - START_YEAR, k, gamma)
  ));
  const firmARateMultiplier = assumptions.scenario === "baseline"
    ? 1
    : policyRateMultiplier;
  const firmBRateMultiplier = assumptions.scenario === "coordinated"
    ? policyRateMultiplier
    : 1;
  const softwareForMultiplier = (rateMultiplier) => years.map((year) => (
    100 * softwareLevelAt(year - START_YEAR, k, gamma, rateMultiplier)
  ));
  const firmASoftware = softwareForMultiplier(firmARateMultiplier);
  const firmBSoftware = softwareForMultiplier(firmBRateMultiplier);
  const softwareRateForMultiplier = (software, rateMultiplier) => (
    software.map((softwareIndex) => (
      100 * k * rateMultiplier * (softwareIndex / 100) ** gamma
    ))
  );
  const baselineSoftwareRate = softwareRateForMultiplier(baselineSoftware, 1);
  const firmASoftwareRate = softwareRateForMultiplier(
    firmASoftware,
    firmARateMultiplier,
  );
  const firmBSoftwareRate = softwareRateForMultiplier(
    firmBSoftware,
    firmBRateMultiplier,
  );
  const toCapability = (softwareIndex) => (
    100 * (softwareIndex / 100) ** delta
  );
  const horizonSoftwareRatio = (software) => (
    software.at(-1) / baselineSoftware.at(-1)
  );
  const metricsForFirm = (software, softwareRate) => {
    const softwareRatio = horizonSoftwareRatio(software);
    return {
      softwareSlowdown: 1 - softwareRate.at(-1) / baselineSoftwareRate.at(-1),
      softwareLevelGap: 1 - softwareRatio,
      capabilityGap: 1 - softwareRatio ** delta,
    };
  };
  const firmAMetrics = metricsForFirm(firmASoftware, firmASoftwareRate);
  const firmBMetrics = metricsForFirm(firmBSoftware, firmBSoftwareRate);

  return {
    status: "ready",
    assumptions,
    calibration: {
      startYear: START_YEAR,
      endYear: START_YEAR + HORIZON_YEARS,
      horizonYears: HORIZON_YEARS,
      sampleIntervalYears: SAMPLE_INTERVAL_YEARS,
      initialSoftware: INITIAL_SOFTWARE,
      baselineSoftwareAtHorizon: BASELINE_SOFTWARE_AT_HORIZON,
      k,
      beta,
      gamma,
      delta,
      label: calibrationLabel,
      policyRateMultiplier,
      calibrationMethod: "assumed-prior Monte Carlo",
      presetEmpirical: false,
      monteCarlo: {
        sampleCount: monteCarloCalibration.sampleCount,
        seed: monteCarloCalibration.seed,
        randomGenerator: monteCarloCalibration.randomGenerator,
        quantileMethod: monteCarloCalibration.quantileMethod,
        parameterSampling: monteCarloCalibration.parameterSampling,
        bundleConstruction: monteCarloCalibration.bundleConstruction,
        selectedQuantile: monteCarloCalibration.quantiles[assumptions.impactLevel],
        selectedQuantileLabel: `P${
          monteCarloCalibration.quantiles[assumptions.impactLevel] * 100
        }`,
        distributionStatus: monteCarloCalibration.distributionStatus,
        distributions: monteCarloCalibration.distributions,
      },
    },
    series: {
      years,
      software: {
        baseline: baselineSoftware,
        firmA: firmASoftware,
        firmB: firmBSoftware,
      },
      softwareRate: {
        baseline: baselineSoftwareRate,
        firmA: firmASoftwareRate,
        firmB: firmBSoftwareRate,
      },
      capability: {
        baseline: baselineSoftware.map(toCapability),
        firmA: firmASoftware.map(toCapability),
        firmB: firmBSoftware.map(toCapability),
      },
    },
    metrics: {
      evaluatedAtYear: START_YEAR + HORIZON_YEARS,
      softwareSlowdown: {
        firmA: firmAMetrics.softwareSlowdown,
        firmB: firmBMetrics.softwareSlowdown,
      },
      softwareLevelGap: {
        firmA: firmAMetrics.softwareLevelGap,
        firmB: firmBMetrics.softwareLevelGap,
      },
      capabilityGap: {
        firmA: firmAMetrics.capabilityGap,
        firmB: firmBMetrics.capabilityGap,
      },
    },
    units: {
      years: "calendar year",
      software: "index (2026 = 100)",
      softwareRate: "software index points per year",
      capability: "training-compute-normalized index (2026 = 100)",
      metrics: "fraction of baseline at 2034",
    },
    caveats: [
      "Capability-R&D compute is fixed; policy changes only the share available to capabilities work.",
      "Training compute is unchanged across scenarios, so it cancels in capability comparisons.",
      "The baseline is normalized from S(2026) = 1 to S(2034) = 2; it is not a calibrated forecast.",
      "A is absorbed into the normalized baseline path; alpha is not needed because unchanged training compute cancels from the relative outputs.",
      "Each parameter uses 10,000 seeded draws from a triangular distribution whose bounds and mode are working assumptions, not empirical estimates.",
      "Low, medium, and high are rank-aligned marginal P10, P50, and P90 parameter bundles, not joint outcome percentiles.",
    ],
  };
}
