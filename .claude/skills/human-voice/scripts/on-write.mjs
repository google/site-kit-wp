// @ts-check
// Reads a file Claude has just saved and reports every writing rule it breaks. The plugin is off
// until a project's settings file turns it on. So this hook runs only in a project that asked for
// the plugin, and Claude Code reads that line before any hook starts. It opens a file of any
// type. Inside a code file it reads a comment and a string a person sees, and nothing else. It
// reads the name of the file, and the name of every folder on its path, against the refused
// words too. A refused word in the name of a file being edited is a warning, because an edit
// cannot rename the file. It blocks with exit 2, which puts the reason back into the conversation.

import { existsSync, readFileSync } from "node:fs";
import { basename, extname, relative } from "node:path";
import { everyRule } from "../skills/writing-plainly/scripts/lib/text.mjs";
import { whatAPersonReads } from "../skills/writing-plainly/scripts/lib/code.mjs";
import { refusedName } from "../skills/writing-plainly/scripts/lib/names.mjs";

/** The types of prose file, whose lines the window breaks on its own. In any other file the editor breaks a line at its column, so the `broken-paragraph` rule is not read there. */
const PROSE = new Set([".md", ".markdown", ".txt"]);

/** A test file has the text it tests inside it, so the hook reads none. The name says which file is one. */
const TEST_FILE = /(?:-test\.mjs|\.test\.(?:js|ts|mjs)|\.spec\.(?:js|ts)|_test\.py)$|^test_/;

/** How many bytes at the start of a file are read for a zero byte, which says the file is not text. */
const FIRST_BYTES = 8192;

/**
 * Reads everything waiting on standard input.
 *
 * @returns {Promise<string>} The text.
 */
async function fromStandardInput() {
  const parts = [];
  for await (const part of process.stdin) parts.push(part);
  return Buffer.concat(parts).toString("utf8");
}

let payload;
try {
  payload = JSON.parse(await fromStandardInput());
} catch {
  process.exit(0);
}

// The name check reads the path of the file as written from the project, and not from the root
// of the disk.
const project = typeof payload?.cwd === "string" ? payload.cwd : process.cwd();

const path = payload?.tool_input?.file_path;

// Claude picked the name of a file it writes, and can change it, so a refused word there is an
// error. An edit cannot rename the file, so the same word is a warning. An edit is any tool but
// Write, because the hook fires on every tool that changes a file.
const edit = payload?.tool_name !== "Write";

// The check that this file is one to read. A path that leads out of the project, a path that is
// not there, a test file and a file that is not text all end the hook before it reads anything.
if (typeof path !== "string" || path.includes("..")) process.exit(0);
if (!existsSync(path)) process.exit(0);
if (TEST_FILE.test(basename(path))) process.exit(0);

let bytes;
try {
  bytes = readFileSync(path);
} catch {
  process.exit(0);
}
if (bytes.subarray(0, FIRST_BYTES).includes(0)) process.exit(0);

const extension = extname(path).toLowerCase();
const found = everyRule(whatAPersonReads(bytes.toString("utf8"), extension)).filter((one) => PROSE.has(extension) || one.rule !== "broken-paragraph");
found.push(...refusedName(relative(project, path)).map((one) => (edit ? { ...one, severity: "warning" } : one)));

const errors = found.filter((one) => one.severity === "error");
if (errors.length === 0) process.exit(0);

const lines = errors.map((one) => `${path}:${one.line}: ${one.rule}: ${one.message}`).join("\n");
process.stderr.write(`The file breaks a writing rule. Fix each one before moving on.\n\n${lines}\n`);
process.exit(2);
