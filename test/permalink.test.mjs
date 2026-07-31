import assert from "node:assert/strict";
import test from "node:test";

import { buildUrl, decodeState, encodeState } from "../public/permalink.js";

const definitions = [
  { key: "computeReallocated", min: 0, max: 50, step: 1, value: 20 },
  { key: "durationMonths", min: 1, max: 36, step: 1, value: 12 },
  { key: "aiProductivityGrowth", min: 0, max: 3, step: 0.1, value: 1 },
  {
    key: "impactLevel",
    type: "choice",
    options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
    ],
    value: "medium",
  },
];

const config = {
  definitions,
  scenarioKeys: ["baseline", "unilateral", "coordinated"],
  defaultScenario: "coordinated",
};

const defaults = Object.fromEntries(definitions.map((d) => [d.key, d.value]));

test("a default configuration produces a clean URL", () => {
  const query = encodeState({ assumptions: defaults, scenario: "coordinated" }, config);
  assert.equal(query, "");

  const url = buildUrl(
    { assumptions: defaults, scenario: "coordinated" },
    config,
    { origin: "https://flops.keatonlee.org", pathname: "/" },
  );
  assert.equal(url, "https://flops.keatonlee.org/");
});

test("only non-default values are written", () => {
  const query = encodeState(
    { assumptions: { ...defaults, computeReallocated: 35 }, scenario: "unilateral" },
    config,
  );

  const params = new URLSearchParams(query);
  assert.equal(params.get("computeReallocated"), "35");
  assert.equal(params.get("scenario"), "unilateral");
  assert.equal(params.get("durationMonths"), null, "defaults should be omitted");
});

test("encode and decode round-trip", () => {
  const state = {
    assumptions: {
      ...defaults,
      computeReallocated: 45,
      durationMonths: 30,
      aiProductivityGrowth: 2.5,
      impactLevel: "high",
    },
    scenario: "unilateral",
  };

  const decoded = decodeState(encodeState(state, config), config);

  assert.deepEqual(decoded.assumptions, state.assumptions);
  assert.equal(decoded.scenario, state.scenario);
});

test("an empty query yields the declared defaults", () => {
  const decoded = decodeState("", config);
  assert.deepEqual(decoded.assumptions, defaults);
  assert.equal(decoded.scenario, "coordinated");
  assert.deepEqual(decoded.applied, []);
});

test("out-of-range numbers are clamped, not trusted", () => {
  const high = decodeState("?computeReallocated=9999", config);
  assert.equal(high.assumptions.computeReallocated, 50);

  const low = decodeState("?durationMonths=-40", config);
  assert.equal(low.assumptions.durationMonths, 1);
});

test("values are snapped to the declared step", () => {
  const decoded = decodeState("?aiProductivityGrowth=1.234", config);
  assert.equal(decoded.assumptions.aiProductivityGrowth, 1.2);
});

test("garbage values fall back to defaults rather than producing NaN", () => {
  const decoded = decodeState("?computeReallocated=banana&durationMonths=", config);

  assert.equal(decoded.assumptions.computeReallocated, 20);
  assert.equal(decoded.assumptions.durationMonths, 12);
  for (const value of Object.values(decoded.assumptions)) {
    assert.ok(!Number.isNaN(value));
  }
  assert.deepEqual(decoded.applied, [], "nothing unusable should count as applied");
});

test("select values must be one of the declared options", () => {
  const valid = decodeState("?impactLevel=high", config);
  assert.equal(valid.assumptions.impactLevel, "high");

  const invalid = decodeState("?impactLevel=catastrophic", config);
  assert.equal(invalid.assumptions.impactLevel, "medium");
});

test("an unknown scenario falls back to the default", () => {
  const decoded = decodeState("?scenario=tripartite", config);
  assert.equal(decoded.scenario, "coordinated");
});

test("unrelated query parameters are ignored", () => {
  const decoded = decodeState("?utm_source=twitter&computeReallocated=30", config);

  assert.equal(decoded.assumptions.computeReallocated, 30);
  assert.equal(Object.keys(decoded.assumptions).length, definitions.length);
});

test("applied reports which keys came from the URL", () => {
  const decoded = decodeState("?computeReallocated=30&scenario=baseline", config);
  assert.deepEqual(decoded.applied.sort(), ["computeReallocated", "scenario"]);
});

test("buildUrl preserves the path it was given", () => {
  const url = buildUrl(
    { assumptions: { ...defaults, computeReallocated: 5 }, scenario: "coordinated" },
    config,
    { origin: "https://example.com", pathname: "/embed" },
  );
  assert.equal(url, "https://example.com/embed?computeReallocated=5");
});
