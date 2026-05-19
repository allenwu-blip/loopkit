import { describe, it, expect } from "vitest";
import { readRepo } from "../src/repo-read.js";
import { generateLanding } from "../src/gen-landing.js";
import { SAMPLE_REPO, THIN_REPO } from "./helpers.js";

const html = generateLanding(readRepo(SAMPLE_REPO));

describe("loopkit landing — a REAL static file, from the repo's own words", () => {
  it("is a complete, valid-looking HTML document", () => {
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("<html lang=\"en\">");
    expect(html).toContain("</html>");
  });

  it("contains zero JavaScript and zero external/network resources", () => {
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/https?:\/\/[^"'\s]*\.(js|css)\b/i); // no CDN js/css
    expect(html).not.toMatch(/<link[^>]+stylesheet/i); // CSS is inlined
    expect(html).not.toMatch(/fonts\.googleapis|cdn\.|unpkg|jsdelivr/i);
    // The ONLY hrefs allowed are the user's OWN repo URL (from package.json).
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    for (const h of hrefs) {
      expect(h.startsWith("https://github.com/exampleuser/snapdiff")).toBe(true);
    }
  });

  it("renders ONLY content derivable from the repo (name, tagline, install, sections)", () => {
    expect(html).toContain("snapdiff");
    expect(html).toContain("A zero-config visual diff for your terminal screenshots.");
    expect(html).toContain("npx snapdiff before.png after.png"); // verbatim install
    expect(html).toContain("Why");
    expect(html).toContain("Screenshot tests rot silently"); // verbatim from README Why
    expect(html).toContain("Limitations");
  });

  it("carries the loopkit SCAFFOLD stamp", () => {
    expect(html).toMatch(/loopkit SCAFFOLD/);
    expect(html).toMatch(/loopkit did not\s+deploy this|loopkit did not deploy it/);
  });

  it("invents nothing: no marketing words the README never used", () => {
    // A representative blocklist of hype loopkit must never add on its own.
    for (const banned of [
      "revolutionary",
      "blazing fast",
      "10x",
      "game-changer",
      "best-in-class",
      "trusted by",
      "loved by thousands",
      "AI-powered",
    ]) {
      expect(html.toLowerCase()).not.toContain(banned.toLowerCase());
    }
  });

  it("for a thin repo, missing fields become LOUD visible placeholders, not fabrications", () => {
    const thin = generateLanding(readRepo(THIN_REPO));
    expect(thin).toContain("barebones"); // it has a name
    expect(thin).toMatch(/FILL THIS IN/); // tagline + install were absent
    expect(thin).toContain("loopkit will not invent it");
    // crucially: it did NOT invent a tagline sentence
    expect(thin).not.toMatch(/\bzero-config\b/);
  });

  it("is deterministic: identical bytes out for identical bytes in", () => {
    expect(generateLanding(readRepo(SAMPLE_REPO))).toBe(html);
  });
});
