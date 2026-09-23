// @ts-check
// Tests for the file hook script. Each test runs the script as a process, because the exit
// code is what decides whether the reason reaches the conversation. A test that needs a
// file writes it into a temporary folder it made itself.

import { test } from "node:test";
import { strictEqual, deepStrictEqual } from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "on-write.mjs");

/**
 * Hands one payload to the hook and gives back what it wrote.
 *
 * @param {string} path The file the tool wrote.
 * @param {string} cwd The project the hook runs in.
 * @param {string} tool The tool that fired the hook, which is Write unless the test says otherwise.
 * @returns {{ err: string, code: number }} Standard error and the exit code.
 */
function run(path, cwd = dirname(path), tool = "Write") {
  const input = JSON.stringify({ cwd, tool_name: tool, tool_input: { file_path: path } });
  try {
    execFileSync("node", [SCRIPT], { input, encoding: "utf8" });
    return { err: "", code: 0 };
  } catch (error) {
    return { err: `${error.stderr ?? ""}`, code: error.status };
  }
}

/**
 * Writes one file into a project of its own and hands its path and the project to the test.
 *
 * @param {string} name What to call the file, with a folder in front where the test needs one.
 * @param {string | Buffer} text What to put in it.
 * @param {(path: string, project: string) => void} body The test.
 */
function withFile(name, text, body) {
  const folder = mkdtempSync(join(tmpdir(), "voice-"));
  try {
    const path = join(folder, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
    body(path, folder);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
}

test("blocks with exit 2 when a markdown file breaks a rule", () => {
  withFile("note.md", "It basically works.\n", (path) => {
    const { err, code } = run(path);
    strictEqual(code, 2);
    strictEqual(err.includes("empty-adverb"), true);
  });
});

test("names the file and the line in the reason", () => {
  withFile("note.md", "A clean line.\n\nIt basically works.\n", (path) => {
    strictEqual(run(path).err.includes(`${path}:3:`), true);
  });
});

test("lets a clean markdown file through", () => {
  withFile("note.md", "The check prints a report.\n", (path) => {
    strictEqual(run(path).code, 0);
  });
});

test("lets a code file with no comment and no long string through", () => {
  withFile("code.js", "const a = 1; const b = 2;\n", (path) => {
    strictEqual(run(path).code, 0);
  });
});

test("blocks with exit 2 when a comment in a code file breaks a rule", () => {
  withFile("code.mjs", "// It basically works.\nconst a = 1;\n", (path) => {
    const { err, code } = run(path);
    strictEqual(code, 2);
    strictEqual(err.includes(`${path}:1: empty-adverb`), true);
  });
});

test("lets a code file through whose strings are one word each", () => {
  withFile("code.mjs", "const a = \"basically\";\nconst b = 'utilize';\nconst c = `really`;\n", (path) => {
    strictEqual(run(path).code, 0);
  });
});

test("does not report a comment on two lines in a code file as a broken paragraph", () => {
  withFile("code.mjs", "// A comment that runs on\n// to a second line.\nconst a = 1;\n", (path) => {
    strictEqual(run(path).code, 0);
  });
});

test("reads nothing in a test file, which has the text it tests inside it", () => {
  withFile("code-test.mjs", "// It basically works.\n", (path) => {
    strictEqual(run(path).code, 0);
  });
});

test("reads nothing in a file that is not text", () => {
  withFile("utilize.bin", Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x0a]), (path) => {
    strictEqual(run(path).code, 0);
  });
});

test("blocks with exit 2 when the name of the file has a refused word", () => {
  withFile("utilize-cache.md", "The check prints a report.\n", (path) => {
    const { err, code } = run(path);
    strictEqual(code, 2);
    strictEqual(err.includes(`${path}:0: refused-name: Rename the file "utilize-cache.md" with "use"`), true);
  });
});

test("lets an edit through when the name of the file has a refused word, because the edit cannot rename it", () => {
  withFile("utilize-cache.md", "The check prints a report.\n", (path, project) => {
    strictEqual(run(path, project, "Edit").code, 0);
    strictEqual(run(path, project, "MultiEdit").code, 0);
  });
});

test("still blocks an edit whose text breaks a rule, and names the rule alone", () => {
  withFile("utilize-cache.md", "It basically works.\n", (path, project) => {
    const { err, code } = run(path, project, "Edit");
    strictEqual(code, 2);
    strictEqual(err.includes("empty-adverb"), true);
    strictEqual(err.includes("refused-name"), false);
  });
});

test("lets a file through whose folder has a refused word, because a warning never blocks", () => {
  withFile(join("utilize-things", "note.md"), "The check prints a report.\n", (path, project) => {
    strictEqual(run(path, project).code, 0);
  });
});

test("refuses a path with two dots in it", () => {
  strictEqual(run("../somewhere/else.md").code, 0);
});

test("lets a path that is not there through", () => {
  strictEqual(run(join(tmpdir(), "voice-not-here", "gone.md")).code, 0);
});

test("reads a file in a folder with no marker file", () => {
  const folder = mkdtempSync(join(tmpdir(), "voice-"));
  try {
    const path = join(folder, "note.md");
    writeFileSync(path, "It basically works.\n");
    deepStrictEqual(readdirSync(folder), ["note.md"]);
    const { err, code } = run(path, folder);
    strictEqual(code, 2);
    strictEqual(err.includes("empty-adverb"), true);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
