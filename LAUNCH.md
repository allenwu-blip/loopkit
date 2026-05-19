# LAUNCH — indie-loop-runner-oss (loopkit)

**DRAFT — operator reviews and posts. Public technical claims are yours to send.**
All claims below are drawn from the reviewed README only. Do not add benchmark
figures, growth statistics, or outcome claims not already in the README.

---

## Show HN title

```
Show HN: loopkit – scaffolds the post-ship distribution loop from your own README, no LLM
```

## Show HN body

```
After you ship a first version of a product, there is a boring, repetitive
layer most solo devs rebuild from memory each time: what goes in a Show HN
(Hacker News launch) post? where does the landing-page copy come from? what is
the payments wiring checklist? am I actually growing?

loopkit does exactly that busywork — and only that — by transforming your own
repo's files the same way every time:

npx @allenwu06/loopkit landing      # a static landing page from your README
npx @allenwu06/loopkit launch       # Show HN / forum / changelog post DRAFTS
npx @allenwu06/loopkit checklist    # distribution + payments wiring checklist
npx @allenwu06/loopkit track        # a plaintext, local-only traction log

Four hard constraints, tested in the test suite:

1. It does not post anything, ever. It writes DRAFT files to your disk. You
   click submit yourself.
2. It does not write a single claim of its own. Every word in every generated
   artifact is either copied verbatim from your README/CHANGELOG or is a
   loud [loopkit: FILL THIS IN] placeholder. If your repo doesn't
   substantiate a claim, loopkit will not invent one.
3. It contains zero payment code. The checklist generates documentation and
   TODO markers; you wire the payment SDK yourself with your own keys.
4. No LLM. No network. No telemetry. No account. Zero runtime dependencies.

These are not just prose — test/no-network.test.js and test/gen-checklist.test.js
statically assert no network module is imported, no fetch exists, no payment
SDK is present.

66 tests green from a clean install. MIT.

GitHub: [link]
```

---

## One-paragraph repo description

```
loopkit scaffolds the post-ship distribution and monetization loop as deterministic
transforms of your own repo: a static landing page from your README, launch-post
DRAFTS (Show HN / forum / changelog), a distribution and payments wiring checklist,
and a plaintext traction tracker. It does the boilerplate; it does not do taste,
judgment, posting, or growth. No LLM, no network, no telemetry, no account, zero
runtime dependencies. MIT license.
```

---

## Honest 2-3 line blurb
(For a pinned issue or README TL;DR)

```
loopkit is the boilerplate-removal half of the distribution loop, not the
distribution itself. It will not choose your channel, timing, or community, and
it will not tell you if your value proposition is any good. Every generated file
says this about itself. A tool that claimed otherwise would be lying.
```

---

## Notes for operator before posting

- Replace `<owner>` and `[link]` placeholders with real values once the repo is public.
- If published to npm before posting, substitute the real `npx @allenwu06/loopkit` invocation.
- Do not add retention statistics, launch-success rates, or growth numbers —
  the README makes no such claims and adding them would be unsubstantiated.
- A terminal screenshot of `loopkit launch` generating a DRAFT file (with the
  [loopkit: FILL THIS IN] placeholders visible) is the most useful visual to
  add before posting — it makes the "does not invent claims" point tangible.
