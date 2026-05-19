import { describe, it, expect } from "vitest";
import { readRepo } from "../src/repo-read.js";
import {
  generateLaunch,
  generateShowHN,
  generateForumPost,
  generateChangelogAnnouncement,
} from "../src/gen-launch.js";
import { SAMPLE_REPO, THIN_REPO } from "./helpers.js";

const model = readRepo(SAMPLE_REPO);
const { files, meta } = generateLaunch(model);

describe("loopkit launch — DRAFTS only, from the repo's own README/CHANGELOG", () => {
  it("emits exactly the three expected draft files", () => {
    expect(Object.keys(files).sort()).toEqual([
      "changelog-announcement.draft.md",
      "forum-post.draft.md",
      "show-hn.draft.md",
    ]);
  });

  it("EVERY draft is stamped DRAFT and says loopkit will not post it", () => {
    for (const [name, content] of Object.entries(files)) {
      expect(content, name).toMatch(/loopkit DRAFT/);
      expect(content, name).toMatch(/will NOT post this for you|never posts|loopkit never posts/i);
      expect(content, name).toMatch(/DRAFT \d\/3/);
    }
  });

  it("Show HN draft uses the literal Show HN convention and the repo's own value prop", () => {
    const hn = generateShowHN(model);
    expect(hn.title.startsWith("Show HN:")).toBe(true);
    expect(hn.title).toContain("snapdiff");
    expect(hn.title).toContain("A zero-config visual diff for your terminal screenshots.");
    expect(hn.content).toContain("https://github.com/exampleuser/snapdiff"); // submission URL from pkg
    // README feature bullets are restated verbatim (markdown stripped to text):
    expect(hn.content).toContain("One command, no config file, no setup");
    expect(hn.content).toContain("Exit code 1 on a meaningful diff so CI catches it");
    // the honest "what it does NOT do" is pulled from the README's Limitations:
    expect(hn.content).toMatch(/does NOT do|deliberately does NOT/);
    expect(hn.content).toContain("It only handles PNG"); // verbatim from README Limitations
  });

  it("Show HN draft leaves the HUMAN parts as explicit placeholders (no fabricated backstory)", () => {
    const hn = generateShowHN(model);
    expect(hn.content).toMatch(/WHY YOU built this/);
    expect(hn.content).toMatch(/loopkit cannot and will not write your story/i);
    // It must NOT have invented a personal narrative:
    expect(hn.content).not.toMatch(/I was frustrated when/i);
    expect(hn.content).not.toMatch(/one day I/i);
  });

  it("warns (does not silently truncate) when the drafted HN title exceeds 80 chars", () => {
    // Construct a model with a very long tagline.
    const longModel = {
      ...model,
      tagline: "x".repeat(120),
    };
    const hn = generateShowHN(longModel);
    expect(hn.titleLen).toBeGreaterThan(80);
    expect(hn.content).toMatch(/OVER HN's 80-char limit|over HN/i);
    expect(hn.content).toMatch(/loopkit will not silently truncate/i);
    // and the meta surfaced it for the CLI:
    const ml = generateLaunch(longModel);
    expect(ml.meta.hnTitleLen).toBeGreaterThan(80);
  });

  it("changelog announcement uses ONLY the real top release, verbatim bullets", () => {
    const cl = generateChangelogAnnouncement(model);
    expect(cl.content).toContain("snapdiff 1.2.0");
    expect(cl.content).toContain("2026-02-14");
    // changelog markdown is normalized to plain text (backticks stripped) —
    // loopkit restates the user's words, it does not preserve md syntax:
    expect(cl.content).toContain("Added a --tolerance flag for anti-aliasing noise");
    expect(cl.content).toContain("3x faster on large PNGs"); // verbatim, not inflated
    expect(cl.version).toBe("1.2.0"); // skipped [Unreleased], picked the real release
  });

  it("with NO changelog, it refuses to invent a release and emits a placeholder", () => {
    const noCl = { ...model, changelog: { present: false, path: null, releases: [] } };
    const cl = generateChangelogAnnouncement(noCl);
    expect(cl.content).toMatch(/no CHANGELOG\.md/i);
    expect(cl.content).toMatch(/will not invent a release/i);
    expect(cl.content).toMatch(/FILL THIS IN/);
    expect(cl.content).not.toMatch(/1\.2\.0/); // nothing fabricated
  });

  it("NO INVENTED CLAIMS: every draft's prose is derivable from the fixture inputs", () => {
    // The union of all words loopkit is allowed to emit = its own fixed
    // template/banner text + the fixture's own README/CHANGELOG text. We
    // assert no hype adjective loopkit could only have invented appears.
    const allDrafts = Object.values(files).join("\n").toLowerCase();
    for (const banned of [
      "revolutionary",
      "blazing",
      "10x faster", // note: README says "3x faster" — loopkit must not inflate it
      "world-class",
      "the best",
      "everyone loves",
      "going viral",
      "guaranteed",
      "ai-powered",
      "magic",
    ]) {
      expect(allDrafts, `must not invent: ${banned}`).not.toContain(banned);
    }
    // It restated the REAL "3x faster" from the changelog and did not inflate:
    expect(allDrafts).toContain("3x faster");
  });

  it("thin repo → drafts are honest skeletons of placeholders, not fabricated copy", () => {
    const thin = readRepo(THIN_REPO);
    const t = generateLaunch(thin);
    const hn = t.files["show-hn.draft.md"];
    expect(hn).toContain("barebones");
    expect(hn).toMatch(/FILL THIS IN/);
    expect(hn).not.toMatch(/zero-config/); // did not borrow another project's words
  });

  it("is deterministic", () => {
    expect(JSON.stringify(generateLaunch(model).files)).toBe(JSON.stringify(files));
  });
});
