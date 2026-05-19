# loopkit

**You shipped the thing. This does the boring, repetitive launch paperwork —
and only that.**

You just shipped a first version of a product (an MVP — a "minimum viable
product", the smallest thing worth releasing). Now you have to find users, and
most of that time goes to rebuilding the same checklist from memory every
time: *what goes in a "Show HN" post (the Hacker News launch post) again?
where does the landing-page copy come from? how do I wire up a payment
processor without it tangling into my code? am I actually growing?*

`loopkit` does that mechanical busywork — and **nothing else** — by
transforming **your own repo's files** the same way every time:

```bash
npx @allenwu06/loopkit landing      # a real static landing page from your README
npx @allenwu06/loopkit launch       # Show HN / forum / changelog post DRAFTS
npx @allenwu06/loopkit checklist    # the distribution + payments wiring checklist
npx @allenwu06/loopkit track        # a plaintext, local-only traction log
```

No LLM. No network. No telemetry. No account. Zero runtime dependencies. MIT.

---

## What loopkit does NOT do — by design, and this is the whole point

Read this first. It is the reason this tool exists and the reason to trust it.

- **It does not do taste.** It will not tell you if your value prop is any
  good, if your name is bad, or if the thing is worth launching.
- **It does not do distribution judgment.** It will not pick your channel,
  your timing, your audience, or your community. Those decisions *are* the
  hard part and no tool can do them for you. loopkit just stops you
  forgetting the steps.
- **It does not post anything, ever.** It writes DRAFT files to your disk.
  *You* read them, cut what isn't true yet, add your voice, and *you* hit
  submit. There is no posting code in this repo and there never will be.
- **It does not write a single claim of its own.** Every word in every
  generated artifact is either copied from your own README/CHANGELOG or is a
  loud `[loopkit: FILL THIS IN — …]` placeholder. If your repo doesn't
  substantiate a claim, loopkit will not invent one. It would rather emit an
  ugly placeholder than a plausible lie.
- **It contains zero payment code.** `loopkit checklist` generates a payments
  *integration scaffold* — documentation, the wiring steps, and `TODO(you)`
  markers. It imports no payment SDK, handles no key, processes no money. You
  wire that yourself, with your processor's own SDK, behind your own keys.
- **It is not growth magic.** There is no AI, no autopilot, no "we'll get you
  users". A tool that claimed that would be lying, and you should not star
  it.

> loopkit is the *boilerplate-removal* of the distribution loop, not the
> distribution. The 80% that is mechanical (scaffolding, checklists,
> templates, restating your own words, tracking numbers you recorded) it
> does completely. The 20% that is taste, judgment, voice, and the actual
> clicking of "post" — it deliberately leaves to you, loudly. Every
> generated file says this about itself, on its own.

These guarantees are not just prose: they are **statically asserted by the
test suite** across the entire shipped tree (`test/no-network.test.js`,
`test/gen-checklist.test.js`). No network module is imported, no `fetch`
exists, no payment SDK is present, no LLM is wired. The honesty is the moat.

---

## The four commands

### `loopkit landing`

Generates one **static, dependency-free `index.html`** from your
`README.md` + `package.json`:

- Title and tagline from your `package.json` `name`/`description` (or your
  README's `#` title and intro).
- Install snippet lifted **verbatim** from the first fenced code block under
  an Install/Usage heading.
- "Why / Features / How it works / Limitations" sections, each the first
  paragraph of the matching README section, **verbatim** (markdown stripped
  to text — never paraphrased).
- A GitHub button only if `package.json` has a `repository`.

The file has **no JavaScript, no webfont request, no CDN, no tracker, no
build step**. `scp` it to any static host and it works. loopkit does not
deploy it — deployment is yours.

```bash
npx @allenwu06/loopkit landing                     # → ./loopkit-out/index.html
npx @allenwu06/loopkit landing --repo . --stdout   # print it instead
```

Missing a tagline or install snippet? You get a visible
`[loopkit: FILL THIS IN — …]` in the page (you'll see it in the browser
tab), never a fabricated sentence.

### `loopkit launch`

Generates **three launch-post DRAFTS** from your `README.md` + `CHANGELOG.md`:

| file | what it is |
|------|------------|
| `show-hn.draft.md` | A Show HN title (with a length check against HN's 80-char limit) + a first-comment draft built from your tagline, your README feature bullets, and your own "what it does NOT do" section. The personal *why you built this* and *your ask* are left as explicit placeholders — loopkit cannot and will not write your story. |
| `forum-post.draft.md` | A generic subreddit / Lobsters / forum post. loopkit will not choose the community — wrong-community posting is the fastest way to get flagged, and that is a judgment call. |
| `changelog-announcement.draft.md` | A short + a long announcement built **only** from the top real release in your `CHANGELOG.md`. No changelog → it says so and emits a placeholder; it does not invent a release. |

Every draft opens with a DRAFT banner, is numbered `DRAFT n/3`, and restates
**only** what your repo already says. loopkit adds no adjective you didn't
write. It never posts.

```bash
npx @allenwu06/loopkit launch          # → ./loopkit-out/launch/*.draft.md
```

### `loopkit checklist`

Emits the mechanical distribution + monetization checklist a solo shipper
otherwise rebuilds from memory every time:

- `DISTRIBUTION-CHECKLIST.md` — the literal submission steps for Show HN
  (linking the official rules), Product Hunt, Reddit/Lobsters, owned
  channels, and a Merchant-of-Record monetization section. Every item is an
  **unchecked** box for a thing only *you* can do — loopkit checks nothing
  off and cannot.
- `payments/INTEGRATION.md` — a Merchant-of-Record (Paddle / Lemon Squeezy /
  Polar) **integration scaffold**: the wiring steps, where keys go (env
  vars, never committed — loopkit will not hold a key), the webhook *shape*
  and its failure modes, and `TODO(you)` where your code goes. **It contains
  no runnable payment code, no SDK import, no endpoint.** A generic "just
  works" payment handler would be a security liability — signature
  verification must be *your* code, written on purpose.

```bash
npx @allenwu06/loopkit checklist       # → ./loopkit-out/{DISTRIBUTION-CHECKLIST.md,payments/INTEGRATION.md}
```

### `loopkit track`

A **plaintext, local-only, git-friendly** traction log. You record the
numbers you observed; loopkit computes deltas and a summary. That is the
entire feature.

```bash
npx @allenwu06/loopkit track add stars 12 "morning after Show HN"
npx @allenwu06/loopkit track add stars 47 "HN front page"
npx @allenwu06/loopkit track
# stars  47  [+35 total since 2026-03-01]  last step +35 (since …)
```

The store is a tab-separated file you keep in your own git — readable,
diff-able, no lock-in. **loopkit never fetches a number for you** (it cannot
— there is no network client). A tracker that auto-scraped your star count
would be both the "magic" this tool refuses and a telemetry surface. This
stays a notebook, on purpose. No phone-home, no account, no analytics.

---

## Install / run

Requires Node ≥ 20. Zero runtime dependencies.

```bash
npx @allenwu06/loopkit help
# or, from a clone:
node bin/loopkit.js help
```

Common flags: `--repo DIR` (default: cwd), `--out DIR`, `--stdout`,
`--version`.

## How it stays honest (the design)

Everything downstream is a **pure function** of one normalized model
(`src/repo-read.js`), which is itself a pure function of your
`package.json` / `README.md` / `CHANGELOG.md`. There is no clock or RNG
inside a generator, so the same repo produces **byte-identical** output every
time (asserted by the determinism tests). The only nondeterministic thing in
the whole tool is the timestamp `loopkit track` records — a local clock read,
isolated to the CLI boundary, never a network call.

When an input is genuinely absent, loopkit emits a deliberately ugly
`[loopkit: FILL THIS IN — …]` placeholder rather than a fabrication. That
placeholder is impossible to mistake for real copy and impossible to ship by
accident — which is the point.

## Honest limitations

- It reads `package.json`, `README.md`, and `CHANGELOG.md`. It does not parse
  `pyproject.toml`, `Cargo.toml`, `go.mod`, etc. yet — if your repo is not
  Node-ish you get the README-driven half (still useful) and placeholders for
  the package metadata. (PRs / issues welcome — see below.)
- The landing page is intentionally plain (system fonts, no JS). It is a
  *correct, deployable scaffold*, not a designed site. Design is taste;
  loopkit does not do taste.
- It restates your README/CHANGELOG. If those are thin, the drafts are thin —
  honestly thin, with placeholders, which is the correct signal that the
  *input* needs work before you launch. loopkit will not paper over a thin
  README with invented enthusiasm.
- The checklist encodes today's platform conventions (Show HN, PH, etc.).
  Those platforms change; the checklist is a strong default, not a substitute
  for reading each platform's current rules (which it tells you to do).
- It is single-purpose on purpose. It will not become a CRM, an email tool,
  an analytics dashboard, or an "AI growth assistant". Those either need
  taste/judgment or a network/account, and both are out of scope by design.

## Feedback

Misfires and "this scaffold was wrong/misleading" reports are the single most
valuable input — see [`FEEDBACK.md`](FEEDBACK.md). The zero-friction path:
open an issue and add the **`loopkit-feedback`** label. Whatever you write is
read **exactly as written** — not summarized, not paraphrased.

## License

MIT — see [`LICENSE`](LICENSE).
