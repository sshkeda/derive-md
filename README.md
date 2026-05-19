# derive-md

Auto-generate `AGENTS.md` and `README.md` files for your repo. `derive-md` launches [Pi](https://github.com/earendil-works/pi-mono) (a coding agent) with a focused prompt — Pi reads the code, shows you an outline, asks for confirmation, and writes the file.

## Install

```bash
git clone https://github.com/sshkeda/derive-md
cd derive-md
npm link
```

You'll also need [Pi](https://github.com/earendil-works/pi-mono) installed (`derive-md` shells out to the `pi` CLI).

## Usage

```bash
cd /path/to/any-repo

# Regenerate AGENTS.md from scratch
derive-md agents --censor

# Regenerate README.md from scratch
derive-md readme --censor
```

`--censor` tells Pi to ignore any existing `AGENTS.md` / `README.md` / `CLAUDE.md` / `SKILL.md` while inferring, so the new file is rebuilt from code/config/tests rather than rewording whatever was there before. Pi snapshots the originals first under `~/.derive-md/projects/.../snapshots/`, then asks you to confirm an inferred outline before writing.

Add `--dry-run` to print the prompt without launching Pi:

```bash
derive-md agents --censor --dry-run
```

## Profiles

```bash
derive-md profiles
```

| Profile | Target | What it produces |
|---|---|---|
| `agents-md` | `AGENTS.md` | Compact prioritized rules list for coding agents |
| `readme-md` | `README.md` | Public-facing README with pitch, install, usage, etc. |

Planned: `skill-md`, `source-derived-md`.

## Existing-target modes

By default Pi ignores any existing target file. You can change that:

```bash
derive-md regen --profile agents-md --existing-target ignore   # default
derive-md regen --profile agents-md --existing-target summary  # short neutral summary as weak prior
derive-md regen --profile agents-md --existing-target full     # full content as quoted evidence
```

Or drop Markdown docs from the evidence pool entirely:

```bash
derive-md regen --profile agents-md --no-markdown-docs
```

## Non-interactive helpers

For agents driving `derive-md` without spawning Pi:

```bash
# Just print the prompt
derive-md prompt --profile readme-md

# Print JSON with prompt + profile metadata
derive-md context --profile readme-md
```

## AGENTS.md linting

```bash
derive-md lint --profile agents-md AGENTS.md
```

Canonical `AGENTS.md` format:

```md
Follow these repo rules in order. If rules conflict, the earlier rule wins.

1. Use Bun for all package, script, and workspace operations.
2. Do not create a root `.env`.
3. Never add env fallbacks, defaults, or `.optional()` to bypass missing config.
```

Rules:

- No headings.
- Exactly one short preamble.
- Exactly one ordered numbered list; target 5 rules, ideal 5–7.
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
