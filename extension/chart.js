/**
 * Minimal SVG line chart for the side panel.
 *
 * The site draws its trajectory plots inside `public/app.js`; that renderer is
 * tied to the full-width layout and to markup this panel does not have, so this
 * is a compact reimplementation of the *drawing* only. It contains no economic
 * logic: it plots whatever numbers it is handed and shows a placeholder when
 * handed none.
 *
 * Follows DESIGN.md: fine grid, dashed midnight baseline, oxidized-orange
 * projection, square line caps, monospace axis metadata.
 */

const NS = "http://www.w3.org/2000/svg";

// Drawing area inside the viewBox, leaving room for axis labels.
const VIEW = { w: 300, h: 128 };
const PAD = { top: 10, right: 6, bottom: 18, left: 34 };

const PLOT = {
  w: VIEW.w - PAD.left - PAD.right,
  h: VIEW.h - PAD.top - PAD.bottom,
};

function el(name, attrs = {}) {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, String(value));
  }
  return node;
}

/** Rounds a tick label to something readable without implying false precision. */
function tickLabel(value) {
  const abs = Math.abs(value);
  if (abs >= 1000) return value.toFixed(0);
  if (abs >= 10) return value.toFixed(0);
  if (abs >= 1) return value.toFixed(1);
  return value.toFixed(2);
}

/**
 * @param {SVGSVGElement} svg
 * @param {object} options
 * @param {number[]} options.xValues        Shared x axis (years).
 * @param {Array<{key: string, label: string, color: string, dashed?: boolean,
 *   values: number[]}>} options.series
 * @param {string} [options.yLabel]
 * @param {string} [options.placeholder]    Shown when there is nothing to plot.
 */
export function renderLineChart(svg, options) {
  const { xValues = [], series = [], yLabel = "", placeholder = "" } = options;

  svg.setAttribute("viewBox", `0 0 ${VIEW.w} ${VIEW.h}`);
  svg.setAttribute("role", "img");
  svg.replaceChildren();

  const drawable = series.filter(
    (s) => Array.isArray(s.values) && s.values.length === xValues.length && s.values.length > 1,
  );

  if (!xValues.length || !drawable.length) {
    svg.setAttribute("aria-label", placeholder || "No data");
    const frame = el("rect", {
      x: PAD.left,
      y: PAD.top,
      width: PLOT.w,
      height: PLOT.h,
      fill: "none",
      stroke: "var(--rule)",
      "stroke-dasharray": "3 3",
    });
    const text = el("text", {
      x: PAD.left + PLOT.w / 2,
      y: PAD.top + PLOT.h / 2 + 3,
      "text-anchor": "middle",
      class: "chart-placeholder",
    });
    text.textContent = placeholder;
    svg.append(frame, text);
    return;
  }

  const all = drawable.flatMap((s) => s.values);
  let yMin = Math.min(...all);
  let yMax = Math.max(...all);
  if (yMin === yMax) {
    // A flat series would otherwise divide by zero; give it a visible band.
    yMin -= 1;
    yMax += 1;
  }
  const xMin = xValues[0];
  const xMax = xValues[xValues.length - 1];
  const xSpan = xMax - xMin || 1;

  const sx = (x) => PAD.left + ((x - xMin) / xSpan) * PLOT.w;
  const sy = (y) => PAD.top + PLOT.h - ((y - yMin) / (yMax - yMin)) * PLOT.h;

  svg.setAttribute(
    "aria-label",
    `${yLabel || "Chart"}: ${drawable.map((s) => s.label).join(", ")}, ${xMin} to ${xMax}`,
  );

  // Grid: three horizontal rules, labelled at top and bottom only.
  for (const fraction of [0, 0.5, 1]) {
    const y = PAD.top + PLOT.h * fraction;
    svg.append(
      el("line", {
        x1: PAD.left,
        y1: y,
        x2: PAD.left + PLOT.w,
        y2: y,
        stroke: "var(--rule)",
        "stroke-width": 1,
      }),
    );
  }

  for (const [fraction, value] of [
    [0, yMax],
    [1, yMin],
  ]) {
    const label = el("text", {
      x: PAD.left - 5,
      y: PAD.top + PLOT.h * fraction + 3,
      "text-anchor": "end",
      class: "chart-tick",
    });
    label.textContent = tickLabel(value);
    svg.append(label);
  }

  for (const [x, anchor] of [
    [xMin, "start"],
    [xMax, "end"],
  ]) {
    const label = el("text", {
      x: sx(x),
      y: VIEW.h - 5,
      "text-anchor": anchor,
      class: "chart-tick",
    });
    label.textContent = String(x);
    svg.append(label);
  }

  for (const line of drawable) {
    const points = line.values
      .map((value, index) => `${sx(xValues[index]).toFixed(2)},${sy(value).toFixed(2)}`)
      .join(" ");
    svg.append(
      el("polyline", {
        points,
        fill: "none",
        stroke: line.color,
        "stroke-width": 1.6,
        "stroke-linecap": "square",
        "stroke-linejoin": "round",
        ...(line.dashed ? { "stroke-dasharray": "4 3" } : {}),
      }),
    );
  }
}
