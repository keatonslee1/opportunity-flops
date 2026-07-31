/**
 * Minimal dependency-free SVG line chart.
 *
 * This module knows nothing about the economic model. It takes plain
 * {x, y} points and draws them:
 *
 *   renderLineChart(container, {
 *     series: [{ key, label, points: [{x, y}], color, dashed }],
 *     xLabel, yLabel, xFormat, yFormat,
 *     shade: { from, to, label },
 *     placeholder: "shown when no series have points",
 *   })
 *
 * Charts are drawn in a fixed coordinate space and scaled by the SVG viewBox,
 * so they stay responsive without a resize observer.
 */

const NS = "http://www.w3.org/2000/svg";

const WIDTH = 720;
const HEIGHT = 360;
const PAD = { top: 24, right: 24, bottom: 52, left: 64 };

const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

export const CHART_COLORS = {
  baseline: "#8a8779",
  projection: "#d64b32",
  alt: "#2f6f8f",
  grid: "#ddd8cb",
  axis: "#aba79c",
  text: "#6a685f",
  shade: "#e8b4a5",
};

function el(name, attrs = {}, parent) {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== null && value !== undefined) node.setAttribute(key, String(value));
  }
  if (parent) parent.append(node);
  return node;
}

/** Human-friendly axis ticks: 1, 2, 5 x powers of ten. */
function niceTicks(min, max, count = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0];
  if (min === max) return [min];

  const rawStep = (max - min) / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalised = rawStep / magnitude;
  const step =
    (normalised >= 5 ? 10 : normalised >= 2 ? 5 : normalised >= 1 ? 2 : 1) * magnitude;

  const ticks = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 0.001; v += step) {
    ticks.push(Number(v.toFixed(10)));
  }
  return ticks.length ? ticks : [min, max];
}

