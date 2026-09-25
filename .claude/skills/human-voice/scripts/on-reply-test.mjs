/**
 * Site Kit by Google, Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// @ts-check
// Tests for the Stop hook script. Each test runs the script as a process and hands it one
// JSON payload, because what the hook returns on standard output is what Claude Code reads.

import { test } from "node:test";
import { strictEqual, deepStrictEqual } from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "on-reply.mjs");

/** A project folder with nothing in it, made fresh so no test leans on another. */
function freshProject() {
  return mkdtempSync(join(tmpdir(), "voice-"));
}

/**
 * Hands one payload to the hook and gives back what it wrote.
 *
 * @param {unknown} payload What Claude Code would send.
 * @param {string | null} cwd A project folder the test made itself, or null for a fresh one.
 * @returns {{ out: string, code: number }} The output and the exit code.
 */
function run(payload, cwd = null) {
  const folder = cwd ?? freshProject();
  const input = typeof payload === "string" ? payload : JSON.stringify({ cwd: folder, ...payload });
  try {
    return { out: execFileSync("node", [SCRIPT], { input, encoding: "utf8" }), code: 0 };
  } catch (error) {
    return { out: `${error.stdout ?? ""}`, code: error.status };
  } finally {
    if (!cwd) rmSync(folder, { recursive: true, force: true });
  }
}

test("lets the turn end when the hook has already held it open once", () => {
  const { out } = run({ stop_hook_active: true, last_assistant_message: "It basically works." });
  deepStrictEqual(JSON.parse(out), {});
});

test("lets the turn end when the reply breaks no rule", () => {
  const { out } = run({ last_assistant_message: "The check prints a report." });
  deepStrictEqual(JSON.parse(out), {});
});

test("lets the turn end when the reply is empty", () => {
  const { out } = run({ last_assistant_message: "   " });
  deepStrictEqual(JSON.parse(out), {});
});

test("lets the turn end when the input is not JSON", () => {
  const { out } = run("not json at all");
  deepStrictEqual(JSON.parse(out), {});
});

test("blocks with a reason when the reply breaks a rule", () => {
  const { out } = run({ last_assistant_message: "It basically works." });
  const answer = JSON.parse(out);
  strictEqual(answer.decision, "block");
  strictEqual(answer.reason.includes("empty-adverb"), true);
});

test("always exits 0, because a Stop hook answers with JSON rather than an exit code", () => {
  strictEqual(run({ last_assistant_message: "It basically works." }).code, 0);
});

test("reads the reply in a folder with no marker file", () => {
  const folder = mkdtempSync(join(tmpdir(), "voice-"));
  try {
    deepStrictEqual(readdirSync(folder), []);
    const { out } = run({ last_assistant_message: "It basically works." }, folder);
    strictEqual(JSON.parse(out).decision, "block");
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
