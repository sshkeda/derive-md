#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const extensionPath = path.join(repoRoot, "src", "index.ts");
const PREAMBLE = "Follow these repo rules in order. If rules conflict, the earlier rule wins.";

const IMPERATIVE_START =
  /^(Use|Do not|Never|Always|Prefer|Run|Read|Write|Keep|Leave|Treat|Declare|Define|Retrieve|Inspect|Verify|Validate|Update|Apply|Avoid|Preserve|Migrate|Clear|Soft-fail|Debug|Confirm|Ask|Ship|Rely|Store|Fail|Minimize|Create|Remove|Rename|Edit|Check|Lint|Fix|Rewrite|Document|Include|Exclude|Open|Capture|Commit|Merge|Deploy|Publish|Install|Start|Stop|Test|Build|Typecheck|Format|Call|Invoke|Delete|Inject|Dedupe|Require|Warn|When|For|In)\b/;

const PROFILES = {
  "agents-md": {
    id: "agents-md",
    title: "AGENTS.md",
    target: "AGENTS.md",
    lintable: true,
    prompt({ targetPath, contextPath }) {
      return `You are updating ${targetPath} using the derive-md agents-md profile; treat this as a focused Markdown artifact regeneration session, not a general coding task. First inspect this repo deeply, read the context pack at ${contextPath}, then summarize your understanding of the repo, the intended agent behavior, and the AGENTS.md update goal before editing. Ask me to confirm that understanding; only after confirmation, rewrite AGENTS.md as compact prioritized agent policy, show the diff, and run \`derive-md lint --profile agents-md AGENTS.md\`.`;
    },
  },
};

function usage() {
  console.log(`derive-md - agentic Markdown artifact manager

Usage:
  derive-md regen [--profile agents-md] [target] [-- pi args...]  Open pi with a focused regeneration prompt
  derive-md regen --dry-run [--profile agents-md] [target]       Write context and print the prompt without launching pi
  derive-md lint [--profile agents-md] [path]                    Lint a managed Markdown artifact
  derive-md check [--profile agents-md] [path]                   Alias for lint
  derive-md profiles                                             List built-in profiles
  derive-md help                                                 Show this help

Examples:
  derive-md regen --profile agents-md
  derive-md regen AGENTS.md -- --model sonnet:high
  derive-md lint --profile agents-md AGENTS.md
`);
}

function parseCommon(args) {
  const rest = [];
  const flags = new Set();
  let profile = "agents-md";
  let passthrough = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--") {
      passthrough = args.slice(i + 1);
      break;
    }
    if (arg === "--dry-run" || arg === "--print-prompt") {
      flags.add(arg.slice(2));
      continue;
    }
    if (arg === "--profile" || arg === "-p") {
      profile = args[++i] ?? "";
      continue;
    }
    if (arg.startsWith("--profile=")) {
      profile = arg.slice("--profile=".length);
      continue;
    }
    rest.push(arg);
  }
  if (!PROFILES[profile]) {
    console.error(`Unknown profile: ${profile}`);
    console.error(`Available profiles: ${Object.keys(PROFILES).join(", ")}`);
    process.exit(2);
  }
  return { profile: PROFILES[profile], rest, passthrough, flags };
}

function expandHome(input) {
  return input.replace(/^~(?=$|\/)/, os.homedir());
}

function resolveTarget(input = "AGENTS.md") {
  const abs = path.resolve(expandHome(input));
  if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) return path.join(abs, "AGENTS.md");
  return abs;
}

function readRules(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const rules = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(\d+)\.\s+(.*)$/);
    if (match) rules.push({ line: i + 1, number: Number(match[1]), text: match[2].trim() });
  }
  return { lines, rules };
}

