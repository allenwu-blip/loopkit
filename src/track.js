/**
 * src/track.js — `loopkit track`
 *
 * A plaintext, git-friendly, fully LOCAL traction log. The user records
 * numbers THEY observed (stars, installs, signups, HN points, …). loopkit
 * stores them as a TSV-ish flat file, computes deltas between snapshots, and
 * prints a summary. That is the entire feature.
 *
 * Hard rules (asserted by the test suite):
 *   - No telemetry. No phone-home. No account. No network path exists.
 *   - loopkit NEVER fetches a number for you (it cannot — there is no client).
 *     Every value is one the user typed. A tracker that auto-scraped your
 *     star count would be the "magic" SCOUT warned against and would also be
 *     a privacy/telemetry surface. This stays a notebook, on purpose.
 *   - The store is human-readable and diff-able so it lives in the user's
 *     own git, owned by them, inspectable, no lock-in.
 *
 * This module is PURE: parsing, appending, summarizing are string→string.
 * The CLI does the actual file read/write. No clock here — the timestamp is
 * passed in by the caller so the transform stays deterministic and testable.
 */

const HEADER = [
  "# loopkit traction log — plaintext, local-only, yours.",
  "# loopkit NEVER writes to this file on its own and NEVER reads a metric",
  "# off the internet. Every row is a number YOU recorded by hand. No",
  "# telemetry, no account, no phone-home. Keep this file in your git.",
  "#",
  "# Format (tab-separated):  <ISO-8601 timestamp>\\t<metric>\\t<value>\\t<note>",
  "# Append with:  loopkit track add <metric> <value> [note...]",
  "# Summarize with:  loopkit track",
  "#",
].join("\n");

/** A single recorded observation. */
export class Entry {
  constructor(ts, metric, value, note) {
    this.ts = ts; // ISO 8601 string, supplied by the caller
    this.metric = metric; // e.g. "stars", "installs", "signups", "hn_points"
    this.value = value; // number
    this.note = note || ""; // freeform, the user's own words
  }
  toLine() {
    return [this.ts, this.metric, String(this.value), this.note.replace(/\t/g, " ")].join("\t");
  }
}

/** Parse the flat file into entries (comment/blank lines ignored). Robust to a junk line. */
export function parseLog(text) {
  const entries = [];
  for (const raw of String(text ?? "").split(/\r?\n/)) {
    const line = raw.replace(/\r$/, "");
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const parts = line.split("\t");
    if (parts.length < 3) continue; // skip a corrupt row, never crash the rest
    const [ts, metric, valueStr, ...noteParts] = parts;
    const value = Number(valueStr);
    if (!metric || Number.isNaN(value)) continue;
    entries.push(new Entry(ts, metric, value, noteParts.join("\t")));
  }
  return entries;
}

/** Initialize the file content (just the header). */
export function emptyLog() {
  return HEADER + "\n";
}

/**
 * Append one observation. Returns the new full file text. If the existing
 * text lacks the header (e.g. user created the file by hand), the header is
 * prepended once. Validates metric name + numeric value (the CLI surfaces the
 * error to the user rather than recording garbage).
 */
export function addEntry(existingText, ts, metric, value, note) {
  const m = String(metric ?? "").trim();
  if (!m || !/^[a-zA-Z][\w-]*$/.test(m)) {
    throw new Error(`invalid metric name '${metric}': use a word like stars, installs, signups, hn_points`);
  }
  const v = Number(value);
  if (!Number.isFinite(v)) {
    throw new Error(`value must be a finite number, got '${value}'`);
  }
  const e = new Entry(ts, m, v, String(note ?? "").trim());
  let base = existingText && existingText.trim() ? existingText : emptyLog();
  if (!base.includes("loopkit traction log")) base = HEADER + "\n" + base;
  if (!base.endsWith("\n")) base += "\n";
  return base + e.toLine() + "\n";
}

/**
 * Summarize: for each metric, first value, latest value, total delta, and the
 * most recent step delta. Pure formatting of recorded numbers — it asserts
 * nothing loopkit measured, because loopkit measured nothing.
 */
export function summarize(text) {
  const entries = parseLog(text);
  const byMetric = new Map();
  for (const e of entries) {
    if (!byMetric.has(e.metric)) byMetric.set(e.metric, []);
    byMetric.get(e.metric).push(e);
  }

  const lines = [];
  lines.push("loopkit traction summary");
  lines.push("(every number below was recorded by YOU; loopkit fetched nothing)");
  lines.push("");

  if (byMetric.size === 0) {
    lines.push("No observations yet. Record one:");
    lines.push("  loopkit track add stars 12 \"after Show HN\"");
    return { text: lines.join("\n") + "\n", metrics: {} };
  }

  const out = {};
  const names = [...byMetric.keys()].sort();
  const pad = Math.max(...names.map((n) => n.length), 6);

  for (const name of names) {
    const list = byMetric.get(name).slice().sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
    const first = list[0];
    const last = list[list.length - 1];
    const totalDelta = last.value - first.value;
    const prev = list.length >= 2 ? list[list.length - 2] : null;
    const stepDelta = prev ? last.value - prev.value : null;
    const sign = (n) => (n > 0 ? `+${n}` : `${n}`);

    out[name] = {
      first: first.value,
      latest: last.value,
      totalDelta,
      lastStepDelta: stepDelta,
      count: list.length,
      firstTs: first.ts,
      latestTs: last.ts,
    };

    const stepStr =
      stepDelta === null
        ? "(only one data point)"
        : `last step ${sign(stepDelta)} (since ${prev.ts})`;
    lines.push(
      `${name.padEnd(pad)}  ${last.value}  ` +
        `[${sign(totalDelta)} total since ${first.ts.slice(0, 10)}]  ${stepStr}`,
    );
  }

  lines.push("");
  lines.push(`${entries.length} observation(s) across ${names.length} metric(s). This file is plaintext and yours.`);
  return { text: lines.join("\n") + "\n", metrics: out };
}
