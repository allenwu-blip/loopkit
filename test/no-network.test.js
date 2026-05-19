import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The structural honesty guarantees, asserted across the WHOLE shipped tree
 * (bin/ + src/). These are the claims the README leads with; this file is
 * what makes them true rather than aspirational.
 *
 *   1. No network surface exists — no fetch/http(s)/net/dns/socket/got/axios.
 *   2. No telemetry / phone-home.
 *   3. No LLM / AI SDK (the generators are deterministic transforms; adding
 *      an LLM would be the exact "AI writes your launch post" overclaim the
 *      product refuses).
 *   4. Zero runtime dependencies (only a devDependency: vitest).
 */

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");

function walkJs(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walkJs(p));
    else if (name.endsWith(".js")) out.push(p);
  }
  return out;
}

const shippedFiles = [...walkJs(join(ROOT, "src")), ...walkJs(join(ROOT, "bin"))];

describe("NO NETWORK: nothing in the shipped tree can phone home", () => {
  it("collected the shipped source files", () => {
    expect(shippedFiles.length).toBeGreaterThan(5);
  });

  it("no source file imports a network/HTTP module or client", () => {
    const netModule =
      /\b(?:import|require)\b[^;\n]*['"](?:node:)?(?:http|https|net|dns|tls|dgram|http2)['"]/;
    const netClient =
      /\b(?:import|require)\b[^;\n]*\b(axios|node-fetch|got|undici|superagent|request|ky|phin)\b/i;
    for (const f of shippedFiles) {
      const src = readFileSync(f, "utf8");
      expect(netModule.test(src), `${f} imports a network core module`).toBe(false);
      expect(netClient.test(src), `${f} imports an HTTP client`).toBe(false);
    }
  });

  it("no source file calls fetch / XMLHttpRequest / WebSocket / .listen / .connect", () => {
    // word-boundary call patterns; comments are allowed to MENTION these
    // (the README boundary text does), but no call site may exist.
    const calls = [
      /\bfetch\s*\(/,
      /\bXMLHttpRequest\b/,
      /\bnew\s+WebSocket\s*\(/,
      /\.listen\s*\(/,
      /\bhttp2?\.request\s*\(/,
      /\bnet\.(connect|createConnection)\s*\(/,
    ];
    for (const f of shippedFiles) {
      // strip line + block comments so prose like "no fetch()" doesn't trip it
      const code = readFileSync(f, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      for (const re of calls) {
        expect(re.test(code), `${f} appears to make a network call: ${re}`).toBe(false);
      }
    }
  });

  it("no telemetry / analytics / phone-home identifiers", () => {
    const telemetry =
      /\b(?:import|require)\b[^;\n]*\b(posthog|mixpanel|segment|amplitude|sentry|analytics|telemetry)\b/i;
    for (const f of shippedFiles) {
      const src = readFileSync(f, "utf8");
      expect(telemetry.test(src), `${f} pulls in a telemetry SDK`).toBe(false);
    }
  });

  it("no LLM / AI SDK anywhere (generators are deterministic, by design)", () => {
    const ai =
      /\b(?:import|require)\b[^;\n]*\b(openai|@anthropic|anthropic|@google\/generative-ai|cohere|replicate|langchain|ollama)\b/i;
    const aiHost = /api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com/i;
    for (const f of shippedFiles) {
      const src = readFileSync(f, "utf8");
      expect(ai.test(src), `${f} imports an LLM SDK`).toBe(false);
      expect(aiHost.test(src), `${f} references an LLM API host`).toBe(false);
    }
  });

  it("package.json declares ZERO runtime dependencies (vitest is the only dev dep)", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    expect(pkg.dependencies == null || Object.keys(pkg.dependencies).length === 0).toBe(true);
    expect(Object.keys(pkg.devDependencies || {})).toEqual(["vitest"]);
  });

  it("the published `files` allowlist ships no test/fixture/config", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    expect(pkg.files.sort()).toEqual(["LICENSE", "README.md", "bin", "src"]);
    expect(pkg.files).not.toContain("test");
  });
});
