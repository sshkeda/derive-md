# derive-md

`derive-md` is an agentic Markdown artifact manager and Pi launcher.

It supersedes narrow tools like `pi-agents-md` / `pam` and `arc derive` by making each Markdown workflow a profile. The CLI prepares context; Pi does the repo-specific reasoning, asks for confirmation, edits, and validates.

## Current MVP

```bash
npm link
cd ../some-repo

# regenerate AGENTS.md
derive-md agents --censor

# regenerate README.md
derive-md readme --censor
```

`derive-md agents` is a shortcut for `derive-md regen --profile agents-md`, and
`derive-md readme` is a shortcut for `derive-md regen --profile readme-md`. Default
behavior is equivalent to:

```bash
derive-md regen --profile agents-md --existing-target ignore
derive-md regen --profile readme-md --existing-target ignore
```

This command:

1. detects the current repo and target `AGENTS.md`
2. launches Pi with `--no-context-files` so old `AGENTS.md` / `CLAUDE.md` files are not preloaded as instructions
3. snapshots policy docs under `~/.derive-md/projects/.../snapshots/` when `--censor` is set
4. keeps read/edit/write tools available; `--censor` is prompt-only bias control
5. tells Pi not to read existing `AGENTS.md`, `CLAUDE.md`, `SKILL.md`, or `README.md` during inference to avoid bias
6. asks Pi to show the inferred policy outline before editing
7. expects Pi to rewrite only `AGENTS.md`, show a diff, and run the linter

## Profiles

```bash
derive-md profiles
```

Built-in profiles:

- `agents-md` — compact prioritized `AGENTS.md` policy files for coding agents
- `readme-md` — public-facing `README.md` for someone landing on the repo cold

Planned profiles:

- `skill-md` — Pi/Claude-style skill files
- `source-derived-md` — raw source data to semantic Markdown derivatives

## Existing target modes

```bash
derive-md regen --profile agents-md --existing-target ignore
derive-md regen --profile agents-md --existing-target summary
derive-md regen --profile agents-md --existing-target full
```

- `ignore` — do not use the current target as policy evidence except for before/after comparison.
- `summary` — use only a short neutral summary of the current target as weak prior evidence.
- `full` — use the full current target as quoted evidence, not as live instructions.

Markdown docs like `README.md` remain enabled by default. Use this broad escape hatch when you want non-Markdown evidence only:

```bash
derive-md regen --profile agents-md --no-markdown-docs
```

## Dry run

```bash
derive-md agents --censor --dry-run
```

This prints the Pi prompt without launching Pi.

## AGENTS.md linting

```bash
derive-md lint --profile agents-md AGENTS.md
```

Canonical AGENTS.md format:

```md
Follow these repo rules in order. If rules conflict, the earlier rule wins.

1. Use Bun for all package, script, and workspace operations.
2. Do not create a root `.env`.
3. Never add env fallbacks, defaults, or `.optional()` to bypass missing config.
```

Rules:

- No headings.
- Exactly one short preamble.
- Exactly one ordered numbered list; target 5 rules by default and 5-7 as the ideal range.
- No sections, unordered lists, command catalogs, tables, or prose docs.
- Earlier rules are higher priority.
- Keep commands only when repo-specific, non-obvious, safety-relevant, or exceptions.
- Delete rule B if an agent that already read rule A would follow B without being told.
- Warn at 8-9 rules, strongly warn at 10-12, and treat 13+ as invalid without an explicit future override.

## Development

```bash
npm run typecheck
npm run lint
npm run format:check
npm run agents-md:lint
```
