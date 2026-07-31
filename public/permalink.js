/**
 * Scenario permalinks.
 *
 * Every slider configuration gets a URL, so a result can be cited, compared
 * and argued with. Pure functions over plain objects — no DOM, no model
 * knowledge beyond the assumption definitions it is handed.
 *
 * URLs use the assumption keys verbatim rather than a packed encoding, so a
 * link is legible in a paper or a Slack message:
 *
 *   /?scenario=unilateral&computeReallocated=35&impactLevel=high
 *
 * Only values that differ from their declared default are written, which keeps
 * the common case short and means changing a default does not silently
 * reinterpret old links — it just changes what an omitted parameter means.
 */

export const SCENARIO_PARAM = "scenario";

/** Values from a URL are untrusted: anything unusable falls back to the default. */
function coerceNumber(definition, raw) {
  // Number("") and Number("  ") are 0, which would silently clamp to the
  // minimum. An empty parameter means "not supplied", not "zero".
  if (typeof raw !== "string" || raw.trim() === "") return null;

  const value = Number(raw);
  if (!Number.isFinite(value)) return null;

  const min = Number(definition.min);
  const max = Number(definition.max);
  const step = Number(definition.step) || 1;

  const clamped = Math.min(
    Number.isFinite(max) ? max : value,
    Math.max(Number.isFinite(min) ? min : value, value),
  );

  // Snap to the declared step so a hand-edited URL cannot produce a slider
  // position the control itself could never reach.
  if (Number.isFinite(min) && step > 0) {
    const snapped = min + Math.round((clamped - min) / step) * step;
    const decimals = String(step).includes(".") ? String(step).split(".")[1].length : 0;
    return Number(snapped.toFixed(decimals));
  }

  return clamped;
}

function coerceEnumerated(definition, raw) {
  return definition.options.some((option) => option.value === raw) ? raw : null;
}

/**
 * Enumerated inputs are detected by the presence of an options array rather
 * than a particular `type` string, so this keeps working whether the model
 * calls them "choice", "select" or something else later.
 */
function isEnumerated(definition) {
  return Array.isArray(definition.options) && definition.options.length > 0;
}

/**
 * Reads assumptions and scenario out of a query string.
 *
 * @param {string} search           e.g. location.search
 * @param {object} config
 * @param {Array}  config.definitions   assumption definitions
 * @param {Array}  config.scenarioKeys  permitted scenario values
 * @param {string} config.defaultScenario
 * @returns {{assumptions: object, scenario: string, applied: string[]}}
 *          `applied` lists the keys that actually came from the URL.
 */
export function decodeState(search, { definitions, scenarioKeys, defaultScenario }) {
  const params = new URLSearchParams(search ?? "");
  const assumptions = {};
  const applied = [];

  for (const definition of definitions) {
    assumptions[definition.key] = definition.value;

    if (!params.has(definition.key)) continue;

    const raw = params.get(definition.key);
    const value = isEnumerated(definition)
      ? coerceEnumerated(definition, raw)
      : coerceNumber(definition, raw);

    if (value !== null) {
      assumptions[definition.key] = value;
      applied.push(definition.key);
    }
  }

  let scenario = defaultScenario;
  if (params.has(SCENARIO_PARAM)) {
    const raw = params.get(SCENARIO_PARAM);
    if (scenarioKeys.includes(raw)) {
      scenario = raw;
      applied.push(SCENARIO_PARAM);
    }
  }

  return { assumptions, scenario, applied };
}

/**
 * Builds a query string for the current state, omitting anything at its
 * default. Returns "" when everything is default, so a pristine page keeps a
 * clean URL.
 */
export function encodeState({ assumptions, scenario }, { definitions, defaultScenario }) {
  const params = new URLSearchParams();

  if (scenario && scenario !== defaultScenario) {
    params.set(SCENARIO_PARAM, scenario);
  }

  for (const definition of definitions) {
    const value = assumptions?.[definition.key];
    if (value === undefined || value === null) continue;
    if (value === definition.value) continue;
    params.set(definition.key, String(value));
  }

  return params.toString();
}

/** Full shareable URL for the given state. */
export function buildUrl(state, config, location) {
  const query = encodeState(state, config);
  const { origin, pathname } = location;
  return query ? `${origin}${pathname}?${query}` : `${origin}${pathname}`;
}
