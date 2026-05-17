---
name: derive-md
description: Use when creating, regenerating, linting, or managing machine-maintainable Markdown artifacts with derive-md. Triggers include derive-md, agents-md profile, AGENTS.md regeneration, SKILL.md regeneration, raw source to Markdown derivation, Markdown artifact profiles, or agentic Markdown rewrite launchers.
---

# derive-md

`derive-md` is Stephen's standalone agentic Markdown artifact manager at `derive-md`.

It supersedes narrow tools like `pi-agents-md` / `pam` and `arc derive` by making each Markdown workflow a **profile**.

## Core model

```text
derive-md = profile manager + Pi launcher + artifact index/sync bridge
Pi        = repo-specific reasoning, user confirmation, editing, validation
agent-recall = optional synced registry/blob layer
```

Do not treat `derive-md` as a blind generator. It should prepare context and launch focused agent sessions.

## Current CLI

```bash
derive-md profiles
derive-md agents --censor
derive-md agents --censor --dry-run
derive-md regen --profile agents-md
derive-md regen --profile agents-md --existing-target ignore|summary|full
derive-md regen --profile agents-md --no-markdown-docs
derive-md lint --profile agents-md AGENTS.md
```

`derive-md agents --censor` should be run from the target repo. It snapshots profile-protected files under `~/.derive-md/projects/.../snapshots/`, launches Pi with the `agents-md` prompt, passes `--no-context-files`, and loads `pi-censor` to block `read` tool access to `AGENTS.md`, `CLAUDE.md`, `SKILL.md`, and `README.md`.

Default `agents-md` regeneration uses `--existing-target ignore`: the current target may be used for before/after comparison, but not as policy evidence. Use `summary` for a weak prior, `full` for conservative rewrites, and `--no-markdown-docs` when non-target Markdown docs should not influence the result.

Use `--dry-run` when testing from an agent session to avoid launching interactive Pi:

```bash
derive-md agents --censor --dry-run
```

## Profiles

A profile defines a managed Markdown workflow: target files, prompt contract, validation, and safety rules.

Existing profile:

- `agents-md` — compact prioritized `AGENTS.md` policy files for coding agents.

Planned profiles:

- `skill-md` — Pi/Claude-style `SKILL.md` files.
- `readme-md` — repository README regeneration.
- `source-derived-md` — raw source data to semantic Markdown derivatives.

## agents-md workflow

When asked to update AGENTS.md with derive-md:

1. Run from the target repo.
2. Prefer `derive-md agents --censor` for interactive user-driven updates.
3. Use `derive-md agents --censor --dry-run` to inspect the launch prompt and censor config without opening Pi.
4. The launched agent must infer policy from repo evidence without reading existing AGENTS.md, CLAUDE.md, SKILL.md, or README.md content, then present a blind inferred policy target before editing.
5. The launched agent must not claim an exact before/after comparison or ask the user to paste protected files while censored.
6. The launched agent must not copy the bias-control instruction into the target policy; if future regeneration is relevant, tell agents to use `derive-md agents --censor`.
7. After editing, run `derive-md lint --profile agents-md AGENTS.md`.

## Canonical AGENTS.md format

Target 5 rules by default and 5-7 as the ideal range. Warn at 8-9 rules, strongly warn at 10-12, and treat 13+ as invalid without an explicit future override.

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

## Development

Work in:

```bash
cd derive-md
```

Validate changes:

```bash
npm run check
```

Global CLI is linked with:

```bash
npm link
```

Do not modify `pi-agents-md` unless the user explicitly asks to migrate, archive, or delete the old repo.
