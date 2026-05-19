import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readRepo } from "../src/repo-read.js";
import { generateChecklist, generatePaymentsIntegrationDoc } from "../src/gen-checklist.js";
import { SAMPLE_REPO } from "./helpers.js";

const model = readRepo(SAMPLE_REPO);
const checklist = generateChecklist(model);
const payments = generatePaymentsIntegrationDoc(model);

describe("loopkit checklist — the real mechanical loop, no boxes pre-checked", () => {
  it("covers Show HN, Product Hunt, Reddit/forums, owned channels, and MoR", () => {
    expect(checklist).toMatch(/Show HN/);
    expect(checklist).toMatch(/Product Hunt/);
    expect(checklist).toMatch(/Reddit|subreddit|Lobsters/);
    expect(checklist).toMatch(/owned channels/i);
    expect(checklist).toMatch(/Merchant.of.Record|MoR/);
    expect(checklist).toContain("https://news.ycombinator.com/showhn.html"); // the real rules link
  });

  it("EVERY item is an unchecked box (loopkit checked nothing off; it cannot)", () => {
    const boxes = checklist.match(/^- \[.\]/gm) || [];
    expect(boxes.length).toBeGreaterThan(20);
    for (const b of boxes) expect(b).toBe("- [ ]"); // never "- [x]"
    expect(checklist).toMatch(/loopkit checked NOTHING off/i);
  });

  it("is project-aware where it can be (uses the repo's name/url) without inventing", () => {
    expect(checklist).toContain("snapdiff");
    expect(checklist).toContain("https://github.com/exampleuser/snapdiff");
  });
});

describe("payments integration scaffold — ZERO payment code (load-bearing)", () => {
  it("is documentation + a wiring checklist, explicitly self-describing as zero-code", () => {
    expect(payments).toMatch(/zero payment code/i);
    expect(payments).toMatch(/documentation and a\s*\n?>?\s*wiring checklist only|documentation \+ a TODO/i);
    expect(payments).toMatch(/loopkit ships \*\*zero payment code\*\*|ships zero payment code/i);
  });

  it("names MoR options but recommends none (judgment, not boilerplate)", () => {
    expect(payments).toMatch(/Paddle/);
    expect(payments).toMatch(/Lemon Squeezy/);
    expect(payments).toMatch(/Polar/);
    expect(payments).toMatch(/loopkit does not recommend one/i);
  });

  it("the webhook section is a TODO SHAPE, not an implementation", () => {
    expect(payments).toMatch(/TODO\(you\)/);
    expect(payments).toMatch(/loopkit intentionally provides NO body here/i);
    expect(payments).toMatch(/Verify the signature/i); // it teaches the danger, not the code
  });
});

/**
 * The single most important guarantee of this whole product: the kit
 * contains NO payment-processing code anywhere. We assert this STRUCTURALLY
 * across every source file, not just the checklist module.
 */
describe("NO PAYMENT CODE anywhere in src/ or bin/ (structural guarantee)", () => {
  const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
  const dirs = ["src", "bin"];

  function jsFiles() {
    const out = [];
    for (const d of dirs) {
      for (const f of readdirSync(join(ROOT, d))) {
        if (f.endsWith(".js")) out.push(join(ROOT, d, f));
      }
    }
    return out;
  }

  // The guarantee is "no payment CODE". A comment that truthfully states
  // loopkit imports no payment SDK is the OPPOSITE of a violation, so we
  // scan code with comments stripped (same rigor as no-network.test.js).
  // Comment text is asserted separately by the gen-checklist content tests.
  function codeOf(f) {
    return readFileSync(f, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");
  }

  it("no source file imports or requires a payment SDK", () => {
    const sdkImport =
      /\b(?:import|require)\b[^;\n]*\b(stripe|@paddle|paddle-sdk|@lemonsqueezy|lemonsqueezy|@polar-sh|polar-sdk|braintree|@paypal|square)\b/i;
    for (const f of jsFiles()) {
      expect(sdkImport.test(codeOf(f)), `${f} must not import a payment SDK`).toBe(false);
    }
  });

  it("no source file calls a charge/checkout/payment-intent API or holds a live secret key", () => {
    // Patterns that would indicate ACTUAL money handling code (not docs).
    const moneyApi =
      /\.(charges|paymentIntents|checkout|subscriptions|invoices|refunds)\.(create|update|cancel|capture)\s*\(/;
    const liveKey = /\b(sk_live_[A-Za-z0-9]|rk_live_[A-Za-z0-9]|pk_live_[A-Za-z0-9])/;
    for (const f of jsFiles()) {
      const code = codeOf(f);
      expect(moneyApi.test(code), `${f} must not call a payment API`).toBe(false);
      expect(liveKey.test(code), `${f} must not contain a live key`).toBe(false);
    }
  });

  it("the generated payments doc itself contains no runnable payment call", () => {
    // Placeholders like __YOUR_..._URL__ and prose are fine; an actual SDK
    // call is not.
    expect(/\bstripe\.(charges|paymentIntents|checkout)\b/i.test(payments)).toBe(false);
    expect(/\bnew\s+Stripe\(/i.test(payments)).toBe(false);
    expect(/sk_live_/.test(payments)).toBe(false);
  });
});
