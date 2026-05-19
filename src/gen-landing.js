/**
 * src/gen-landing.js — `loopkit landing`
 *
 * Emit ONE static, dependency-free HTML file (no JS, no CDN, no webfont, no
 * tracker, no build step) whose every visible word is either copied verbatim
 * from the user's repo or a loud [fill this in] placeholder. You can scp this
 * file to any static host and it works. loopkit does not deploy it.
 *
 * Deterministic: pure function of the model from repo-read.js. No clock, no
 * RNG. The same repo produces a byte-identical page every time.
 */

import { draftBannerHtmlComment, placeholder, present } from "./stamp.js";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Pick the README sections that belong on a landing page. We do NOT
 * paraphrase a section; we lift its first paragraph verbatim (markdown
 * stripped to text) so the page can only ever say what the README says.
 */
function landingSections(model) {
  const wanted = [
    ["Why", ["why", "motivation", "the problem", "problem"]],
    ["Features", ["features", "what it does", "what you get", "highlights"]],
    ["How it works", ["how it works", "how", "usage", "overview"]],
    ["Limitations", ["limitations", "what this does not do", "what it does not do", "non goals", "caveats"]],
  ];
  const out = [];
  for (const [label, names] of wanted) {
    const sec = model.readme.sections.find((s) => {
      const t = s.title.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
      return names.some((n) => t === n || t.startsWith(n + " "));
    });
    if (sec) {
      const para = firstTextParagraph(sec.body);
      if (para) out.push({ label, title: sec.title, text: para });
    }
  }
  return out;
}

function firstTextParagraph(md) {
  const blocks = String(md ?? "")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  for (const b of blocks) {
    if (/^#{1,6}\s/.test(b)) continue;
    if (/^>/.test(b)) continue;
    if (/^```/.test(b)) continue;
    const text = b
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/^[-*+]\s+/gm, "• ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) return text;
  }
  return "";
}

export function generateLanding(model) {
  const name = present(model.name) ? model.name : placeholder("a project name (package.json name or README # title)");
  const tagline = present(model.tagline)
    ? model.tagline
    : placeholder("a one-line value proposition (package.json description or README intro)");
  const install = present(model.installSnippet)
    ? model.installSnippet
    : placeholder("an install/usage command (a fenced code block under an Install/Usage heading in your README)");
  const repoUrl = present(model.repoUrl) ? model.repoUrl : null;
  const secs = landingSections(model);

  const sectionsHtml = secs.length
    ? secs
        .map(
          (s) => `    <section class="block">
      <h2>${esc(s.title)}</h2>
      <p>${esc(s.text)}</p>
    </section>`,
        )
        .join("\n")
    : `    <section class="block">
      <h2>About</h2>
      <p>${esc(
        placeholder(
          "Why / Features / How it works / Limitations sections (add headings with those names to your README and re-run loopkit landing)",
        ),
      )}</p>
    </section>`;

  // A single self-contained HTML doc. System font stack only — no webfont
  // request. Inlined CSS — no stylesheet request. Zero JS — nothing executes.
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(stripPlaceholderForTitle(name))}</title>
<meta name="description" content="${esc(oneLine(tagline))}">
${draftBannerHtmlComment()}
<style>
  :root { color-scheme: light dark; --fg:#1a1a1a; --muted:#666; --bg:#fff; --card:#f6f6f7; --accent:#1a1a1a; --line:#e3e3e3; }
  @media (prefers-color-scheme: dark) { :root { --fg:#eee; --muted:#9a9a9a; --bg:#111; --card:#1b1b1d; --accent:#eee; --line:#2a2a2a; } }
  * { box-sizing: border-box; }
  body { margin:0; font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; color:var(--fg); background:var(--bg); }
  .wrap { max-width:720px; margin:0 auto; padding:72px 24px 96px; }
  h1 { font-size:2.6rem; line-height:1.15; margin:0 0 .4em; letter-spacing:-.02em; }
  .tagline { font-size:1.25rem; color:var(--muted); margin:0 0 2.2em; }
  pre { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:18px 20px; overflow:auto; font:14px/1.55 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; }
  .cta { display:inline-block; margin-top:1.6em; padding:12px 22px; border:1px solid var(--accent); border-radius:8px; color:var(--bg); background:var(--accent); text-decoration:none; font-weight:600; }
  .cta.secondary { background:transparent; color:var(--fg); margin-left:10px; }
  .block { margin-top:3.2em; }
  .block h2 { font-size:1.35rem; margin:0 0 .4em; letter-spacing:-.01em; }
  .block p { margin:0; color:var(--fg); }
  footer { margin-top:5em; padding-top:2em; border-top:1px solid var(--line); color:var(--muted); font-size:.9rem; }
  a { color:inherit; }
</style>
</head>
<body>
  <main class="wrap">
    <h1>${esc(name)}</h1>
    <p class="tagline">${esc(tagline)}</p>

    <h2 style="font-size:1rem;color:var(--muted);margin:0 0 .5em;text-transform:uppercase;letter-spacing:.08em;">Install</h2>
    <pre><code>${esc(install)}</code></pre>
${repoUrl ? `    <a class="cta" href="${esc(repoUrl)}">View on GitHub</a>` : `    <!-- No repository url in package.json — add one and re-run for a GitHub button. -->`}
${repoUrl ? `    <a class="cta secondary" href="${esc(repoUrl)}/issues">Report an issue</a>` : ""}

${sectionsHtml}

    <footer>
      <p>${esc(name)}${present(model.license) ? ` — ${esc(model.license)} licensed` : ""}.
      ${repoUrl ? `Source: <a href="${esc(repoUrl)}">${esc(repoUrl)}</a>.` : ""}</p>
      <p>This page is a <strong>loopkit scaffold</strong> built from this project's own README/package.json.
      Static, no JavaScript, no trackers, no external requests. Edit it and host it anywhere — loopkit did not deploy it.</p>
    </footer>
  </main>
</body>
</html>
`;
}

function oneLine(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}
function stripPlaceholderForTitle(s) {
  // The <title> still shows the placeholder text if name is missing — that is
  // intentional (you SEE it is unfilled in the browser tab). We only collapse
  // whitespace here.
  return oneLine(s);
}
