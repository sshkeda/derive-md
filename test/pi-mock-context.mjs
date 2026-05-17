import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createMock, script, text } from "../../pi-mock/dist/index.js";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pi-context-mock-"));
const home = path.join(tmp, "home");
const repoA = path.join(tmp, "repo-a");
const repoB = path.join(tmp, "repo-b");
fs.mkdirSync(path.join(home, ".pi-context"), { recursive: true });
fs.mkdirSync(repoA, { recursive: true });
fs.mkdirSync(repoB, { recursive: true });
fs.writeFileSync(path.join(repoA, "AGENTS.md"), "# Repo A\n\nLocal repo A instructions.\n");
fs.writeFileSync(path.join(repoB, "AGENTS.md"), "# Repo B\n\nPeer repo B instructions v1.\n");
fs.writeFileSync(
  path.join(home, ".pi-context", "config.json"),
  JSON.stringify(
    {
      version: 1,
      enabled: true,
      delivery: "appendIdle",
      display: true,
      watch: true,
      autoDiscoverAgentMd: false,
      debounceMs: 100,
      scopes: [
        {
          name: "fixture-peer-scope",
          match: { roots: [repoA, repoB] },
          conflictPolicy: "local-wins",
          sources: [
            {
              type: "file",
              path: path.join(repoA, "AGENTS.md"),
              root: repoA,
              apply: "peer",
              role: "peer-agent-contract",
            },
            {
              type: "file",
              path: path.join(repoB, "AGENTS.md"),
              root: repoB,
              apply: "peer",
              role: "peer-agent-contract",
            },
          ],
        },
      ],
    },
    null,
    2,
  ),
);

const sessionFile = path.join(tmp, "session.jsonl");
fs.writeFileSync(
  sessionFile,
  JSON.stringify({
    type: "session",
    version: 3,
    id: "pi-context-test-session",
    timestamp: new Date().toISOString(),
    cwd: repoA,
  }) + "\n",
);

const mock = await createMock({
  cwd: repoA,
  env: { HOME: home },
  sessionFile,
  extensions: [path.resolve("src/index.ts")],
  brain: script(text("ack-1"), text("ack-2")),
});

try {
  // Initial context should be appended immediately on session_start, before prompt 1.
  await mock.run("first prompt");
  assert.equal(mock.requests.length, 1);
  const req1Messages = JSON.stringify(mock.requests[0].messages);
  assert.match(req1Messages, /Peer repo B instructions v1/);
  assert.doesNotMatch(req1Messages, /Local repo A instructions/);

  let sessionLog = fs
    .readFileSync(sessionFile, "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  const custom1 = sessionLog.filter(
    (entry) => entry.type === "custom_message" && entry.customType === "pi-agents-md",
  );
  assert.equal(custom1.length, 1);
  assert.equal(custom1[0].details.scope, "fixture-peer-scope");
  assert.match(custom1[0].content, /Peer repo B instructions v1/);

  // File update should be watched, debounced, hash-deduped, and appended while idle.
  fs.writeFileSync(path.join(repoB, "AGENTS.md"), "# Repo B\n\nPeer repo B instructions v2.\n");
  await new Promise((resolve) => setTimeout(resolve, 600));

  sessionLog = fs
    .readFileSync(sessionFile, "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  const customAfterUpdate = sessionLog.filter(
    (entry) => entry.type === "custom_message" && entry.customType === "pi-agents-md",
  );
  assert.equal(customAfterUpdate.length, 2);
  assert.equal(customAfterUpdate[1].details.kind, "update");
  assert.match(customAfterUpdate[1].content, /Peer repo B instructions v2/);

  await mock.run("second prompt");
  assert.equal(mock.requests.length, 2);
  const req2Messages = JSON.stringify(mock.requests[1].messages);
  assert.match(req2Messages, /Peer repo B instructions v1/);
  assert.match(req2Messages, /Peer repo B instructions v2/);

  console.log(
    JSON.stringify(
      {
        ok: true,
        tmp,
        sessionFile,
        customMessages: customAfterUpdate.map((entry) => ({
          kind: entry.details.kind,
          scope: entry.details.scope,
          sourceId: entry.details.sourceId,
          hash: entry.details.hash,
          contentPreview: entry.content.slice(0, 120),
        })),
        requestMessageCounts: mock.requests.map((req) => req.messages?.length ?? null),
      },
      null,
      2,
    ),
  );
} finally {
  await mock.close();
}
