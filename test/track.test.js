import { describe, it, expect } from "vitest";
import { parseLog, addEntry, summarize, emptyLog } from "../src/track.js";

describe("loopkit track — a plaintext, local-only notebook", () => {
  it("emptyLog is just a self-describing header", () => {
    const e = emptyLog();
    expect(e).toMatch(/loopkit traction log/);
    expect(e).toMatch(/local-only/);
    expect(e).toMatch(/NEVER reads a metric/);
  });

  it("addEntry appends a tab-separated row and keeps the header", () => {
    let log = emptyLog();
    log = addEntry(log, "2026-03-01T10:00:00.000Z", "stars", 10, "launch day");
    log = addEntry(log, "2026-03-02T10:00:00.000Z", "stars", 25, "after Show HN");
    const rows = parseLog(log);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ metric: "stars", value: 10, note: "launch day" });
    expect(rows[1]).toMatchObject({ metric: "stars", value: 25, note: "after Show HN" });
    expect(log).toMatch(/loopkit traction log/); // header preserved
  });

  it("prepends the header if the user hand-created a headerless file", () => {
    const log = addEntry("2026-03-01T00:00:00.000Z\tstars\t3\t\n", "2026-03-02T00:00:00.000Z", "stars", 5, "");
    expect(log).toMatch(/loopkit traction log/);
    expect(parseLog(log)).toHaveLength(2);
  });

  it("rejects a non-numeric value and a bad metric name (records nothing garbage)", () => {
    expect(() => addEntry(emptyLog(), "t", "stars", "lots", "")).toThrow(/finite number/);
    expect(() => addEntry(emptyLog(), "t", "1bad", 5, "")).toThrow(/invalid metric/);
    expect(() => addEntry(emptyLog(), "t", "", 5, "")).toThrow(/invalid metric/);
  });

  it("parseLog skips corrupt rows but keeps every valid one (one bad line ≠ data loss)", () => {
    const text =
      emptyLog() +
      "GARBAGE LINE NO TABS\n" + // too few columns → skipped
      "2026-03-01T00:00:00Z\tstars\t7\tok\n" + // valid → kept
      "2026-03-02T00:00:00Z\t\t9\tempty metric\n" + // empty metric → skipped
      "2026-03-03T00:00:00Z\tstars\tNaNish\tbad value\n"; // non-numeric → skipped
    const rows = parseLog(text);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ metric: "stars", value: 7 });
  });

  it("summarize reports first/latest/total-delta/last-step per metric, no fetched data", () => {
    let log = emptyLog();
    log = addEntry(log, "2026-03-01T00:00:00.000Z", "stars", 10, "");
    log = addEntry(log, "2026-03-05T00:00:00.000Z", "stars", 40, "");
    log = addEntry(log, "2026-03-09T00:00:00.000Z", "stars", 55, "");
    log = addEntry(log, "2026-03-02T00:00:00.000Z", "signups", 2, "");
    const { text, metrics } = summarize(log);
    expect(metrics.stars).toMatchObject({
      first: 10,
      latest: 55,
      totalDelta: 45,
      lastStepDelta: 15,
      count: 3,
    });
    expect(metrics.signups).toMatchObject({ first: 2, latest: 2, lastStepDelta: null });
    expect(text).toMatch(/recorded by YOU/);
    expect(text).toMatch(/loopkit fetched nothing/);
    expect(text).toContain("stars");
    expect(text).toContain("+45 total");
  });

  it("summarize on an empty log nudges the user, invents no metric data", () => {
    const { text, metrics } = summarize(emptyLog());
    expect(metrics).toEqual({}); // zero fabricated metrics
    expect(text).toMatch(/No observations yet/);
    // It must not print a fabricated metric SUMMARY row (e.g. "stars  42
    // [+30 total ...]"). The only digit in the output is the literal usage
    // example `loopkit track add stars 12`, which is help text, not data.
    expect(text).not.toMatch(/\[\+?-?\d+ total/); // no fabricated delta line
    expect(text).not.toMatch(/total since \d{4}-/); // no fabricated history
    const digitLines = text.split("\n").filter((l) => /\d/.test(l));
    expect(digitLines).toEqual(['  loopkit track add stars 12 "after Show HN"']);
  });

  it("is deterministic given the same inputs (timestamps are passed in, not read)", () => {
    const a = addEntry(emptyLog(), "2026-03-01T00:00:00.000Z", "stars", 1, "x");
    const b = addEntry(emptyLog(), "2026-03-01T00:00:00.000Z", "stars", 1, "x");
    expect(a).toBe(b);
  });
});
