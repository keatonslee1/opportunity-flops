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

test("both charts position Y-axis labels to the left of the plot axis", () => {
  const yAxisLabels = pageSource.match(/<text x="50"[^>]*text-anchor="end"[^>]*>/g) ?? [];

  assert.equal(yAxisLabels.length, 8);
});
