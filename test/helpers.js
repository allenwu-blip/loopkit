import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = resolve(fileURLToPath(import.meta.url), "..");
export const BIN = resolve(HERE, "..", "bin", "loopkit.js");
export const FIXTURES = resolve(HERE, "fixtures");
export const SAMPLE_REPO = join(FIXTURES, "sample-repo");
export const THIN_REPO = join(FIXTURES, "thin-repo");
export const EMPTY_REPO = join(FIXTURES, "empty-repo");
export const BROKEN_PKG_REPO = join(FIXTURES, "broken-pkg-repo");

/**
 * Run the loopkit CLI as a real subprocess. NO network, NO env beyond a
 * minimal PATH. Returns {status, stdout, stderr}. We capture instead of throw
 * so tests can assert on non-zero exits.
 */
export function runCli(cliArgs, opts = {}) {
  try {
    const stdout = execFileSync(process.execPath, [BIN, ...cliArgs], {
      cwd: opts.cwd || FIXTURES,
      encoding: "utf8",
      // Deliberately minimal env: prove no hidden network/key dependency.
      env: { PATH: process.env.PATH || "/usr/bin:/bin" },
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 12000,
    });
    return { status: 0, stdout, stderr: "" };
  } catch (e) {
    return {
      status: typeof e.status === "number" ? e.status : 1,
      stdout: e.stdout ? e.stdout.toString() : "",
      stderr: e.stderr ? e.stderr.toString() : String(e.message || ""),
    };
  }
}

/** A throwaway temp dir for --out, auto-cleaned by the caller. */
export function tmpOut() {
  const d = mkdtempSync(join(tmpdir(), "loopkit-test-"));
  return {
    dir: d,
    cleanup() {
      try {
        rmSync(d, { recursive: true, force: true });
      } catch {
        /* best effort */
      }
    },
  };
}
