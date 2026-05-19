# PUBLISH — indie-loop-runner-oss / loopkit (Allen-only owner gates)

Built & independently reviewed: real Node 20 command-line tool, 66 tests green from a clean install (no-network, gen-checklist, determinism, gen-landing, and repo-read tests all pass), zero outside code dependencies, no AI, no network, no usage tracking, and by design no way to post anything — it only writes DRAFT files. **AI never does the steps below — they are identity/publish, only you.**

## Gate 1 — Publish the free CLI (drives adoption; $0 cost)

1. Create a **public GitHub repo** under your account/org (e.g. `<owner>/loopkit`).
2. In `products/indie-loop-runner-oss/package.json`: set `"private": false` (required before `npm publish`; the `npx` path works regardless, but the registry refuses while private).
3. Replace every `<OWNER>` placeholder in `README.md` with your real GitHub owner handle.
4. Push the `products/indie-loop-runner-oss/` contents to that repo root; tag a release (`v0` + a SHA-pinned tag); create a GitHub Release.
5. Create label **`loopkit-feedback`** in that repo (the primary channel where real user reports come in, stored word-for-word, for this bet).
6. Publish to npm for true `npx @allenwu06/loopkit` support: `npm publish --access public`.

→ After this, solo devs can `npx @allenwu06/loopkit landing` / `npx @allenwu06/loopkit launch` after shipping an MVP. **This is the real signal start.**

### No GitHub Action for this product

loopkit has no `action.yml` — it is a local post-ship scaffolding CLI, not a CI step. The GitHub Marketplace step does not apply. Skip it.

### npm name availability note

The package is published as `@allenwu06/loopkit` (npm scope = npm username `allenwu06`). Verify at <https://www.npmjs.com/package/@allenwu06/loopkit> before publishing. Users run `npx @allenwu06/loopkit`.

## Gate 2 — payment account (only if/when monetizing; the revenue gate)

**Free launch needs ZERO payment setup.** The free CLI collects $0 by design. A paid tier (e.g. hosted traction dashboards, team distribution checklists) would need a **merchant-of-record account in your name** (MoR — a service like Paddle / Lemon Squeezy / Polar that sells on your behalf and handles tax). No payment code exists in this product — that is a deliberate later layer.

## Budget note

Free CLI = no hosting cost. Any paid hosted tier = real spend; ratify before committing.

## What stays automated (not you)

Building, tests, reviews, feedback collection — all AI, feedback-paced. You: the gates above + reading RATIFY packets + pressing KILL/SCALE.
