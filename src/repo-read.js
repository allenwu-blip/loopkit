/**
 * src/repo-read.js — read the user's OWN repo into a normalized model.
 *
 * This is the only place that touches the user's files, and it ONLY reads.
 * The model it returns is the single source of truth every generator
 * consumes. The contract that makes loopkit honest lives here:
 *
 *   Everything downstream is a pure function of THIS model, and this model
 *   is a pure function of the user's package.json / README.md / CHANGELOG.md.
 *   Nothing is invented. If a field is absent in the inputs it is absent in
 *   the model (null / []), and generators must render an explicit, visible
 *   "[fill this in]" placeholder rather than fabricate a plausible value.
 *
 * No network. No LLM. No execution of the repo. Deterministic: same bytes
 * in → byte-identical model out (we never read a clock, RNG, or env here).
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/** A markdown section: its heading text + the raw body lines under it. */
export class Section {
  constructor(title, level, body) {
    this.title = title; // heading text, trimmed, no leading '#'
    this.level = level; // 1..6
    this.body = body; // string, the lines between this heading and the next
  }
}

/**
 * Split markdown into ATX-heading sections. Anything before the first
 * heading is returned as the `preamble`. Fenced code blocks are respected
 * so a `#` inside ``` is not mistaken for a heading.
 */
