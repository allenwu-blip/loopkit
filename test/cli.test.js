import { describe, it, expect, afterEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { runCli, tmpOut, SAMPLE_REPO, THIN_REPO, EMPTY_REPO, BROKEN_PKG_REPO } from "./helpers.js";

const cleanups = [];
afterEach(() => {
  while (cleanups.length) cleanups.pop().cleanup();
});
function out() {
  const o = tmpOut();
  cleanups.push(o);
  return o;
}

describe("loopkit CLI end-to-end (real subprocess, minimal env: PATH only)", () => {
  it("help and --version work and exit cleanly", () => {
    const v = runCli(["--version"]);
    expect(v.status).toBe(0);
    expect(v.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);

    const h = runCli(["help"]);
    expect(h.status).toBe(0);
    expect(h.stdout).toMatch(/does NOT do taste, judgment, posting, or growth/);
  });

  it("an unknown command is a usage error (exit 2)", () => {
    const r = runCli(["frobnicate"]);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/unknown command/);
  });

  it("landing writes a real static index.html from the sample repo", () => {
    const o = out();
    const r = runCli(["landing", "--repo", SAMPLE_REPO, "--out", o.dir]);
    expect(r.status).toBe(0);
    const p = join(o.dir, "index.html");
    expect(existsSync(p)).toBe(true);
    const html = readFileSync(p, "utf8");
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("snapdiff");
    expect(html).not.toMatch(/<script/i);
    expect(r.stdout).toMatch(/loopkit did NOT deploy it/);
  });

  it("launch writes exactly three DRAFT files, all stamped", () => {
    const o = out();
    const r = runCli(["launch", "--repo", SAMPLE_REPO, "--out", o.dir]);
    expect(r.status).toBe(0);
    for (const f of ["show-hn.draft.md", "forum-post.draft.md", "changelog-announcement.draft.md"]) {
      const p = join(o.dir, "launch", f);
      expect(existsSync(p), f).toBe(true);
      expect(readFileSync(p, "utf8")).toMatch(/loopkit DRAFT/);
    }
    expect(r.stdout).toMatch(/will NOT post them/);
  });

  it("checklist writes the checklist + a payments scaffold (no code)", () => {
    const o = out();
    const r = runCli(["checklist", "--repo", SAMPLE_REPO, "--out", o.dir]);
    expect(r.status).toBe(0);
    const cl = readFileSync(join(o.dir, "DISTRIBUTION-CHECKLIST.md"), "utf8");
    const pay = readFileSync(join(o.dir, "payments", "INTEGRATION.md"), "utf8");
    expect(cl).toMatch(/Show HN/);
    expect(cl).toMatch(/- \[ \]/);
    expect(cl).not.toMatch(/- \[x\]/);
    expect(pay).toMatch(/zero payment code/i);
    expect(r.stdout).toMatch(/zero payment code/i);
  });

  it("--stdout prints instead of writing files", () => {
    const r = runCli(["landing", "--repo", SAMPLE_REPO, "--stdout"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("<!DOCTYPE html>");
    expect(r.stdout).toContain("snapdiff");
  });

  it("track add records a row and prints a summary; track shows it", () => {
    const o = out();
    const file = join(o.dir, "t.tsv");
    const a = runCli(["track", "add", "stars", "12", "after Show HN", "--out", file]);
    expect(a.status).toBe(0);
    expect(a.stdout).toMatch(/recorded: stars=12/);
    const b = runCli(["track", "add", "stars", "30", "--out", file]);
    expect(b.status).toBe(0);
    const s = runCli(["track", "--out", file]);
    expect(s.status).toBe(0);
    expect(s.stdout).toMatch(/stars/);
    expect(s.stdout).toMatch(/\+18 total/);
    expect(s.stdout).toMatch(/loopkit fetched nothing/);
    const raw = readFileSync(file, "utf8");
    expect(raw).toMatch(/loopkit traction log/);
    expect(raw.split("\n").filter((l) => l.includes("\tstars\t")).length).toBe(2);
  });

  it("track add with a bad value is a usage error and records nothing", () => {
    const o = out();
    const file = join(o.dir, "t.tsv");
    const r = runCli(["track", "add", "stars", "lots", "--out", file]);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/finite number/);
    expect(existsSync(file)).toBe(false);
  });

  describe("honest refusal: loopkit will not invent inputs", () => {
    it("an empty repo → exit 1 with an explicit refusal (no fabricated artifact)", () => {
      const o = out();
      const r = runCli(["landing", "--repo", EMPTY_REPO, "--out", o.dir]);
      expect(r.status).toBe(1);
      expect(r.stderr).toMatch(/will NOT invent/i);
      expect(existsSync(join(o.dir, "index.html"))).toBe(false);
    });

    it("a broken package.json → exit 1, not a silent guess", () => {
      const o = out();
      const r = runCli(["launch", "--repo", BROKEN_PKG_REPO, "--out", o.dir]);
      expect(r.status).toBe(1);
      expect(r.stderr).toMatch(/not valid JSON/);
    });

    it("a thin repo (name only) still works but the output is honest placeholders", () => {
      const o = out();
      const r = runCli(["landing", "--repo", THIN_REPO, "--out", o.dir]);
      expect(r.status).toBe(0);
      const html = readFileSync(join(o.dir, "index.html"), "utf8");
      expect(html).toContain("barebones");
      expect(html).toMatch(/FILL THIS IN/);
      expect(html).not.toMatch(/zero-config/); // did not borrow other words
    });
  });
});
