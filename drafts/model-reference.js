/**
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  SUPERSEDED — NOT FOR REVIEW, NOT THE PROJECT'S MODEL.               │
 * │                                                                     │
 * │  Speculative draft, parked on `draft/model-reference` so it is not   │
 * │  lost. Nothing imports this file. The economic model is owned by     │
 * │  the empirical-analysis workstream and lives at `public/model.js`.   │
 * │                                                                     │
 * │  Its numbers are unvalidated and its structure is guesswork. See     │
 * │  drafts/README.md for the two assumptions most worth challenging.    │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Opportunity FLOPs — economic model (draft).
 *
 * Stable handoff boundary: `assumptionDefinitions` drives the slider interface,
 * `runModel(assumptions)` is the single entry point. Everything below is pure
 * arithmetic — no DOM access — so it can be unit tested and reused.
 *
 * Structure of the model (see MODEL_NOTES at the bottom for the write-up):
 *
 *   1. Reallocation      r% of frontier R&D compute moves to alignment.
 *   2. Effective compute  c = 1 - r(1 - sigma), where sigma is the share of
 *                         alignment work that spills back into capabilities.
 *   3. Progress rate      phi = c^alpha  (power-law returns to compute)
 *   4. Firm aggregation   phi_total = s_A * phi_A + (1 - s_A) * phi_B
 *   5. Software progress  dS/dt = phi_total
 *   6. Capability         dM/dt = phi_total * (S_policy / S_baseline)^beta
 *                         (software slowdown compounds into capability)
 *   7. Economics          a capability lag of D years delays the entire
 *                         AI-driven productivity stream by D years.
 */

export const MODEL_CONSTANTS = {
  policyStartYear: 2026,
  /** Horizon for the capability / software charts. */
  projectionYears: 10,
  /** Horizon for the cumulative economic loss integral. */
  economicHorizonYears: 30,
  /** Integration resolution. */
  stepsPerYear: 12,
  /** Social discount rate applied to forgone output. */
  discountRate: 0.03,
  /** World GDP at policy start, in USD trillions. */
  worldGdpTrillions: 115,
  /**
   * Weight on accumulated software progress in the capability production
   * function. 0 = capability depends on compute only; 1 = software slowdown
   * passes through one-for-one on top of the compute effect.
   */
  softwareContribution: 0.5,
};

/**
 * Slider definitions. `group` buckets them in the UI; `scale` converts the
 * displayed slider units into model units inside `normalise()`.
 */
export const assumptionDefinitions = [
  {
    key: "computeReallocated",
    label: "Compute reallocated to alignment",
    help: "Share of frontier R&D compute moved off capabilities work.",
    group: "policy",
    min: 0,
    max: 50,
    step: 1,
    value: 20,
    suffix: "%",
    scale: 0.01,
  },
  {
    key: "durationMonths",
    label: "Duration of reallocation",
    help: "How long the policy or commitment stays in force.",
    group: "policy",
    min: 1,
    max: 60,
    step: 1,
    value: 24,
    suffix: " mo",
    scale: 1,
  },
  {
    key: "firmAShare",
    label: "Firm A's share of frontier progress",
    help: "How much of aggregate frontier progress Firm A accounts for.",
    group: "industry",
    min: 0,
    max: 100,
    step: 1,
    value: 55,
    suffix: "%",
    scale: 0.01,
  },
  {
    key: "spillover",
    label: "Alignment spillover into capabilities",
    help: "Share of alignment compute that still advances capabilities.",
    group: "industry",
    min: 0,
    max: 100,
    step: 1,
    value: 15,
    suffix: "%",
    scale: 0.01,
  },
  {
    key: "computeElasticity",
    label: "Returns-to-compute elasticity",
    help: "Elasticity of frontier progress with respect to compute (alpha).",
    group: "technical",
    min: 0.05,
    max: 1,
    step: 0.05,
    value: 0.35,
    suffix: "",
    scale: 1,
  },
  {
    key: "aiProductivityGrowth",
    label: "AI contribution to annual productivity growth",
    help: "Percentage points added to trend productivity growth once adopted.",
    group: "economic",
    min: 0,
    max: 3,
    step: 0.1,
    value: 1,
    suffix: " pp",
    scale: 0.01,
  },
  {
    key: "adoptionLagYears",
    label: "Lag between AI progress and economic adoption",
    help: "Years before frontier progress shows up in measured output.",
    group: "economic",
    min: 0,
    max: 10,
    step: 0.5,
    value: 3,
    suffix: " yr",
    scale: 1,
  },
];

export const ASSUMPTION_GROUPS = [
  { key: "policy", label: "Policy" },
  { key: "industry", label: "Industry structure" },
  { key: "technical", label: "Technical" },
  { key: "economic", label: "Economic" },
];

/**
 * The three worlds the tool compares. `reallocation` returns the fraction of
 * compute each firm diverts, given the headline policy level r.
 */
