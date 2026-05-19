# derive-md

A small command that writes a fresh `README.md` or `AGENTS.md` for the repository you're in.

You run `derive-md readme` from inside any repo. Behind the scenes it launches [Pi](https://github.com/earendil-works/pi-mono) — a terminal-based AI coding assistant — with a focused prompt. Pi looks at your code, tests, and package files, shows you an outline of what it plans to write, and only writes the file after you confirm.

The point: get a clean, accurate doc that matches what the code actually does, without rewording whatever stale content was there before.

## Install

```bash
git clone https://github.com/sshkeda/derive-md
cd derive-md
npm link
```

Pi must be installed separately. See https://github.com/earendil-works/pi-mono.

## Use it

```bash
cd /path/to/any-repo

derive-md readme --censor    # writes a fresh README.md
derive-md agents --censor    # writes a fresh AGENTS.md
```

Both commands open an interactive Pi session in your terminal. Pi will:

1. Read the repo's code, configs, and tests.
2. Show you a plain outline of the file it's about to write.
3. Wait for you to confirm or adjust.
4. Write the file.

If you'd rather see the prompt Pi would receive without actually launching it:

```bash
derive-md readme --censor --dry-run
```

## What `--censor` does

`--censor` hides the existing `README.md` / `AGENTS.md` / `CLAUDE.md` / `SKILL.md` from Pi while it's inferring what to write, so the new file is rebuilt from the actual code instead of just being a reword of what was already there.

The flow with `--censor`:

1. `derive-md` snapshots the four protected files under `~/.derive-md/projects/<slug>/snapshots/<timestamp>/` — nothing is destroyed.
2. Pi is launched with `--no-context-files`, so it doesn't auto-load `AGENTS.md`/`CLAUDE.md` as instructions either.
3. The prompt to Pi says: don't look at the existing target by any means during inference.
4. Pi proposes an outline, you confirm, Pi writes only the target file.

Without `--censor`, Pi can still peek at the existing file for context and may reuse phrasing from it.

## What gets generated

- `derive-md readme` produces a public-facing `README.md`: a short pitch, install, usage, and the sections that actually have evidence in the repo.
- `derive-md agents` produces an `AGENTS.md`: a short prioritized list of rules other AI coding tools should follow when working in the repo.

If you'd rather let Pi use the current file as evidence (instead of fully censoring), drop `--censor` and use one of:

```bash
derive-md regen --profile readme-md --existing-target summary
derive-md regen --profile readme-md --existing-target full
```

## Profiles

```bash
derive-md profiles
```

Built in:

- `readme-md` — public-facing `README.md`
- `agents-md` — compact `AGENTS.md` rules file

Planned: `skill-md`, `source-derived-md`.

## AGENTS.md linting

`AGENTS.md` files have a strict canonical format. To check one:

```bash
derive-md lint --profile agents-md AGENTS.md
```

The canonical format is:

```md
Follow these repo rules in order. If rules conflict, the earlier rule wins.

1. Use Bun for all package, script, and workspace operations.
2. Do not create a root `.env`.
3. Never add env fallbacks, defaults, or `.optional()` to bypass missing config.
```

Rules:

- One short preamble. No headings.
- One ordered numbered list. Target 5 rules, ideal 5–7.
- No sections, unordered lists, command catalogs, tables, or prose docs.
- Earlier rules are higher priority.
- Keep commands only when repo-specific, non-obvious, or safety-relevant.
- Delete rule B if an agent that already read rule A would follow B without being told.
- Warn at 8–9 rules, strongly warn at 10–12, treat 13+ as invalid.

## Development

```bash
npm run typecheck
npm run lint
npm run format:check
npm run agents-md:lint
```

## License

MIT
