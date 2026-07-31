/**
 * Stable handoff boundary for the economic model.
 *
 * The assumption definitions drive the UI. The final model should preserve the
 * `runModel(assumptions)` entry point, but may replace every provisional field.
 */
export const assumptionDefinitions = [
  {
    key: "computeReallocated",
    label: "Compute reallocated",
    min: 0,
    max: 50,
    step: 1,
    value: 20,
    suffix: "%",
  },
  {
    key: "durationMonths",
    label: "Duration",
    min: 1,
    max: 36,
    step: 1,
    value: 12,
    suffix: " months",
  },
  {
    key: "aiProductivityGrowth",
    label: "AI contribution to annual productivity growth",
    min: 0,
    max: 3,
    step: 0.1,
    value: 1,
    suffix: " pp",
  },
];

export function runModel(assumptions) {
  return {
    status: "pending-model",
    assumptions,
    cumulativeLoss: null,
    series: [],
  };
}