function normalizeRule(rule) {
  return rule
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/\[[^\]]+\]\s*/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function lintAgentsMd(file) {
  const issues = [];
  if (!fs.existsSync(file)) return [{ severity: "error", line: 0, message: `Missing ${file}` }];

  const markdown = fs.readFileSync(file, "utf8");
  const { lines, rules } = readRules(markdown);
  const nonEmpty = lines
    .map((text, index) => ({ text, line: index + 1 }))
    .filter((x) => x.text.trim());

  for (const h of nonEmpty.filter((x) => /^#+\s+/.test(x.text))) {
    issues.push({
      severity: "error",
      line: h.line,
      message: "No headings; use one preamble and one ordered list only.",
    });
  }

  const preambleLine = lines.findIndex((line) => line.trim() === PREAMBLE) + 1;
  if (preambleLine === 0)
    issues.push({ severity: "error", line: 1, message: `Preamble must be exactly: ${PREAMBLE}` });

  if (rules.length === 0)
    issues.push({
      severity: "error",
      line: 0,
      message: "Expected one ordered numbered list after the preamble.",
    });
  if (rules.length > 20)
    issues.push({
      severity: "warn",
      line: rules[20]?.line ?? 0,
      message: `Rule count is ${rules.length}; target 8-15 and warn above 20.`,
    });

  for (let i = 0; i < rules.length; i++) {
    const expected = i + 1;
    if (rules[i].number !== expected)
      issues.push({
        severity: "error",
        line: rules[i].line,
        message: `Rule number must be ${expected}, found ${rules[i].number}.`,
      });
    if (!IMPERATIVE_START.test(rules[i].text.replace(/^\[[^\]]+\]\s*/, "")))
      issues.push({
        severity: "warn",
        line: rules[i].line,
        message: "Rule should start with an imperative verb or clear policy phrase.",
      });
    if (!/[.!?`]$/.test(rules[i].text))
      issues.push({
        severity: "warn",
        line: rules[i].line,
        message: "Rule should end with punctuation.",
      });
    if (rules[i].text.length > 260)
      issues.push({
        severity: "warn",
        line: rules[i].line,
        message: `Rule is long (${rules[i].text.length} chars); split or compress it.`,
      });
    if (/\b(usually|generally|try to|please|should|maybe|where possible)\b/i.test(rules[i].text))
      issues.push({
        severity: "warn",
        line: rules[i].line,
        message: "Avoid hedging language; make the rule direct.",
      });
    if (/\bbecause\b|\bso that\b/i.test(rules[i].text))
      issues.push({
        severity: "warn",
        line: rules[i].line,
        message: "Avoid rationale prose; keep only the behavior-changing rule.",
      });
  }

  for (const x of nonEmpty) {
    if (/^[-*]\s+/.test(x.text))
      issues.push({ severity: "error", line: x.line, message: "No unordered lists." });
    if (/^```/.test(x.text))
      issues.push({
        severity: "error",
        line: x.line,
        message: "No fenced code blocks in canonical AGENTS.md.",
      });
    if (/\|/.test(x.text) && !/^\d+\.\s+/.test(x.text))
      issues.push({
        severity: "warn",
        line: x.line,
        message: "Tables are not allowed in canonical AGENTS.md.",
      });
  }

  const ruleLineNumbers = new Set(rules.map((r) => r.line));
  const allowedLines = new Set([preambleLine].filter(Boolean));
  for (const x of nonEmpty) {
    if (allowedLines.has(x.line) || ruleLineNumbers.has(x.line)) continue;
    issues.push({
      severity: "error",
      line: x.line,
      message: "Unexpected prose or structure; canonical file is preamble and ordered list only.",
    });
  }

  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const a = normalizeRule(rules[i].text);
      const b = normalizeRule(rules[j].text);
      if (a && a === b)
        issues.push({
          severity: "error",
          line: rules[j].line,
          message: `Duplicate of rule ${rules[i].number}.`,
        });
    }
  }

  const allRules = rules.map((r) => r.text.toLowerCase()).join("\n");
  if (
    /use bun/.test(allRules) &&
    /use npm/.test(allRules) &&
    !/except[^\n]*npm|npm[^\n]*except/.test(allRules)
  ) {
    issues.push({
      severity: "error",
      line: 0,
      message: "Potential Bun/npm conflict; make npm an explicit exception or remove it.",
    });
  }

  return issues;
}

function runLint(args) {
  const { profile, rest } = parseCommon(args);
  if (profile.id !== "agents-md") {
    console.error(`Profile ${profile.id} does not define a linter yet.`);
    return 2;
  }
  const file = resolveTarget(rest[0] ?? profile.target);
  const issues = lintAgentsMd(file);
  if (issues.length === 0) {
    console.log(`OK ${file}`);
    return 0;
  }
  console.log(`derive-md lint --profile ${profile.id} ${file}`);
  for (const issue of issues) {
    const loc = issue.line ? `${file}:${issue.line}` : file;
    console.log(`${issue.severity.toUpperCase()} ${loc} ${issue.message}`);
  }
  return issues.some((issue) => issue.severity === "error") ? 1 : 0;
}

