/**
 * src/gen-launch.js — `loopkit launch`
 *
 * The most honesty-critical generator. It produces launch-post DRAFTS for
 * Show HN, a generic forum/Reddit post, and a changelog→announcement — and
 * the ONLY content it is allowed to put in them is text that already exists
 * in the user's README/CHANGELOG, restated, plus loud placeholders and the
 * DRAFT banner.
 *
 * Hard rules enforced here and asserted by the test suite:
 *   - loopkit writes NO claim of its own. No adjectives it invented, no
 *     "blazing fast", no metric, no benefit it wasn't told. It only echoes
 *     the user's own tagline / README first-lines / changelog bullets.
 *   - Every draft opens with the DRAFT banner and the word DRAFT in the
 *     title line. It is never "ready to post".
 *   - It NEVER posts. It only writes files to disk. There is no network
 *     path in this module (or anywhere in the package).
 *   - Missing input → a visible [fill this in], never a fabricated value.
 *
 * Deterministic: pure function of the model. No clock, no RNG.
 */

import { draftBannerMarkdown, placeholder, present } from "./stamp.js";
import { inlineToText, firstParagraph } from "./repo-read.js";

function bulletsOf(body) {
  return String(body ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^[-*+]\s+\S/.test(l))
    .map((l) => inlineToText(l.replace(/^[-*+]\s+/, "")))
    .filter(Boolean);
}

/**
 * The README's bullet-point selling points, verbatim (markdown stripped).
 * We look at the most "feature-list-like" headings IN PRIORITY ORDER and
 * take the first that ACTUALLY contains bullets — not the first heading that
 * merely name-matches (a "Why" prose section must not shadow a real
 * "Features" list just because it appears earlier in the document). Falls
 * back to the first bulleted list anywhere. Capped, never invented.
 */
function readmeBullets(model, max = 6) {
  const priority = ["features", "what it does", "what you get", "highlights", "why"];
  for (const key of priority) {
    const sec = model.readme.sections.find((s) => {
      const t = s.title.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
      return t === key || t.startsWith(key + " ");
    });
    if (sec) {
      const b = bulletsOf(sec.body);
      if (b.length) return b.slice(0, max);
    }
  }
  // last resort: the first bulleted list found anywhere in the README
  for (const s of model.readme.sections) {
    const b = bulletsOf(s.body);
    if (b.length) return b.slice(0, max);
  }
  return [];
}

/** A short "what it honestly is NOT" line, taken from the user's own limitations section if present. */
function honestNot(model) {
  const sec = model.readme.sections.find((s) => {
    const t = s.title.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    return ["limitations", "what this does not do", "what it does not do", "non goals", "caveats"].some(
      (n) => t === n || t.startsWith(n),
    );
  });
  if (!sec) return null;
  const para = firstParagraph(sec.body);
  return para || null;
}

function nameOrPlaceholder(model) {
  return present(model.name) ? model.name : placeholder("project name");
}
function taglineOrPlaceholder(model) {
  return present(model.tagline)
    ? model.tagline
    : placeholder("one-line value prop (package.json description / README intro)");
}

/**
 * Show HN draft. Title follows the literal Show HN convention. The body is
 * the user's tagline + their own README bullets + their own limitations +
 * placeholders for the parts only a human can write (the personal "why I
 * built this" and the ask). loopkit deliberately leaves those EMPTY rather
 * than fabricate a backstory.
 */
