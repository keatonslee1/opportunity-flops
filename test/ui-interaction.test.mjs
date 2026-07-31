import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appSource = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
const pageSource = await readFile(new URL("../public/index.html", import.meta.url), "utf8");

test("continuous slider input updates charts without replaying trace animation", () => {
  const sliderHandler = appSource.match(/input\.addEventListener\("input",[\s\S]*?\n\s*}\);/);

  assert.ok(sliderHandler, "expected a slider input handler");
  assert.match(sliderHandler[0], /renderResult\(false\)/);
});

test("the UI renders model-owned series instead of local preview geometry", () => {
  assert.doesNotMatch(appSource, /illustrativeSeries/);
  assert.match(appSource, /const series = result\.series\[kind\]/);
  assert.match(appSource, /runModel\(\{ \.\.\.assumptions, scenario \}\)/);
});

test("both charts expose dynamic grids, axes, and accessible descriptions", () => {
  for (const kind of ["software", "capability"]) {
    assert.match(pageSource, new RegExp(`id="${kind}-grid"`));
    assert.match(pageSource, new RegExp(`id="${kind}-axes"`));
    assert.match(pageSource, new RegExp(`id="${kind}-svg-desc"`));
  }

  assert.match(appSource, /"text-anchor": "end"/);
  assert.match(appSource, /chart\.description\.textContent/);
});

test("categorical sensitivity changes replay the discrete chart transition", () => {
  const choiceHandler = appSource.match(/input\.addEventListener\("change", \(\) => \{[\s\S]*?assumptions\[definition\.key\][\s\S]*?\n\s*}\);/);

  assert.ok(choiceHandler, "expected a categorical choice handler");
  assert.match(choiceHandler[0], /renderResult\(\)/);
});

test("software output distinguishes the rate metric from the plotted level series", () => {
  assert.match(pageSource, /Software-efficiency level index/);
  assert.match(pageSource, /Software progress-rate slowdown/);
  assert.match(appSource, /rate slowdown/);
  assert.match(appSource, /progress rate ends/);
  assert.match(appSource, /progress rates end/);
});

test("the full source table and Monte Carlo calibration status remain explicit", () => {
  for (const symbol of ["S_B", "S_P", "M_B", "M_P"]) {
    assert.match(pageSource, new RegExp(`data-parameter="${symbol}"`));
  }

  assert.match(pageSource, /10,000 seeded triangular draws/);
  assert.match(pageSource, /P10.*P50.*P90/);
  assert.match(pageSource, /Seed 20260731/);
  assert.match(pageSource, /Working triangular inputs/);
  assert.match(pageSource, /0\.223/);
  assert.match(pageSource, /0\.701/);
  assert.match(pageSource, /0\.810/);
  assert.doesNotMatch(pageSource, /Working placeholder/);
  assert.match(pageSource, /Source status/);
  assert.match(pageSource, /Set by <i>z<\/i> \/ calibrated/);
  assert.match(pageSource, /Model-generated/);
  assert.match(pageSource, /not a forecast/i);
});

test("the active Monte Carlo bundle displays three-decimal parameters", () => {
  for (const parameter of ["beta", "gamma", "delta"]) {
    assert.match(
      appSource,
      new RegExp(`calibration\\.${parameter}\\.toFixed\\(3\\)`),
    );
  }
});
