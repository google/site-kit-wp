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
// Tests for the shell command hook. Each test runs the script as a process and hands it one
// command, because the exit code is what decides whether the command runs. Each test runs the
// hook in a temporary folder it made itself, with nothing in it.

import { test } from "node:test";
import { strictEqual, deepStrictEqual } from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "on-command.mjs");

/**
 * Hands one command to the hook and gives back what it wrote.
 *
 * @param {string} command The shell command Claude is about to run.
 * @param {string} [cwd] A project folder the test made itself. Without one, the hook gets a fresh folder with nothing in it.
 * @returns {{ err: string, code: number }} Standard error and the exit code.
 */
function run(command, cwd) {
  const folder = cwd ?? mkdtempSync(join(tmpdir(), "voice-"));
  try {
    execFileSync("node", [SCRIPT], { input: JSON.stringify({ cwd: folder, tool_input: { command } }), encoding: "utf8" });
    return { err: "", code: 0 };
  } catch (error) {
    return { err: `${error.stderr ?? ""}`, code: error.status };
  } finally {
    if (!cwd) rmSync(folder, { recursive: true, force: true });
  }
}

test("refuses a commit message that breaks a rule", () => {
  const { err, code } = run(`git commit -m "It basically works."`);
  strictEqual(code, 2);
  strictEqual(err.includes("empty-adverb"), true);
  strictEqual(err.includes("a commit message"), true);
});

test("lets a clean commit message through", () => {
  strictEqual(run(`git commit -m "Add the check script"`).code, 0);
});

test("refuses a pull request description that breaks a rule", () => {
  const { err, code } = run(`gh pr create --title "x" --body "There is a problem here."`);
  strictEqual(code, 2);
  strictEqual(err.includes("a pull request description"), true);
});

test("refuses a pull request comment that breaks a rule", () => {
  const { err, code } = run(`gh pr comment 7 --body "The check ran; it found nothing."`);
  strictEqual(code, 2);
  strictEqual(err.includes("a pull request comment"), true);
});

test("leaves a command carrying no prose alone", () => {
  strictEqual(run("npm test").code, 0);
});

test("reads a command in a folder with no marker file", () => {
  const folder = mkdtempSync(join(tmpdir(), "voice-"));
  try {
    deepStrictEqual(readdirSync(folder), []);
    strictEqual(run(`git commit -m "It basically works."`, folder).code, 2);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test("refuses a markdown file written through a shell heredoc", () => {
  const { err, code } = run(`cat > note.md <<'EOF'\nIt basically works.\nEOF`);
  strictEqual(code, 2);
  strictEqual(err.includes("empty-adverb"), true);
  strictEqual(err.includes("the shell"), true);
});

test("lets a clean markdown file written through the shell through", () => {
  strictEqual(run(`cat > note.md <<'EOF'\nThe check prints a report.\nEOF`).code, 0);
});

test("leaves a heredoc feeding a program alone, because that is code", () => {
  strictEqual(run(`python3 - <<'PY'\nprint("It basically works.")\nPY`).code, 0);
});

// One command often does both. It pipes a script into a program and appends a paragraph to a
// markdown file. Reading the whole command for a redirect let the program's own source be read
// as prose, and the hook refused a command that broke no writing rule.
test("leaves the program half alone when the same command also writes a markdown file", () => {
  const command = `python3 - <<'PY'\nprint("It basically works.")\nPY\ncat >> note.md <<'TEXT'\nThe report is stored.\nTEXT`;
  strictEqual(run(command).code, 0);
});

test("still reads the markdown half when the same command pipes a script into a program", () => {
  const command = `python3 - <<'PY'\nprint("ok")\nPY\ncat >> note.md <<'TEXT'\nIt basically works.\nTEXT`;
  const found = run(command);
  strictEqual(found.code, 2);
  strictEqual(found.err.includes("basically"), true);
});

test("reads a heredoc whose redirect sits after the marker, which the shell also allows", () => {
  const found = run(`cat <<'TEXT' > note.md\nIt basically works.\nTEXT`);
  strictEqual(found.code, 2);
});

test("reads the second markdown heredoc when the first one breaks no rule", () => {
  const command = `cat > one.md <<'A'\nThe report is stored.\nA\ncat > two.md <<'B'\nIt basically works.\nB`;
  strictEqual(run(command).code, 2);
});
