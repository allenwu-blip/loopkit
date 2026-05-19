# Reporting a misfire

loopkit's one job is to do the mechanical loop **without ever overclaiming**.
The most valuable thing you can tell us is when it crossed that line:

- **It invented something.** A generated draft/landing/checklist contained a
  claim, number, benefit, or adjective that is **not** in your
  README/CHANGELOG/package.json. This is the most serious report — the entire
  product is "it only restates your own words", so a fabrication is the
  failure this tool exists to prevent.
- **A placeholder shipped silently / was missable.** A
  `[loopkit: FILL THIS IN — …]` slot was not obvious enough, or loopkit
  emitted real-looking copy where it should have emitted a placeholder.
- **It overstepped its boundary.** It read as if it would post for you, or
  judge taste/distribution for you, or as if it were "growth magic".
- **The payments scaffold contained runnable payment code, a key, or an
  endpoint.** It must be docs + `TODO(you)` only. If any actual money-handling
  code slipped in, that is a serious report.
- **Non-determinism.** The same repo produced different output across runs.
- **A wrong/misleading mechanical step** in the checklist (an out-of-date
  platform rule, a broken official link, a step that is just wrong).

## The one-line, zero-friction way

**Add the `loopkit-feedback` label** to an issue (open one and apply it).
Maintainers watch that label. If you adopt loopkit in your own org, create
that label once so your team has a consistent path.

## The structured way

Open a **"loopkit misfire report"** issue
(`.github/ISSUE_TEMPLATE/misfire.yml`). It asks which command, the misfire
type, and what happened in your own words.

## The verbatim guarantee

Whatever you write is **captured and read exactly as written** — no
summarization, no paraphrasing, no "cleaning up". Tuning a tool whose entire
promise is "no paraphrasing of your words" on paraphrased reports would be
self-defeating, so the raw text is the artifact.

## What helps most

- **The exact generated artifact** (paste the relevant lines of the
  `.draft.md` / `index.html` / checklist).
- **The relevant input** — the smallest slice of your README/CHANGELOG/
  package.json that reproduces it. loopkit is a pure transform, so input +
  command = a deterministic repro.
- For an **invented-claim** report: quote the generated line and show that
  the claim is **not** anywhere in your inputs. That is the bug.
- Your invocation (`loopkit launch --repo … --stdout`, version) if
  non-default.
- Keep secrets out: loopkit never reads keys, please don't paste any here.
