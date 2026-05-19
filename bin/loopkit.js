#!/usr/bin/env node
/**
 * bin/loopkit.js — the CLI entrypoint (Node ≥ 20, ZERO runtime deps).
 *
 * All impure stuff lives here: arg parsing, reading the user's repo files,
 * writing generated artifacts to disk, stdout, exit code. The generators in
 * src/ are pure, deterministic transforms.
 *
 * Behaviour contract:
 *   exit 0  — the command ran and produced its artifact(s).
 *   exit 1  — nothing usable to generate (e.g. no README and no package.json,
 *             or invalid package.json) — loopkit refuses to invent inputs.
 *   exit 2  — usage error (unknown command / bad args).
 *
 * NETWORK: this file performs NO network I/O. It opens no socket, makes no
 * fetch, resolves no host. The only I/O is reading files under --repo and
 * writing files under --out. There is intentionally nothing here that could
 * phone home — see test/no-network.test.js which asserts this statically
 * across the whole src/ + bin/ tree.
 *
 * MONEY: loopkit emits a payments INTEGRATION SCAFFOLD (docs + TODOs). It
 * contains zero payment code and never touches a key or a charge. By design.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { readRepo } from "../src/repo-read.js";
import { generateLanding } from "../src/gen-landing.js";
import { generateLaunch } from "../src/gen-launch.js";
import { generateChecklist, generatePaymentsIntegrationDoc } from "../src/gen-checklist.js";
import { addEntry, summarize, emptyLog } from "../src/track.js";

const VERSION = "0.1.0";

const HELP = `loopkit ${VERSION} — the mechanical half of "I shipped an MVP, now what?"

  loopkit scaffolds the distribution + monetization loop from YOUR OWN repo.
  It does the boilerplate. It does NOT do taste, judgment, posting, or growth
  — those are yours, by design, and that honesty is the whole point.

USAGE
  npx loopkit <command> [--repo DIR] [--out DIR]

COMMANDS
  landing     Generate a static, dependency-free landing page from your
              README/package.json. A real file you deploy — loopkit does not.

  launch      Generate launch-post DRAFTS (Show HN, a forum/Reddit post, a
              changelog→announcement) FROM your README/CHANGELOG. Clearly
              stamped DRAFT. You edit and YOU post — loopkit never posts.

  checklist   Emit the distribution + monetization checklist, plus a payments
              integration SCAFFOLD (docs + TODOs you wire). Zero payment code.

  track       A plaintext, local-only traction log. You record the numbers;
              loopkit shows deltas. No telemetry, no account, no phone-home.
                loopkit track add <metric> <value> [note...]
                loopkit track            (print the summary)

  help        Show this.

OPTIONS
  --repo DIR  The repo to read (default: current directory).
  --out DIR   Where to write generated files (default: ./loopkit-out, except
              'track' which defaults to ./loopkit-traction.tsv).
  --stdout    Print to stdout instead of writing files (landing/launch/
              checklist). Useful for piping / inspection.
  --version   Print version.

loopkit invents nothing. Every artifact is a deterministic transform of bytes
already in your repo, with the parts only a human can do left as visible
[fill this in] placeholders. No LLM. No network. MIT licensed.
`;

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--repo") args.repo = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--stdout") args.stdout = true;
    else if (a === "--version" || a === "-v") args.version = true;
    else if (a === "--help" || a === "-h") args.help = true;
    else args._.push(a);
  }
  return args;
}

function die(msg, code) {
  process.stderr.write(msg.endsWith("\n") ? msg : msg + "\n");
  process.exit(code);
}

function ensureDir(d) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

function writeArtifact(outDir, rel, content, useStdout, label) {
  if (useStdout) {
    process.stdout.write(`\n===== ${label || rel} =====\n`);
    process.stdout.write(content);
    return null;
  }
  ensureDir(outDir);
  const p = join(outDir, rel);
  ensureDir(dirname(p));
  writeFileSync(p, content, "utf8");
  return p;
}

function loadModelOrDie(repoDir) {
  if (!existsSync(repoDir)) die(`loopkit: --repo path does not exist: ${repoDir}`, 1);
  const model = readRepo(repoDir);
  if (model.pkgError) {
    die(
      `loopkit: ${model.pkgError}\nloopkit will not guess your project's identity from a broken package.json. Fix it and re-run.`,
      1,
    );
  }
  if (!model.hasEnoughInput) {
    die(
      `loopkit: found neither a usable README nor a package.json name/description in '${repoDir}'.\n` +
        `There is nothing truthful to generate from, and loopkit will NOT invent your project's value\n` +
        `proposition. Add a README.md (or a package.json with "name"/"description") and re-run.`,
      1,
    );
  }
  return model;
}

function cmdLanding(args) {
  const repoDir = resolve(args.repo || process.cwd());
  const model = loadModelOrDie(repoDir);
  const html = generateLanding(model);
  const outDir = resolve(args.out || join(process.cwd(), "loopkit-out"));
  const p = writeArtifact(outDir, "index.html", html, args.stdout, "landing page (index.html)");
  if (!args.stdout) {
    process.stdout.write(`loopkit landing → ${p}\n`);
    process.stdout.write(
      `  Static, dependency-free, no JS, no trackers. Open it, edit any [FILL THIS IN] slots,\n` +
        `  then deploy it wherever you host static files. loopkit did NOT deploy it.\n`,
    );
  }
  process.exit(0);
}

function cmdLaunch(args) {
  const repoDir = resolve(args.repo || process.cwd());
  const model = loadModelOrDie(repoDir);
  const { files, meta } = generateLaunch(model);
  const outDir = resolve(args.out || join(process.cwd(), "loopkit-out"));
  const written = [];
  for (const [rel, content] of Object.entries(files)) {
    const p = writeArtifact(join(outDir, "launch"), rel, content, args.stdout, rel);
    if (p) written.push(p);
  }
  if (!args.stdout) {
    process.stdout.write(`loopkit launch → ${written.length} DRAFTS in ${join(outDir, "launch")}\n`);
    for (const p of written) process.stdout.write(`  ${p}\n`);
    process.stdout.write(
      `\n  These are DRAFTS built ONLY from your README/CHANGELOG. loopkit wrote no claim of its\n` +
        `  own and will NOT post them. Read every line, cut anything not true yet, add YOUR voice\n` +
        `  to the [FILL THIS IN] slots, then post it yourself.\n`,
    );
    if (meta.hnTitleLen > 80) {
      process.stdout.write(
        `\n  Heads up: the drafted Show HN title is ${meta.hnTitleLen} chars — over HN's 80-char limit.\n` +
          `  Shorten it yourself; loopkit will not truncate your own words for you.\n`,
      );
    }
  }
  process.exit(0);
}

function cmdChecklist(args) {
  const repoDir = resolve(args.repo || process.cwd());
  const model = loadModelOrDie(repoDir);
  const checklist = generateChecklist(model);
  const payments = generatePaymentsIntegrationDoc(model);
  const outDir = resolve(args.out || join(process.cwd(), "loopkit-out"));
  const p1 = writeArtifact(outDir, "DISTRIBUTION-CHECKLIST.md", checklist, args.stdout, "DISTRIBUTION-CHECKLIST.md");
  const p2 = writeArtifact(
    join(outDir, "payments"),
    "INTEGRATION.md",
    payments,
    args.stdout,
    "payments/INTEGRATION.md (scaffold — zero payment code)",
  );
  if (!args.stdout) {
    process.stdout.write(`loopkit checklist →\n  ${p1}\n  ${p2}\n`);
    process.stdout.write(
      `\n  Every box is something only YOU can do (write, judge, click, sign up). loopkit checked\n` +
        `  nothing off and the payments file is documentation + TODOs only — zero payment code,\n` +
        `  no keys, no money path. You wire payments yourself, with your processor's own SDK.\n`,
    );
  }
  process.exit(0);
}

function cmdTrack(args) {
  const sub = args._[1];
  const file = resolve(args.out || join(process.cwd(), "loopkit-traction.tsv"));

  if (sub === "add") {
    const metric = args._[2];
    const value = args._[3];
    const note = args._.slice(4).join(" ");
    if (metric == null || value == null) {
      die(
        `usage: loopkit track add <metric> <value> [note...]\n  e.g. loopkit track add stars 42 "morning after Show HN"`,
        2,
      );
    }
    const existing = existsSync(file) ? readFileSync(file, "utf8") : "";
    // The timestamp is the ONE bit of nondeterminism, isolated to the CLI
    // boundary and never inside a pure generator. It is a local clock read,
    // not a network call.
    const ts = new Date().toISOString();
    let next;
    try {
      next = addEntry(existing, ts, metric, value, note);
    } catch (e) {
      die(`loopkit track: ${e.message}`, 2);
    }
    writeFileSync(file, next, "utf8");
    process.stdout.write(`recorded: ${metric}=${value}${note ? ` (${note})` : ""} @ ${ts}\n→ ${file}\n`);
    const { text } = summarize(next);
    process.stdout.write("\n" + text);
    process.exit(0);
  }

  // default: summarize (creating an empty, header-only log if none exists)
  if (sub && sub !== "summary" && sub !== "show") {
    die(`loopkit track: unknown subcommand '${sub}'. Use:\n  loopkit track add <metric> <value> [note]\n  loopkit track`, 2);
  }
  if (!existsSync(file)) {
    writeFileSync(file, emptyLog(), "utf8");
    process.stdout.write(`loopkit track: created an empty traction log at ${file}\n\n`);
  }
  const { text } = summarize(readFileSync(file, "utf8"));
  process.stdout.write(text);
  process.stdout.write(`\n(log file: ${file} — plaintext, local-only, commit it to your own git)\n`);
  process.exit(0);
}

function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);

  if (args.version) {
    process.stdout.write(VERSION + "\n");
    process.exit(0);
  }
  const cmd = args._[0];
  if (!cmd || cmd === "help" || args.help) {
    process.stdout.write(HELP);
    process.exit(cmd === "help" || args.help ? 0 : 2);
  }

  switch (cmd) {
    case "landing":
      return cmdLanding(args);
    case "launch":
      return cmdLaunch(args);
    case "checklist":
      return cmdChecklist(args);
    case "track":
      return cmdTrack(args);
    default:
      die(`loopkit: unknown command '${cmd}'. Run \`loopkit help\`.`, 2);
  }
}

main();

// Exported only so the test suite can drive commands in-process without a
// subprocess. The module still self-executes when run as a binary.
export { parseArgs };
