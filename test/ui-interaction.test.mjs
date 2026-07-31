import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appSource = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
const pageSource = await readFile(new URL("../public/index.html", import.meta.url), "utf8");

test("the results bay presents the four approved chart questions in order", () => {
  const chartHeadings = [
    "Software efficiency level",
    "Software progress slowdown",
    "Frontier capability",
    "AI capability gap",
  ];
  let previousPosition = -1;

  for (const heading of chartHeadings) {
    const position = pageSource.indexOf(`>${heading}</h3>`);
    assert.ok(position > previousPosition, `expected ${heading} after the previous chart`);
    previousPosition = position;
  }

  assert.match(pageSource, /Software-efficiency level index · 2026 = 100/);
  assert.match(pageSource, /<i>SS<\/i>\(<i>t<\/i>\) = 1 − <i>Ṡ<\/i><sub>P<\/sub>.*?\/ <i>Ṡ<\/i><sub>B<\/sub>/);
  assert.match(pageSource, /Training-compute-normalized index · 2026 = 100/);
  assert.match(pageSource, /<i>CG<\/i>\(<i>t<\/i>\) = 1 − <i>M<\/i><sub>P<\/sub>.*?\/ <i>M<\/i><sub>B<\/sub>/);
});

test("continuous slider input updates charts without replaying trace animation", () => {
  const sliderHandler = appSource.match(/input\.addEventListener\("input",[\s\S]*?\n\s*}\);/);

  assert.ok(sliderHandler, "expected a slider input handler");
  assert.match(sliderHandler[0], /renderResult\(false\)/);
});

test("the UI renders the four model-owned series in the approved order", () => {
  assert.doesNotMatch(appSource, /illustrativeSeries/);
  for (const seriesKey of [
    "software",
    "softwareSlowdown",
    "capability",
    "capabilityGap",
  ]) {
    assert.match(appSource, new RegExp(`seriesKey: "${seriesKey}"`));
  }
  assert.match(appSource, /const series = result\.series\[chart\.seriesKey\]/);
  assert.match(
    appSource,
    /renderChart\("software".*?renderChart\("softwareSlowdown".*?renderChart\("capability".*?renderChart\("capabilityGap"/s,
  );
  assert.match(appSource, /runModel\(\{ \.\.\.assumptions, scenario \}\)/);
});

test("all four charts expose dynamic grids, axes, and accessible descriptions", () => {
  for (const prefix of ["software", "slowdown", "capability", "capability-gap"]) {
    assert.match(pageSource, new RegExp(`id="${prefix}-grid"`));
    assert.match(pageSource, new RegExp(`id="${prefix}-axes"`));
    assert.match(pageSource, new RegExp(`id="${prefix}-svg-desc"`));
  }

  assert.match(appSource, /"text-anchor": "end"/);
  assert.match(appSource, /chart\.description\.textContent/);
});

test("slowdown and capability-gap charts use zero-based percentage axes", () => {
  for (const chartKey of ["softwareSlowdown", "capabilityGap"]) {
    assert.match(
      appSource,
      new RegExp(`${chartKey}: \\{[\\s\\S]*?domainKind: "fraction"[\\s\\S]*?areaMode: "max"`),
    );
  }

  assert.match(appSource, /const fallbackMaximum = 0\.03/);
  assert.match(appSource, /chart\.domainKind === "fraction"/);
  assert.match(appSource, /`\$\{\(value \* 100\)\.toFixed\(0\)\}%`/);
});

test("categorical sensitivity changes replay the discrete chart transition", () => {
  const choiceHandler = appSource.match(/input\.addEventListener\("change", \(\) => \{[\s\S]*?assumptions\[definition\.key\][\s\S]*?\n\s*}\);/);

  assert.ok(choiceHandler, "expected a categorical choice handler");
  assert.match(choiceHandler[0], /renderResult\(\)/);
});

test("chart summaries and narration match each plotted quantity", () => {
  const contracts = {
    software: ["softwareLevelGap", "softwareLevel"],
    softwareSlowdown: ["softwareSlowdown", "softwareSlowdown"],
    capability: ["capabilityGap", "capability"],
    capabilityGap: ["capabilityGap", "capabilityGap"],
  };

  for (const [chartKey, [metricKey, descriptionKind]] of Object.entries(contracts)) {
    assert.match(
      appSource,
      new RegExp(`${chartKey}: \\{[\\s\\S]*?metricKey: "${metricKey}"[\\s\\S]*?descriptionKind: "${descriptionKind}"`),
    );
  }

  assert.match(appSource, /level gap/);
  assert.match(appSource, /rate slowdown/);
  assert.match(appSource, /capability gap/);
  assert.match(appSource, /software-efficiency level indices/);
  assert.match(appSource, /software progress slowdown percentages/);
  assert.match(appSource, /frontier capability indices/);
  assert.match(appSource, /AI capability gap percentages/);
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