function shellOutput(command, options = {}) {
  const result = spawnSync(command[0], command.slice(1), { encoding: "utf8", ...options });
  if (result.status !== 0) return "";
  return result.stdout.trim();
}

function firstExisting(paths) {
  return paths.filter((p) => fs.existsSync(path.resolve(p)));
}

function writeContextPack(profile, targetPath) {
  const cwd = process.cwd();
  const relTarget = path.relative(cwd, targetPath) || path.basename(targetPath);
  const now = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = path.join(cwd, ".derive-md", "runs", `${now}-${profile.id}`);
  fs.mkdirSync(runDir, { recursive: true });
  const contextPath = path.join(runDir, "context.md");
  const gitRoot = shellOutput(["git", "rev-parse", "--show-toplevel"], { cwd }) || cwd;
  const gitStatus =
    shellOutput(["git", "status", "--short"], { cwd }) || "(clean or not a git repo)";
  const recentCommits = shellOutput(["git", "log", "--oneline", "-10"], { cwd }) || "(unavailable)";
  const candidateFiles = firstExisting([
    "README.md",
    "package.json",
    "AGENTS.md",
    "CLAUDE.md",
    "TODO.md",
    "TODOS.md",
    "Makefile",
    "turbo.json",
    "pnpm-workspace.yaml",
  ]);

  const body = [
    `# derive-md context pack`,
    ``,
    `- profile: ${profile.id}`,
    `- target: ${relTarget}`,
    `- cwd: ${cwd}`,
    `- git_root: ${gitRoot}`,
    `- created_at: ${new Date().toISOString()}`,
    ``,
    `## Git status`,
    ``,
    "```text",
    gitStatus,
    "```",
    ``,
    `## Recent commits`,
    ``,
    "```text",
    recentCommits,
    "```",
    ``,
    `## Candidate context files`,
    ``,
    ...candidateFiles.map((file) => `- ${file}`),
    ``,
    `## Profile contract`,
    ``,
    profile.id === "agents-md"
      ? "Regenerate a compact canonical AGENTS.md: one preamble, one ordered list, prioritized agent behavior rules, no documentation prose."
      : `Profile ${profile.id}.`,
    ``,
    `## Target file snapshot`,
    ``,
    fs.existsSync(targetPath)
      ? "```md\n" + fs.readFileSync(targetPath, "utf8").slice(0, 20000) + "\n```"
      : "Target file does not exist yet.",
    ``,
  ].join("\n");

  fs.writeFileSync(contextPath, body);
  return contextPath;
}

function runRegen(args) {
  const { profile, rest, passthrough, flags } = parseCommon(args);
  const target = resolveTarget(rest[0] ?? profile.target);
  const contextPath = writeContextPack(profile, target);
  const prompt = profile.prompt({ targetPath: target, contextPath });
  if (flags.has("dry-run") || flags.has("print-prompt")) {
    console.log(`Context pack: ${contextPath}`);
    console.log("\n--- derive-md Pi prompt ---\n");
    console.log(prompt);
    return 0;
  }
  const piArgs = ["-e", extensionPath, ...passthrough];
  const result = spawnSync("pi", piArgs, {
    stdio: "inherit",
    env: {
      ...process.env,
      DERIVE_MD_PREFILL_PROMPT: prompt,
      DERIVE_MD_PROFILE: profile.id,
      DERIVE_MD_CONTEXT_PACK: contextPath,
      DERIVE_MD_TARGET: target,
    },
  });
  return result.status ?? 1;
}

function runProfiles() {
  for (const profile of Object.values(PROFILES)) {
    console.log(`${profile.id}\t${profile.title}\t${profile.target}`);
  }
  return 0;
}

const [cmd, ...rest] = process.argv.slice(2);
if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
  usage();
  process.exit(0);
}
if (cmd === "profiles") process.exit(runProfiles());
if (cmd === "lint" || cmd === "check") process.exit(runLint(rest));
if (cmd === "regen" || cmd === "launch") process.exit(runRegen(rest));

console.error(`Unknown command: ${cmd}`);
usage();
process.exit(2);