export function renderLineChart(container, config) {
  const {
    series = [],
    xLabel = "",
    yLabel = "",
    xFormat = (v) => String(Math.round(v)),
    yFormat = (v) => String(Math.round(v * 10) / 10),
    shade = null,
    yFloorZero = true,
    placeholder = "Awaiting model output",
    xDomain = null,
    yDomain = null,
  } = config;

  container.replaceChildren();

  const active = series.filter((s) => s.points && s.points.length);

  // Empty state: still draw the frame and axes so the layout is honest about
  // what the chart will show once the model is connected.
  const isEmpty = active.length === 0;

  const xs = active.flatMap((s) => s.points.map((p) => p.x));
  const ys = active.flatMap((s) => s.points.map((p) => p.y));

  let xMin = xDomain ? xDomain[0] : Math.min(...xs);
  let xMax = xDomain ? xDomain[1] : Math.max(...xs);
  let yMin = yDomain ? yDomain[0] : Math.min(...ys);
  let yMax = yDomain ? yDomain[1] : Math.max(...ys);

  if (isEmpty && !xDomain) [xMin, xMax] = [0, 1];
  if (isEmpty && !yDomain) [yMin, yMax] = [0, 1];

  if (yFloorZero && !yDomain) yMin = Math.min(0, yMin);
  if (yMin === yMax) yMax = yMin + 1;
  if (!yDomain) yMax += (yMax - yMin) * 0.08;

  const sx = (x) => PAD.left + ((x - xMin) / (xMax - xMin || 1)) * PLOT_W;
  const sy = (y) => PAD.top + PLOT_H - ((y - yMin) / (yMax - yMin || 1)) * PLOT_H;

  const svg = el("svg", {
    viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
    preserveAspectRatio: "xMidYMid meet",
    class: `chart-svg${isEmpty ? " is-empty" : ""}`,
    role: "img",
    "aria-label": isEmpty ? placeholder : `${yLabel} against ${xLabel}`,
  });

  // Shaded region (e.g. the policy window).
  if (!isEmpty && shade && shade.to > shade.from) {
    const x0 = sx(Math.max(shade.from, xMin));
    const x1 = sx(Math.min(shade.to, xMax));
    if (x1 > x0) {
      el("rect", {
        x: x0, y: PAD.top, width: x1 - x0, height: PLOT_H,
        fill: CHART_COLORS.shade, opacity: 0.25,
      }, svg);
      if (shade.label) {
        el("text", {
          x: x0 + 6, y: PAD.top + 14,
          class: "chart-shade-label", fill: CHART_COLORS.text,
        }, svg).textContent = shade.label;
      }
    }
  }

  // Gridlines and y ticks.
  if (!isEmpty) {
    for (const tick of niceTicks(yMin, yMax, 5)) {
      const y = sy(tick);
      el("line", {
        x1: PAD.left, y1: y, x2: PAD.left + PLOT_W, y2: y,
        stroke: CHART_COLORS.grid, "stroke-width": 1,
      }, svg);
      el("text", {
        x: PAD.left - 10, y: y + 4, "text-anchor": "end",
        class: "chart-tick", fill: CHART_COLORS.text,
      }, svg).textContent = yFormat(tick);
    }

    for (const tick of niceTicks(xMin, xMax, 6)) {
      if (tick < xMin || tick > xMax) continue;
      const x = sx(tick);
      el("line", {
        x1: x, y1: PAD.top + PLOT_H, x2: x, y2: PAD.top + PLOT_H + 5,
        stroke: CHART_COLORS.axis, "stroke-width": 1,
      }, svg);
      el("text", {
        x, y: PAD.top + PLOT_H + 20, "text-anchor": "middle",
        class: "chart-tick", fill: CHART_COLORS.text,
      }, svg).textContent = xFormat(tick);
    }
  }

  // Axes.
  el("line", {
    x1: PAD.left, y1: PAD.top + PLOT_H, x2: PAD.left + PLOT_W, y2: PAD.top + PLOT_H,
    stroke: CHART_COLORS.axis, "stroke-width": 1.5,
  }, svg);
  el("line", {
    x1: PAD.left, y1: PAD.top, x2: PAD.left, y2: PAD.top + PLOT_H,
    stroke: CHART_COLORS.axis, "stroke-width": 1.5,
  }, svg);

  // Axis labels.
  el("text", {
    x: PAD.left + PLOT_W / 2, y: HEIGHT - 8, "text-anchor": "middle",
    class: "chart-axis-label", fill: CHART_COLORS.text,
  }, svg).textContent = xLabel;

  el("text", {
    x: 14, y: PAD.top + PLOT_H / 2, "text-anchor": "middle",
    class: "chart-axis-label", fill: CHART_COLORS.text,
    transform: `rotate(-90 14 ${PAD.top + PLOT_H / 2})`,
  }, svg).textContent = yLabel;

  if (isEmpty) {
    el("text", {
      x: PAD.left + PLOT_W / 2, y: PAD.top + PLOT_H / 2,
      "text-anchor": "middle", class: "chart-placeholder-text",
      fill: CHART_COLORS.text,
    }, svg).textContent = placeholder;
  }

  // Series.
  for (const s of active) {
    const d = s.points
      .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(2)},${sy(p.y).toFixed(2)}`)
      .join(" ");
    el("path", {
      d,
      fill: "none",
      stroke: s.color || CHART_COLORS.projection,
      "stroke-width": s.width || 2.25,
      "stroke-dasharray": s.dashed ? "6 5" : null,
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
    }, svg);
  }

  container.append(svg);
  container.append(renderLegend(series));
}

/** Legend renders from the declared series, so it reads correctly even when empty. */
function renderLegend(series) {
  const legend = document.createElement("ul");
  legend.className = "chart-legend";
  for (const s of series) {
    const item = document.createElement("li");
    const swatch = document.createElement("span");
    swatch.className = `legend-swatch${s.dashed ? " is-dashed" : ""}`;
    swatch.style.setProperty("--swatch", s.color || CHART_COLORS.projection);
    const label = document.createElement("span");
    label.textContent = s.label;
    item.append(swatch, label);
    legend.append(item);
  }
  return legend;
}
