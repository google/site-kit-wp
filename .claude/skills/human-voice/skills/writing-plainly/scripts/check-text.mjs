// @ts-check
// Reads one text and prints a finding for each rule it breaks. It takes a file path, or the text
// itself on standard input, so it reads a saved file and a commit message with the same code.
// Given a path, it opens a file of any type. Inside a code file it reads a comment and a string a
// person sees, and nothing else. It reads the name of the file, and the name of every folder on
// its path, against the refused words too. It exits 1 when it found an error and 0 otherwise.

import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { everyRule } from "./lib/text.mjs";
import { whatAPersonReads } from "./lib/code.mjs";
import { refusedName } from "./lib/names.mjs";

/** The types of prose file, whose lines the window breaks on its own. In any other file the editor breaks a line at its column, so the `broken-paragraph` rule is not read there. */
const PROSE = new Set([".md", ".markdown", ".txt"]);

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

const named = process.argv[2];

if (named && named.includes("..")) {
  process.stderr.write("check-text: a path with .. in it is refused. Give a path with no .. in it, or pipe the text in.\n");
  process.exit(1);
}

let text;
try {
  if (named) {
    const bytes = readFileSync(named);
    if (bytes.subarray(0, FIRST_BYTES).includes(0)) {
      process.stdout.write(`check-text: ${named} is not a text file, so nothing was read.\n`);
      process.exit(0);
    }
    text = whatAPersonReads(bytes.toString("utf8"), extname(named).toLowerCase());
  } else {
    text = await fromStandardInput();
  }
} catch {
  process.stderr.write(`check-text: nothing could be read at ${named}. Give a path to a file that is there, or pipe the text in.\n`);
  process.exit(1);
}

const where = named ?? "standard input";
const prose = !named || PROSE.has(extname(named).toLowerCase());
const found = named ? refusedName(named) : [];
found.push(...everyRule(text).filter((one) => prose || one.rule !== "broken-paragraph"));
const errors = found.filter((one) => one.severity === "error");

for (const one of found) {
  process.stdout.write(`${where}:${one.line}: ${one.severity}: ${one.rule}: ${one.message}\n`);
}

if (found.length === 0) {
  process.stdout.write(`check-text: ${where} breaks no rule this check reads.\n`);
}

process.exit(errors.length > 0 ? 1 : 0);
