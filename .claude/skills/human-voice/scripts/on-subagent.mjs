// @ts-check
// Reads the text a subagent hands back, and reports every rule it breaks. A subagent gets
// its own system prompt, so an output style never applies to one, and its report is text a
// person reads. It answers with JSON, as every hook on this event does. The plugin is off
// until a project's settings file turns it on. So this hook runs only in a project that
// asked for the plugin, and Claude Code reads that line before any hook starts.

import { everyRule } from "../skills/writing-plainly/scripts/lib/text.mjs";

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

/** Lets the subagent finish and writes nothing back. */
function letItEnd() {
  process.stdout.write("{}\n");
  process.exit(0);
}

let payload;
try {
  payload = JSON.parse(await fromStandardInput());
} catch {
  letItEnd();
}

// Claude Code sets this field on a turn this hook has already held open once. The hook reads
// it first, and that is what stops it holding the same turn open for ever.
if (payload.stop_hook_active) letItEnd();

const report = typeof payload.last_assistant_message === "string" ? payload.last_assistant_message : "";
if (report.trim() === "") letItEnd();

const errors = everyRule(report).filter((one) => one.severity === "error");
if (errors.length === 0) letItEnd();

const lines = errors.map((one) => `line ${one.line}: ${one.rule}: ${one.message}`).join("\n");
process.stdout.write(JSON.stringify({
  decision: "block",
  reason: `The report breaks a writing rule. Write it again with each one fixed.\n\n${lines}`
}) + "\n");
process.exit(0);
