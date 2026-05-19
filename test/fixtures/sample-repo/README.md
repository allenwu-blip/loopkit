# snapdiff

**A zero-config visual diff for your terminal screenshots.** Point it at two
PNGs and it prints a per-pixel delta and an exit code you can gate CI on.

```bash
npx snapdiff before.png after.png
```

## Why

Screenshot tests rot silently. You only notice the UI changed when a user
complains. snapdiff makes the change a failing exit code instead of a
surprise.

## Features

- One command, no config file, no setup
- Deterministic per-pixel delta with a tolerance flag
- Exit code 1 on a meaningful diff so CI catches it
- Pure local — reads two files, writes one diff image

## How it works

It decodes both PNGs, compares pixels with an anti-aliasing-aware threshold,
and writes `diff.png` highlighting changed regions.

## Limitations

It only handles PNG. It does not do semantic/DOM diffing — two visually
identical renders with different markup are "the same" to snapdiff. It has no
opinion on whether a diff is *good*; it only tells you there is one.
