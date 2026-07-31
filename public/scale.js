/**
 * Axis scaling for the trajectory plots.
 *
 * Domains used to be rounded to fixed multiples — ten index points on the level
 * charts, three percentage points on the difference charts — so every scenario
 * was framed identically no matter how large its effect was. A 0.4% capability
 * gap was drawn inside a 0–3% window, using an eighth of the plot, and each of
 * its tick labels rounded to "0%". Framing an axis to the data it actually
 * carries is what makes a modest policy legible at all.
 *
 * Levels and risk are framed to their own range. Difference charts stay pinned
 * to zero: there, zero means "no effect", and lifting that floor would flatter
 * the result rather than reveal it. That asymmetry is the point — the reframing
 * is meant to make a real effect visible, not to manufacture the look of one.
 *
 * Pure functions, no DOM. Kept out of app.js so the maths can be tested
 * directly rather than asserted against by grepping source text.
 */

// 2.5 earns its place: it is what turns an awkward 0.24 span into 0/0.05/0.10
// rather than forcing the step up to 0.5 and half-emptying the plot.
const TICK_STEPS = [1, 2, 2.5, 5, 10];
const EPSILON = 1e-9;

/** Smallest 1/2/2.5/5/10 × 10ⁿ step that keeps the tick count near the target. */
export function niceStep(span, targetTicks = 6) {
  if (!Number.isFinite(span) || span <= 0) return 1;
  const rough = span / Math.max(1, targetTicks - 1);
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  return (TICK_STEPS.find((candidate) => candidate >= normalized - EPSILON) ?? 10) * magnitude;
}

/** Tick values on the step grid that fall inside [min, max]. */
export function ticksWithin(min, max, step) {
  if (!Number.isFinite(step) || step <= 0) return [min, max];
  const ticks = [];
  // Accumulating by addition drifts on decimal steps, so index off the grid.
  const firstIndex = Math.ceil(min / step - EPSILON);
  const lastIndex = Math.floor(max / step + EPSILON);
  for (let index = firstIndex; index <= lastIndex; index += 1) {
    ticks.push(index * step);
  }
  return ticks;
}

/**
 * @param {{baseline:number[], firmA?:number[], firmB?:number[], policy?:number[]}} series
 * @param {{domainKind:"level"|"fraction"|"risk", projectionOnly?:boolean}} chart
 * @returns {{min:number, max:number, step:number, ticks:number[]}}
 */
export function chartDomain(series, chart, targetTicks = 6) {
  const comparisonSeries = chart.projectionOnly
    ? [series.baseline, series.policy]
    : [series.baseline, series.firmA, series.firmB];
  const values = comparisonSeries.filter(Array.isArray).flat();
  const dataMinimum = Math.min(...values);
  const dataMaximum = Math.max(...values);

  if (chart.domainKind === "fraction") {
    // The fallback is only for a series that is genuinely flat at zero — a
    // scenario with no reallocation, which has no span to frame. Applying it as
    // a floor to every small value was the original bug in a new costume: a
    // real 0.38% gap would still have been drawn inside a 1% window.
    const maximum = dataMaximum > 0 ? dataMaximum : 0.01;
    const step = niceStep(maximum, targetTicks);
    const domainMaximum = Math.ceil(maximum / step - EPSILON) * step;
    return { min: 0, max: domainMaximum, step, ticks: ticksWithin(0, domainMaximum, step) };
  }

  if (chart.domainKind === "risk") {
    // Baseline risk is the normalized 100 and has to stay on screen; only the
    // floor moves, down to whatever the policy path actually reaches. The span
    // has a floor of its own because a scenario that never moves risk is flat
    // at 100, and the step stays whole because this is an index — sub-unit
    // ticks round to the same label twice.
    const minimum = Math.min(dataMinimum, 100);
    const span = Math.max(100 - minimum, 5);
    const step = Math.max(1, niceStep(span, targetTicks));
    const domainMinimum = Math.max(0, Math.floor((100 - span) / step + EPSILON) * step);
    return { min: domainMinimum, max: 100, step, ticks: ticksWithin(domainMinimum, 100, step) };
  }

  // Levels are framed tight to the data, with the ticks falling inside rather
  // than the frame rounding outward to meet them. Both trajectories begin at
  // the normalized 100, so the floor lands there on its own.
  const step = niceStep(Math.max(dataMaximum - dataMinimum, 1), targetTicks);
  return {
    min: dataMinimum,
    max: dataMaximum,
    step,
    ticks: ticksWithin(dataMinimum, dataMaximum, step),
  };
}

/**
 * A 0.4% axis whose labels all read "0%" is worse than no labels at all, and a
 * 2.5-point step printed without decimals gives evenly spaced gridlines
 * unevenly spaced labels — 0, 3, 5, 8, 10, 13. Precision follows the step
 * itself rather than its magnitude, so every tick prints exactly.
 */
export function fractionDecimals(step) {
  const percentStep = step * 100;
  for (let decimals = 0; decimals < 2; decimals += 1) {
    const scaled = percentStep * 10 ** decimals;
    if (Math.abs(scaled - Math.round(scaled)) < EPSILON) return decimals;
  }
  return 2;
}

export function formatTickValue(value, chart, step) {
  if (chart.domainKind !== "fraction") return String(Math.round(value));
  return `${(value * 100).toFixed(fractionDecimals(step))}%`;
}
