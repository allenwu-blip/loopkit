/**
 * src/gen-checklist.js — `loopkit checklist`
 *
 * Emit the mechanical distribution + monetization checklist a solo shipper
 * otherwise reconstructs from memory every time: the literal submission steps
 * for Show HN / Product Hunt / Reddit / Lobsters, and a Merchant-of-Record
 * payments INTEGRATION SCAFFOLD — i.e. the wiring steps and a documented
 * placeholder, NOT money-processing code.
 *
 * Load-bearing rule (asserted by the test suite): this module contains ZERO
 * payment code. It does not import, call, or template any Stripe/Paddle/Lemon
 * Squeezy/Polar SDK. It writes a checklist and a "here is where YOU wire it"
 * scaffold with TODOs. loopkit never touches money — exactly like the
 * operation that built it parks anything money-adjacent for a human.
 *
 * The checklist is mostly static (these steps don't depend on the repo) but
 * the few project-specific slots (name, repo URL) are filled from the model
 * or shown as a visible placeholder. Deterministic: no clock, no RNG.
 */

import { draftBannerComment, placeholder, present } from "./stamp.js";

function nm(model) {
  return present(model.name) ? model.name : placeholder("project name");
}
function repo(model) {
  return present(model.repoUrl) ? model.repoUrl : placeholder("your public repo URL");
}

export function generateChecklist(model) {
  const name = nm(model);
  const url = repo(model);
  const L = [];
  L.push(draftBannerComment("CHECKLIST"));
  L.push("#");
  L.push(`# Distribution + monetization checklist for: ${name}`);
  L.push("#");
  L.push("# This is the MECHANICAL loop only. Every box is a thing only YOU can");
  L.push("# actually do (write the words, judge the timing, click submit, sign up");
  L.push("# for the payment processor). loopkit checked NOTHING off for you and");
  L.push("# cannot — it just stops you forgetting the steps.");
  L.push("");

  L.push("## 0. Pre-launch hygiene (do these before you tell anyone)");
  L.push("");
  L.push("- [ ] README leads with the value prop in ONE sentence (a stranger gets it in 5s)");
  L.push("- [ ] README has an honest 'what this does NOT do' / Limitations section");
  L.push("- [ ] LICENSE file present and correct" + (present(model.license) ? ` (package.json says: ${model.license})` : " (loopkit found none — add one)"));
  L.push("- [ ] `npm ci && npm test` (or your equivalent) is green from a clean clone");
  L.push("- [ ] A new visitor can install + run it from the README alone, no tribal knowledge");
  L.push("- [ ] Run `loopkit landing` and actually deploy that page somewhere static");
  L.push("- [ ] Run `loopkit launch` and EDIT the drafts — they are scaffolds, not posts");
  L.push("- [ ] Decide your ONE primary launch channel; do not spray all of them at once");
  L.push("");

  L.push("## 1. Show HN  (https://news.ycombinator.com/showhn.html)");
  L.push("");
  L.push("- [ ] Read the official Show HN rules linked above (genuinely, once)");
  L.push("- [ ] You have a working thing people can try right now (not a waitlist/landing-only)");
  L.push(`- [ ] Submission URL is the repo or a real demo: ${url}`);
  L.push("- [ ] Title ≤ 80 chars, starts with 'Show HN:', no hype words, no emoji");
  L.push("- [ ] Post yourself as the author and add a substantive first comment immediately");
  L.push("- [ ] Posted on a weekday, US morning-ish; you are free for the next ~4h to reply");
  L.push("- [ ] You will reply to EVERY comment, including critical ones, without defensiveness");
  L.push("- [ ] You did NOT ask friends to upvote (HN detects rings; it kills the post and the account)");
  L.push("");

  L.push("## 2. Product Hunt  (optional — only if it fits)");
  L.push("");
  L.push("- [ ] This is actually a 'product' a PH audience cares about (many OSS tools are not — that's fine)");
  L.push("- [ ] Gallery images / a short GIF of it working (PH is visual; loopkit does not make these)");
  L.push("- [ ] First comment from you: what it is, why, the honest limitations");
  L.push("- [ ] Launch 12:01am Pacific; you are available all day to engage");
  L.push("- [ ] Maker account is yours and real; no fake hunter, no vote begging");
  L.push("");

  L.push("## 3. Reddit / Lobsters / niche forums");
  L.push("");
  L.push("- [ ] You picked ONE subreddit/forum where this is on-topic AND where you already participate");
  L.push("- [ ] You read THAT community's self-promotion rule (each one differs; many ban link-drops)");
  L.push("- [ ] Post is written for that community, not a copy-paste of the HN post");
  L.push("- [ ] You are replying as a person, disclosing you are the author");
  L.push("- [ ] Lobsters specifically: you have an invite and it is genuinely on-topic (it is strict)");
  L.push("");

  L.push("## 4. Owned channels (slow, compounding, no gatekeeper)");
  L.push("");
  L.push("- [ ] A short post on your own blog/site that will still be there in a year");
  L.push("- [ ] One honest post on your usual social account (no thread-bait, no fake urgency)");
  L.push("- [ ] Submitted to relevant awesome-lists / directories where it legitimately belongs");
  L.push("- [ ] CHANGELOG.md kept current so `loopkit launch` can generate real announcements later");
  L.push("");

  L.push("## 5. Monetization — Merchant-of-Record (MoR) wiring");
  L.push("#");
  L.push("# A MoR (Paddle, Lemon Squeezy, Polar, …) is the seller of record: THEY");
  L.push("# handle global sales tax/VAT, chargebacks and the card data, so a solo");
  L.push("# dev does not. loopkit does NOT process payments and ships ZERO payment");
  L.push("# code. The steps below are wiring YOU do in YOUR app, with the");
  L.push("# processor's own SDK, behind your own keys. See payments/INTEGRATION.md");
  L.push("# (also generated by `loopkit checklist`) for the scaffold.");
  L.push("#");
  L.push("");
  L.push("- [ ] Decided IF you are charging at all (pure-OSS / reputation is a valid answer — many great projects never monetize)");
  L.push("- [ ] Chosen ONE MoR and read its docs + payout/eligibility terms yourself");
  L.push("- [ ] Created the account, the product, and a price IN the MoR dashboard (not in code)");
  L.push("- [ ] Generated API keys; stored them as ENV VARS / secrets — never committed (loopkit will not handle keys)");
  L.push("- [ ] Added a checkout link/button (hosted checkout is simplest; least code you own)");
  L.push("- [ ] Implemented + verified the webhook that grants access on `order/subscription` events");
  L.push("- [ ] Verified webhook SIGNATURES (this is the security-critical part — your code, your responsibility)");
  L.push("- [ ] Tested the FULL flow in the processor's sandbox/test mode end to end");
  L.push("- [ ] A real refund/cancel path exists and you have tested it");
  L.push("- [ ] Going live (real money) is a deliberate, separate step you take by hand");
  L.push("");
  L.push("# ── End of checklist. loopkit asserts nothing here is done. ─────────────");
  L.push("");

  return L.join("\n");
}