export const SCENARIOS = [
  {
    key: "none",
    label: "No reallocation",
    short: "Baseline",
    description: "Neither firm diverts compute. This is the counterfactual.",
    reallocation: () => ({ a: 0, b: 0 }),
  },
  {
    key: "unilateral",
    label: "One firm reallocates",
    short: "Unilateral",
    description:
      "Firm A acts alone. Firm B keeps all of its compute on capabilities, so the frontier keeps moving.",
    reallocation: (r) => ({ a: r, b: 0 }),
  },
  {
    key: "coordinated",
    label: "Both firms reallocate",
    short: "Coordinated",
    description:
      "Both firms reallocate under a common policy or commitment. The whole frontier slows.",
    reallocation: (r) => ({ a: r, b: r }),
  },
];

/** Preset policy intensities for the dashboard's Low / Medium / High selector. */
export const POLICY_PRESETS = [
  { key: "low", label: "Low", computeReallocated: 5, durationMonths: 12 },
  { key: "medium", label: "Medium", computeReallocated: 20, durationMonths: 24 },
  { key: "high", label: "High", computeReallocated: 40, durationMonths: 48 },
];

export const defaultAssumptions = () =>
  Object.fromEntries(assumptionDefinitions.map((d) => [d.key, d.value]));

/** Convert displayed slider units into model units. */
function normalise(assumptions) {
  const out = {};
  for (const definition of assumptionDefinitions) {
    const raw = Number(assumptions?.[definition.key] ?? definition.value);
    const safe = Number.isFinite(raw) ? raw : definition.value;
    const clamped = Math.min(definition.max, Math.max(definition.min, safe));
    out[definition.key] = clamped * definition.scale;
  }
  return out;
}

/** Progress multiplier for a single firm diverting `realloc` of its compute. */
function firmMultiplier(realloc, spillover, elasticity) {
  const effectiveCompute = 1 - realloc * (1 - spillover);
  return Math.pow(Math.max(effectiveCompute, 0), elasticity);
}

/**
 * Integrate software progress and capability over the projection horizon for a
 * single scenario. Baseline paths grow at rate 1, so "years of progress" and
 * calendar years coincide in the no-reallocation world — which makes the
 * vertical gap between the lines directly readable as a lag.
 */
function simulate(reallocation, p) {
  const { stepsPerYear, projectionYears, softwareContribution, policyStartYear } =
    MODEL_CONSTANTS;

  const dt = 1 / stepsPerYear;
  const steps = projectionYears * stepsPerYear;
  const durationYears = p.durationMonths / 12;

  const phiA = firmMultiplier(reallocation.a, p.spillover, p.computeElasticity);
  const phiB = firmMultiplier(reallocation.b, p.spillover, p.computeElasticity);
  const phiWindow = p.firmAShare * phiA + (1 - p.firmAShare) * phiB;

  let software = 0;
  let softwareBase = 0;
  let capability = 0;
  let capabilityBase = 0;

  const points = [];

  for (let i = 0; i <= steps; i += 1) {
    const t = i * dt;
    const active = t < durationYears;
    const rate = active ? phiWindow : 1;
    const softwareRatio = softwareBase > 0 ? software / softwareBase : 1;

    points.push({
      t,
      year: policyStartYear + t,
      // Indices normalised so the baseline runs 0 -> 100 across the horizon.
      softwareIndex: (software / projectionYears) * 100,
      softwareIndexBaseline: (softwareBase / projectionYears) * 100,
      capabilityIndex: (capability / projectionYears) * 100,
      capabilityIndexBaseline: (capabilityBase / projectionYears) * 100,
      // Instantaneous slowdown in the rate of software progress, in percent.
      softwareSlowdownPct: (1 - rate) * 100,
      // Cumulative gaps, expressed as months of progress forgone.
      softwareLagMonths: (softwareBase - software) * 12,
      capabilityLagMonths: (capabilityBase - capability) * 12,
      policyActive: active,
    });

    if (i === steps) break;

    softwareBase += dt;
    software += rate * dt;
    capabilityBase += dt;
    capability += rate * Math.pow(softwareRatio, softwareContribution) * dt;
  }

  const terminal = points[points.length - 1];

  return {
    points,
    progressMultiplier: phiWindow,
    firmMultipliers: { a: phiA, b: phiB },
    peakSlowdownPct: (1 - phiWindow) * 100,
    softwareLagMonths: terminal.softwareLagMonths,
    capabilityLagMonths: terminal.capabilityLagMonths,
    capabilityLagYears: terminal.capabilityLagMonths / 12,
  };
}

/**
 * A capability lag of `lagYears` shifts the whole AI-driven productivity stream
 * that far into the future. The loss is the discounted area between the two
 * output paths over the economic horizon.
 */