export function generateShowHN(model) {
  const name = nameOrPlaceholder(model);
  const tagline = taglineOrPlaceholder(model);
  const bullets = readmeBullets(model);
  const not = honestNot(model);
  const url = present(model.repoUrl) ? model.repoUrl : placeholder("your repo / landing URL (this is the HN submission URL)");

  const titleCore = present(model.tagline) ? oneLine(model.tagline) : oneLine(name);
  const hnTitle = `Show HN: ${present(model.name) ? model.name + " – " : ""}${titleCore}`;
  const titleLen = hnTitle.length;

  const lines = [];
  lines.push(draftBannerMarkdown());
  lines.push("");
  lines.push(`### DRAFT 1/3 · Show HN`);
  lines.push("");
  lines.push("**Submission URL** (paste into the HN \"url\" field):");
  lines.push("");
  lines.push("    " + url);
  lines.push("");
  lines.push(`**Title** (HN hard-limits the title to 80 chars — this draft is ${titleLen}):`);
  lines.push("");
  lines.push("    " + hnTitle);
  if (titleLen > 80) {
    lines.push("");
    lines.push(`> loopkit note: this title is ${titleLen} chars, OVER HN's 80-char limit. Shorten it yourself before posting — loopkit will not silently truncate your own words.`);
  }
  lines.push("");
  lines.push("**First comment** (HN convention: post this yourself, as the author, right after submitting):");
  lines.push("");
  lines.push("```text");
  lines.push(`${name} — ${tagline}`);
  lines.push("");
  if (bullets.length) {
    lines.push("What it does (from this project's README — edit/trim to taste):");
    for (const b of bullets) lines.push(`- ${b}`);
    lines.push("");
  } else {
    lines.push(placeholder("README bullet points under a Features/Why heading — add them and re-run, or write this paragraph yourself"));
    lines.push("");
  }
  if (not) {
    lines.push(`What it deliberately does NOT do: ${not}`);
    lines.push("");
  } else {
    lines.push(placeholder("an honest 'what this does NOT do' line — HN rewards this; add a Limitations section to your README or write it here yourself"));
    lines.push("");
  }
  lines.push(placeholder("WHY YOU built this / what itch it scratched — 2–3 sentences, in your own voice. loopkit cannot and will not write your story for you; this is the part that earns HN's attention"));
  lines.push("");
  lines.push(placeholder("your ask — feedback? a specific question? — one honest sentence"));
  lines.push("```");
  lines.push("");
  lines.push("---");
  lines.push(
    "_Checklist before you post: (1) you have read every line above and it is all true TODAY, not aspirational; (2) the title is ≤80 chars and not clickbait; (3) you are posting at a sane time for HN (weekday morning US time) — loopkit does not pick the time for you; (4) you will be around for the next few hours to reply. loopkit did none of this judgment; it only assembled your own words._",
  );
  return { title: hnTitle, content: lines.join("\n") + "\n", titleLen };
}

/** A generic forum / subreddit / Lobsters draft — same honesty rules, markdown body. */
export function generateForumPost(model) {
  const name = nameOrPlaceholder(model);
  const tagline = taglineOrPlaceholder(model);
  const bullets = readmeBullets(model);
  const not = honestNot(model);
  const url = present(model.repoUrl) ? model.repoUrl : placeholder("your repo URL");

  const lines = [];
  lines.push(draftBannerMarkdown());
  lines.push("");
  lines.push(`### DRAFT 2/3 · Forum / subreddit / Lobsters post`);
  lines.push("");
  lines.push(
    "> Pick the ONE community where this is genuinely on-topic and where you are already a member. Read its self-promotion rules first. loopkit does not choose the community for you — wrong-community posting is the fastest way to get flagged.",
  );
  lines.push("");
  lines.push(`**Suggested title:** ${present(model.name) ? `${model.name} — ` : ""}${oneLine(tagline)}`);
  lines.push("");
  lines.push("**Body:**");
  lines.push("");
  lines.push("```markdown");
  lines.push(`I built **${name}**: ${tagline}`);
  lines.push("");
  if (bullets.length) {
    for (const b of bullets) lines.push(`- ${b}`);
    lines.push("");
  } else {
    lines.push(placeholder("a few concrete bullets — from your README, or write them"));
    lines.push("");
  }
  if (not) {
    lines.push(`Honest scope — what it does **not** do: ${not}`);
    lines.push("");
  }
  lines.push(`Repo: ${url}`);
  lines.push("");
  lines.push(placeholder("one sentence on what feedback would actually help you — be specific"));
  lines.push("```");
  return { content: lines.join("\n") + "\n" };
}

