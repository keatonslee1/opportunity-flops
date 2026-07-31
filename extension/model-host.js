/**
 * Sandboxed model runner.
 *
 * The economic model is owned by a teammate and lives in the site's
 * `public/model.js`. This extension never reimplements it and never edits it:
 * it loads that exact file from the deployed site and evaluates it here, in a
 * sandboxed frame with an opaque origin and no extension privileges.
 *
 * Protocol (postMessage, both directions, `id` echoed back):
 *
 *   → { id, type: "load", source }        ← { id, ok, exports } | { id, ok: false, error }
 *   → { id, type: "run", assumptions }    ← { id, ok, result }   | { id, ok: false, error }
 *
 * `exports` carries only the plain-data parts of the module namespace, because
 * a module namespace object itself cannot cross a postMessage boundary.
 */

/** The live module namespace, once `load` has succeeded. */
let loaded = null;

/**
 * Evaluates module source without a network fetch from inside the sandbox.
 *
 * Blob URLs are the primary path; a base64 data URL is the fallback for
 * Chrome builds that decline to resolve blob: specifiers in a sandboxed frame.
 */
async function importSource(source) {
  const blobUrl = URL.createObjectURL(
    new Blob([source], { type: "text/javascript" }),
  );
  try {
    return await import(blobUrl);
  } catch (blobError) {
    try {
      // btoa() is latin1-only, so round-trip through UTF-8 bytes first.
      const bytes = new TextEncoder().encode(source);
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      return await import(`data:text/javascript;base64,${btoa(binary)}`);
    } catch {
      // The blob failure is the more informative of the two.
      throw blobError;
    }
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

/**
 * Copies the exports the UI reads. Everything except `assumptionDefinitions`
 * and `runModel` is optional, matching the site's own adapter contract, so a
 * missing export is a normal state rather than an error.
 */
function plainExports(module) {
  const clone = (value) => {
    try {
      return structuredClone(value);
    } catch {
      return undefined;
    }
  };
  return {
    assumptionDefinitions: clone(module.assumptionDefinitions) ?? [],
    SCENARIOS: clone(module.SCENARIOS),
    MODEL_CONSTANTS: clone(module.MODEL_CONSTANTS),
    POLICY_PRESETS: clone(module.POLICY_PRESETS),
    hasRunModel: typeof module.runModel === "function",
  };
}

function reply(message) {
  parent.postMessage(message, "*");
}

window.addEventListener("message", async (event) => {
  const request = event.data;
  if (!request || typeof request !== "object") return;
  const { id, type } = request;

  try {
    if (type === "load") {
      loaded = await importSource(request.source);
      if (typeof loaded.runModel !== "function") {
        throw new Error("model.js does not export runModel()");
      }
      reply({ id, ok: true, exports: plainExports(loaded) });
      return;
    }

    if (type === "run") {
      if (!loaded) throw new Error("model not loaded");
      const result = loaded.runModel(request.assumptions);
      reply({ id, ok: true, result: structuredClone(result) });
      return;
    }
  } catch (error) {
    reply({ id, ok: false, error: String(error?.message ?? error) });
  }
});

// Announce readiness so the panel does not have to guess when the frame is live.
reply({ type: "ready" });
