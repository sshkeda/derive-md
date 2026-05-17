Follow these repo rules in order. If rules conflict, the earlier rule wins.

1. Treat `derive-md` as a standalone repo that supersedes `pi-agents-md`, `pam`, and `arc derive` without modifying those repos during normal development.
2. Build Markdown management behavior as `derive-md` profiles or commands; keep the CLI as a profile-controlled Pi launcher, not a blind generator.
3. Preserve `derive-md lint --profile agents-md` as the canonical AGENTS.md structure validator.
4. Keep canonical AGENTS.md files compact: one preamble, one ordered list, imperative behavior rules, and no documentation prose.
5. Require user confirmation before any agentic regeneration prompt edits a target Markdown file.
6. Do not add compatibility wrappers unless the user explicitly asks for a migration path.
7. Run `npm run typecheck`, `npm run lint`, `npm run format:check`, and `npm run agents-md:lint` before finishing changes.
