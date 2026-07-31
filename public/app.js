import { assumptionDefinitions, runModel } from "./model.js";

const controls = document.querySelector("#assumption-controls");
const headline = document.querySelector("#headline-result");
const note = document.querySelector("#result-note");

const assumptions = Object.fromEntries(
  assumptionDefinitions.map((definition) => [definition.key, definition.value]),
);

function renderResult() {
  const result = runModel(assumptions);

  if (result.status === "pending-model") {
    headline.textContent = "—";
    return;
  }

  headline.textContent = result.cumulativeLoss;
  note.textContent = result.explanation;
}

for (const definition of assumptionDefinitions) {
  const row = document.createElement("label");
  row.className = "control";

  const title = document.createElement("span");
  title.className = "control-label";
  title.textContent = definition.label;

  const value = document.createElement("output");
  value.textContent = `${definition.value}${definition.suffix}`;

  const input = document.createElement("input");
  input.type = "range";
  input.min = definition.min;
  input.max = definition.max;
  input.step = definition.step;
  input.value = definition.value;
  input.setAttribute("aria-label", definition.label);

  input.addEventListener("input", () => {
    assumptions[definition.key] = Number(input.value);
    value.textContent = `${input.value}${definition.suffix}`;
    renderResult();
  });

  row.append(title, value, input);
  controls.append(row);
}

renderResult();