export function parseMarkdownSections(md) {
  const lines = String(md ?? "").split(/\r?\n/);
  const sections = [];
  let preamble = [];
  let cur = null;
  let inFence = false;
  let fenceTok = "";

  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(```+|~~~+)/);
    if (fenceMatch) {
      const tok = fenceMatch[1][0];
      if (!inFence) {
        inFence = true;
        fenceTok = tok;
      } else if (tok === fenceTok) {
        inFence = false;
        fenceTok = "";
      }
    }

    const h = inFence ? null : line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (h) {
      if (cur) {
        cur.body = cur._buf.join("\n").trim();
        delete cur._buf;
        sections.push(cur);
      } else {
        preamble = preamble; // keep as-is
      }
      cur = new Section(h[2].trim(), h[1].length, "");
      cur._buf = [];
    } else if (cur) {
      cur._buf.push(line);
    } else {
      preamble.push(line);
    }
  }
  if (cur) {
    cur.body = cur._buf.join("\n").trim();
    delete cur._buf;
    sections.push(cur);
  }
  return { preamble: preamble.join("\n").trim(), sections };
}

/** Find the first section whose title matches any of `names` (case-insensitive, exact-ish). */
export function findSection(sections, names) {
  const want = names.map((n) => n.toLowerCase());
  return (
    sections.find((s) => {
      const t = s.title.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
      return want.some((w) => t === w || t.startsWith(w + " ") || t === w + "s");
    }) ?? null
  );
}

/** First non-empty paragraph of a markdown body, with markdown emphasis stripped to plain text. */
export function firstParagraph(md) {
  const blocks = String(md ?? "")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  for (const b of blocks) {
    // skip badge-only / image-only / heading-only / blockquote lines
    const stripped = b.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[[^\]]*\]\([^)]*\)/g, "").trim();
    if (!stripped) continue;
    if (/^#{1,6}\s/.test(b)) continue;
    if (/^>/.test(b)) continue;
    return inlineToText(b);
  }
  return "";
}

/** Strip inline markdown to readable plain text (no invention; only removal of syntax). */
export function inlineToText(s) {
  return String(s ?? "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract the first fenced code block from a markdown body (the canonical "install"/"usage" snippet). */
export function firstCodeBlock(md) {
  const m = String(md ?? "").match(/```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```/);
  return m ? m[1].trim() : "";
}

/**
 * Parse a Keep-a-Changelog-ish CHANGELOG.md into releases. We are permissive
 * about the exact heading form but we NEVER synthesize entries — only what is
 * literally written is returned.
 *
 *   ## [1.2.0] - 2026-01-01      → { version: "1.2.0", date: "2026-01-01", ... }
 *   ## 1.2.0                     → { version: "1.2.0", date: null, ... }
 *   ## [Unreleased]              → { version: "Unreleased", date: null, ... }
 */
export function parseChangelog(md) {
  if (!md) return [];
  const { sections } = parseMarkdownSections(md);
  const releases = [];
  for (const s of sections) {
    if (s.level < 2) continue; // the document "# Changelog" title is level 1
    const title = s.title.trim();
    // [x.y.z] - date  |  [x.y.z]  |  x.y.z - date  |  vX.Y.Z  |  Unreleased
    const m = title.match(/^\[?v?([^\]]+?)\]?(?:\s*[-–—]\s*(.+))?$/);
    if (!m) continue;
    const version = m[1].trim();
    const date = (m[2] || "").trim() || null;
    // bullet lines become change entries, verbatim minus the bullet
    const changes = s.body
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => /^[-*+]\s+/.test(l))
      .map((l) => inlineToText(l.replace(/^[-*+]\s+/, "")));
    releases.push({ version, date, changes, rawBody: s.body.trim() });
  }
  return releases;
}

/** Safely read a UTF-8 file, returning null if it does not exist. */
function readIf(path) {
  try {
    if (!existsSync(path)) return null;
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

/** Case/extension-tolerant locate of a doc file in the repo root. */
function locate(repoDir, bases) {
  for (const b of bases) {
    const p = join(repoDir, b);
    if (existsSync(p)) return p;
  }
  return null;
}

/**
 * Read a repo directory into the normalized model. `repoDir` must contain at
 * least a package.json OR a README — with neither there is nothing honest to
 * generate from, and we say so (the CLI turns this into a clear error).
 */
export function readRepo(repoDir) {
  const pkgPath = join(repoDir, "package.json");
  const pkgRaw = readIf(pkgPath);
  let pkg = null;
  let pkgError = null;
  if (pkgRaw != null) {
    try {
      pkg = JSON.parse(pkgRaw);
    } catch (e) {
      pkgError = `package.json is present but not valid JSON: ${e.message}`;
    }
  }

  const readmePath = locate(repoDir, ["README.md", "Readme.md", "readme.md", "README.markdown"]);
  const readmeRaw = readmePath ? readIf(readmePath) : null;
  const changelogPath = locate(repoDir, ["CHANGELOG.md", "Changelog.md", "changelog.md", "CHANGES.md", "HISTORY.md"]);
  const changelogRaw = changelogPath ? readIf(changelogPath) : null;
  const licensePath = locate(repoDir, ["LICENSE", "LICENSE.md", "LICENSE.txt", "license", "LICENCE"]);

  const { preamble, sections } = parseMarkdownSections(readmeRaw ?? "");

  // Project name: prefer the README H1 (human title), fall back to package.json name.
  const h1 = sections.find((s) => s.level === 1) ?? null;
  const titleFromReadme = h1 ? inlineToText(h1.title) : null;
  const name = titleFromReadme || (pkg && typeof pkg.name === "string" ? pkg.name : null);

  // Tagline / value prop: package.json "description", else README preamble or the H1's body.
  const descFromPkg = pkg && typeof pkg.description === "string" ? pkg.description.trim() : "";
  const descFromReadme = firstParagraph(h1 ? h1.body : preamble) || firstParagraph(preamble);
  const tagline = descFromPkg || descFromReadme || null;

  // Install snippet: a section literally titled Install/Installation/Getting Started/Usage,
  // first fenced block; else the first fenced block anywhere in the README.
  const installSec =
    findSection(sections, ["install", "installation", "getting started", "quick start", "quickstart", "usage"]) ?? null;
  const installSnippet =
    (installSec && firstCodeBlock(installSec.body)) ||
    firstCodeBlock(sections.map((s) => s.body).join("\n\n")) ||
    null;

  const repoUrl = normalizeRepoUrl(pkg);

  return {
    repoDir,
    name, // string | null
    tagline, // string | null  (the value prop, verbatim from inputs)
    version: pkg && typeof pkg.version === "string" ? pkg.version : null,
    license: (pkg && typeof pkg.license === "string" ? pkg.license : null) || (licensePath ? "see LICENSE" : null),
    keywords: pkg && Array.isArray(pkg.keywords) ? pkg.keywords.filter((k) => typeof k === "string") : [],
    bin: pkg && pkg.bin ? Object.keys(typeof pkg.bin === "string" ? { [pkg.name ?? "cli"]: pkg.bin } : pkg.bin) : [],
    repoUrl, // string | null
    homepage: pkg && typeof pkg.homepage === "string" ? pkg.homepage : null,
    installSnippet, // string | null  (verbatim from README)
    readme: {
      present: readmeRaw != null,
      path: readmePath,
      preamble,
      sections, // [Section]
    },
    changelog: {
      present: changelogRaw != null,
      path: changelogPath,
      releases: parseChangelog(changelogRaw), // [] if absent — never fabricated
    },
    licensePath,
    pkgPresent: pkg != null,
    pkgError,
    // The honest gate: is there enough real input to generate anything truthful?
    hasEnoughInput: Boolean(name || tagline || readmeRaw),
  };
}

/** Derive a clean https repo URL from package.json `repository`, if present. */
function normalizeRepoUrl(pkg) {
  if (!pkg || !pkg.repository) return null;
  let r = pkg.repository;
  if (typeof r === "object") r = r.url || "";
  if (typeof r !== "string" || !r) return null;
  r = r.replace(/^git\+/, "").replace(/\.git$/, "").replace(/^git@github\.com:/, "https://github.com/");
  if (/^[\w.-]+\/[\w.-]+$/.test(r)) r = "https://github.com/" + r; // "owner/repo" shorthand
  return r;
}
