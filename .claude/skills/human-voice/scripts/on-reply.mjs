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
// Reads the reply Claude has just finished writing, and reports every rule it breaks.
// This is the one route to the reply printed in the terminal, which no other check reads.
// It answers with JSON on standard output and never with an exit code, because a Stop
// hook reads a top level decision field. The plugin is off until a project's settings
// file turns it on. So this hook runs only in a project that asked for the plugin, and
// Claude Code reads that line before any hook starts.

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

/** Lets the turn end and writes nothing back. */
function letItEnd() {
  process.stdout.write("{}\n");
  process.exit(0);
}

let payload;
try {
  payload = JSON.parse(await fromStandardInput());
} catch {
  process.stderr.write("on-reply: the input was not JSON, so the turn was left alone.\n");
  letItEnd();
}

// Claude Code sets this field on a turn this hook has already held open once. The hook reads
// it first, and that is what stops it holding the same turn open for ever.
if (payload.stop_hook_active) letItEnd();

const reply = typeof payload.last_assistant_message === "string" ? payload.last_assistant_message : "";
if (reply.trim() === "") letItEnd();

const errors = everyRule(reply).filter((one) => one.severity === "error");
if (errors.length === 0) letItEnd();

const lines = errors.map((one) => `line ${one.line}: ${one.rule}: ${one.message}`).join("\n");
process.stdout.write(JSON.stringify({
  decision: "block",
  reason: `The reply breaks a writing rule. Write the reply again with each one fixed.\n\n${lines}`
}) + "\n");
process.exit(0);