/**
 * changelog → announcement draft. Built strictly from the TOP release in the
 * user's CHANGELOG.md. If there is no changelog, it says so and emits a
 * placeholder — it does NOT invent a release.
 */
export function generateChangelogAnnouncement(model) {
  const name = nameOrPlaceholder(model);
  const releases = model.changelog.releases;
  const lines = [];
  lines.push(draftBannerMarkdown());
  lines.push("");
  lines.push(`### DRAFT 3/3 · Changelog → announcement`);
  lines.push("");

  if (!model.changelog.present) {
    lines.push("> loopkit found **no CHANGELOG.md** in this repo. There is nothing to announce from, and loopkit will not invent a release. Add a CHANGELOG.md (Keep a Changelog format works well) and re-run `loopkit launch`.");
    lines.push("");
    lines.push("```text");
    lines.push(placeholder("the actual changes you shipped — write a CHANGELOG.md first, then re-run"));
    lines.push("```");
    return { content: lines.join("\n") + "\n" };
  }

  // Use the first NON-Unreleased release if present, else the first entry.
  const rel =
    releases.find((r) => r.version && r.version.toLowerCase() !== "unreleased") || releases[0] || null;

  if (!rel) {
    lines.push("> A CHANGELOG.md exists but loopkit could not parse a release heading (expected `## [x.y.z] - date` or `## x.y.z`). loopkit will not guess. Fix the heading and re-run.");
    lines.push("");
    lines.push("```text");
    lines.push(placeholder("a parseable release section in CHANGELOG.md"));
    lines.push("```");
    return { content: lines.join("\n") + "\n" };
  }

  const ver = rel.version;
  const dateStr = rel.date ? ` (${rel.date})` : "";
  lines.push(`**Short post (Twitter/X, Mastodon, a Discord #announcements):**`);
  lines.push("");
  lines.push("```text");
  lines.push(`${name} ${ver}${dateStr} is out.`);
  lines.push("");
  if (rel.changes.length) {
    for (const c of rel.changes.slice(0, 4)) lines.push(`• ${c}`);
    if (rel.changes.length > 4) lines.push(`• …and ${rel.changes.length - 4} more (full changelog in the repo)`);
  } else {
    lines.push(placeholder(`the bullet points for ${ver} — your CHANGELOG entry for this version has no '- ' bullets`));
  }
  lines.push("");
  lines.push(placeholder("a link to the release / repo — paste it yourself"));
  lines.push("```");
  lines.push("");
  lines.push(`**Longer post (a blog / GitHub Release body):**`);
  lines.push("");
  lines.push("```markdown");
  lines.push(`## ${name} ${ver}${dateStr}`);
  lines.push("");
  if (rel.changes.length) {
    for (const c of rel.changes) lines.push(`- ${c}`);
  } else if (rel.rawBody) {
    // Echo the raw changelog body verbatim rather than invent structure.
    lines.push(rel.rawBody);
  } else {
    lines.push(placeholder(`the contents of the ${ver} changelog section`));
  }
  lines.push("");
  lines.push(placeholder("one or two sentences of context for THIS release, in your voice — loopkit only restated your changelog; the 'why it matters' framing is yours"));
  lines.push("```");
  return { content: lines.join("\n") + "\n", version: ver };
}

/** Build all three drafts as a map of relative filename → content. */
export function generateLaunch(model) {
  const hn = generateShowHN(model);
  const forum = generateForumPost(model);
  const cl = generateChangelogAnnouncement(model);
  return {
    files: {
      "show-hn.draft.md": hn.content,
      "forum-post.draft.md": forum.content,
      "changelog-announcement.draft.md": cl.content,
    },
    meta: { hnTitle: hn.title, hnTitleLen: hn.titleLen },
  };
}

function oneLine(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}
