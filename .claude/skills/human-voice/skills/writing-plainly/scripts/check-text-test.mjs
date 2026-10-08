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
// Tests for the check script. Each test runs the script as a process, because the exit
// code is what a caller reads. A test that needs a file writes it into a temporary
// folder it made itself, so no test here reads a file of the project.

import { test } from "node:test";
import { strictEqual } from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "check-text.mjs");

/**
 * Runs the check and gives back its output and its exit code.
 *
 * @param {string[]} args What to pass on the command line.
 * @param {string} input What to put on standard input.
 * @returns {{ out: string, code: number }} The output and the exit code.
 */
function run(args, input = "") {
  try {
    const out = execFileSync("node", [SCRIPT, ...args], { input, encoding: "utf8" });
    return { out, code: 0 };
  } catch (error) {
    return { out: `${error.stdout ?? ""}${error.stderr ?? ""}`, code: error.status };
  }
}

test("exits 1 and names the rule when the text breaks one", () => {
  const { out, code } = run([], "It basically works.\n");
  strictEqual(code, 1);
  strictEqual(out.includes("empty-adverb"), true);
});

test("exits 0 and says so when the text breaks none", () => {
  const { out, code } = run([], "The check prints a report.\n");
  strictEqual(code, 0);
  strictEqual(out.includes("breaks no rule"), true);
});

test("exits 0 when the text has a warning alone", () => {
  const { out, code } = run([], "The page displays the number.\n");
  strictEqual(code, 0);
  strictEqual(out.includes("warning: plain-word"), true);
});

test("exits 1 when the text has a refused word", () => {
  const { out, code } = run([], "We utilize the cache.\n");
  strictEqual(code, 1);
  strictEqual(out.includes("error: plain-word"), true);
});

test("reads a file named on the command line", () => {
  const folder = mkdtempSync(join(tmpdir(), "voice-"));
  try {
    const path = join(folder, "note.md");
    writeFileSync(path, "The export finished — at last.\n");
    const { out, code } = run([path]);
    strictEqual(code, 1);
    strictEqual(out.includes("dash"), true);
    strictEqual(out.includes(path), true);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

/**
 * Writes one file into a folder of its own and hands its path to the test.
 *
 * @param {string} name What to call the file.
 * @param {string | Buffer} text What to put in it.
 * @param {(path: string) => void} body The test.
 */
function withFile(name, text, body) {
  const folder = mkdtempSync(join(tmpdir(), "voice-"));
  try {
    const path = join(folder, name);
    writeFileSync(path, text);
    body(path);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
}

test("reads a comment in a code file named on the command line", () => {
  withFile("code.mjs", "// It basically works.\nconst a = 1;\n", (path) => {
    const { out, code } = run([path]);
    strictEqual(code, 1);
    strictEqual(out.includes(`${path}:1: error: empty-adverb`), true);
  });
});

test("reads nothing in a string of one word in a code file", () => {
  withFile("code.mjs", "const a = \"basically\";\n", (path) => {
    const { out, code } = run([path]);
    strictEqual(code, 0);
    strictEqual(out.includes("breaks no rule"), true);
  });
});

test("does not report a comment on two lines in a code file as a broken paragraph", () => {
  withFile("code.mjs", "// A comment that runs on\n// to a second line.\n", (path) => {
    strictEqual(run([path]).code, 0);
  });
});

test("reports a refused word in the name of the file", () => {
  withFile("utilize-cache.md", "The check prints a report.\n", (path) => {
    const { out, code } = run([path]);
    strictEqual(code, 1);
    strictEqual(out.includes(`${path}:0: error: refused-name: Rename the file "utilize-cache.md"`), true);
  });
});

test("says a file that is not text was not read, and exits 0", () => {
  withFile("picture.png", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x0a]), (path) => {
    const { out, code } = run([path]);
    strictEqual(code, 0);
    strictEqual(out.includes("is not a text file"), true);
  });
});

test("reads standard input as prose, whatever marks it has in it", () => {
  const { out, code } = run([], "// It basically works.\n");
  strictEqual(code, 1);
  strictEqual(out.includes("empty-adverb"), true);
});

test("refuses a path with two dots in it, and names the fix", () => {
  const { out, code } = run(["../somewhere/else.md"]);
  strictEqual(code, 1);
  strictEqual(out.includes("refused"), true);
  strictEqual(out.includes("Give a path with no"), true);
});

test("names the line the break sits on", () => {
  const { out } = run([], "A clean line.\n\nIt basically works.\n");
  strictEqual(out.includes(":3:"), true);
});

test("names the fix when nothing can be read at the path", () => {
  const { out, code } = run([join(tmpdir(), "voice-not-here", "gone.md")]);
  strictEqual(code, 1);
  strictEqual(out.includes("nothing could be read"), true);
  strictEqual(out.includes("Give a path"), true);
});
