import { describe, it, expect } from "vitest";
import {
  parseMarkdownSections,
  parseChangelog,
  findSection,
  firstParagraph,
  firstCodeBlock,
  inlineToText,
  readRepo,
} from "../src/repo-read.js";
import { SAMPLE_REPO, THIN_REPO, EMPTY_REPO, BROKEN_PKG_REPO } from "./helpers.js";

describe("markdown section parser", () => {
  it("splits ATX headings and preamble", () => {
    const { preamble, sections } = parseMarkdownSections(
      "intro line\n\n# Title\nbody A\n\n## Sub\nbody B",
    );
    expect(preamble).toBe("intro line");
    expect(sections.map((s) => [s.level, s.title])).toEqual([
      [1, "Title"],
      [2, "Sub"],
    ]);
    expect(sections[0].body).toBe("body A");
    expect(sections[1].body).toBe("body B");
  });

  it("does NOT treat a # inside a fenced code block as a heading", () => {
    const { sections } = parseMarkdownSections("# Real\n```\n# not a heading\n```\nstill real body");
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe("Real");
    expect(sections[0].body).toContain("# not a heading");
  });

  it("findSection matches case-insensitively and tolerates punctuation", () => {
    const { sections } = parseMarkdownSections("## Why\nx\n## Features!\ny");
    expect(findSection(sections, ["why"]).title).toBe("Why");
    expect(findSection(sections, ["features"]).title).toBe("Features!");
    expect(findSection(sections, ["nonexistent"])).toBeNull();
  });
});

describe("text extraction (removal only, never invention)", () => {
  it("firstParagraph skips badges/images/blockquotes and strips inline md", () => {
    const md = "![badge](x.png)\n\n> a quote\n\n**Bold** and `code` and [link](http://x).";
    expect(firstParagraph(md)).toBe("Bold and code and link.");
  });

  it("firstCodeBlock returns the fenced content verbatim", () => {
    expect(firstCodeBlock("text\n```bash\nnpx foo bar\n```\nmore")).toBe("npx foo bar");
    expect(firstCodeBlock("no code here")).toBe("");
  });

  it("inlineToText only removes syntax, adds nothing", () => {
    expect(inlineToText("`a` **b** _c_ [d](u)")).toBe("a b c d");
  });
});

describe("changelog parser — never fabricates", () => {
  it("parses Keep-a-Changelog versions, dates, and bullet entries verbatim", () => {
    const releases = parseChangelog(
      "# Changelog\n\n## [1.2.0] - 2026-02-14\n\n- Added X\n- Fixed Y\n\n## [1.1.0] - 2026-01-03\n\n- First release",
    );
    expect(releases).toHaveLength(2);
    expect(releases[0]).toMatchObject({ version: "1.2.0", date: "2026-02-14" });
    expect(releases[0].changes).toEqual(["Added X", "Fixed Y"]);
    expect(releases[1].version).toBe("1.1.0");
  });

  it("handles bare versions with no date and vX.Y.Z form", () => {
    const r = parseChangelog("## v2.0.0\n- big change\n## 1.0.0\n- old");
    expect(r[0]).toMatchObject({ version: "2.0.0", date: null });
    expect(r[1]).toMatchObject({ version: "1.0.0", date: null });
  });

  it("returns [] for an absent changelog (no invented release)", () => {
    expect(parseChangelog(null)).toEqual([]);
    expect(parseChangelog("")).toEqual([]);
  });
});

describe("readRepo model", () => {
  it("builds a full model from a realistic repo", () => {
    const m = readRepo(SAMPLE_REPO);
    expect(m.name).toBe("snapdiff");
    expect(m.tagline).toBe("A zero-config visual diff for your terminal screenshots.");
    expect(m.version).toBe("1.2.0");
    expect(m.license).toBe("MIT");
    expect(m.repoUrl).toBe("https://github.com/exampleuser/snapdiff");
    expect(m.installSnippet).toBe("npx snapdiff before.png after.png");
    expect(m.changelog.present).toBe(true);
    expect(m.changelog.releases.length).toBeGreaterThanOrEqual(2);
    expect(m.hasEnoughInput).toBe(true);
    expect(m.pkgError).toBeNull();
  });

  it("a thin repo (pkg name only, no README) still has minimal input but empty optional fields", () => {
    const m = readRepo(THIN_REPO);
    expect(m.name).toBe("barebones");
    expect(m.tagline).toBeNull(); // no description, no README — NOT fabricated
    expect(m.installSnippet).toBeNull();
    expect(m.changelog.present).toBe(false);
    expect(m.changelog.releases).toEqual([]);
    expect(m.hasEnoughInput).toBe(true); // a name alone is enough to not error
  });

  it("an empty repo has NO usable input (loopkit must refuse, not invent)", () => {
    const m = readRepo(EMPTY_REPO);
    expect(m.hasEnoughInput).toBe(false);
    expect(m.name).toBeNull();
    expect(m.tagline).toBeNull();
  });

  it("a broken package.json is reported as an error, not silently guessed", () => {
    const m = readRepo(BROKEN_PKG_REPO);
    expect(m.pkgError).toBeTruthy();
    expect(m.pkgError).toMatch(/not valid JSON/);
  });

  it("is deterministic: same bytes in → identical model out", () => {
    expect(JSON.stringify(readRepo(SAMPLE_REPO))).toBe(JSON.stringify(readRepo(SAMPLE_REPO)));
  });
});
