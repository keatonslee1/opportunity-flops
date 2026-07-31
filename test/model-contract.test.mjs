import assert from "node:assert/strict";
import test from "node:test";

import { assumptionDefinitions, runModel } from "../public/model.js";

test("economic model exposes a stable UI contract", () => {
  assert.ok(assumptionDefinitions.length > 0);

  const assumptions = Object.fromEntries(
    assumptionDefinitions.map(({ key, value }) => [key, value]),
  );
  const result = runModel(assumptions);

  assert.equal(result.status, "pending-model");
  assert.deepEqual(result.assumptions, assumptions);
  assert.ok(Array.isArray(result.series));
});