/**
 * The payments INTEGRATION SCAFFOLD doc. This is documentation + a TODO
 * skeleton. It deliberately contains NO runnable payment code, NO SDK import,
 * NO key, NO endpoint. It tells the user exactly where THEY wire it and what
 * not to get wrong, and points at each MoR's own docs.
 */
export function generatePaymentsIntegrationDoc(model) {
  const name = nm(model);
  return `# Payments integration scaffold — ${name}

> Generated by \`loopkit checklist\`. This file is **documentation and a
> wiring checklist only**. loopkit ships **zero payment code**, imports no
> payment SDK, and never handles a key or a charge. Everything below is work
> **you** do, in **your** code, behind **your** keys. That boundary is the
> point: a kit that scaffolds the loop must not be the thing that touches
> money.

## Step 0 — Decide if you are monetizing at all

Pure-OSS for reputation/adoption is a completely valid outcome. Do not bolt
on payments because a checklist had a box. Only continue if you have a real
reason to charge.

## Step 1 — Pick ONE Merchant of Record

A Merchant of Record (MoR) becomes the legal seller, so it handles global
sales tax / VAT, chargebacks, fraud, and card data — not you. Common choices
for solo devs (read each one's *own* current docs and eligibility/payout
terms yourself — they change, and loopkit will not summarize money terms it
cannot keep accurate):

- **Paddle** — https://developer.paddle.com
- **Lemon Squeezy** — https://docs.lemonsqueezy.com
- **Polar** — https://docs.polar.sh

loopkit does not recommend one. The right pick depends on your geography,
pricing model, and payout situation — judgment, not boilerplate.

## Step 2 — Configure the product in the DASHBOARD (no code)

Create the account, the product, and the price **in the MoR's dashboard**.
This intentionally lives outside your codebase.

## Step 3 — Keys as environment variables (NEVER committed)

\`\`\`
# .env  (gitignored — DO NOT COMMIT, loopkit will not generate or hold keys)
MOR_API_KEY=__set_this_yourself__
MOR_WEBHOOK_SECRET=__set_this_yourself__
\`\`\`

## Step 4 — Checkout (least code you own)

Prefer the MoR's **hosted checkout** (a link/overlay). You own the least
code and touch the least money-handling surface. A plain link is enough to
start:

\`\`\`
<!-- TODO(you): replace with the hosted-checkout URL from your MoR dashboard -->
<a href="__YOUR_MOR_HOSTED_CHECKOUT_URL__">Buy ${name}</a>
\`\`\`

## Step 5 — Webhook to grant access (THIS is your code)

This is the only server logic you must own. loopkit gives you the **shape**
and the failure modes — not an implementation, because a generic payment
handler that "just works" is exactly the unsafe thing this tool refuses to
emit.

\`\`\`
// TODO(you): implement in YOUR server, with YOUR MoR's SDK/docs.
// loopkit intentionally provides NO body here.
//
//   1. Receive the POST from the MoR.
//   2. **Verify the signature** using MOR_WEBHOOK_SECRET. If it fails,
//      respond 400 and STOP. (Skipping this lets anyone grant themselves
//      access — it is the single most important line and it must be yours.)
//   3. On a paid "order completed" / "subscription active" event, grant
//      access to the buyer in your own data store (idempotently — the same
//      event can arrive more than once).
//   4. On refund/cancel/chargeback events, revoke access.
//   5. Respond 2xx only after you have durably recorded the change.
\`\`\`

## Step 6 — Test in sandbox, end to end

Use the MoR's **test/sandbox mode**. Drive a full purchase, confirm the
webhook fired, the signature verified, and access was granted. Then drive a
refund and confirm access was revoked.

## Step 7 — Go live deliberately, by hand

Switching to real money is a distinct, manual decision **you** make once
everything above is verified. loopkit does not flip that switch and has no
mechanism to.

---

### What loopkit deliberately did NOT do here

- It did not write your webhook handler (a generic one would be a security
  liability — signature verification must be yours and intentional).
- It did not choose your MoR (that is judgment, not boilerplate).
- It did not generate, store, or read any API key.
- It did not include any payment SDK, endpoint, or live money path.

That is by design. A kit that scaffolds distribution must not be the thing
that handles your customers' money.
`;
}