function economics(lagYears, p) {
  const {
    economicHorizonYears,
    discountRate,
    worldGdpTrillions,
    policyStartYear,
  } = MODEL_CONSTANTS;

  const g = p.aiProductivityGrowth;
  const lag = p.adoptionLagYears;

  let cumulative = 0;
  const points = [];

  for (let t = 0; t <= economicHorizonYears; t += 1) {
    const baseline = Math.pow(1 + g, Math.max(0, t - lag));
    const policy = Math.pow(1 + g, Math.max(0, t - lag - lagYears));
    const gapTrillions = (baseline - policy) * worldGdpTrillions;
    const discounted = gapTrillions / Math.pow(1 + discountRate, t);
    cumulative += discounted;

    points.push({
      t,
      year: policyStartYear + t,
      outputBaseline: baseline * worldGdpTrillions,
      outputPolicy: policy * worldGdpTrillions,
      gapTrillions,
      discountedTrillions: discounted,
      cumulativeTrillions: cumulative,
    });
  }

  const terminal = points[points.length - 1];

  return {
    points,
    cumulativeLossTrillions: cumulative,
    cumulativeLossShareOfGdp: cumulative / worldGdpTrillions,
    terminalGapTrillions: terminal.gapTrillions,
    productivityDelayYears: lagYears,
  };
}

export function runModel(assumptions) {
  const p = normalise(assumptions);

  const results = {};
  for (const scenario of SCENARIOS) {
    const reallocation = scenario.reallocation(p.computeReallocated);
    const path = simulate(reallocation, p);
    const economy = economics(path.capabilityLagYears, p);

    results[scenario.key] = {
      key: scenario.key,
      label: scenario.label,
      short: scenario.short,
      description: scenario.description,
      reallocation,
      ...path,
      economy,
      headline: {
        softwareSlowdownPct: path.peakSlowdownPct,
        softwareLagMonths: path.softwareLagMonths,
        capabilityLagMonths: path.capabilityLagMonths,
        productivityDelayMonths: path.capabilityLagYears * 12,
        cumulativeLossTrillions: economy.cumulativeLossTrillions,
      },
    };
  }

  const unilateral = results.unilateral;
  const coordinated = results.coordinated;
  const ratio =
    unilateral.capabilityLagMonths > 0
      ? coordinated.capabilityLagMonths / unilateral.capabilityLagMonths
      : null;

  return {
    status: "ok",
    assumptions: { ...assumptions },
    normalised: p,
    constants: MODEL_CONSTANTS,
    scenarios: results,
    // Flat time grid shared by every chart.
    series: results.none.points.map((point, i) => ({
      year: point.year,
      t: point.t,
      none: results.none.points[i],
      unilateral: results.unilateral.points[i],
      coordinated: results.coordinated.points[i],
    })),
    comparison: {
      /** How much more capability delay coordination buys over acting alone. */
      coordinationMultiple: ratio,
      unilateralLagMonths: unilateral.capabilityLagMonths,
      coordinatedLagMonths: coordinated.capabilityLagMonths,
      unilateralLossTrillions: unilateral.economy.cumulativeLossTrillions,
      coordinatedLossTrillions: coordinated.economy.cumulativeLossTrillions,
    },
  };
}

export const MODEL_NOTES = [
  {
    title: "Effective compute",
    body:
      "Reallocating r of a firm's R&D compute to alignment leaves c = 1 - r(1 - sigma) " +
      "on capabilities, where sigma is the fraction of alignment work that still " +
      "advances capabilities. sigma = 0 treats alignment as a pure diversion; " +
      "sigma = 1 treats it as free.",
  },
  {
    title: "Returns to compute",
    body:
      "Frontier progress scales as c^alpha. alpha well below 1 encodes the " +
      "diminishing returns seen in compute-performance power laws: cutting compute " +
      "by 20% costs far less than 20% of progress.",
  },
  {
    title: "Firm aggregation",
    body:
      "Aggregate progress is the share-weighted average of the two firms' rates. " +
      "This is why unilateral action buys so much less delay than a common policy " +
      "— the non-participating firm keeps pushing the frontier.",
  },
  {
    title: "Software compounding",
    body:
      "Slower algorithmic progress feeds back into capability with weight beta = " +
      `${MODEL_CONSTANTS.softwareContribution}, so the capability gap opens wider than the ` +
      "compute effect alone would imply.",
  },
  {
    title: "Economic pathway",
    body:
      `A capability delay of D years shifts the entire AI-driven productivity stream D years later. ` +
      `Losses are the discounted area between the two output paths over ` +
      `${MODEL_CONSTANTS.economicHorizonYears} years at a ${MODEL_CONSTANTS.discountRate * 100}% ` +
      `discount rate, against world output of $${MODEL_CONSTANTS.worldGdpTrillions}T.`,
  },
  {
    title: "What this is not",
    body:
      "A reduced-form combination of an ideas-production function, diminishing " +
      "returns to research inputs, and an assumed macroeconomic pathway. It prices " +
      "the cost side of reallocation only — it says nothing about the benefits of " +
      "alignment research, which is the other half of any real decision.",
  },
];
