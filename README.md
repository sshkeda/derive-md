# derive-md

`derive-md` is an agentic Markdown artifact manager and Pi launcher.

It supersedes narrow tools like `pi-agents-md` / `pam` and `arc derive` by making each Markdown workflow a profile. The CLI prepares context; Pi does the repo-specific reasoning, asks for confirmation, edits, and validates.

## Current MVP

```bash
npm link
cd ../some-repo
derive-md regen --profile agents-md
```

This command:

1. detects the current repo and target `AGENTS.md`
2. launches Pi with a controlled `agents-md` prompt
3. tells Pi to inspect the repo, git status, recent commits, and relevant files itself
4. asks Pi to confirm its understanding before editing
5. expects Pi to rewrite `AGENTS.md`, show a diff, and run the linter

## Profiles

```bash
derive-md profiles
```

Built-in profiles:

- `agents-md` — compact prioritized `AGENTS.md` policy files for coding agents

Planned profiles:

- `skill-md` — Pi/Claude-style skill files
- `readme-md` — repo README regeneration
- `source-derived-md` — raw source data to semantic Markdown derivatives

## Dry run

```bash
derive-md regen --profile agents-md --dry-run
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
- Exactly one ordered numbered list.
- No sections, unordered lists, command catalogs, tables, or prose docs.
- Earlier rules are higher priority.
- Keep commands only when repo-specific, non-obvious, safety-relevant, or exceptions.
- Delete rule B if an agent that already read rule A would follow B without being told.

## Development

```bash
npm run typecheck
npm run lint
npm run format:check
npm run agents-md:lint
```
