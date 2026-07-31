/**
 * Model bridge.
 *
 * Fetches the site's published `model.js` and hands it to the sandboxed frame
 * that evaluates it. Nothing in this extension recomputes, approximates or
 * substitutes for the model — if the source cannot be reached and nothing is
 * cached, the panel shows an empty state instead of inventing numbers.
 */

export const DEFAULT_ORIGIN = "https://flops.keatonlee.org";

const MODEL_PATH = "/model.js";
const CACHE_KEY = "modelCache";
const SETTINGS_KEY = "settings";

// ── Settings & cache ───────────────────────────────────────────────────

export async function readSettings() {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  return { origin: DEFAULT_ORIGIN, ...(stored[SETTINGS_KEY] ?? {}) };
}

export async function writeSettings(settings) {
  const merged = { ...(await readSettings()), ...settings };
  await chrome.storage.local.set({ [SETTINGS_KEY]: merged });
  return merged;
}

async function readCache(origin) {
  const stored = await chrome.storage.local.get(CACHE_KEY);
  const cached = stored[CACHE_KEY];
  // A cache entry from a different origin is not a hit — dev and prod builds
  // of the model can legitimately differ.
  return cached && cached.origin === origin ? cached : null;
}

async function writeCache(entry) {
  await chrome.storage.local.set({ [CACHE_KEY]: entry });
}

// ── Source loading ─────────────────────────────────────────────────────

/**
 * Resolves the model source, preferring the network and falling back to the
 * last good copy.
 *
 * @returns {Promise<{source: string, from: "network"|"cache", origin: string,
 *   fetchedAt: number, error: string|null}>}
 */
export async function loadModelSource(origin) {
  let networkError = null;

  try {
    const response = await fetch(new URL(MODEL_PATH, origin).href, {
      cache: "no-cache",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const source = await response.text();
    if (!source.trim()) throw new Error("empty response");

    const entry = { origin, source, fetchedAt: Date.now() };
    await writeCache(entry);
    return { ...entry, from: "network", error: null };
  } catch (error) {
    networkError = String(error?.message ?? error);
  }

  const cached = await readCache(origin);
  if (cached) return { ...cached, from: "cache", error: networkError };

  throw new Error(networkError ?? "model unavailable");
}

// ── Sandbox transport ──────────────────────────────────────────────────

/**
 * Owns the sandboxed frame and turns its postMessage protocol into promises.
 */
export class ModelBridge {
  #frame = null;
  #pending = new Map();
  #nextId = 1;
  #ready = null;

  /** Plain-data exports from the loaded module, or null before `load()`. */
  exports = null;

  #ensureFrame() {
    if (this.#ready) return this.#ready;

    this.#frame = document.createElement("iframe");
    this.#frame.src = "model-host.html";
    this.#frame.hidden = true;
    this.#frame.setAttribute("aria-hidden", "true");
    this.#frame.title = "Model host";

    this.#ready = new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("model host did not start")),
        10_000,
      );

      window.addEventListener("message", (event) => {
        // Sandboxed frames post from an opaque origin, so identity is checked
        // by window reference rather than by origin string.
        if (event.source !== this.#frame?.contentWindow) return;
        const data = event.data;
        if (!data || typeof data !== "object") return;

        if (data.type === "ready") {
          clearTimeout(timer);
          resolve();
          return;
        }

        const settle = this.#pending.get(data.id);
        if (!settle) return;
        this.#pending.delete(data.id);
        if (data.ok) settle.resolve(data);
        else settle.reject(new Error(data.error ?? "model host error"));
      });

      document.body.append(this.#frame);
    });

    return this.#ready;
  }

  async #send(message) {
    await this.#ensureFrame();
    const id = this.#nextId++;
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      this.#frame.contentWindow.postMessage({ ...message, id }, "*");
    });
  }

  /** Evaluates model source in the sandbox and caches its plain exports. */
  async load(source) {
    const reply = await this.#send({ type: "load", source });
    this.exports = reply.exports;
    return this.exports;
  }

  /** Runs the model. Mirrors `runModel(assumptions)` exactly. */
  async run(assumptions) {
    const reply = await this.#send({ type: "run", assumptions });
    return reply.result;
  }
}
