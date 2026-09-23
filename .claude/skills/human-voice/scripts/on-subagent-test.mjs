// @ts-check
// Tests for the subagent hook. Each test runs the script as a process and hands it one JSON
// payload, because what the hook writes on standard output is what Claude Code reads.

import { test } from "node:test";
import { strictEqual, deepStrictEqual } from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "on-subagent.mjs");

/**
 * Hands one payload to the hook and gives back what it wrote.
 *
 * @param {object} payload What Claude Code would send.
 * @param {string} [cwd] A project folder the test made itself. Without one, the hook gets a fresh folder with nothing in it.
 * @returns {string} What the hook wrote on standard output.
 */
function run(payload, cwd) {
  const folder = cwd ?? mkdtempSync(join(tmpdir(), "voice-"));
  try {
    return execFileSync("node", [SCRIPT], { input: JSON.stringify({ cwd: folder, ...payload }), encoding: "utf8" });
  } finally {
    if (!cwd) rmSync(folder, { recursive: true, force: true });
  }
}

test("blocks a report that breaks a rule", () => {
  const answer = JSON.parse(run({ last_assistant_message: "It basically works." }));
  strictEqual(answer.decision, "block");
  strictEqual(answer.reason.includes("empty-adverb"), true);
});

test("lets a clean report through", () => {
  deepStrictEqual(JSON.parse(run({ last_assistant_message: "The check prints a report." })), {});
});

test("lets the turn end when the hook has already held it open once", () => {
  deepStrictEqual(JSON.parse(run({ stop_hook_active: true, last_assistant_message: "It basically works." })), {});
});

test("reads a report in a folder with no marker file", () => {
  const folder = mkdtempSync(join(tmpdir(), "voice-"));
  try {
    deepStrictEqual(readdirSync(folder), []);
    strictEqual(JSON.parse(run({ last_assistant_message: "It basically works." }, folder)).decision, "block");
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
