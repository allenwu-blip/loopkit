/**
 * src/stamp.js — the honesty stamps.
 *
 * Every artifact loopkit emits that a human must edit/judge/post is stamped,
 * visibly and unmissably, with what it is and is NOT. This is not decoration:
 * the entire credibility claim of this tool is "I generated a SCAFFOLD from
 * your own words, I did not do the judgment or the posting". The stamp is
 * how each file says that about itself, on its own, out of context.
 *
 * These strings are asserted verbatim by the test suite. If you change the
 * wording you are changing the product's core promise — do it on purpose.
 */

export const DRAFT_BANNER_LINES = [
  "loopkit DRAFT — generated from YOUR repo's own README/CHANGELOG.",
  "It is mechanical scaffolding, not a finished post. loopkit did not",
  "write a single claim of its own and it will NOT post this for you.",
  "Read every line, cut what is not true yet, add the taste, then YOU",
  "post it. Distribution judgment is the part no tool can do for you.",
];

/** A markdown blockquote banner for .md drafts (Show HN / Reddit / announcement). */
export function draftBannerMarkdown() {
  return DRAFT_BANNER_LINES.map((l) => "> " + l).join("\n");
}

/** A hash-comment banner for plaintext/checklist artifacts. */
export function draftBannerComment(word = "DRAFT") {
  const head = `# ── loopkit ${word} ` + "─".repeat(Math.max(0, 56 - word.length));
  return [head, ...DRAFT_BANNER_LINES.map((l) => "# " + l), "# " + "─".repeat(70)].join("\n");
}

/** An HTML comment + visible <!-- --> banner for the landing-page scaffold. */
export function draftBannerHtmlComment() {
  return (
    "<!--\n" +
    "  loopkit SCAFFOLD — a static, dependency-free landing page generated\n" +
    "  from YOUR repo's README/package.json. Every word below is yours or a\n" +
    "  visible [fill this in] placeholder. loopkit invented nothing and did\n" +
    "  not deploy this. Edit it, then ship it wherever you host static files.\n" +
    "-->"
  );
}

/**
 * The placeholder loopkit emits when an input field is genuinely absent.
 * It is deliberately ugly and unmissable so it can never be mistaken for
 * real copy and can never silently ship. `what` describes the missing field.
 */
export function placeholder(what) {
  return `[loopkit: FILL THIS IN — ${what} was not found in your repo; loopkit will not invent it]`;
}

/** True iff a value is a real, non-empty string (not a placeholder, not blank). */
export function present(v) {
  return typeof v === "string" && v.trim().length > 0;
}
