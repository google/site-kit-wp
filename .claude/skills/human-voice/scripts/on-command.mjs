// @ts-check
// Reads the text inside a shell command before it runs, and refuses a commit message or a
// pull request description that breaks a rule. Neither of those is ever saved as a file, so
// nothing else reads them. The plugin is off until a project's settings file turns it on. So
// this hook runs only in a project that asked for the plugin, and Claude Code reads that line
// before any hook starts.

import { everyRule } from "../skills/writing-plainly/scripts/lib/text.mjs";

/** Each pattern pulls the prose out of one command. The second group is the text. */
const CARRIES_PROSE = [
  { what: "a commit message", pattern: /git\s+commit\b[^|;&]*?\s-{1,2}m(?:essage)?[= ]\s*(['"])([\s\S]*?)\1/ },
  { what: "a pull request description", pattern: /gh\s+pr\s+(?:create|edit)\b[^|;&]*?\s--body[= ]\s*(['"])([\s\S]*?)\1/ },
  { what: "a pull request comment", pattern: /gh\s+pr\s+comment\b[^|;&]*?\s--body[= ]\s*(['"])([\s\S]*?)\1/ }
];

/** Every heredoc in a command. Group 1 and group 3 are the rest of the line that opens it. */
const HEREDOC = /([^\n]*)<<\s*-?\s*'?"?(\w+)'?"?([^\n]*)\n([\s\S]*?)\n\2/g;

/** A redirect into a file this plugin reads as prose. */
const INTO_A_TEXT_FILE = />>?\s*\S*\.(?:md|markdown|txt)\b/;

/**
 * Pulls the prose out of every heredoc a command writes into a text file.
 *
 * A shell command writes a file too. `cat > note.md <<'EOF'` is a Bash call rather than a Write
 * call, so the hook on the writing tools never sees it.
 *
 * A heredoc that a program reads is code, and this hook says nothing about code. The test is the
 * line that opens each heredoc, never the whole command. One command can append to a markdown
 * file and pipe a second heredoc into python, and testing the whole command read that python as
 * prose and refused it.
 *
 * @param {string} command The whole shell command.
 * @returns {string[]} The body of each heredoc written into a text file.
 */
function proseHeredocs(command) {
  const found = [];
  for (const hit of command.matchAll(HEREDOC)) {
    if (INTO_A_TEXT_FILE.test(`${hit[1]} ${hit[3]}`)) found.push(hit[4]);
  }
  return found;
}

/**
 * Prints every error one text breaks, and says whether it broke any.
 *
 * @param {string} what The type of text, for the first line of the message.
 * @param {string} text The text to read.
 * @returns {boolean} True where the text breaks a rule.
 */
function report(what, text) {
  const errors = everyRule(text).filter((one) => one.severity === "error");
  if (errors.length === 0) return false;
  const lines = errors.map((one) => `line ${one.line}: ${one.rule}: ${one.message}`).join("\n");
  process.stderr.write(`${what} breaks a writing rule. Write it again with each one fixed, then run the command.\n\n${lines}\n`);
  return true;
}

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

const command = payload?.tool_input?.command;
if (typeof command !== "string") process.exit(0);

for (const { what, pattern } of CARRIES_PROSE) {
  const hit = command.match(pattern);
  if (hit && report(what, hit[2])) process.exit(2);
}

for (const body of proseHeredocs(command)) {
  if (report("a text written through the shell", body)) process.exit(2);
}

process.exit(0);
