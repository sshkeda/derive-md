---
name: derive-md
description: Use when creating, regenerating, linting, or managing machine-maintainable Markdown artifacts with derive-md. Triggers include derive-md, agents-md profile, AGENTS.md regeneration, SKILL.md regeneration, raw source to Markdown derivation, Markdown artifact profiles, context packs, or agentic Markdown rewrite launchers.
---

# derive-md

`derive-md` is Stephen's standalone agentic Markdown artifact manager at `derive-md`.

It supersedes narrow tools like `pi-agents-md` / `pam` and `arc derive` by making each Markdown workflow a **profile**.

## Core model

```text
derive-md = context packer + profile manager + Pi launcher + artifact index/sync bridge
Pi        = repo-specific reasoning, user confirmation, editing, validation
agent-recall = optional synced registry/blob layer
```

Do not treat `derive-md` as a blind generator. It should prepare context and launch focused agent sessions.

## Current CLI

```bash
derive-md profiles
derive-md regen --profile agents-md
derive-md regen --profile agents-md --dry-run
derive-md lint --profile agents-md AGENTS.md
```

`derive-md regen --profile agents-md` should be run from the target repo. It writes a context pack under `.derive-md/runs/` and launches Pi with a controlled prompt.

Use `--dry-run` when testing from an agent session to avoid launching interactive Pi:

```bash
derive-md regen --profile agents-md --dry-run
```

## Profiles

A profile defines a managed Markdown workflow: target files, context inputs, prompt contract, validation, and safety rules.

Existing profile:

- `agents-md` — compact prioritized `AGENTS.md` policy files for coding agents.

Planned profiles:

- `skill-md` — Pi/Claude-style `SKILL.md` files.
- `readme-md` — repository README regeneration.
- `source-derived-md` — raw source data to semantic Markdown derivatives.

## agents-md workflow

When asked to update AGENTS.md with derive-md:

1. Run from the target repo.
2. Prefer `derive-md regen --profile agents-md` for interactive user-driven updates.
3. Use `derive-md regen --profile agents-md --dry-run` for non-interactive inspection.
4. The launched agent must inspect the repo, read the context pack, summarize its understanding, and ask the user to confirm before editing.
5. After editing, run `derive-md lint --profile agents-md AGENTS.md`.

## Canonical AGENTS.md format

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
